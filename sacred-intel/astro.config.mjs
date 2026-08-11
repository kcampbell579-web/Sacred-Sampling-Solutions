import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// The production domain isn't finalized yet. Update `site` once the domain
// is connected (e.g. https://www.sacredintel.com) so canonical URLs, the
// sitemap, and the podcast RSS feed emit absolute links.
export default defineConfig({
  site: 'https://www.sacredintel.com',
  integrations: [sitemap()],
});
