// Existing public URLs, retained when replacing the former Jekyll site.
export const legacyRedirects: Record<string, string> = {
  '/team/': '/lab/',
  '/teaching/': '/#teaching',
  '/services/': '/#service',
  '/cv/': '/files/pdf/CV.pdf',
  '/resume/': '/files/pdf/CV.pdf',
  '/about/': '/',
  '/about.html': '/',
  // Verified permalink fields in the original repository's _publications files.
  '/publication/2016-ISSRE/': '/publications/',
  '/publication/2017-ICWS/': '/publications/',
  '/publication/2020-ICSE/': '/publications/',
  '/publication/2021-CSUR/': '/publications/',
  '/publication/2021-ICSE/': '/publications/',
  '/publication/2023-ISSTAb/': '/publications/',
  '/publication/2024-ICSEb/': '/publications/',
  '/publication/2024-ICSEe/': '/publications/',
  '/publication/2024-ICLR/': '/publications/',
  '/publication/2025-ACLa/': '/publications/',
  '/publication/2025-ACLb/': '/publications/',
  '/publication/2025-ICSEa/': '/publications/',
  '/publication/2025-ICSEb/': '/publications/',
  '/publication/2025-ICLR/': '/publications/',
  '/publication/2025-NeurIPSa/': '/publications/',
  '/publication/2025-NeurIPSb/': '/publications/',
};

// Shared by directory pages and the exact /about.html endpoint.
// These are static HTML redirects; the host does not send an HTTP 301.
export function renderLegacyRedirect(target: string, isPublicBuild: boolean): string {
  const canonical = new URL(target, 'https://pinjiahe.github.io');
  canonical.hash = '';
  const escape = (value: string) => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="${isPublicBuild ? 'index, follow' : 'noindex, nofollow'}">
    ${isPublicBuild ? `<link rel="canonical" href="${escape(canonical.href)}">` : ''}
    <script>
      const destination = new URL(${JSON.stringify(target)}, window.location.origin);
      destination.search = window.location.search;
      if (!destination.hash) destination.hash = window.location.hash;
      window.location.replace(destination.href);
    </script>
    <meta http-equiv="refresh" content="0;url=${escape(target)}">
    <title>Page moved — Pinjia He</title>
    <style>body{max-width:40rem;margin:4rem auto;padding:0 1.5rem;font:1rem/1.7 system-ui,sans-serif;color:#2b3038}a{color:#1260b8}h1{font-size:1.75rem}</style>
  </head>
  <body><main><h1>This page has moved</h1><p><a href="${escape(target)}">Continue to the updated page</a>.</p></main></body>
</html>`;
}
