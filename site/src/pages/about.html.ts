import type { APIRoute } from 'astro';
import { legacyRedirects, renderLegacyRedirect } from '../data/legacy-redirects';

export const GET: APIRoute = () => new Response(
  renderLegacyRedirect(legacyRedirects['/about.html'], import.meta.env.PROD && import.meta.env.PUBLIC_SITE_MODE === 'production'),
  { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
);
