/**
 * Blog posts, with every optional field filled in, so a post can be as little as a text file:
 *
 *   src/content/blog/2026-09-13-my-first-post.md
 *   # My first post
 *   Everything under the heading is the post.
 *
 * title       frontmatter `title` → the first `# heading` → the file name
 * date        frontmatter `date`  → the YYYY-MM-DD at the start of the file name (one is required)
 * description frontmatter `description` → the first paragraph
 * Files starting with `_` are notes, not posts (see src/content/blog/_HOW-TO.md).
 */
import { getCollection, type CollectionEntry } from 'astro:content';

export interface Post {
  slug: string;
  title: string;
  date: Date;
  description: string;
  /** the title came from the post's own first `# heading`, so the page hides it rather than repeat it */
  titleFromHeading: boolean;
  entry: CollectionEntry<'blog'>;
}

const DATE_PREFIX = /^(\d{4}-\d{2}-\d{2})-(.+)$/;

/** "my-first-post" → "My first post" */
const unslug = (s: string) => s.replace(/[-_]+/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

/** first paragraph of prose, markdown stripped, clipped for previews */
function firstParagraph(body: string): string {
  const para = body
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .find((b) => b && !/^(#|```|>|[-*+] |\d+\. |!\[|<)/.test(b));
  const text = (para ?? '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_`~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > 180 ? `${text.slice(0, 177).trimEnd()}…` : text;
}

/** Published posts, newest first. */
export async function getPosts(): Promise<Post[]> {
  const entries = await getCollection('blog', (e) => !e.data.draft);
  return entries
    .map((entry) => {
      const named = entry.id.match(DATE_PREFIX);
      const slug = named ? named[2] : entry.id;
      const date = entry.data.date ?? (named ? new Date(`${named[1]}T00:00:00Z`) : undefined);
      if (!date) {
        throw new Error(
          `Blog post "${entry.id}" has no date. Name the file like 2026-09-13-${entry.id}.md, or add "date: 2026-09-13" between --- lines at the top.`
        );
      }
      const body = (entry.body ?? '').trimStart();
      const heading = body.match(/^#\s+(.+)/);
      const titleFromHeading = !entry.data.title && Boolean(heading);
      const title = entry.data.title ?? heading?.[1].trim() ?? unslug(slug);
      const prose = titleFromHeading ? body.replace(/^#\s+.+\n?/, '') : body;
      return { slug, title, date, description: entry.data.description ?? firstParagraph(prose), titleFromHeading, entry };
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime());
}

export const formatDate = (d: Date) =>
  d.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
