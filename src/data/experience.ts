export interface Role {
  company: string;
  title: string;
  location: string;
  /** "May 2023", "2022" — omit if genuinely unknown */
  start?: string;
  /** "July 2023" — omit if unknown or ongoing */
  end?: string;
  /** true → shows "current" and ignores `end` */
  current?: boolean;
  /** may be empty; the entry still renders */
  bullets: string[];
}

/** Reverse-chronological. NetApp facts are limited on purpose — see plan.md. */
export const experience: Role[] = [
  {
    company: 'NetApp',
    title: 'SDE 2',
    location: 'Bengaluru, India',
    current: true,
    bullets: [],
  },
  {
    company: 'Defect Scanner',
    title: 'Machine Learning Intern',
    location: 'Seoul, South Korea',
    start: 'May 2023',
    bullets: [
      'Stood up a live video-streaming server on Microsoft Azure for global ' +
        'access, cutting streaming latency to under one second.',
      'Flagged product defects from a live conveyor-belt feed on the factory ' +
        'floor, replacing roughly 12 hours of manual monitoring a day.',
      'Led an incremental-learning model that detects and registers object ' +
        'classes new to the system on production lines.',
      'Built an action-recognition model to reduce assembly-line defects.',
    ],
  },
  {
    company: 'Bhabha Atomic Research Centre',
    title: 'Project Intern',
    location: 'Mumbai, India',
    start: 'May 2023',
    end: 'July 2023',
    bullets: [
      'Led an automated vehicle detection, tracking and logging system.',
      'Applied ML-Ops to move level-0 systems to level-1: automated testing ' +
        'and monitoring plus a CI runner on a development machine, saving two ' +
        'hours of manual testing per run.',
      'Introduced an SSIM-based performance monitor to catch failure cases of ' +
        'computer-vision models on video use-cases.',
      'Contributed to two research articles documenting the algorithms from ' +
        'this work.',
    ],
  },
  {
    company: 'Naldeo Group',
    title: 'Solar Project Consultant',
    location: 'Lyon, France',
    start: 'October 2022',
    end: 'February 2023',
    bullets: [
      'Led the team forecasting congestion in solar grids.',
      'Converted daily readings into hourly distributions, then predicted ' +
        'real-time grid congestion with predictive modelling to enable ' +
        'efficient load setup.',
    ],
  },
];
