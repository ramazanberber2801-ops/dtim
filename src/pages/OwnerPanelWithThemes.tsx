import { useMemo, useState } from 'react';
import { CheckCircle2, Palette, Search, Star } from 'lucide-react';
import { OwnerPanel as BaseOwnerPanel } from './OwnerPanelPersisted';
import { themes, type ThemeCategory } from '../lib/themeEngine';

const brand = {
  primary: 'var(--brand-primary)',
  text: 'var(--brand-text)',
};

const mix = (color: string, amount: number, fallback = 'transparent') =>
  `color-mix(in srgb, ${color} ${amount}%, ${fallback})`;

const categories: Array<{ id: ThemeCategory | 'all'; label: string }> = [
  { id: 'all', label: 'Alle' },
  { id: 'mosque', label: '🕌 Moské' },
  { id: 'community', label: '🏢 Forening' },
  { id: 'sports', label: '⚽ Idrett' },
  { id: 'charity', label: '❤️ Stiftelse' },
];

const recommendedIds = ['classic-mosque', 'modern-mosque', 'nordic-mosque', 'dark-emerald'];

export function OwnerPanel() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<ThemeCategory | 'all'>('all');
  const [favorites, setFavorites] = useState<Record<string, boolean>>({
    'classic-mosque': true,
    'modern-mosque': true,
  });

  const recommended = themes.filter((theme) => recommendedIds.includes(theme.id));
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return themes.filter((theme) => {
      const matchesCategory = category === 'all' || theme.category === category;
      const matchesQuery = !q || [theme.name, theme.category, theme.description].join(' ').toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [query, category]);

  return (
    <div className="space-y-5">
      <BaseOwnerPanel />

      <section className="mx-4 mb-6 rounded-2xl border-2 bg-white p-4" style={{ borderColor: mix(brand.primary, 22), color: brand.text }}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: mix(brand.primary, 12), color: brand.primary }}>
            <Palette size={18} />
          </div>
          <div>
            <h3 className="font-serif text-lg">Theme Library</h3>
            <p className="text-xs opacity-50">Søk, filtrer og finn riktig design. Lagring per organisasjon kommer etterpå.</p>
          </div>
        </div>

        <div className="relative mb-3">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl border py-3 pl-10 pr-3 text-sm"
            style={{ borderColor: mix(brand.primary, 18), color: brand.text }}
            placeholder="Søk tema..."
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategory(cat.id)}
              className="shrink-0 rounded-full border px-3 py-2 text-xs"
              style={{
                borderColor: category === cat.id ? brand.primary : mix(brand.primary, 18),
                backgroundColor: category === cat.id ? mix(brand.primary, 12, '#FFFFFF') : '#FFFFFF',
                color: category === cat.id ? brand.primary : brand.text,
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="mb-5">
          <div className="flex items-center gap-2 mb-2">
            <Star size={15} style={{ color: brand.primary }} />
            <h4 className="font-serif text-base">Anbefalte temaer</h4>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {recommended.map((theme) => (
              <ThemeCard
                key={theme.id}
                theme={theme}
                favorite={!!favorites[theme.id]}
                onFavorite={() => setFavorites((prev) => ({ ...prev, [theme.id]: !prev[theme.id] }))}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between mb-2">
          <h4 className="font-serif text-base">Alle temaer</h4>
          <span className="text-xs opacity-50">{filtered.length} temaer</span>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {filtered.map((theme) => (
            <ThemeCard
              key={theme.id}
              theme={theme}
              favorite={!!favorites[theme.id]}
              onFavorite={() => setFavorites((prev) => ({ ...prev, [theme.id]: !prev[theme.id] }))}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function ThemeCard({ theme, favorite, onFavorite }: { theme: (typeof themes)[number]; favorite: boolean; onFavorite: () => void }) {
  return (
    <div className="rounded-2xl border p-3" style={{ borderColor: mix(brand.primary, 14) }}>
      <div
        className="rounded-xl p-3 mb-3 border"
        style={{ backgroundColor: theme.tokens.background, color: theme.tokens.text, borderColor: theme.tokens.primary }}
      >
        <div className="h-8 rounded-lg mb-3" style={{ backgroundColor: theme.tokens.secondary }} />
        <div className="grid grid-cols-3 gap-2">
          <div className="h-14 rounded-lg" style={{ backgroundColor: theme.tokens.card, border: `1px solid ${theme.tokens.primary}` }} />
          <div className="h-14 rounded-lg" style={{ backgroundColor: theme.tokens.card, border: `1px solid ${theme.tokens.primary}` }} />
          <div className="h-14 rounded-lg" style={{ backgroundColor: theme.tokens.card, border: `1px solid ${theme.tokens.primary}` }} />
        </div>
      </div>

      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-serif text-base">{theme.name}</p>
          <p className="text-xs opacity-50 capitalize">{theme.category}</p>
          <p className="text-xs opacity-60 mt-2">{theme.description}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <button
            type="button"
            onClick={onFavorite}
            className="w-8 h-8 rounded-full border flex items-center justify-center"
            style={{ borderColor: mix(brand.primary, 18), color: favorite ? brand.primary : mix(brand.text, 35) }}
            aria-label="Favoritt"
          >
            <Star size={15} fill={favorite ? 'currentColor' : 'none'} />
          </button>
          {theme.id === 'classic-mosque' && (
            <span className="text-[10px] px-2 py-1 rounded-full flex items-center gap-1" style={{ backgroundColor: mix(brand.primary, 12), color: brand.primary }}>
              <CheckCircle2 size={12} /> Aktiv
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-2 mt-3">
        <span className="w-8 h-8 rounded-full border" style={{ backgroundColor: theme.tokens.primary, borderColor: mix(brand.primary, 16) }} />
        <span className="w-8 h-8 rounded-full border" style={{ backgroundColor: theme.tokens.secondary, borderColor: mix(brand.primary, 16) }} />
        <span className="w-8 h-8 rounded-full border" style={{ backgroundColor: theme.tokens.background, borderColor: mix(brand.primary, 16) }} />
        <span className="w-8 h-8 rounded-full border" style={{ backgroundColor: theme.tokens.card, borderColor: mix(brand.primary, 16) }} />
      </div>
    </div>
  );
}
