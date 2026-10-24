# Website demo

The demo uses the existing Vite/vanilla JavaScript app, with Vue mounted only for
the portrait wheels. It shares Patateur, typography, navigation and footer styles
with the bio page. Query-string routes work under the GitHub Pages project path.

| URL | Page |
| --- | --- |
| `/` or `?page=home` | Homepage and project catalogue |
| `?page=project` | Project template, defaulting to Le Tiret du Six |
| `?page=project&project=germinal` | Same template with different project data |
| `?page=calendar` | Dates, archives, filters and event detail dialog |
| `?page=calendar&event=vitesse-1` | Calendar with a selected event |
| `?page=lamicale` | Existing cooperative page |
| `?person=samuel_hackwill` | Existing Supabase bio page |
| `?person=…&edit=…` | Existing token-protected bio editor |
| `?page=blog` | Placeholder blog, with article examples |

## Figma reference

File: `MSNIkPBTtQ7uHjSw1UYzXY` (`homePage`). One implementation per page type:

- Desktop home: `2941:14390`; mobile home: `3239:15149`.
- Desktop project: `2991:15445`; mobile project: `3241:15842`.
- Desktop calendar: `3161:14813`; mobile calendar: `3244:16486`.
- Mobile navigation: `3460:15451`; event detail: `3244:16890`.
- Existing pages' mobile references: bio `3244:15771`, cooperative `3241:16598`.

The other project frames are content variants, not additional templates. Figma's
red desktop wheel/filter placeholders are retained. A compact mode of the existing
wheel POC supplies the mobile homepage and project sidebar wheels. Mobile project
rows and galleries scroll horizontally as in the designs.

## Demo content

`data.js` owns the example projects, dates, gallery and blog content. Project and
calendar pages do not write to Supabase. The bio editor keeps its existing storage
and token checks. Newsletter submission only records an example locally. Document
and video controls show placeholders because source documents/videos are not yet
provided. No separate Blog design was present; its example pages use the shared
columns and styling.

All design imagery is local under `public/assets/site`. Text backgrounds and image
masks use the shared Patateur POC. The small thumbnail adapter scales its drawing
coordinates up before generating a contour so the POC's minimum corner radius
remains suitable at 19px.

Upcoming dates reuse future events from the calendar dataset in chronological
order. The home page starts with five; the round “+” reveals three more per
press. After three presses (or when dates run out sooner), it becomes
“Voir le calendrier”, styled with the standard one-line bubble preset. Each text row scrolls
horizontally with its date fixed. Hidden vertical overflow keeps text from drifting
inside the row; both pan directions and vertical scroll chaining remain enabled
so vertical swipes scroll the page. The desktop intro grows with the list.

The shared mobile menu slides in from the right and animates out on close.
Its native dialog backdrop desaturates and dims the live page with CSS
`backdrop-filter`; no exported gray overlay asset is used. Escape, close button
and outside clicks share the closing animation. Reduced-motion preferences are
respected and background page scrolling is locked while the menu is open.

## Mobile footer comparison

`/footer-lab.html` previews five mobile footer directions (A–E), each at a maximum
390px width: compact newsletter/navigation; folding directory; contact-first;
grouped Patateur cards; and upcoming dates. It reuses local Figma artwork, G2
project masks, Patateur bubbles and real demo routes. Forms record demo entries
only in sessionStorage; accordion sections and navigation work. This standalone
comparison page is included in the Vite build.

The shared mobile footer adopts option D: a blue newsletter Patateur card using
the original copy, email and region/country fields, and “Allez c’est parti”; a
separate green card contains only social links. Shortcut/directory sections are
hidden on mobile. Named admin and co-direction contacts retain envelope glyphs and underlined
mail links, and appear above the static Figma logo and address. Existing
newsletter demo persistence is retained.

The newsletter region selector uses `newsletter-region.js` for an approximate
IP-based suggestion through `https://ipapi.co/json/` (API fields documented at
https://ipapi.co/api/). French ISO region codes, overseas country codes, selected
European countries and the three continent groups map to the existing choices.
The suggested label is cached in sessionStorage; a manual choice or previous
newsletter selection in localStorage takes priority, including during a delayed
lookup. Requests time out after four seconds and fall back silently. Only the
label is cached, not the IP or full API response.

`browser-colors.js` keeps the browser canvas and theme gray near the top and
matches the footer gradient as it reaches the bottom of the visual viewport.
Scroll, viewport resizing, content changes and footer expansion recalculate the
color. The app content retains its own gray background; footerless pages remain
gray. Region guessing is silent: no automatic-estimate helper text is displayed.
