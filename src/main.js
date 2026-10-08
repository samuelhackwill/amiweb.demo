import { createClient } from "@supabase/supabase-js"
import projectDateData from "./data/project-first-dates.json"
import "./style.css"

const nameAssetFiles = import.meta.glob("./svg assets/name=*.svg", { query: "?raw", import: "default" })
const normalizeName = (value) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
const nameAssets = Object.entries(nameAssetFiles).flatMap(([path, load]) => {
  const match = path.match(/name=([^,]+), alignment=([^.]*)\.svg$/)
  return match ? [{ id: path, key: normalizeName(match[1]), alignment: match[2], load }] : []
})
const nameAssetSources = new Map(nameAssets.map(({ id, load }) => [id, load]))
const inlineNameAssets = new Map()
async function inlineNameAsset(loadSource) {
  if (!inlineNameAssets.has(loadSource))
    inlineNameAssets.set(
      loadSource,
      loadSource().then((source) => {
        const svgDocument = new DOMParser().parseFromString(source, "image/svg+xml")
        if (svgDocument.querySelector("parsererror")) throw new Error("Invalid name SVG markup")
        const svg = svgDocument.documentElement
        const viewBox = (svg.getAttribute("viewBox") || `0 0 ${svg.getAttribute("width")} ${svg.getAttribute("height")}`).trim().split(/[ ,]+/).map(Number)
        if (viewBox.length === 4 && viewBox.every(Number.isFinite)) {
          const container = document.createElement("div")
          const measureSvg = document.importNode(svg, true)
          Object.assign(container.style, { position: "fixed", left: "-100000px", top: "0", opacity: "0", pointerEvents: "none" })
          container.append(measureSvg)
          document.body.append(container)
          try {
            const bounds = measureSvg.getBBox()
            const padding = 4
            const left = Math.max(viewBox[0], bounds.x - padding)
            const top = Math.max(viewBox[1], bounds.y - padding)
            const right = Math.min(viewBox[0] + viewBox[2], bounds.x + bounds.width + padding)
            const bottom = Math.min(viewBox[1] + viewBox[3], bounds.y + bounds.height + padding)
            if (right > left && bottom > top) svg.setAttribute("viewBox", `${left} ${top} ${right - left} ${bottom - top}`)
          } catch (error) {
            console.warn("Could not trim name SVG whitespace:", error)
          } finally {
            container.remove()
          }
        }
        svg.setAttribute("preserveAspectRatio", "xMinYMid meet")
        svg.setAttribute("aria-hidden", "true")
        return new XMLSerializer().serializeToString(svg)
      }),
    )
  return inlineNameAssets.get(loadSource)
}
function nameAssetFor(name) {
  const normalizedName = normalizeName(name)
  const matchingAssets = nameAssets.filter(({ key }) => normalizedName === key || normalizedName.startsWith(key))
  return matchingAssets.find(({ alignment }) => alignment === "oneLiner") || matchingAssets.find(({ alignment }) => alignment === "left-1") || null
}
function bindNameAssetInlining() {
  document.querySelectorAll(".identity .name-art[data-name-asset]").forEach((art) => {
    if (art.dataset.inlineRequested) return
    art.dataset.inlineRequested = "true"
    inlineNameAsset(nameAssetSources.get(art.dataset.nameAsset))
      .then((svg) => {
        if (art.isConnected) art.innerHTML = svg
      })
      .catch((error) => {
        console.error("Name SVG processing failed:", error)
        if (art.isConnected) {
          art.hidden = true
          if (art.nextElementSibling) art.nextElementSibling.hidden = false
        }
      })
  })
}

const STORAGE_KEY = "amicale-bio-backoffice-v1"
const assetUrl = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, "")}`
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://fogzomkaokyyhvjanuhh.supabase.co"
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = SUPABASE_ANON_KEY ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null
const FRISE_START_YEAR = 2010
const creationTooltip = document.createElement("div")
creationTooltip.className = "creation-tooltip"
creationTooltip.id = "creation-tooltip"
creationTooltip.setAttribute("role", "tooltip")
creationTooltip.hidden = true
document.body.append(creationTooltip)
document.addEventListener(
  "scroll",
  () => {
    creationTooltip.hidden = true
  },
  true,
)
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") creationTooltip.hidden = true
})
window.addEventListener("resize", () => {
  creationTooltip.hidden = true
})
const friseRoles = [
  { id: "artiste", label: "Artiste associé", color: "#6d82ff", tier: 1 },
  { id: "production", label: "Production", color: "#ff1717", tier: 1 },
  { id: "administration", label: "Administration", color: "#ffe600", tier: 1 },
  { id: "direction", label: "Direction", color: "#971fa8", tier: 2 },
  { id: "regie", label: "Régie", color: "#55ef45", tier: 2 },
  { id: "collaborateur", label: "Collaborateur régulier", color: "#ff7eb6", tier: 2 },
]
const projectCatalog = [
  { id: "tryhard", image: assetUrl("/assets/teye3.png"), title: assetUrl("/assets/project-title-tryhard.svg"), caption: "dates à venir à <strong>Grenoble</strong><br />et <strong>Saint-Médard en<br />Jalles.</strong>" },
  { id: "cyber-cafe", image: assetUrl("/assets/teye4.png"), title: assetUrl("/assets/project-title-cyber.svg"), caption: "" },
  { id: "tiret-du-six", image: assetUrl("/assets/teye2.png"), title: assetUrl("/assets/project-title-tiret.svg"), caption: "" },
]
const projectOptions = [
  ["sauvez-vos-projets", "Sauvez vos projets"],
  ["tryhard", "Tryhard"],
  ["lenfance-majeure", "L'Enfance majeure"],
  ["toute-la-musique-que-jaime", "Toute la musique que j'aime"],
  ["la-methode-feedback", "La méthode feedback"],
  ["cyber-cafe", "Cybercafé"],
  ["vitesse-80", "VITESSE 80"],
  ["fort-reconfort", "FORT RÉCONFORT"],
  ["big-data-yoyo", "Big Data Yoyo"],
  ["de-la-sexualite-des-orchidees", "DE LA SEXUALITÉ DES ORCHIDÉES"],
  ["tiret-du-six", "Le tiret du six"],
  ["elles-vivent", "Elles Vivent"],
  ["amies-il-faut-faire-une-pause", "AMI·E·S, IL FAUT FAIRE UNE PAUSE"],
  ["ce-jardin", "CE JARDIN"],
  ["ma-presence-suffit-a-enchanter-le-monde", "MA PRÉSENCE SUFFIT À ENCHANTER LE MONDE"],
  ["installation-spectacle", "({:})"],
  ["un-faible-degre-originalite", "Un faible degré d'originalité"],
  ["les-thermes", "Les Thermes"],
  ["on-va-batir-une-ile", "On va bâtir une île et élever des palmiers"],
  ["on-traversera-le-pont", "ON TRAVERSERA LE PONT..."],
  ["le-jeu-de-loie-du-spectacle-vivant", "Le jeu de l'oie du spectacle vivant"],
  ["corps-diplomatique", "Corps diplomatique"],
  ["metrage-variable", "Métrage Variable"],
  ["germinal", "GERMINAL"],
  ["collectif-jambe", "COLLECTIF JAMBE"],
  ["la-chasse", "LA CHASSE"],
  ["france-distraction", "France Distraction"],
  ["bonjour-concert", "Bonjour Concert"],
  ["indigence-elegance", "INDIGENCE = ÉLÉGANCE"],
  ["et", "&"],
  ["quadruple-et", "&&&&& & &&&"],
  ["cheval", "Cheval"],
].map(([id, name]) => ({ id, name }))
const seedPeople = {
  samuel_hackwill: {
    slug: "samuel_hackwill",
    name: "Samuel Hackwill",
    nameAsset: assetUrl("/assets/title.svg"),
    photo: assetUrl("/assets/portrait.png"),
    bio: `Samuel Hackwill est auteur et artiste associé à l’Amicale de production. Sa recherche est axée sur l’interaction directe avec le public dans le champ de la performance. Ses modes expressifs sont le code, la littérature et le jeu vidéo expérimental.

