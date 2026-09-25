# Fantasy presentation and animated dice

The ledger uses warm parchment in light mode and slate surfaces in dark mode,
with serif headings, brass borders, crimson actions and original scenic artwork.
Sign-in, character lists, character headers, campaigns, encounters, the compendium,
homebrew and creation controls share the theme. Reading surfaces stay opaque.

**Appearance → Scenic backgrounds** removes scenic artwork from the whole site.
The setting, selected dice style and animation preference persist on the current
device under `ledger-presentation`; no account or backend changes are involved.
Defaults are scenic backgrounds on, dice animation on and Emberforge dice.

The dice roller offers Emberforge, Moonstone, Verdant, Voidglass and Royal Ivory.
Canvas projects shaded 3D d4/d6/d8/d10/d12/d20 meshes, with tumble and bounce motion.
Percentile rolls use a tens/units pair (00 and 0 represent 100); nonstandard dice
expressions use numbered tokens. Every front face comes from the existing roll
result. Animation never generates, substitutes, delays or applies game outcomes.
Advantage/disadvantage show both dice and retain the existing selected total.
Character checks, saves, attacks, spells, hit dice, encounter initiative and
creation ability rolls share the animation. Batches arriving together render together; newer rolls may
replace an in-flight display, while history retains their full results.

The overlay ignores pointer input and disappears automatically. At most 18 visual
dice are drawn at once; full results remain in history. Device reduced-motion
preferences bypass animation, as does Appearance → Animated dice or the checkbox
in the roller. No new runtime dependencies, paid services or external art hosts
are required. The 202 kB WebP is bundled with the site and works under the Pages
base path. Print output omits scenery and animated dice.

## Artwork provenance

Project asset: `src/assets/citadel-dusk.webp` (1536 × 1024).
Generated using the built-in image-generation tool, then encoded as WebP for the
website. Prompt:

> Use case: stylized-concept. Asset type: original fantasy tabletop RPG website
> background, landscape 1536x1024. A sweeping painterly dark-fantasy landscape:
> a weathered stone citadel on a distant cliff on the right, a winding river and
> ancient bridge in the lower valley, layered pine forests and mountains fading
> into blue-gray mist, a small distant dragon silhouette high in the sky.
> Cinematic dusk, muted slate blue and pine black, faint warm amber windows and
> pale gold horizon. Rich illustrated adventure-book art, grounded and
> atmospheric, subtle texture, restrained contrast. Upper left and central sky
> stay spacious and relatively quiet for readable interface copy. No text, no
> lettering, no logos, no frames, no UI, no watermark. Wide scenic composition
> suitable for a website hero and a dimmed page backdrop.

## Validation

`tests/presentation.mjs` checks preference normalization/storage fallback, all
six mesh face counts/supporting planes, unchanged roll outcomes, advantage,
disadvantage, percentile pairs and the visual draw limit.
`tests/browser-presentation.mjs` checks all five selectable styles, recorded/visible
values, background removal, persistence across reloads, reduced motion, invalid
rolls, every main page and desktop/mobile layouts. CI keeps all existing content,
mechanics, browser and production-loading gates.
