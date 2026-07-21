import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { findLanguage } from './languageRegistry';
import { getCurrentOrganizationId } from './organization';
import { supabase } from './supabase';

type Dictionary = Record<string, string>;

const nb: Dictionary = {
  'nav.home':'Hjem','nav.contact':'Kontakt',
  'contact.title':'Kontakt','contact.subtitle':'Ta kontakt med oss','contact.location':'FYSISK ADRESSE','contact.address':'Organisasjonens adresse','contact.directions':'FINN FREM','contact.askTitle':'Still et spørsmål','contact.askSubtitle':'Send spørsmålet ditt via WhatsApp','contact.askBody':'Har du spørsmål? Kontakt organisasjonen via WhatsApp, så hjelper vi deg så snart som mulig.','contact.askButton':'SPØR VIA WHATSAPP','contact.staff':'Våre kontaktpersoner','contact.noStaff':'Ingen kontaktpersoner er registrert ennå.','contact.call':'Ring',
  'home.changeCity':'Endre by','home.searchCity':'Søk etter by...','home.useLocation':'Bruk min posisjon','home.nextPrayer':'Neste','home.loadingPrayer':'Henter bønnetider...','home.todayProgram':'Dagens program','home.upcomingActivities':'Kommende aktiviteter','home.noUpcomingActivities':'Ingen kommende aktiviteter.','home.news':'Nyheter','home.noNews':'Ingen nyheter ennå.',
  'install.title':'Installer appen','install.description':'Legg den til på startskjermen for rask tilgang','install.button':'Installer','install.close':'Lukk',
  'common.loading':'Laster...','common.close':'Lukk','common.save':'Lagre','common.saving':'Lagrer...',
  'recovery.title':'Velg nytt passord','recovery.password':'Nytt passord','recovery.repeat':'Gjenta nytt passord','recovery.show':'Vis passord','recovery.tooShort':'Passordet må ha minst 6 tegn.','recovery.noMatch':'Passordene er ikke like.','recovery.noConnection':'Ingen forbindelse til systemet.','recovery.failed':'Passordet kunne ikke lagres: ','recovery.success':'Passordet er lagret. Du kan nå logge inn med det nye passordet.',
  'login.title':'Administratorinnlogging','login.email':'E-post','login.password':'Passord','login.submit':'Logg inn','login.invalid':'Feil e-post eller passord.','login.forgotPassword':'Glemt passord?','login.temporaryPassword':'Du har logget inn med et midlertidig passord. Velg et permanent passord før du fortsetter.','login.showPasswords':'Vis passordene','login.savePassword':'Lagre nytt passord','login.passwordUpdateFailed':'Passordet kunne ikke oppdateres: ',
  'forgot.title':'Tilbakestill passord','forgot.description':'Skriv inn e-postadressen din. Du får tilsendt en sikker lenke for å velge nytt passord.','forgot.emailRequired':'E-post er obligatorisk.','forgot.sendFailed':'E-posten kunne ikke sendes: ','forgot.sent':'En lenke for tilbakestilling er sendt til e-postadressen din.','forgot.submit':'Send tilbakestillingslenke',
  'installGuide.title':'Installer appen','installGuide.subtitle':'Legg appen til på startskjermen','installGuide.iosShareTitle':'Trykk på Del','installGuide.iosShareBody':'Trykk på Del-knappen nederst i Safari.','installGuide.share':'Del','installGuide.bottomOfScreen':'Nederst på skjermen','installGuide.addHomeTitle':'Velg Legg til på Hjem-skjerm','installGuide.iosAddHomeBody':'Rull ned i menyen og trykk på «Legg til på Hjem-skjerm».','installGuide.addHome':'Legg til på Hjem-skjerm','installGuide.doneTitle':'Ferdig!','installGuide.doneBody':'Appikonet vises nå på startskjermen, og appen kan åpnes direkte derfra.','installGuide.openMenuTitle':'Åpne nettlesermenyen','installGuide.samsungMenuBody':'Trykk på menyikonet i Samsung Internet.','installGuide.topRight':'Øverst til høyre','installGuide.menu':'Meny','installGuide.samsungAddHomeBody':'Velg «Legg til side på» og deretter startskjermen.','installGuide.browserMenu':'Nettlesermeny','installGuide.genericBody':'Åpne nettlesermenyen og velg «Legg til på startskjermen» eller «Installer app».','installGuide.doneShort':'Appikonet vises nå på startskjermen.','installGuide.understood':'Forstått',
  'activity.label':'Aktivitet','activity.contact':'Kontaktperson','activity.addCalendar':'Legg til i kalender','activity.addReminder':'Legg til påminnelse','activity.call':'Ring','activity.sms':'SMS','activity.whatsapp':'WhatsApp','activity.email':'E-post'
};

