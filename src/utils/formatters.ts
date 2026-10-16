export type SupportedLocale = 'en' | 'pl' | 'uk' | 'es';

export function isRTL(_locale: SupportedLocale): boolean {
  return false;
}

export function formatPLN(amount: number, locale: SupportedLocale = 'en'): string {
  const localeMap: Record<SupportedLocale, string> = {
    en: 'en-US',
    pl: 'pl-PL',
    uk: 'uk-UA',
    es: 'es-ES'
  };

  return new Intl.NumberFormat(localeMap[locale] || 'en-US', {
    style: 'currency',
    currency: 'PLN',
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatDate(dateString: string, locale: SupportedLocale = 'en'): string {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const day = d.getDate();
    const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthsPl = ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru'];
    const monthsUk = ['січ', 'лют', 'бер', 'кві', 'тра', 'чер', 'лип', 'сер', 'вер', 'жов', 'лис', 'gru'];
    const monthsEs = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    
    let month = monthsEn[d.getMonth()];
    if (locale === 'pl') month = monthsPl[d.getMonth()];
    if (locale === 'uk') month = monthsUk[d.getMonth()];
    if (locale === 'es') month = monthsEs[d.getMonth()];
    
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return dateString;
  }
}

