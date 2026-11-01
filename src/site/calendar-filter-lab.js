import { syncPatateurs, destroyPatateurs } from "../patateur/index.js"
import { events, createDemoArchives, allProjects, getProject, asset } from "./data.js"
import "./calendar-filter-lab.css"

const root = document.querySelector("#calendar-filter-lab")
const esc = value => String(value).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c])
const today = new Date().toLocaleDateString("en-CA")
const seasonOf = date => Number(date.slice(0, 4)) - (Number(date.slice(5, 7)) < 9 ? 1 : 0)
const entries = [...events, ...createDemoArchives()].sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
const cities = [...new Set(entries.map(e => e.city))].sort((a, b) => a.localeCompare(b, "fr"))
const seasons = [...new Set(entries.map(e => seasonOf(e.date)))].sort((a, b) => b - a)
const blank = () => ({ query: "", project: "", city: "", period: "upcoming" })
const candidates = [
  { id: "A", title: "Le ruban", note: "Les critères restent sous les yeux. On affine directement, sans ouvrir de panneau." },
  { id: "B", title: "Le déplié", note: "Un petit lien ouvre les filtres dans la page. Les dates descendent et réagissent en direct." },
  { id: "C", title: "Le tiroir du bas", note: "Un espace dédié pour choisir tranquillement, puis un bouton pour afficher les dates." },
  { id: "D", title: "La phrase", note: "Les filtres se lisent comme une envie de sortie. Chaque mot souligné se modifie." },
  { id: "E", title: "La recherche d’abord", note: "On tape un nom ou une ville, ou on touche une suggestion. Les autres critères restent accessibles." },
]
const states = new Map(candidates.map(c => [c.id, blank()]))
const limits = new Map(candidates.map(c => [c.id, 7]))
const options = key => key === "project"
  ? [["", "Tous les projets"], ...allProjects.map(p => [p.id, p.name])]
  : key === "city" ? [["", "Partout"], ...cities.map(c => [c, c])]
    : [["upcoming", "À venir"], ["past", "Archives"], ["all", "Toutes les dates"], ["year:2021", "2021"], ...seasons.map(s => [String(s), `Saison ${s}–${s + 1}`])]
const select = (id, key, label) => `<label class="filter-field"><span>${label}</span><select name="${key}" aria-label="${label}">${options(key).map(([value, name]) => `<option value="${esc(value)}">${esc(name)}</option>`).join("")}</select></label>`
const search = id => `<label class="search-field"><span class="sr-only">Rechercher un projet, artiste ou lieu</span><input name="query" type="search" placeholder="Projet, artiste, ville…" autocomplete="off" /></label>`
const button = (text, seed, attrs = "", className = "patate-button") => `<button type="button" class="${className}" data-patateur="${seed}" data-patateur-wobble="3" ${attrs}>${text}</button>`
const fields = id => `${search(id)}<div class="field-grid">${select(id, "project", "Quel projet ?")}${select(id, "city", "Où ?")}${select(id, "period", "Quand ?")}</div>`
const reset = () => `<button type="button" class="reset" data-reset>Tout effacer</button>`
const controls = id => {
  if (id === "A") return `<form class="ribbon-form">${search(id)}<div class="ribbon">${[ ["project", "Projet"], ["city", "Ville"], ["period", "Période"] ].map(([key, label]) => `<div data-patateur="a-${key}" data-patateur-wobble="2">${select(id, key, label)}</div>`).join("")}</div></form>`
  if (id === "B") return `<details class="inline-panel"><summary>Filtres <span data-count></span><span class="toggle-sign" aria-hidden="true">+</span></summary><form>${fields(id)}${reset()}</form></details>`
  if (id === "C") return `<div class="sheet-trigger">${button('Filtres <span data-count></span> <span aria-hidden="true">↗</span>', "c-open", 'data-open-sheet aria-haspopup="dialog"')}<span class="sheet-selection" data-selection>Aucune restriction</span></div>`
  if (id === "D") return `<form class="sentence-form"><p>J’aimerais voir<br />${select(id, "project", "Le projet")}<br />du côté de ${select(id, "city", "La ville")}<br />${select(id, "period", "La période")}.</p><details><summary>Un nom en tête ?</summary>${search(id)}</details></form>`
  return `<form class="search-first">${search(id)}<div class="suggestions" aria-label="Suggestions">${[["city", "Lille", "À Lille"], ["project", "germinal", "Germinal"], ["period", "year:2021", "2021"]].map(([key, value, label]) => `<button type="button" data-patateur="e-suggestion-${key}" data-patateur-wobble="3" data-quick-key="${key}" data-quick-value="${value}" aria-pressed="false">${label} <span aria-hidden="true">+</span></button>`).join("")}</div><details><summary>Affiner la recherche <span aria-hidden="true">+</span></summary><div class="field-grid">${select(id, "project", "Projet")}${select(id, "city", "Ville")}${select(id, "period", "Période")}</div></details></form>`
}

