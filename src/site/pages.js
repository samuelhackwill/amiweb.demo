import { createApp } from "vue"
import PeopleWheel from "../components/people-wheel/PeopleWheel.vue"
import { patateurLabel, syncPatateurs, destroyPatateurs } from "../patateur/index.js"
import { asset, publicAsset, projects, allProjects, projectHref, personHref, getProject, wheelPeople, gallery, events, archives, posts } from "./data.js"
import { esc, siteHeader, siteFooter, siteMenu, bindSiteInteractions } from "./shared.js"
import "./site.css"

let mountedWheels = []
let calendarFilters = { query: "", project: "", city: "" }
let dateOrder = 1
let datesScrollObserver
let projectsScrollObserver
const dateFormat = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit" })
const shortDate = date => dateFormat.format(new Date(`${date}T12:00:00`))
const heading = (label, seed) => patateurLabel(label, seed, "page-label")
const titleImage = (project, className = "") => project.title || project.titleUrl ? `<img class="project-lettering ${className}" src="${project.titleUrl || asset(project.title)}" alt="${esc(project.name)}" />` : `<span class="project-type-title ${className}">${esc(project.name)}</span>`
const thumbnail = (project, seed, className = "") => `<span class="event-thumb ${className}" data-patateur-mask="${esc(seed)}" data-patateur-preset="project" data-patateur-wobble="1"><img src="${asset(project.photo)}" alt="" style="object-position:${project.focus || "center"}" loading="lazy" /></span>`

