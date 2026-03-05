import type { MarketData, ShareType } from '@/types';
import type { HeroImageState } from '@/store/marketStore';
import { generateExecutiveSummary } from './summaryGenerator';

export type IssueSeverity = 'error' | 'warning';

export interface ValidationIssue {
  severity: IssueSeverity;
  field: string;
  message: string;
}

export interface MarketValidationResult {
  marketId: string;
  marketName: string;
  issues: ValidationIssue[];
  hasErrors: boolean;
  hasWarnings: boolean;
}

export interface BatchValidationResult {
  markets: MarketValidationResult[];
  globalIssues: ValidationIssue[];
  canExport: boolean;
  errorCount: number;
  warningCount: number;
}

/**
 * Validates a single market's data for export readiness.
 * Checks every element that would appear on the branded page.
 */
function validateMarket(
  market: MarketData,
  shareType: ShareType,
  heroState: HeroImageState,
  options: { showKPI: boolean; showSummary: boolean },
): MarketValidationResult {
  const issues: ValidationIssue[] = [];
  const name = market.chartTitle ?? market.marketName;

  // ── Hero image ──
  if (!heroState.url) {
    issues.push({ severity: 'error', field: 'Hero Image', message: 'No hero image assigned' });
  }

  // ── Market title ──
  if (!name || name.trim().length === 0) {
    issues.push({ severity: 'error', field: 'Title', message: 'Market title is empty' });
  }

  // ── RLSIR presence ──
  if (!market.sothebysData) {
    issues.push({ severity: 'error', field: 'RLSIR Data', message: "Russ Lyon Sotheby's not found in this file" });
  }

  // ── Available views ──
  if (market.availableViews.length === 0) {
    issues.push({ severity: 'error', field: 'Chart', message: 'RLSIR is not #1 in any view — no chart available' });
  } else if (!market.availableViews.includes(shareType)) {
    issues.push({
      severity: 'warning',
      field: 'Share Type',
      message: `Selected view "${shareType}" not available — will fall back to "${market.availableViews[0]}"`,
    });
  }

  // ── Brokerage data quality ──
  if (market.brokerages.length === 0) {
    issues.push({ severity: 'error', field: 'Brokerages', message: 'No brokerage data found' });
  } else if (market.brokerages.length < 3) {
    issues.push({ severity: 'warning', field: 'Brokerages', message: `Only ${market.brokerages.length} brokerages — chart may look sparse` });
  }

  // Check for NaN/Infinity in brokerage market share values
  for (const b of market.brokerages) {
    if (!isFinite(b.marketShareDollar) || !isFinite(b.marketShareUnits)) {
      issues.push({
        severity: 'error',
        field: 'Market Share',
        message: `"${b.name}" has invalid market share values (NaN or Infinity)`,
      });
      break; // One is enough to flag
    }
    if (b.marketShareDollar > 100 || b.marketShareUnits > 100) {
      issues.push({
        severity: 'error',
        field: 'Market Share',
        message: `"${b.name}" market share exceeds 100% — data is corrupted`,
      });
      break;
    }
    if (b.marketShareDollar < 0 || b.marketShareUnits < 0) {
      issues.push({
        severity: 'error',
        field: 'Market Share',
        message: `"${b.name}" has negative market share — data is corrupted`,
      });
      break;
    }
  }

  // ── KPI metrics (only validated when KPI banner is enabled) ──
  if (options.showKPI && market.sothebysData) {
    const s = market.sothebysData;

    if (!isFinite(s.dollarVolume) || s.dollarVolume <= 0) {
      issues.push({ severity: 'error', field: 'KPI: Volume', message: 'Dollar volume is missing or zero' });
    }
    if (!isFinite(s.totalSales) || s.totalSales <= 0) {
      issues.push({ severity: 'error', field: 'KPI: Sales', message: 'Total sales count is missing or zero' });
    }
    if (!isFinite(s.avgPrice) || s.avgPrice <= 0) {
      issues.push({ severity: 'error', field: 'KPI: Avg Price', message: 'Average price is missing or zero' });
    }
    // DOM, $/sqft, SP/LP display as "—" when zero, which is acceptable — but warn
    if (s.daysOnMarket <= 0) {
      issues.push({ severity: 'warning', field: 'KPI: DOM', message: 'Days on Market is zero — will display as "—"' });
    }
    if (s.pricePerSqFt <= 0) {
      issues.push({ severity: 'warning', field: 'KPI: $/SqFt', message: 'Price per sqft is zero — will display as "—"' });
    }
    if (s.saleToListRatio <= 0) {
      issues.push({ severity: 'warning', field: 'KPI: SP/LP', message: 'Sale-to-list ratio is zero — will display as "—"' });
    }

    // Check for NaN in any KPI field
    const kpiFields = [s.dollarVolume, s.totalSales, s.avgPrice, s.daysOnMarket, s.pricePerSqFt, s.saleToListRatio, s.marketShareDollar, s.marketShareUnits];
    if (kpiFields.some(v => !isFinite(v))) {
      issues.push({ severity: 'error', field: 'KPI Data', message: 'One or more KPI values are NaN or Infinity' });
    }
  }

  // ── Executive summary (only validated when enabled) ──
  if (options.showSummary) {
    try {
      const effectiveShareType = market.availableViews.includes(shareType)
        ? shareType
        : market.availableViews[0] ?? shareType;
      const summary = generateExecutiveSummary(market, effectiveShareType);
      if (!summary || summary.trim().length === 0) {
        issues.push({ severity: 'error', field: 'Summary', message: 'Executive summary generated empty text' });
      }
      if (summary.includes('NaN') || summary.includes('undefined') || summary.includes('null')) {
        issues.push({ severity: 'error', field: 'Summary', message: 'Executive summary contains "NaN", "undefined", or "null"' });
      }
      if (summary.includes('Infinity')) {
        issues.push({ severity: 'error', field: 'Summary', message: 'Executive summary contains "Infinity" — data is corrupted' });
      }
    } catch {
      issues.push({ severity: 'error', field: 'Summary', message: 'Executive summary generation crashed' });
    }
  }

  // ── File-level warnings from processing ──
  for (const w of market.warnings) {
    issues.push({ severity: 'warning', field: 'File', message: w });
  }
  for (const e of market.errors) {
    issues.push({ severity: 'error', field: 'File', message: e });
  }

  return {
    marketId: market.id,
    marketName: name,
    issues,
    hasErrors: issues.some(i => i.severity === 'error'),
    hasWarnings: issues.some(i => i.severity === 'warning'),
  };
}

