'use client';
export interface Weather {
  temp: number;
  condition: string;
}
// TODO(real-weather): replace with a real weather API call keyed on geolocation.
export function useWeather(): Weather {
  return { temp: 72, condition: 'Sunny' };
}
