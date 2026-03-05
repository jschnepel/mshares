import type { ColorPalette, GradientConfig, ThemeConfig } from '@/types';
import { COLORS } from './constants';

export function defaultLightPalette(): ColorPalette {
  return {
    rlsirPrimary: COLORS.navy,
    rlsirSecondary: COLORS.gold,
    competitorBase: '#828a94',
    competitorFade: '#b8c4ce',
    accent: COLORS.gold,
    background: '#ffffff',
    foreground: COLORS.navy,
  };
}

export function defaultDarkPalette(): ColorPalette {
  return {
    rlsirPrimary: COLORS.gold,
    rlsirSecondary: COLORS.navy,
    competitorBase: 'rgba(255,255,255,0.45)',
    competitorFade: 'rgba(255,255,255,0.15)',
    accent: COLORS.gold,
    background: COLORS.navy,
    foreground: COLORS.cream,
  };
}

export function defaultLightGradient(): GradientConfig {
  return {
    enabled: true,
    colorStart: '#001530',
    colorEnd: '#1a5276',
    direction: 'horizontal',
  };
}

export function defaultDarkGradient(): GradientConfig {
  return {
    enabled: true,
    colorStart: '#9e8a64',
    colorEnd: '#d4c4a0',
    direction: 'horizontal',
  };
}

export function defaultThemeConfig(): ThemeConfig {
  return {
    palette: defaultLightPalette(),
    rlsirGradient: defaultLightGradient(),
    fontHeading: 'Playfair Display',
    fontBody: 'Inter',
  };
}

/** Convert a GradientConfig to a CSS linear-gradient string */
export function gradientToCss(g: GradientConfig): string {
  const dir = g.direction === 'horizontal' ? 'to right'
    : g.direction === 'vertical' ? 'to bottom'
    : '135deg';

  const stops = g.colorMid
    ? `${g.colorStart}, ${g.colorMid}, ${g.colorEnd}`
    : `${g.colorStart}, ${g.colorEnd}`;

  return `linear-gradient(${dir}, ${stops})`;
}
