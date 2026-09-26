// Domain vocabulary shared by the content schemas, the logic and the UI.
// User-facing labels (es/en) live in src/i18n/ui.ts.

export const LOCALES = ['es', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'es';

export const STATUSES = [
  'reported',
  'in-progress',
  'awaiting-response',
  'stalled',
  'resolved',
] as const;
export type Status = (typeof STATUSES)[number];

export const PRIORITIES = ['low', 'medium', 'high', 'critical'] as const;
export type Priority = (typeof PRIORITIES)[number];

export const UPDATE_TYPES = ['meeting', 'letter', 'response', 'assembly', 'note'] as const;
export type UpdateType = (typeof UPDATE_TYPES)[number];

export const DOCUMENT_TYPES = [
  'letter',
  'minutes',
  'response',
  'photo',
  'report',
  'other',
] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const ASSEMBLY_STATUSES = ['scheduled', 'held', 'cancelled'] as const;
export type AssemblyStatus = (typeof ASSEMBLY_STATUSES)[number];

export const ASSEMBLY_FORMATS = ['in-person', 'online', 'hybrid'] as const;
export type AssemblyFormat = (typeof ASSEMBLY_FORMATS)[number];

export const PLATFORMS = [
  'instagram',
  'facebook',
  'tiktok',
  'x',
  'whatsapp',
  'web',
  'other',
] as const;
export type Platform = (typeof PLATFORMS)[number];
