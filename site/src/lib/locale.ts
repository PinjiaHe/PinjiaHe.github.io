export type Locale = 'en' | 'zh';
export const localeFromPath = (path: string): Locale => /^\/zh(?:\/|$)/.test(path) ? 'zh' : 'en';
export const englishPath = (path: string) => path.replace(/^\/zh(?=\/|$)/, '') || '/';

// Only mirrored pages change language; assets, external links and legacy paths do not.
export function localizeHref(href: string, locale: Locale): string {
  if (!href.startsWith('/') || href.startsWith('//')) return href;
  const [, path, suffix] = href.match(/^([^?#]*)(.*)$/)!;
  const original = englishPath(path);
  const mirrored = /^\/(?:$|(?:lab|join|publications)\/$|(?:research|notes)\/(?:[a-z0-9-]+\/)?)$/.test(original);
  return mirrored ? `${locale === 'zh' ? '/zh' : ''}${original}${suffix}` : href;
}

export function languageSwitchHref(path: string): string {
  const locale = localeFromPath(path) === 'zh' ? 'en' : 'zh';
  const target = localizeHref(path, locale);
  return target !== path ? target : locale === 'zh' ? '/zh/' : '/';
}
