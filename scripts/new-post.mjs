// Creates a blog post dated today:  npm run post -- "My first post"
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';

const title = process.argv.slice(2).join(' ').trim();
if (!title) {
  console.error('Usage: npm run post -- "Title of the post"');
  process.exit(1);
}
const date = new Date().toISOString().slice(0, 10);
const slug = title.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const dir = 'src/content/blog';
const file = `${dir}/${date}-${slug}.md`;
if (existsSync(file)) {
  console.error(`Already exists: ${file}`);
  process.exit(1);
}
mkdirSync(dir, { recursive: true });
// the TODO line fails the build (scripts/check-todos.mjs) if the post is pushed before it's written
writeFileSync(file, `# ${title}\n\nTODO: write the post here. Markdown works: **bold**, [links](https://example.com), lists, \`code\`.\n`);
console.log(`Created ${file} — edit it, then push. It will be live at /blog/${slug}`);
