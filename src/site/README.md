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
| `calendar-filter-lab.html` | Five independent interactive mobile calendar filter proposals |
| `desktop-footer-lab.html` | Five full-width desktop footer proposals |

## Figma reference

File: `MSNIkPBTtQ7uHjSw1UYzXY` (`homePage`). One implementation per page type:

- Desktop home: `2941:14390`; mobile home: `3239:15149`.
- Desktop project: `2991:15445`; mobile project: `3241:15842`.
- Desktop calendar: `3161:14813`; mobile calendar: `3244:16486`.
- Mobile navigation: `3460:15451`; event detail: `3244:16890`.
- Existing pages' mobile references: bio `3244:15771`, cooperative `3241:16598`.
- Desktop bio project previews: `3143:20475`.

The other project frames are content variants, not additional templates. The
existing wheel POC supplies the homepage on desktop and mobile and the project
sidebar on desktop. Mobile project rows and galleries scroll horizontally as
in the designs. `desktop.css` contains the desktop-only adaptations from 681px.
The existing 130% desktop scale is retained.

Bio project previews follow the profile's existing project selection. They use G2
masks, local artwork and hand-drawn desktop titles; mobile uses the Figma's 16px
name/year labels. Dates notes reuse the demo calendar, with the Cybercafé note
and the three original display years taken from Figma. Other years fall back to
the existing earliest-date helper. Projects without local imagery have a neutral
letter placeholder rather than borrowing another project's image.

The mobile bio timeline uses 112px per year, with two-year ticks. It initially positions
the first role 72px inside the scroll viewport; profiles without roles start at
the timeline beginning. Text edits and project selection changes preserve the
scroll position; changing the first role date recentres it. Native scrolling,
keyboard focus and edge fades allow exploration in both directions.

## Desktop layouts

The shared desktop header uses Menu and the sun icon on the left, followed by
the Figma wordmark (`3676:15599`, `3676:15606`). The old inline navigation and
breadcrumbs are replaced by the existing menu drawer on every page, now opening from the left.
The menu lists the 11 configured demo projects with their own titles and photos,
rather than the old archive directory and cycled placeholder thumbnails.
The drawer dims the page, closes via Escape/outside click/its close button, and
marks the current section. Its height accounts for the desktop 130% scale so
the full project list remains scrollable. Mobile keeps its wordmark-first header. The desktop wordmark scales to half
the content width with its aspect ratio preserved. The homepage has a draggable portrait wheel
in the right column, raised into the spare header space, and the three-column
project catalogue beneath it. The project author wheel stays below its sidebar
links. Project
pages retain a contact/resource rail, gallery and table of contents. Tall rails
scroll naturally between their top and bottom viewport edges, then stick; rails
that fit stay pinned near the top. Native CSS sticky positioning contains them
within the project layout, with a measured inset that accounts for desktop zoom.
Desktop project headers use single-line title artwork at a shared 1.25× scale,
shrinking only when needed to fit their column. `titles-single-line/` rearranges
the original SVG paths from multi-line exports; existing single-line exports
are reused. Picture sources keep the original compositions on mobile. Text-only
titles stay on one line and size to fit the column.
The project wheel repeats the first author’s portrait seven times at 1.7× the
base head size; the homepage roster and head sizes are independent. Authors
without a portrait asset use the neutral silhouette.

Biographies keep two shrinking columns at laptop widths; their inline name SVGs
cannot force the grid wider than the viewport. The timeline is redrawn at the
available desktop width, keeping labels/stars proportionate. Resizing to mobile
restores the large scrollable chart and its entry-year position. Tooltips remain
bound after either resize or live editing.

L’Amicale’s group photograph sits above contacts in the right column, matching
`2991:17244`. The separate body logo/title have been removed; the shared header
wordmark is white on this page on desktop and mobile. The group photo starts
level with the introduction, without the former negative brand-row offset. Its desktop
people/history section is a static full-width overview of all 24 people, with the
2010–current-year range fitted to the remaining width beside names and portraits.
It shares the mobile renderer and data; names and portraits link to biographies.
The mobile combined people/history interaction is unchanged.

Calendar search/suggestions use a compact desktop filter strip. Each field stays
on one line; long city, project, author, venue and date/time values scroll within
their cells, with a short edge fade only where text overflows. Archives have a
full-width background with a short 40px fade into solid darker grey at the boundary.
Desktop loads all archive dates on open and displays them newest to oldest,
with no load-more button. Filtering also includes the full archive. Mobile keeps
its upward archive browsing and manual batches of 30 dates. Crossing the
mobile/desktop breakpoint reloads the appropriate amount of history.
Sorting retains loaded archive batches; date
details still use the desktop dialog. Blog list/article pages share the desktop
header, columns, image masks and footer, with their existing demo content.