Après avoir étudié le design numérique aux beaux-arts de Saint-Étienne (son mémoire porte sur les installations interactives monumentales de Norman Bel Geddes aux USA dans les années 1920) et conçu une première performance numérique ([Les forêts peuvent muter](https://www.arte.tv/fr/videos/074719-025-A/samuel-hackwill/), prix révélation design ADAGP 2017) il rencontre Antoine Defoort en 2016 et rejoint l’Amicale à Lille. Il y crée deux performances interactives : [Le tiret du six](http://www.teaser.tiretdusix.art/), un jeu de lecture pour 30 ordinateurs (2021), et Tryhard (créé en 2025, lauréat prix SVSN 2024), un jeu de foule basé sur les CAPTCHAs, que le public résout à l’aide de 56 souris connectées au même écran.

Samuel Hackwill écrit une newsletter soi-disant biannuelle à [cette adresse](https://shh.ovh/). Il a également publié une bande dessinée sur l’action culturelle que vous pouvez [lire ici](https://bdval.shh.ovh/). Il collabore sur les autres projets de l’Amicale en qualité de dramaturge ou de technicien, ainsi qu’avec [le Club travail](https://www.instagram.com/club.travail/), avec [Joaquim Fossi & Suzanne Debaecque](https://www.instagram.com/club.tendre/), et avec [Stéphanie Aflalo](https://www.instagram.com/stephanie.aflalo/).`,
    faq: [
      ["A quoi ressemblent les pièces de Samuel?", "Des performances qui mêlent code, littérature, jeu vidéo expérimental et interaction directe avec le public."],
      ["Est-ce que Samuel a travaillé sur d’autres projets à l’Amicale ou ailleurs?", "Oui — il collabore aussi avec plusieurs artistes et projets de l’Amicale, comme dramaturge ou technicien."],
      ["Avec qui Samuel travaille-t-il?", "Avec des artistes, des auteur·ices, des technicien·nes et des publics curieux."],
      ["Est-ce que Samuel est un nerd?", "Disons qu’il sait faire dialoguer 56 souris avec un même écran."],
    ],
    contact: [
      ["Bob McProd", "mailto:bob@example.com"],
      ["Bob McDiff", "mailto:bob@example.com"],
    ],
    links: [
      ["site personnel", "https://shh.ovh/"],
      ["instagram", "https://www.instagram.com/"],
    ],
    projects: ["tryhard", "cyber-cafe", "tiret-du-six"],
    timeline: {
      periods: [
        { id: "samuel-artiste", role: "artiste", start: 2016.4, end: null },
        { id: "samuel-direction", role: "direction", start: 2025.6, end: null },
      ],
    },
  },
  mathilde_maillard: {
    slug: "mathilde_maillard",
    name: "Mathilde Maillard",
    nameAsset: assetUrl("/assets/names/mathilde_maillard.svg"),
    photo: assetUrl("/assets/portrait.png"),
    bio: `Mathilde Maillard est artiste associée à l’Amicale de production. Son travail se développe entre production, accompagnement et création.

Cette page est un exemple de profil éditable. Remplacez ce texte depuis le panneau d’édition pour tester [les liens](https://exemple.com), l’*italique* et le **gras**.`,
    faq: [
      ["Quel est le rôle de Mathilde?", "Cette réponse peut être modifiée depuis le backoffice."],
      ["Sur quels projets travaille-t-elle?", "Une sélection de projets apparaît au bas de la page."],
    ],
    contact: [["Camille Bono", "mailto:contact@example.com"]],
    links: [
      ["site personnel", "#"],
      ["instagram", "#"],
    ],
    projects: ["cyber-cafe", "tryhard"],
    timeline: {
      periods: [
        { id: "mathilde-production", role: "production", start: 2012.5, end: 2016.9 },
        { id: "mathilde-artiste", role: "artiste", start: 2016.9, end: 2019.9 },
      ],
    },
  },
}

const clone = (value) => JSON.parse(JSON.stringify(value))
const readStorage = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")
  } catch {
    return {}
  }
}
const stored = readStorage()
const queryParams = new URLSearchParams(window.location.search)
const querySlug = queryParams.get("person") || "samuel_hackwill"
const editToken = queryParams.get("edit") || ""
function displayNameFromSlug(slug) {
  return decodeURIComponent(slug)
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}
function newProfile(slug) {
  const name = displayNameFromSlug(slug)
  return {
    slug,
    name,
    nameAsset: "",
    photo: "",
    photoFilename: "",
    bio: "Cette page est un exemple de profil éditable. Remplacez ce texte depuis le panneau d’édition pour tester [les liens](https://exemple.com), *l’italique* et le **gras**.",
    faq: [
      [`À quoi ressemblent les pièces de ${name}?`, "blablabla réponse à la question."],
      [`Est-ce que ${name} a travaillé avec d’autres personnes à l’Amicale ou ailleurs?`, "blablabla réponse à la question."],
    ],
    contact: [["Bob Mc Prod", "mailto:contact@example.com"]],
    links: [["Lien vers une page web", "https://exemple.com"]],
    projects: [],
    timeline: { periods: [] },
  }
}
function normalizeTimeline(timeline, fallback = { periods: [] }) {
  const source = timeline || fallback
  return {
    periods: Array.isArray(source.periods)
      ? source.periods.map((period, index) => ({
          id: period.id || `period-${index}-${Math.random().toString(36).slice(2, 7)}`,
          role: friseRoles.some((role) => role.id === period.role) ? period.role : "artiste",
          start: Number.isFinite(Number(period.start)) ? Number(period.start) : new Date().getFullYear(),
          end: period.end === null || period.end === "" || period.end === undefined ? null : Number.isFinite(Number(period.end)) ? Number(period.end) : null,
        }))
      : [],
  }
}
function normalizeProfile(profile, slug) {
  const photo = profile.photo?.startsWith("/assets/") ? assetUrl(profile.photo) : profile.photo
  return { ...profile, slug, photo, photoFilename: profile.photoFilename || "", contact: profile.contact || profile.production || [], timeline: normalizeTimeline(profile.timeline, seedPeople[slug]?.timeline) }
}
let person = normalizeProfile(stored[querySlug] || clone(seedPeople[querySlug] || (querySlug === "samuel_hackwill" ? seedPeople.samuel_hackwill : newProfile(querySlug))), querySlug)
let editorOpen = false
let editAuthorized = false
let editAccessMessage = ""
let saveTimer
let saveStatusText = supabase ? "Prêt à synchroniser avec Supabase" : "Stockage local actif · Supabase non configuré"
let photoFilenameText = person.photoFilename || (person.photo ? "Photo existante" : "Aucun fichier sélectionné")
let photoStatusText = person.photo ? "Photo actuelle" : "Aucune photo sélectionnée"
let photoStatusLoading = false
let photoSyncPending = false

