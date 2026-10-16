/**
 * Next.js App Router compatible robots configuration (app/robots.ts)
 */

export interface RobotsConfig {
  rules: {
    userAgent: string | string[];
    allow?: string | string[];
    disallow?: string | string[];
  }[];
  sitemap: string;
}

export default function robots(): RobotsConfig {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/checkout/'],
      },
    ],
    sitemap: 'https://relok8.online/sitemap.xml',
  };
}
