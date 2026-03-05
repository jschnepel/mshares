import * as XLSX from 'xlsx';
import type { ColumnDataType, ColumnMeta, ParsedSheet, ParsedWorkbook, RowMeta } from '@/types';
import { safeFloat } from './utils';

let workbookCounter = 0;

function generateWorkbookId(): string {
  return `wb-${Date.now()}-${++workbookCounter}`;
}

// ── Type detection ──

const CURRENCY_RE = /^\$[\d,.]+$/;
const PERCENTAGE_RE = /^[\d,.]+%$/;
// MM/DD/YYYY, MM-DD-YYYY, MM/DD/YY, M/D/YY
const DATE_SLASH_RE = /^\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4}$/;
// ISO: YYYY-MM-DD or YYYY-MM-DDTHH:MM
const DATE_ISO_RE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?/;
// Month-name: "Jan 5, 2024", "January 5 2024", "5 Jan 2024"
const DATE_MONTH_NAME_RE = /^(?:\d{1,2}\s+)?(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2},?\s*\d{2,4}$|^(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2},?\s*\d{2,4}$/i;

function isDateString(str: string): boolean {
  return DATE_SLASH_RE.test(str) || DATE_ISO_RE.test(str) || DATE_MONTH_NAME_RE.test(str);
}

export function classifyValue(val: unknown): ColumnDataType | null {
  if (val === null || val === undefined || val === '') return null;

  // Date objects from XLSX cellDates
  if (val instanceof Date) return 'date';

  const str = String(val).trim();
  if (!str) return null;

  if (CURRENCY_RE.test(str)) return 'currency';
  if (PERCENTAGE_RE.test(str)) return 'percentage';
  if (isDateString(str)) return 'date';

  if (typeof val === 'number' || !isNaN(Number(str))) {
    const num = typeof val === 'number' ? val : Number(str);
    return Number.isInteger(num) ? 'integer' : 'float';
  }

  return 'string';
}

export const DATE_HEADER_KEYWORDS = /\b(date|time|created|updated|month|year|week|period|quarter|day)\b/i;

function detectColumnType(values: unknown[], header?: string): { dataType: ColumnDataType; precision: number } {
  const samples = values.filter(v => v !== null && v !== undefined && v !== '').slice(0, 100);
  if (samples.length === 0) return { dataType: 'string', precision: 0 };

  const votes = new Map<ColumnDataType, number>();
  let maxDecimals = 0;

  for (const val of samples) {
    const type = classifyValue(val);
    if (type) {
      votes.set(type, (votes.get(type) ?? 0) + 1);
    }

    // Track decimal precision
    const str = String(val).replace(/[$,%]/g, '').trim();
    const dotIdx = str.indexOf('.');
    if (dotIdx >= 0) {
      maxDecimals = Math.max(maxDecimals, str.length - dotIdx - 1);
    }
  }

  const threshold = samples.length * 0.7;
  let winner: ColumnDataType = 'string';
  let winnerCount = 0;

  for (const [type, count] of votes) {
    if (count >= threshold && count > winnerCount) {
      winner = type;
      winnerCount = count;
    }
  }

  // If no type hits 70%, fall back to string
  if (winnerCount === 0) winner = 'string';

  // Header-name heuristic: if header contains date keywords, promote to 'date'
  // if date or integer votes exist (even below 70% threshold)
  if (header && DATE_HEADER_KEYWORDS.test(header) && winner !== 'date') {
    const dateVotes = votes.get('date') ?? 0;
    const intVotes = votes.get('integer') ?? 0;
    if (dateVotes > 0 || intVotes > 0) {
      winner = 'date';
    }
  }

  const precision = Math.min(maxDecimals, 2);
  return { dataType: winner, precision };
}