function datesList(projectId, seed, limit = 3) {
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
  const dates = events.filter(event => event.date >= today && (!projectId || event.project === projectId))
    .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`))
  return `<div class="upcoming-list" data-dates-list>${dates.map((event, index) => {
    const project = getProject(event.project)
    const text = `<span>${esc(event.city)} <a href="?page=calendar&amp;event=${event.id}">↗ ${projectId ? esc(event.venue) : esc(project.name)}</a></span>`
    const time = `<time datetime="${event.date}">${shortDate(event.date).slice(0, 5)}${projectId ? ` ${event.time}` : ""}</time>`
    return `<div class="upcoming-row" ${index >= limit ? "hidden data-extra-date" : ""}>${projectId ? text + time : time + text}</div>`
  }).join("")}${dates.length ? `<div class="dates-more">${dates.length > limit ? `<button class="more-button" data-patateur="${seed}-more" data-patateur-preset="round" data-patateur-wobble="2" type="button" data-expand-dates aria-expanded="false" aria-label="Afficher trois dates supplémentaires"><span data-more-label>+</span></button>` : ""}<a class="page-label dates-calendar-link" data-dates-calendar data-patateur="${seed}-calendar" data-patateur-preset="bubble" data-patateur-wobble="3" href="?page=calendar" ${dates.length > limit ? "hidden" : ""}>Voir le calendrier</a></div>` : ""}</div>`
}

function homeMarkup() {
  return `${siteHeader()}<main class="home-content"><section class="home-intro"><div class="home-summary"><a class="home-logo" href="?page=lamicale"><img src="${publicAsset("footer-logo.png")}" alt="L’Amicale" /></a><p class="home-manifesto" data-patateur="home-manifesto">L’Amicale est une plateforme coopérative de production et diffusion de projets vivants.</p></div><div class="home-dates">${heading("Prochaines dates :", "home-dates")}${datesList(null, "home", 5)}</div><div class="home-wheel" data-compact-wheel></div><div class="design-placeholder home-wheel-placeholder" aria-label="Emplacement réservé à la roue">placeholder<br />: roue</div></section><section class="project-catalog" id="projects" aria-label="Tous les projets">${heading("Tous les projets :", "all-projects")}${projects.map(project => `<article class="catalog-card"><a class="catalog-photo" href="${projectHref(project.id)}"><span class="catalog-mask" data-patateur-mask="catalog-${project.id}" data-patateur-preset="project"><img src="${asset(project.photo)}" alt="${esc(project.name)}" loading="lazy" /></span><span class="project-kind" data-patateur="kind-${project.id}" data-patateur-wobble="2">${esc(project.type)}</span></a><div class="catalog-title"><a href="${projectHref(project.id)}">${titleImage(project)}</a>${project.status ? `<span class="project-status" data-patateur="status-${project.id}" data-patateur-wobble="2">${esc(project.status)}</span>` : ""}</div><div class="catalog-copy"><a class="catalog-author" href="${personHref(project.author.split(",")[0])}">${esc(project.author)}</a><p ${project.italic ? 'class="is-italic"' : ""}>${esc(project.description)}</p></div></article>`).join("")}</section></main>${siteFooter()}`
}

function projectMarkup(project) {
  const isTiret = project.id === "tiret-du-six"
  const questions = [
    ["Je déteste les ordinateurs, est-ce que cette pièce est pour moi ?", "Oui ! Aucune connaissance informatique n’est nécessaire. On vient pour jouer, écouter et partager une histoire ensemble."],
    [`Où est-ce que je peux voir ${project.name} ?`, "Les prochaines représentations sont indiquées dans les dates ci-dessus et dans le calendrier."],
    [`Est-ce que ${project.author.split(" ")[0]} est un nerd ?`, "La réponse mérite une conversation après le spectacle."],
    ["Est-ce qu’on peut encore dire que c’est du théâtre vu qu’il n’y a pas d’acteurs sur scène ?", "On vous laisse vous faire votre propre idée : la rencontre avec le public fait partie de la pièce."],
  ]
  const copy = isTiret ? `<p>Le tiret du six est un jeu de lecture en réseau qui s’inspire des LAN parties, ces rassemblements vidéoludiques qui étaient populaires dans les années 2000, notamment en milieu rural.</p><p>On y parle du destin tragique du médecin de famille de Samuel qui n’aimait pas les ordinateurs, d’un programme écrit dans les années 80 et installé par défaut sur votre machine, de réseaux informatiques, de librisme, d’athlétisme et de justice sociale dans l’avant-pays savoyard.</p>` : `<p>${esc(project.description)}</p><p>Une création accompagnée par l’Amicale, entre spectacle vivant et arts visuels. Cette fiche utilise du contenu de démonstration pour explorer le projet, ses images et ses prochaines dates.</p>`
  return `${siteHeader({ active: "home", crumb: project.name })}<main class="project-layout"><article class="project-main"><div class="project-heading"><h1>${titleImage(isTiret ? { ...project, title: "project-title-tiret.svg" } : project)}</h1><p class="project-author" data-patateur="project-author" data-patateur-wobble="3"><a href="${personHref(project.author.split(",")[0])}">${esc(project.author)}</a></p></div><figure class="project-hero" data-patateur-mask="hero-${project.id}" data-patateur-preset="project" data-patateur-wobble="12"><img src="${asset(project.photo)}" alt="${esc(project.name)}" fetchpriority="high" /></figure><section class="project-dates" id="dates">${heading("Prochaines dates :", "project-dates")}${datesList(project.id, "project", 3)}${!events.some(event => event.project === project.id) ? `<p>De nouvelles dates bientôt. <a class="body-link" href="?page=calendar">Voir le calendrier</a></p>` : ""}</section><section class="project-body" id="presentation">${copy}</section><section class="project-gallery" id="images" aria-label="Images du projet">${gallery.map((item, index) => `<button class="gallery-item" type="button" data-gallery="${index}" aria-label="Agrandir : ${esc(item.caption)}"><span data-patateur-mask="gallery-${project.id}-${index}" data-patateur-preset="project" class="gallery-mask"><img src="${asset(item.photo)}" alt="${esc(item.caption)}" loading="lazy" /></span>${item.video ? `<img class="gallery-play" src="${asset("play.svg")}" alt="" />` : ""}</button>`).join("")}</section><section class="project-faq" id="faq">${heading("FAQ :", "project-faq")}${questions.map(([question, answer]) => `<details><summary>↓ ${esc(question)}</summary><p>${esc(answer)}</p></details>`).join("")}</section><section class="project-credits" id="credits">${heading("Crédits :", "project-credits")}<p><strong>${esc(project.author)}</strong> – c’est lui qui fait le projet<br />Jambo lynn – maïeutique &amp; gaffer-tape<br />Thomas Riou – Tableurs &amp; courriels<br />Etienne Boutin – Señor developper</p><p>Coproduction :<br />Les SUBS (Lyon)</p><p>Partenaires :<br />DRAC Hauts-de-France<br />DICREAM (CNC)<br />Ville de Lille<br />ADAGP<br />LA SERRE arts vivants (Montréal)<br />Le Vivat (Armentières)<br />La Bellone (Bruxelles)<br />ESADSE (Saint-Étienne)</p><p>Soutiens :<br />Arté Creative<br />DDays (Paris)<br />Théâtre de Poche (Hédé-Bazouges)<br />La Gaîté Lyrique (Paris)<br />Pianofabriek (Bruxelles)<br />Le Centquatre (Paris)<br />Channel, Scène nationale Calais<br />Cartonnerie de Gondardennes</p><p>Merci à Mathilde Maillard, Jacques-Daniel Pillon, Antoine Defoort, David-Olivier Lartigaud, Michel Lepetitdidier, Emmaüs connect Lyon, CLIS XXI, Marine Thévenet, Marion Le Guerroué, Alice Broyelle, Marie Devoux, Erwan Le Sornet, Joseph Aflalo et Stéphanie Aflalo.</p></section></article><aside class="project-side"><section>${heading("contacts :", "project-contact")}<p>Production ↓<br /><a href="mailto:production@example.com">✉ Bob McProd</a></p><p>Diffusion ↓<br /><a href="mailto:diffusion@example.com">✉ Bob McDiff</a></p></section><section>${heading("Biro :", "project-links")}<div class="project-resources">${["fiche de diffusion", "dossier de presse", "mini-bio", "fiche technique", "teaser", "captation"].map(label => `<button type="button" class="text-link" data-resource="${esc(label)}">↗ ${label}</button>`).join("")}</div></section><div class="project-people-wheel" data-project-wheel></div><nav class="project-toc" aria-label="Sommaire">${heading("Sommaire :", "project-toc")}<a href="#top">Haut de page</a><a href="#presentation">Présentation</a><a href="#dates">Dates</a><a href="#images">Images</a><a href="#faq">FAQ</a><a href="#credits">Crédits</a></nav></aside></main>`
}

function eventMatches(event) {
  const project = getProject(event.project)
  const text = `${project.name} ${project.author} ${event.city} ${event.venue}`.toLocaleLowerCase("fr")
  return (!calendarFilters.query || text.includes(calendarFilters.query.toLocaleLowerCase("fr"))) && (!calendarFilters.project || event.project === calendarFilters.project) && (!calendarFilters.city || event.city === calendarFilters.city)
}

function calendarTable(items, archive = false) {
  const rows = items.filter(eventMatches).sort((a, b) => dateOrder * `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
  let previousMonth = ""
  return `<div class="calendar-table-wrap"><table class="calendar-table"><colgroup><col class="col-project" /><col class="col-city" /><col class="col-author" /><col class="col-venue" /><col class="col-date" /></colgroup><thead><tr><th>Projet</th><th class="event-city">Ville</th><th class="event-author">Auteur.ice.s</th><th class="event-venue">Lieu</th><th><button type="button" data-sort-date>Date/heure ${dateOrder < 0 ? "↑" : ""}</button></th></tr></thead><tbody>${rows.map(event => {
    const project = getProject(event.project)
    const month = event.date.slice(0, 7)
    let separator = ""
    if (month !== previousMonth) {
      const label = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(new Date(`${event.date}T12:00:00`))
      separator = `<tr class="calendar-month"><td colspan="5">↓ ${label}</td></tr>`
      previousMonth = month
    }
    const today = event.date === new Date().toLocaleDateString("en-CA")
    return `${separator}<tr class="calendar-event${today ? " is-today" : ""}" data-event-row="${event.id}"><td><a class="calendar-project" href="${projectHref(project.id)}">${thumbnail(project, `${archive ? "archive" : "event"}-${event.id}`)}<i>${esc(project.name)}</i></a></td><td class="event-city">${esc(event.city)}</td><td class="event-author"><a href="${personHref(project.author.split(",")[0])}">${esc(project.author)}</a></td><td class="event-venue"><a href="?page=calendar&amp;event=${event.id}" data-open-event="${event.id}">↗ ${esc(event.venue)}</a></td><td><button class="event-date" type="button" data-open-event="${event.id}"><span class="event-date-desktop">${new Intl.DateTimeFormat("fr-FR", { weekday: "long" }).format(new Date(`${event.date}T12:00:00`))} ${shortDate(event.date)} à ${event.time.replace(":", "H")}</span><span class="event-date-mobile">${today ? "Aujourd’hui" : shortDate(event.date).slice(0, 5)} ${event.time}${event.endTime ? ` → ${event.endTime}` : ""}</span></button></td></tr>`
  }).join("")}${!rows.length ? '<tr><td colspan="5" class="calendar-empty">Aucune date pour ces filtres.</td></tr>' : ""}</tbody></table></div>`
}

