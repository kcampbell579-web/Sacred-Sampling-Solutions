import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE } from '../lib/site.js';

// General site feed — latest episodes and articles combined, for readers.
export async function GET(context) {
  const episodes = await getCollection('episodes', (e) => !e.data.draft);
  const articles = await getCollection('articles', (a) => !a.data.draft);

  const items = [
    ...episodes.map((e) => ({
      title: e.data.title,
      pubDate: e.data.date,
      description: e.data.description,
      link: `/episodes/${e.slug}/`,
      categories: ['Podcast', e.data.series],
    })),
    ...articles.map((a) => ({
      title: a.data.title,
      pubDate: a.data.date,
      description: a.data.description,
      link: `/articles/${a.slug}/`,
      categories: ['Article', a.data.category],
    })),
  ].sort((x, y) => y.pubDate.valueOf() - x.pubDate.valueOf());

  return rss({
    title: `${SITE.name} — Latest`,
    description: SITE.description,
    site: context.site,
    items,
  });
}
