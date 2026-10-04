How to write a blog post
========================

(Files whose names start with "_", like this one, are never published.)

1. Add a file to this folder, named with the date and a short name:

       2026-09-13-my-first-post.md

   Or run this from the repo, which creates it for you with today's date:

       npm run post -- "My first post"

2. Write the post. The first line starting with "# " is the title; everything
   under it is the post:

       # My first post

       Plain text works. Markdown works too: **bold**, *italic*,
       [a link](https://example.com), lists, `code`, and images.

3. Commit and push to main. Vercel publishes it at
   yashshah.net/blog/my-first-post in about a minute.

   No terminal needed: on github.com open this folder, then
   "Add file" -> "Create new file", paste the post, and "Commit changes".

The "Blog" link appears in the site's header as soon as the first post is published.

Optional settings go at the very top of a post, between two --- lines. Use only
the ones you want:

    ---
    title: A different title from the heading
    description: One line for the blog list and link previews
    date: 2026-09-13
    draft: true
    ---

- date:  use instead of putting the date in the file name
- draft: true keeps the post off the site until you delete that line
