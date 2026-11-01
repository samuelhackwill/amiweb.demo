import { createApp } from "vue"
import PeopleWheel from "../components/people-wheel/PeopleWheel.vue"
import { portraitForPerson, placeholderPortrait } from "../data/people-portraits.js"
import { patateurLabel, syncPatateurs, destroyPatateurs } from "../patateur/index.js"
import { asset, publicAsset, projects, allProjects, projectHref, personHref, getProject, wheelPeople, gallery, events, archivePreview, archiveYears, archiveSeasons, posts } from "./data.js"
import { esc, siteHeader, siteFooter, siteMenu, bindSiteInteractions } from "./shared.js"
import { projectContent } from "./project-content.js"
import { underlineProjectTitle } from "./project-underlines.js"
import "./site.css"

let mountedWheels = []
const emptyCalendarFilters = () => ({ query: "", project: "", city: "", period: "all" })
let calendarFilters = emptyCalendarFilters()
let archives = [...archivePreview]
let archiveCursor = archivePreview.at(-1)
let archiveHasMore = true
let archiveAscending = false
let archiveLoading = false
let archiveError = false
let archiveRequest = 0
let disposeCalendarFilters = () => {}
const archivePageSize = 30
const hasCalendarFilters = () => Object.entries(calendarFilters).some(([key, value]) => key === "period" ? value !== "all" : Boolean(value.trim()))
let dateOrder = 1
let datesScrollObserver
let projectsScrollObserver
let disposeProjectSidebar = () => {}
let disposeHomeCatalog = () => {}
let calendarDrawerAnimation
let calendarPageAnimation
let calendarPageLock = null
let disposeCalendarDrawerScrolling = () => {}
let calendarArchiveController = null
const dateFormat = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit" })
const shortDate = date => dateFormat.format(new Date(`${date}T12:00:00`))
const heading = (label, seed) => patateurLabel(label, seed, "page-label")
const titleImage = (project, className = "") => project.title || project.titleUrl ? `<img class="project-lettering ${className}" src="${project.titleUrl || asset(project.title)}" alt="${esc(project.name)}" />` : `<span class="project-type-title ${className}">${esc(project.name)}</span>`
const thumbnail = (project, seed, className = "") => `<span class="event-thumb ${className}" data-patateur-mask="${esc(seed)}" data-patateur-preset="project" data-patateur-wobble="1"><img src="${asset(project.photo)}" alt="" style="object-position:${project.focus || "center"}" loading="lazy" /></span>`

function bindDateScrollLines(root) {
  datesScrollObserver?.disconnect()
  const dateLines = root.querySelectorAll(".upcoming-row > span, [data-calendar-line], .calendar-cell-line")
  if (dateLines.length) {
    const updateFade = line => {
      const remaining = line.scrollWidth - line.clientWidth - line.scrollLeft
      line.style.setProperty("--date-fade-left", line.scrollLeft > 1 ? (line.classList.contains("calendar-cell-line") ? "12px" : "24px") : "0px")
      line.style.setProperty("--date-fade-right", remaining > 1 ? (line.classList.contains("calendar-cell-line") ? "16px" : "32px") : "0px")
      line.tabIndex = line.hasAttribute("data-calendar-line") || line.scrollWidth > line.clientWidth + 1 ? 0 : -1
    }
    datesScrollObserver = new ResizeObserver(entries => entries.forEach(({ target }) => updateFade(target)))
    dateLines.forEach(line => {
      line.addEventListener("scroll", () => updateFade(line), { passive: true })
      datesScrollObserver.observe(line)
      updateFade(line)
    })
  }
}