const en: Dictionary = {
  'nav.home':'Home','nav.contact':'Contact',
  'contact.title':'Contact','contact.subtitle':'Get in touch with us','contact.location':'PHYSICAL LOCATION','contact.address':'Organization address','contact.directions':'GET DIRECTIONS','contact.askTitle':'Ask a question','contact.askSubtitle':'Send your question via WhatsApp','contact.askBody':'Do you have a question? Contact the organization through WhatsApp and we will help as soon as possible.','contact.askButton':'ASK ON WHATSAPP','contact.staff':'Our contacts','contact.noStaff':'No contacts have been registered yet.','contact.call':'Call',
  'home.changeCity':'Change city','home.searchCity':'Search city...','home.useLocation':'Use my location','home.nextPrayer':'Next','home.loadingPrayer':'Loading prayer times...','home.todayProgram':'Today’s program','home.upcomingActivities':'Upcoming activities','home.noUpcomingActivities':'No upcoming activities.','home.news':'News','home.noNews':'No news yet.',
  'install.title':'Install the app','install.description':'Add it to your home screen for quick access','install.button':'Install','install.close':'Close',
  'common.loading':'Loading...','common.close':'Close','common.save':'Save','common.saving':'Saving...',
  'recovery.title':'Choose a new password','recovery.password':'New password','recovery.repeat':'Repeat new password','recovery.show':'Show password','recovery.tooShort':'The password must contain at least 6 characters.','recovery.noMatch':'The passwords do not match.','recovery.noConnection':'No connection to the system.','recovery.failed':'The password could not be saved: ','recovery.success':'The password has been saved. You can now sign in with the new password.',
  'login.title':'Administrator sign in','login.email':'Email','login.password':'Password','login.submit':'Sign in','login.invalid':'Incorrect email or password.','login.forgotPassword':'Forgot password?','login.temporaryPassword':'You signed in with a temporary password. Choose a permanent password before continuing.','login.showPasswords':'Show passwords','login.savePassword':'Save new password','login.passwordUpdateFailed':'The password could not be updated: ',
  'forgot.title':'Reset password','forgot.description':'Enter your email address. We will send you a secure link to choose a new password.','forgot.emailRequired':'Email is required.','forgot.sendFailed':'The reset email could not be sent: ','forgot.sent':'A password reset link has been sent to your email address.','forgot.submit':'Send reset link',
  'installGuide.title':'Install the app','installGuide.subtitle':'Add the app to your home screen','installGuide.iosShareTitle':'Tap Share','installGuide.iosShareBody':'Tap the Share button at the bottom of Safari.','installGuide.share':'Share','installGuide.bottomOfScreen':'Bottom of screen','installGuide.addHomeTitle':'Choose Add to Home Screen','installGuide.iosAddHomeBody':'Scroll down in the menu and tap “Add to Home Screen”.','installGuide.addHome':'Add to Home Screen','installGuide.doneTitle':'Done!','installGuide.doneBody':'The app icon is now on your home screen and can be opened directly from there.','installGuide.openMenuTitle':'Open the browser menu','installGuide.samsungMenuBody':'Tap the menu icon in Samsung Internet.','installGuide.topRight':'Top right','installGuide.menu':'Menu','installGuide.samsungAddHomeBody':'Choose “Add page to” and then Home screen.','installGuide.browserMenu':'Browser menu','installGuide.genericBody':'Open the browser menu and choose “Add to Home screen” or “Install app”.','installGuide.doneShort':'The app icon is now on your home screen.','installGuide.understood':'Got it',
  'activity.label':'Activity','activity.contact':'Contact person','activity.addCalendar':'Add to calendar','activity.addReminder':'Add reminder','activity.call':'Call','activity.sms':'SMS','activity.whatsapp':'WhatsApp','activity.email':'Email'
};