## L’Enfance Majeure long-page example

`?page=project&project=lenfance-majeure` uses the editorial content from Figma
frame `3393:15662`: the complete introduction, ten gallery items, three FAQ
questions, three press quotations, practical information and nine team credits.
`project-content.js` supplies those project-specific sections to the shared
renderer, including the production/art contact names and three document labels.
Presse and Infos anchors are included in the sidebar. The hero reuses the same
original photograph already present locally; gallery assets are local, with
web-sized JPEG copies for the photographs. Gallery dialogs use this project's
own images. Existing title, mask and sticky-sidebar behaviour is retained.
FAQ answers, contact addresses and document/video URLs are not present in the
frame and remain explicitly identified demo placeholders. The dates component
continues to use the calendar's project data rather than assigning other shows'
placeholder dates from the Figma frame to this production.

## Demo content

`data.js` owns the example projects, dates, gallery and blog content. Project and
calendar pages do not write to Supabase. The bio editor keeps its existing storage
and token checks. Newsletter submission only records an example locally. Document
and video controls show placeholders because source documents/videos are not yet
provided. The Blog example content uses the shared current layout; the older hidden
Blog frames use the legacy navigation.

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

Calendar rows use city → full project name → authors. Desktop keeps separate
columns and wraps long names. Mobile combines those fields into one native
horizontal scroller per row, with date/time fixed on the right. It shares the
homepage dates' edge fades and keyboard focus handling; filtering and sorting
rebind the scroll observers on the new rows. Archives use the same layout.

The calendar uses filter proposal E from `calendar-filter-lab.html`: live search,
Patateur suggestions (À Lille, Germinal, 2021), removable selections, and an
inline “Affiner la recherche” panel for project, city and period. Search ignores
accents and matches names, artists, places and dates entirely in the browser.
Periods include years and September–August seasons. Filters combine and can be
cleared individually or together. Mobile initially shows future dates and the
faded archive preview; year/season choices open at the start of their past results.
The demo includes 24 additional dates across 2021 for the year suggestion.
The date count is omitted. A short shadow marks the bottom of the mobile filters.
The mobile toolbar is measured to keep results and drawers below it as controls
expand; refinements collapse when opening a date to leave room for its drawer.

On mobile, only two past dates are rendered initially. The “Dates précédentes” Patateur
button imports `calendar-archive-source.js` and loads 30 older dates per tap,
with a small spinner. Scrolling alone does not fetch dates. Batches are inserted
without detaching existing rows and retain the reader’s visible position.
If a response arrives during a new touch gesture or momentum scroll, it waits
until scrolling stops before updating. There is no oversized history spacer.
Search is debounced by 180ms; stale responses are ignored. Year/season searches
page forward from their earliest matches using “Dates suivantes”; other archive
searches page backward from recent matches. Clearing filters resets to the
small preview. The source also handles explicit archive links. The demo creates
its history on demand; its page reader can later use a database API.
The lab deliberately keeps its full demonstration dataset. Bio project notes
use a small venue summary rather than loading calendar history.

