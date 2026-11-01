# People / timeline

Used on `?page=lamicale` on mobile and desktop. References: Figma `mobile amicale ALT`, component `3454:17098`, and desktop `2991:17244`.

Desktop shows every row in a static overview: 110px name column, 88px portrait column and a timeline fitted to the remaining width. ResizeObserver redraws the year geometry without scaling labels or stars. Portraits stay beside names; there is no pagination, horizontal scrolling or scroll-driven animation. The legend wraps on narrow desktop widths. Switching to mobile restores the fixed year scale and interaction described below.

Each row shares the same three grid columns: name, portrait, timeline. One native horizontal scroller contains all rows and the legend. Names scroll away; `position: sticky; left: 20px` initially pins the portrait column. As soon as portraits reach the sticky threshold, they move to their entry dates and ride their lines without staggering.

The chart stops through native CSS stickiness when today reaches a 40px right margin. Further scroll distance advances the portraits to their endpoints. After reaching the line, portraits travel another 69px beyond it, mirroring their spacing before 2010. Only once settled beyond the line do the mirrored name links appear; the ending panel supplies that additional travel. `FINISH_OVERRUN` sets the shared JS/CSS distance. Portraits regain a 32px stagger only during their individual 69px travel beyond the finish line; they remain aligned until crossing it. Labels sit 12px after them. The row width bounds the sticky stage; the wider sheet provides the final name panel without an early blank gap.

At arrival, a constant CSS offset replaces the sticky stage at the exact same visual position. On the return trip, the right viewport edge drives portraits as the chart scrolls back. Names stay anchored to the endpoint and leave the viewport naturally; they re-arm only once fully offscreen. At the left end, the native scroll coordinate is rebased by that constant offset without moving the chart, restoring the initial layout. The offset is never updated to compensate for individual scroll frames.

The sheet clips chart overflow so it cannot extend its own scroll range. Horizontal overscroll is disabled on the scroller and page. The short entry animation respects reduced motion and eases a separate joining offset; scroll geometry updates immediately, without retargeting a CSS transition. Portrait positioning uses `left` rather than transforms to avoid Chromium clipping SVG masks on sticky elements. The sticky anchor has zero width (the visible SVG remains clickable), so the row boundary cannot push it backwards at maximum scroll. No touch handlers intercept scrolling, so vertical page scrolling and pinch zoom remain native.

`rocknroll.js` adapts the drawing functions from the local `POC-amiweb-frise-rocknroll` (commit `4e857b1`): shared curves, clipped role changes, overlapping role strokes and seeded stars. Years run from 2010 to the current year. Creation dates and tooltip names use `project-first-dates.json`.

Portraits use the named asset registry and the wheel's existing SVG masks, clipped inline to avoid masked sticky image rendering glitches. Missing portraits use a neutral silhouette. The additional people and periods in `lamicale.js` remain demo data; repeated placeholder rows from Figma are not duplicated.
