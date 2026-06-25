import { describe, it, expect } from 'vitest';
import { conditionEmoji } from './Banner';

describe('conditionEmoji', () => {
  it('returns ☀️ for Sunny', () => expect(conditionEmoji('Sunny')).toBe('☀️'));
  it('returns ☀️ for Clear', () => expect(conditionEmoji('Clear')).toBe('☀️'));
  it('returns ☁️ for Cloudy', () => expect(conditionEmoji('Cloudy')).toBe('☁️'));
  it('returns ☁️ for Overcast', () => expect(conditionEmoji('Overcast')).toBe('☁️'));
  it('returns 🌧️ for Rain', () => expect(conditionEmoji('Rain')).toBe('🌧️'));
  it('returns 🌧️ for Light Drizzle', () => expect(conditionEmoji('Light Drizzle')).toBe('🌧️'));
  it('returns 🌧️ for Heavy Showers', () => expect(conditionEmoji('Heavy Showers')).toBe('🌧️'));
  it('returns 🌨️ for Snow', () => expect(conditionEmoji('Snow')).toBe('🌨️'));
  it('returns 🌨️ for Sleet', () => expect(conditionEmoji('Sleet')).toBe('🌨️'));
  it('returns 🌨️ for Light Flurries', () => expect(conditionEmoji('Light Flurries')).toBe('🌨️'));
  it('returns ⛈️ for Thunderstorm', () => expect(conditionEmoji('Thunderstorm')).toBe('⛈️'));
  it('returns ⛈️ for Storm', () => expect(conditionEmoji('Storm')).toBe('⛈️'));
  it('returns ⛈️ for Thundery Showers (thunder beats shower)', () => expect(conditionEmoji('Thundery Showers')).toBe('⛈️'));
  it('returns 🌫️ for Fog', () => expect(conditionEmoji('Fog')).toBe('🌫️'));
  it('returns 🌫️ for Mist', () => expect(conditionEmoji('Mist')).toBe('🌫️'));
  it('returns 🌫️ for Haze', () => expect(conditionEmoji('Haze')).toBe('🌫️'));
  it('returns 🌬️ for Windy', () => expect(conditionEmoji('Windy')).toBe('🌬️'));
  it('is case-insensitive', () => {
    expect(conditionEmoji('SUNNY')).toBe('☀️');
    expect(conditionEmoji('partly cloudy')).toBe('☁️');
  });
  it('returns 🌡️ for unknown condition', () => expect(conditionEmoji('Tropical Cyclone')).toBe('🌡️'));
  it('returns 🌡️ for empty string', () => expect(conditionEmoji('')).toBe('🌡️'));
});
