import { ENABLED_CITIES } from './data/cities';

export interface SitemapEntry {
  url: string;
  lastModified?: string | Date;
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export default async function sitemap(): Promise<SitemapEntry[]> {
  const baseUrl = 'https://relok8.online';

  const cityRoutes: SitemapEntry[] = [];
  ENABLED_CITIES.forEach((city) => {
    cityRoutes.push(
      {
        url: `${baseUrl}/${city.slug}/rooms`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.8
      },
      {
        url: `${baseUrl}/pl/${city.slug}/rooms`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.8
      }
    );
  });

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0
    },
    {
      url: `${baseUrl}/pl`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0
    },
    {
      url: `${baseUrl}/leave-your-lease`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9
    },
    {
      url: `${baseUrl}/how-it-works`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7
    },
    {
      url: `${baseUrl}/legal/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5
    },
    {
      url: `${baseUrl}/legal/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5
    },
    ...cityRoutes
  ];
}
