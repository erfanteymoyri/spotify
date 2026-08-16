/**
 * The playback engine: two decks and the rules for handing over between them.
 *
 * A single `<audio>` element cannot crossfade, because a crossfade means two
 * tracks are audible at once. So there are two decks and one of them is
 * "active"; a handover starts N seconds before the active deck ends, runs both
 * for those N seconds, and finishes by swapping which deck is active.
 *
 * Everything here is plain TypeScript with no React in sight. The engine
 * announces what happened through callbacks and never touches the store
 * itself, which is what makes the handover logic testable without a DOM
 * timeline or a rendered component.
 */

import { AUTO_LEVEL, Deck, type DeckSource, type QualityLevel } from "./deck";

export interface EngineTrack {
  id: string;
  hlsUrl: string | null;
  progressiveUrl: string;
}

export interface CrossfadeConfig {
  enabled: boolean;
  /** Overlap in seconds. The product default is 5. */
  seconds: number;
}

export interface EngineCallbacks {
  /** Position of whichever track the listener is currently hearing most of. */
  onProgress(currentTime: number, duration: number): void;
  /** Levels of the *active* deck, for the quality menu. Empty = no menu. */
  onLevels(levels: QualityLevel[]): void;
  /** A track stopped being audible. Fires once per play, for stream logging. */
  onTrackCompleted(trackId: string, playedSeconds: number): void;
  /** A track ended with no crossfade in flight -- the queue should advance. */
  onEnded(trackId: string): void;
  /** A crossfade finished: this track is now the one playing. */
  onAdvanced(trackId: string): void;
  onError(message: string): void;
  /**
   * The track that would come next, consulted once when a crossfade starts.
   *
   * A callback rather than a value because the queue can change while a track
   * plays, and because with shuffle on, "the next track" is a decision -- one
   * that must be made once and then honoured, not re-rolled at handover.
   */
  peekNext(): EngineTrack | null;
}

interface Handover {
  /** The track loaded onto the incoming deck. */
  track: EngineTrack;
  /** Guards against starting a second handover while the first is loading. */
  loading: boolean;
}

/**
 * A track shorter than this multiple of the crossfade window is played
 * straight through: blending five seconds of a six-second interlude would mean
 * the listener never really hears it.
 */
const MIN_TRACK_LENGTH_FACTOR = 1.5;

export class PlaybackEngine {
  private readonly decks: [Deck, Deck];
  private activeIndex: 0 | 1 = 0;

  private handover: Handover | null = null;
  private crossfade: CrossfadeConfig = { enabled: false, seconds: 5 };

  private volume = 1;
  private wantsToPlay = false;

  /**
   * The listener's quality choice, remembered across track changes: a new
   * track loads a new manifest, and without this the menu would silently snap
   * back to Auto every time the queue advanced.
   */
  private desiredLevel = AUTO_LEVEL;

  constructor(private readonly callbacks: EngineCallbacks) {
    const events = {
      onTime: (deck: Deck) => this.handleTime(deck),
      onEnded: (deck: Deck) => this.handleEnded(deck),
      onLevels: (deck: Deck, levels: QualityLevel[]) => this.handleLevels(deck, levels),
      onError: (_deck: Deck, message: string) => this.callbacks.onError(message),
    };
    this.decks = [new Deck(events), new Deck(events)];
  }

  // -- deck access -------------------------------------------------------

  private get active(): Deck {
    return this.decks[this.activeIndex];
  }

  private get idle(): Deck {
    return this.decks[this.activeIndex === 0 ? 1 : 0];
  }

  get levels(): QualityLevel[] {
    return this.activeLevels;
  }

  private activeLevels: QualityLevel[] = [];

  // -- transport ---------------------------------------------------------

  /**
   * Put `track` on the active deck.
   *
   * A track the active deck is already holding is left alone. That is not just
   * an optimisation: it is how a completed crossfade stays silent. The store's
   * current track becomes the incoming one, this method is called with it, and
   * the deck already playing it must not be reloaded from the top.
   */
  setTrack(track: EngineTrack | null): void {
    if (track && this.active.trackId === track.id) return;

    this.abortHandover();

    if (!track) {
      this.active.stop();
      this.wantsToPlay = false;
      this.handleLevels(this.active, []);
      return;
    }

    this.active.setEnvelope(1);
    this.active.setVolume(this.volume);
    void this.active.load(toSource(track)).then(() => {
      if (this.wantsToPlay) void this.active.play();
    });
  }

  play(): void {
    this.wantsToPlay = true;
    void this.active.play();
    if (this.handover) void this.idle.play();
  }

  pause(): void {
    this.wantsToPlay = false;
    this.active.pause();
    this.idle.pause();
  }

  seek(seconds: number): void {
    // Seeking rewrites what "the end of this track" means, so any handover
    // already under way is no longer about the right moment.
    this.abortHandover();
    this.active.seek(seconds);
  }

  setVolume(volume: number): void {
    this.volume = volume;
    for (const deck of this.decks) deck.setVolume(volume);
  }

  setCrossfade(config: CrossfadeConfig): void {
    this.crossfade = config;
    // Switching it off mid-blend has to be honoured immediately, or the
    // listener hears the fade they just cancelled.
    if (!config.enabled) this.abortHandover();
  }

  // -- quality -----------------------------------------------------------

  setQuality(levelIndex: number): void {
    this.desiredLevel = levelIndex;
    for (const deck of this.decks) deck.setLevel(levelIndex);
  }

  get quality(): number {
    return this.active.supportsLevels ? this.active.currentLevel : AUTO_LEVEL;
  }

  destroy(): void {
    for (const deck of this.decks) deck.destroy();
  }

  // -- the tick ----------------------------------------------------------