function datesList(projectId, seed, limit = 3) {
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
  const dates = events.filter(event => event.date >= today && (!projectId || event.project === projectId))
    .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`))
  return `<div class="upcoming-list" data-dates-list>${dates.map((event, index) => {
    const project = getProject(event.project)
    const text = `<span>${esc(event.city)} <a class="external-link" href="?page=calendar&amp;event=${event.id}">↗ ${projectId ? esc(event.venue) : esc(project.name)}</a></span>`
    const time = `<time datetime="${event.date}">${shortDate(event.date).slice(0, 5)}${projectId ? ` ${event.time}` : ""}</time>`
    return `<div class="upcoming-row" ${index >= limit ? "hidden data-extra-date" : ""}>${projectId ? text + time : time + text}</div>`
  }).join("")}${dates.length ? `<div class="dates-more">${dates.length > limit ? `<button class="more-button" data-patateur="${seed}-more" data-patateur-preset="round" data-patateur-wobble="2" type="button" data-expand-dates aria-expanded="false" aria-label="Afficher trois dates supplémentaires"><span data-more-label aria-hidden="true">+</span></button>` : ""}<a class="page-label dates-calendar-link" data-dates-calendar data-patateur="${seed}-calendar" data-patateur-preset="bubble" data-patateur-wobble="3" href="?page=calendar" ${dates.length > limit ? "hidden" : ""}>Voir le calendrier</a></div>` : ""}</div>`
}

function catalogCard(project, desktop = matchMedia("(min-width:681px)").matches) {
  const tag = desktop ? "a" : "article"
  const childTag = desktop ? "span" : "a"
  const projectLink = projectHref(project.id)
  return `<${tag} class="catalog-card"${desktop ? ` href="${projectLink}" aria-label="${esc(project.name)}"` : ""}>
    <${childTag} class="catalog-photo"${desktop ? "" : ` href="${projectLink}"`}><span class="catalog-mask" data-patateur-mask="catalog-${project.id}" data-patateur-preset="project"><img src="${asset(project.photo)}" alt="${esc(project.name)}" loading="lazy" /></span><span class="project-kind" data-patateur="kind-${project.id}" data-patateur-wobble="2">${esc(project.type)}</span></${childTag}>
    <div class="catalog-title"><${childTag} class="catalog-name"${desktop ? "" : ` href="${projectLink}"`}>${underlineProjectTitle(project, titleImage(project))}</${childTag}>${project.status ? `<span class="project-status" data-patateur="status-${project.id}" data-patateur-wobble="2">${esc(project.status)}</span>` : ""}</div>
    <div class="catalog-copy"><${childTag} class="catalog-author"${desktop ? "" : ` href="${personHref(project.author.split(",")[0])}"`}>${esc(project.author)}</${childTag}><p ${project.italic ? 'class="is-italic"' : ""}>${esc(project.description)}</p></div>
  </${tag}>`
}

function homeMarkup() {
  return `${siteHeader()}<main class="home-content"><section class="home-intro"><div class="home-summary"><a class="home-logo" href="?page=lamicale"><img src="${publicAsset("footer-logo.png")}" alt="L’Amicale" /></a><p class="home-manifesto" data-patateur="home-manifesto">L’Amicale est une plateforme coopérative de production et diffusion de projets vivants.</p></div><div class="home-dates">${heading("Prochaines dates :", "home-dates")}${datesList(null, "home", 5)}</div><div class="home-wheel" data-compact-wheel></div></section><section class="project-catalog" id="projects" aria-label="Tous les projets">${heading("Tous les projets :", "all-projects")}${projects.map(project => catalogCard(project)).join("")}</section></main>${siteFooter()}`
}

function projectMarkup(project) {
  const editorial = projectContent[project.id]
  const projectGallery = editorial?.gallery || gallery
  const isTiret = project.id === "tiret-du-six"
  const singleLineTitles = new Set(["title-tiret.svg", "title-enfance.svg", "title-originalite.svg", "title-orchidees.svg", "title-vitesse.svg"])
  const mobileTitle = isTiret ? { ...project, title:"project-title-tiret.svg" } : project
  const projectTitle = singleLineTitles.has(project.title)
    ? `<picture><source media="(min-width:681px)" srcset="${asset(`titles-single-line/${project.title}`)}" />${titleImage(mobileTitle)}</picture>`
    : titleImage(project)
  const questions = editorial?.faq || [
    ["Je déteste les ordinateurs, est-ce que cette pièce est pour moi ?", "Oui ! Aucune connaissance informatique n’est nécessaire. On vient pour jouer, écouter et partager une histoire ensemble."],
    [`Où est-ce que je peux voir ${project.name} ?`, "Les prochaines représentations sont indiquées dans les dates ci-dessus et dans le calendrier."],
    [`Est-ce que ${project.author.split(" ")[0]} est un nerd ?`, "La réponse mérite une conversation après le spectacle."],
    ["Est-ce qu’on peut encore dire que c’est du théâtre vu qu’il n’y a pas d’acteurs sur scène ?", "On vous laisse vous faire votre propre idée : la rencontre avec le public fait partie de la pièce."],
  ]
  const copy = editorial?.descriptionHtml || (isTiret ? `<p>Le tiret du six est un jeu de lecture en réseau qui s’inspire des LAN parties, ces rassemblements vidéoludiques qui étaient populaires dans les années 2000, notamment en milieu rural.</p><p>On y parle du destin tragique du médecin de famille de Samuel qui n’aimait pas les ordinateurs, d’un programme écrit dans les années 80 et installé par défaut sur votre machine, de réseaux informatiques, de librisme, d’athlétisme et de justice sociale dans l’avant-pays savoyard.</p>` : `<p>${esc(project.description)}</p><p>Une création accompagnée par l’Amicale, entre spectacle vivant et arts visuels. Cette fiche utilise du contenu de démonstration pour explorer le projet, ses images et ses prochaines dates.</p>`)
  const credits = editorial?.credits ? editorial.credits.map(line => `<p>${esc(line)}</p>`).join("") : `<p><strong>${esc(project.author)}</strong> – c’est lui qui fait le projet<br />Jambo lynn – maïeutique &amp; gaffer-tape<br />Thomas Riou – Tableurs &amp; courriels<br />Etienne Boutin – Señor developper</p><p>Coproduction :<br />Les SUBS (Lyon)</p><p>Partenaires :<br />DRAC Hauts-de-France<br />DICREAM (CNC)<br />Ville de Lille<br />ADAGP<br />LA SERRE arts vivants (Montréal)<br />Le Vivat (Armentières)<br />La Bellone (Bruxelles)<br />ESADSE (Saint-Étienne)</p><p>Soutiens :<br />Arté Creative<br />DDays (Paris)<br />Théâtre de Poche (Hédé-Bazouges)<br />La Gaîté Lyrique (Paris)<br />Pianofabriek (Bruxelles)<br />Le Centquatre (Paris)<br />Channel, Scène nationale Calais<br />Cartonnerie de Gondardennes</p><p>Merci à Mathilde Maillard, Jacques-Daniel Pillon, Antoine Defoort, David-Olivier Lartigaud, Michel Lepetitdidier, Emmaüs connect Lyon, CLIS XXI, Marine Thévenet, Marion Le Guerroué, Alice Broyelle, Marie Devoux, Erwan Le Sornet, Joseph Aflalo et Stéphanie Aflalo.</p>`
  const contacts = editorial?.contacts ? editorial.contacts.map(contact => `<p>${esc(contact.role)} ↓<br /><button class="project-contact-link" type="button" data-project-contact="${esc(contact.name)}"><span aria-hidden="true">✉️</span> ${esc(contact.name)}</button></p>`).join("") : `<p>Production ↓<br /><a href="mailto:production@example.com"><span aria-hidden="true">✉️</span> Bob McProd</a></p><p>Diffusion ↓<br /><a href="mailto:diffusion@example.com"><span aria-hidden="true">✉️</span> Bob McDiff</a></p>`
  const resources = editorial?.resources || ["fiche de diffusion", "dossier de presse", "mini-bio", "fiche technique", "teaser", "captation"]
  const extraSections = editorial ? `<section class="project-press" id="presse">${heading("La presse en parle :", "project-press")}${editorial.press.map(([quote,source]) => `<blockquote><p>« ${esc(quote)} »</p><cite>— ${esc(source)}</cite></blockquote>`).join("")}</section><section class="project-info" id="infos">${heading("Infos :", "project-info")}${editorial.infoHtml}</section>` : ""
  const contents = [["top","Haut de page"], ["presentation","Présentation"], ["dates","Dates"], ["images","Images"], ["faq","FAQ"], ...(editorial ? [["presse","Presse"],["infos","Infos"]] : []), ["credits","Crédits"]]
  return `${siteHeader({ active: "home", crumb: project.name })}<main class="project-layout"><article class="project-main"><div class="project-heading" style="--project-title-length:${project.name.length}"><h1>${projectTitle}</h1><p class="project-author" data-patateur="project-author" data-patateur-wobble="3"><a href="${personHref(project.author.split(",")[0])}">${esc(project.author)}</a></p></div><figure class="project-hero" data-patateur-mask="hero-${project.id}" data-patateur-preset="project" data-patateur-wobble="12"><img src="${asset(project.photo)}" alt="${esc(project.name)}" fetchpriority="high" /></figure><section class="project-dates" id="dates">${heading("Prochaines dates :", "project-dates")}${datesList(project.id, "project", 3)}${!events.some(event => event.project === project.id) ? `<p>De nouvelles dates bientôt. <a class="body-link" href="?page=calendar">Voir le calendrier</a></p>` : ""}</section><section class="project-body" id="presentation">${copy}</section><section class="project-gallery" id="images" aria-label="Images du projet">${projectGallery.map((item, index) => `<button class="gallery-item" type="button" data-gallery="${index}" aria-label="Agrandir : ${esc(item.caption)}"><span data-patateur-mask="gallery-${project.id}-${index}" data-patateur-preset="project" class="gallery-mask"><img src="${asset(item.photo)}" alt="${esc(item.caption)}" style="object-position:${item.focus || "center"}" loading="lazy" /></span>${item.video ? `<img class="gallery-play" src="${asset("play.svg")}" alt="" />` : ""}</button>`).join("")}</section><section class="project-faq" id="faq">${heading("FAQ :", "project-faq")}${questions.map(([question, answer]) => `<details><summary>↓ ${esc(question)}</summary><p>${esc(answer)}</p></details>`).join("")}</section>${extraSections}<section class="project-credits" id="credits">${heading("Crédits :", "project-credits")}${credits}</section></article><aside class="project-side"><section>${heading("contacts :", "project-contact")}${contacts}</section><section>${heading("Liens :", "project-links")}<div class="project-resources">${resources.map(label => `<button type="button" class="text-link" data-resource="${esc(label)}">↗ ${label}</button>`).join("")}</div></section><nav class="project-toc" aria-label="Sommaire">${heading("Sommaire :", "project-toc")}${contents.map(([id,label]) => `<a href="#${id}">${label}</a>`).join("")}</nav><div class="project-people-wheel" data-project-wheel></div></aside></main>`
}

function matchesCalendarFilters(event, filters) {
  const project = getProject(event.project)
  const normalize = text => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr")
  const text = normalize(`${project.name} ${project.author} ${event.city} ${event.venue} ${event.address || ""} ${event.context || ""} ${event.date}`)
  const today = new Date().toLocaleDateString("en-CA")
  const period = filters.period
  const inPeriod = period === "all" || (period === "upcoming" ? event.date >= today : period === "past" ? event.date < today : period.startsWith("year:") ? event.date.startsWith(period.slice(5)) : calendarSeason(event.date) === Number(period.slice(7)))
  return inPeriod && (!filters.query || text.includes(normalize(filters.query.trim()))) && (!filters.project || event.project === filters.project) && (!filters.city || event.city === filters.city)
}

const eventMatches = event => matchesCalendarFilters(event, calendarFilters)

function calendarSeason(date) {
  const [year, month] = date.split("-").map(Number)
  return month >= 9 ? year : year - 1
}

function calendarTable(items, archive = false, previousSeason = null) {
  const order = matchMedia("(max-width:680px)").matches ? 1 : archive ? -dateOrder : dateOrder
  const rows = items.filter(eventMatches).sort((a, b) => order * `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
  const previewOnly = archive && matchMedia("(max-width:680px)").matches && !hasCalendarFilters() && archives.length === archivePreview.length
  let previousMonth = previewOnly && rows.length ? rows[0].date.slice(0, 7) : ""
  if (previewOnly && rows.length) previousSeason = calendarSeason(rows[0].date)
  return `<div class="calendar-table-wrap"><table class="calendar-table"><colgroup><col class="col-city" /><col class="col-project" /><col class="col-author" /><col class="col-venue" /><col class="col-date" /></colgroup><thead><tr><th class="event-city">Ville</th><th>Projet</th><th class="event-author">Auteur.ice.s</th><th class="event-venue">Lieu</th><th><button type="button" data-sort-date>Date/heure ${order < 0 ? "↓" : "↑"}</button></th></tr></thead><tbody>${rows.map(event => {
    const project = getProject(event.project)
    const month = event.date.slice(0, 7)
    const season = calendarSeason(event.date)
    let separator = ""
    if (season !== previousSeason) {
      separator = `<tr class="calendar-season"><td colspan="5">↓ Saison ${season}–${season + 1}</td></tr>`
      previousSeason = season
    }
    if (month !== previousMonth) {
      const label = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(new Date(`${event.date}T12:00:00`))
      separator += `<tr class="calendar-month"><td colspan="5">↓ ${label.charAt(0).toUpperCase() + label.slice(1)}</td></tr>`
      previousMonth = month
    }
    const today = event.date === new Date().toLocaleDateString("en-CA")
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const mobileDate = archive ? (event.date === yesterday.toLocaleDateString("en-CA") ? "hier" : shortDate(event.date)) : today ? "Aujourd’hui" : shortDate(event.date).slice(0, 5)
    const authors = project.author.split(",").map(name => name.trim()).filter(Boolean).map(name => `<a href="${personHref(name)}">${esc(name)}</a>`).join(", ")
    const projectLink = variant => `<${variant === "mobile" ? "span" : "a"} class="calendar-project"${variant === "mobile" ? "" : ` href="${projectHref(project.id)}"`}>${thumbnail(project, `${archive ? "archive" : "event"}-${event.id}-${variant}`)}<i>${esc(project.name)}</i></${variant === "mobile" ? "span" : "a"}>`
    const compactLine = `<div class="calendar-line" data-calendar-line data-open-event="${event.id}" role="button" aria-expanded="false" aria-controls="calendar-drawer-${event.id}"><span>${esc(event.city)}</span>${projectLink("mobile")}<span aria-hidden="true">·</span><span class="calendar-line-authors">${esc(project.author)}</span></div>`
    return `${separator}<tr class="calendar-event${today ? " is-today" : ""}" data-event-row="${event.id}"${archive ? ' data-archive-date="true"' : ""}><td class="event-city"><div class="calendar-cell-line">${esc(event.city)}</div></td><td class="event-project"><div class="calendar-project-desktop calendar-cell-line">${projectLink("desktop")}</div>${compactLine}</td><td class="event-author"><div class="calendar-cell-line">${authors}</div></td><td class="event-venue"><div class="calendar-cell-line"><a class="external-link" href="?page=calendar&amp;event=${event.id}" data-open-event="${event.id}">↗ ${esc(event.venue)}</a></div></td><td class="event-date-cell"><div class="calendar-cell-line calendar-date-line"><button class="event-date" type="button" data-open-event="${event.id}" aria-expanded="false" aria-controls="calendar-drawer-${event.id}"><span class="event-date-desktop"><span>${new Intl.DateTimeFormat("fr-FR", { weekday: "long" }).format(new Date(`${event.date}T12:00:00`))} ${shortDate(event.date)}</span> <span>à ${event.time.replace(":", "h")}${event.endTime ? ` → ${event.endTime.replace(":", "h")}` : ""}</span></span><span class="event-date-mobile">${mobileDate} ${event.time}${event.endTime ? ` → ${event.endTime}` : ""}</span></button></div></td></tr>`
  }).join("")}${!rows.length ? '<tr><td colspan="5" class="calendar-empty">Aucune date pour ces filtres.</td></tr>' : ""}</tbody></table></div>`
}

