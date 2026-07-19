type Dictionary = Record<string, string>;

const nb: Dictionary = {
  'ownerOverview.title': 'Oversikt',
  'ownerOverview.subtitle': 'Nøkkeltall for organisasjoner og invitasjoner.',
  'ownerOverview.total': 'Totalt',
  'ownerOverview.active': 'Aktive',
  'ownerOverview.trial': 'Prøve',
  'ownerOverview.paused': 'Pause',
  'ownerOverview.pendingInvitations': 'Ventende invitasjoner',
  'ownerOverview.readyToPublish': 'Klar for publisering',
  'ownerOverview.loading': 'Laster oversikten…',
  'ownerOverview.loadFailed': 'Oversikten kunne ikke lastes.',
  'ownerOverview.supabaseUnavailable': 'Databasen er ikke tilgjengelig akkurat nå.',
  'ownerOverview.retry': 'Prøv igjen',
  'ownerOverview.refresh': 'Oppdater',
  'ownerOverview.empty': 'Ingen organisasjoner er registrert ennå.',
  'ownerOverview.updated': 'Oversikten er oppdatert.',
};

const en: Dictionary = {
  'ownerOverview.title': 'Overview',
  'ownerOverview.subtitle': 'Key figures for organizations and invitations.',
  'ownerOverview.total': 'Total',
  'ownerOverview.active': 'Active',
  'ownerOverview.trial': 'Trial',
  'ownerOverview.paused': 'Paused',
  'ownerOverview.pendingInvitations': 'Pending invitations',
  'ownerOverview.readyToPublish': 'Ready to publish',
  'ownerOverview.loading': 'Loading overview…',
  'ownerOverview.loadFailed': 'The overview could not be loaded.',
  'ownerOverview.supabaseUnavailable': 'The database is currently unavailable.',
  'ownerOverview.retry': 'Try again',
  'ownerOverview.refresh': 'Refresh',
  'ownerOverview.empty': 'No organizations have been registered yet.',
  'ownerOverview.updated': 'The overview has been updated.',
};

const tr: Dictionary = {
  'ownerOverview.title': 'Genel bakış',
  'ownerOverview.subtitle': 'Kuruluşlar ve davetler için temel göstergeler.',
  'ownerOverview.total': 'Toplam',
  'ownerOverview.active': 'Aktif',
  'ownerOverview.trial': 'Deneme',
  'ownerOverview.paused': 'Duraklatılmış',
  'ownerOverview.pendingInvitations': 'Bekleyen davetler',
  'ownerOverview.readyToPublish': 'Yayınlanmaya hazır',
  'ownerOverview.loading': 'Genel bakış yükleniyor…',
  'ownerOverview.loadFailed': 'Genel bakış yüklenemedi.',
  'ownerOverview.supabaseUnavailable': 'Veritabanına şu anda erişilemiyor.',
  'ownerOverview.retry': 'Tekrar dene',
  'ownerOverview.refresh': 'Yenile',
  'ownerOverview.empty': 'Henüz kayıtlı kuruluş yok.',
  'ownerOverview.updated': 'Genel bakış güncellendi.',
};

const ar: Dictionary = {
  'ownerOverview.title': 'نظرة عامة',
  'ownerOverview.subtitle': 'مؤشرات أساسية للمؤسسات والدعوات.',
  'ownerOverview.total': 'الإجمالي',
  'ownerOverview.active': 'نشطة',
  'ownerOverview.trial': 'تجريبية',
  'ownerOverview.paused': 'متوقفة مؤقتًا',
  'ownerOverview.pendingInvitations': 'دعوات معلقة',
  'ownerOverview.readyToPublish': 'جاهزة للنشر',
  'ownerOverview.loading': 'جارٍ تحميل النظرة العامة…',
  'ownerOverview.loadFailed': 'تعذر تحميل النظرة العامة.',
  'ownerOverview.supabaseUnavailable': 'قاعدة البيانات غير متاحة حاليًا.',
  'ownerOverview.retry': 'حاول مرة أخرى',
  'ownerOverview.refresh': 'تحديث',
  'ownerOverview.empty': 'لا توجد مؤسسات مسجلة بعد.',
  'ownerOverview.updated': 'تم تحديث النظرة العامة.',
};

const ur: Dictionary = {
  'ownerOverview.title': 'جائزہ',
  'ownerOverview.subtitle': 'تنظیموں اور دعوتوں کے اہم اعداد و شمار۔',
  'ownerOverview.total': 'کل',
  'ownerOverview.active': 'فعال',
  'ownerOverview.trial': 'آزمائشی',
  'ownerOverview.paused': 'روکی گئی',
  'ownerOverview.pendingInvitations': 'زیر التوا دعوتیں',
  'ownerOverview.readyToPublish': 'اشاعت کے لیے تیار',
  'ownerOverview.loading': 'جائزہ لوڈ ہو رہا ہے…',
  'ownerOverview.loadFailed': 'جائزہ لوڈ نہیں ہو سکا۔',
  'ownerOverview.supabaseUnavailable': 'ڈیٹابیس فی الحال دستیاب نہیں ہے۔',
  'ownerOverview.retry': 'دوبارہ کوشش کریں',
  'ownerOverview.refresh': 'تازہ کریں',
  'ownerOverview.empty': 'ابھی تک کوئی تنظیم رجسٹر نہیں ہوئی۔',
  'ownerOverview.updated': 'جائزہ اپ ڈیٹ ہو گیا ہے۔',
};

const dictionaries: Record<string, Dictionary> = { nb, en, tr, ar, ur };

export function getOwnerOverviewTranslation(language: string, key: string) {
  return dictionaries[language]?.[key] || en[key] || nb[key] || key;
}
