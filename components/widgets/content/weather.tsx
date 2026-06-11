import type { WidgetContentProps } from '@/components/widgets/WidgetSkeleton';
import React from 'react';

const ACCENT = '#38bdf8';
const STATS = { temp: 72, condition: 'Sunny', feelsLike: 70, high: 78, low: 62, wind: '8 mph', humidity: '62%', uv: 6 };
const FORECAST = [
  { day: 'Thu', icon: '☀️', high: 76, low: 60 },
  { day: 'Fri', icon: '⛅', high: 71, low: 58 },
  { day: 'Sat', icon: '🌧️', high: 63, low: 55 },
  { day: 'Sun', icon: '⛅', high: 68, low: 57 },
  { day: 'Mon', icon: '☀️', high: 74, low: 61 },
];

function SunIcon({ size }: { size: number }) {
  return (
    <svg width={`${size/10}em`} height={`${size/10}em`} viewBox="0 0 36 36" fill="none">
      <circle cx={18} cy={18} r={7} fill="#ffd93d" />
      {[0,45,90,135,180,225,270,315].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        const x1 = 18 + 10 * Math.cos(rad);
        const y1 = 18 + 10 * Math.sin(rad);
        const x2 = 18 + 14 * Math.cos(rad);
        const y2 = 18 + 14 * Math.sin(rad);
        return <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#ffd93d" strokeWidth={2} strokeLinecap="round" />;
      })}
    </svg>
  );
}

export function Weather({ w, h }: WidgetContentProps) {
  const s: React.CSSProperties = {
    position: 'absolute', inset: 0, padding: '1.2em',
    display: 'flex', flexDirection: 'column',
    color: 'var(--text)', overflow: 'hidden',
  };

  if (w === 1 && h === 1) {
    return (
      <div style={s}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <SunIcon size={24} />
          <span style={{ fontSize: '1em', color: 'var(--muted)' }}>SF</span>
        </div>
        <div style={{ fontSize: '2.6em', fontWeight: 700, lineHeight: 1, marginTop: '0.2em' }}>{STATS.temp}°</div>
        <div style={{ fontSize: '1.1em', color: 'var(--muted)' }}>{STATS.condition}</div>
      </div>
    );
  }

  if (w === 2 && h === 1) {
    return (
      <div style={{ ...s, flexDirection: 'row', alignItems: 'center', gap: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2em', width: '4.4em' }}>
          <SunIcon size={36} />
          <div style={{ fontSize: '1em', color: 'var(--muted)' }}>{STATS.condition}</div>
        </div>
        <div style={{ flex: 1, paddingLeft: '0.8em' }}>
          <div style={{ fontSize: '3em', fontWeight: 700, lineHeight: 1 }}>{STATS.temp}°</div>
          <div style={{ fontSize: '1em', color: 'var(--muted)' }}>H:{STATS.high}° L:{STATS.low}°</div>
        </div>
        <div style={{ textAlign: 'right', fontSize: '1.1em' }}>
          <div style={{ fontWeight: 600, lineHeight: 1.3 }}>San<br />Francisco</div>
          <div style={{ fontSize: '1em', color: 'var(--muted)', marginTop: '0.2em' }}>Feels like {STATS.feelsLike}°</div>
        </div>
      </div>
    );
  }

  if (w === 2 && h === 2) {
    return (
      <div style={s}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '1em', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>San Francisco</div>
            <div style={{ fontSize: '1.3em', fontWeight: 600 }}>Weather</div>
          </div>
          <SunIcon size={28} />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div style={{ fontSize: '3.6em', fontWeight: 700, lineHeight: 1 }}>{STATS.temp}°</div>
          <div style={{ fontSize: '1.2em', color: 'var(--muted)' }}>{STATS.condition} · Feels like {STATS.feelsLike}°</div>
        </div>
        <div style={{ height: '1px', background: 'var(--border-hairline)', margin: '0.8em 0' }} />
        <div style={{ display: 'flex', gap: '1em' }}>
          {[
            { label: 'H', val: `${STATS.high}°` },
            { label: 'L', val: `${STATS.low}°`  },
            { label: 'Wind', val: STATS.wind     },
            { label: 'UV',   val: String(STATS.uv) },
          ].map((m) => (
            <div key={m.label} style={{ flex: 1 }}>
              <div style={{ fontSize: '1.2em', fontWeight: 600 }}>{m.val}</div>
              <div style={{ fontSize: '0.9em', color: 'var(--muted)' }}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 3×2
  return (
    <div style={s}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1em', marginBottom: '0.6em' }}>
        <div>
          <div style={{ fontSize: '1em', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>San Francisco</div>
          <div style={{ fontSize: '1.3em', fontWeight: 600 }}>Weather</div>
        </div>
        <SunIcon size={28} />
        <div style={{ marginLeft: '0.8em' }}>
          <span style={{ fontSize: '2.8em', fontWeight: 700 }}>{STATS.temp}°</span>
          <span style={{ fontSize: '1.1em', color: 'var(--muted)', marginLeft: '0.4em' }}>{STATS.condition}</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '1.2em', fontSize: '1.1em' }}>
          {[
            { label: 'H/L', val: `${STATS.high}°/${STATS.low}°` },
            { label: 'Wind',  val: STATS.wind   },
            { label: 'Hum',   val: STATS.humidity },
            { label: 'UV',    val: String(STATS.uv) },
          ].map((m) => (
            <div key={m.label} style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 600 }}>{m.val}</div>
              <div style={{ fontSize: '0.9em', color: 'var(--muted)' }}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ height: '1px', background: 'var(--border-hairline)', marginBottom: '0.8em' }} />
      <div style={{ display: 'flex', gap: '0.6em' }}>
        {FORECAST.map((day) => (
          <div key={day.day} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: '1em', color: 'var(--muted)' }}>{day.day}</div>
            <div style={{ fontSize: '1.6em', margin: '0.2em 0' }}>{day.icon}</div>
            <div style={{ fontSize: '1.1em', fontWeight: 600 }}>{day.high}°</div>
            <div style={{ fontSize: '1em', color: 'var(--muted)' }}>{day.low}°</div>
          </div>
        ))}
      </div>
    </div>
  );
}
