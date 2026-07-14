import { Mail, MessageCircle, Phone, Send, User, X } from 'lucide-react';
import { useAppI18n } from '../lib/appI18n';
import type { StaffMember } from '../types';

type ExtendedStaffMember = StaffMember & {
  email?: string;
  whatsapp?: string;
  whatsappNumber?: string;
  bio?: string;
  description?: string;
  imageUrl?: string;
  photoUrl?: string;
};

const normalizePhone = (value?: string) => String(value || '').replace(/[^+\d]/g, '');

export function ContactPersonModal({ member, onClose }: { member: ExtendedStaffMember | null; onClose: () => void }) {
  const { direction } = useAppI18n();
  if (!member) return null;

  const phone = normalizePhone(member.phone);
  const whatsapp = normalizePhone(member.whatsapp || member.whatsappNumber || member.phone);
  const email = member.email?.trim();
  const description = member.bio?.trim() || member.description?.trim();
  const image = member.imageUrl || member.photoUrl;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4" dir={direction}>
      <button type="button" aria-label="Lukk" onClick={onClose} className="absolute inset-0 bg-black/55 backdrop-blur-sm" />
      <section className="relative z-10 max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl border bg-white shadow-2xl sm:rounded-3xl" style={{ borderColor: 'var(--brand-border)', color: 'var(--brand-card-text)' }}>
        <div className="sticky top-0 z-10 flex justify-end p-3">
          <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full shadow-sm" style={{ backgroundColor: 'var(--brand-subtle)', color: 'var(--brand-text)' }} aria-label="Lukk"><X size={19} /></button>
        </div>

        <div className="px-6 pb-7 text-center">
          {image ? (
            <img src={image} alt="" className="mx-auto h-28 w-28 rounded-full object-cover shadow-lg" />
          ) : (
            <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full text-4xl font-semibold shadow-lg" style={{ background: 'linear-gradient(135deg, var(--brand-primary), color-mix(in srgb, var(--brand-primary) 72%, #000))', color: 'var(--brand-primary-text)' }}>{member.name?.charAt(0).toUpperCase() || <User />}</div>
          )}

          <h2 className="mt-4 font-serif text-2xl">{member.name}</h2>
          {member.position && <p className="mt-1 text-sm font-semibold" style={{ color: 'var(--brand-primary)' }}>{member.position}</p>}
          {description && <p className="mx-auto mt-4 max-w-sm whitespace-pre-wrap text-sm leading-6 opacity-65">{description}</p>}

          {(phone || whatsapp || email) && (
            <div className="mt-6 grid gap-3">
              {phone && <a href={`tel:${phone}`} className="flex items-center gap-3 rounded-2xl border p-4 text-left" style={{ borderColor: 'var(--brand-border)', backgroundColor: 'var(--brand-card)' }}><span className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: 'var(--brand-subtle)', color: 'var(--brand-primary)' }}><Phone size={20} /></span><span><span className="block text-xs opacity-50">Telefon</span><span className="block text-sm font-semibold">{member.phone}</span></span></a>}
              {email && <a href={`mailto:${email}`} className="flex items-center gap-3 rounded-2xl border p-4 text-left" style={{ borderColor: 'var(--brand-border)', backgroundColor: 'var(--brand-card)' }}><span className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: 'var(--brand-subtle)', color: 'var(--brand-primary)' }}><Mail size={20} /></span><span className="min-w-0"><span className="block text-xs opacity-50">E-post</span><span className="block truncate text-sm font-semibold">{email}</span></span></a>}
            </div>
          )}

          {(phone || whatsapp || email) && <div className="mt-5 grid grid-cols-2 gap-3">
            {phone && <a href={`sms:${phone}`} className="flex items-center justify-center gap-2 rounded-xl border py-3 text-sm font-semibold" style={{ borderColor: 'var(--brand-border)', color: 'var(--brand-primary)' }}><Send size={17} />SMS</a>}
            {whatsapp && <a href={`https://wa.me/${whatsapp.replace(/^\+/, '')}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3 text-sm font-semibold text-white"><MessageCircle size={17} />WhatsApp</a>}
          </div>}
        </div>
      </section>
    </div>
  );
}
