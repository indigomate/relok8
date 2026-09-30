import React from 'react';
import { Bookmark, ArrowLeft, Trash2, MapPin, Building, Sparkles } from 'lucide-react';
import { Listing } from '../types';
import { formatPLN, formatDate, SupportedLocale } from '../utils/formatters';

interface SavedApartmentsPageProps {
  savedListings: Listing[];
  onSelectListing: (listing: Listing) => void;
  onRemoveSaved: (id: string) => void;
  onClearAll: () => void;
  onBrowseListings: () => void;
  locale?: SupportedLocale;
}

export const SavedApartmentsPage: React.FC<SavedApartmentsPageProps> = ({
  savedListings,
  onSelectListing,
  onRemoveSaved,
  onClearAll,
  onBrowseListings,
  locale = 'en'
}) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 text-left">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-8 space-y-6">
        
        {/* Header with back button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <button
              type="button"
              onClick={onBrowseListings}
              className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-semibold mb-2 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to all rooms</span>
            </button>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Bookmark className="w-6 h-6 text-indigo-600 fill-indigo-600" />
              <span>Saved Apartments ({savedListings.length})</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Your shortlisted student housing and expat lease assignments across Poland.
            </p>
          </div>

          {savedListings.length > 0 && (
            <button
              type="button"
              onClick={onClearAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-600 transition-colors cursor-pointer self-start sm:self-auto"
            >
              <Trash2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Clear all saved</span>
            </button>
          )}
        </div>

        {/* Listings Grid or Empty State */}
        {savedListings.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-4 my-8">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <Bookmark className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900">No saved apartments yet</h2>
              <p className="text-xs text-slate-500">
                Browse our rooms in Warsaw, Kraków, Wrocław, Gdańsk, or Lublin and click "Save apartment" to keep your favorites here.
              </p>
            </div>
            <button
              type="button"
              onClick={onBrowseListings}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors cursor-pointer"
            >
              Explore available rooms
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedListings.map((listing) => (
              <div
                key={listing.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-lg transition-all duration-200 flex flex-col justify-between group"
              >
                {/* Photo & Actions */}
                <div 
                  className="relative aspect-[4/3] bg-slate-100 cursor-pointer overflow-hidden"
                  onClick={() => onSelectListing(listing)}
                >
                  <img
                    src={listing.images[0]}
                    alt={listing.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.currentTarget.src = '/images/listing_warsaw_mokotow_1790621438299.jpg';
                    }}
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-black/50 backdrop-blur-md text-white">
                    {listing.city} · {listing.roomType}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveSaved(listing.id);
                    }}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 hover:bg-rose-50 text-slate-600 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer shadow-sm"
                    title="Remove from saved"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Card Info */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div 
                    className="cursor-pointer space-y-1"
                    onClick={() => onSelectListing(listing)}
                  >
                    <h3 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors line-clamp-1">
                      {listing.title}
                    </h3>
                    <div className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span className="truncate">{listing.address}</span>
                    </div>
                    <div className="pt-1 flex items-center gap-2 text-[11px] text-emerald-700 font-medium">
                      <span>✓ Address registration (meldunek) OK</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-base font-extrabold text-slate-900 font-mono">
                        {formatPLN(listing.monthlyRentPLN, locale)}
                      </span>
                      <span className="text-xs text-slate-500"> /mo</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelectListing(listing)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold cursor-pointer transition-colors"
                    >
                      View details →
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};
