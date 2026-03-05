import { useCallback, useState, useRef } from 'react';
import { BarChart3, Wrench, LayoutDashboard, FileText, FileSpreadsheet, Lock, Upload } from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import { TEMPLATE_REGISTRY, type TemplateDefinition } from '@/lib/templateRegistry';
import type { TemplateId } from '@/types';

const ACCEPTED_TYPES = [
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];
const ACCEPTED_EXTENSIONS = ['.csv', '.xlsx', '.xls'];

function isAcceptedFile(file: File): boolean {
  if (ACCEPTED_TYPES.includes(file.type)) return true;
  return ACCEPTED_EXTENSIONS.some(ext => file.name.toLowerCase().endsWith(ext));
}

const ICON_MAP: Record<TemplateId, typeof BarChart3> = {
  'market-share': BarChart3,
  'custom-chart': Wrench,
  'comparison-dashboard': LayoutDashboard,
  'quick-summary': FileText,
};

function TemplateCard({ template }: { template: TemplateDefinition }) {
  const ingestFiles = useProjectStore(s => s.ingestFiles);
  const navigateToWorkspace = useProjectStore(s => s.navigateToWorkspace);
  const setProjectName = useProjectStore(s => s.setProjectName);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const Icon = ICON_MAP[template.id] ?? FileText;

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!template.isAvailable) return;
    const files = Array.from(e.dataTransfer.files).filter(isAcceptedFile);
    if (files.length > 0) {
      ingestFiles(files, template.id);
    }
  }, [template.id, template.isAvailable, ingestFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (template.isAvailable) setIsDragging(true);
  }, [template.isAvailable]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  }, []);

  const handleClick = useCallback(() => {
    if (!template.isAvailable) return;
    setProjectName(`New ${template.name}`);
    navigateToWorkspace(template.id);
  }, [template.id, template.name, template.isAvailable, navigateToWorkspace, setProjectName]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).filter(isAcceptedFile);
    if (files.length > 0) {
      ingestFiles(files, template.id);
    }
    e.target.value = '';
  }, [template.id, ingestFiles]);

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`group relative rounded-2xl border-2 border-dashed transition-all duration-300 overflow-hidden
        ${!template.isAvailable
          ? 'border-navy-medium/50 opacity-60 cursor-default'
          : isDragging
            ? 'border-gold bg-gold/5 scale-[1.02]'
            : 'border-navy-medium hover:border-gold/40 hover:scale-[1.02] cursor-pointer'
        }`}
    >
      {/* Gradient thumbnail */}
      <div
        onClick={handleClick}
        className={`h-32 bg-gradient-to-br ${template.thumbnailGradient} flex items-center justify-center relative`}
      >
        {!template.isAvailable && (
          <div className="absolute inset-0 bg-navy-deep/60 flex items-center justify-center">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-navy-medium/80 border border-navy-medium">
              <Lock size={12} className="text-gray-muted" />
              <span className="text-[10px] text-gray-muted font-medium uppercase tracking-wider">Coming Soon</span>
            </div>
          </div>
        )}
        {isDragging ? (
          <FileSpreadsheet size={36} className="text-gold" />
        ) : (
          <Icon
            size={36}
            className={`transition-colors duration-300 ${template.isAvailable ? 'text-cream/30 group-hover:text-cream/50' : 'text-cream/15'}`}
          />
        )}
      </div>

      {/* Content */}
      <div onClick={handleClick} className="p-5">
        <h3 className="font-serif text-base text-cream mb-1">{template.name}</h3>
        <p className="text-[11px] text-gray-muted leading-relaxed mb-3">{template.description}</p>
        <p className="text-[10px] text-gold/50">{template.tagline}</p>
      </div>

      {/* Upload button for available templates */}
      {template.isAvailable && (
        <div className="px-5 pb-4">
          <button
            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[11px] text-gray-muted hover:text-cream bg-navy-light/30 hover:bg-navy-light/50 border border-navy-medium/60 transition-colors"
          >
            <Upload size={12} />
            Upload File
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            multiple={template.id === 'market-share'}
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
}

export function TemplateGallery() {
  const loadProject = useProjectStore(s => s.loadProject);
  const loadInputRef = useRef<HTMLInputElement>(null);

  const handleLoadProject = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
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
    <div className="h-screen flex flex-col items-center justify-center bg-navy-deep relative">
      {/* Heading */}
      <div className="text-center mb-10">
        <h1 className="font-serif text-5xl text-cream/90 font-bold tracking-tight mb-2">
          Market Analytics Builder
        </h1>
        <p className="text-[11px] uppercase tracking-[0.25em] text-gold/50 font-medium">
          Russ Lyon Sotheby's International Realty
        </p>
      </div>

      {/* Template grid — 2×2 */}
      <div className="grid grid-cols-2 gap-5 max-w-2xl w-full px-6">
        {TEMPLATE_REGISTRY.map(t => (
          <TemplateCard key={t.id} template={t} />
        ))}
      </div>

      {/* Load project */}
      <div className="mt-6">
        <button
          onClick={() => loadInputRef.current?.click()}
          className="text-[11px] text-gray-muted hover:text-cream underline transition-colors"
        >
          Open a saved project (.lex.json)
        </button>
        <input
          ref={loadInputRef}
          type="file"
          accept=".json,.lex.json"
          onChange={handleLoadProject}
          className="hidden"
        />
      </div>

      {/* Signature */}
      <span className="absolute bottom-4 right-6 text-[9px] text-cream/20 select-none">
        Joey Schnepel
      </span>
    </div>
  );
}
