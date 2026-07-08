import { readableTextColor, themeContrastSummary } from '../lib/contrastEngine';
import { validateTheme } from '../lib/themeValidator';
import type { ThemeDefinition } from '../lib/themeEngine';

function mix(color: string, amount: number, fallback = 'transparent') {
  return `color-mix(in srgb, ${color} ${amount}%, ${fallback})`;
}

const alertStyles = [
  { label: 'Info', bg: '#DBEAFE', color: '#1D4ED8' },
  { label: 'Suksess', bg: '#DCFCE7', color: '#166534' },
  { label: 'Advarsel', bg: '#FEF3C7', color: '#92400E' },
  { label: 'Feil', bg: '#FEE2E2', color: '#991B1B' },
];

export function ThemeInspector({ theme }: { theme: ThemeDefinition }) {
  const contrast = themeContrastSummary(theme.tokens);
  const validation = validateTheme(theme.tokens);
  const statusColor = validation.level === 'approved' ? '#16A34A' : validation.level === 'warning' ? '#D97706' : '#DC2626';

  return (
    <section className="rounded-2xl border-2 bg-white p-4" style={{ borderColor: mix(theme.tokens.primary, 22), color: theme.tokens.text }}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="font-serif text-lg">Theme Inspector</h3>
          <p className="text-xs opacity-55">Forhåndsvisning av viktige UI-deler</p>
        </div>
        <div className="text-right">
          <span className="inline-flex rounded-full px-2 py-1 text-[11px] font-medium" style={{ backgroundColor: mix(statusColor, 12, '#FFFFFF'), color: statusColor }}>
            {validation.label}
          </span>
          <p className="text-[11px] opacity-55 mt-1">{validation.score}/100 · kontrast {contrast.score}</p>
        </div>
      </div>

      <div className="rounded-[28px] border p-3 shadow-sm" style={{ backgroundColor: theme.tokens.background, borderColor: mix(theme.tokens.primary, 25), color: theme.tokens.text }}>
        <div className="rounded-2xl p-4 mb-3" style={{ backgroundColor: theme.tokens.secondary, color: readableTextColor(theme.tokens.secondary) }}>
          <p className="text-[11px] opacity-70">Yasaflow</p>
          <h4 className="font-serif text-xl">Organisasjon</h4>
          <p className="text-xs opacity-75 mt-1">Velkommen tilbake</p>
        </div>

        <div className="rounded-2xl p-4 mb-3" style={{ backgroundColor: theme.tokens.card, border: `1px solid ${mix(theme.tokens.primary, 25)}` }}>
          <p className="text-sm font-medium">Dagens oversikt</p>
          <p className="text-xs opacity-55">Nyheter, arrangementer og viktige snarveier</p>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <button className="rounded-xl py-2.5 text-xs font-medium" style={{ backgroundColor: theme.tokens.primary, color: readableTextColor(theme.tokens.primary) }}>Primær</button>
            <button className="rounded-xl py-2.5 text-xs font-medium border" style={{ borderColor: mix(theme.tokens.primary, 35), color: theme.tokens.primary, backgroundColor: '#FFFFFF' }}>Sekundær</button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <PreviewCard theme={theme} title="Nyhet" text="Viktig informasjon" />
          <PreviewCard theme={theme} title="Arrangement" text="Fredag kl. 18:00" />
          <PreviewCard theme={theme} title="Donasjon" text="Støtt foreningen" />
          <PreviewCard theme={theme} title="Medlemskort" text="Aktivt medlem" />
        </div>

        <div className="rounded-2xl p-3 mb-3" style={{ backgroundColor: theme.tokens.card, border: `1px solid ${mix(theme.tokens.primary, 18)}` }}>
          <p className="text-xs font-medium mb-2">Bønnetider / tidskort</p>
          <div className="grid grid-cols-3 gap-2">
            {['Fajr', 'Dhuhr', 'Isha'].map((name, index) => (
              <div key={name} className="rounded-xl p-2 text-center" style={{ backgroundColor: index === 1 ? mix(theme.tokens.primary, 12, '#FFFFFF') : mix(theme.tokens.secondary, 8, '#FFFFFF') }}>
                <p className="text-[10px] opacity-55">{name}</p>
                <p className="text-xs font-medium">12:{index}5</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl p-3 mb-3" style={{ backgroundColor: theme.tokens.card, border: `1px solid ${mix(theme.tokens.primary, 18)}` }}>
          <p className="text-xs font-medium mb-2">Skjema</p>
          <input value="Eksempel på input" readOnly className="w-full rounded-xl border px-3 py-2 text-xs" style={{ borderColor: mix(theme.tokens.primary, 24), color: theme.tokens.text, backgroundColor: '#FFFFFF' }} />
          <textarea value="Lengre tekstfelt" readOnly className="w-full rounded-xl border px-3 py-2 text-xs mt-2" style={{ borderColor: mix(theme.tokens.primary, 24), color: theme.tokens.text, backgroundColor: '#FFFFFF' }} />
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          {alertStyles.map((item) => (
            <div key={item.label} className="rounded-xl p-2 text-[11px]" style={{ backgroundColor: item.bg, color: item.color }}>{item.label}</div>
          ))}
        </div>

        <div className="rounded-2xl p-2 grid grid-cols-4 gap-1" style={{ backgroundColor: theme.tokens.secondary, color: readableTextColor(theme.tokens.secondary) }}>
          {['Hjem', 'Nyheter', 'Aktivitet', 'Kontakt'].map((item) => (
            <div key={item} className="rounded-xl py-2 text-center text-[10px]" style={{ backgroundColor: item === 'Hjem' ? mix(theme.tokens.primary, 26, 'transparent') : 'transparent' }}>{item}</div>
          ))}
        </div>
      </div>

      {validation.issues.length > 0 && (
        <div className="mt-4 rounded-xl border p-3" style={{ borderColor: `${statusColor}33`, backgroundColor: mix(statusColor, 8, '#FFFFFF') }}>
          <p className="text-xs font-medium mb-2" style={{ color: statusColor }}>Anbefalinger</p>
          {validation.issues.slice(0, 3).map((item) => <p key={item.id} className="text-[11px] opacity-70">- {item.message}</p>)}
        </div>
      )}
    </section>
  );
}

function PreviewCard({ theme, title, text }: { theme: ThemeDefinition; title: string; text: string }) {
  return (
    <div className="rounded-2xl p-3" style={{ backgroundColor: theme.tokens.card, border: `1px solid ${mix(theme.tokens.primary, 18)}` }}>
      <div className="w-7 h-7 rounded-lg mb-2" style={{ backgroundColor: mix(theme.tokens.primary, 14, '#FFFFFF') }} />
      <p className="text-xs font-medium">{title}</p>
      <p className="text-[11px] opacity-55 mt-1">{text}</p>
    </div>
  );
}
