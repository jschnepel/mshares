import { useCallback, useRef, useState } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { useMarketStore } from '@/store/marketStore';
import { useBuilderStore } from '@/store/builderStore';
import { getTemplate } from '@/lib/templateRegistry';
import { ChevronLeft, Save, FolderOpen } from 'lucide-react';

export function PrimaryNav() {
  const activeTemplateId = useProjectStore(s => s.activeTemplateId);
  const projectName = useProjectStore(s => s.projectName);
  const setProjectName = useProjectStore(s => s.setProjectName);
  const navigateToGallery = useProjectStore(s => s.navigateToGallery);
  const saveProject = useProjectStore(s => s.saveProject);
  const loadProject = useProjectStore(s => s.loadProject);
  const hasMarkets = useMarketStore(s => s.markets.length > 0);
  const hasWorkbook = useBuilderStore(s => s.workbook !== null);

  const loadInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(projectName);

  const template = activeTemplateId ? getTemplate(activeTemplateId) : null;

  const handleStartEdit = useCallback(() => {
    setEditValue(projectName);
    setIsEditing(true);
  }, [projectName]);

  const handleFinishEdit = useCallback(() => {
    const trimmed = editValue.trim();
    if (trimmed) setProjectName(trimmed);
    setIsEditing(false);
  }, [editValue, setProjectName]);

  const handleLoadFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        loadProject(reader.result);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [loadProject]);

  return (
    <nav className="shrink-0 flex items-center border-b border-navy-medium bg-navy-deep">
      {/* Back to gallery — GAP 13: confirm if data is loaded */}
      <button
        onClick={() => {
          const hasData = hasMarkets || hasWorkbook;
          if (hasData && !window.confirm('Leave workspace? Any unsaved progress will be lost.')) return;
          navigateToGallery();
        }}
        className="flex items-center gap-1 px-4 py-2.5 text-xs text-gray-muted hover:text-cream transition-colors"
        title="Back to templates"
      >
        <ChevronLeft size={14} />
      </button>

      <div className="w-px h-5 bg-navy-medium shrink-0" />

      {/* Template badge */}
      {template && (
        <span className="ml-3 px-2.5 py-1 rounded-md text-[10px] font-medium uppercase tracking-wider bg-gold/10 text-gold border border-gold/20">
          {template.name}
        </span>
      )}

      {/* Project name — click to edit */}
      <div className="ml-3">
        {isEditing ? (
          <input
            autoFocus
            type="text"
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onBlur={handleFinishEdit}
            onKeyDown={e => { if (e.key === 'Enter') handleFinishEdit(); if (e.key === 'Escape') setIsEditing(false); }}
            className="bg-navy-light/30 border border-gold/30 rounded px-2 py-1 text-xs text-cream focus:outline-none focus:border-gold/60 w-48"
          />
        ) : (
          <button
            onClick={handleStartEdit}
            className="text-xs text-cream/70 hover:text-cream transition-colors px-1"
            title="Click to rename"
          >
            {projectName}
          </button>
        )}
      </div>

      {/* Right side — save/load + branding */}
      <div className="ml-auto pr-5 flex items-center gap-3">
        {/* Save */}
        <button
          onClick={saveProject}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[11px] text-gray-muted hover:text-cream bg-navy-light/30 hover:bg-navy-light/50 border border-navy-medium/40 transition-colors"
          title="Save project"
        >
          <Save size={12} />
          Save
        </button>

        {/* Load */}
        <button
          onClick={() => loadInputRef.current?.click()}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[11px] text-gray-muted hover:text-cream bg-navy-light/30 hover:bg-navy-light/50 border border-navy-medium/40 transition-colors"
          title="Open project"
        >
          <FolderOpen size={12} />
          Open
        </button>
        <input
          ref={loadInputRef}
          type="file"
          accept=".json,.lex.json"
          onChange={handleLoadFile}
          className="hidden"
        />

        <div className="w-px h-4 bg-navy-medium/40" />

        {/* Brand */}
        <span className="font-serif text-sm text-cream/70 font-semibold">Lex</span>
        <span className="text-[9px] uppercase tracking-[0.15em] text-gold/60">RLSIR</span>
      </div>
    </nav>
  );
}
