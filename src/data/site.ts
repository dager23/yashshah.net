export interface ProfileLink {
  /** lowercase label, rendered in mono */
  label: string;
  href: string;
  /** false = defined but not shown anywhere yet */
  enabled: boolean;
  /** append the ↗ marker and rel=noopener */
  external?: boolean;
}

export const site = {
  name: 'Yash Shah',
  role: 'SDE 2 at NetApp',
  location: 'Bengaluru, India',
  /** one-line pitch — used in <meta description> and JSON-LD */
  tagline:
    'Software engineer at NetApp building computer-vision and machine-learning ' +
    'systems, from published research to the factory floor.',
  /** hero prose, one <p> per entry */
  intro: [
    'SDE 2 at NetApp.',
    'I build computer-vision and machine-learning systems — from published ' +
      'research to the factory floor.',
  ],
  email: 'hi@yashshah.net',
} as const;

/**
 * Every link the site knows about. `enabled: false` entries are kept here on
 * purpose so turning one on is a one-word edit:
 *   - email  → flip once hi@yashshah.net forwarding is live (Spaceship)
 *   - github → add the URL and flip
 */
export const links = {
  linkedin: {
    label: 'linkedin',
    href: 'https://www.linkedin.com/in/yash-shah-139636220/',
    enabled: true,
    external: true,
  },
  resume: {
    label: 'résumé (pdf)',
    href: '/resume.pdf',
    enabled: true,
    external: true,
  },
  email: {
    label: 'email',
    href: 'mailto:hi@yashshah.net',
    enabled: false,
  },
  github: {
    label: 'github',
    href: '',
    enabled: false,
    external: true,
  },
} satisfies Record<string, ProfileLink>;

/** profile links shown in the hero, in order */
export const profileLinks: ProfileLink[] = [
  links.linkedin,
  links.resume,
  links.email,
  links.github,
].filter((l) => l.enabled && l.href);