function calendarContent() {
  return `${calendarTable(events)}<details class="calendar-archives" open><summary>${heading("Archives :", "calendar-archives")}</summary>${calendarTable(archives, true)}</details>`
}

function calendarMarkup() {
  return `${siteHeader({ active: "calendar" })}<main class="calendar-content"><button class="design-placeholder calendar-placeholder" type="button" data-filter-open aria-haspopup="dialog">placeholder : filters</button><button class="mobile-filters" type="button" data-filter-open aria-haspopup="dialog">Filtres <span data-filter-count></span></button><div data-calendar-content>${calendarContent()}</div></main><dialog class="filter-dialog" id="calendar-filters" aria-labelledby="filter-title"><button class="dialog-close" type="button" data-dialog-close aria-label="Fermer les filtres">×</button><h2 id="filter-title">Filtrer les dates</h2><form data-filter-form><label>Rechercher<input name="query" type="search" placeholder="Projet, artiste ou lieu…" /></label><label>Projet<select name="project"><option value="">Tous les projets</option>${allProjects.filter(project => events.some(event => event.project === project.id)).map(project => `<option value="${project.id}">${esc(project.name)}</option>`).join("")}</select></label><label>Ville<select name="city"><option value="">Toutes les villes</option>${[...new Set(events.map(event => event.city))].map(city => `<option>${esc(city)}</option>`).join("")}</select></label><div class="filter-actions"><button type="reset">Réinitialiser</button><button type="submit">Afficher les dates</button></div></form></dialog>`
}

