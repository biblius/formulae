// Names have to match those in layout.css

export const THEME_AMBER = 'theme-amber-dark';
export const THEME_AMBER_LIGHT = 'theme-amber-light';
export const THEME_CAFFEINE = 'theme-caffeine-dark';
export const THEME_CAFFEINE_LIGHT = 'theme-caffeine-light';

export const THEMES = [THEME_AMBER, THEME_AMBER_LIGHT, THEME_CAFFEINE, THEME_CAFFEINE_LIGHT];

export function getTheme(): string {
  return localStorage.getItem('theme') ?? THEME_AMBER;
}

export function initTheme() {
  const saved = localStorage.getItem('theme') ?? THEME_AMBER;
  applyTheme(saved);
}

export function applyTheme(value: string) {
  const root = document.documentElement;
  root.classList.remove(...THEMES);
  root.classList.add(value);
  localStorage.setItem('theme', value);
}

export function getThemeDisplay(theme: string): string {
  switch (theme) {
    case THEME_AMBER:
      return 'Amber (Dark)';
    case THEME_AMBER_LIGHT:
      return 'Amber (Light)';
    case THEME_CAFFEINE:
      return 'Caffeine (Dark)';
    case THEME_CAFFEINE_LIGHT:
      return 'Caffeine (Light)';
    default:
      return 'Unknown Theme';
  }
}
