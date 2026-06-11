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
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
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
    position: 'absolute', inset: 0, padding: 12,
    display: 'flex', flexDirection: 'column',
    color: 'var(--text)', overflow: 'hidden',
  };

  if (w === 1 && h === 1) {
    return (
      <div style={s}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <SunIcon size={24} />
          <span style={{ fontSize: 10, color: 'var(--muted)' }}>SF</span>
        </div>
        <div style={{ fontSize: 26, fontWeight: 700, lineHeight: 1, marginTop: 2 }}>{STATS.temp}°</div>
        <div style={{ fontSize: 11, color: 'var(--muted)' }}>{STATS.condition}</div>
      </div>
    );
  }

  if (w === 2 && h === 1) {
    return (
      <div style={{ ...s, flexDirection: 'row', alignItems: 'center', gap: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, width: 44 }}>
          <SunIcon size={36} />
          <div style={{ fontSize: 10, color: 'var(--muted)' }}>{STATS.condition}</div>
        </div>
        <div style={{ flex: 1, paddingLeft: 8 }}>
          <div style={{ fontSize: 30, fontWeight: 700, lineHeight: 1 }}>{STATS.temp}°</div>
          <div style={{ fontSize: 10, color: 'var(--muted)' }}>H:{STATS.high}° L:{STATS.low}°</div>
        </div>
        <div style={{ textAlign: 'right', fontSize: 11 }}>
          <div style={{ fontWeight: 600, lineHeight: 1.3 }}>San<br />Francisco</div>
          <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>Feels like {STATS.feelsLike}°</div>
        </div>
      </div>
    );
  }

  if (w === 2 && h === 2) {
    return (
      <div style={s}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>San Francisco</div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Weather</div>
          </div>
          <SunIcon size={28} />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div style={{ fontSize: 36, fontWeight: 700, lineHeight: 1 }}>{STATS.temp}°</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>{STATS.condition} · Feels like {STATS.feelsLike}°</div>
        </div>
        <div style={{ height: 1, background: 'var(--border-hairline)', margin: '8px 0' }} />
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { label: 'H', val: `${STATS.high}°` },
            { label: 'L', val: `${STATS.low}°`  },
            { label: 'Wind', val: STATS.wind     },
            { label: 'UV',   val: String(STATS.uv) },
          ].map((m) => (
            <div key={m.label} style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{m.val}</div>
              <div style={{ fontSize: 9, color: 'var(--muted)' }}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 3×2
  return (
    <div style={s}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <div>
          <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>San Francisco</div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Weather</div>
        </div>
        <SunIcon size={28} />
        <div style={{ marginLeft: 8 }}>
          <span style={{ fontSize: 28, fontWeight: 700 }}>{STATS.temp}°</span>
          <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 4 }}>{STATS.condition}</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, fontSize: 11 }}>
          {[
            { label: 'H/L', val: `${STATS.high}°/${STATS.low}°` },
            { label: 'Wind',  val: STATS.wind   },
            { label: 'Hum',   val: STATS.humidity },
            { label: 'UV',    val: String(STATS.uv) },
          ].map((m) => (
            <div key={m.label} style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 600 }}>{m.val}</div>
              <div style={{ fontSize: 9, color: 'var(--muted)' }}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ height: 1, background: 'var(--border-hairline)', marginBottom: 8 }} />
      <div style={{ display: 'flex', gap: 6 }}>
        {FORECAST.map((day) => (
          <div key={day.day} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: 'var(--muted)' }}>{day.day}</div>
            <div style={{ fontSize: 16, margin: '2px 0' }}>{day.icon}</div>
            <div style={{ fontSize: 11, fontWeight: 600 }}>{day.high}°</div>
            <div style={{ fontSize: 10, color: 'var(--muted)' }}>{day.low}°</div>
          </div>
        ))}
      </div>
    </div>
  );
}