function blogMarkup(articleId) {
  const article = posts.find(post => post.id === articleId)
  return `${siteHeader({ active: "blog" })}<main class="blog-content">${article ? `<a class="text-link" href="?page=blog">← Toutes les nouvelles</a><article class="blog-article"><p class="post-date">${article.date}</p><h1>${esc(article.title)}</h1><figure data-patateur-mask="article-${article.id}"><img src="${asset(article.photo)}" alt="" /></figure><p>${esc(article.excerpt)}</p><p>À l’Amicale, les projets se construisent avec des personnes, des lieux et beaucoup de conversations. On partage ici des nouvelles de ce travail collectif, sur scène et en dehors.</p><p>Ce texte est un exemple pour la démo du blog. Les prochains récits, images et nouvelles viendront prendre leur place ici.</p><a class="text-link" href="?page=home#projects">↗ Découvrir les projets</a></article>` : `<h1 class="blog-title">Nouvelles de l’Amicale</h1><p class="blog-intro">Des projets, des rencontres et des nouvelles de la coopérative.</p><div class="blog-list">${posts.map(post => `<article class="blog-card"><a class="blog-photo" href="?page=blog&amp;article=${post.id}" data-patateur-mask="blog-${post.id}"><img src="${asset(post.photo)}" alt="" loading="lazy" /></a><div><p class="post-date">${post.date}</p><h2><a href="?page=blog&amp;article=${post.id}">${esc(post.title)}</a></h2><p>${esc(post.excerpt)}</p><a class="text-link" href="?page=blog&amp;article=${post.id}">↗ Lire la suite</a></div></article>`).join("")}</div>`}</main>${siteFooter()}`
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
  openContent(root, `<div class="event-detail"><figure data-patateur-mask="event-detail-${event.id}" data-patateur-preset="project"><img src="${asset(project.photo)}" alt="${esc(project.name)}" style="object-position:${project.focus || "center"}" /></figure><div><h2 id="content-dialog-title">${titleImage(project)}</h2><a href="${personHref(project.author.split(",")[0])}">${esc(project.author)}</a><p>Le ${shortDate(event.date)} à ${event.time}${event.endTime ? ` → ${event.endTime}` : ""}</p><strong>${esc(event.city)}</strong><p>${esc(event.venue)}</p><a class="text-link" href="${projectHref(project.id)}">↗ Voir le projet</a><p class="event-demo-note">Date de démonstration · réservation à venir.</p></div></div>`, "event-dialog")
}

