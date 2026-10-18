/**
 * Mobile apps published from D:\playstoreproj. One entry here drives:
 *   /apps                      — the apps index
 *   /apps/<slug>/privacy       — the app's privacy policy (linked from the app and its Play listing)
 *   /apps/promo.json           — the "More apps" feed every app reads (live apps only)
 *   /app-ads.txt               — AdMob's authorised-seller file (from `admobPublisherId`)
 *
 * Keep each app's `privacy` flags in sync with what its release actually ships:
 * over-disclosing is safe, under-disclosing is a Play policy violation.
 */
import { site } from './site';

export interface AppPrivacy {
  /** ISO date the policy text last changed */
  updated: string;
  /** what the app saves on the device, phrased as a list item ("Your habits and …") */
  storedOnDevice: string[];
  ads: boolean;
  purchases: boolean;
  /** Firebase Analytics + Crashlytics (only when the release includes google-services.json) */
  analytics: boolean;
  /** local reminder notifications */
  notifications: boolean;
  /** user-initiated export of a backup file */
  backups: boolean;
  /** app-specific paragraphs, rendered under "Other details" */
  notes?: string[];
}

export interface AppEntry {
  slug: string;
  /** full store title */
  name: string;
  /** what the app is called in running text */
  shortName: string;
  /** Android application id */
  packageName: string;
  /** one line, used on /apps and in the promo feed */
  tagline: string;
  status: 'live' | 'coming-soon';
  privacy: AppPrivacy;
}

/** Who publishes the apps. Change once the Play publisher name is final. */
export const publisher = {
  name: site.name,
  email: site.email,
} as const;

/** AdMob publisher ID, e.g. "pub-1234567890123456". Empty until the AdMob account exists. */
export const admobPublisherId = '';

export const apps: AppEntry[] = [
  {
    slug: 'tessera',
    name: 'Tessera: Habit Tracker',
    shortName: 'Tessera',
    packageName: 'net.yashshah.tessera',
    tagline: 'Build habits one tile at a time. Every streak reveals a hidden mosaic.',
    status: 'coming-soon',
    privacy: {
      updated: '2026-10-18',
      storedOnDevice: [
        'Your habits, their schedules, daily targets and reminder times',
        'The days you completed each habit',
        'Your settings, and whether you have Tessera Pro',
      ],
      ads: true,
      purchases: true,
      analytics: true,
      notifications: true,
      backups: true,
      notes: [
        'Home-screen widgets show and update the same on-device data. They do not send it anywhere.',
        'When you share a mosaic, Tessera creates an image on your device and hands it to the app you choose. We never receive it.',
      ],
    },
  },
  {
    slug: 'pilgrims-puzzle',
    name: "Pilgrim's Puzzle",
    shortName: "Pilgrim's Puzzle",
    packageName: 'net.yashshah.pilgrimspuzzle',
    tagline: "Piece together the world's temples, mosques and cathedrals, then learn their stories.",
    status: 'coming-soon',
    privacy: {
      updated: '2026-10-18',
      storedOnDevice: [
        'The puzzles you have solved, your star ratings and moves',
        'Your XP, daily streak and quiz progress',
        'Your settings, and whether you have removed ads',
      ],
      ads: true,
      purchases: true,
      analytics: true,
      notifications: false,
      backups: false,
      notes: [
        'All photographs and facts are bundled inside the app, gathered in advance from Wikimedia Commons and Wikipedia. Playing does not contact those services. Photo credits and licences are listed on the in-app Credits screen.',
      ],
    },
  },
];

export const liveApps = () => apps.filter((a) => a.status === 'live');

export const playStoreUrl = (a: AppEntry) => `https://play.google.com/store/apps/details?id=${a.packageName}`;

/** "18 October 2026" */
export function formatUpdated(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}
