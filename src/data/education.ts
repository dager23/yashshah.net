export interface Education {
  school: string;
  degree: string;
  location: string;
  start: string;
  end: string;
  /** e.g. "CGPA 9.52 / 10" */
  note?: string;
}

export const education: Education[] = [
  {
    school: 'Vellore Institute of Technology',
    degree: 'Integrated M.Tech, Computer Science and Engineering with Business Analytics',
    location: 'Chennai, India',
    start: '2020',
    end: '2025',
    note: 'CGPA 9.52 / 10',
  },
];
