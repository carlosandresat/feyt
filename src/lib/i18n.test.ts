import { describe, expect, it } from 'vitest';
import {
  dateParts,
  formatDate,
  formatDateRange,
  localeFromPath,
  localizedPath,
  switchLocale,
  topicPath,
} from './i18n';

describe('localized paths', () => {
  it('leaves Spanish unprefixed and prefixes English', () => {
    expect(localizedPath('es', '/temas/')).toBe('/temas/');
    expect(localizedPath('en', '/temas/')).toBe('/en/temas/');
    expect(localizedPath('en', '/')).toBe('/en/');
    expect(topicPath('en', 'residencias/internet')).toBe('/en/temas/residencias/internet/');
  });

  it('detects the locale and switches between locales', () => {
    expect(localeFromPath('/en/temas/x/')).toBe('en');
    expect(localeFromPath('/temas/x/')).toBe('es');
    expect(switchLocale('/temas/x/', 'en')).toBe('/en/temas/x/');
    expect(switchLocale('/en/temas/x/', 'es')).toBe('/temas/x/');
    expect(switchLocale('/en', 'es')).toBe('/');
    expect(switchLocale('/', 'en')).toBe('/en/');
  });
});

describe('formatDate', () => {
  it('does not shift date-only values to the previous day', () => {
    expect(formatDate(new Date('2026-09-02'), 'es')).toContain('2 de septiembre');
  });

  it("shows Ecuador's local time for datetimes", () => {
    expect(formatDate(new Date('2026-09-15T18:00:00-05:00'), 'en', true)).toMatch(/6:00\sPM/);
  });
});

describe('formatDateRange and dateParts', () => {
  const start = new Date('2026-10-15T16:00:00-05:00');

  it('collapses same-day ranges into one date with a time range', () => {
    const text = formatDateRange(start, new Date('2026-10-15T18:00:00-05:00'), 'es');
    expect(text.match(/2026/g)).toHaveLength(1);
    expect(text).toContain('15 de octubre');
  });

  it('formats a single datetime when there is no end', () => {
    expect(formatDateRange(start, undefined, 'en')).toMatch(/October 15, 2026.*4:00\sPM/);
  });

  it("splits a datetime into parts in Ecuador's time zone", () => {
    expect(dateParts(start, 'es')).toMatchObject({ day: '15', month: 'oct', year: '2026' });
    // Intl separates "a. m." with non-breaking spaces, hence \s.
    const morning = dateParts(new Date('2026-09-05T09:00:00-05:00'), 'es');
    expect(morning.month).toBe('sept');
    expect(morning.time).toMatch(/^9:00\sa\.\sm\.$/);
  });
});
