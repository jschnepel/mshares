import { MetricRibbon } from '@/components/layout/MetricRibbon';
import { DropZone } from '@/components/upload/DropZone';
import { BatchQueue } from '@/components/upload/BatchQueue';
import { ChartView } from '@/components/charts/ChartView';
import { ExportControls } from '@/components/export/ExportControls';
import { PreviewModal } from '@/components/preview/PreviewModal';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <div className="h-screen flex bg-navy-deep text-cream overflow-hidden">
        {/* Main layout */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Metric ribbon */}
          <MetricRibbon />

          {/* Content area */}
          <div className="flex-1 flex min-h-0">
            {/* Left panel: Upload + Queue + Export */}
            <div className="w-72 shrink-0 border-r border-navy-medium flex flex-col bg-navy-deep/50">
              <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2">
                {/* Brand header */}
                <div className="mb-3">
                  <h1 className="font-serif text-lg text-cream font-semibold leading-tight">
                    Market Intelligence
                  </h1>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-gold mt-0.5">
                    Russ Lyon Sotheby's
                  </p>
                </div>

                <DropZone />
                <BatchQueue />
              </div>

              <div className="shrink-0">
                <ExportControls />
              </div>
            </div>

            {/* Main chart area */}
            <ChartView />
          </div>
        </div>

        {/* Preview modal */}
        <PreviewModal />
      </div>
    </ErrorBoundary>
  );
}

export default App;
