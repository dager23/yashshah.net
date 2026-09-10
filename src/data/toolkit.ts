export interface ToolkitGroup {
  label: string;
  items: string[];
}

/** From the résumé skills block. Rendered as plain mono lines — no bars, no ratings. */
export const toolkit: ToolkitGroup[] = [
  {
    label: 'Languages',
    items: ['Python', 'C++', 'Java', 'C', 'R', 'JavaScript'],
  },
  {
    label: 'ML & CV',
    items: [
      'Deep learning',
      'Transfer learning',
      'Computer vision',
      'NLP & text processing',
      'AutoML',
      'Predictive modelling',
    ],
  },
  {
    label: 'Data',
    items: ['MySQL', 'MongoDB', 'Cassandra', 'Hadoop', 'Spark', 'Kafka', 'Flink'],
  },
  {
    label: 'Platforms',
    items: ['Microsoft Azure', 'ML-Ops / CI', 'Big data', 'Blockchain'],
  },
];
