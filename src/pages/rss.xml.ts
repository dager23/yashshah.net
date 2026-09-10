import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';
import { site } from '../data/site';

export async function GET(context: APIContext) {
  const posts = (await getCollection('writing'))
    .filter((p) => !p.data.draft)
    .sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());

  return rss({
    title: `${site.name} — Writing`,
    description:
      'Notes on machine-learning systems, computer vision, and the engineering around them.',
    site: context.site ?? 'https://yashshah.net',
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: `/writing/${post.id}/`,
    })),
  });
}
