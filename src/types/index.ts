export type FileFormat = 'FH' | 'ColumnType2' | 'unknown';

export type ShareType = 'dollar' | 'units';

export type VisualizationType = 'bar' | 'treemap' | 'sankey';

export type FileStatus = 'parsing' | 'validating' | 'ready' | 'warning' | 'error';

export type ExportFormat = 'png' | 'pdf' | 'both';

export type PageTheme = 'light' | 'dark';

export interface BrokerageData {
  rank: number;
  name: string;
  originalName: string;
  dollarVolume: number;
  marketShareDollar: number;
  marketShareUnits: number;
  totalSales: number;
  avgPrice: number;
  daysOnMarket: number;
  pricePerSqFt: number;
  saleToListRatio: number;
  percentChange: number;
  isSothebys: boolean;
}

export interface MarketData {
  id: string;
  fileName: string;
  marketName: string;
  format: FileFormat;
  brokerages: BrokerageData[];
  sothebysData: BrokerageData | null;
  isRlsirFirstByDollar: boolean;
  isRlsirFirstByUnits: boolean;
  availableViews: ShareType[];
  totalMarketDollar: number;
  totalMarketUnits: number;
  status: FileStatus;
  warnings: string[];
  errors: string[];
  processedAt: number;
}

export interface KPIMetrics {
  totalSales: number;
  avgPrice: number;
  daysOnMarket: number;
  pricePerSqFt: number;
  saleToListRatio: number;
  dollarVolume: number;
  marketShareDollar: number;
  marketShareUnits: number;
  gapToSecond: number;
  secondPlaceName: string;
}

export interface ExportOptions {
  format: ExportFormat;
  visualization: VisualizationType | 'all';
  includeHeader: boolean;
  includeMetrics: boolean;
  includeSummary: boolean;
  topN: number;
}

export interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
}
