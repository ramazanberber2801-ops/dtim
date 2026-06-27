import type { MosqueSettings, AdminAccount } from '../types';

/** Default mosque settings — used on first load, then overridden by localStorage.
 *  Only real, confirmed data is included. Placeholder values are left empty. */
export const DEFAULT_SETTINGS: MosqueSettings = {
  mosqueName: 'Drammen Türk İnanç Cemiyeti',
  shortName: 'Norveç · Drammen',
  vippsNumber: '29816',
  address: 'Lauritz Grønlands vei 30, 3035 Drammen',
  mapUrl: 'https://www.google.com/maps/search/?api=1&query=Lauritz+Grønlands+vei+30+3035+Drammen+Norway',
  phone: '',
  email: '',
  whatsappNumber: '4712345678',
  bankAccount: '',
  iban: '',
  openingHours: '',
  fridayPrayer: '',
};

/** Default admin accounts — superadmin is always present. */
export const DEFAULT_ADMINS: AdminAccount[] = [
  {
    id: 'superadmin',
    username: 'Ramazan',
    password: 'ramazan2801',
    displayName: 'Ramazan',
    role: 'superadmin',
  },
];

/** Security question answer for password recovery (superadmin only). */
export const RECOVERY_ANSWER = 'mavis';
