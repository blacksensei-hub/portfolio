import type { APIRoute } from 'astro';

// Generated rather than static, so the sitemap line follows SITE_URL (spec 0006, AC-6).
export const GET: APIRoute = ({ site }) => {
  const sitemap = new URL('sitemap-index.xml', site ?? 'https://example.com');
  return new Response(`User-agent: *\nAllow: /\nSitemap: ${sitemap.href}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