/** Detailed type detection — returns vote counts per type + the winner. */
export function detectColumnTypeDetailed(values: unknown[]): {
  winner: ColumnDataType;
  precision: number;
  totalSamples: number;
  votes: Record<string, number>;
  winnerRatio: number;
} {
  const samples = values.filter(v => v !== null && v !== undefined && v !== '').slice(0, 100);
  if (samples.length === 0) return { winner: 'string', precision: 0, totalSamples: 0, votes: {}, winnerRatio: 1 };

  const votes = new Map<ColumnDataType, number>();
  let maxDecimals = 0;

  for (const val of samples) {
    const type = classifyValue(val);
    if (type) {
      votes.set(type, (votes.get(type) ?? 0) + 1);
    }
    const str = String(val).replace(/[$,%]/g, '').trim();
    const dotIdx = str.indexOf('.');
    if (dotIdx >= 0) {
      maxDecimals = Math.max(maxDecimals, str.length - dotIdx - 1);
    }
  }

  const threshold = samples.length * 0.7;
  let winner: ColumnDataType = 'string';
  let winnerCount = 0;

  for (const [type, count] of votes) {
    if (count >= threshold && count > winnerCount) {
      winner = type;
      winnerCount = count;
    }
  }
  if (winnerCount === 0) winner = 'string';

  const votesRecord: Record<string, number> = {};
  for (const [k, v] of votes) votesRecord[k] = v;

  return {
    winner,
    precision: Math.min(maxDecimals, 2),
    totalSamples: samples.length,
    votes: votesRecord,
    winnerRatio: samples.length > 0 ? (winnerCount / samples.length) : 1,
  };
}

// ── Value formatting ──

export function formatCellValue(value: unknown, col: ColumnMeta): string {
  if (value === null || value === undefined || value === '') return '';

  switch (col.dataType) {
    case 'currency': {
      const num = safeFloat(value);
      return `$${num.toLocaleString('en-US', { minimumFractionDigits: col.precision, maximumFractionDigits: col.precision })}`;
    }
    case 'percentage': {
      const num = safeFloat(value);
      return `${num.toFixed(col.precision)}%`;
    }
    case 'integer': {
      const num = safeFloat(value);
      return Math.round(num).toLocaleString('en-US');
    }
    case 'float': {
      const num = safeFloat(value);
      return num.toLocaleString('en-US', { minimumFractionDigits: col.precision, maximumFractionDigits: col.precision });
    }
    default:
      return String(value);
  }
}

// ── Sheet parsing ──

/** Format a Date object to a locale string like "Jan 5, 2024" */
function formatDateObj(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function parseSheet(sheetName: string, sheet: XLSX.WorkSheet): ParsedSheet {
  const rawRows: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: '',
    blankrows: false,
  });

  if (rawRows.length === 0) {
    return { name: sheetName, rawData: [], columns: [], rows: [], totalRows: 0, totalCols: 0 };
  }

  const headers = rawRows[0].map(h => {
    if (h instanceof Date) return formatDateObj(h);
    return String(h ?? '').replace(/^\uFEFF/, '').trim();
  });
  const dataRows = rawRows.slice(1);

  // Convert Date objects → formatted strings so downstream code (labels, safeFloat) stays unchanged
  for (let r = 0; r < dataRows.length; r++) {
    const row = dataRows[r];
    for (let c = 0; c < row.length; c++) {
      if (row[c] instanceof Date) {
        row[c] = formatDateObj(row[c] as Date);
      }
    }
  }

  const columns: ColumnMeta[] = headers.map((header, idx) => {
    const colValues = dataRows.map(row => row[idx]);
    const { dataType, precision } = detectColumnType(colValues, header);
    const sampleValues = colValues.filter(v => v !== null && v !== undefined && v !== '').slice(0, 5);

    return {
      index: idx,
      header,
      displayName: header,
      dataType,
      precision,
      included: true,
      sampleValues,
    };
  });

  const rows: RowMeta[] = dataRows.map((_, idx) => ({
    index: idx,
    included: true,
  }));

  return {
    name: sheetName,
    rawData: dataRows,
    columns,
    rows,
    totalRows: dataRows.length,
    totalCols: headers.length,
  };
}

// ── Main entry point ──

export async function parseGenericFile(file: File): Promise<ParsedWorkbook> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });

  const sheets: ParsedSheet[] = workbook.SheetNames.map(name =>
    parseSheet(name, workbook.Sheets[name])
  );

  return {
    id: generateWorkbookId(),
    fileName: file.name,
    sheets,
    activeSheetIndex: 0,
    loadedAt: Date.now(),
  };
}
