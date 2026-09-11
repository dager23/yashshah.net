# Stratosphere theme (`theme/supersonic`)

A Concorde flies a scroll-driven arc over the curvature of the Earth and takes the visitor
through the projects as waypoints. `main` keeps the "Field Notes" design; this branch is
the alternative. All content comes unchanged from `src/data/*` and `src/content/*`.

## Flight plan → page

| Phase | Section | What happens |
| --- | --- | --- |
| Gate / takeoff | hero `#gate` | the flight deck at dawn: full-bleed windscreen (no frame), name on the HUD, pitch on the centre display; scrolling pushes through into the sky, and the readout undocks as the cockpit clears |
| Climb | `#about` (about + toolkit) | sky cross-fades to cruise; toolkit as instrument gauges |
| Mach 1 | entering `#waypoints` | one vapour ring; readout flashes amber |
| Cruise | `#waypoints` | Earth limb + stars; each project docks in as a display unit (EFMIX → URBST → VIDGP → DCATH) |
| Flight log | `#log` | experience as logbook entries + great-circle route map in a display bezel |
| Clearances | `#clearances` | honours as stamps; Diagnostics paper (DOI) and patent as slips |
| Landing | `#contact` | dusk sky, touchdown, résumé as a boarding pass |

## Files

| File | Role |
| --- | --- |
| `src/components/strato/FlightDeck.astro` | gate hero: cockpit drawing (wide 1440×900 + tall 390×844 stages), HUD name, centre-display pitch |
| `src/layouts/Strato.astro` | ClientRouter, persistent `#scene` canvas + readout, sky layers, header/footer |
| `src/scripts/flight.ts` | Lenis, ScrollTrigger, Mach/altitude profile, readout odometer, flight-deck push-through, reveals, docking |
| `src/scripts/scene.ts` | three.js: Earth limb, atmosphere, stars, flight curve, aircraft rig, vapour ring, model loader |
| `src/scripts/fallback2d.ts` | 2D route + SVG flight-path marker (hero poster, and the no-WebGL fallback) |
| `src/scripts/path.ts` | the route's control points, shared by 3D and 2D |
| `src/data/flightplan.ts` | waypoint idents, city coordinates, Concorde cruise figures (presentation only) |
| `src/styles/strato-*.css` | tokens, sky phases, instrument layer, sections |
| `CREDITS.md` | every third-party asset, source, author, licence |

## Adding the Concorde model

The plane is a HUD flight-path marker until the sourced model is in place.

1. Log in to Sketchfab and download **Concorde by manilov.ap** as glTF:
   <https://sketchfab.com/3d-models/concorde-6d95290363474798a429a38bbf9ad49d>
2. Unzip into `assets-src/concorde/` (gitignored).
3. Compress (Meshopt geometry, WebP textures — KTX2 would need the `toktx` executable):

   ```bash
   npx gltf-transform optimize assets-src/concorde/scene.gltf public/models/concorde.glb --compress meshopt --texture-compress webp --texture-size 1024
   ```

   Check the output is under 1.5 MB. If the model has any British Airways / Air France
   markings, strip or re-texture them first.
4. In `src/scripts/scene.ts` set `MODEL_URL = '/models/concorde.glb'`.
5. In `src/layouts/Strato.astro` set `modelLive = true` (adds the CC BY credit to the footer).
6. Calibrate once, with the real file open: which axis is the nose, and whether the droop
   nose is a separate mesh (if not, split it off by vertex position). Then animate it by
   flight phase (down at takeoff/landing, up at cruise).

## Verified (production build)

| Check | Result |
| --- | --- |
| `astro check` / build / TODO guard | 0 errors / 8 pages / clean (2026-09-12) |
| Lighthouse mobile (2026-09-12, flight-deck hero) | Performance 98 · Accessibility 100 · Best practices 100 · SEO 100 — FCP 1.6 s, LCP 2.3 s, TBT 60 ms, CLS 0 |
| Lighthouse desktop (2026-09-11, before the flight-deck hero) | 100 · 100 · 100 · 100 — LCP 0.5 s, TBT 0 ms, CLS 0 |
| Flight deck (2026-09-12) | wide stage at 1440×900, tall stage at 375×812; the push-through clears by 65 % of the gate, before liftoff and the dawn → cruise fade; readout undocks as it clears |
| Phone width (2026-09-12) | page is exactly viewport-wide (sections clip the panels' slide-in on x) |
| JS (gzip) | ≈ 196 KB total (core 54 KB + router 6 KB; three.js 135 KB loads on first interaction) |
| Contrast | every ink/sky/panel pairing computed ≥ 4.5:1 |
| JS off | all content present in the static HTML |
| View transitions | canvas + readout persist (same DOM nodes); plane parks at the case study's waypoint |
| No WebGL | 2D route with the flight-path marker |

## Known gaps

- **Concorde model not yet in place** (needs the Sketchfab download above). Droop-nose
  animation depends on the file.
- **No HDRI** (download declined): the model will be lit by three.js `RoomEnvironment`.
- **No Commons silhouette** (download declined): fallback and poster use the flight-path marker.
- **Route starts in Chennai, not Vellore**: `education.ts` lists VIT's campus as Chennai.
- **Mobile LCP 2.3 s** under Lighthouse's simulated slow 4G — just over the 2.0 s budget.
- **WebGL starts on first scroll/pointer/key**, by design, to keep LCP and TBT low.
- **Reduced motion** verified in code paths (no Lenis, push-through, reveals or Mach ring;
  the cockpit simply scrolls away, the plane holds still per section); not tested with the
  OS setting in a real browser.
- Not yet checked on a real phone. Desktop Lighthouse not re-run since the flight-deck hero.
- The old Field Notes components (`Base.astro`, `Row.astro`, `ProjectEntry.astro`,
  `tokens.css`, `base.css`, `fonts.css`) are unused on this branch.
