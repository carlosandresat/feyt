// Language and route helpers. Pure (no `astro:*`) so they can be tested.
// Note: Astro also provides `getRelativeLocaleUrl` in `astro:i18n`; we use our own helper because
// paths are identical in both languages and this keeps the logic testable with Vitest.
// Paths themselves (/temas/, /asambleas/, /buscar/) are user-facing, so they stay in Spanish.

import { ui, type UIKey } from '../i18n/ui';
import { DEFAULT_LOCALE, LOCALES, type Locale } from './domain';

export function t(locale: Locale) {
  return (key: UIKey): string => ui[locale][key];
}

/** localizedPath('en', '/temas/residencias') → '/en/temas/residencias'; Spanish has no prefix. */
export function localizedPath(locale: Locale, path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  if (locale === DEFAULT_LOCALE) return clean;
  return clean === '/' ? `/${locale}/` : `/${locale}${clean}`;
}

export function localeFromPath(pathname: string): Locale {
  const first = pathname.split('/')[1];
  return (LOCALES as readonly string[]).includes(first) ? (first as Locale) : DEFAULT_LOCALE;
}

/** Same page in another language: '/en/temas/x' ↔ '/temas/x'. */
export function switchLocale(pathname: string, target: Locale): string {
  const current = localeFromPath(pathname);
  const unprefixed =
    current === DEFAULT_LOCALE ? pathname : pathname.slice(current.length + 1) || '/';
  return localizedPath(target, unprefixed);
}

export const topicPath = (locale: Locale, key: string) => localizedPath(locale, `/temas/${key}/`);
export const assemblyPath = (locale: Locale, id: string) =>
  localizedPath(locale, `/asambleas/${id}/`);

const INTL_LOCALE: Record<Locale, string> = { es: 'es-EC', en: 'en-US' };

/**
 * Date-only values (YAML `2026-09-02`) are stored as UTC midnight: format them in UTC so they don't
 * show the previous day. Datetimes (assemblies) are shown in Ecuador's time zone.
 */
export function formatDate(date: Date, locale: Locale, withTime = false): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    dateStyle: 'long',
    ...(withTime ? { timeStyle: 'short', timeZone: 'America/Guayaquil' } : { timeZone: 'UTC' }),
  }).format(date);
}
