/**
 * One audio deck: an `<audio>` element plus, when the track has an HLS
 * package, the hls.js engine feeding it.
 *
 * Crossfade needs two tracks audible at once, so the player owns two of these
 * rather than one shared element. Everything that differs between "a plain
 * file" and "an adaptive stream" is settled in here, which is what lets the
 * engine above treat both the same way.
 */

import type Hls from "hls.js";
import type { ErrorData, Level, ManifestParsedData } from "hls.js";

/** Auto is not a level index; hls.js spells it `-1`. */
export const AUTO_LEVEL = -1;

export interface DeckSource {
  trackId: string;
  /** Master playlist. Null when the track has no package (yet, or ever). */
  hlsUrl: string | null;
  /** The original upload — always present, and always the fallback. */
  progressiveUrl: string;
}

export interface QualityLevel {
  /** hls.js level index, which is what `hls.currentLevel` expects. */
  index: number;
  /** `NAME` from the master playlist, e.g. "320 kbps". */
  label: string;
  bitrateKbps: number;
}

export interface DeckEvents {
  onTime(deck: Deck): void;
  onEnded(deck: Deck): void;
  onLevels(deck: Deck, levels: QualityLevel[]): void;
  onError(deck: Deck, message: string): void;
}

/**
 * hls.js is ~200 KB and the player mounts on every page, so it is fetched the
 * first time a track actually has a package — not as part of the app bundle.
 * The promise is cached, so the second track does not pay for it again.
 */
let hlsModule: Promise<typeof import("hls.js")> | null = null;
function loadHlsModule() {
  hlsModule ??= import("hls.js");
  return hlsModule;
}

export class Deck {
  readonly element: HTMLAudioElement;

  private hls: Hls | null = null;
  private source: DeckSource | null = null;

  /**
   * The levels this deck last reported.
   *
   * Kept so the engine can ask after the fact: during a crossfade the incoming
   * deck parses its manifest while it is still the idle one, and without this
   * the quality menu would have nothing to show when it becomes active.
   */
  private levels: QualityLevel[] = [];

  /** Master volume, 0–1, shared by both decks. */
  private volume = 1;
  /** Crossfade envelope, 0–1. Multiplied into the volume above. */
  private envelope = 1;

  /**
   * Bumped on every `load`. An async import that resolves after the listener
   * has skipped on belongs to a track nobody is waiting for, and attaching it
   * would hijack the deck.
   */
  private loadToken = 0;

  constructor(private readonly events: DeckEvents) {
    this.element = new Audio();
    this.element.preload = "auto";
    this.element.addEventListener("timeupdate", this.handleTime);
    this.element.addEventListener("loadedmetadata", this.handleTime);
    this.element.addEventListener("ended", this.handleEnded);
    this.element.addEventListener("error", this.handleElementError);
  }

  // -- identity ----------------------------------------------------------

  get trackId(): string | null {
    return this.source?.trackId ?? null;
  }

  get currentTime(): number {
    return this.element.currentTime;
  }

  get duration(): number {
    // `duration` is NaN until metadata arrives, and Infinity for a live
    // stream. Callers do arithmetic on this, so neither may escape.
    const value = this.element.duration;
    return Number.isFinite(value) ? value : 0;
  }

  /** Seconds left, or `Infinity` while the length is still unknown. */
  get remaining(): number {
    return this.duration ? this.duration - this.element.currentTime : Infinity;
  }

  get isPlaying(): boolean {
    return !this.element.paused && !this.element.ended;
  }

  get qualityLevels(): QualityLevel[] {
    return this.levels;
  }

  // -- loading -----------------------------------------------------------

  async load(source: DeckSource): Promise<void> {
    const token = ++this.loadToken;
    this.detachHls();
    this.source = source;

    if (source.hlsUrl) {
      const attached = await this.attachHls(source.hlsUrl, token);
      if (attached || token !== this.loadToken) return;
      // hls.js unsupported and no native HLS: fall through to the upload.
    }

    if (token !== this.loadToken) return;
    this.element.src = source.progressiveUrl;
    this.element.load();
    this.emitLevels([]);
  }

