export type OwnerOrganizationDraft = {
  id: string;
  name: string;
  adminEmail: string;
  domain: string;
  liveUrl: string;
  vercelUrl: string;
  supabaseUrl: string;
};

export type OwnerPanelValidationErrors = Partial<Record<keyof OwnerOrganizationDraft, string>>;
export type OwnerPanelOperationState = 'idle' | 'saving' | 'success' | 'error' | 'sending' | 'sent';

type ErrorLike = {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ORGANIZATION_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DOMAIN_PATTERN = /^(?=.{1,253}$)(?!-)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;

const FIELD_LABELS: Record<keyof OwnerOrganizationDraft, string> = {
  id: 'Organisasjons-ID',
  name: 'Organisasjonsnavn',
  adminEmail: 'Administratorens e-post',
  domain: 'Domene',
  liveUrl: 'Live-URL',
  vercelUrl: 'Vercel-URL',
  supabaseUrl: 'Supabase-URL',
};

export function normalizeOrganizationId(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function normalizeDomain(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//i, '')
    .replace(/\/.*$/, '')
    .replace(/\.$/, '');
}

export function normalizeOptionalUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('/')) return trimmed;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function normalizeOwnerOrganization(
  organization: OwnerOrganizationDraft,
): OwnerOrganizationDraft {
  return {
    ...organization,
    id: normalizeOrganizationId(organization.id),
    name: organization.name.trim().replace(/\s+/g, ' '),
    adminEmail: normalizeEmail(organization.adminEmail),
    domain: normalizeDomain(organization.domain),
    liveUrl: normalizeOptionalUrl(organization.liveUrl),
    vercelUrl: normalizeOptionalUrl(organization.vercelUrl),
    supabaseUrl: normalizeOptionalUrl(organization.supabaseUrl),
  };
}

function isValidOptionalUrl(value: string) {
  if (!value) return true;
  if (value.startsWith('/')) return /^\/[A-Za-z0-9/_?&=#.%+-]*$/.test(value);

  try {
    const url = new URL(value);
    return (url.protocol === 'http:' || url.protocol === 'https:') && Boolean(url.hostname);
  } catch {
    return false;
  }
}

export function validateOwnerOrganization(
  organization: OwnerOrganizationDraft,
): OwnerPanelValidationErrors {
  const normalized = normalizeOwnerOrganization(organization);
  const errors: OwnerPanelValidationErrors = {};

  if (!normalized.name) {
    errors.name = 'Organisasjonsnavn er påkrevd.';
  } else if (normalized.name.length < 2) {
    errors.name = 'Organisasjonsnavnet må inneholde minst 2 tegn.';
  } else if (normalized.name.length > 120) {
    errors.name = 'Organisasjonsnavnet kan ikke være lengre enn 120 tegn.';
  }

  if (!normalized.id) {
    errors.id = 'Organisasjons-ID er påkrevd.';
  } else if (!ORGANIZATION_ID_PATTERN.test(normalized.id)) {
    errors.id = 'Organisasjons-ID kan bare inneholde små bokstaver, tall og bindestrek.';
  } else if (normalized.id.length < 3 || normalized.id.length > 64) {
    errors.id = 'Organisasjons-ID må være mellom 3 og 64 tegn.';
  }

  if (normalized.adminEmail && !EMAIL_PATTERN.test(normalized.adminEmail)) {
    errors.adminEmail = 'Skriv inn en gyldig e-postadresse.';
  }

  const urlFields: Array<keyof Pick<OwnerOrganizationDraft, 'liveUrl' | 'vercelUrl' | 'supabaseUrl'>> = [
    'liveUrl',
    'vercelUrl',
    'supabaseUrl',
  ];

  for (const field of urlFields) {
    if (!isValidOptionalUrl(normalized[field])) {
      errors[field] = 'Skriv inn en gyldig URL.';
    }
  }

  if (normalized.domain && !DOMAIN_PATTERN.test(normalized.domain)) {
    errors.domain = 'Skriv inn et gyldig domene, for eksempel app.forening.no.';
  }

  return errors;
}

export function hasOwnerPanelValidationErrors(errors: OwnerPanelValidationErrors) {
  return Object.keys(errors).length > 0;
}

export function getOwnerPanelErrorSummary(errors: OwnerPanelValidationErrors) {
  return (Object.keys(errors) as Array<keyof OwnerOrganizationDraft>)
    .filter((field) => Boolean(errors[field]))
    .map((field) => `${FIELD_LABELS[field]}: ${errors[field]}`);
}

export function getOwnerPanelFieldErrorId(field: keyof OwnerOrganizationDraft) {
  return `owner-panel-${field}-error`;
}

export function getOwnerPanelFieldAccessibility(
  field: keyof OwnerOrganizationDraft,
  errors: OwnerPanelValidationErrors,
) {
  const hasError = Boolean(errors[field]);
  return {
    'aria-invalid': hasError || undefined,
    'aria-describedby': hasError ? getOwnerPanelFieldErrorId(field) : undefined,
  } as const;
}

export function isOwnerPanelBusy(state: OwnerPanelOperationState) {
  return state === 'saving' || state === 'sending';
}

export function mapOwnerPanelError(error: unknown, fallback = 'Noe gikk galt. Prøv igjen.') {
  const candidate = (error && typeof error === 'object' ? error : {}) as ErrorLike;
  const message = candidate.message?.trim() || (error instanceof Error ? error.message.trim() : '');
  const code = candidate.code?.trim();
  const searchable = `${code ?? ''} ${message} ${candidate.details ?? ''} ${candidate.hint ?? ''}`.toLowerCase();

  if (code === '23505' || searchable.includes('duplicate key') || searchable.includes('already exists')) {
    return 'En organisasjon eller administrator med disse opplysningene finnes allerede.';
  }
  if (code === '23503' || searchable.includes('foreign key')) {
    return 'Kunne ikke lagre fordi en tilknyttet oppføring mangler. Oppdater siden og prøv igjen.';
  }
  if (code === '42501' || searchable.includes('row-level security') || searchable.includes('permission denied')) {
    return 'Du har ikke tilgang til å utføre denne handlingen.';
  }
  if (searchable.includes('failed to fetch') || searchable.includes('network') || searchable.includes('timeout')) {
    return 'Kunne ikke kontakte serveren. Kontroller nettforbindelsen og prøv igjen.';
  }
  if (searchable.includes('jwt') || searchable.includes('session') || searchable.includes('not authenticated')) {
    return 'Økten din har utløpt. Logg inn på nytt og prøv igjen.';
  }
  if (message && !/supabase|postgres|relation|constraint|schema/i.test(message)) {
    return message;
  }

  return fallback;
}