// Mobile grows history above the present; desktop explores older dates downwards.
const archiveLoaderAtEnd = () => !matchMedia("(max-width:680px)").matches || archiveAscending

function archiveLoadMarkup() {
  if (!matchMedia("(max-width:680px)").matches && !archiveError) return ""
  if (!archiveHasMore && !archiveLoading && !archiveError) return ""
  const message = archiveError ? "Les dates n’ont pas pu être chargées." : archiveLoading ? "Chargement des dates…" : ""
  return `<div class="calendar-archive-loader" data-archive-loader><div><p role="status">${message}</p><button type="button" data-archive-more data-patateur="calendar-archive-more" data-patateur-wobble="3" ${archiveLoading ? "disabled" : ""}><span class="archive-loading-indicator" aria-hidden="true" ${archiveLoading ? "" : "hidden"}></span><span>${archiveError ? "Réessayer" : archiveAscending ? "Dates suivantes ↓" : archiveLoaderAtEnd() ? "Dates précédentes ↓" : "↑ Dates précédentes"}</span></button></div></div>`
}

function calendarContent() {
  const today = new Date().toLocaleDateString("en-CA")
  const entries = [...events, ...archives]
  const past = entries.filter(event => event.date < today)
  const upcoming = entries.filter(event => event.date >= today)
  const latestPast = past.filter(eventMatches).sort((a, b) => b.date.localeCompare(a.date))[0]
  const previousSeason = matchMedia("(max-width:680px)").matches && latestPast ? calendarSeason(latestPast.date) : null
  return `<details class="calendar-archives" open><summary>${heading("Archives :", "calendar-archives")}</summary>${!archiveLoaderAtEnd() ? archiveLoadMarkup() : ""}${past.some(eventMatches) ? calendarTable(past, true) : ""}${archiveLoaderAtEnd() ? archiveLoadMarkup() : ""}</details><div class="calendar-upcoming">${latestPast && !upcoming.some(eventMatches) ? "" : calendarTable(upcoming, false, previousSeason)}</div>`
}

function calendarMarkup() {
  const entries = [...events, ...archives]
  const years = [...new Set([...archiveYears, ...entries.map(event => event.date.slice(0, 4))])].sort().reverse()
  const seasons = [...new Set([...archiveSeasons, ...entries.map(event => calendarSeason(event.date))])].sort((a, b) => b - a)
  return `<div class="calendar-toolbar">${siteHeader({ active: "calendar" })}<form class="calendar-search-filters" data-filter-form role="search" aria-label="Filtrer le calendrier"><label class="calendar-search"><span class="calendar-search-label">Rechercher un projet, un artiste, une ville ou une année</span><input name="query" type="search" placeholder="Projet, artiste, ville, année…" autocomplete="off" /></label><div class="calendar-suggestions" aria-label="Suggestions">${[["city", "Lille", "À Lille"], ["project", "germinal", "Germinal"], ["period", "year:2021", "2021"]].map(([key, value, label]) => `<button type="button" data-calendar-quick="${key}" data-value="${value}" aria-pressed="false" data-patateur="calendar-suggest-${key}" data-patateur-wobble="3"><span>${label}</span> <span class="suggestion-plus" aria-hidden="true">+</span></button>`).join("")}</div><details class="calendar-refine"><summary>Affiner la recherche <span aria-hidden="true">+</span></summary><div class="calendar-filter-fields"><label>Projet<select name="project"><option value="">Tous les projets</option>${allProjects.filter(project => entries.some(event => event.project === project.id)).map(project => `<option value="${project.id}">${esc(project.name)}</option>`).join("")}</select></label><label>Ville<select name="city"><option value="">Partout</option>${[...new Set(events.map(event => event.city))].sort((a,b) => a.localeCompare(b,"fr")).map(city => `<option>${esc(city)}</option>`).join("")}</select></label><label>Période<select name="period"><option value="all">Toutes les dates</option><option value="upcoming">À venir</option><option value="past">Archives</option><optgroup label="Années">${years.map(year => `<option value="year:${year}">${year}</option>`).join("")}</optgroup><optgroup label="Saisons">${seasons.map(year => `<option value="season:${year}">Saison ${year}–${year + 1}</option>`).join("")}</optgroup></select></label></div></details><div class="calendar-active-filters" data-calendar-active aria-label="Filtres actifs"></div><div class="calendar-search-status"><button type="button" data-calendar-reset hidden>Tout effacer</button></div></form></div><main class="calendar-content"><div data-calendar-content>${calendarContent()}</div><p class="calendar-archive-status" role="status" aria-live="polite"></p></main>`
}