root.innerHTML = `<header class="lab-header"><a href="${import.meta.env.BASE_URL}?page=calendar">← Retour au calendrier</a><p class="eyebrow">L’Amicale · atelier mobile</p><h1>Cinq façons<br />de trouver une date.</h1><p>Essayez les filtres : chaque proposition a son propre calendrier. Projets, artistes, villes et archives utilisent les mêmes données de démonstration.</p><nav aria-label="Les cinq propositions">${candidates.map(c => `<a href="#filter-${c.id}">${c.id} · ${c.title}</a>`).join("")}</nav></header><div class="variants">${candidates.map(c => `<section class="candidate" id="filter-${c.id}" data-candidate="${c.id}" aria-labelledby="title-${c.id}"><div class="candidate-heading"><h2 id="title-${c.id}"><span>${c.id}</span>${c.title}</h2><p>${c.note}</p></div><div class="phone-preview"><div class="preview-header"><img src="${asset("header-wordmark-mobile.svg")}" alt="L’Amicale" /><span>Calendrier</span></div><div class="filter-controls">${controls(c.id)}</div><div class="active-filters" data-active-filters aria-label="Filtres actifs"></div><div class="results-caption"><p role="status" aria-live="polite" data-result-count></p><button type="button" class="reset" data-reset hidden>Effacer</button></div><div class="date-results" data-results></div></div></section>`).join("")}</div><dialog class="filter-sheet" aria-labelledby="sheet-title"><form method="dialog"><div class="sheet-grip" aria-hidden="true"></div><header><h2 id="sheet-title">On va voir quoi ?</h2><button type="button" class="sheet-close" aria-label="Fermer les filtres" data-close-sheet>×</button></header><p class="sheet-intro">Un projet précis, une ville, ou juste l’envie de fouiller.</p>${fields("sheet")}<div class="sheet-actions">${reset()}${button('<span data-sheet-label>Afficher les dates</span>', 'sheet-apply', 'data-apply-sheet')}</div></form></dialog>`

