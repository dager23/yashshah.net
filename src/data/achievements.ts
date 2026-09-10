export interface Achievement {
  /** "2026", "2020–23" — omit when the date isn't certain */
  year?: string;
  title: string;
  /** short context line */
  detail?: string;
}

export const achievements: Achievement[] = [
  {
    year: '2026',
    title: 'Winner, NetApp Intern Showcase',
    detail: 'Engineering track',
  },
  {
    year: '2025',
    title: 'Silver Medalist',
    detail: 'Vellore Institute of Technology',
  },
  {
    year: '2025',
    title: 'Best Outgoing Student',
    detail: 'Vellore Institute of Technology',
  },
  {
    year: '2023',
    title: 'First place, Smart India Hackathon',
  },
  {
    year: '2023',
    title: 'Outstanding Performance certificate',
    detail: 'Bhabha Atomic Research Centre',
  },
  {
    title: 'Top 100 of 50,000+ teams, Amazon ML Challenge',
  },
  {
    year: '2020–23',
    title: 'Rank 1, four consecutive academic years',
    detail: 'Vellore Institute of Technology',
  },
];
