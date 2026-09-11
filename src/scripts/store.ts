/**
 * Tiny shared state between the scroll choreography (flight.ts) and the
 * WebGL scene (scene.ts), which loads later and may not exist at all.
 */
export type Phase = 'gate' | 'climb' | 'cruise' | 'descent' | 'landing';

export interface FlightState {
  /** 0 → 1 over the whole flight (page scroll) */
  progress: number;
  /** 0 → 1 position on the flight curve (progress remapped to phase anchors) */
  u: number;
  phase: Phase;
  /** Mach 1 moment fired (vapour ring plays once) */
  machBurst: boolean;
  /** waypoint the plane is currently at, or null */
  waypoint: string | null;
  /** a case-study page parks the plane in cruise */
  parked: boolean;
  reduced: boolean;
}

type Listener = (s: FlightState) => void;

const state: FlightState = {
  progress: 0,
  u: 0,
  phase: 'gate',
  machBurst: false,
  waypoint: null,
  parked: false,
  reduced: typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches,
};
const listeners = new Set<Listener>();

export function getState(): Readonly<FlightState> {
  return state;
}

export function setState(patch: Partial<FlightState>): void {
  let changed = false;
  for (const k in patch) {
    const key = k as keyof FlightState;
    if (state[key] !== patch[key]) {
      (state as unknown as Record<string, unknown>)[key] = patch[key];
      changed = true;
    }
  }
  if (changed) listeners.forEach((fn) => fn(state));
}

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  fn(state);
  return () => listeners.delete(fn);
}