const normalize = text => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
function matching(state) {
  return entries.filter(event => {
    const project = getProject(event.project)
    const period = state.period === "all" || (state.period === "upcoming" ? event.date >= today : state.period === "past" ? event.date < today : state.period.startsWith("year:") ? event.date.startsWith(state.period.slice(5)) : seasonOf(event.date) === Number(state.period))
    return period && (!state.project || event.project === state.project) && (!state.city || event.city === state.city)
      && normalize(`${project.name} ${project.author} ${event.city} ${event.venue}`).includes(normalize(state.query.trim()))
  }).sort((a, b) => (state.period === "past" ? -1 : 1) * `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
}
const activeEntries = state => Object.entries(state).filter(([key, value]) => key === "period" ? value !== "upcoming" : Boolean(value))
const valueLabel = (key, value) => key === "query" ? `« ${value} »` : options(key).find(([v]) => v === value)?.[1] || value

function renderResults(id) {
  const card = root.querySelector(`[data-candidate="${id}"]`)
  const state = states.get(id), found = matching(state), active = activeEntries(state)
  card.querySelector("[data-result-count]").textContent = `${found.length} date${found.length === 1 ? "" : "s"}`
  card.querySelectorAll("[data-count]").forEach(el => { el.textContent = active.length ? `(${active.length})` : "" })
  card.querySelector(".results-caption [data-reset]").hidden = !active.length
  card.querySelector("[data-active-filters]").innerHTML = active.map(([key, value]) => `<button type="button" data-remove="${key}" aria-label="Retirer ${esc(valueLabel(key, value))}">${esc(valueLabel(key, value))}<span aria-hidden="true">×</span></button>`).join("")
  const selection = card.querySelector("[data-selection]")
  if (selection) selection.textContent = active.length ? active.map(([key, value]) => valueLabel(key, value)).join(" · ") : "Aucune restriction"
  let lastMonth = "", lastSeason = null
  card.querySelector("[data-results]").innerHTML = found.slice(0, limits.get(id)).map(event => {
    const project = getProject(event.project), past = event.date < today, season = seasonOf(event.date), month = event.date.slice(0, 7)
    let heading = ""
    if (season !== lastSeason) { heading += `<p class="season-marker">↓ Saison ${season}–${season + 1}</p>`; lastSeason = season }
    if (month !== lastMonth) {
      const label = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(new Date(`${event.date}T12:00:00`))
      heading += `<p class="month-marker${past ? " past-marker" : ""}">↓ ${label.charAt(0).toUpperCase() + label.slice(1)}</p>`; lastMonth = month
    }
    const date = event.date === today ? "Aujourd’hui" : new Intl.DateTimeFormat("fr-FR", { day:"2-digit", month:"2-digit" }).format(new Date(`${event.date}T12:00:00`))
    return `${heading}<div class="date-row${past ? " past-row" : ""}"><div class="date-scroll-wrap"><div class="date-line" tabindex="0" aria-label="${esc(`${event.city}, ${project.name}, ${project.author}`)}"><span>${esc(event.city)}</span><span class="date-thumb" data-patateur-mask="lab-${id}-${event.id}" data-patateur-preset="project"><img src="${asset(project.photo)}" alt="" loading="lazy" /></span><i>${esc(project.name)}</i><span>· ${esc(project.author)}</span></div></div><time datetime="${event.date}"${event.date === today ? ' class="today"' : ""}>${date} ${event.time}</time></div>`
  }).join("") || `<div class="empty-results"><p>Aucune date pour cette combinaison.</p><button type="button" data-reset>Repartir de toutes les dates à venir ↗</button></div>`
  if (found.length > limits.get(id)) card.querySelector("[data-results]").insertAdjacentHTML("beforeend", `<button type="button" class="show-more" data-more>Encore quelques dates ↓</button>`)
  card.querySelectorAll("[name]").forEach(input => { if (input.value !== state[input.name]) input.value = state[input.name] })
  card.querySelectorAll("[data-quick-key]").forEach(el => el.setAttribute("aria-pressed", String(state[el.dataset.quickKey] === el.dataset.quickValue)))
  syncPatateurs(root)
}

function update(id, patch) {
  states.set(id, { ...states.get(id), ...patch })
  limits.set(id, 7)
  renderResults(id)
}
root.querySelectorAll(".candidate").forEach(card => {
  const id = card.dataset.candidate
  card.addEventListener("submit", event => event.preventDefault())
  const onInput = event => { if (event.target.name) update(id, { [event.target.name]: event.target.value }) }
  card.addEventListener("input", onInput)
  card.addEventListener("click", event => {
    const target = event.target.closest("button")
    if (!target) return
    if (target.hasAttribute("data-reset")) { states.set(id, blank()); limits.set(id, 7); renderResults(id) }
    if (target.dataset.remove) update(id, { [target.dataset.remove]: blank()[target.dataset.remove] })
    if (target.dataset.quickKey) update(id, { [target.dataset.quickKey]: target.getAttribute("aria-pressed") === "true" ? blank()[target.dataset.quickKey] : target.dataset.quickValue })
    if (target.hasAttribute("data-more")) { limits.set(id, limits.get(id) + 7); renderResults(id) }
    if (target.hasAttribute("data-open-sheet")) openSheet()
  })
})

const sheet = root.querySelector(".filter-sheet")
let draft = blank()
function syncSheet() {
  sheet.querySelectorAll("[name]").forEach(input => { input.value = draft[input.name] })
  sheet.querySelector("[data-sheet-label]").textContent = `Afficher ${matching(draft).length} dates`
  syncPatateurs(root)
}
function openSheet() { draft = { ...states.get("C") }; syncSheet(); sheet.showModal() }
sheet.addEventListener("input", event => { if (event.target.name) { draft[event.target.name] = event.target.value; syncSheet() } })
sheet.addEventListener("click", event => {
  if (event.target.closest("[data-close-sheet]")) sheet.close()
  if (event.target.closest("[data-reset]")) { draft = blank(); syncSheet() }
  if (event.target.closest("[data-apply-sheet]")) { update("C", draft); sheet.close() }
  if (event.target === sheet) { const r = sheet.getBoundingClientRect(); if (event.clientY < r.top || event.clientX < r.left || event.clientX > r.right) sheet.close() }
})
root.querySelectorAll("details").forEach(el => el.addEventListener("toggle", () => syncPatateurs(root)))
candidates.forEach(c => renderResults(c.id))
if (import.meta.hot) import.meta.hot.dispose(destroyPatateurs)
