import { PlacePage } from '../pages/PlacePage';
import { navigateTo } from '../utils/router';
import type { SupportedLocale } from '../utils/formatters';

// Keep existing landlord URLs working with the same property workflow as My Place.
export function LandlordDashboard({ onRequireLogin, locale = 'en', onBack, onNavigateToListing }: {
  onRequireLogin?: () => void;
  locale?: SupportedLocale;
  onBack?: () => void;
  onNavigateToListing?: (id: string) => void;
  overrideLandlordEmail?: string;
}) {
  return <PlacePage locale={locale} onRequireLogin={onRequireLogin} onBack={onBack || (() => navigateTo(locale === 'pl' ? '/pl' : '/'))} onOpenListing={onNavigateToListing} />;
}