function bindCalendarArchives(root, onLayoutChange) {
  const media = matchMedia("(max-width:680px)")
  const content = root.querySelector("[data-calendar-content]")
  const page = root.querySelector(".calendar-page")
  let origin = 0
  let active = false
  let frame = 0
  let disposed = false
  let touching = false
  let lastScrollAt = performance.now()
  let idleTimer
  let pendingUpdate
  let enteredManually = false
  const setActive = value => {
    if (!value) enteredManually = false
    if (active === value) return
    active = value
    page.classList.toggle("is-archive-mode", value)
    root.querySelector(".calendar-archive-status").textContent = value ? "Archives : dates passées" : "Dates à venir"
  }
  const sync = () => {
    if (!media.matches || disposed) return
    const expanded = content.querySelector(".calendar-event.is-expanded")
    if (expanded) {
      setActive(expanded.hasAttribute("data-archive-date"))
      return
    }
    if (!content.querySelector(".calendar-upcoming .calendar-event") && content.querySelector("[data-archive-date]")) {
      setActive(true)
      return
    }
    const distance = origin - (calendarPageLock?.top ?? window.scrollY)
    const threshold = enteredManually ? 56 : (window.visualViewport?.height ?? window.innerHeight) * .5
    if (distance > threshold) setActive(true)
    else if (distance < threshold - 24) setActive(false)
  }
  const refresh = ({ preservePosition = false, anchor } = {}) => {
    const distance = origin - (calendarPageLock?.top ?? window.scrollY)
    const past = content.querySelector(".calendar-archives")
    const upcoming = content.querySelector(".calendar-upcoming")
    past.hidden = !past.querySelector(".calendar-event") && !archiveLoading && !archiveError && !archiveHasMore
    if (!media.matches) {
      if (content.lastElementChild !== past) content.append(past)
      setActive(false)
      return
    }
    page.style.setProperty("--calendar-toolbar-height", `${root.querySelector(".calendar-toolbar").getBoundingClientRect().height}px`)
    if (content.firstElementChild !== past) content.prepend(past)
    if (!past.open) past.open = true
    const toolbarBottom = root.querySelector(".calendar-toolbar").getBoundingClientRect().bottom
    const offset = calendarPageLock?.top ?? window.scrollY
    origin = Math.max(0, upcoming.getBoundingClientRect().top + offset - toolbarBottom - (past.hidden ? 12 : 56))
    const browseFromStart = !past.hidden && (calendarFilters.period.startsWith("year:") || calendarFilters.period.startsWith("season:") || /^\d{4}$/.test(calendarFilters.query.trim()))
    const target = browseFromStart ? past.getBoundingClientRect().top + offset - toolbarBottom - 12 : origin
    if (calendarPageLock) {
      const row = content.querySelector(".calendar-event.is-expanded")
      if (row) alignCalendarDrawer(row)
    } else {
      const position = anchor?.element.isConnected ? offset + anchor.element.getBoundingClientRect().top - anchor.top : origin - distance
      const top = Math.max(0, preservePosition ? position : target)
      if (Math.abs(window.scrollY - top) > 1) window.scrollTo({ top, behavior: "instant" })
    }
    if (preservePosition) sync()
    else setActive(browseFromStart || (!upcoming.querySelector(".calendar-event") && !past.hidden))
  }
  const flushPending = () => {
    clearTimeout(idleTimer)
    if (!pendingUpdate || disposed || touching || calendarPageLock) return
    const remaining = 160 - (performance.now() - lastScrollAt)
    if (remaining > 0) { idleTimer = setTimeout(flushPending, remaining); return }
    const update = pendingUpdate
    pendingUpdate = null
    update()
  }
  const onScroll = () => {
    lastScrollAt = performance.now()
    flushPending()
    if (!frame) frame = requestAnimationFrame(() => { frame = 0; sync() })
  }
  const touchStart = () => { touching = true; clearTimeout(idleTimer) }
  const touchEnd = event => { touching = event.touches.length > 0; flushPending() }
  const onMediaChange = () => {
    closeCalendarDrawer(root, { animate: false })
    onLayoutChange()
    flushPending()
  }
  window.addEventListener("scroll", onScroll, { passive: true })
  window.addEventListener("touchstart", touchStart, { passive:true })
  window.addEventListener("touchend", touchEnd, { passive:true })
  window.addEventListener("touchcancel", touchEnd, { passive:true })
  media.addEventListener("change", onMediaChange)
  const toolbarObserver = new ResizeObserver(() => refresh({ preservePosition:true }))
  toolbarObserver.observe(root.querySelector(".calendar-toolbar"))
  refresh()
  return { sync, refresh, flushPending,
    enterArchive() { enteredManually = true; setActive(true) },
    whenIdle(update) { pendingUpdate = update; flushPending() },
    preserve(mutate) {
    const toolbarBottom = root.querySelector(".calendar-toolbar").getBoundingClientRect().bottom
    const element = content.querySelector(".calendar-event.is-expanded") || [...content.querySelectorAll(".calendar-event")].find(row => row.getBoundingClientRect().bottom > toolbarBottom) || content.querySelector(".calendar-upcoming")
    const anchor = { element, top:element.getBoundingClientRect().top }
    mutate()
    refresh({ preservePosition:true, anchor })
  }, dispose() {
    disposed = true
    cancelAnimationFrame(frame)
    clearTimeout(idleTimer)
    pendingUpdate = null
    window.removeEventListener("scroll", onScroll)
    window.removeEventListener("touchstart", touchStart)
    window.removeEventListener("touchend", touchEnd)
    window.removeEventListener("touchcancel", touchEnd)
    toolbarObserver.disconnect()
    media.removeEventListener("change", onMediaChange)
  } }
}

function blogMarkup(articleId) {
  const article = posts.find(post => post.id === articleId)
  return `${siteHeader({ active: "blog" })}<main class="blog-content">${article ? `<a class="text-link" href="?page=blog">← Toutes les nouvelles</a><article class="blog-article"><p class="post-date">${article.date}</p><h1>${esc(article.title)}</h1><figure data-patateur-mask="article-${article.id}"><img src="${asset(article.photo)}" alt="" /></figure><p>${esc(article.excerpt)}</p><p>À l’Amicale, les projets se construisent avec des personnes, des lieux et beaucoup de conversations. On partage ici des nouvelles de ce travail collectif, sur scène et en dehors.</p><p>Ce texte est un exemple pour la démo du blog. Les prochains récits, images et nouvelles viendront prendre leur place ici.</p><a class="text-link" href="?page=home#projects">Découvrir les projets</a></article>` : `<div class="blog-list">${posts.map(post => `<article class="blog-card"><a class="blog-photo" href="?page=blog&amp;article=${post.id}" data-patateur-mask="blog-${post.id}"><img src="${asset(post.photo)}" alt="" loading="lazy" /></a><div><p class="post-date">${post.date}</p><h2><a href="?page=blog&amp;article=${post.id}">${esc(post.title)}</a></h2><p>${esc(post.excerpt)}</p><a class="text-link" href="?page=blog&amp;article=${post.id}">Lire la suite</a></div></article>`).join("")}</div>`}</main>${siteFooter()}`
}

function dialogMarkup() {
  return `<dialog class="content-dialog" id="content-dialog" aria-labelledby="content-dialog-title"><button class="dialog-close" type="button" data-dialog-close aria-label="Fermer">×</button><div data-dialog-content></div></dialog>`
}

function openContent(root, html, className = "") {
  const dialog = root.querySelector("#content-dialog")
  dialog.className = `content-dialog ${className}`
  dialog.querySelector("[data-dialog-content]").innerHTML = html
  dialog.showModal()
  syncPatateurs(root)
}

function showEvent(root, id) {
  const event = [...events, ...archives].find(item => item.id === id)
  if (!event) return
  const project = getProject(event.project)
  if (matchMedia("(max-width:680px)").matches && root.querySelector(".calendar-content")) {
    openCalendarDrawer(root, event, project)
    return
  }
  closeCalendarDrawer(root, { animate: false })
  openContent(root, `<div class="event-detail"><figure data-patateur-mask="event-detail-${event.id}" data-patateur-preset="project"><img src="${asset(project.photo)}" alt="${esc(project.name)}" style="object-position:${project.focus || "center"}" /></figure><div><h2 id="content-dialog-title">${titleImage(project)}</h2><a href="${personHref(project.author.split(",")[0])}">${esc(project.author)}</a><p>Le ${shortDate(event.date)} à ${event.time}${event.endTime ? ` → ${event.endTime}` : ""}</p><strong>${esc(event.city)}</strong><p>${esc(event.venue)}</p><a class="text-link" href="${projectHref(project.id)}">↗ Voir le projet</a><p class="event-demo-note">Date de démonstration · réservation à venir.</p></div></div>`, "event-dialog")
}

function stopCalendarPageAnimation({ preservePosition = false } = {}) {
  if (!calendarPageAnimation) return
  const top = parseFloat(getComputedStyle(document.body).top)
  calendarPageAnimation.cancel()
  calendarPageAnimation = null
  if (preservePosition && calendarPageLock && Number.isFinite(top)) {
    calendarPageLock.top = Math.max(0, -top)
    document.documentElement.style.setProperty("--calendar-page-top", `${-calendarPageLock.top}px`)
  }
}

