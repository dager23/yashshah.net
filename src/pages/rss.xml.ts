import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { site } from '../data/site';
import { getPosts } from '../data/blog';

export async function GET(context: APIContext) {
  const posts = await getPosts();
  return rss({
    title: `${site.name} — Blog`,
    description: 'Notes on machine-learning systems, computer vision, and the engineering around them.',
    site: context.site ?? 'https://yashshah.net',
    items: posts.map((p) => ({ title: p.title, description: p.description, pubDate: p.date, link: `/blog/${p.slug}` })),
  });
}