On mobile, past dates sit above upcoming dates in chronological order. The
initial scroll position leaves two faded past rows visible beneath the fixed
menu and filters. The unrevealed archive preview omits headings generated
only by the start of the loaded slice; real month/season crossings still show.
Archives have a full-width grey background. Scrolling half
a viewport further into history reveals the archive rows in white and fades their background from light grey
(#484848) to darker grey (#303030) over 450ms; scrolling
back below that threshold fades them again, with a 24px buffer to avoid flicker.
Tapping the archive button enters archive mode immediately; returning to the
present fades rows and background back over the same 450ms interval.
This uses native document scrolling, including when filtering, with no gesture
capture outside the event drawer. Archive-only filters show white dates
immediately. Desktop retains the separate Archives section below future dates.
The dataset includes 240 additional demo past dates across nearly two years.
Month headings include the first upcoming month. Green season headings group
dates from September through August (e.g. Saison 2026–2027), without repeating
the same season at the mobile past/upcoming boundary.
Month headings use muted grey and season headings stay green.
Archive drawers use the standard neutral palette, with full-colour photos and
no booking button; future date drawers retain their booking controls.

On mobile, tapping a calendar row expands the inline drawer from Figma
`3244:16890`: a G2-masked image, hand-drawn project title, authors, date/time,
city, reservation control and venue strip. Other rows dim and desaturate without
an overlay. One oversized G2 rectangle spans the selected row and all drawer
content, with cropped sides, a straight top edge and an irregular bottom edge
with 20px extra space below the content; there are no separate
background pieces to leave gaps. A swipe only scrolls the line. Re-tapping, Escape, the close control
or an outside click closes the drawer. Outside taps are consumed, so tapping
another date dismisses the current drawer; a second tap opens that date. Deep links and
archives use the same drawer, while desktop keeps its existing event dialog.
Opening/closing respects reduced motion. An event's optional `bookingUrl` enables
the reservation link; otherwise the control displays a placeholder message.
Optional `address` and `context` fields supply venue details and are searchable.

While a mobile drawer is open, vertical swipes and wheel gestures select the
previous/next visible date in place. Opening anchors the selected row 20px below
the filter toolbar with a 320ms eased entry (instant with reduced motion).
The page is locked immediately; subsequent date changes stay instant. Closing
during entry cancels the animation at its current position. A fixed-body lock prevents native scroll, keyboard scroll and
overscroll from moving the underlying page; date changes adjust the body's
offset to retain that anchor. Closing restores normal scrolling at the current
browsing position. The lock is released on desktop resize, rerender and HMR.
Swipes update the date live while the finger moves: the first hop occurs after
36px, then roughly every 52px of additional travel. Reversing direction moves
back through dates. Fast releases add a decaying glide (at most six
extra dates over 800ms); slow drags and paused releases stop immediately. A new
touch or wheel input stops the glide, and reduced motion disables it. Touch listeners
stay on the original target so updates continue after its drawer is replaced.
Wheel distance accumulates continuously, allowing
several dates in one gesture. Overshooting stops at the end of the visible list.
The open drawer consumes vertical scrolling across the page, including at either
end of the date list. Closing it restores ordinary page scrolling. Horizontal
row scrolling, pinch zoom and zoomed-in panning stay native.
Reservation controls use 16px text and a larger, 124px-wide Patateur button.

The shared menu slides in from the left and animates out to the left on close.
Reopening resets its internal scroll so the main navigation is always visible.
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

## Desktop footer comparison

`/desktop-footer-lab.html` presents five full-width alternatives, stacked for
comparison: A directory; B address first; C Patateur islands inspired by the
chosen mobile footer; D a full-width newsletter banner; E a compact layout with
expandable newsletter and directories. Sticky A–E links navigate the lab.

Each candidate derives its content from `siteFooter()`, with unique input/label
IDs and Patateur seeds. Existing newsletter text, both fields and region choices,
the “Allez c’est parti” button, envelope/underlined mail links, social links,
address and real Figma logo are preserved. Internal links target the actual demo
routes, including under the GitHub Pages base path. Submissions write only to
sessionStorage and show an inline demo status; nothing is emailed or uploaded.
The lab has its own styles and Vite entry and does not replace any live footer.

## Selected desktop footer

The live desktop footer combines lab E’s address/logo, underlined mail contacts
and social links with lab D’s always-visible newsletter banner above the contact block. The three
navigation/project directories are hidden on desktop. The banner keeps the
original copy, email and region fields, all region options and submit button.
It stacks its text/form at narrow desktop widths; the two fields stay side by
side. The gradient and footer extend across the viewport and end in black.

The shared footer appears on home, blog and biographies, and desktop-only copies
are appended to project, calendar and L’Amicale pages. L’Amicale keeps its
existing partner/code block above it. Mobile retains the previous footer layout
and page coverage; biographies still have no newsletter. Footer lab candidates
remain available for comparison.

## Light and dark modes

The header sun is a keyboard-accessible theme button on every page. Dark is the
default; the selection is stored as `amicale-demo-theme` in localStorage and
shared between tabs. The head bootstrap applies it before the stylesheet paints;
blocked storage still permits switching within the current page.

`theme.css` defines a neutral light-grey palette, white Patateur shapes, a grey
header wordmark and `#9700ff` accents for text that is green in dark mode.
Blue links retain their original dark-mode colours. The
home logo uses its original artwork with a white SVG-shaped background. Existing CSS uses semantic tokens with
its exact previous dark colours as fallbacks. Page surfaces, Patateur fills,
text, links, dialogs, calendar archives, footer, editor and timeline labels
follow those tokens. Only monochrome lettering/header artwork is recoloured;
photos, masks, wheel/project geometry and project/role colours are retained.
The browser canvas and theme-colour meta interpolate with the themed footer.
Lab pages keep their independent comparison palettes.

## Desktop home interactions

Each desktop catalogue row is one native project link, including its author,
description and whitespace; it supports keyboard activation and opening a new
tab without nested anchors. Mobile retains separate project and biography
links and horizontal scrolling. Only catalogue cards rebuild at the breakpoint,
preserving the wheel. The bottom wheel label is raised 12 SVG units on desktop.
Home and project author wheels share the lighter desaturation/brightness filter
and white hover outlines in both themes; dark-mode status text stays green.
