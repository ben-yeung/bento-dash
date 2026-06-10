'use client';
import { type ReactNode } from 'react';
import styles from './Banner.module.css';
import { useGreeting } from '@/lib/hooks/useGreeting';
import { useWeather } from '@/lib/hooks/useWeather';

export function Banner({ profileSlot }: { profileSlot?: ReactNode }) {
  const greeting = useGreeting();
  const weather = useWeather();
  const date = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  return (
    <header className={styles.banner}>
      <div>
        <div className={styles.greet}>{greeting}, Ben</div>
        <div className={styles.sub}>
          {date} · {weather.temp}° {weather.condition}
        </div>
      </div>
      <div className={styles.right}>{profileSlot}</div>
    </header>
  );
}