function alignCalendarDrawer(row, { animate = false } = {}) {
  const initialOpening = !calendarPageLock
  stopCalendarPageAnimation()
  if (!calendarPageLock) {
    calendarPageLock = { top: window.scrollY, left: window.scrollX }
    document.documentElement.style.setProperty("--calendar-page-top", `${-calendarPageLock.top}px`)
    document.documentElement.classList.add("calendar-page-locked")
    window.scrollTo({ top: 0, left: 0, behavior: "instant" })
  }
  const previousTop = parseFloat(getComputedStyle(document.body).top)
  calendarPageLock.top = Math.max(0, calendarPageLock.top + row.getBoundingClientRect().top - (document.querySelector(".calendar-toolbar").getBoundingClientRect().bottom + 20))
  document.documentElement.style.setProperty("--calendar-page-top", `${-calendarPageLock.top}px`)
  calendarArchiveController?.sync()
  if (initialOpening && animate && !matchMedia("(prefers-reduced-motion:reduce)").matches && Math.abs(previousTop + calendarPageLock.top) > 1) {
    const animation = document.body.animate([{ top: `${previousTop}px` }, { top: `${-calendarPageLock.top}px` }], { duration: 320, easing: "cubic-bezier(.22,1,.36,1)" })
    calendarPageAnimation = animation
    animation.finished.then(() => { if (calendarPageAnimation === animation) calendarPageAnimation = null }).catch(() => {})
  }
}

function unlockCalendarPage() {
  stopCalendarPageAnimation({ preservePosition: true })
  if (!calendarPageLock) return
  const position = calendarPageLock
  calendarPageLock = null
  document.documentElement.classList.remove("calendar-page-locked")
  document.documentElement.style.removeProperty("--calendar-page-top")
  window.scrollTo({ top: position.top, left: position.left, behavior: "instant" })
  calendarArchiveController?.sync()
  calendarArchiveController?.flushPending()
}

function closeCalendarDrawer(root, { animate = true, restoreFocus = false, keepScrollLock = false } = {}) {
  if (!keepScrollLock) stopCalendarPageAnimation({ preservePosition: true })
  const drawer = root.querySelector("[data-event-drawer]")
  if (!drawer) { if (!keepScrollLock) unlockCalendarPage(); return }
  calendarDrawerAnimation?.cancel()
  const row = root.querySelector(`[data-event-row="${CSS.escape(drawer.dataset.eventDrawer)}"]`)
  row?.classList.remove("is-expanded")
  row?.querySelectorAll("[aria-expanded]").forEach(control => control.setAttribute("aria-expanded", "false"))
  root.querySelector(".calendar-content")?.classList.remove("has-open-event")
  if (restoreFocus) row?.querySelector(".event-date")?.focus({ preventScroll: true })
  const finish = () => {
    drawer.remove()
    if (!keepScrollLock) {
      syncPatateurs(root, { scanRoot: null })
      unlockCalendarPage()
    }
  }
  if (!animate || matchMedia("(prefers-reduced-motion:reduce)").matches) {
    finish()
    return
  }
  const overlap = parseFloat(drawer.style.getPropertyValue("--calendar-drawer-overlap")) || 0
  calendarDrawerAnimation = drawer.animate([{ height: `${drawer.offsetHeight}px`, opacity: 1 }, { height: `${overlap}px`, opacity: 0 }], { duration: 180, easing: "ease-in", fill: "forwards" })
  calendarDrawerAnimation.finished.then(finish).catch(() => {})
}

function openCalendarDrawer(root, event, project, { animate = true } = {}) {
  const existing = root.querySelector("[data-event-drawer]")
  if (existing?.dataset.eventDrawer === event.id && root.querySelector(".calendar-event.is-expanded")) {
    closeCalendarDrawer(root)
    return
  }
  closeCalendarDrawer(root, { animate: false, keepScrollLock: true })
  const row = root.querySelector(`[data-event-row="${CSS.escape(event.id)}"]`)
  if (!row) { unlockCalendarPage(); return }
  root.querySelector(".calendar-refine").open = false
  const titleId = `calendar-drawer-title-${event.id}`
  const authors = project.author.split(",").map(name => name.trim()).filter(Boolean).map(name => `<a href="${personHref(name)}">${esc(name)}</a>`).join(", ")
  const date = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "2-digit", month: "2-digit", year: "2-digit" }).format(new Date(`${event.date}T12:00:00`))
  const reservation = event.bookingUrl
    ? `<a class="calendar-reservation" href="${esc(event.bookingUrl)}" target="_blank" rel="noopener" data-patateur="booking-${event.id}">↗ réserver une place</a>`
    : `<button class="calendar-reservation" type="button" data-book-event data-patateur="booking-${event.id}">↗ réserver une place</button>`
  const booking = row.hasAttribute("data-archive-date") ? "" : `<div class="calendar-drawer-booking">${reservation}<p class="calendar-booking-status" role="status" hidden></p></div>`
  const venue = `${esc(event.venue)}, ${esc(event.address || event.city)}${event.context ? ` → ${esc(event.context)}` : ""}`
  const drawer = document.createElement("tr")
  drawer.className = "calendar-drawer-row"
  drawer.id = `calendar-drawer-${event.id}`
  drawer.dataset.eventDrawer = event.id
  const overlap = row.offsetHeight
  drawer.style.setProperty("--calendar-drawer-overlap", `${overlap}px`)
  drawer.innerHTML = `<td colspan="5"><article class="calendar-event-drawer" role="region" aria-labelledby="${titleId}"><div class="calendar-drawer-background" data-patateur="calendar-background-${event.id}" data-patateur-preset="project" aria-hidden="true"></div><button class="calendar-drawer-close" type="button" data-close-event aria-label="Fermer les détails de cette date">×</button><div class="calendar-drawer-card"><a class="calendar-drawer-image" href="${projectHref(project.id)}" aria-label="Découvrir ${esc(project.name)}"><span data-patateur-mask="calendar-drawer-image-${event.id}" data-patateur-preset="project"><img src="${asset(project.photo)}" alt="${esc(project.name)}" style="object-position:${project.focus || "center"}" /></span></a><div class="calendar-drawer-copy"><h2 id="${titleId}"><a href="${projectHref(project.id)}">${titleImage(project)}</a></h2><p class="calendar-drawer-authors">${authors}</p><p>le ${esc(date)} à ${esc(event.time)}${event.endTime ? ` → ${esc(event.endTime)}` : ""}</p><strong class="calendar-drawer-city">${esc(event.city)}</strong></div>${booking}</div><div class="calendar-drawer-venue"><p>${venue}</p></div></article></td>`
  row.after(drawer)
  row.classList.add("is-expanded")
  row.querySelectorAll("[aria-expanded]").forEach(control => control.setAttribute("aria-expanded", "true"))
  root.querySelector(".calendar-content").classList.add("has-open-event")
  row.querySelector(".event-date")?.focus({ preventScroll: true })
  syncPatateurs(root, { scanRoot: drawer })
  alignCalendarDrawer(row, { animate })
  const height = drawer.offsetHeight
  if (animate && !matchMedia("(prefers-reduced-motion:reduce)").matches) {
    calendarDrawerAnimation = drawer.animate([{ height: `${overlap}px`, opacity: 0 }, { height: `${height}px`, opacity: 1 }], { duration: 240, easing: "cubic-bezier(.22,1,.36,1)" })
  }
}

