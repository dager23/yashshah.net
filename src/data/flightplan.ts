/**
 * Presentation data for the Stratosphere theme. Nothing here is a claim about
 * Yash — facts live in site.ts, experience.ts, etc. This file only maps those
 * facts onto instrument chrome (waypoint idents, city coordinates, phases).
 */

/** Five-letter waypoint idents, keyed by project content id. */
export const idents: Record<string, string> = {
  docauth: 'DCATH',
  effimix: 'EFMIX',
  'urban-sat': 'URBST',
  videogpt: 'VIDGP',
};

/** Geographic coordinates for the flight-log route map (lon, lat). */
export interface City {
  code: string;
  name: string;
  lon: number;
  lat: number;
}

/**
 * Route through the real places in education.ts and experience.ts, in the
 * order they began. VIT's campus is listed as Chennai in education.ts.
 */
export const route: City[] = [
  { code: 'MAA', name: 'Chennai', lon: 80.27, lat: 13.08 },
  { code: 'LYS', name: 'Lyon', lon: 4.84, lat: 45.76 },
  { code: 'BOM', name: 'Mumbai', lon: 72.88, lat: 19.08 },
  { code: 'ICN', name: 'Seoul', lon: 126.98, lat: 37.57 },
  { code: 'BLR', name: 'Bengaluru', lon: 77.59, lat: 12.97 },
];

/** Map projection window used by public/textures/route-region.webp. */
export const mapWindow = { lonMin: -15, lonMax: 145, latMax: 65, latMin: -5, width: 1600, height: 700 };

/** Concorde's published cruise figures, used only by the instrument readout. */
export const cruise = { mach: 2.04, altitudeFt: 60000 };
