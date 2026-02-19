import * as XLSX from 'xlsx';
import type { BrokerageData, FileFormat, MarketData } from '@/types';
import { SOTHEBYS_PATTERNS, SOTHEBYS_DISPLAY_NAME, FH_COLUMNS } from './constants';

let fileCounter = 0;

function generateId(): string {
  return `market-${Date.now()}-${++fileCounter}`;
}

function isSothebys(name: string): boolean {
  return SOTHEBYS_PATTERNS.some(p => p.test(name));
}

function normalizeName(name: string): string {
  if (isSothebys(name)) return SOTHEBYS_DISPLAY_NAME;
  return name.trim();
}

function deriveMarketName(fileName: string): string {
  let name = fileName
    .replace(/\.(csv|xlsx?|xls)$/i, '')
    .replace(/^marketshare/i, '')
    .replace(/^makretshare/i, '')  // typo in actual file
    .replace(/active/i, ' Active ')
    .replace(/luxury/i, ' Luxury ')
    .replace(/listings/i, ' Listings ')
    .replace(/NorthScottsdale/i, 'North Scottsdale')
    .replace(/CarefreeCaveCreekArea/i, 'Carefree/Cave Creek Area')
    .replace(/corridor/i, ' Corridor')
    .replace(/Scottsdale/i, 'Scottsdale')
    .replace(/Sedona/i, 'Sedona')
    .replace(/Tubac/i, 'Tubac')
    .replace(/DH/i, 'Desert Highlands')
    .replace(/DM/i, 'Desert Mountain')
    .trim();

  // Clean up multiple spaces
  name = name.replace(/\s+/g, ' ').trim();

  // Capitalize first letter of each word
  if (name.length > 0) {
    name = name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  return name || fileName;
}

function safeFloat(val: unknown): number {
  if (val === null || val === undefined || val === '') return 0;
  const str = String(val).replace(/[$,%]/g, '').trim();
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

/**
 * If a market share value is between 0 and 1, it's a decimal from Excel.
 * Multiply by 100 to get percentage. This ONLY happens here in the processor.
 */
function normalizePercentage(val: number, needsMultiplication: boolean): number {
  if (needsMultiplication && val > 0 && val < 1) {
    return val * 100;
  }
  // Even if needsMultiplication is false, Excel sometimes returns decimals
  if (!needsMultiplication && val > 0 && val < 1) {
    return val * 100;
  }
  return val;
}

function detectFormat(headers: string[]): FileFormat {
  // Check for ColumnType2: "Mkt %" in column I (index 8)
  if (headers.length > 8 && /mkt\s*%/i.test(headers[8])) {
    return 'ColumnType2';
  }
  // Check for FH: headers containing "Market Share ($)" or "Market Share (#)"
  const headerStr = headers.join('|');
  if (/market\s*share\s*\(\$\)/i.test(headerStr) || /market\s*share\s*\(#\)/i.test(headerStr)) {
    return 'FH';
  }
  return 'unknown';
}

function parseFHRow(row: (string | number)[]): BrokerageData | null {
  const brand = String(row[FH_COLUMNS.brand] ?? '').trim();
  if (!brand) return null;

  const dollarVolume = safeFloat(row[FH_COLUMNS.dollarVolume]);
  const rawShareDollar = safeFloat(row[FH_COLUMNS.marketShareDollar]);
  const rawShareUnits = safeFloat(row[FH_COLUMNS.marketShareUnits]);
  const totalSales = safeFloat(row[FH_COLUMNS.totalSales]);

  // FH format: values stored as decimals (e.g., 0.162 = 16.2%)
  const marketShareDollar = normalizePercentage(rawShareDollar, true);
  const marketShareUnits = normalizePercentage(rawShareUnits, true);

  // Skip brokerages with 0 share in both
  if (marketShareDollar === 0 && marketShareUnits === 0 && dollarVolume === 0) return null;

  return {
    rank: safeFloat(row[FH_COLUMNS.rank]),
    name: normalizeName(brand),
    originalName: brand,
    dollarVolume,
    marketShareDollar,
    marketShareUnits,
    totalSales,
    avgPrice: safeFloat(row[FH_COLUMNS.avgPrice]),
    daysOnMarket: safeFloat(row[FH_COLUMNS.daysOnMarket]),
    pricePerSqFt: safeFloat(row[FH_COLUMNS.pricePerSqFt]),
    saleToListRatio: normalizePercentage(safeFloat(row[FH_COLUMNS.saleToListRatio]), true) / 100,
    percentChange: safeFloat(row[FH_COLUMNS.percentChange]),
    isSothebys: isSothebys(brand),
  };
}

function parseColumnType2Rows(rows: (string | number)[][]): BrokerageData[] {
  const brokerages: BrokerageData[] = [];

  // Calculate total dollar volume for market share computation
  let totalDollarVolume = 0;
  for (const row of rows) {
    totalDollarVolume += safeFloat(row[3]); // dollar volume column D
  }

  for (const row of rows) {
    const brand = String(row[1] ?? '').trim();
    if (!brand) continue;

    const dollarVolume = safeFloat(row[3]);
    const rawMktPercent = safeFloat(row[8]); // Mkt % column I — this is units
    const marketShareUnits = normalizePercentage(rawMktPercent, false);

    // Calculate dollar share from volume
    const marketShareDollar = totalDollarVolume > 0
      ? (dollarVolume / totalDollarVolume) * 100
      : 0;

    if (marketShareDollar === 0 && marketShareUnits === 0) continue;

    brokerages.push({
      rank: brokerages.length + 1,
      name: normalizeName(brand),
      originalName: brand,
      dollarVolume,
      marketShareDollar,
      marketShareUnits,
      totalSales: safeFloat(row[6]),
      avgPrice: safeFloat(row[10]),
      daysOnMarket: safeFloat(row[9]),
      pricePerSqFt: safeFloat(row[11]),
      saleToListRatio: normalizePercentage(safeFloat(row[12]), false) / 100,
      percentChange: 0,
      isSothebys: isSothebys(brand),
    });
  }

  return brokerages;
}

export async function processFile(file: File): Promise<MarketData> {
  const id = generateId();
  const marketName = deriveMarketName(file.name);
  const warnings: string[] = [];
  const errors: string[] = [];

  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData: (string | number)[][] = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: '',
      blankrows: false,
    });

    if (rawData.length < 2) {
      return createErrorResult(id, file.name, marketName, 'File has no data rows');
    }

    // Strip BOM and clean headers
    const headers = rawData[0].map(h => String(h).replace(/^\uFEFF/, '').trim());
    const format = detectFormat(headers);

    if (format === 'unknown') {
      return createErrorResult(id, file.name, marketName, 'Unrecognized file format. Expected FH or ColumnType2 headers.');
    }

    const dataRows = rawData.slice(1);
    let brokerages: BrokerageData[];

    if (format === 'FH') {
      brokerages = dataRows
        .map(row => parseFHRow(row))
        .filter((b): b is BrokerageData => b !== null);
    } else {
      brokerages = parseColumnType2Rows(dataRows);
    }

    if (brokerages.length === 0) {
      return createErrorResult(id, file.name, marketName, 'No valid brokerage data found');
    }

    // Sort by dollar market share descending
    brokerages.sort((a, b) => b.marketShareDollar - a.marketShareDollar);

    // Re-assign ranks
    brokerages.forEach((b, i) => { b.rank = i + 1; });

    // Find Sotheby's
    const sothebysData = brokerages.find(b => b.isSothebys) ?? null;
    if (!sothebysData) {
      warnings.push("Russ Lyon Sotheby's not found in this file");
    }

    // Determine #1 rankings
    const sortedByDollar = [...brokerages].sort((a, b) => b.marketShareDollar - a.marketShareDollar);
    const sortedByUnits = [...brokerages].sort((a, b) => b.marketShareUnits - a.marketShareUnits);

    const isRlsirFirstByDollar = sortedByDollar[0]?.isSothebys ?? false;
    const isRlsirFirstByUnits = sortedByUnits[0]?.isSothebys ?? false;

    const availableViews: ('dollar' | 'units')[] = [];
    if (isRlsirFirstByDollar) availableViews.push('dollar');
    if (isRlsirFirstByUnits) availableViews.push('units');

    if (availableViews.length === 0) {
      warnings.push("RLSIR is not #1 in any market share view. Chart will not be generated.");
    }

    // Validation warnings
    brokerages.forEach(b => {
      if (b.marketShareDollar > 100) {
        warnings.push(`${b.name}: dollar share ${b.marketShareDollar.toFixed(1)}% exceeds 100%`);
      }
      if (b.marketShareUnits > 100) {
        warnings.push(`${b.name}: unit share ${b.marketShareUnits.toFixed(1)}% exceeds 100%`);
      }
    });

    const totalMarketDollar = brokerages.reduce((sum, b) => sum + b.dollarVolume, 0);
    const totalMarketUnits = brokerages.reduce((sum, b) => sum + b.totalSales, 0);

    return {
      id,
      fileName: file.name,
      marketName,
      format,
      brokerages,
      sothebysData,
      isRlsirFirstByDollar,
      isRlsirFirstByUnits,
      availableViews,
      totalMarketDollar,
      totalMarketUnits,
      status: errors.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'ready',
      warnings,
      errors,
      processedAt: Date.now(),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error processing file';
    return createErrorResult(id, file.name, marketName, message);
  }
}

function createErrorResult(id: string, fileName: string, marketName: string, error: string): MarketData {
  return {
    id,
    fileName,
    marketName,
    format: 'unknown',
    brokerages: [],
    sothebysData: null,
    isRlsirFirstByDollar: false,
    isRlsirFirstByUnits: false,
    availableViews: [],
    totalMarketDollar: 0,
    totalMarketUnits: 0,
    status: 'error',
    warnings: [],
    errors: [error],
    processedAt: Date.now(),
  };
}

export async function processFiles(files: File[]): Promise<MarketData[]> {
  return Promise.all(files.map(f => processFile(f)));
}
