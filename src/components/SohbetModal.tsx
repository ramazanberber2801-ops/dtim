import { X, Calendar, Clock, MapPin, User, MessageCircle } from 'lucide-react';
import type { SohbetItem } from '../types';
import { WhatsAppButton } from './WhatsAppButton';

interface SohbetModalProps {
  item: (SohbetItem & { image_base64?: string }) | null;
  onClose: () => void;
}

export function SohbetModal({ item, onClose }: SohbetModalProps) {
  if (!item) return null;

  const formattedDate = new Date(item.date).toLocaleDateString('tr-TR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const imageSrc = item.imageBase64 || item.image_base64;

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center p-0 sm:p-4 sm:py-8">
      <div
        className="absolute inset-0 bg-[#2D2A26]/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl bg-[#FAF6F0] rounded-none sm:rounded-2xl shadow-2xl border-2 border-[#C5A880]/30 overflow-hidden max-h-screen sm:max-h-[calc(100vh-4rem)] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b-2 border-[#C5A880]/20 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-xs font-semibold text-[#C5A880] uppercase tracking-wider bg-[#C5A880]/10 px-2 py-1 rounded">
              Sohbet / Ders
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full hover:bg-[#C5A880]/15 flex items-center justify-center transition-colors shrink-0"
            aria-label="Kapat"
          >
            <X size={20} className="text-[#2D2A26]/60" />
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
            <h2 className="font-serif text-xl sm:text-2xl text-[#2D2A26] leading-tight mb-4">
              {item.title}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
              <div className="flex items-center gap-2 text-sm text-[#2D2A26]/70 bg-white rounded-lg border border-[#C5A880]/20 px-3 py-2">
                <Calendar size={15} className="text-[#C5A880] shrink-0" />
                <span className="capitalize">{formattedDate}</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-[#2D2A26]/70 bg-white rounded-lg border border-[#C5A880]/20 px-3 py-2">
                <Clock size={15} className="text-[#C5A880] shrink-0" />
                <span className="tabular-nums">{item.time}</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-[#2D2A26]/70 bg-white rounded-lg border border-[#C5A880]/20 px-3 py-2">
                <MapPin size={15} className="text-[#C5A880] shrink-0" />
                <span>{item.location}</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-[#2D2A26]/70 bg-white rounded-lg border border-[#C5A880]/20 px-3 py-2">
                <User size={15} className="text-[#C5A880] shrink-0" />
                <span>{item.speaker}</span>
              </div>
            </div>

            <div className="prose prose-sm max-w-none mb-6">
              <p className="text-[#2D2A26]/80 leading-relaxed whitespace-pre-wrap">
                {item.description}
              </p>
            </div>

            <WhatsAppButton
              message={`Merhaba Hocam, "${item.title}" programına katılmak istiyorum. Detayları öğrenebilir miyim?`}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#25D366] text-white font-semibold text-sm hover:bg-[#1FB855] transition-colors shadow-sm"
            >
              <MessageCircle size={18} fill="white" />
              Hocaya Sor
            </WhatsAppButton>
          </div>
        </div>
      </div>
    </div>
  );
}
