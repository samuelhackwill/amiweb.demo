# People wheel

Adapted directly from [`MultiWheelPrototype.vue`](https://github.com/samuelhackwill/POC-roue-amiweb/blob/54adad7/src/MultiWheelPrototype.vue) at commit `54adad7`, including the original `vector-circle.svg`.

The POC owns the shared portrait slots between adjacent wheels, drag handling, upright portraits, release inertia, snapping, token transfers, and portrait/name hover highlights. Keep those functions in sync when bringing in future POC changes.

Integration changes: use the supplied people array for the roster and wheel count, remove the demo count controls and generated names, adapt colours and the name directory to the page. Vue is mounted only in the people-wheel container by `lamicale.js`; the rest of the site keeps its existing rendering.

Portrait shapes use the filled paths from the seven supplied `Vector 1935.svg`–`Vector 1941.svg` files. A shuffled bag assigns a random mask to each person, reusing shapes only after the bag is exhausted. Assignments stay stable during dragging and resizing. Masks retain their original proportions. The clip and hover outline share the generated path. Portrait clips use `userSpaceOnUse` with the same explicit coordinates as their outlines. The POC's `objectBoundingBox` clips become offset in Firefox when the page's CSS zoom is applied.

Pointer positions are mapped from the displayed SVG rectangle into its viewBox. Firefox's `getScreenCTM()` mapping under CSS zoom offsets portrait hover and dragging. Name buttons also clear their highlight on mouse leave, using the POC's existing delay to bridge gaps.

Wheel dragging starts only on the clipped portrait images (`touch-action: pinch-zoom`). The SVG allows vertical panning and pinch zoom, so touches on the ring or gaps scroll the page. Pointer capture keeps an active portrait drag working after the finger leaves its image.

Compact wheel labels follow the mobile Figma layout (`3239:15149`): fixed slot offsets, alignment and arrow placement in `compactLabelSlots`. The complete label layer is hidden for the active drag and inertia/snap. The existing POC `commitWheelRotation` reassigns tokens to slots before labels reappear; text positions never rotate with the wheel.

Portrait identity is shared through `src/data/people-portraits.js`, using the renamed files in `public/assets/amicale`. The old `face-*` copies are no longer used for wheel identity. Unidentified roster photos use a neutral placeholder instead of another person’s portrait. Compact label offsets and straight-arrow placement follow the updated Figma capture (22 October 2026).

A single pointer owns a wheel drag. A second touch anywhere on the document ends that drag at its nearest slot without inertia and releases pointer capture. Native browser pinch zoom remains enabled; pointer cancellation cannot start an inertial spin.

Compact names use explicit SVG font sizes and absolute line positions from the
same measured scale. They remain hidden until their SVG width is known. This
avoids relative `em` spacing being laid out at the initial font size and only
corrected after the first wheel interaction. Mobile text stays at 16px with an
18.4px baseline gap on initial display, after snapping and after resizing.
