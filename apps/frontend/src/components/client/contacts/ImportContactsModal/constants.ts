export interface ParsedRow {
  phone: string;
  name: string;
  normalized: string;
  isDuplicate: boolean;
  isInvalid: boolean;
  invalidReason?: string;
}

export interface ImportResult {
  imported: number;
  errors: number;
  total: number;
}

export type DuplicateMode = 'skip' | 'update';

export interface GoogleStatus {
  linked: boolean;
  name?: string;
  email?: string;
  picture?: string;
}

export const COUNTRY_OPTIONS = [
  { code: '+254', country: 'Kenya' },
  { code: '+255', country: 'Tanzania' },
  { code: '+256', country: 'Uganda' },
  { code: '+250', country: 'Rwanda' },
  { code: '+251', country: 'Ethiopia' },
  { code: '+249', country: 'Sudan' },
  { code: '+20', country: 'Egypt' },
  { code: '+216', country: 'Tunisia' },
  { code: '+213', country: 'Algeria' },
  { code: '+212', country: 'Morocco' },
  { code: '+91', country: 'India' },
  { code: '+92', country: 'Pakistan' },
  { code: '+880', country: 'Bangladesh' },
  { code: '+60', country: 'Malaysia' },
  { code: '+65', country: 'Singapore' },
  { code: '+234', country: 'Nigeria' },
  { code: '+233', country: 'Ghana' },
  { code: '+27', country: 'South Africa' },
  { code: '+1', country: 'US / Canada' },
  { code: '+44', country: 'United Kingdom' },
  { code: '+49', country: 'Germany' },
  { code: '+33', country: 'France' },
  { code: '+34', country: 'Spain' },
  { code: '+39', country: 'Italy' },
  { code: '+971', country: 'UAE' },
  { code: '+966', country: 'Saudi Arabia' },
  { code: '+86', country: 'China' },
  { code: '+81', country: 'Japan' },
  { code: '+61', country: 'Australia' },
];
