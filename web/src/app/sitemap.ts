import type { MetadataRoute } from 'next';
import { LEGAL_DOCUMENTS, LEGAL_HUB_ROUTE } from '@/config/legal';

/**
 * Site map for crawlable public routes. Legal/documentation pages are
 * public and indexed; authenticated user content is intentionally NOT
 * listed here (never expose private user data).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, '') ||
    process.env.FRONTEND_URL?.replace(/\/+$/, '') ||
    'https://web-drab-nu-21.vercel.app';

  const staticRoutes = ['/', LEGAL_HUB_ROUTE, ...LEGAL_DOCUMENTS.map((doc) => doc.route)];

  return staticRoutes.map((route) => ({
    url: `${baseUrl}${route === '/' ? '' : route}`,
    lastModified: new Date(),
    changeFrequency: route === '/' ? 'weekly' : 'monthly',
    priority: route === '/' ? 1 : 0.6,
  }));
}
