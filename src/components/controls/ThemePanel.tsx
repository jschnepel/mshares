import { useMarketStore } from '@/store/marketStore';
import { ColorPicker } from './ColorPicker';
import { GradientBuilder } from './GradientBuilder';
import { defaultThemeConfig, defaultLightPalette, defaultDarkPalette, defaultLightGradient, defaultDarkGradient } from '@/lib/themeDefaults';
import { Sun, Moon, RotateCcw } from 'lucide-react';
import type { PageTheme, FontChoice, ColorPalette, GradientConfig } from '@/types';

const HEADING_FONTS: FontChoice[] = [
  'Playfair Display',
  'Cormorant Garamond',
  'Lora',
  'DM Serif Display',
];

const BODY_FONTS: FontChoice[] = [
  'Inter',
  'Montserrat',
  'Raleway',
  'Source Sans 3',
];

export function ThemePanel() {
  const { pageTheme, setPageTheme, themeConfig, setThemeConfig } = useMarketStore();

  const updatePalette = (patch: Partial<ColorPalette>) =>
    setThemeConfig({ ...themeConfig, palette: { ...themeConfig.palette, ...patch } });

  const updateGradient = (g: GradientConfig) =>
    setThemeConfig({ ...themeConfig, rlsirGradient: g });

  const updateFont = (key: 'fontHeading' | 'fontBody', v: FontChoice) =>
    setThemeConfig({ ...themeConfig, [key]: v });

  const reset = () => {
    const pal = pageTheme === 'dark' ? defaultDarkPalette() : defaultLightPalette();
    const grad = pageTheme === 'dark' ? defaultDarkGradient() : defaultLightGradient();
    setThemeConfig({ ...defaultThemeConfig(), palette: pal, rlsirGradient: grad });
  };

  return (
    <div className="glass rounded-lg p-3 space-y-3">
      <span className="text-[10px] uppercase tracking-widest text-gold font-semibold block">
        Theme
      </span>

      {/* Light / Dark */}
      <div className="space-y-1">
        {([
          { id: 'light' as PageTheme, icon: <Sun size={14} />, label: 'Light' },
          { id: 'dark' as PageTheme, icon: <Moon size={14} />, label: 'Dark' },
        ]).map(t => (
          <button
            key={t.id}
            onClick={() => {
              setPageTheme(t.id);
              const pal = t.id === 'dark' ? defaultDarkPalette() : defaultLightPalette();
              const grad = t.id === 'dark' ? defaultDarkGradient() : defaultLightGradient();
              setThemeConfig({ ...themeConfig, palette: pal, rlsirGradient: grad });
            }}
            className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium transition-all
              ${pageTheme === t.id
                ? 'bg-gold/15 text-gold border border-gold/20'
                : 'text-gray-muted hover:text-cream hover:bg-navy-light/50 border border-transparent'
              }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="border-t border-navy-medium/50" />

      {/* Colors */}
      <div className="space-y-2">
        <span className="text-[9px] uppercase tracking-widest text-gray-muted font-medium block">Colors</span>
        <ColorPicker label="RLSIR Primary" value={themeConfig.palette.rlsirPrimary} onChange={c => updatePalette({ rlsirPrimary: c })} />
        <ColorPicker label="Accent" value={themeConfig.palette.accent} onChange={c => updatePalette({ accent: c })} />
        <ColorPicker label="Competitor Base" value={themeConfig.palette.competitorBase} onChange={c => updatePalette({ competitorBase: c })} />
        <ColorPicker label="Competitor Fade" value={themeConfig.palette.competitorFade} onChange={c => updatePalette({ competitorFade: c })} />
      </div>

      {/* Gradient */}
      <div className="border-t border-navy-medium/50" />
      <GradientBuilder value={themeConfig.rlsirGradient} onChange={updateGradient} />

      {/* Fonts */}
      <div className="border-t border-navy-medium/50" />
      <div className="space-y-2">
        <span className="text-[9px] uppercase tracking-widest text-gray-muted font-medium block">Fonts</span>
        <div>
          <label className="text-[9px] text-gray-muted block mb-0.5">Heading</label>
          <select
            value={themeConfig.fontHeading}
            onChange={e => updateFont('fontHeading', e.target.value as FontChoice)}
            className="w-full bg-navy-light/60 border border-navy-medium rounded px-1.5 py-1 text-[11px] text-cream"
            style={{ fontFamily: themeConfig.fontHeading }}
          >
            {HEADING_FONTS.map(f => (
              <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[9px] text-gray-muted block mb-0.5">Body</label>
          <select
            value={themeConfig.fontBody}
            onChange={e => updateFont('fontBody', e.target.value as FontChoice)}
            className="w-full bg-navy-light/60 border border-navy-medium rounded px-1.5 py-1 text-[11px] text-cream"
            style={{ fontFamily: themeConfig.fontBody }}
          >
            {BODY_FONTS.map(f => (
              <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Reset */}
      <button
        onClick={reset}
        className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] text-gray-muted hover:text-cream hover:bg-navy-light/50 border border-transparent transition-all"
      >
        <RotateCcw size={12} />
        Reset to Defaults
      </button>
    </div>
  );
}
