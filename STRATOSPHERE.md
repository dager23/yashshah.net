# Stratosphere theme (`theme/supersonic`)

A Concorde flies a scroll-driven arc over the curvature of the Earth and takes the visitor
through the projects as waypoints. `main` keeps the "Field Notes" design; this branch is
the alternative. All content comes unchanged from `src/data/*` and `src/content/*`.

## Flight plan → page

| Phase | Section | What happens |
| --- | --- | --- |
| Gate / takeoff | hero `#gate` | the flight deck at dawn: full-bleed windscreen, name on the HUD, pitch on the centre display. On load the HUD boots — the base's coordinates and the flight plan settle character by character, the plan draws itself in an inset — clouds drift on the horizon, faint stars at the zenith, `[ Enter flight log ↓ ]` under the name; scrolling pushes through into the sky and the readout undocks as the cockpit clears |
| Climb | `#about` (about + toolkit) | sky cross-fades to cruise; toolkit as a systems display |
| Mach 1 | entering `#waypoints` | one vapour ring, a shock line sweeps the viewport, readout flashes amber |
| Cruise | `#waypoints` | Earth limb + twinkling stars (the globe keeps turning on desktop); each project docks in as a display unit (EFMIX → URBST → VIDGP → DCATH), threaded by a dashed leg with star markers |
| Flight log | `#log` | experience as logbook entries with airport-code chips; the route map sits beside them (sticky on desktop) and the leg into each role's city lights up as you pass it |
| Clearances | `#clearances` | honours stamp themselves onto the page; Diagnostics paper (DOI) and patent as slips |
| Landing | `#contact` | dusk sky, touchdown: *Approaching destination · Yash Shah · Contact channel available · [ Initiate contact ]* (email once forwarding is live, LinkedIn until then), résumé as a boarding pass that tilts under the pointer; footer is a flight strip |

The aircraft is a Concorde-style delta silhouette (top-down, cyan HUD rendering) that follows its heading and foreshortens into turns, with a contrail of soft sprites at altitude — the same glyph on the WebGL scene, the 2D fallback and the route map. The toolkit is a **systems display** — the page a screen draws mid-flight, after the cockpit is behind you: an Airbus ECAM system page is a bus with its components branching off it, so each group is a glass card with a cyan bus line, a node per item, and the real item count zero-padded in the header. (It was cockpit hardware first — an overhead panel of toggle switches — which read as odd, because overhead panels are *in* the cockpit and by then you have flown through the windscreen.)

**The glass material** (header, readout, systems cards) is blur + saturate + a *brightness* step on the backdrop — never an opaque fill — so the sky, the Earth and the stars stay visible through the pane. Two things matter:

- **Direction follows the backdrop.** Real dark-mode glass *lifts* a dark scene rather than dimming it; that lift is what makes a pane read as a pane. The header runs `brightness(1.25)` with a 7 % light film over the cruise sky, and only inverts to `0.50` with a 22 % navy tint over a pale dawn/dusk sky, interpolated by `--pale` (= max(dawn, dusk)). It can afford this because **nothing bright ever passes behind it**: the Earth's top edge is pinned to the bottom 7–18 % of the viewport (`thetaTop` in scene.ts).
- **Exposure decides the rest.** The readout sits permanently inside that Earth band and the systems cards cross it at the foot of the viewport, so both keep a dim (0.45 and 0.46) instead of a lift. Measured: header 8.7:1 over cruise and 4.9:1 over dawn; readout 4.8–13.8:1; cards 5.1:1 against the Earth's real cloud tops (RGB ~200) and 12.4:1 over sky. The one soft spot is a card against theoretical pure-white cloud at 3.7:1, which the render never actually produces.

The rim is a 5 px ring that samples the backdrop brighter than the pane's face (`brightness(1.45)`, desktop only), so the edge reads as light bending through the curve of the glass, with a travelling highlight over it. A `@supports` fallback fills the panes where `backdrop-filter` is unavailable.

Instruments are never still: attitude balls and standby needles drift, the HUD horizon breathes, the centre display has CRT scan lines; once per session the panel powers up in sequence (`.is-boot`, sessionStorage). Tags, chips and instrument labels use a condensed cut of Archivo (its wdth axis) rather than a third typeface. Teal (`--teal`) is the one tertiary accent: focus rings and secondary hovers.

Every section eyebrow carries an altitude readout that follows the readout's profile (climb 10,000 → cruise 60,000 → 40,000 → 20,000 → 0 ft). A film-grain + vignette layer (`.film`) sits over the whole site. The one line of voice — "Apparently likes planes enough to build an entire portfolio around them" — is the user's own copy, under the About lead.

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
| `src/styles/strato-*.css` | tokens, sky phases, instrument layer, sections; `strato-live.css` is everything that moves or reacts — runway lights, the Mach 1 shock line, the glass material (backdrop lift/dim, pointer specular, refractive rim), waypoint connectors, log ↔ map sync, passport stamps, boarding-pass tilt, footer flight strip |
| `scripts/gen-images.mjs` + `scripts/og.html` | share card (headless Chrome renders the HTML with the site's fonts and Earth texture) and the flight-path-marker favicons — `npm run gen:images` |
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
| Live-instrument pass (2026-09-12) | Lighthouse mobile unchanged at 97 · 100 · 100 · 100 (LCP 2.2 s, TBT 110 ms, CLS 0); log ↔ map sync, connectors, stamps, footer strip checked at 1440×900 and 375×812; share card rendered from `scripts/og.html` |
| Cinematic pass (2026-09-12) | Lighthouse mobile 95 · 100 · 100 · 100 (LCP 2.2 s, TBT 180 ms, CLS 0) — the film grain is static on touch devices to keep the main thread free; HUD boot, inset flight plan, clouds, nav pill, map labels/plane, new Contact checked at 1440×900 and 375×812 |
| Polish pass (2026-09-12) | Lighthouse mobile 95 · 100 · 100 · 100 (LCP 2.2 s, TBT 180 ms, CLS 0) with the browser idle. Lesson: animating anything *inside* the dashboard SVG (needles, attitude balls, the power-on of display groups) repaints the whole panel each frame — a run with those on every device scored 63 / TBT 1,030 ms; they are now desktop-only (`hover: hover`). Rim light and grain flicker also rest on touch devices |
| Systems display + glass material (2026-09-12) | Lighthouse mobile 89–97 · 100 · 100 · 100 (LCP 2.2–2.4 s, TBT 130–270 ms, CLS 0). **Measure three times before believing a number here:** three runs on one unchanged build gave 88 / 93 / 92, so single readings in the high 80s to mid 90s are the same result. Style & Layout (~1.6–2.2 s) outweighs script evaluation (~0.6 s), which is why `--u`, `--dawn`, `--dusk` and `--pale` are `@property`-typed; the systems cards drop their blur on touch devices, since six backdrop-filtered panes is the one thing phones can't afford |
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
