/**
 * The flight plan in screen-normalised coordinates (x: -1 left … 1 right,
 * y: -1 bottom … 1 top). Shared by the WebGL scene and the 2D fallback so both
 * fly exactly the same route.
 */
export type Pt = [number, number];

/** Desktop: content on the left, route on the right; takeoff/touchdown clear of the readout. */
export const DESKTOP: Pt[] = [
  [0.05, -0.86], [0.3, -0.84], [0.55, -0.52], [0.78, -0.2], [0.74, 0.22], [0.56, 0.44],
  [0.34, 0.44], [0.28, 0.18], [0.4, -0.2], [0.44, -0.6], [0.32, -0.86],
];

/** Narrow screens: off the runway, up the side, then down it through cruise to land. */
export const MOBILE: Pt[] = [
  [0.55, -0.86], [0.74, -0.7], [0.8, -0.2], [0.76, 0.35], [0.66, 0.68],
  [0.78, 0.42], [0.68, 0.05], [0.8, -0.3], [0.7, -0.62], [0.62, -0.86],
];

export const isNarrow = (): boolean => innerWidth < 768 || matchMedia('(pointer: coarse)').matches;
