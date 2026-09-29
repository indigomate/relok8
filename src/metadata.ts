/**
 * Relok8 Application Metadata Configuration
 * Compatible with Next.js App Router (app/layout.tsx or app/page.tsx)
 * and SPA document head synchronization.
 */

export interface MetadataConfig {
  metadataBase: URL;
  title: {
    default: string;
    template: string;
  };
  description: string;
  keywords: string[];
  authors: { name: string; url: string }[];
  creator: string;
  publisher: string;
  robots: {
    index: boolean;
    follow: boolean;
    googleBot: {
      index: boolean;
      follow: boolean;
      'max-video-preview': number;
      'max-image-preview': string;
      'max-snippet': number;
    };
  };
  alternates: {
    canonical: string;
    languages: Record<string, string>;
  };
  openGraph: {
    type: string;
    locale: string;
    url: string;
    title: string;
    description: string;
    siteName: string;
    images: {
      url: string;
      width: number;
      height: number;
      alt: string;
    }[];
  };
  twitter: {
    card: string;
    title: string;
    description: string;
    images: string[];
    creator: string;
  };
  icons: {
    icon: string;
    shortcut: string;
    apple: string;
  };
  manifest: string;
}

export const metadata: MetadataConfig = {
  metadataBase: new URL('https://relok8.online'),
  title: {
    default: 'Relok8 | Peer-to-Peer Lease Transfers & Student Housing in Poland',
    template: '%s | Relok8 Poland',
  },
  description:
    'Exit your lease early with zero penalties or find pre-vetted student & expat housing in Warsaw, Kraków, Wrocław, and Lublin. Landlord-approved lease assignments (Cesja umowy najmu).',
  keywords: [
    'lease transfer Poland',
    'student housing Warsaw',
    'cesja umowy najmu',
    'expat apartments Krakow',
    'no broker fee housing Poland',
    'take over lease Lublin',
    'Relok8',
    'relok8.online',
    'meldunek allowed rooms',
  ],
  authors: [{ name: 'Relok8 Team', url: 'https://relok8.online' }],
  creator: 'Relok8',
  publisher: 'Relok8',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://relok8.online',
    languages: {
      'en-US': 'https://relok8.online',
      'pl-PL': 'https://relok8.online?lang=pl',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://relok8.online',
    title: 'Relok8 — Zero-Penalty Lease Takeovers for Expats & Students in Poland',
    description:
      'Passing your room on Day 1 or looking for a short-notice apartment in Poland? Skip agency fees and exit leases smoothly with legal landlord protection.',
    siteName: 'Relok8',
    images: [
      {
        url: 'https://relok8.online/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Relok8 - Peer to Peer Housing & Lease Assignment Engine in Poland',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Relok8 | Zero-Penalty Lease Transfers in Poland',
    description: 'Pass your lease or take over verified student rooms across Poland without broker fees.',
    images: ['https://relok8.online/og-image.jpg'],
    creator: '@relok8_online',
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};
