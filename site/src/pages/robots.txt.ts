import type { APIRoute } from 'astro';

export const GET: APIRoute = () => {
  const isPublicBuild = import.meta.env.PROD && import.meta.env.PUBLIC_SITE_MODE === 'production';
  return new Response(`User-agent: *\nDisallow: ${isPublicBuild ? '' : '/'}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