function bindCalendarDrawerScrolling(root) {
  disposeCalendarDrawerScrolling()
  const content = root.querySelector(".calendar-content")
  const distancePerDate = 52
  const consumesScroll = () => matchMedia("(max-width:680px)").matches && content.classList.contains("has-open-event") && (window.visualViewport?.scale || 1) <= 1.05
  const adjacentRow = direction => {
    if (!consumesScroll()) return null
    const rows = [...content.querySelectorAll(".calendar-event")].filter(row => !row.closest("details:not([open])"))
    const index = rows.findIndex(row => row.classList.contains("is-expanded"))
    if (index < 0) return null
    const next = rows[Math.max(0, Math.min(rows.length - 1, index + direction))]
    return next === rows[index] ? null : next
  }
  const hop = (direction, steps = 1) => {
    const next = adjacentRow(direction * steps)
    if (!next) return
    const event = [...events, ...archives].find(item => item.id === next.dataset.eventRow)
    openCalendarDrawer(root, event, getProject(event.project), { animate: false })
  }

  let inertiaFrame = null
  const stopInertia = () => {
    if (inertiaFrame !== null) cancelAnimationFrame(inertiaFrame)
    inertiaFrame = null
  }
  const startInertia = gesture => {
    stopInertia()
    if (!gesture?.hopped || gesture.axis !== "vertical" || performance.now() - gesture.lastMove > 80 || Math.abs(gesture.velocity) < .55 || matchMedia("(prefers-reduced-motion:reduce)").matches) return
    const velocity = Math.sign(gesture.velocity) * Math.min(1.8, Math.abs(gesture.velocity))
    const direction = Math.sign(velocity), started = performance.now(), decay = 240
    let previous = 0, distance = gesture.distance, crossed = 0
    const glide = timestamp => {
      inertiaFrame = null
      if (!consumesScroll() || !adjacentRow(direction)) return
      const elapsed = Math.max(previous, timestamp - started)
      distance += velocity * decay * (Math.exp(-previous / decay) - Math.exp(-elapsed / decay))
      previous = elapsed
      const steps = Math.min(6 - crossed, Math.floor(Math.abs(distance) / distancePerDate))
      if (steps) { distance -= direction * steps * distancePerDate; crossed += steps; hop(direction, steps) }
      if (crossed < 6 && elapsed < 800 && Math.abs(velocity) * Math.exp(-elapsed / decay) > .06) inertiaFrame = requestAnimationFrame(glide)
    }
    inertiaFrame = requestAnimationFrame(glide)
  }

  let wheelLastTime = -Infinity, wheelDistance = 0, wheelDirection = 0
  root.addEventListener("wheel", event => {
    if (!consumesScroll() || event.ctrlKey || event.shiftKey || !event.deltaY || Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return
    stopInertia()
    const direction = Math.sign(event.deltaY)
    event.preventDefault()
    if (!adjacentRow(direction)) { wheelDistance = 0; return }
    const now = performance.now()
    if (now - wheelLastTime > 180 || direction !== wheelDirection) wheelDistance = 0
    wheelLastTime = now
    wheelDirection = direction
    const pixels = event.deltaY * (event.deltaMode === 1 ? 20 : event.deltaMode === 2 ? innerHeight : 1)
    wheelDistance = Math.sign(wheelDistance) && Math.sign(wheelDistance) !== direction ? pixels : wheelDistance + pixels
    const steps = Math.floor(Math.abs(wheelDistance) / distancePerDate)
    if (steps) {
      wheelDistance -= direction * steps * distancePerDate
      hop(direction, steps)
    }
  }, { passive: false })

  let touchGesture = null
  const clearTouch = () => {
    if (!touchGesture) return
    const target = touchGesture.target
    target.removeEventListener("touchmove", onTouchMove)
    target.removeEventListener("touchend", onTouchEnd)
    target.removeEventListener("touchcancel", clearTouch)
    touchGesture = null
  }
  const onTouchEnd = () => {
    const gesture = touchGesture
    clearTouch()
    startInertia(gesture)
  }
  const onTouchMove = event => {
    if (!touchGesture || event.touches.length !== 1 || !consumesScroll()) { clearTouch(); return }
    const gesture = touchGesture
    gesture.dx = event.touches[0].clientX - gesture.x
    gesture.dy = event.touches[0].clientY - gesture.y
    if (!gesture.axis && Math.max(Math.abs(gesture.dx), Math.abs(gesture.dy)) >= 8) {
      gesture.axis = Math.abs(gesture.dy) > Math.abs(gesture.dx) ? "vertical" : "horizontal"
    }
    if (gesture.axis !== "vertical") return
    const pixels = gesture.lastY - event.touches[0].clientY
    gesture.lastY = event.touches[0].clientY
    const direction = Math.sign(pixels)
    const now = performance.now(), sample = pixels / Math.max(1, now - gesture.lastMove)
    gesture.velocity = Math.sign(gesture.velocity) !== direction ? sample : gesture.velocity * .35 + sample * .65
    gesture.lastMove = now
    event.preventDefault()
    if (!direction || !adjacentRow(direction)) { gesture.distance = 0; return }
    gesture.distance = Math.sign(gesture.distance) && Math.sign(gesture.distance) !== direction ? pixels : gesture.distance + pixels
    const threshold = gesture.hopped ? distancePerDate : 36
    if (Math.abs(gesture.distance) >= threshold) {
      const steps = 1 + Math.floor((Math.abs(gesture.distance) - threshold) / distancePerDate)
      gesture.distance -= direction * (threshold + (steps - 1) * distancePerDate)
      gesture.hopped = true
      hop(direction, steps)
    }
  }
  root.addEventListener("touchstart", event => {
    stopInertia()
    clearTouch()
    touchGesture = event.touches.length === 1 && consumesScroll()
      ? { target: event.target, x: event.touches[0].clientX, y: event.touches[0].clientY, lastY: event.touches[0].clientY, lastMove: performance.now(), velocity: 0, dx: 0, dy: 0, distance: 0, axis: null, hopped: false }
      : null
    if (!touchGesture) return
    // Touch events keep their original target. Listen there so the same finger
    // keeps driving updates even after a hop removes its original drawer node.
    touchGesture.target.addEventListener("touchmove", onTouchMove, { passive: false })
    touchGesture.target.addEventListener("touchend", onTouchEnd, { passive: true })
    touchGesture.target.addEventListener("touchcancel", clearTouch, { passive: true })
  }, { passive: true })
  const resize = () => {
    if (!calendarPageLock) return
    if (!matchMedia("(max-width:680px)").matches) {
      closeCalendarDrawer(root, { animate: false })
      return
    }
    if (calendarPageAnimation?.playState === "running") return
    const row = content.querySelector(".calendar-event.is-expanded")
    if (row && (window.visualViewport?.scale || 1) <= 1.05) alignCalendarDrawer(row)
  }
  window.addEventListener("resize", resize)
  window.visualViewport?.addEventListener("resize", resize)
  disposeCalendarDrawerScrolling = () => {
    stopInertia()
    clearTouch()
    window.removeEventListener("resize", resize)
    window.visualViewport?.removeEventListener("resize", resize)
  }
}

// Native sticky positioning does the pinning. Only its inset changes when a
// tall sidebar needs to travel between its top and bottom viewport boundaries.
function bindProjectSidebar(root) {
  const sidebar = root.querySelector(".project-side")
  if (!sidebar) return () => {}
  const desktop = matchMedia("(min-width:681px)")
  let frame = 0, previousScroll = window.scrollY, previousTop = 0
  let zoom = 1, minimum = 0, maximum = 28
  const clamp = value => Math.max(minimum, Math.min(maximum, value))
  const measure = () => {
    zoom = Number(getComputedStyle(root).zoom) || 1
    maximum = 28 * zoom
    minimum = Math.min(maximum, innerHeight - maximum - sidebar.getBoundingClientRect().height)
    if (desktop.matches) {
      const top = previousTop ? clamp(sidebar.getBoundingClientRect().top) : minimum
      sidebar.style.setProperty("--project-sticky-top", `${top / zoom}px`)
    } else sidebar.style.removeProperty("--project-sticky-top")
    previousScroll = window.scrollY
    previousTop = sidebar.getBoundingClientRect().top
  }
  const update = () => {
    frame = 0
    if (!desktop.matches) return
    const scroll = window.scrollY
    const top = clamp(previousTop - (scroll - previousScroll))
    sidebar.style.setProperty("--project-sticky-top", `${top / zoom}px`)
    previousScroll = scroll
    previousTop = sidebar.getBoundingClientRect().top
  }
  const onScroll = () => { if (desktop.matches && !frame) frame = requestAnimationFrame(update) }
  const observer = new ResizeObserver(measure)
  observer.observe(sidebar)
  window.addEventListener("scroll", onScroll, { passive:true })
  window.addEventListener("resize", measure)
  desktop.addEventListener("change", measure)
  measure()
  return () => {
    observer.disconnect()
    cancelAnimationFrame(frame)
    window.removeEventListener("scroll", onScroll)
    window.removeEventListener("resize", measure)
    desktop.removeEventListener("change", measure)
    sidebar.style.removeProperty("--project-sticky-top")
  }
}

function bindPageInteractions(root, route, project) {
  if (route === "project") disposeProjectSidebar = bindProjectSidebar(root)
  const observeProjectRows = () => {
    projectsScrollObserver?.disconnect()
    const projectRows = root.querySelectorAll(".catalog-card, .project-gallery")
    if (projectRows.length) {
      const updateProjectFade = row => {
        row.style.setProperty("--project-fade-left", row.scrollLeft > 1 ? "24px" : "0px")
        row.style.setProperty("--project-fade-right", row.scrollWidth - row.clientWidth - row.scrollLeft > 1 ? "32px" : "0px")
      }
      projectsScrollObserver = new ResizeObserver(entries => entries.forEach(({ target }) => updateProjectFade(target)))
      projectRows.forEach(row => {
        row.addEventListener("scroll", () => updateProjectFade(row), { passive: true })
        projectsScrollObserver.observe(row)
        updateProjectFade(row)
      })
    }
  }
  observeProjectRows()
  if (route === "home" || route === "projects") {
    const desktop = matchMedia("(min-width:681px)")
    const updateCards = () => {
      root.querySelectorAll(".project-catalog > .catalog-card").forEach((card,index) => {
        card.outerHTML = catalogCard(projects[index],desktop.matches)
      })
      observeProjectRows()
      syncPatateurs(root)
    }
    desktop.addEventListener("change", updateCards)
    disposeHomeCatalog = () => desktop.removeEventListener("change", updateCards)
  }
  bindDateScrollLines(root)
  root.querySelectorAll("[data-expand-dates]").forEach(button => button.addEventListener("click", () => {
    const list = button.closest("[data-dates-list]")
    const remaining = [...list.querySelectorAll(".upcoming-row[hidden]")]
    remaining.slice(0, 3).forEach(row => { row.hidden = false })
    button.setAttribute("aria-expanded", "true")
    const presses = Number(button.dataset.datePresses || 0) + 1
    button.dataset.datePresses = String(presses)
    if (presses >= 3 || remaining.length <= 3) {
      button.hidden = true
      const calendarLink = list.querySelector("[data-dates-calendar]")
      calendarLink.hidden = false
      calendarLink.focus({ preventScroll: true })
    }
    syncPatateurs(root)
  }))
  root.querySelectorAll("[data-gallery]").forEach(button => button.addEventListener("click", () => {
    const item = (projectContent[project?.id]?.gallery || gallery)[Number(button.dataset.gallery)]
    openContent(root, `<h2 id="content-dialog-title">${esc(item.caption)}</h2><img class="lightbox-image" src="${asset(item.photo)}" alt="${esc(item.caption)}" /><p>${item.video ? "Aperçu de la captation · vidéo à ajouter." : esc(project?.name || "L’Amicale")}</p>`, "gallery-dialog")
  }))
  root.querySelectorAll("[data-project-contact]").forEach(button => button.addEventListener("click", () => {
    openContent(root, `<h2 id="content-dialog-title">${esc(button.dataset.projectContact)}</h2><p>Les coordonnées de contact seront ajoutées ici.</p>`)
  }))
  root.querySelectorAll("[data-resource]").forEach(button => button.addEventListener("click", () => {
    const label = button.dataset.resource
    openContent(root, `<h2 id="content-dialog-title">${esc(label)}</h2><p>${esc(project.name)} — ${esc(project.author)}</p><p>Ce document sera ajouté à la fiche du projet. Pour la démo, retrouvez les informations dans la présentation et les crédits.</p><a class="text-link" href="#presentation" data-resource-close>↗ Lire la présentation</a>`)
    root.querySelector("[data-resource-close]").addEventListener("click", () => root.querySelector("#content-dialog").close())
  }))
  if (route !== "calendar") return
  calendarArchiveController = bindCalendarArchives(root, () => updateCalendar())
  bindCalendarDrawerScrolling(root)
  const form = root.querySelector("[data-filter-form]")
  const activeFilters = () => Object.entries(calendarFilters).filter(([key, value]) => key === "period" ? value !== "all" : Boolean(value))
  const renderFilterState = () => {
    const active = activeFilters()
    form.querySelectorAll("[name]").forEach(control => { if (control.value !== calendarFilters[control.name]) control.value = calendarFilters[control.name] })
    form.querySelectorAll("[data-calendar-quick]").forEach(button => button.setAttribute("aria-pressed", String(calendarFilters[button.dataset.calendarQuick] === button.dataset.value)))
    root.querySelector("[data-calendar-active]").innerHTML = active.map(([key, value]) => {
      const label = key === "query" ? `« ${value} »` : [...form.elements[key].options].find(option => option.value === value)?.textContent || value
      return `<button type="button" data-calendar-remove="${key}" aria-label="Retirer ${esc(label)}">${esc(label)} <span aria-hidden="true">×</span></button>`
    }).join("")
    root.querySelector("[data-calendar-reset]").hidden = !active.length
    root.querySelector(".calendar-search-status").hidden = !active.length
  }
  let searchTimer
  let disposed = false
  const updateArchiveDOM = ({ reset = false } = {}) => {
    // Appending rows moves the focused load button. Preserve the current
    // viewport rather than letting the browser follow that button down.
    const viewport = !reset && !matchMedia("(max-width:680px)").matches
      ? { top:window.scrollY, left:window.scrollX } : null
    const content = root.querySelector("[data-calendar-content]")
    const drawer = content.querySelector("[data-event-drawer]")
    const focused = document.activeElement
    const wasLoadButton = focused?.matches("[data-archive-more]")
    if (reset && !drawer) {
      content.innerHTML = calendarContent()
      calendarArchiveController.refresh()
    } else calendarArchiveController.preserve(() => {
      const replacement = document.createElement("div")
      replacement.innerHTML = calendarContent()
      const nextPast = replacement.querySelector(".calendar-archives")
      const oldPast = content.querySelector(".calendar-archives")
      const nextBody = nextPast.querySelector(".calendar-table tbody")
      const oldBody = oldPast.querySelector(".calendar-table tbody")
      if (oldBody && nextBody) {
        const rowKey = row => row.dataset.eventRow ? `event:${row.dataset.eventRow}` : row.dataset.eventDrawer ? `drawer:${row.dataset.eventDrawer}` : `${row.className}:${row.textContent.trim()}`
        const existing = new Map([...oldBody.children].map(row => [rowKey(row), row]))
        const desired = []
        for (const generated of [...nextBody.children]) {
          const row = existing.get(rowKey(generated)) || generated
          desired.push(row)
          if (row.classList.contains("is-expanded") && drawer) desired.push(drawer)
        }
        // Leave existing date nodes attached. Inserting before them preserves
        // the browser's touch target and native scrolling gesture.
        let cursor = oldBody.firstElementChild
        for (const row of desired) {
          if (row !== cursor) oldBody.insertBefore(row, cursor)
          cursor = row.nextElementSibling
        }
        const keep = new Set(desired)
        for (const row of [...oldBody.children]) if (!keep.has(row)) row.remove()
      } else if (nextBody) {
        const table = nextPast.querySelector(".calendar-table-wrap")
        oldPast.insertBefore(table, archiveLoaderAtEnd() ? oldPast.querySelector("[data-archive-loader]") : null)
      }
      const oldLoader = oldPast.querySelector("[data-archive-loader]")
      const nextLoader = nextPast.querySelector("[data-archive-loader]")
      if (oldLoader && nextLoader) {
        oldLoader.innerHTML = nextLoader.innerHTML
        oldLoader.className = nextLoader.className
      } else if (oldLoader) oldLoader.remove()
      else if (nextLoader) {
        if (archiveLoaderAtEnd()) oldPast.append(nextLoader)
        else oldPast.insertBefore(nextLoader, oldPast.querySelector(".calendar-table-wrap"))
      }
    })
    if (focused && root.contains(focused)) focused.focus({ preventScroll:true })
    else if (wasLoadButton) (root.querySelector("[data-archive-more]") || root.querySelector(".calendar-archives [data-calendar-line]"))?.focus({ preventScroll:true })
    bindDateScrollLines(root)
    syncPatateurs(root)
    if (viewport) window.scrollTo({ ...viewport, behavior:"instant" })
  }
  const loadArchives = async ({ reset = false } = {}) => {
    if (disposed || archiveLoading || (!archiveHasMore && !archiveError)) return
    const request = archiveRequest
    const snapshot = { ...calendarFilters }
    archiveLoading = true
    archiveError = false
    const loader = root.querySelector("[data-archive-loader]")
    if (loader) {
      loader.querySelector("p").textContent = "Chargement des dates…"
      loader.querySelector("button").disabled = true
      loader.querySelector(".archive-loading-indicator").hidden = false
    }
    try {
      const source = await import("./calendar-archive-source.js")
      if (disposed || request !== archiveRequest) return
      const desktop = !matchMedia("(max-width:680px)").matches
      const page = source.readArchivePage({ cursor:desktop ? null : archiveCursor, ascending:archiveAscending, limit:desktop ? Infinity : archivePageSize, matches:event => matchesCalendarFilters(event, snapshot) })
      const apply = () => {
        if (disposed || request !== archiveRequest) return
        archives = [...new Map([...archives, ...page.rows].map(event => [event.id, event])).values()]
        archiveCursor = page.cursor
        archiveHasMore = page.hasMore
        archiveLoading = false
        updateArchiveDOM({ reset })
      }
      // A slow response must not interrupt a new swipe started after the tap.
      if (reset) apply()
      else calendarArchiveController.whenIdle(apply)
    } catch {
      if (disposed || request !== archiveRequest) return
      archiveLoading = false
      archiveError = true
      updateArchiveDOM({ reset })
    }
  }
  disposeCalendarFilters = () => { disposed = true; clearTimeout(searchTimer); archiveRequest++ }
  const updateCalendar = () => {
    clearTimeout(searchTimer)
    archiveRequest++
    archiveLoading = false
    archiveError = false
    archiveAscending = matchMedia("(max-width:680px)").matches && (calendarFilters.period.startsWith("year:") || calendarFilters.period.startsWith("season:") || /^\d{4}$/.test(calendarFilters.query.trim()))
    archives = hasCalendarFilters() ? [] : [...archivePreview]
    archiveCursor = hasCalendarFilters() ? null : archivePreview.at(-1)
    archiveHasMore = calendarFilters.period !== "upcoming"
    closeCalendarDrawer(root, { animate: false })
    renderFilterState()
    root.querySelector("[data-calendar-content]").innerHTML = calendarContent()
    calendarArchiveController.refresh()
    bindDateScrollLines(root)
    syncPatateurs(root)
    if ((hasCalendarFilters() || !matchMedia("(max-width:680px)").matches) && archiveHasMore) loadArchives({ reset:true })
  }
  form.addEventListener("submit", event => event.preventDefault())
  form.addEventListener("input", event => {
    if (!event.target.name) return
    calendarFilters[event.target.name] = event.target.value
    if (event.target.name === "query") {
      clearTimeout(searchTimer)
      archiveRequest++
      renderFilterState()
      searchTimer = setTimeout(updateCalendar, 180)
    } else updateCalendar()
  })
  form.addEventListener("click", event => {
    const quick = event.target.closest("[data-calendar-quick]")
    const remove = event.target.closest("[data-calendar-remove]")
    if (quick) {
      const key = quick.dataset.calendarQuick
      calendarFilters[key] = calendarFilters[key] === quick.dataset.value ? emptyCalendarFilters()[key] : quick.dataset.value
    } else if (remove) {
      calendarFilters[remove.dataset.calendarRemove] = emptyCalendarFilters()[remove.dataset.calendarRemove]
    } else if (event.target.closest("[data-calendar-reset]")) calendarFilters = emptyCalendarFilters()
    else return
    updateCalendar()
    if (remove) form.querySelector("[name=query]").focus({ preventScroll:true })
  })
  form.querySelector("details").addEventListener("toggle", () => syncPatateurs(root))
  renderFilterState()
  calendarArchiveController.refresh()
  root.querySelector("[data-calendar-content]").addEventListener("click", event => {
    if (event.target.closest("[data-archive-more]")) { calendarArchiveController.enterArchive(); loadArchives({ reset:!archives.length }); return }
    if (event.target.closest("[data-close-event]")) {
      closeCalendarDrawer(root, { restoreFocus: true })
      return
    }
    const booking = event.target.closest("[data-book-event]")
    if (booking) {
      const status = booking.closest(".calendar-drawer-booking").querySelector(".calendar-booking-status")
      status.textContent = "Lien de réservation à venir."
      status.hidden = false
      return
    }
    if (event.target.closest("[data-event-drawer]")) return
    const row = event.target.closest("[data-event-row]")
    if (row && matchMedia("(max-width:680px)").matches) {
      event.preventDefault()
      showEvent(root, row.dataset.eventRow)
      return
    }
    const target = event.target.closest("[data-open-event], [data-sort-date]")
    if (!target) return
    event.preventDefault()
    if (target.hasAttribute("data-sort-date")) {
      const inArchives = Boolean(target.closest(".calendar-archives"))
      dateOrder *= -1
      closeCalendarDrawer(root, { animate:false })
      updateArchiveDOM({ reset:true })
      root.querySelector(`${inArchives ? ".calendar-archives" : ".calendar-upcoming"} [data-sort-date]`)?.focus({ preventScroll:true })
    }
    else showEvent(root, target.dataset.openEvent)
  })
  root.addEventListener("keydown", event => {
    if (event.key === "Escape" && root.querySelector(".calendar-event.is-expanded")) {
      event.preventDefault()
      closeCalendarDrawer(root, { restoreFocus: true })
    } else if ((event.key === "Enter" || event.key === " ") && event.target.matches("[data-calendar-line]")) {
      event.preventDefault()
      event.target.click()
    }
  })
  root.addEventListener("click", event => {
    if (root.querySelector(".calendar-content.has-open-event") && !event.target.closest("[data-event-drawer]")) {
      event.preventDefault()
      event.stopPropagation()
      closeCalendarDrawer(root)
    }
  }, { capture: true })
  if (hasCalendarFilters()) updateCalendar()
  else if (!matchMedia("(max-width:680px)").matches) loadArchives()
  const selectedEvent = new URLSearchParams(location.search).get("event")
  if (selectedEvent) {
    if ([...events, ...archives].some(event => event.id === selectedEvent)) showEvent(root, selectedEvent)
    else {
      const request = archiveRequest
      import("./calendar-archive-source.js").then(source => {
        if (disposed || request !== archiveRequest) return
        const event = source.findArchiveEvent(selectedEvent)
        if (!event) return
        const desktop = !matchMedia("(max-width:680px)").matches
        const context = source.readArchivePage({ cursor:desktop ? null : event, limit:desktop ? Infinity : archivePageSize })
        archives = [...new Map([event, ...context.rows].map(item => [item.id, item])).values()]
        archiveCursor = context.cursor
        archiveHasMore = context.hasMore
        updateArchiveDOM({ reset:true })
        showEvent(root, selectedEvent)
      }).catch(() => {})
    }
  }
}

export function renderDemoPage(route = "home") {
  disposeHomeCatalog()
  disposeHomeCatalog = () => {}
  disposeProjectSidebar()
  disposeCalendarFilters()
  archives = [...archivePreview]
  archiveCursor = archivePreview.at(-1)
  archiveHasMore = true
  archiveLoading = false
  archiveError = false
  archiveAscending = false
  calendarArchiveController?.dispose()
  calendarArchiveController = null
  disposeCalendarDrawerScrolling()
  calendarDrawerAnimation?.cancel()
  unlockCalendarPage()
  datesScrollObserver?.disconnect()
  projectsScrollObserver?.disconnect()
  mountedWheels.forEach(app => app.unmount())
  mountedWheels = []
  destroyPatateurs()
  const root = document.querySelector("#app")
  const params = new URLSearchParams(location.search)
  const project = route === "project" ? getProject(params.get("project") || "tiret-du-six") : null
  const markup = route === "home" || route === "projects" ? homeMarkup() : route === "project" && project ? projectMarkup(project) : route === "calendar" ? calendarMarkup() : route === "blog" ? blogMarkup(params.get("article")) : `${siteHeader()}<main class="not-found"><h1>Cette page n’existe pas.</h1><a class="text-link" href="?page=home">↗ Retour à l’accueil</a></main>`
  const desktopFooter = route === "project" || route === "calendar" ? siteFooter({ desktopOnly:true }) : ""
  root.innerHTML = `<div class="page demo-page ${route === "home" || route === "projects" ? "home-page" : `${route}-page`}">${markup}${desktopFooter}${siteMenu()}${dialogMarkup()}</div>`
  document.title = `${project?.name || ({home:"Projets", calendar:"Calendrier", blog:"Blog"}[route] || "Accueil")} — L’Amicale`
  root.querySelectorAll("[data-compact-wheel], [data-project-wheel]").forEach(element => {
    const projectWheel = element.hasAttribute("data-project-wheel")
    const author = project?.author.split(",")[0].trim()
    const items = projectWheel && author ? Array.from({ length:7 }, (_, index) => ({
      id:`${personHref(author)}-${index}`, label:author, alt:author,
      src:portraitForPerson(author) || placeholderPortrait(), href:personHref(author),
    })) : wheelPeople
    const app = createApp(PeopleWheel, { items, compact:true, desktopPortraitScale:projectWheel ? 1.7 : 1.56 })
    app.mount(element)
    mountedWheels.push(app)
  })
  bindSiteInteractions(root)
  bindPageInteractions(root, route, project)
  syncPatateurs(root)
}

if (import.meta.hot) import.meta.hot.dispose(() => {
  disposeHomeCatalog()
  disposeProjectSidebar()
  disposeCalendarFilters()
  calendarArchiveController?.dispose()
  calendarArchiveController = null
  disposeCalendarDrawerScrolling()
  calendarDrawerAnimation?.cancel()
  unlockCalendarPage()
  datesScrollObserver?.disconnect()
  projectsScrollObserver?.disconnect()
  mountedWheels.forEach(app => app.unmount())
})
