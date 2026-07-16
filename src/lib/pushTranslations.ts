type Dictionary = Record<string, string>;

const nb: Dictionary = {
  'push.confirm':'Sende denne push-meldingen til alle som har aktivert varsler for denne organisasjonen?','push.sentPrefix':'Meldingen ble sendt til denne organisasjonen. Levert: ','push.failedCount':'. Feilet: ','push.sendFailed':'Push-meldingen kunne ikke sendes.','push.section':'Varslinger','push.title':'Send manuell push-melding','push.subtitle':'Meldingen sendes bare til brukere som har aktivert varsler for denne organisasjonen.','push.heading':'Overskrift','push.headingPlaceholder':'For eksempel: Viktig informasjon','push.message':'Melding','push.messagePlaceholder':'Skriv meldingen som skal vises i varselet og i appen.','push.preview':'Forhåndsvisning','push.previewHeading':'Overskrift','push.previewMessage':'Meldingstekst','push.sending':'Sender...','push.send':'Send push-melding'
};
const en: Dictionary = {
  'push.confirm':'Send this push notification to everyone who has enabled notifications for this organization?','push.sentPrefix':'The message was sent to this organization. Delivered: ','push.failedCount':'. Failed: ','push.sendFailed':'The push notification could not be sent.','push.section':'Notifications','push.title':'Send a manual push notification','push.subtitle':'The message is only sent to users who have enabled notifications for this organization.','push.heading':'Title','push.headingPlaceholder':'For example: Important information','push.message':'Message','push.messagePlaceholder':'Write the message that should appear in the notification and in the app.','push.preview':'Preview','push.previewHeading':'Title','push.previewMessage':'Message text','push.sending':'Sending...','push.send':'Send push notification'
};
const tr: Dictionary = {
  'push.confirm':'Bu push bildirimi, bu kuruluş için bildirimleri etkinleştiren herkese gönderilsin mi?','push.sentPrefix':'Mesaj bu kuruluşa gönderildi. Teslim edilen: ','push.failedCount':'. Başarısız: ','push.sendFailed':'Push bildirimi gönderilemedi.','push.section':'Bildirimler','push.title':'Manuel push bildirimi gönder','push.subtitle':'Mesaj yalnızca bu kuruluş için bildirimleri etkinleştiren kullanıcılara gönderilir.','push.heading':'Başlık','push.headingPlaceholder':'Örneğin: Önemli bilgi','push.message':'Mesaj','push.messagePlaceholder':'Bildirimde ve uygulamada gösterilecek mesajı yazın.','push.preview':'Önizleme','push.previewHeading':'Başlık','push.previewMessage':'Mesaj metni','push.sending':'Gönderiliyor...','push.send':'Push bildirimi gönder'
};
const ar: Dictionary = {
  'push.confirm':'هل تريد إرسال هذا الإشعار إلى جميع من فعّلوا الإشعارات لهذه المؤسسة؟','push.sentPrefix':'تم إرسال الرسالة إلى هذه المؤسسة. تم التسليم: ','push.failedCount':'. فشل: ','push.sendFailed':'تعذر إرسال الإشعار.','push.section':'الإشعارات','push.title':'إرسال إشعار يدوي','push.subtitle':'تُرسل الرسالة فقط إلى المستخدمين الذين فعّلوا الإشعارات لهذه المؤسسة.','push.heading':'العنوان','push.headingPlaceholder':'مثلاً: معلومات مهمة','push.message':'الرسالة','push.messagePlaceholder':'اكتب الرسالة التي ستظهر في الإشعار وفي التطبيق.','push.preview':'معاينة','push.previewHeading':'العنوان','push.previewMessage':'نص الرسالة','push.sending':'جارٍ الإرسال...','push.send':'إرسال الإشعار'
};
const ur: Dictionary = {
  'push.confirm':'کیا یہ پش اطلاع ان سب کو بھیجی جائے جنہوں نے اس تنظیم کے لیے اطلاعات فعال کی ہیں؟','push.sentPrefix':'پیغام اس تنظیم کو بھیج دیا گیا۔ موصول: ','push.failedCount':'. ناکام: ','push.sendFailed':'پش اطلاع نہیں بھیجی جا سکی۔','push.section':'اطلاعات','push.title':'دستی پش اطلاع بھیجیں','push.subtitle':'پیغام صرف ان صارفین کو بھیجا جاتا ہے جنہوں نے اس تنظیم کے لیے اطلاعات فعال کی ہیں۔','push.heading':'عنوان','push.headingPlaceholder':'مثلاً: اہم معلومات','push.message':'پیغام','push.messagePlaceholder':'وہ پیغام لکھیں جو اطلاع اور ایپ میں دکھایا جائے گا۔','push.preview':'پیش نظارہ','push.previewHeading':'عنوان','push.previewMessage':'پیغام کا متن','push.sending':'بھیجا جا رہا ہے...','push.send':'پش اطلاع بھیجیں'
};

const dictionaries: Record<string, Dictionary> = { nb, en, tr, ar, ur };
export function getPushTranslation(language: string, key: string) {
  return dictionaries[language]?.[key] || en[key] || nb[key] || key;
}
