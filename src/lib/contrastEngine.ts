export type ContrastGrade = 'pass' | 'fail';

export type ContrastCheck = {
  id: string;
  label: string;
  foreground: string;
  background: string;
  ratio: number;
  required: number;
  grade: ContrastGrade;
  recommendation?: string;
};

export type ContrastThemeTokens = {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  card: string;
};

function normalizeHex(hex: string) {
  const value = String(hex || '').trim();
  if (/^#[0-9a-fA-F]{6}$/.test(value)) return value;
  if (/^#[0-9a-fA-F]{3}$/.test(value)) {
    return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`;
  }
  return '#000000';
}

function hexToRgb(hex: string) {
  const value = normalizeHex(hex).replace('#', '');
  const n = parseInt(value, 16);
  return {
    r: (n >> 16) & 255,
    g: (n >> 8) & 255,
    b: n & 255,
  };
}

function channelToLinear(value: number) {
  const v = value / 255;
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  return 0.2126 * channelToLinear(r) + 0.7152 * channelToLinear(g) + 0.0722 * channelToLinear(b);
}

export function contrastRatio(foreground: string, background: string) {
  const fg = relativeLuminance(foreground);
  const bg = relativeLuminance(background);
  const lighter = Math.max(fg, bg);
  const darker = Math.min(fg, bg);
  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

export function readableTextColor(background: string) {
  const blackRatio = contrastRatio('#111827', background);
  const whiteRatio = contrastRatio('#FFFFFF', background);
  return blackRatio >= whiteRatio ? '#111827' : '#FFFFFF';
}

export function checkPair(id: string, label: string, foreground: string, background: string, required = 4.5): ContrastCheck {
  const ratio = contrastRatio(foreground, background);
  const grade: ContrastGrade = ratio >= required ? 'pass' : 'fail';
  return {
    id,
    label,
    foreground: normalizeHex(foreground),
    background: normalizeHex(background),
    ratio,
    required,
    grade,
    recommendation: grade === 'fail' ? `Bruk ${readableTextColor(background)} som tekstfarge her.` : undefined,
  };
}

export function checkThemeContrast(tokens: ContrastThemeTokens) {
  return [
    checkPair('text-background', 'Tekst på bakgrunn', tokens.text, tokens.background),
    checkPair('text-card', 'Tekst på kort', tokens.text, tokens.card),
    checkPair('primary-background', 'Primærfarge på bakgrunn', tokens.primary, tokens.background, 3),
    checkPair('text-primary', 'Tekst på primærfarge', readableTextColor(tokens.primary), tokens.primary),
    checkPair('text-secondary', 'Tekst på sekundærfarge', readableTextColor(tokens.secondary), tokens.secondary),
  ];
}

export function themeContrastSummary(tokens: ContrastThemeTokens) {
  const checks = checkThemeContrast(tokens);
  const failed = checks.filter((check) => check.grade === 'fail');
  const minRatio = Math.min(...checks.map((check) => check.ratio));
  return {
    checks,
    failed,
    passed: failed.length === 0,
    minRatio,
    score: `${checks.length - failed.length}/${checks.length}`,
  };
}
