import { themeContrastSummary, type ContrastThemeTokens } from './contrastEngine';

export type ThemeValidationLevel = 'approved' | 'warning' | 'blocked';

export type ThemeValidationIssue = {
  id: string;
  label: string;
  level: ThemeValidationLevel;
  message: string;
};

export type ThemeValidationResult = {
  level: ThemeValidationLevel;
  score: number;
  label: string;
  issues: ThemeValidationIssue[];
};

export type ExtendedThemeTokens = ContrastThemeTokens & {
  primaryText?: string;
  secondaryText?: string;
  cardText?: string;
  mutedText?: string;
  surface?: string;
  border?: string;
  success?: string;
  warning?: string;
  error?: string;
  info?: string;
  inputBackground?: string;
  inputText?: string;
  navigationBackground?: string;
  navigationText?: string;
};

function issue(id: string, label: string, level: ThemeValidationLevel, message: string): ThemeValidationIssue {
  return { id, label, level, message };
}

export function validateTheme(tokens: ExtendedThemeTokens): ThemeValidationResult {
  const issues: ThemeValidationIssue[] = [];
  const contrast = themeContrastSummary(tokens);

  for (const failed of contrast.failed) {
    issues.push(issue(failed.id, failed.label, 'warning', `Kontrast ${failed.ratio}:1 er lavere enn anbefalt ${failed.required}:1.`));
  }

  if (!tokens.card || tokens.card.toLowerCase() === tokens.background.toLowerCase()) {
    issues.push(issue('card-background', 'Kortbakgrunn', 'warning', 'Kort bør ha tydelig nok forskjell fra bakgrunnen.'));
  }

  if (!tokens.primary || tokens.primary.toLowerCase() === tokens.background.toLowerCase()) {
    issues.push(issue('primary-background', 'Primærfarge', 'blocked', 'Primærfarge kan ikke være lik bakgrunnen.'));
  }

  const blocked = issues.some((item) => item.level === 'blocked');
  const warnings = issues.filter((item) => item.level === 'warning').length;
  const score = Math.max(0, 100 - warnings * 12 - (blocked ? 40 : 0));

  if (blocked) {
    return { level: 'blocked', score, label: 'Bør ikke brukes', issues };
  }

  if (warnings > 0) {
    return { level: 'warning', score, label: 'Godkjent med anbefalinger', issues };
  }

  return { level: 'approved', score: 100, label: 'Verified by Yasaflow', issues };
}