function setSaveStatus(message, state = "") {
  saveStatusText = message
  const status = document.querySelector("[data-save-status]")
  if (status) {
    status.textContent = message
    status.dataset.state = state
  }
}
function setPhotoStatus(message, loading = false) {
  photoStatusText = message
  photoStatusLoading = loading
  const status = document.querySelector("[data-photo-status]")
  if (status) {
    status.textContent = message
    status.dataset.loading = String(loading)
  }
}

function saveStorage() {
  const all = readStorage()
  all[person.slug] = person
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
}
async function persistProfile() {
  let localSaved = true
  try {
    saveStorage()
  } catch (error) {
    localSaved = false
    console.error("Local save failed:", error)
  }
  if (!supabase) return { localSaved, supabaseSaved: false, error: null }
  try {
    if (!editAuthorized || !editToken) throw new Error("Lien d’édition invalide ou absent.")
    const { error } = await supabase.rpc("bio_save_profile_with_edit_token", {
      p_slug: person.slug,
      p_token: editToken,
      p_data: person,
    })
    if (error) console.error("Supabase save failed:", error)
    return { localSaved, supabaseSaved: !error, error }
  } catch (error) {
    console.error("Supabase save failed:", error)
    return { localSaved, supabaseSaved: false, error }
  }
}
function queueSave() {
  let localSaved = true
  try {
    saveStorage()
  } catch (error) {
    localSaved = false
    console.error("Local save failed:", error)
  }
  refreshVisibleContent()
  if (localSaved) setSaveStatus(supabase ? "Enregistré localement · synchro Supabase en attente…" : "Enregistré localement · Supabase non configuré")
  else setSaveStatus("Échec de l’enregistrement local", "error")
  if (photoSyncPending) setPhotoStatus(supabase ? "En attente de transfert vers Supabase…" : "Enregistrée localement · Supabase non configuré", Boolean(supabase))
  clearTimeout(saveTimer)
  saveTimer = setTimeout(async () => {
    if (supabase) setSaveStatus("Synchronisation avec Supabase…")
    const result = await persistProfile()
    if (result.supabaseSaved && result.localSaved) setSaveStatus("Enregistré localement et sur Supabase")
    else if (result.supabaseSaved) setSaveStatus("Enregistré sur Supabase · échec local", "error")
    else if (result.localSaved) setSaveStatus(supabase ? "Enregistré localement · échec Supabase" : "Enregistré localement · Supabase non configuré", supabase ? "error" : "")
    else setSaveStatus("Échec de l’enregistrement local et Supabase", "error")
    if (photoSyncPending) {
      if (result.supabaseSaved && result.localSaved) setPhotoStatus("Enregistrée localement et sur Supabase")
      else if (result.supabaseSaved) setPhotoStatus("Enregistrée sur Supabase · échec local")
      else if (result.localSaved) setPhotoStatus(supabase ? "Enregistrée localement · échec Supabase" : "Enregistrée localement · Supabase non configuré", supabase)
      else setPhotoStatus("Échec de l’enregistrement", false)
      photoSyncPending = false
    }
  }, 500)
}
async function hydrateFromSupabase() {
  if (!supabase) return
  const { data, error } = await supabase.from("bio_profiles").select("data").eq("slug", querySlug).maybeSingle()
  if (error) {
    console.error("Supabase load failed:", error)
    return
  }
  if (data?.data) {
    person = normalizeProfile(data.data, querySlug)
    photoFilenameText = person.photoFilename || (person.photo ? "Photo existante" : "Aucun fichier sélectionné")
    photoStatusText = person.photo ? "Photo chargée depuis Supabase" : "Aucune photo sélectionnée"
  }
}
async function verifyEditAccess() {
  if (!editToken) return
  if (!supabase) {
    editAccessMessage = "Impossible de vérifier le lien d’édition : Supabase n’est pas configuré."
    return
  }
  const { data, error } = await supabase.rpc("bio_check_edit_token", {
    p_slug: querySlug,
    p_token: editToken,
  })
  if (error) {
    console.error("Edit link validation failed:", error)
    editAccessMessage = "Impossible de vérifier le lien d’édition."
    return
  }
  editAuthorized = data === true
  if (!editAuthorized) editAccessMessage = "Ce lien d’édition est invalide ou a été révoqué."
}
function escapeHtml(value = "") {
  return value.replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char])
}
function renderMarkdown(markdown = "") {
  return markdown
    .split(/\n\s*\n/)
    .map((paragraph) => {
      let html = escapeHtml(paragraph).replace(/\n/g, "<br />")
      html = html.replace(/\[([^\]]+)\]\(([^\s)]+)\)/g, '<a class="link body-link" href="$2">$1</a>')
      html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/\*([^*]+)\*/g, "<em>$1</em>")
      return `<p>${html}</p>`
    })
    .join("")
}
async function preparePhoto(file) {
  const image = await createImageBitmap(file)
  const maxDimension = 800
  const scale = Math.min(1, maxDimension / image.width, maxDimension / image.height)
  let width = Math.max(1, Math.round(image.width * scale))
  let height = Math.max(1, Math.round(image.height * scale))
  const canvas = document.createElement("canvas")
  const context = canvas.getContext("2d")
  if (!context) {
    image.close()
    throw new Error("Impossible de préparer cette image.")
  }
  let blob
  try {
    while (true) {
      canvas.width = width
      canvas.height = height
      context.fillStyle = "#fff"
      context.fillRect(0, 0, width, height)
      context.drawImage(image, 0, 0, width, height)
      for (let quality = 0.88; quality >= 0.48; quality -= 0.1) {
        blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality))
        if (blob && blob.size <= 2 * 1024 * 1024) return { blob, width, height }
      }
      if (width <= 320 && height <= 320) break
      const shrink = Math.min(0.85, 320 / Math.max(width, height))
      width = Math.max(1, Math.round(width * shrink))
      height = Math.max(1, Math.round(height * shrink))
    }
  } finally {
    image.close()
  }
  throw new Error("Cette image ne peut pas être réduite sous 2 Mo.")
}
function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error("Impossible de lire l’image préparée."))
    reader.readAsDataURL(blob)
  })
}
function link(label, href = "#", extra = "") {
  return `<a class="link ${extra}" href="${href}" ${href.startsWith("#") ? "" : 'target="_blank" rel="noreferrer"'}>${label}</a>`
}
function projectMarkup() {
  return person.projects
    .map((id) => projectCatalog.find((project) => project.id === id))
    .filter((project) => project?.image && project?.title)
    .map(
      (project) =>
        `<article class="project"><div class="project-media"><div class="project-mask"><img src="${project.image}" alt="" /></div></div><div class="project-copy"><img class="project-title" src="${project.title}" alt="" />${project.caption ? `<p>${project.caption}</p>` : ""}</div></article>`,
    )
    .join("")
}
function imageMarkup() {
  const asset = nameAssetFor(person.name)
  return `${asset ? `<span class="name-art" data-name-asset="${escapeHtml(asset.id)}" role="img" aria-label="${escapeHtml(person.name)}"></span>` : ""}<span class="name-fallback"${asset ? " hidden" : ""}>${escapeHtml(person.name)}</span>`
}
function portraitMarkup() {
  return `<div class="portrait-wrap"><div class="portrait-mask${person.photo ? "" : " empty"}">${person.photo ? `<img src="${person.photo}" alt="Portrait de ${escapeHtml(person.name)}" />` : ""}</div></div>`
}
function currentYear() {
  return new Date().getFullYear()
}
function yearsLabel(year) {
  return Number.isInteger(year) ? String(year) : String(Number(year.toFixed(2)))
}
function friseEditorMarkup() {
  const timeline = person.timeline
  return `<div class="editor-repeat frise-editor"><div class="editor-row-title"><strong>Frise — parcours à l’Amicale</strong><span>${currentYear()}</span></div>
    <small>Les projets sélectionnés affichent leur première date connue. L’année actuelle se met à jour automatiquement.</small>
    <div class="frise-period-list">${timeline.periods
      .map(
        (period, index) => `<div class="frise-period" data-frise-period="${index}">
      <label>Rôle<select data-frise-field="role">${friseRoles.map((role) => `<option value="${role.id}" ${period.role === role.id ? "selected" : ""}>${escapeHtml(role.label)}</option>`).join("")}</select></label>
      <label>Début<input type="number" min="1990" max="2100" step="0.25" data-frise-field="start" value="${escapeHtml(yearsLabel(period.start))}" /></label>
      <label>Fin<input type="number" min="1990" max="2100" step="0.25" data-frise-field="end" value="${period.end === null ? "" : escapeHtml(yearsLabel(period.end))}" placeholder="auj." /></label>
      <button type="button" class="frise-remove" data-frise-remove="${index}" aria-label="Supprimer cette période">Supprimer</button>
    </div>`,
      )
      .join("")}</div>
    <button type="button" class="frise-add" data-frise-add>Ajouter une période</button>
  </div>`
}
const CREATION_STAR_OUTER_RADIUS = 13
const CREATION_STAR_MIN_GAP = CREATION_STAR_OUTER_RADIUS * 2 * 0.7