const da: Dictionary = {
  ...en,
  'nav.home':'Hjem','nav.contact':'Kontakt','contact.title':'Kontakt','contact.subtitle':'Kontakt os','home.news':'Nyheder','home.noNews':'Ingen nyheder endnu.','common.loading':'Indlæser...','common.close':'Luk','common.save':'Gem','common.saving':'Gemmer...','login.title':'Administratorlogin','login.email':'E-mail','login.password':'Adgangskode','login.submit':'Log ind','forgot.title':'Nulstil adgangskode'
};
const tr: Dictionary = { ...en, 'nav.home':'Ana Sayfa','nav.contact':'İletişim','home.news':'Haberler','home.noNews':'Henüz haber yok.','common.loading':'Yükleniyor...','common.close':'Kapat','common.save':'Kaydet','common.saving':'Kaydediliyor...','login.title':'Yönetici Girişi','login.email':'E-posta','login.password':'Şifre','login.submit':'Giriş Yap','forgot.title':'Şifreyi Sıfırla' };
const ar: Dictionary = { ...en, 'nav.home':'الرئيسية','nav.contact':'اتصل بنا','home.news':'الأخبار','common.loading':'جارٍ التحميل...','common.close':'إغلاق','common.save':'حفظ','login.title':'تسجيل دخول المسؤول' };
const ur: Dictionary = { ...en, 'nav.home':'ہوم','nav.contact':'رابطہ','home.news':'خبریں','common.loading':'لوڈ ہو رہا ہے...','common.close':'بند کریں','common.save':'محفوظ کریں','login.title':'ایڈمن لاگ اِن' };

const dictionaries: Record<string, Dictionary> = { nb, en, da, tr, ar, ur };

type I18nValue = { language:string; direction:'ltr'|'rtl'; locale:string; t:(key:string)=>string; reload:()=>Promise<void> };
const I18nContext = createContext<I18nValue>({ language:'nb', direction:'ltr', locale:'nb-NO', t:(key)=>nb[key]||key, reload:async()=>{} });

export function AppI18nProvider({ children }: { children: ReactNode }) {
  const [language,setLanguage]=useState('nb');
  const load=useCallback(async()=>{
    if(!supabase)return;
    const organizationId=getCurrentOrganizationId();
    if(!organizationId)return;
    const {data}=await supabase.from('organizations').select('language').eq('id',organizationId).maybeSingle();
    setLanguage(findLanguage(data?.language).code);
  },[]);
  useEffect(()=>{
    void load();
    const handler=()=>void load();
    window.addEventListener('yasaflow-organization-settings-changed',handler);
    window.addEventListener('yasaflow-organization-changed',handler);
    return()=>{
      window.removeEventListener('yasaflow-organization-settings-changed',handler);
      window.removeEventListener('yasaflow-organization-changed',handler);
    };
  },[load]);
  const meta=findLanguage(language);
  useEffect(()=>{document.documentElement.lang=meta.locale;document.documentElement.dir=meta.direction;},[meta.locale,meta.direction]);
  const value=useMemo<I18nValue>(()=>({language:meta.code,direction:meta.direction,locale:meta.locale,t:(key)=>dictionaries[meta.code]?.[key]||en[key]||nb[key]||key,reload:load}),[meta.code,meta.direction,meta.locale,load]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useAppI18n(){return useContext(I18nContext);}
