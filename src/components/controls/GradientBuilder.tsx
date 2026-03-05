import { ColorPicker } from './ColorPicker';
import { gradientToCss } from '@/lib/themeDefaults';
import type { GradientConfig } from '@/types';
import { ToggleLeft, ToggleRight } from 'lucide-react';

interface GradientBuilderProps {
  value: GradientConfig;
  onChange: (g: GradientConfig) => void;
}

const DIRECTIONS: { id: GradientConfig['direction']; label: string }[] = [
  { id: 'horizontal', label: '→' },
  { id: 'vertical', label: '↓' },
  { id: 'diagonal', label: '↘' },
];

export function GradientBuilder({ value, onChange }: GradientBuilderProps) {
  const update = (patch: Partial<GradientConfig>) => onChange({ ...value, ...patch });

  return (
    <div className="space-y-2">
      {/* Enable toggle */}
      <button
        onClick={() => update({ enabled: !value.enabled })}
        className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all
          ${value.enabled
            ? 'bg-gold/15 text-gold border border-gold/20'
            : 'text-gray-muted hover:text-cream hover:bg-navy-light/50 border border-transparent'
          }`}
      >
        <span>Bar Gradient</span>
        {value.enabled ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
      </button>

      {value.enabled && (
        <>
          {/* Preview bar */}
          <div
            className="h-4 rounded-md border border-navy-medium"
            style={{ background: gradientToCss(value) }}
          />

          {/* Color stops */}
          <ColorPicker label="Start" value={value.colorStart} onChange={c => update({ colorStart: c })} />
          {value.colorMid !== undefined && (
            <ColorPicker label="Mid" value={value.colorMid} onChange={c => update({ colorMid: c })} />
          )}
          <ColorPicker label="End" value={value.colorEnd} onChange={c => update({ colorEnd: c })} />

          {/* Mid-color toggle */}
          <button
            onClick={() => update({ colorMid: value.colorMid !== undefined ? undefined : value.colorStart })}
            className="text-[9px] text-gray-muted hover:text-cream"
          >
            {value.colorMid !== undefined ? '- Remove mid color' : '+ Add mid color'}
          </button>

          {/* Direction */}
          <div className="flex items-center gap-1">
            <span className="text-[9px] text-gray-muted mr-1">Direction</span>
            {DIRECTIONS.map(d => (
              <button
                key={d.id}
                onClick={() => update({ direction: d.id })}
                className={`w-6 h-6 rounded text-xs flex items-center justify-center transition-all
                  ${value.direction === d.id
                    ? 'bg-gold/15 text-gold border border-gold/20'
                    : 'text-gray-muted hover:text-cream bg-navy-light/50 border border-transparent'
                  }`}
                title={d.id}
              >
                {d.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
