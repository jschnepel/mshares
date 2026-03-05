import { createRoot } from 'react-dom/client';
import html2canvas from 'html2canvas-pro';
import { BrandedPage } from '@/components/charts/ChartView';
import { useMarketStore } from '@/store/marketStore';
import type { MarketData, ShareType, ExportFormat, VisualizationType, PageTheme, ColorPalette, GradientConfig } from '@/types';
import {
  exportBatchAsZip,
  type BatchExportItem,
} from '@/lib/exportEngine';

/**
 * WYSIWYG export: render at the same size as the preview (600px wide, 8.5:11 ratio),
 * then capture at 4x scale for high-resolution output (~2400×3104 px).
 */
const RENDER_WIDTH = 600;
const RENDER_HEIGHT = Math.round(RENDER_WIDTH * (11 / 8.5)); // 776

export interface ExportConfig {
  visualization: VisualizationType;
  showKPI: boolean;
  showSummary: boolean;
  pageTheme: PageTheme;
  palette?: ColorPalette;
  gradient?: GradientConfig;
  fontHeading?: string;
  fontBody?: string;
}

/**
 * Preload an image and return a promise that resolves when loaded.
 */
function preloadImage(src: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve();
    img.onerror = () => resolve(); // Don't block export on image failure
    img.src = src;
  });
}

/**
 * Renders the full branded page offscreen at preview dimensions, captures at 4x.
 */
async function renderAndCapture(
  market: MarketData,
  shareType: ShareType,
  config: ExportConfig,
  heroUrl: string,
  heroCrop: { x: number; y: number },
): Promise<string> {
  const bgColor = config.pageTheme === 'dark' ? '#002349' : '#ffffff';

  // Preload the hero image to avoid blank captures
  if (heroUrl) await preloadImage(heroUrl);

  // Create hidden container at preview dimensions
  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed; left: -9999px; top: 0;
    width: ${RENDER_WIDTH}px; height: ${RENDER_HEIGHT}px;
    overflow: hidden; background: ${bgColor}; z-index: -1;
  `;
  document.body.appendChild(container);

  // Render the branded page at its natural preview size (WYSIWYG)
  const root = createRoot(container);
  root.render(
    <BrandedPage
      market={market}
      shareType={shareType}
      visualization={config.visualization}
      heroUrl={heroUrl}
      heroCrop={heroCrop}
      showKPI={config.showKPI}
      showSummary={config.showSummary}
      pageTheme={config.pageTheme}
      palette={config.palette}
      gradient={config.gradient}
      fontHeading={config.fontHeading}
      fontBody={config.fontBody}
    />
  );

  // Wait for React render + Chart.js animation (disabled in branded mode) + image paint
  await new Promise(r => setTimeout(r, 2000));

  // Capture at 4x scale for high-resolution output
  const canvas = await html2canvas(container, {
    width: RENDER_WIDTH,
    height: RENDER_HEIGHT,
    scale: 4,
    useCORS: true,
    allowTaint: false,
    backgroundColor: bgColor,
    logging: false,
  });

  const dataUrl = canvas.toDataURL('image/png', 1.0);

  // Cleanup
  root.unmount();
  document.body.removeChild(container);

  return dataUrl;
}

/**
 * Export multiple market reports as a ZIP.
 */
export async function exportBatchReports(
  markets: MarketData[],
  shareType: ShareType,
  format: ExportFormat,
  onProgress?: (current: number, total: number) => void,
  config?: ExportConfig,
): Promise<void> {
  const exportConfig = config ?? { visualization: 'bar', showKPI: false, showSummary: false, pageTheme: 'light' as PageTheme };
  const items: BatchExportItem[] = [];
  const store = useMarketStore.getState();

  for (let i = 0; i < markets.length; i++) {
    const market = markets[i];
    const marketShareType = market.availableViews.includes(shareType)
      ? shareType
      : market.availableViews[0];

    if (!marketShareType) continue;

    // Get the per-market hero image + crop from the store
    const heroState = store.getHeroImage(market.id);

    const chartDataUrl = await renderAndCapture(market, marketShareType, exportConfig, heroState.url, heroState.crop);
    items.push({ market, shareType: marketShareType, chartDataUrl });
    onProgress?.(i + 1, markets.length);
  }

  if (items.length === 0) {
    throw new Error('No charts to export');
  }

  await exportBatchAsZip(items, format);
}
