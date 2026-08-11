import { defineCollection, z } from 'astro:content';

const SERIES = ['Disaster Files', 'Deep Dives', 'Behind the Headlines'] as const;

const episodes = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    number: z.number(),
    series: z.enum(SERIES),
    topics: z.array(z.string()).default([]),
    date: z.coerce.date(),
    duration: z.string().default('20 min'),
    description: z.string(),
    // Optional large episode image (place in /public and reference as "/img/…").
    // When omitted, generated artwork is used automatically.
    image: z.string().optional(),
    // Direct URL to the episode audio (MP3). Powers the on-page player and the
    // podcast RSS enclosure.
    audio: z.string().optional(),
    // YouTube video ID or full URL — renders an embedded player when present.
    video: z.string().optional(),
    guests: z.array(z.string()).default([]),
    sources: z
      .array(z.object({ title: z.string(), url: z.string().url() }))
      .default([]),
    transcript: z.string().optional(),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

const articles = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    category: z.string().default('Intel'),
    author: z.string().default('Sacred Intel'),
    description: z.string(),
    image: z.string().optional(),
    topics: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { episodes, articles };
