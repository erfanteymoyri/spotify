import { formatNumber } from "@/lib/format";

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  total: number;
  centerLabel?: string;
}

const RADIUS = 60;
const STROKE = 22;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function DonutChart({ segments, total, centerLabel }: DonutChartProps) {
  const safeTotal = total > 0 ? total : 1;

  const arcs = segments.reduce<
    { label: string; color: string; dash: number; offset: number }[]
  >((acc, segment) => {
    const dash = (segment.value / safeTotal) * CIRCUMFERENCE;
    const offset = acc.reduce((sum, arc) => sum + arc.dash, 0);
    acc.push({ label: segment.label, color: segment.color, dash, offset });
    return acc;
  }, []);

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
      <svg viewBox="0 0 160 160" className="size-40 shrink-0 -rotate-90">
        <circle
          cx="80"
          cy="80"
          r={RADIUS}
          fill="none"
          stroke="var(--muted)"
          strokeWidth={STROKE}
        />
        {arcs.map((arc) => (
          <circle
            key={arc.label}
            cx="80"
            cy="80"
            r={RADIUS}
            fill="none"
            stroke={arc.color}
            strokeWidth={STROKE}
            strokeDasharray={`${arc.dash} ${CIRCUMFERENCE - arc.dash}`}
            strokeDashoffset={-arc.offset}
          />
        ))}
      </svg>

      <ul className="flex-1 space-y-2">
        {segments.map((segment) => (
          <li
            key={segment.label}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <span className="flex items-center gap-2">
              <span
                className="size-3 shrink-0 rounded-full"
                style={{ backgroundColor: segment.color }}
              />
              {segment.label}
            </span>
            <span className="font-medium tabular-nums">
              {formatNumber(segment.value)}
              {centerLabel ? ` ${centerLabel}` : ""}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
