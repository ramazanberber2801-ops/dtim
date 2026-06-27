import type { ReactNode } from 'react';
import { useApp } from '../context/AppContext';

interface WhatsAppButtonProps {
  message?: string;
  children: ReactNode;
  className?: string;
}

export function WhatsAppButton({ message, children, className = '' }: WhatsAppButtonProps) {
  const { settings } = useApp();
  const num = settings.whatsappNumber || '4712345678';
  const link = `https://wa.me/${num}?text=${encodeURIComponent(message ?? 'Merhaba Hocam, bir sorum olacaktı.')}`;

  return (
    <a href={link} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  );
}