function starPath(cx, cy, outer = CREATION_STAR_OUTER_RADIUS, inner = 5.5, points = 6) {
  return (
    Array.from({ length: points * 2 }, (_, index) => {
      const angle = -Math.PI / 2 + (index * Math.PI) / points
      const radius = index % 2 ? inner : outer
      return `${index ? "L" : "M"} ${(cx + Math.cos(angle) * radius).toFixed(2)} ${(cy + Math.sin(angle) * radius).toFixed(2)}`
    }).join(" ") + " Z"
  )
}
function spaceCreationMarkers(creations, x) {
  const clusters = []
  const packedBounds = (cluster) => {
    const center = cluster.reduce((sum, creation) => sum + creation.x, 0) / cluster.length
    const halfSpan = ((cluster.length - 1) * CREATION_STAR_MIN_GAP) / 2
    return { center, left: center - halfSpan, right: center + halfSpan }
  }

  creations
    .map((creation) => ({ ...creation, x: x(creation.yearPosition) }))
    .sort((a, b) => a.x - b.x)
    .forEach((creation) => {
      clusters.push([creation])
      while (clusters.length > 1) {
        const leftIndex = clusters.length - 2
        const left = clusters[leftIndex]
        const right = clusters[leftIndex + 1]
        if (packedBounds(right).left - packedBounds(left).right >= CREATION_STAR_MIN_GAP) break
        clusters.splice(leftIndex, 2, [...left, ...right])
      }
    })

  const positions = new Map()
  clusters.forEach((cluster) => {
    const { center } = packedBounds(cluster)
    cluster.forEach((creation, index) => {
      positions.set(creation.id, center + (index - (cluster.length - 1) / 2) * CREATION_STAR_MIN_GAP)
    })
  })
  return positions
}
function rockPath(x1, x2, y, seed) {
  const length = x2 - x1
  const hash = [...seed].reduce((sum, char) => sum + char.charCodeAt(0), 0)
  const bendA = ((hash % 11) - 5) * 0.55
  const bendB = (((hash * 7) % 11) - 5) * 0.55
  if (length < 70) return `M ${x1} ${y} C ${x1 + length * 0.38} ${y + bendA} ${x1 + length * 0.62} ${y + bendB} ${x2} ${y}`
  const mid = x1 + length * 0.49
  return `M ${x1} ${y} C ${x1 + length * 0.24} ${y + bendA} ${mid - length * 0.16} ${y - bendB} ${mid} ${y + bendB * 0.55} C ${mid + length * 0.16} ${y + bendA} ${x2 - length * 0.24} ${y - bendB} ${x2} ${y}`
}
function friseMarkup() {
  const timeline = person.timeline
  const now = currentYear()
  const creations = projectDateData.projects
    .filter((project) => project.firstDate)
    .map((project) => {
      const date = new Date(`${project.firstDate}T00:00:00Z`)
      const year = date.getUTCFullYear()
      const yearStart = Date.UTC(year, 0, 1)
      const nextYear = Date.UTC(year + 1, 0, 1)
      return { ...project, yearPosition: year + (date.getTime() - yearStart) / (nextYear - yearStart) }
    })
  const creationYears = creations.map((project) => project.yearPosition)
  const startYear = Math.min(FRISE_START_YEAR, ...creationYears.map(Math.floor))
  const endYear = Math.ceil(Math.max(now, startYear + 3, ...timeline.periods.map((period) => period.end ?? now), ...creationYears))
  const marginLeft = 18
  const layoutViewportWidth = window.innerWidth / 1.3
  const width = Math.max(280, Math.min(938, layoutViewportWidth - (layoutViewportWidth <= 800 ? 40 : 62)))
  const marginRight = 20
  const scale = (width - marginLeft - marginRight) / (endYear - startYear)
  const height = 126
  const y = 79
  const x = (year) => marginLeft + (year - startYear) * scale
  const creationPositions = spaceCreationMarkers(creations, x)
  const ticks = []
  for (let year = Math.ceil(startYear / 5) * 5; year <= endYear; year += 5) ticks.push(year)
  if (!ticks.includes(now)) ticks.push(now)
  ticks.sort((a, b) => a - b)
  const grid = ticks
    .map(
      (year) =>
        `<g class="frise-tick ${year === now ? "is-current" : ""}"><line x1="${x(year)}" y1="31" x2="${x(year)}" y2="111" /><text x="${x(year)}" y="23" text-anchor="${year === now ? "end" : "middle"}">${year === now ? "auj." : year}</text></g>`,
    )
    .join("")
  const validPeriods = timeline.periods
    .map((period) => ({ ...period, start: Math.max(startYear, Math.min(endYear, period.start)), end: Math.max(startYear, Math.min(endYear, period.end ?? now)) }))
    .filter((period) => period.end > period.start)
  const boundaries = [...new Set(validPeriods.flatMap((period) => [period.start, period.end]))].sort((a, b) => a - b)
  const path = boundaries.length > 1 ? rockPath(x(boundaries[0]), x(boundaries.at(-1)), y, person.slug) : ""
  const periodPaths = boundaries
    .slice(0, -1)
    .map((from, segment) => {
      const to = boundaries[segment + 1]
      const active = validPeriods.filter((period) => period.start < to && period.end > from).sort((a, b) => (friseRoles.find((role) => role.id === a.role)?.tier ?? 1) - (friseRoles.find((role) => role.id === b.role)?.tier ?? 1))
      return active
        .map(
          (period, index) =>
            `<path d="${path}" fill="none" stroke="${friseRoles.find((role) => role.id === period.role)?.color ?? friseRoles[0].color}" stroke-width="${Math.max(2, 20 - index * 7)}" stroke-linecap="round" clip-path="url(#frise-clip-${segment})" />`,
        )
        .join("")
    })
    .join("")
  const clips = boundaries
    .slice(0, -1)
    .map((from, segment) => `<clipPath id="frise-clip-${segment}"><rect x="${x(from)}" y="${y - 17}" width="${Math.max(1, x(boundaries[segment + 1]) - x(from))}" height="34" /></clipPath>`)
    .join("")
  const stars = creations
    .map((project) => {
      const name = projectOptions.find((option) => option.id === project.id)?.name ?? project.name
      return `<path class="creation-marker" data-project-name="${escapeHtml(name)}" data-project-date="${project.firstDate}" d="${starPath(creationPositions.get(project.id), y)}" fill="#7890ff" stroke="#111" stroke-width="3.5" stroke-linejoin="round" tabindex="0" role="img" aria-label="${escapeHtml(name)}, première date ${project.firstDate}" aria-describedby="creation-tooltip" />`
    })
    .join("")
  const legend = friseRoles.map((role) => `<span class="frise-legend-item"><i style="--role-color:${role.color}"></i>${escapeHtml(role.label)}</span>`).join("")
  return `<section class="bio-frise" aria-label="Frise du parcours de ${escapeHtml(person.name)}"><div class="bio-frise-heading"><h2>Parcours à l’Amicale</h2><span>${escapeHtml(person.name)}</span></div><div class="bio-frise-scroll"><svg class="bio-frise-svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Frise du parcours de ${escapeHtml(person.name)} de ${startYear} à ${now}"><defs>${clips}</defs>${grid}${periodPaths}${stars}</svg></div><div class="bio-frise-legend">${legend}<span class="frise-legend-item"><i class="frise-star">★</i>Création</span></div></section>`
}
function faqMarkup() {
  return person.faq.map(([question, answer]) => `<details><summary>↓ ${escapeHtml(question)}</summary><div class="faq-answer">${renderMarkdown(answer)}</div></details>`).join("")
}
function contactMarkup() {
  return person.contact.map(([label, href]) => link(`✉ ${escapeHtml(label)}`, href)).join("")
}
function linksMarkup() {
  return person.links.map(([label, href]) => link(`↗ ${escapeHtml(label)}`, href)).join("")
}
function refreshVisibleContent() {
  const bio = document.querySelector(".bio")
  if (bio) bio.innerHTML = renderMarkdown(person.bio)
  const muted = document.querySelector(".muted")
  if (muted) muted.textContent = `→ ${person.name}`
  const identityName = document.querySelector(".identity .name-art, .identity .name-fallback")
  if (identityName) identityName.outerHTML = imageMarkup()
  bindNameAssetInlining()
  const faqList = document.querySelector(".faq-list")
  if (faqList) faqList.innerHTML = faqMarkup()
  const sideSections = document.querySelectorAll(".sidebar .side-section.contact")
  if (sideSections[0]) sideSections[0].innerHTML = `<div class="section-title wide"><img src="${assetUrl("/assets/production.svg")}" alt="" /><span>contact :</span></div>${contactMarkup()}`
  if (sideSections[1]) sideSections[1].innerHTML = `<div class="section-title"><img src="${assetUrl("/assets/links.svg")}" alt="" /><span>liens :</span></div>${linksMarkup()}`
  const projects = document.querySelector(".projects")
  if (projects) projects.innerHTML = projectMarkup()
  const frise = document.querySelector(".bio-frise")
  if (frise) {
    frise.outerHTML = friseMarkup()
    bindCreationTooltips()
  }
  document.querySelectorAll(".link").forEach((anchor) => anchor.addEventListener("click", (event) => event.preventDefault()))
}

