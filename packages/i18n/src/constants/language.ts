import type { TLanguage, ILanguageOption } from "../types";

/** Fallback when a key is missing in the active locale (not the default UI language). */
export const FALLBACK_LANGUAGE: TLanguage = "en";

/** Default UI language when the user has not chosen one (localStorage empty). */
export const DEFAULT_LOCALE: TLanguage = "pt-BR";

export const SUPPORTED_LANGUAGES: ILanguageOption[] = [
  { label: "Português Brasil", value: "pt-BR" },
  { label: "English", value: "en" },
  { label: "Français", value: "fr" },
  { label: "Español", value: "es" },
  { label: "日本語", value: "ja" },
  { label: "简体中文", value: "zh-CN" },
  { label: "繁體中文", value: "zh-TW" },
  { label: "Русский", value: "ru" },
  { label: "Italian", value: "it" },
  { label: "Čeština", value: "cs" },
  { label: "Slovenčina", value: "sk" },
  { label: "Deutsch", value: "de" },
  { label: "Українська", value: "ua" },
  { label: "Polski", value: "pl" },
  { label: "한국어", value: "ko" },
  { label: "Indonesian", value: "id" },
  { label: "Română", value: "ro" },
  { label: "Tiếng việt", value: "vi-VN" },
  { label: "Türkçe", value: "tr-TR" },
];

/**
 * Enum for translation file names
 * These are the JSON files that contain translations each category
 */
export enum ETranslationFiles {
  TRANSLATIONS = "translations",
  ACCESSIBILITY = "accessibility",
  EDITOR = "editor",
  EMPTY_STATE = "empty-state",
}

export const LANGUAGE_STORAGE_KEY = "userLanguage";

/** One-time flag: migrates legacy Plane default (localStorage `en`) to Operoz default. */
export const LEGACY_LOCALE_MIGRATION_KEY = "operozLegacyEnLocaleMigrated";
