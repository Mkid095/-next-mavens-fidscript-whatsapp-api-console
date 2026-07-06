import type { ParsedRow } from './constants';

export interface ColumnMapping {
  phoneColumn: number;
  nameColumn: number;
  delimiter: ',' | '\t' | ';';
}

export function autoDetectColumns(headers: string[], sampleRows: string[][]): ColumnMapping {
  const phoneIdx = headers.findIndex(h => /phone|mobile|tel|cell|number/i.test(h));
  const nameIdx = headers.findIndex(h => /name|contact|first|last/i.test(h));
  return {
    phoneColumn: phoneIdx >= 0 ? phoneIdx : 0,
    nameColumn: nameIdx >= 0 ? nameIdx : 1,
    delimiter: ',',
  };
}

export function detectDelimiter(line: string): ',' | '\t' | ';' {
  if (line.includes('\t')) return '\t';
  if (line.includes(';')) return ';';
  return ',';
}

export function parseCSVLine(line: string, delimiter: ',' | '\t' | ';'): string[] {
  return line.split(delimiter).map(p => p.trim().replace(/^["']|["']$/g, ''));
}

export function detectHeaderRow(lines: string[]): { isHeader: boolean; dataStartIndex: number } {
  if (lines.length === 0) return { isHeader: false, dataStartIndex: 0 };
  const firstLine = lines[0];
  const firstParts = firstLine.split(/[,\t;]/);
  const firstPhoneRaw = firstParts[0]?.replace(/\D/g, '') || '';
  const firstHasLetters = /[a-zA-Z]/.test(firstLine);
  const firstIsHeader = firstHasLetters && firstPhoneRaw.length < 7;
  return {
    isHeader: firstIsHeader,
    dataStartIndex: firstIsHeader ? 1 : 0,
  };
}

export function parseImportText(
  text: string,
  countryCode: string,
  mapping: ColumnMapping,
  existingPhones?: Set<string>,
): ParsedRow[] {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length === 0) return [];

  const { dataStartIndex } = detectHeaderRow(lines);
  const dataLines = lines.slice(dataStartIndex);

  const seenNumbers = new Set<string>();
  const parsed: ParsedRow[] = [];

  for (let i = 0; i < dataLines.length; i++) {
    const line = dataLines[i];
    const parts = parseCSVLine(line, mapping.delimiter);
    const raw = parts[mapping.phoneColumn] || '';
    const name = parts[mapping.nameColumn] || `Contact ${i + 1}`;
    const digitsOnly = raw.replace(/\D/g, '');

    if (digitsOnly.length < 7) {
      parsed.push({ phone: raw, name, normalized: '', isDuplicate: false, isInvalid: true, invalidReason: 'Phone number too short' });
      continue;
    }
    if (!/^\+?\d{7,15}$/.test('+' + digitsOnly)) {
      parsed.push({ phone: raw, name, normalized: '', isDuplicate: false, isInvalid: true, invalidReason: 'Invalid phone format' });
      continue;
    }

    const normalized = normalizeNumber(raw, countryCode);
    const normalizedDigits = normalized.replace(/^\+/, '');
    const isDuplicate = seenNumbers.has(normalizedDigits) || (existingPhones?.has(normalizedDigits) ?? false);
    seenNumbers.add(normalizedDigits);
    parsed.push({ phone: raw, name, normalized, isDuplicate, isInvalid: false });
  }

  return parsed;
}

export function normalizeNumber(raw: string, countryCode: string): string {
  const digits = raw.replace(/\D/g, '');
  const COUNTRY_OPTIONS = [
    { code: '+254', country: 'Kenya' }, { code: '+255', country: 'Tanzania' },
    { code: '+256', country: 'Uganda' }, { code: '+250', country: 'Rwanda' },
    { code: '+251', country: 'Ethiopia' }, { code: '+249', country: 'Sudan' },
    { code: '+20', country: 'Egypt' }, { code: '+216', country: 'Tunisia' },
    { code: '+213', country: 'Algeria' }, { code: '+212', country: 'Morocco' },
    { code: '+91', country: 'India' }, { code: '+92', country: 'Pakistan' },
    { code: '+880', country: 'Bangladesh' }, { code: '+60', country: 'Malaysia' },
    { code: '+65', country: 'Singapore' }, { code: '+234', country: 'Nigeria' },
    { code: '+233', country: 'Ghana' }, { code: '+27', country: 'South Africa' },
    { code: '+1', country: 'US / Canada' }, { code: '+44', country: 'United Kingdom' },
    { code: '+49', country: 'Germany' }, { code: '+33', country: 'France' },
    { code: '+34', country: 'Spain' }, { code: '+39', country: 'Italy' },
    { code: '+971', country: 'UAE' }, { code: '+966', country: 'Saudi Arabia' },
    { code: '+86', country: 'China' }, { code: '+81', country: 'Japan' },
    { code: '+61', country: 'Australia' },
  ];
  if (COUNTRY_OPTIONS.some(c => digits.startsWith(c.code.replace('+', '')))) {
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