  /**
   * Wire hls.js (or the browser's own HLS support) to the element.
   *
   * Returns false when neither is available, which is the caller's cue to use
   * the progressive file instead.
   */
  private async attachHls(url: string, token: number): Promise<boolean> {
    const { default: HlsCtor } = await loadHlsModule();
    if (token !== this.loadToken) return true; // superseded; stop quietly

    if (HlsCtor.isSupported()) {
      const hls = new HlsCtor({
        // Enough buffer to ride out a hiccup, not so much that switching
        // quality takes half a minute to become audible: everything already
        // downloaded at the old level plays before the new one starts.
        maxBufferLength: 30,
        // The listener's own choice must win, so hls.js may only adapt while
        // the menu is on "Auto" (it sets `currentLevel` back to -1).
        capLevelToPlayerSize: false,
        enableWorker: true,
      });

      hls.on(HlsCtor.Events.MANIFEST_PARSED, (_event, data: ManifestParsedData) => {
        this.emitLevels(toQualityLevels(data.levels));
      });

      hls.on(HlsCtor.Events.ERROR, (_event, data: ErrorData) => {
        if (!data.fatal) return;
        // hls.js can recover from a stalled network or a bad media append;
        // anything else means this package is not playable and the deck should
        // go back to the original file.
        if (data.type === HlsCtor.ErrorTypes.NETWORK_ERROR) {
          hls.startLoad();
        } else if (data.type === HlsCtor.ErrorTypes.MEDIA_ERROR) {
          hls.recoverMediaError();
        } else {
          this.fallBackToProgressive(`hls: ${data.details}`);
        }
      });

      hls.loadSource(url);
      hls.attachMedia(this.element);
      this.hls = hls;
      return true;
    }

    // Safari plays HLS natively. No level API comes with it, so the menu
    // shows "Auto" only and the browser does the adapting.
    if (this.element.canPlayType("application/vnd.apple.mpegurl")) {
      this.element.src = url;
      this.element.load();
      this.emitLevels([]);
      return true;
    }

    return false;
  }

  private fallBackToProgressive(reason: string) {
    const source = this.source;
    if (!source) return;

    this.detachHls();
    this.events.onError(this, reason);
    this.emitLevels([]);

    const resumeAt = this.element.currentTime;
    const wasPlaying = this.isPlaying;
    this.element.src = source.progressiveUrl;
    this.element.load();
    // Put the listener back where they were rather than restarting the track.
    this.element.currentTime = resumeAt;
    if (wasPlaying) void this.play();
  }

  // -- transport ---------------------------------------------------------

  async play(): Promise<void> {
    try {
      await this.element.play();
    } catch {
      // Autoplay policy, or a load that was superseded mid-play. Neither is
      // actionable here: the store still holds `isPlaying`, and the next user
      // gesture will start it.
    }
  }

  pause(): void {
    this.element.pause();
  }

  /** Stop and release, without tearing the deck itself down. */
  stop(): void {
    this.pause();
    this.detachHls();
    this.element.removeAttribute("src");
    this.element.load();
    this.source = null;
    this.setEnvelope(1);
  }

  seek(seconds: number): void {
    this.element.currentTime = seconds;
  }

  // -- gain --------------------------------------------------------------

  setVolume(volume: number): void {
    this.volume = volume;
    this.applyGain();
  }

  /**
   * The crossfade envelope for this deck, 0–1.
   *
   * Applied through `element.volume` rather than a Web Audio gain node: it
   * needs no `AudioContext` to resume, and no CORS-enabled media element (a
   * cross-origin element without headers feeds a `MediaElementSource`
   * silence). The one cost is iOS Safari, which ignores `volume` on a media
   * element, so a fade there is a hard cut.
   */
  setEnvelope(envelope: number): void {
    this.envelope = clamp01(envelope);
    this.applyGain();
  }

  private applyGain(): void {
    this.element.volume = clamp01(this.volume * this.envelope);
  }

  // -- quality -----------------------------------------------------------

  /** `AUTO_LEVEL` hands the choice back to hls.js's bandwidth estimate. */
  setLevel(index: number): void {
    if (!this.hls) return;
    this.hls.currentLevel = index;
  }

  get currentLevel(): number {
    return this.hls?.currentLevel ?? AUTO_LEVEL;
  }

  get supportsLevels(): boolean {
    return this.hls !== null;
  }

  // -- teardown ----------------------------------------------------------

  private detachHls(): void {
    this.hls?.destroy();
    this.hls = null;
  }

  destroy(): void {
    this.element.removeEventListener("timeupdate", this.handleTime);
    this.element.removeEventListener("loadedmetadata", this.handleTime);
    this.element.removeEventListener("ended", this.handleEnded);
    this.element.removeEventListener("error", this.handleElementError);
    this.stop();
  }

  // -- element events ----------------------------------------------------

  /** Single exit for level changes, so `levels` cannot fall out of step. */
  private emitLevels(levels: QualityLevel[]): void {
    this.levels = levels;
    this.events.onLevels(this, levels);
  }

  private handleTime = () => this.events.onTime(this);
  private handleEnded = () => this.events.onEnded(this);

  private handleElementError = () => {
    const code = this.element.error?.code;
    // An error on the progressive source is terminal; on an HLS source the
    // hls.js handler above has already had its go at recovering.
    this.events.onError(this, `audio element error ${code ?? "unknown"}`);
  };
}

/**
 * hls.js levels, in the shape the quality menu renders.
 *
 * `name` is the `NAME` attribute the backend writes into the master playlist,
 * so the menu can say "320 kbps" instead of deriving a number the listener
 * then has to interpret.
 */
export function toQualityLevels(levels: Level[]): QualityLevel[] {
  return levels
    .map((level, index) => ({
      index,
      bitrateKbps: Math.round(level.bitrate / 1000),
      label: level.name || `${Math.round(level.bitrate / 1000)} kbps`,
    }))
    .sort((a, b) => a.bitrateKbps - b.bitrateKbps);
}

function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}
