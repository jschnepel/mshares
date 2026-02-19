// RLSIR Brand Colors
export const COLORS = {
  navy: '#002349',
  navyDeep: '#0a1628',
  navyLight: '#0f2440',
  navyMedium: '#1a3a5c',
  gold: '#BFA67A',
  goldLight: '#d4c4a0',
  goldDark: '#9e8a64',
  cream: '#F9F8F6',
  creamDark: '#e8e6e2',
  grayBar: '#999999',
  grayBarLight: '#b0b0b0',
  white: '#ffffff',
  black: '#000000',
  success: '#22c55e',
  warning: '#eab308',
  error: '#ef4444',
} as const;

// Sotheby's name normalization patterns
export const SOTHEBYS_PATTERNS = [
  /sotheby/i,
  /rlsir/i,
  /russ\s*lyon/i,
] as const;

export const SOTHEBYS_DISPLAY_NAME = "Russ Lyon Sotheby's International Realty";

// Chart dimensions
export const CHART_PREVIEW = { width: 700, height: 500 } as const;
export const CHART_EXPORT = { width: 1080, height: 960 } as const;

// Export font scaling (1.5x for export canvas)
export const FONT_SCALE = {
  preview: { title: 16, labels: 12, ticks: 11, datalabels: 13 },
  export: { title: 26, labels: 18, ticks: 18, datalabels: 20 },
} as const;

// Max brokerages to display
export const MAX_BROKERAGES_PREVIEW = 15;
export const MAX_BROKERAGES_EXPORT = 10;

// FH format column indices
export const FH_COLUMNS = {
  rank: 0,
  brand: 1,
  dollarVolume: 2,    // Total ($)
  percentChange: 3,
  marketShareDollar: 6, // Market Share ($)
  totalSales: 8,       // Total (#)
  marketShareUnits: 12, // Market Share (#)
  avgPrice: 14,
  saleToListRatio: 15,
  daysOnMarket: 16,
  pricePerSqFt: 17,
} as const;

// ColumnType2 format column indices
export const CT2_COLUMNS = {
  brand: 1,
  dollarVolume: 3,
  totalSales: 6,
  mktPercent: 8,       // "Mkt %" header
  daysOnMarket: 9,
  avgPrice: 10,
  pricePerSqFt: 11,
  saleToListRatio: 12,
} as const;

// Developer contact for error alerts
export const DEVELOPER_CONTACT = {
  message: 'Something looks off. Do not distribute this report.',
  action: 'Contact the developer before proceeding.',
} as const;
