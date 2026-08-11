import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE } from '../lib/site.js';

// Podcast RSS feed — the URL you submit to Apple Podcasts, Spotify, etc.
// Episodes with an `audio` URL get a proper <enclosure> so apps can play them.
export async function GET(context) {
  const episodes = (await getCollection('episodes', (e) => !e.data.draft)).sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf()
  );

  return rss({
    title: SITE.name,
    description: SITE.description,
    site: context.site,
    xmlns: { itunes: 'http://www.itunes.com/dtds/podcast-1.0.dtd' },
    customData: [
      '<language>en-us</language>',
      '<itunes:author>Sacred Intel</itunes:author>',
      '<itunes:type>episodic</itunes:type>',
      '<itunes:explicit>false</itunes:explicit>',
      '<itunes:category text="Science" />',
      '<itunes:category text="News" />',
    ].join(''),
    items: episodes.map((e) => ({
      title: `#${e.data.number} — ${e.data.title}`,
      pubDate: e.data.date,
      description: e.data.description,
      link: `/episodes/${e.slug}/`,
      categories: [e.data.series, ...e.data.topics],
      ...(e.data.audio
        ? { enclosure: { url: e.data.audio, length: 0, type: 'audio/mpeg' } }
        : {}),
      customData: `<itunes:duration>${e.data.duration}</itunes:duration><itunes:episode>${e.data.number}</itunes:episode>`,
    })),
  });
}
