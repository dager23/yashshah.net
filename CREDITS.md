# Credits

Every third-party asset in the **Stratosphere** theme (`theme/supersonic`), where it came
from, who made it, and its licence. CC-BY assets are also credited in the site footer.

## 3D model

| Asset | Source | Author | Licence | Status |
| --- | --- | --- | --- | --- |
| Concorde (glTF, 32,853 faces) | <https://sketchfab.com/3d-models/concorde-6d95290363474798a429a38bbf9ad49d> | manilov.ap | CC BY 4.0 | **Pending.** Sketchfab needs the owner's login to download. Until the file lands in `assets-src/concorde/`, the plane is shown as a HUD flight-path-marker symbol. |

Shortlist (2026-09-11), judged against the brief (clearly a Concorde, no livery, ≤ 80k
triangles, licence allows a personal site):

| Candidate | Faces | Licence | Verdict |
| --- | --- | --- | --- |
| [manilov.ap — Concorde](https://sketchfab.com/3d-models/concorde-6d95290363474798a429a38bbf9ad49d) | 32,853 | CC BY 4.0 | **Chosen.** Clean white, under budget. |
| [noah.widarsson — Concorde, Supersonic Passenger Jet](https://sketchfab.com/3d-models/concorde-supersonic-passenger-jet-3d-model-b8765c30e70f469ab1bdb25f3885c215) | 154,177 | CC BY 4.0 | Runner-up. All white; needs ~50% decimation. |
| [zihanchi — Concorde free with interior](https://sketchfab.com/3d-models/concorde-free-with-interior-16bd3e8a17b345caace9449331709f2e) | 91,263 | CC BY 4.0 | Runner-up. Air France livery to strip, interior to delete. |
| thomas333 — Concorde 3D Model | 208,555 | CC BY 4.0 | Rejected: British Airways livery, 2.6× over budget. |
| adim09 — Concorde (1) | 32,853 | CC BY 4.0 | Rejected: same face count as manilov.ap, no description; likely a re-upload. |

Searched with no Concorde found: Poly Pizza, Smithsonian Open Access (3d.si.edu).

## Imagery

| Asset | Source | Author | Licence | Derived files |
| --- | --- | --- | --- | --- |
| Blue Marble: Next Generation w/ Topography and Bathymetry, December 2004 — `world.topo.bathy.200412.3x5400x2700.jpg` (2.45 MB) | <https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/base-topography-bathymetry> | Reto Stöckli, NASA Earth Observatory | Public domain (NASA) | `public/textures/earth-2k.webp`, `earth-1k.webp`, `route-region.webp` (crop lon −15…145, lat 65…−5, darkened) |

The original is kept out of git in `assets-src/earth/`; re-fetch it from the URL above.

## Fonts

| Family | Designer | Licence | Package |
| --- | --- | --- | --- |
| Archivo (variable, `wdth` + `wght`) | Omnibus-Type | SIL OFL 1.1 | `@fontsource-variable/archivo` |
| JetBrains Mono | JetBrains | SIL OFL 1.1 | `@fontsource-variable/jetbrains-mono` |

## Icons

| Set | Licence | Package |
| --- | --- | --- |
| Lucide | ISC | `lucide-static` |

## Libraries

| Library | Licence |
| --- | --- |
| Astro | MIT |
| three.js | MIT |
| GSAP, incl. ScrollTrigger and SplitText | GSAP Standard "no charge" licence |
| Lenis | MIT |

## Considered but not used

Downloads not approved on 2026-09-11, so these are **not** in the site:

- Poly Haven — `kloofendal_43d_clear_puresky_1k.hdr` (Greg Zaal, CC0). Lighting uses three.js
  `RoomEnvironment` plus a horizon rim light instead.
- Wikimedia Commons — `Concorde v1.0.png` (Julien.scavini, CC BY-SA 3.0) and
  `Concorde and Tupolev Tu-144 top-view silhouette comparison.png` (Greg Goebel, public
  domain). The no-WebGL / mobile fallback uses the flight-path-marker symbol instead.
