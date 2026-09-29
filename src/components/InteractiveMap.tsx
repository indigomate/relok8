import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { Listing } from '../types';
import { formatPLN, SupportedLocale } from '../utils/formatters';
import { MapPin, Navigation, ZoomIn, ZoomOut, Check, ArrowRight, X } from 'lucide-react';

interface InteractiveMapProps {
  listings: Listing[];
  selectedListing?: Listing | null;
  onSelectListing: (listing: Listing) => void;
  onHoverListing?: (listingId: string | null) => void;
  hoveredListingId?: string | null;
  locale?: SupportedLocale;
  className?: string;
  cityFilter?: string;
}

// City default coordinates fallback
const CITY_COORDINATES: Record<string, [number, number]> = {
  Warsaw: [52.2297, 21.0122],
  Kraków: [50.0647, 19.9450],
  Wrocław: [51.1079, 17.0385],
  Gdańsk: [54.3520, 18.6466],
  Lublin: [51.2465, 22.5684],
  'All Poland': [52.0693, 19.4803]
};

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  listings,
  selectedListing,
  onSelectListing,
  onHoverListing,
  hoveredListingId,
  locale = 'en',
  className = '',
  cityFilter = 'All Poland'
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const [activeListing, setActiveListing] = useState<Listing | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialCenter = CITY_COORDINATES[cityFilter] || CITY_COORDINATES['All Poland'];
    const initialZoom = cityFilter === 'All Poland' ? 6 : 13;

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      zoomControl: false,
      scrollWheelZoom: true,
      attributionControl: false
    });

    // CartoDB Positron - Crisp, light, modern marketplace tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    // Attribution
    L.control.attribution({
      position: 'bottomright',
      prefix: false
    }).addAttribution('&copy; <a href="https://carto.com/">CARTO</a>').addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers dynamically when listings change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    const validListings = listings.filter((l) => l.lat && l.lng);

    validListings.forEach((listing) => {
      const isSelected = activeListing?.id === listing.id || hoveredListingId === listing.id;
      const priceText = `${formatPLN(listing.monthlyRentPLN, locale).replace(' zł', '').trim()} zł`;

      const markerHtml = `
        <div class="r8-price-marker ${isSelected ? 'active' : ''}">
          <span>${priceText}</span>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'r8-leaflet-marker-wrapper',
        html: markerHtml,
        iconSize: [60, 28],
        iconAnchor: [30, 14]
      });

      const marker = L.marker([listing.lat!, listing.lng!], {
        icon: customIcon,
        zIndexOffset: isSelected ? 1000 : 10
      });

      marker.on('click', () => {
        setActiveListing(listing);
        map.panTo([listing.lat!, listing.lng!], { animate: true, duration: 0.5 });
      });

      marker.on('mouseover', () => {
        if (onHoverListing) onHoverListing(listing.id);
      });

      marker.on('mouseout', () => {
        if (onHoverListing) onHoverListing(null);
      });

      markersGroup.addLayer(marker);
    });

    // Auto-fit bounds if we have listings
    if (validListings.length > 0) {
      const bounds = L.latLngBounds(validListings.map((l) => [l.lat!, l.lng!]));
      if (bounds.isValid()) {
        map.flyToBounds(bounds, {
          padding: [50, 50],
          maxZoom: cityFilter === 'All Poland' ? 9 : 14,
          duration: 0.8
        });
      }
    } else if (CITY_COORDINATES[cityFilter]) {
      map.flyTo(CITY_COORDINATES[cityFilter], cityFilter === 'All Poland' ? 6 : 13, {
        duration: 0.8
      });
    }
  }, [listings, activeListing?.id, hoveredListingId, locale, cityFilter]);

  // Sync selectedListing from external parent
  useEffect(() => {
    if (selectedListing && selectedListing.lat && selectedListing.lng && mapInstanceRef.current) {
      setActiveListing(selectedListing);
      mapInstanceRef.current.panTo([selectedListing.lat, selectedListing.lng], {
        animate: true,
        duration: 0.6
      });
    }
  }, [selectedListing]);

  // Custom Zoom Handlers
  const handleZoomIn = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomOut();
  };

  const handleRecenter = () => {
    if (!mapInstanceRef.current) return;
    const validListings = listings.filter((l) => l.lat && l.lng);
    if (validListings.length > 0) {
      const bounds = L.latLngBounds(validListings.map((l) => [l.lat!, l.lng!]));
      mapInstanceRef.current.flyToBounds(bounds, { padding: [50, 50], duration: 0.6 });
    } else if (CITY_COORDINATES[cityFilter]) {
      mapInstanceRef.current.flyTo(CITY_COORDINATES[cityFilter], 13, { duration: 0.6 });
    }
  };

  return (
    <div className={`relative w-full h-full min-h-[420px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-sm ${className}`}>
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Status Badge */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-slate-200 shadow-sm text-xs font-semibold text-slate-700">
        <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
        <span>
          {listings.length} {locale === 'pl' ? 'pokoi na mapie' : 'rooms on map'}
        </span>
        {cityFilter !== 'All Poland' && (
          <span className="text-slate-400">· {cityFilter}</span>
        )}
      </div>

      {/* Zoom and Recenter Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-1.5 shadow-sm">
        <button
          type="button"
          onClick={handleZoomIn}
          aria-label="Zoom in"
          className="w-8 h-8 rounded-lg bg-white/95 hover:bg-white text-slate-700 flex items-center justify-center border border-slate-200 cursor-pointer transition hover:text-indigo-600 shadow-xs"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          aria-label="Zoom out"
          className="w-8 h-8 rounded-lg bg-white/95 hover:bg-white text-slate-700 flex items-center justify-center border border-slate-200 cursor-pointer transition hover:text-indigo-600 shadow-xs"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleRecenter}
          aria-label="Recenter map"
          className="w-8 h-8 rounded-lg bg-white/95 hover:bg-white text-slate-700 flex items-center justify-center border border-slate-200 cursor-pointer transition hover:text-indigo-600 shadow-xs"
        >
          <Navigation className="w-4 h-4" />
        </button>
      </div>

      {/* Interactive Active Room Preview Overlay Card (when user clicks a marker) */}
      {activeListing && (
        <div className="absolute bottom-4 inset-x-4 sm:left-4 sm:right-auto sm:w-80 z-20 animate-in slide-in-from-bottom-3 duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xl flex flex-col gap-2.5">
            <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden bg-slate-100">
              <img
                src={activeListing.images[0]}
                alt={activeListing.title}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setActiveListing(null)}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center cursor-pointer transition"
                aria-label="Close preview"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <div className="absolute bottom-2 left-2 flex gap-1">
                <span className="px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-semibold backdrop-blur-xs">
                  {activeListing.roomType}
                </span>
                {activeListing.meldunekAllowed && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-600/90 text-white text-[10px] font-semibold backdrop-blur-xs">
                    ✓ Meldunek
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <h4 className="font-bold text-slate-900 text-sm truncate">
                {activeListing.shortTitle || activeListing.title}
              </h4>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-indigo-600 shrink-0" />
                <span className="truncate">{activeListing.city}, {activeListing.district}</span>
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-base font-extrabold text-slate-900">
                  {formatPLN(activeListing.monthlyRentPLN, locale)}
                </span>
                <span className="text-xs text-slate-400"> /mo</span>
              </div>

              <button
                type="button"
                onClick={() => onSelectListing(activeListing)}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition"
              >
                <span>{locale === 'pl' ? 'Zobacz pokój' : 'View room'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
