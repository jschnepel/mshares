export type FileFormat = 'FH' | 'ColumnType2' | 'unknown';

export type ShareType = 'dollar' | 'units';

export type VisualizationType = 'bar' | 'treemap' | 'sankey' | 'donut' | 'lollipop';

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
  chartTitle?: string;
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

// ── Template / Project types ──

export type TemplateId = 'market-share' | 'custom-chart' | 'comparison-dashboard' | 'quick-summary';
export type AppPhase = 'gallery' | 'workspace';

export type SimpleChartType = 'bar' | 'line' | 'area' | 'donut' | 'pie' | 'scatter';

export interface ProjectState {
  id: string;
  templateId: TemplateId;
  name: string;
  fileName: string | null;
  sheetIndex: number;
  createdAt: number;
  lastModifiedAt: number;
  marketShareConfig?: {
    shareType: ShareType;
    visualization: VisualizationType;
    showKPI: boolean;
    showSummary: boolean;
    pageTheme: PageTheme;
    themeConfig: ThemeConfig;
    dateStart: string;
    dateEnd: string;
  };
  customChartConfig?: {
    chartType: SimpleChartType;
    labelColumn: number | null;
    valueColumns: number[];
    chartTitle: string;
    seriesColors: Record<number, string>;
    showDataLabels: boolean;
    showLegend: boolean;
    bgColor: string;
  };
}

export type KPILayout = 'grid-3col' | 'grid-2col' | 'horizontal-strip' | 'card-stack';

export type FontChoice =
  | 'Playfair Display'
  | 'Cormorant Garamond'
  | 'Lora'
  | 'DM Serif Display'
  | 'Inter'
  | 'Montserrat'
  | 'Raleway'
  | 'Source Sans 3';

export interface ColorPalette {
  rlsirPrimary: string;
  rlsirSecondary: string;
  competitorBase: string;
  competitorFade: string;
  accent: string;
  background: string;
  foreground: string;
}

export interface GradientConfig {
  enabled: boolean;
  colorStart: string;
  colorMid?: string;
  colorEnd: string;
  direction: 'horizontal' | 'vertical' | 'diagonal';
}

export interface ThemeConfig {
  palette: ColorPalette;
  rlsirGradient: GradientConfig;
  fontHeading: FontChoice;
  fontBody: FontChoice;
}

// ── Chart Builder types ──

export type ColumnDataType = 'integer' | 'float' | 'percentage' | 'currency' | 'date' | 'string';

export interface ColumnMeta {
  index: number;
  header: string;
  displayName: string;
  dataType: ColumnDataType;
  precision: number;
  included: boolean;
  sampleValues: unknown[];
}

export interface RowMeta {
  index: number;
  included: boolean;
}

export interface ParsedSheet {
  name: string;
  rawData: unknown[][];
  columns: ColumnMeta[];
  rows: RowMeta[];
  totalRows: number;
  totalCols: number;
}

export interface ParsedWorkbook {
  id: string;
  fileName: string;
  sheets: ParsedSheet[];
  activeSheetIndex: number;
  loadedAt: number;
}
