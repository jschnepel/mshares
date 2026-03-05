import type { TemplateId } from '@/types';

export interface TemplateDefinition {
  id: TemplateId;
  name: string;
  description: string;
  tagline: string;
  isAvailable: boolean;
  wizardSteps: string[];
  thumbnailGradient: string;
  acceptsFileTypes: string[];
}

export const TEMPLATE_REGISTRY: TemplateDefinition[] = [
  {
    id: 'market-share',
    name: 'Market Share Report',
    description: 'Branded market share reports with multiple chart types.',
    tagline: 'Drop FH or ColumnType2 files',
    isAvailable: true,
    wizardSteps: [],
    thumbnailGradient: 'from-amber-600/20 to-yellow-900/30',
    acceptsFileTypes: ['.csv', '.xlsx', '.xls'],
  },
  {
    id: 'custom-chart',
    name: 'Custom Chart',
    description: 'Build any chart from any spreadsheet.',
    tagline: 'Drop file, pick columns, export',
    isAvailable: false,
    wizardSteps: [],
    thumbnailGradient: 'from-blue-600/20 to-indigo-900/30',
    acceptsFileTypes: ['.csv', '.xlsx', '.xls'],
  },
  {
    id: 'comparison-dashboard',
    name: 'Comparison Dashboard',
    description: 'Side-by-side performance comparisons.',
    tagline: 'Compare at a glance',
    isAvailable: false,
    wizardSteps: [],
    thumbnailGradient: 'from-emerald-600/20 to-teal-900/30',
    acceptsFileTypes: ['.csv', '.xlsx', '.xls'],
  },
  {
    id: 'quick-summary',
    name: 'Quick Summary',
    description: 'Auto-generated KPI cards from any dataset.',
    tagline: 'Key metrics in seconds',
    isAvailable: false,
    wizardSteps: [],
    thumbnailGradient: 'from-purple-600/20 to-violet-900/30',
    acceptsFileTypes: ['.csv', '.xlsx', '.xls'],
  },
];

export function getTemplate(id: TemplateId): TemplateDefinition | undefined {
  return TEMPLATE_REGISTRY.find(t => t.id === id);
}
