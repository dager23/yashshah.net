// Cross-promotion feed read by every app's "More apps" screen (see app-starter
// src/promo/). Only published apps appear; each app hides itself from its own list.
import type { APIRoute } from 'astro';
import { liveApps } from '../../data/apps';

export const GET: APIRoute = ({ site }) => {
  const origin = (site ?? new URL('https://yashshah.net')).origin;
  const body = {
    apps: liveApps().map((a) => ({
      package: a.packageName,
      name: a.name,
      tagline: a.tagline,
      icon: `${origin}/apps/${a.slug}/icon.png`,
    })),
  };
  return new Response(JSON.stringify(body, null, 2) + '\n', {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
