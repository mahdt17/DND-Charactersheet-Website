# Character sheet and 3D dice refresh

The site now uses horizontal desktop navigation, compact combat stats, three-column
desktop sheets, parchment/slate surfaces, and one scenic backdrop. Mobile keeps its
navigation drawer and floating dice button. Scenic backgrounds can be switched off,
including on sign-in and character pages. Temporary HP remains directly editable;
its grant/reduce/clear controls are under Options beside the field.

Dice use Three.js and cannon-es, loaded on the first animated roll. Each die has a
convex collider matching its rendered polyhedron, gravity, angular velocity,
friction, restitution, table/wall collisions, and die-to-die collisions. A fixed
60 Hz simulation is recorded and replayed with interpolated transforms. Physical
sleep ends a throw; simulation work is bounded to 18 seconds and 18 visible dice.
Playback takes 2.1–3.8 seconds with a 1.6-second result hold. Rendering pauses while
the page is hidden or the viewport is temporarily too small.

Existing game results are authoritative. Before playback, face labels are assigned
so the final upward face matches the original result. Labels never change during a
roll. Standard d4/d6/d8/d10/d12/d20 polyhedra, paired percentile d10s, advantage,
disadvantage, and batched attacks/initiative use the same results as history.
Unusual die sizes use a numbered cube as a visual fallback. Five styles have
procedural face textures, reflective materials, colored edges, and shadows.
No D&D Beyond artwork or proprietary assets are used.

If WebGL or the lazy renderer is unavailable, the roll still succeeds and its
result remains in history. Animation-off and reduced-motion settings skip the 3D
module. Disposal releases geometry, textures, shadow maps, observers, and the
context on completion, replacement rolls, clearing history, or unmount.

## Validation

- `node tests/dice-physics.mjs`: collisions, bounce, rotation, floor/wall bounds,
  upward faces, percentile results, custom dice, and 18-die mobile stress cases.
- `node tests/presentation.mjs`: styles, preferences, geometry and unchanged rules.
- `node tests/browser-presentation.mjs`: actual WebGL rendering, all styles and
  standard shapes, visible face/result agreement, rapid replacement, preferences,
  reduced motion, missing WebGL, responsive layouts and all main pages.
- Integration and feature-choice browser suites exercise compact temporary HP
  controls, including granting, reducing, clearing and damage absorption.
- Production loading tests require the 3D renderer to stay out of initial loads.

## Reference

The official [D&D Beyond digital dice page](https://www.dndbeyond.com/my-dice)
was inspected with Firecrawl for on-sheet interaction and results presentation.
Physics API reference: [cannon-es](https://github.com/pmndrs/cannon-es).