function bindPageInteractions(root, route, project) {
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
  const dateLines = root.querySelectorAll(".upcoming-row > span")
  if (dateLines.length) {
    const updateFade = line => {
      const remaining = line.scrollWidth - line.clientWidth - line.scrollLeft
      line.style.setProperty("--date-fade-left", line.scrollLeft > 1 ? "24px" : "0px")
      line.style.setProperty("--date-fade-right", remaining > 1 ? "32px" : "0px")
      line.tabIndex = line.scrollWidth > line.clientWidth + 1 ? 0 : -1
    }
    datesScrollObserver = new ResizeObserver(entries => entries.forEach(({ target }) => updateFade(target)))
    dateLines.forEach(line => {
      line.addEventListener("scroll", () => updateFade(line), { passive: true })
      datesScrollObserver.observe(line)
      updateFade(line)
    })
  }
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
    const item = gallery[Number(button.dataset.gallery)]
    openContent(root, `<h2 id="content-dialog-title">${esc(item.caption)}</h2><img class="lightbox-image" src="${asset(item.photo)}" alt="${esc(item.caption)}" /><p>${item.video ? "Aperçu de la captation · vidéo à ajouter." : esc(project?.name || "L’Amicale")}</p>`, "gallery-dialog")
  }))
  root.querySelectorAll("[data-resource]").forEach(button => button.addEventListener("click", () => {
    const label = button.dataset.resource
    openContent(root, `<h2 id="content-dialog-title">${esc(label)}</h2><p>${esc(project.name)} — ${esc(project.author)}</p><p>Ce document sera ajouté à la fiche du projet. Pour la démo, retrouvez les informations dans la présentation et les crédits.</p><a class="text-link" href="#presentation" data-resource-close>↗ Lire la présentation</a>`)
    root.querySelector("[data-resource-close]").addEventListener("click", () => root.querySelector("#content-dialog").close())
  }))
  if (route !== "calendar") return
  const filterDialog = root.querySelector("#calendar-filters")
  const form = root.querySelector("[data-filter-form]")
  root.querySelectorAll("[data-filter-open]").forEach(button => button.addEventListener("click", () => filterDialog.showModal()))
  const updateCalendar = () => {
    root.querySelector("[data-calendar-content]").innerHTML = calendarContent()
    root.querySelector("[data-filter-count]").textContent = Object.values(calendarFilters).filter(Boolean).length ? "•" : ""
    syncPatateurs(root)
  }
  form.addEventListener("submit", event => {
    event.preventDefault()
    calendarFilters = Object.fromEntries(new FormData(form))
    updateCalendar()
    filterDialog.close()
  })
  form.addEventListener("reset", () => {
    calendarFilters = { query: "", project: "", city: "" }
    updateCalendar()
  })
  root.querySelector("[data-calendar-content]").addEventListener("click", event => {
    const target = event.target.closest("[data-open-event], [data-sort-date]")
    if (!target) return
    event.preventDefault()
    if (target.hasAttribute("data-sort-date")) { dateOrder *= -1; updateCalendar() }
    else showEvent(root, target.dataset.openEvent)
  })
  const selectedEvent = new URLSearchParams(location.search).get("event")
  if (selectedEvent) showEvent(root, selectedEvent)
}

export function renderDemoPage(route = "home") {
  datesScrollObserver?.disconnect()
  projectsScrollObserver?.disconnect()
  mountedWheels.forEach(app => app.unmount())
  mountedWheels = []
  destroyPatateurs()
  const root = document.querySelector("#app")
  const params = new URLSearchParams(location.search)
  const project = route === "project" ? getProject(params.get("project") || "tiret-du-six") : null
  const markup = route === "home" || route === "projects" ? homeMarkup() : route === "project" && project ? projectMarkup(project) : route === "calendar" ? calendarMarkup() : route === "blog" ? blogMarkup(params.get("article")) : `${siteHeader()}<main class="not-found"><h1>Cette page n’existe pas.</h1><a class="text-link" href="?page=home">↗ Retour à l’accueil</a></main>`
  root.innerHTML = `<div class="page demo-page ${route === "home" || route === "projects" ? "home-page" : `${route}-page`}">${markup}${siteMenu()}${dialogMarkup()}</div>`
  document.title = `${project?.name || ({home:"Projets", calendar:"Calendrier", blog:"Blog"}[route] || "Accueil")} — L’Amicale`
  root.querySelectorAll("[data-compact-wheel], [data-project-wheel]").forEach(element => {
    const app = createApp(PeopleWheel, { items: wheelPeople, compact: true })
    app.mount(element)
    mountedWheels.push(app)
  })
  bindSiteInteractions(root)
  bindPageInteractions(root, route, project)
  syncPatateurs(root)
}

if (import.meta.hot) import.meta.hot.dispose(() => {
  datesScrollObserver?.disconnect()
  projectsScrollObserver?.disconnect()
  mountedWheels.forEach(app => app.unmount())
})
