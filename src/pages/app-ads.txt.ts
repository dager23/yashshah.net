// AdMob's authorised-seller file. Must live at the root of the domain listed as the
// developer website on Google Play. Fill in `admobPublisherId` in src/data/apps.ts.
import type { APIRoute } from 'astro';
import { admobPublisherId } from '../data/apps';

// f08c47fec0942fa0 is Google's certification authority ID, the same for every AdMob publisher.
const GOOGLE_CERT_ID = 'f08c47fec0942fa0';

export const GET: APIRoute = () => {
  const body = admobPublisherId
    ? `google.com, ${admobPublisherId}, DIRECT, ${GOOGLE_CERT_ID}\n`
    : '# AdMob publisher line is added here before the first app with ads is published.\n';
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
