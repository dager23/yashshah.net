export interface Publication {
  kind: 'paper' | 'patent';
  title: string;
  /** journal + locator, or the filing body */
  venue: string;
  year: string;
  /** shown in mono under the title */
  authors?: string;
  /** application / DOI string shown as metadata */
  ref?: string;
  /** omitted when there is nothing stable to link to */
  href?: string;
}

export const publications: Publication[] = [
  {
    kind: 'paper',
    title:
      'A Novel Multi-Feature Fusion Method for Classification of ' +
      'Gastrointestinal Diseases Using Endoscopy Images',
    venue: 'Diagnostics 12(10), 2316',
    year: '2022',
    authors: 'Ramamurthy K, George T T, Shah Y, Sasidhar P',
    ref: 'doi:10.3390/diagnostics12102316',
    href: 'https://doi.org/10.3390/diagnostics12102316',
  },
  {
    kind: 'patent',
    title: 'Method and System for Workflow Analysis',
    venue: 'US patent application',
    year: '2025',
    ref: 'App. 19/280,291 · published July 2025',
  },
];
