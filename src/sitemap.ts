/**
 * Next.js compatible Sitemap generator (app/sitemap.ts)
 */

export interface SitemapEntry {
  url: string;
  lastModified?: string | Date;
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export default async function sitemap(): Promise<SitemapEntry[]> {
  const baseUrl = 'https://relok8.online';
  const cities = ['warsaw', 'krakow', 'wroclaw', 'lublin', 'gdansk'];

  const cityRoutes: SitemapEntry[] = cities.map((city) => ({
    url: `${baseUrl}/rooms/${city}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/leave-your-lease`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    ...cityRoutes,
  ];
}
