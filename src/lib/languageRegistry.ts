export type LanguageDirection = 'ltr' | 'rtl';

export type AppLanguage = {
  code: string;
  name: string;
  nativeName: string;
  direction: LanguageDirection;
  locale: string;
  searchTerms: string[];
};

export const APP_LANGUAGES: AppLanguage[] = [
  { code: 'nb', name: 'Norsk', nativeName: 'Norsk', direction: 'ltr', locale: 'nb-NO', searchTerms: ['norsk', 'norwegian', 'bokmål', 'norway'] },
  { code: 'en', name: 'English', nativeName: 'English', direction: 'ltr', locale: 'en-GB', searchTerms: ['english', 'engelsk', 'uk', 'british'] },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', direction: 'ltr', locale: 'tr-TR', searchTerms: ['turkish', 'tyrkisk', 'türkçe', 'turkce'] },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', direction: 'rtl', locale: 'ar', searchTerms: ['arabic', 'arabisk', 'العربية', 'arabi'] },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', direction: 'rtl', locale: 'ur-PK', searchTerms: ['urdu', 'اردو', 'pakistan'] },
  { code: 'de', name: 'German', nativeName: 'Deutsch', direction: 'ltr', locale: 'de-DE', searchTerms: ['german', 'tysk', 'deutsch'] },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', direction: 'ltr', locale: 'sv-SE', searchTerms: ['swedish', 'svensk', 'svenska'] },
  { code: 'da', name: 'Danish', nativeName: 'Dansk', direction: 'ltr', locale: 'da-DK', searchTerms: ['danish', 'dansk'] },
  { code: 'fr', name: 'French', nativeName: 'Français', direction: 'ltr', locale: 'fr-FR', searchTerms: ['french', 'fransk', 'français', 'francais'] },
];

export function findLanguage(value?: string | null) {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return APP_LANGUAGES[0];
  return APP_LANGUAGES.find((language) =>
    language.code === normalized ||
    language.name.toLowerCase() === normalized ||
    language.nativeName.toLowerCase() === normalized ||
    language.searchTerms.some((term) => term.toLowerCase() === normalized),
  ) || APP_LANGUAGES[0];
}

export function searchLanguages(query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return APP_LANGUAGES;
  return APP_LANGUAGES.filter((language) =>
    [language.code, language.name, language.nativeName, ...language.searchTerms]
      .some((value) => value.toLowerCase().includes(needle)),
  );
}
