import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      summary: z.string(),
      role: z.string(),
      stack: z.array(z.string()),
      repo: z.url().optional(),
      demo: z.url().optional(),
      date: z.coerce.date(),
      featured: z.boolean().default(false),
      order: z.number().default(999),
      cover: image().optional(),
    }),
});

/** Blog posts. Every field is optional; src/data/blog.ts derives what's missing. Files starting with "_" are notes. */
const blog = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    date: z.coerce.date().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { projects, blog };