function bindCreationTooltips() {
  document.querySelectorAll(".creation-marker").forEach((marker) => {
    const showTooltip = () => {
      const name = marker.dataset.projectName
      const title = document.createElement("strong")
      title.textContent = name
      const date = document.createElement("span")
      const formattedDate = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${marker.dataset.projectDate}T00:00:00Z`))
      date.textContent = `Première date : ${formattedDate}`
      creationTooltip.replaceChildren(title, date)
      creationTooltip.hidden = false
      const bounds = marker.getBoundingClientRect()
      const tooltipBounds = creationTooltip.getBoundingClientRect()
      creationTooltip.style.left = `${Math.max(8, Math.min(window.innerWidth - tooltipBounds.width - 8, bounds.x + bounds.width / 2 - tooltipBounds.width / 2))}px`
      const preferredTop = bounds.top - tooltipBounds.height - 10
      const top = preferredTop >= 8 ? preferredTop : bounds.bottom + 10
      creationTooltip.style.top = `${Math.max(8, Math.min(window.innerHeight - tooltipBounds.height - 8, top))}px`
    }
    marker.addEventListener("pointerenter", showTooltip)
    marker.addEventListener("focus", showTooltip)
    marker.addEventListener("pointerleave", () => {
      creationTooltip.hidden = true
    })
    marker.addEventListener("blur", () => {
      creationTooltip.hidden = true
    })
  })
}

function editorMarkup() {
  return `<div class="editor-head"><div><span class="editor-kicker">Demo backoffice</span><h2>${escapeHtml(person.name)}</h2></div><button class="editor-close" type="button" aria-label="Fermer">×</button></div>
    <label>Nom<input data-field="name" value="${escapeHtml(person.name)}" /></label>
    <label>Photo<input data-field="photoFile" type="file" accept="image/*" /><span class="photo-upload-filename" data-photo-filename>${escapeHtml(photoFilenameText)}</span><span class="photo-upload-status" data-photo-status data-loading="${photoStatusLoading}" role="status" aria-live="polite">${escapeHtml(photoStatusText)}</span></label>
    <div class="bio-editor-field"><label for="bio-editor">Bio</label><small>Mise en forme du texte = *italique*, **gras**, [lien hypertexte](https://exemple.com).</small><button class="insert-link" type="button" data-action="insert-link">Ajouter un lien</button><textarea id="bio-editor" data-field="bio" rows="13">${escapeHtml(person.bio)}</textarea></div>
    <div class="editor-repeat"><div class="editor-row-title"><strong>FAQ</strong><button type="button" data-add="faq">Ajouter une question/réponse</button></div>${person.faq.map(([question, answer], index) => `<div class="repeat-card"><input data-list="faq" data-index="${index}" data-part="0" value="${escapeHtml(question)}" /><textarea data-list="faq" data-index="${index}" data-part="1" rows="3">${escapeHtml(answer)}</textarea><button type="button" data-remove="faq" data-index="${index}">Supprimer</button></div>`).join("")}</div>
    <div class="editor-repeat"><div class="editor-row-title"><strong>Contact</strong><button type="button" data-add="contact">Ajouter un contact</button></div>${person.contact.map(([label, href], index) => `<div class="repeat-card two"><input data-list="contact" data-index="${index}" data-part="0" value="${escapeHtml(label)}" /><input data-list="contact" data-index="${index}" data-part="1" value="${escapeHtml(href)}" /><button type="button" data-remove="contact" data-index="${index}">Supprimer</button></div>`).join("")}</div>
    <div class="editor-repeat"><div class="editor-row-title"><strong>Liens</strong><button type="button" data-add="links">Ajouter un lien</button></div>${person.links.map(([label, href], index) => `<div class="repeat-card two"><input data-list="links" data-index="${index}" data-part="0" value="${escapeHtml(label)}" /><input data-list="links" data-index="${index}" data-part="1" value="${escapeHtml(href)}" /><button type="button" data-remove="links" data-index="${index}">Supprimer</button></div>`).join("")}</div>
    <div class="editor-repeat"><div class="editor-row-title"><strong>Projets</strong></div>${projectOptions.map((project) => `<label class="check-row"><input type="checkbox" data-project="${project.id}" ${person.projects.includes(project.id) ? "checked" : ""} /> <span>${escapeHtml(project.name)}</span></label>`).join("")}</div>
    ${friseEditorMarkup()}
    <div class="editor-actions danger"><span class="save-status" data-save-status>${escapeHtml(saveStatusText)}</span><button type="button" data-action="reset">Réinitialiser ce profil</button></div>`
}

function pageMarkup() {
  return `<div class="page"><header class="topbar">${link("Projets", "#projects")}${link("Calendrier", "#calendar")}<span>${link("L’Amicale", "#amicale")} <span class="muted">→ ${escapeHtml(person.name)}</span></span>${link("Blog", "#blog")}<span class="theme-button" aria-hidden="true"><img src="${assetUrl("/assets/theme.svg")}" alt="" /></span></header>
    <div class="body-content"><section class="intro" id="amicale"><div class="identity"><div class="logo-stack"><img class="logo-base" src="${assetUrl("/assets/logo-mark.svg")}" alt="" /><img class="logo-art" src="${assetUrl("/assets/logo.png")}" alt="L’Amicale" /></div>${imageMarkup()}</div><div class="bio">${renderMarkdown(person.bio)}</div></section>
    <aside class="sidebar">${portraitMarkup()}<section class="side-section faq-section"><div class="section-title"><img src="${assetUrl("/assets/faq.svg")}" alt="" /><span>FAQ :</span></div><div class="faq-list">${faqMarkup()}</div></section><section class="side-section contact"><div class="section-title wide"><img src="${assetUrl("/assets/production.svg")}" alt="" /><span>contact :</span></div>${contactMarkup()}</section><section class="side-section contact links-section"><div class="section-title"><img src="${assetUrl("/assets/links.svg")}" alt="" /><span>liens :</span></div>${linksMarkup()}</section></aside>
    ${friseMarkup()}</div>
    <section class="projects" id="projects">${projectMarkup()}</section>
    <footer class="footer" id="footer"><div class="footer-newsletter"><div class="socials"><span>◎</span><span>●</span><span>▣</span></div><p>Au fait on a une newsletter semestrielle à laquelle vous pouvez vous inscrire ici (+5000 abonné·e·s) ↘</p><div class="fake-field">Adresse mail</div><div class="fake-input">jeanbob@gmail.com</div><div class="fake-field">Région / Pays</div><div class="fake-input">Hauts-de-France <span>⌄</span></div><div class="submit-button">Allez c’est parti</div></div><div class="footer-column"><strong>Navigation</strong>${["Accueil", "L’Amicale", "Calendrier", "Blog"].map((label) => link(label)).join("")}<br /><strong>Associés</strong>${["Julien Fournet", "Joaquim Fossi", "Samuel Hackwill", "Antoine Defoort", "Louise Siffert", "Sebastien Vial", "Sofia Teillet"].map((label) => link(label)).join("")}</div><div class="footer-column"><strong>Projets</strong>${projectCatalog.map((project) => link(project.id)).join("")}</div><div class="footer-column"><strong>Les thermes</strong>${["On va bâtir une île [...]", "Big Data Yoyo", "Le jeu de l’oie [...]", "Corps diplomatique", "Germinal", "Collectif Jambe", "Bonjour Concert", "Cheval"].map((label) => link(label)).join("")}</div><div class="footer-address"><div class="footer-address-text">L’Amicale<br />34 Rue Louis Bergot<br />59000 Lille</div><div class="footer-logo"><img class="footer-logo-bg" src="${assetUrl("/assets/footer-logo.svg")}" alt="" /><img class="footer-logo-art" src="${assetUrl("/assets/footer-logo.png")}" alt="L’Amicale" /></div></div><div class="footer-credits">admin ↗ ✉ Basile Lemasson　 co-direction ↗ ✉ Sebastien Vial &amp; Samuel Hackwill</div></footer>
    ${editAccessMessage ? `<p class="edit-access-message" role="status">${escapeHtml(editAccessMessage)}</p>` : ""}${editAuthorized ? `<button class="editor-tab" type="button" aria-expanded="${editorOpen}">Editer ce profil</button><aside class="editor-panel ${editorOpen ? "is-open" : ""}" aria-hidden="${!editorOpen}">${editorMarkup()}</aside>` : ""}</div>`
}

function render() {
  document.querySelector("#app").innerHTML = pageMarkup()
  bindEvents()
  bindCreationTooltips()
  bindNameAssetInlining()
}
function rerenderEditor() {
  const scrollTop = document.querySelector(".editor-panel")?.scrollTop || 0
  editorOpen = true
  render()
  const panel = document.querySelector(".editor-panel")
  if (panel) panel.scrollTop = scrollTop
}
function bindEvents() {
  document.querySelector(".editor-tab")?.addEventListener("click", () => {
    editorOpen = true
    render()
  })
  document.querySelector(".editor-close")?.addEventListener("click", () => {
    editorOpen = false
    render()
  })
  document.querySelectorAll(".link").forEach((anchor) => anchor.addEventListener("click", (event) => event.preventDefault()))
  const bioField = document.querySelector('[data-field="bio"]')
  document.querySelector('[data-field="name"]')?.addEventListener("input", (event) => {
    person.name = event.target.value
    queueSave()
  })
  bioField?.addEventListener("input", () => {
    person.bio = bioField.value
    queueSave()
  })
  document.querySelector('[data-action="insert-link"]')?.addEventListener("click", () => {
    const snippet = "[texte du lien](https://exemple.com)"
    const start = bioField.selectionStart ?? bioField.value.length
    const end = bioField.selectionEnd ?? start
    bioField.value = `${bioField.value.slice(0, start)}${snippet}${bioField.value.slice(end)}`
    bioField.focus()
    bioField.setSelectionRange(start + 1, start + 14)
    bioField.dispatchEvent(new Event("input", { bubbles: true }))
  })
  document.querySelector('[data-field="photoFile"]')?.addEventListener("change", async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    photoFilenameText = file.name
    const filename = document.querySelector("[data-photo-filename]")
    if (filename) filename.textContent = file.name
    setPhotoStatus("Optimisation de la photo…", true)
    try {
      const { blob, width, height } = await preparePhoto(file)
      const dataUrl = await blobToDataUrl(blob)
      person.photo = dataUrl
      person.photoFilename = file.name
      photoSyncPending = true
      setPhotoStatus(`Photo optimisée · ${width} × ${height} px · ${(blob.size / (1024 * 1024)).toFixed(2)} Mo`, true)
      editorOpen = true
      queueSave()
      render()
    } catch (error) {
      console.error("Photo processing failed:", error)
      setPhotoStatus(error.message || "Impossible de préparer cette image.")
    }
  })
  document.querySelectorAll("[data-list]").forEach((field) =>
    field.addEventListener("input", () => {
      person[field.dataset.list][Number(field.dataset.index)][Number(field.dataset.part)] = field.value
      queueSave()
    }),
  )
  document.querySelectorAll("[data-add]").forEach((button) =>
    button.addEventListener("click", () => {
      person[button.dataset.add].push(button.dataset.add === "faq" ? ["Question", "Réponse"] : button.dataset.add === "contact" ? ["Bob Mc Prod", "mailto:contact@example.com"] : ["Nouveau lien", "#"])
      queueSave()
      rerenderEditor()
    }),
  )
  document.querySelectorAll("[data-remove]").forEach((button) =>
    button.addEventListener("click", () => {
      person[button.dataset.remove].splice(Number(button.dataset.index), 1)
      queueSave()
      rerenderEditor()
    }),
  )
  document.querySelectorAll("[data-project]").forEach((checkbox) =>
    checkbox.addEventListener("change", () => {
      const id = checkbox.dataset.project
      person.projects = checkbox.checked ? [...new Set([...person.projects, id])] : person.projects.filter((projectId) => projectId !== id)
      queueSave()
      rerenderEditor()
    }),
  )
  const updateFriseField = (field) => {
    const index = Number(field.closest("[data-frise-period]").dataset.frisePeriod)
    const period = person.timeline.periods[index]
    if (!period) return
    const key = field.dataset.friseField
    if (key === "role") period.role = field.value
    if (key === "start" && field.value !== "" && Number.isFinite(Number(field.value))) period.start = Number(field.value)
    if (key === "end") period.end = field.value === "" ? null : Number.isFinite(Number(field.value)) ? Number(field.value) : period.end
    queueSave()
  }
  document.querySelectorAll("[data-frise-field]").forEach((field) => {
    field.addEventListener(field.tagName === "SELECT" ? "change" : "input", () => updateFriseField(field))
  })
  document.querySelector("[data-frise-add]")?.addEventListener("click", () => {
    person.timeline.periods.push({ id: `period-${globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)}`, role: "artiste", start: currentYear(), end: null })
    queueSave()
    rerenderEditor()
  })
  document.querySelectorAll("[data-frise-remove]").forEach((button) =>
    button.addEventListener("click", () => {
      person.timeline.periods.splice(Number(button.dataset.friseRemove), 1)
      queueSave()
      rerenderEditor()
    }),
  )
  document.querySelector('[data-action="reset"]')?.addEventListener("click", async () => {
    person = normalizeProfile(clone(seedPeople[person.slug] || newProfile(person.slug)), person.slug)
    await persistProfile()
    editorOpen = true
    render()
  })
}

render()
Promise.all([hydrateFromSupabase(), verifyEditAccess()]).then(render)