  /**
   * Driven by the element's own `timeupdate` (~4 Hz while playing) rather than
   * by a timer of our own. It stops when playback stops, needs no cleanup, and
   * -- unlike `requestAnimationFrame` -- keeps firing in a background tab,
   * where a frame-driven fade would freeze half-done with both decks audible.
   */
  private handleTime(deck: Deck): void {
    if (deck !== this.active) return;

    this.callbacks.onProgress(deck.currentTime, deck.duration);

    if (this.handover) {
      this.applyFade();
    } else if (this.shouldStartHandover()) {
      void this.startHandover();
    }
  }

  private handleEnded(deck: Deck): void {
    if (this.handover && deck === this.active) {
      // The outgoing track ran out during the blend: finish the handover
      // rather than treating this as the end of playback.
      this.completeHandover();
      return;
    }
    if (deck !== this.active) return;

    const trackId = deck.trackId;
    if (trackId) {
      this.callbacks.onTrackCompleted(trackId, deck.duration);
      this.callbacks.onEnded(trackId);
    }
  }

  private handleLevels(deck: Deck, levels: QualityLevel[]): void {
    // Re-apply the listener's choice to whichever deck just parsed a manifest,
    // including the incoming one, so a crossfade cannot change quality
    // half-way through.
    deck.setLevel(this.desiredLevel);

    if (deck !== this.active) return;
    this.activeLevels = levels;
    this.callbacks.onLevels(levels);
  }

  // -- crossfade ---------------------------------------------------------

  private shouldStartHandover(): boolean {
    const { enabled, seconds } = this.crossfade;
    if (!enabled || seconds <= 0) return false;

    const deck = this.active;
    if (!deck.isPlaying) return false;

    const { duration, remaining } = deck;
    // `remaining` is Infinity until metadata lands, which keeps this false.
    if (duration <= seconds * MIN_TRACK_LENGTH_FACTOR) return false;
    if (remaining > seconds) return false;
    // Already essentially over: let `ended` handle it, so the incoming track
    // is not started for a fade there is no time left to perform.
    if (remaining <= 0.15) return false;

    return true;
  }

  private async startHandover(): Promise<void> {
    const next = this.callbacks.peekNext();
    if (!next || next.id === this.active.trackId) return;

    this.handover = { track: next, loading: true };

    const incoming = this.idle;
    incoming.stop();
    incoming.setEnvelope(0);
    incoming.setVolume(this.volume);
    await incoming.load(toSource(next));

    // The listener may have skipped, paused or seeked while that resolved.
    if (!this.handover || this.handover.track.id !== next.id) return;
    this.handover.loading = false;

    if (this.wantsToPlay) await incoming.play();
    this.applyFade();
  }

  /**
   * Move both decks to where they should be for the current moment.
   *
   * Position is read from the outgoing deck rather than from a clock we start
   * ourselves, so a throttled tab, a slow load or a dropped tick can never
   * leave the two gains out of step -- each tick recomputes the whole envelope
   * from the one thing that is authoritative, how much of the track is left.
   *
   * The curve is equal-power (cos/sin) rather than linear. Two uncorrelated
   * signals sum in power, not amplitude, so a linear pair dips audibly in the
   * middle where both sit at 0.5; `cos² + sin² = 1` holds the loudness flat.
   */
  private applyFade(): void {
    if (!this.handover) return;

    const progress = fadeProgress(this.active.remaining, this.crossfade.seconds);
    const { outgoing, incoming } = equalPowerGains(progress);

    this.active.setEnvelope(outgoing);
    if (!this.handover.loading) this.idle.setEnvelope(incoming);

    if (progress >= 1) this.completeHandover();
  }

  private completeHandover(): void {
    const handover = this.handover;
    if (!handover) return;
    this.handover = null;

    const outgoing = this.active;
    const finishedId = outgoing.trackId;
    const playedSeconds = outgoing.duration;

    outgoing.stop(); // also restores its envelope to 1 for its next use
    this.activeIndex = this.activeIndex === 0 ? 1 : 0;
    this.active.setEnvelope(1);

    if (finishedId) this.callbacks.onTrackCompleted(finishedId, playedSeconds);
    // The store now points at the track this deck is already playing, so the
    // `setTrack` that follows recognises it and leaves the deck running.
    this.callbacks.onAdvanced(handover.track.id);

    // Last, because advancing clears the store's ladder: this deck parsed its
    // manifest back when it was the idle one, so nothing else will re-announce
    // the levels and the quality menu would stay empty until the next track.
    this.activeLevels = this.active.qualityLevels;
    this.callbacks.onLevels(this.activeLevels);
  }

  /** Undo a handover in flight, leaving the active deck untouched. */
  private abortHandover(): void {
    if (!this.handover) return;
    this.handover = null;
    this.idle.stop();
    this.active.setEnvelope(1);
  }
}

// ---------------------------------------------------------------------------
// Pure helpers -- exported for the unit tests, which is most of why the fade
// math lives outside the class at all.
// ---------------------------------------------------------------------------

/** How far through the blend we are, 0 at the start and 1 at the handover. */
export function fadeProgress(remaining: number, seconds: number): number {
  if (seconds <= 0) return 1;
  if (!Number.isFinite(remaining)) return 0;
  return clamp01(1 - remaining / seconds);
}

/** Equal-power pair: `outgoing² + incoming² === 1` at every point. */
export function equalPowerGains(progress: number): {
  outgoing: number;
  incoming: number;
} {
  const angle = clamp01(progress) * (Math.PI / 2);
  return { outgoing: Math.cos(angle), incoming: Math.sin(angle) };
}

function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function toSource(track: EngineTrack): DeckSource {
  return {
    trackId: track.id,
    hlsUrl: track.hlsUrl,
    progressiveUrl: track.progressiveUrl,
  };
}
