import { describe, expect, it } from 'vitest';
import { formatDate, localeFromPath, localizedPath, switchLocale, topicPath } from './i18n';

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
