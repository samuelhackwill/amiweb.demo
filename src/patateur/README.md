# Patateur integration

Based on [POC-patateur-amiweb](https://github.com/samuelhackwill/POC-patateur-amiweb/tree/7493582404a429af8e9e1c33c0b4df4bb344054c/src), commit `7493582`.
The original bubble generator (`patateur-path.js`) and CSS are preserved.
The decoration controller supports the site's additional shape presets.

## Shape presets

Preset selection lives in `presets.js`; approved G2 settings live in
`project-mask.js`:

- `bubble` (default): the original POC shape for text bubbles.
- `round`: a smooth, lightly irregular circle/oval, used for the dates “+” button.
  `irregularity: 0.035` controls the radial variation.
- `project`: the approved refined G2 mask: unequal corner estimates, broad course
  corrections, fine edge detail and a seeded 40% chance of one small defect.
  Used for catalogue, hero, gallery, calendar, event detail and menu images.
  `projectMaskDefaults` centralizes `mistake`, `spread`, `recovery`, `roundness`,
  `grain` and `defects`. Optional `irregularity` overrides the fine grain amount.

Both decorations and image masks accept `data-patateur-preset="round|project|bubble"`.
Optional `data-patateur-roundness` and `data-patateur-irregularity` override defaults.
Seeds keep each shape stable across renders and resizing.

## Integration

- `data-patateur="stable-seed"` attaches responsive decoration. The container owns
  padding, dimensions, text wrapping and `--patateur-fill`.
- `data-patateur-mask="stable-seed"` generates an image mask measured in local
  pixels. A shared observer updates it on resize. Small thumbnails are generated
  in a viewBox of at least 64px to accommodate the original bubble geometry.
- `data-patateur-wobble` adjusts the original bubble irregularity in pixels.
- `syncPatateurs()` handles preview updates without accumulating observers;
  `destroyPatateurs()` releases decorations before a full page render.

Logos use fixed Figma artwork. Wheel portraits use the supplied vector files in
`src/components/people-wheel`, independently of these presets. The separate
`quasi-circle.js` generator is reused for the round preset.

## Mask comparison page

`/mask-lab.html` shows two finalists, five numbered samples each:

- I3: restrained course corrections and moderately varied corners.
- G2: more uneven corner estimates and stronger course corrections.

Both have the same fine edge grain and a separately seeded 40% chance of one
localized imperfection: clipped corner, tangent break, or tiny overshoot.
Each outline is subdivided into roughly 70–90 unevenly spaced cubic segments,
with correlated normal offsets of up to 0.01 of the shorter side and occasional
small handle-angle changes. The original Figma references contained roughly
64–91 curve commands; those assets remain in `public/assets/mask-references`.

The lab supports photos/silhouettes, square/landscape proportions, 300px enlarged
previews and reproducible variations through `?seed=2`. Narrow screens scroll
sample rows horizontally. The comparison configurations live in `mask-experiments.js`;
G2 in the lab and the site's `project` preset both call the same
`createProjectMaskPath` function, keeping their geometry identical. Both pages are
included in the Vite build.
