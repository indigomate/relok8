import { isDateOnly } from './leaseTiming';
export type SupportedLocale = 'en' | 'pl' | 'uk' | 'es';

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
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2
  }).format(amount);
}

export function formatDate(dateString: string, locale: SupportedLocale = 'en'): string {
  try {
    const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(dateString);
    if (dateOnly && !isDateOnly(dateString)) return dateString;
    const d = new Date(dateOnly ? dateString + 'T00:00:00Z' : dateString);
    if (isNaN(d.getTime())) return dateString;
    const day = dateOnly ? d.getUTCDate() : d.getDate();
    const monthIndex = dateOnly ? d.getUTCMonth() : d.getMonth();
    const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthsPl = ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru'];
    const monthsUk = ['січ', 'лют', 'бер', 'кві', 'тра', 'чер', 'лип', 'сер', 'вер', 'жов', 'лис', 'gru'];
    const monthsEs = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    
    let month = monthsEn[monthIndex];
    if (locale === 'pl') month = monthsPl[monthIndex];
    if (locale === 'uk') month = monthsUk[monthIndex];
    if (locale === 'es') month = monthsEs[monthIndex];
    
    const year = dateOnly ? d.getUTCFullYear() : d.getFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return dateString;
  }
}

