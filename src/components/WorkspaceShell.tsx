import { useProjectStore } from '@/store/projectStore';
import { useMarketStore } from '@/store/marketStore';
import { PrimaryNav } from '@/components/controls/PrimaryNav';
import { MetricRibbon } from '@/components/layout/MetricRibbon';
import { DropZone } from '@/components/upload/DropZone';
import { BatchQueue } from '@/components/upload/BatchQueue';
import { ChartView } from '@/components/charts/ChartView';
import { ExportControls } from '@/components/export/ExportControls';
import { ExportProgressModal } from '@/components/export/ExportProgressModal';
import { PreviewModal } from '@/components/preview/PreviewModal';
import { ChartBuilder } from '@/components/builder/ChartBuilder';
import { Upload } from 'lucide-react';

function ReuploadBanner() {
  const needsFileReupload = useProjectStore(s => s.needsFileReupload);

  if (!needsFileReupload) return null;

  return (
    <div className="shrink-0 bg-gold/10 border-b border-gold/20 px-4 py-2 flex items-center gap-2">
      <Upload size={14} className="text-gold" />
      <span className="text-xs text-cream">
        Project config restored. Please re-upload your data file to continue.
      </span>
    </div>
  );
}

function MarketShareWorkspace() {
  const hasMarkets = useMarketStore(s => s.markets.length > 0);

  return (
    <>
      {hasMarkets && <MetricRibbon />}
      <div className="flex-1 flex min-h-0">
        {hasMarkets && (
          <div className="w-72 shrink-0 border-r border-navy-medium flex flex-col bg-navy-deep/50">
            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2">
              <DropZone />
              <BatchQueue />
            </div>
            <div className="shrink-0">
              <ExportControls />
            </div>
          </div>
        )}
        <ChartView />
      </div>
      <PreviewModal />
      <ExportProgressModal />
    </>
  );
}

function CustomChartWorkspace() {
  return (
    <div className="flex-1 flex min-h-0">
      <ChartBuilder />
    </div>
  );
}

function FallbackWorkspace() {
  const navigateToGallery = useProjectStore(s => s.navigateToGallery);
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-muted mb-4">No template selected.</p>
        <button
          onClick={navigateToGallery}
          className="px-4 py-2 rounded-lg text-sm text-cream bg-navy-light/60 hover:bg-navy-light border border-navy-medium transition-colors"
        >
          Back to Templates
        </button>
      </div>
    </div>
  );
}

export function WorkspaceShell() {
  const activeTemplateId = useProjectStore(s => s.activeTemplateId);

  return (
    <div className="h-screen flex flex-col bg-navy-deep text-cream overflow-hidden">
      <PrimaryNav />
      <ReuploadBanner />

      {activeTemplateId === 'market-share' && <MarketShareWorkspace />}
      {activeTemplateId === 'custom-chart' && <CustomChartWorkspace />}
      {activeTemplateId !== 'market-share' && activeTemplateId !== 'custom-chart' && <FallbackWorkspace />}
    </div>
  );
}
