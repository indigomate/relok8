export type SupportedLocale = 'en' | 'pl' | 'uk';

export function formatPLN(amount: number, locale: SupportedLocale = 'en'): string {
  if (locale === 'pl') {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
      maximumFractionDigits: 0
    }).format(amount);
  }
  if (locale === 'uk') {
    return new Intl.NumberFormat('uk-UA', {
      style: 'currency',
      currency: 'PLN',
      maximumFractionDigits: 0
    }).format(amount);
  }
  return new Intl.NumberFormat('en-US', {
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
    const monthsUk = ['січ', 'лют', 'бер', 'кві', 'тра', 'чер', 'лип', 'сер', 'вер', 'жов', 'лис', 'гру'];
    
    let month = monthsEn[d.getMonth()];
    if (locale === 'pl') month = monthsPl[d.getMonth()];
    if (locale === 'uk') month = monthsUk[d.getMonth()];
    
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return dateString;
  }
}
