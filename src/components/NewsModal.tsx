import { X, Calendar, Tag } from 'lucide-react';
import type { NewsItem } from '../types';

interface NewsModalProps {
  item: (NewsItem & { image_base64?: string }) | null;
  onClose: () => void;
}

const brand = {
  primary: 'var(--brand-primary)',
  secondary: 'var(--brand-secondary)',
  background: 'var(--brand-background)',
  text: 'var(--brand-text)',
};

const mix = (color: string, amount: number, fallback = 'transparent') =>
  `color-mix(in srgb, ${color} ${amount}%, ${fallback})`;

export function NewsModal({ item, onClose }: NewsModalProps) {
  if (!item) return null;

  const formattedDate = new Date(item.date).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const imageSrc = item.imageBase64 || item.image_base64;

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center p-0 sm:p-4 sm:py-8">
      <div
        className="absolute inset-0 backdrop-blur-sm"
        style={{ backgroundColor: mix(brand.secondary, 70) }}
        onClick={onClose}
      />

      <div
        className="relative w-full max-w-2xl rounded-none sm:rounded-2xl shadow-2xl border overflow-hidden max-h-screen sm:max-h-[calc(100vh-4rem)] flex flex-col"
        style={{
          backgroundColor: brand.background,
          color: brand.text,
          borderColor: mix(brand.primary, 30),
        }}
      >
        <div
          className="flex items-center justify-between px-5 py-4 border-b sticky top-0 z-10"
          style={{ backgroundColor: brand.background, borderColor: mix(brand.primary, 20) }}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Tag size={16} className="shrink-0" style={{ color: brand.primary }} />
            <span className="text-xs font-medium uppercase tracking-wide truncate opacity-60">
              {item.category}
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-colors shrink-0"
            style={{ backgroundColor: mix(brand.primary, 10), color: mix(brand.text, 70) }}
            aria-label="Kapat"
          >
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {imageSrc && (
            <img
              src={imageSrc}
              alt={item.title}
              className="w-full h-auto object-contain block"
            />
          )}

          <div className="p-5 sm:p-6">
            <h2 className="font-serif text-xl sm:text-2xl leading-tight mb-3">
              {item.title}
            </h2>

            <div className="flex items-center gap-3 text-xs opacity-50 mb-4">
              <span className="flex items-center gap-1">
                <Calendar size={13} />
                {formattedDate}
              </span>
            </div>

            <div className="prose prose-sm max-w-none">
              <p className="leading-relaxed whitespace-pre-wrap opacity-80" style={{ color: brand.text }}>
                {item.content}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
