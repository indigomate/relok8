import React from 'react';

export const relok8JsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://relok8.online/#organization',
      name: 'Relok8',
      url: 'https://relok8.online',
      logo: 'https://relok8.online/logo.png',
      description: 'Peer-to-peer lease assignment and relocation engine for foreign students and working expats in Poland.',
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'PL',
      },
    },
    {
      '@type': 'WebSite',
      '@id': 'https://relok8.online/#website',
      url: 'https://relok8.online',
      name: 'Relok8 Housing Marketplace',
      publisher: {
        '@id': 'https://relok8.online/#organization',
      },
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://relok8.online/?city={search_term_string}',
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'RealEstateAgent',
      name: 'Relok8 Lease Transfers',
      image: 'https://relok8.online/og-image.jpg',
      url: 'https://relok8.online',
      priceRange: 'PLN 1000 - PLN 5000',
      areaServed: [
        { '@type': 'City', name: 'Warsaw' },
        { '@type': 'City', name: 'Kraków' },
        { '@type': 'City', name: 'Wrocław' },
        { '@type': 'City', name: 'Lublin' },
        { '@type': 'City', name: 'Gdańsk' },
      ],
    },
  ],
};

export default function StructuredData() {
  return (
    <script
      id="relok8-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(relok8JsonLd) }}
    />
  );
}
