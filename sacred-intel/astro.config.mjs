import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Production domain (registered via GoDaddy). Used for canonical URLs, the
// sitemap, and absolute links in the podcast RSS feed. If you serve the site
// from the www subdomain instead, change this to https://www.sacredintel.org.
export default defineConfig({
  site: 'https://sacredintel.org',
  integrations: [sitemap()],
});
