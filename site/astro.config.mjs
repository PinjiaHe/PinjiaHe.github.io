import { defineConfig } from 'astro/config';
export default defineConfig({
  site: 'https://pinjiahe.github.io',
  output: 'static',
  trailingSlash: 'always',
  devToolbar: { enabled: false },
});
