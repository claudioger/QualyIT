export { esAR } from './es-AR';
export type { TranslationKeys } from './es-AR';

// Default locale
export const defaultLocale = 'es-AR';

// Available locales
export const locales = ['es-AR'] as const;
export type Locale = (typeof locales)[number];

// Get translations for a locale
export function getTranslations(locale: Locale = 'es-AR') {
  switch (locale) {
    case 'es-AR':
    default:
      return import('./es-AR').then((m) => m.esAR);
  }
}
