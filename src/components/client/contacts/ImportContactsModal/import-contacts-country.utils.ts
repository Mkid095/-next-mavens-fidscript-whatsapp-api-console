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

export function normalizeNumber(raw: string, countryCode: string): string {
  const digits = raw.replace(/\D/g, '');
  if (COUNTRY_OPTIONS.some((c) => digits.startsWith(c.code.replace('+', '')))) {
    return '+' + digits;
  }
  if (digits.startsWith('00')) return '+' + digits.slice(2);
  if (digits.startsWith('0')) return countryCode + digits.slice(1);
  return countryCode + digits;
}

export function detectCountry(text: string): string {
  const upper = text.toLowerCase();
  if (upper.includes('kenya') || upper.includes('kenyan')) return '+254';
  if (upper.includes('tanzania')) return '+255';
  if (upper.includes('uganda')) return '+256';
  if (upper.includes('rwanda')) return '+250';
  if (upper.includes('ethiopia')) return '+251';
  if (upper.includes('sudan')) return '+249';
  if (upper.includes('egypt')) return '+20';
  if (upper.includes('nigeria')) return '+234';
  if (upper.includes('ghana')) return '+233';
  if (upper.includes('south africa')) return '+27';
  if (upper.includes('india')) return '+91';
  if (upper.includes('pakistan')) return '+92';
  return '';
}
