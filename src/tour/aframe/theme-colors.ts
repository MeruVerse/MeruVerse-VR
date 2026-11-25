export interface ThemeColors {
  readonly ink: string;
  readonly paper: string;
  readonly accent: string;
  readonly info: string;
  readonly displayFont: string;
}

export function readThemeColors(): ThemeColors {
  const style = getComputedStyle(document.documentElement);
  const read = (name: string) => style.getPropertyValue(name).trim();
  return {
    ink: read('--color-ink'),
    paper: read('--color-paper'),
    accent: read('--color-accent'),
    info: read('--color-info'),
    displayFont: read('--font-display'),
  };
}
