'use client';
import { type ReactNode } from 'react';
import styles from './Banner.module.css';
import { useGreeting } from '@/lib/hooks/useGreeting';
import { useWeather } from '@/lib/hooks/useWeather';
import { useProfile } from '@/lib/state/profileStore';

export function conditionEmoji(condition: string): string {
  const c = condition.toLowerCase();
  if (c.includes('sunny') || c.includes('clear')) return '☀️';
  if (c.includes('cloud') || c.includes('overcast')) return '☁️';
  if (c.includes('rain') || c.includes('drizzle') || c.includes('shower')) return '🌧️';
  if (c.includes('snow') || c.includes('sleet') || c.includes('flurr')) return '🌨️';
  if (c.includes('thunder') || c.includes('storm')) return '⛈️';
  if (c.includes('fog') || c.includes('mist') || c.includes('haze')) return '🌫️';
  if (c.includes('wind')) return '🌬️';
  return '🌡️';
}

export function Banner({ profileSlot }: { profileSlot?: ReactNode }) {
  const greeting = useGreeting();
  const weather = useWeather();
  const { displayName } = useProfile();
  const date = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  return (
    <header className={styles.banner}>
      <div className={styles.left}>
        <div className={styles.greet}>{greeting}, {displayName || 'there'}</div>
        <div className={styles.date}>{date}</div>
      </div>
      <div className={styles.right}>
        <div className={styles.weatherBlock}>
          <div className={styles.weatherTop}>
            <span className={styles.weatherEmoji}>{conditionEmoji(weather.condition)}</span>
            <span className={styles.weatherTemp}>{weather.temp}°</span>
          </div>
          <div className={styles.weatherCond}>{weather.condition}</div>
        </div>
        {profileSlot}
      </div>
    </header>
  );
}
