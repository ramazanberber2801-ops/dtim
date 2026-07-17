import { CalendarDays, CalendarRange, Home, Menu } from 'lucide-react';
import type { Page } from '../types';

interface BottomNavProps { current: Page; onNavigate: (page: Page) => void; }

export function BottomNav({ current, onNavigate }: BottomNavProps) {
  const items: { page: Page; label: string; icon: typeof Home }[] = [
    { page: 'home', label: 'Hjem', icon: Home },
    { page: 'activities', label: 'Aktiviteter', icon: CalendarRange },
    { page: 'calendar', label: 'Kalender', icon: CalendarDays },
    { page: 'more', label: 'Mer', icon: Menu },
  ];
  return <nav className="fixed inset-x-0 bottom-0 z-50 border-t backdrop-blur-md" style={{background:'color-mix(in srgb, var(--brand-background) 96%, white 4%)',borderColor:'var(--brand-border)'}} aria-label="Hovedmeny"><div className="mx-auto grid h-[76px] max-w-md grid-cols-4 px-2" style={{paddingBottom:'max(8px, env(safe-area-inset-bottom))'}}>{items.map(({page,label,icon:Icon})=>{const active=current===page;return <button key={page} type="button" onClick={()=>onNavigate(page)} className="flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1"><Icon size={23} strokeWidth={active?2.6:2} style={{color:active?'var(--brand-primary)':'var(--brand-muted-text)'}}/><span className="text-[11px] font-semibold" style={{color:active?'var(--brand-primary)':'var(--brand-muted-text)'}}>{label}</span></button>;})}</div></nav>;
}
