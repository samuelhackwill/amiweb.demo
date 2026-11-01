# Figma assets

Downloaded from file `MSNIkPBTtQ7uHjSw1UYzXY`, frames `2941:14390`, `2991:15445`,
`3239:15149`, `3244:16486`, `3244:16890`, and `2991:17244`. Runtime code uses local URLs only.

- `originalite`, `orchidees`, `enfance`, `tiret`, `germinal`: catalogue photographs.
- `title-*`: the corresponding hand-lettered Figma project titles.
- `project-title-tiret.svg`: project detail variant of the title.
- `header-wordmark*`: desktop and mobile faint L’Amicale wordmarks.
- `logo-light-mark.png`, `logo-dark-background.svg`: the light logo mark and dark
  fixed background from the cooperative frame (`3463:16712`), used on desktop.
- `gallery-*`, `play.svg`: the four gallery photographs and video preview icon.
- `face-*`: older portrait copies, superseded by the named files in `../amicale/`
  and the shared identity map in `src/data/people-portraits.js`.
- `sauvez`, `vitesse`, `tryhard`, `plaisir`, `thermes`, `big-data`, `calendar-extra`:
  example calendar imagery.

Large raster downloads were resized to at most 1600px (portraits: 480px) and saved
as JPEGs. SVG artwork is unchanged. The shared logo background (`../logo-background.svg`)
is the original `Vector 11` from the mobile home logo, node `3239:15158`.
Logos always use this fixed Figma artwork. Generic masks and text bubbles are generated
by Patateur rather than downloaded as static assets.

`titles-single-line/` contains desktop project-header variants. Original letter paths from the adjacent `title-*.svg` assets are translated into one line, with 22-unit word gaps and a shared baseline. Mobile and catalogue artwork keep the original exports.

`enfance-majeure/` contains the ten gallery images from Figma frame `3393:15662`, in display order. The video poster remains PNG; photographs are JPEG at a maximum edge of 1600px. The hero uses the existing `enfance.jpg` original.

The desktop and mobile headers use `header-wordmark-mobile.svg` (or its white variant). Desktop displays its natural 218:25 proportions with `object-fit: contain`; the stretched `header-wordmark-menu.svg` export from Figma node `3676:15606` is retained as a reference.

`header-wordmark-menu-white.svg` and `header-wordmark-mobile-white.svg` retain the respective wordmark geometry with the group opacity restored to 1 for the L’Amicale page header.