/**
 * Validates a batch of markets for export readiness.
 * Returns a comprehensive report with per-market and global issues.
 */
export function validateBatchExport(
  markets: MarketData[],
  shareType: ShareType,
  heroImages: Map<string, HeroImageState>,
  options: { showKPI: boolean; showSummary: boolean; dateStart: string; dateEnd: string },
): BatchValidationResult {
  const globalIssues: ValidationIssue[] = [];
  const defaultHero: HeroImageState = { url: '', crop: { x: 50, y: 50 } };

  // ── Global checks ──
  if (markets.length === 0) {
    globalIssues.push({ severity: 'error', field: 'Selection', message: 'No markets selected for export' });
  }

  // Date range — the footer always shows a date range
  if (!options.dateStart || !options.dateEnd) {
    globalIssues.push({ severity: 'warning', field: 'Date Range', message: 'Date range not set — footer will display default dates' });
  }

  // ── Per-market validation ──
  const marketResults = markets.map(m =>
    validateMarket(m, shareType, heroImages.get(m.id) ?? defaultHero, options)
  );

  const errorCount = globalIssues.filter(i => i.severity === 'error').length
    + marketResults.reduce((sum, r) => sum + r.issues.filter(i => i.severity === 'error').length, 0);
  const warningCount = globalIssues.filter(i => i.severity === 'warning').length
    + marketResults.reduce((sum, r) => sum + r.issues.filter(i => i.severity === 'warning').length, 0);

  return {
    markets: marketResults,
    globalIssues,
    canExport: errorCount === 0,
    errorCount,
    warningCount,
  };
}
