import { create } from 'zustand';
import * as XLSX from 'xlsx';
import type { AppPhase, TemplateId } from '@/types';
import { detectFormat } from '@/lib/fileProcessor';
import { useMarketStore } from './marketStore';
import { useBuilderStore } from './builderStore';
import {
  serializeProject,
  downloadProjectJson,
  parseProjectJson,
  restoreProjectConfig,
} from '@/lib/projectSerializer';

interface DetectionModalState {
  open: boolean;
  detectedFormat: string | null;
  pendingFiles: File[];
  pendingTemplateId: TemplateId | null;
}

interface ProjectStore {
  appPhase: AppPhase;
  activeTemplateId: TemplateId | null;
  projectName: string;
  needsFileReupload: boolean;

  detectionModal: DetectionModalState;

  // Actions
  setAppPhase: (phase: AppPhase) => void;
  navigateToGallery: () => void;
  navigateToWorkspace: (templateId: TemplateId) => void;
  setProjectName: (name: string) => void;
  clearReuploadFlag: () => void;

  // File ingestion
  ingestFiles: (files: File[], targetTemplate: TemplateId) => Promise<void>;
  confirmDetection: (useDetectedTemplate: boolean) => Promise<void>;
  dismissDetection: () => void;

  // Save / Load
  saveProject: () => void;
  loadProject: (json: string) => void;
}

const EMPTY_DETECTION: DetectionModalState = {
  open: false,
  detectedFormat: null,
  pendingFiles: [],
  pendingTemplateId: null,
};

export const useProjectStore = create<ProjectStore>((set, get) => ({
  appPhase: 'gallery',
  activeTemplateId: null,
  projectName: 'Untitled Project',
  needsFileReupload: false,

  detectionModal: { ...EMPTY_DETECTION },

  setAppPhase: (phase) => set({ appPhase: phase }),

  navigateToGallery: () => {
    useMarketStore.getState().clearAll();
    useBuilderStore.getState().clearWorkbook();
    set({
      appPhase: 'gallery',
      activeTemplateId: null,
      needsFileReupload: false,
      projectName: 'Untitled Project',
      detectionModal: { ...EMPTY_DETECTION },
    });
  },

  navigateToWorkspace: (templateId) => set({
    appPhase: 'workspace',
    activeTemplateId: templateId,
  }),

  setProjectName: (name) => set({ projectName: name }),

  clearReuploadFlag: () => set({ needsFileReupload: false }),

  ingestFiles: async (files, targetTemplate) => {
    set({ needsFileReupload: false });

    // For market share template → route directly
    if (targetTemplate === 'market-share') {
      set({
        appPhase: 'workspace',
        activeTemplateId: 'market-share',
        projectName: files[0]?.name.replace(/\.(csv|xlsx?|xls)$/i, '') ?? 'Market Report',
      });
      await useMarketStore.getState().addFiles(files);
      return;
    }

    // For custom-chart: detect if it's a known market share format
    const file = files[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawData: (string | number)[][] = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        defval: '',
        blankrows: false,
      });

      if (rawData.length >= 2) {
        const headers = rawData[0].map(h => String(h).replace(/^\uFEFF/, '').trim());
        const format = detectFormat(headers);

        if (format !== 'unknown') {
          set({
            detectionModal: {
              open: true,
              detectedFormat: format,
              pendingFiles: files,
              pendingTemplateId: targetTemplate,
            },
          });
          return;
        }
      }
    } catch {
      // If detection fails, proceed to builder
    }

    // No known format → load into builder directly
    set({
      appPhase: 'workspace',
      activeTemplateId: 'custom-chart',
      projectName: file.name.replace(/\.(csv|xlsx?|xls)$/i, ''),
    });
    await useBuilderStore.getState().loadFile(file);
  },

  confirmDetection: async (useDetectedTemplate) => {
    const { detectionModal } = get();
    const files = detectionModal.pendingFiles;

    if (useDetectedTemplate) {
      // Route to market share template
      set({
        appPhase: 'workspace',
        activeTemplateId: 'market-share',
        projectName: files[0]?.name.replace(/\.(csv|xlsx?|xls)$/i, '') ?? 'Market Report',
        detectionModal: { ...EMPTY_DETECTION },
      });
      await useMarketStore.getState().addFiles(files);
    } else {
      // Load into builder
      const file = files[0];
      set({
        detectionModal: { ...EMPTY_DETECTION },
        appPhase: 'workspace',
        activeTemplateId: 'custom-chart',
        projectName: files[0]?.name.replace(/\.(csv|xlsx?|xls)$/i, '') ?? 'Custom Chart',
      });
      if (file) {
        await useBuilderStore.getState().loadFile(file);
      }
    }
  },

  dismissDetection: () => set({ detectionModal: { ...EMPTY_DETECTION } }),

  saveProject: () => {
    const { activeTemplateId, projectName } = get();
    if (!activeTemplateId) return;
    const project = serializeProject(activeTemplateId, projectName);
    downloadProjectJson(project);
  },

  loadProject: (json) => {
    const project = parseProjectJson(json);
    if (!project) return;
    restoreProjectConfig(project);
    set({
      appPhase: 'workspace',
      activeTemplateId: project.templateId,
      projectName: project.name,
      needsFileReupload: true,
    });
  },
}));
