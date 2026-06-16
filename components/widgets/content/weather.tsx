import type React from 'react';
import type { WidgetContentProps } from '@/components/widgets/WidgetSkeleton';
import { Sun, CloudSun, Cloud, CloudRain } from 'lucide-react';
import { cell, fcell, SCALE } from './scale';
import { Header } from './_shared';

const ACCENT = '#38bdf8';

const STATS = {
  city: 'San Francisco',
  temp: '72°',
  condition: 'Sunny',
  feels: 70,
  high: 78,
  low: 62,
  wind: '8mph',
  uv: 5,
};

type Cond = 'sun' | 'partly' | 'cloud' | 'rain';

const FORECAST: { label: string; cond: Cond; hl: string }[] = [
  { label: 'Thu', cond: 'sun', hl: '79°/63°' },
  { label: 'Fri', cond: 'partly', hl: '74°/60°' },
  { label: 'Sat', cond: 'cloud', hl: '68°/58°' },
  { label: 'Sun', cond: 'rain', hl: '64°/56°' },
  { label: 'Mon', cond: 'sun', hl: '71°/59°' },
];

function CondIcon({ cond, size, color = ACCENT }: { cond: Cond; size: number; color?: string }) {
  const style: React.CSSProperties = { width: cell(size), height: cell(size), color };
  if (cond === 'partly') return <CloudSun style={style} />;
  if (cond === 'cloud') return <Cloud style={style} />;
  if (cond === 'rain') return <CloudRain style={style} />;
  return <Sun style={style} />;
}

const root: React.CSSProperties = {
  position: 'absolute', inset: 0, padding: cell(SCALE.pad),
  display: 'flex', flexDirection: 'column', color: 'var(--text)', overflow: 'hidden',
};
const g3: React.CSSProperties = { display: 'grid', gridTemplateRows: 'auto 1fr auto', gap: cell(SCALE.gap), height: '100%' };
const label: React.CSSProperties = { fontSize: cell(SCALE.fontLabel), textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted)' };
const detail: React.CSSProperties = { fontSize: cell(SCALE.fontDetail), color: 'var(--muted)' };

function Forecast({ days, iconSize }: { days: typeof FORECAST; iconSize: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${days.length},1fr)`, gap: cell(0.04),
      borderTop: '1px solid var(--border-hairline)', paddingTop: cell(0.05) }}>
      {days.map((d) => (
        <div key={d.label} style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: cell(0.02) }}>
          <div style={detail}>{d.label}</div>
          <CondIcon cond={d.cond} size={iconSize} />
          <div style={{ fontSize: cell(SCALE.fontDetail) }}>{d.hl}</div>
        </div>
      ))}
    </div>
  );
}

export function Weather({ w, h }: WidgetContentProps) {
  // 1×1
  if (w === 1 && h === 1) {
    return (
      <div style={root}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <CondIcon cond="sun" size={0.22} />
          <div style={label}>SF</div>
        </div>
        <div style={{ marginTop: 'auto', textAlign: 'right' }}>
          <div style={{ fontSize: fcell(0.32), fontWeight: 800, letterSpacing: '-0.01em', lineHeight: 1 }}>{STATS.temp}</div>
          <div style={detail}>{STATS.condition}</div>
        </div>
      </div>
    );
  }

  // 2×1
  if (w === 2 && h === 1) {
    return (
      <div style={{ ...root, flexDirection: 'row', alignItems: 'center', gap: cell(0.08) }}>
        <CondIcon cond="sun" size={0.28} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: cell(SCALE.fontValue), fontWeight: 700, lineHeight: 1 }}>{STATS.temp}</div>
          <div style={detail}>H:{STATS.high}° L:{STATS.low}°</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: cell(SCALE.fontTitle), fontWeight: 500, lineHeight: 1.1 }}>{STATS.city}</div>
          <div style={detail}>Feels {STATS.feels}°</div>
        </div>
      </div>
    );
  }

  // 2×2
  if (w === 2 && h === 2) {
    return (
      <div style={{ ...root, ...g3 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={label}>{STATS.city}</div>
          <CondIcon cond="sun" size={0.2} />
        </div>
        <div style={{ alignSelf: 'center' }}>
          <div style={{ fontSize: fcell(0.4), fontWeight: 800, letterSpacing: '-0.01em', lineHeight: 1 }}>{STATS.temp}</div>
          <div style={detail}>{STATS.condition} · H:{STATS.high}° L:{STATS.low}°</div>
        </div>
        <Forecast days={FORECAST.slice(0, 3)} iconSize={0.14} />
      </div>
    );
  }

  // 3×2
  return (
    <div style={{ ...root, ...g3 }}>
      <Header label={STATS.city} aside={<CondIcon cond="sun" size={0.22} />} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: cell(0.08) }}>
        <div>
          <div style={{ fontSize: fcell(0.42), fontWeight: 800, letterSpacing: '-0.01em', lineHeight: 1 }}>{STATS.temp}</div>
          <div style={detail}>{STATS.condition} · feels {STATS.feels}°</div>
        </div>
        <div style={{ display: 'flex', gap: cell(0.09), textAlign: 'center' }}>
          {[
            { label: 'H', val: `${STATS.high}°` },
            { label: 'L', val: `${STATS.low}°` },
            { label: 'Wind', val: STATS.wind },
            { label: 'UV', val: String(STATS.uv) },
          ].map((m) => (
            <div key={m.label}>
              <div style={{ fontSize: cell(SCALE.fontTitle), fontWeight: 600, lineHeight: 1.1 }}>{m.val}</div>
              <div style={detail}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>
      <Forecast days={FORECAST} iconSize={0.16} />
    </div>
  );
}
