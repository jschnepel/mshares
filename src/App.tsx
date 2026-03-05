import { ErrorBoundary } from '@/components/ErrorBoundary';
import { TemplateGallery } from '@/components/TemplateGallery';
import { WorkspaceShell } from '@/components/WorkspaceShell';
import { DetectionModal } from '@/components/builder/DetectionModal';
import { useProjectStore } from '@/store/projectStore';

function App() {
  const appPhase = useProjectStore(s => s.appPhase);

  return (
    <ErrorBoundary>
      {appPhase === 'gallery' && <TemplateGallery />}
      {appPhase === 'workspace' && <WorkspaceShell />}

      {/* Floating modals — always mounted */}
      <DetectionModal />
    </ErrorBoundary>
  );
}

export default App;
