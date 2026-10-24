import { portraitForPerson, placeholderPortrait } from "./data/people-portraits.js"
import { createApp } from "vue"
import PeopleWheel from "./components/people-wheel/PeopleWheel.vue"
import projectDates from "./data/project-first-dates.json"
import { patateurLabel, syncPatateurs, destroyPatateurs } from "./patateur/index.js"
import { siteHeader, siteMenu, bindSiteInteractions } from "./site/shared.js"
import { personHref } from "./site/data.js"
import "./lamicale.css"

const asset = (name) => `${import.meta.env.BASE_URL}assets/amicale/${name}`
const esc = (value = "") => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char])

const roles = [
  { id: "artiste", label: "Artiste associé", color: "#6d82ff", tier: 1 },
  { id: "production", label: "Production", color: "#ff1717", tier: 1 },
  { id: "administration", label: "Administration", color: "#ffe600", tier: 1 },
  { id: "direction", label: "Direction", color: "#971fa8", tier: 2 },
  { id: "regie", label: "Régie", color: "#55ef45", tier: 2 },
  { id: "collaborateur", label: "Collaborateur régulier", color: "#ff7eb6", tier: 2 },
]

const people = [
  { id: "halory-goerger", name: "Halory Goerger", code: "GOH", periods: [["artiste", 2009.8, 2017.2]], projects: ["de-la-sexualite-des-orchidees", "les-thermes", "le-jeu-de-loie-du-spectacle-vivant", "amies-il-faut-faire-une-pause"] },
  { id: "julien-fournet", name: "Julien Fournet", code: "FOJ’", periods: [["production", 2009.8, 2015.1], ["artiste", 2015, null], ["direction", 2009.9, 2019.1]], projects: ["de-la-sexualite-des-orchidees", "un-faible-degre-originalite", "les-thermes"] },
  { id: "antoine-defoort", name: "Antoine Defoort", code: "DEA", periods: [["artiste", 2009.8, null]], projects: ["de-la-sexualite-des-orchidees", "un-faible-degre-originalite", "les-thermes", "le-jeu-de-loie-du-spectacle-vivant"] },
  { id: "robin-mignot", name: "Robin Mignot", code: "MIR", periods: [["regie", 2009.8, 2019]], projects: [] },
  { id: "sebastien-vial", name: "Sebastien Vial", code: "VIS", periods: [["artiste", 2009.8, null], ["direction", 2025.5, null]], projects: ["vitesse-80", "tryhard"] },
  { id: "eric-tartainville", name: "Eric Tartainville", code: "TAR", periods: [["regie", 2012.4, 2023.8]], projects: [] },
  { id: "sarah-calvez", name: "Sarah Calvez", code: "CAL", periods: [["administration", 2009.8, 2017.2]], projects: [] },
  { id: "mathilde-maillard", name: "Mathilde Maillard", code: "MAM", periods: [["production", 2012.5, 2016.9], ["artiste", 2016.9, 2019.9]], projects: ["ma-presence-suffit-a-enchanter-le-monde"] },
  { id: "pauline-foury", name: "Pauline Foury", code: "FOU", periods: [["production", 2012.5, 2016.1]], projects: [] },
  { id: "kevin-defrennes", name: "Kevin Defrennes", code: "DEK", periods: [["administration", 2012.5, 2024.3]], projects: [] },
  { id: "marion-le-guerroue", name: "Marion Le Guerroué", code: "LEM", periods: [["production", 2012.4, 2019.9]], projects: [] },
  { id: "samuel-hackwill", name: "Samuel Hackwill", code: "HAC", periods: [["artiste", 2016.4, null], ["direction", 2025.6, null]], projects: ["tiret-du-six", "tryhard"] },
  { id: "sofia-teillet", name: "Sofia Teillet", code: "TEI", periods: [["artiste", 2016.4, null]], projects: ["elles-vivent"] },
  { id: "camille-bono", name: "Camille Bono", code: "BON", periods: [["production", 2016.4, 2023.3]], projects: [] },
  { id: "margot-vouters", name: "Margot Vouters", code: "VOU", periods: [["production", 2016.4, 2023.3]], projects: [] },
  { id: "thomas-riou", name: "Thomas Riou", code: "RIO", periods: [["production", 2016.4, 2024.4]], projects: [] },
  { id: "alice-broyelle", name: "Alice Broyelle", code: "BRA", periods: [["production", 2016.4, 2020.8]], projects: [] },
  { id: "emanuelle-wattier", name: "Emanuelle Wattier", code: "WAT", periods: [["direction", 2018.1, 2021.4]], projects: [] },
  { id: "celestine-dahan", name: "Celestine Dahan", code: "DAH", periods: [["production", 2019.8, 2024.5]], projects: [] },
  { id: "yulia-sakun", name: "Yulia Sakun", code: "SAY", periods: [["administration", 2019.8, 2024.5]], projects: [] },
  { id: "basile-lemasson", name: "Basile Lemasson", code: "LEM", periods: [["administration", 2024.5, null]], projects: [] },
]

const faq = [
  ["Pourquoi l’Amicale?", "Une coopérative pour imaginer d’autres façons de produire et de partager des projets artistiques."],
  ["Depuis quand l’Amicale existe-t-elle?", "L’Amicale s’est constituée en 2010. Cette réponse pourra être reliée aux données éditables plus tard."],
  ["Quelle est la dernière production de l’Amicale?", "Retrouvez les projets récents dans la rubrique projets."],
  ["Quelle est la première production de l’Amicale?", "Cette réponse est un texte de démonstration, à remplacer avec le contenu définitif."],
]

const rolesForYear = (member, year) => member.periods.filter(([, start, end]) => start <= year && (end ?? new Date().getFullYear()) > year)

let wheelApp = null

function starPath(cx, cy, outer = 7, inner = 3.1, points = 5) {
  return Array.from({ length: points * 2 }, (_, i) => {
    const angle = -Math.PI / 2 + (i * Math.PI) / points
    const radius = i % 2 ? inner : outer
    return `${i ? "L" : "M"}${(cx + Math.cos(angle) * radius).toFixed(2)},${(cy + Math.sin(angle) * radius).toFixed(2)}`
  }).join(" ") + " Z"
}

function makeRockLine(x1, x2, y, seed) {
  let value = [...seed].reduce((sum, char) => sum + char.charCodeAt(0), 0) || 1
  const random = () => {
    value = (value * 9301 + 49297) % 233280
    return value / 233280
  }
  const steps = Math.max(4, Math.ceil((x2 - x1) / 18))
  const points = Array.from({ length: steps + 1 }, (_, index) => ({ x: x1 + (x2 - x1) * index / steps, y: y + (random() - .5) * 3.5 }))
  return points.slice(1).reduce((path, point, index) => {
    const previous = points[index]
    const dx = (point.x - previous.x) / 3
    return `${path} C ${(previous.x + dx).toFixed(2)} ${(previous.y + (random() - .5) * 3).toFixed(2)}, ${(point.x - dx).toFixed(2)} ${(point.y + (random() - .5) * 3).toFixed(2)}, ${point.x.toFixed(2)} ${point.y.toFixed(2)}`
  }, `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`)
}

function renderTimeline() {
  const current = new Date().getFullYear()
  const startYear = 2010
  const endYear = Math.max(2025, current)
  const left = 148
  const right = 14
  const width = 930
  const rowHeight = 27
  const y0 = 72
  const height = y0 + people.length * rowHeight + 10
  const x = (year) => left + (year - startYear) / (endYear - startYear) * (width - left - right)
  const ticks = []
  for (let year = startYear; year <= endYear; year += 5) ticks.push(year)
  if (!ticks.includes(current)) ticks.push(current)
  const defs = []
  const grid = ticks.map((year) => {
    const crowdedPreviousTick = year === 2025 && current - year < 3
    const labelX = crowdedPreviousTick ? x(year) - 26 : x(year)
    const anchor = year === current || crowdedPreviousTick ? "end" : "middle"
    return `<g class="timeline-tick ${year === current ? "is-now" : ""}"><line x1="${x(year)}" y1="39" x2="${x(year)}" y2="${height - 7}" /><text x="${labelX}" y="25" text-anchor="${anchor}">${year === current ? "aujourd’hui" : year}</text></g>`
  }).join("")
  const rows = people.map((member, row) => {
    const y = y0 + row * rowHeight
    const safeId = member.id.replace(/[^a-z0-9-]/gi, "")
    const periods = member.periods.filter(([, start, end]) => (end ?? current) > Math.max(start, startYear))
    const boundaries = [...new Set(periods.flatMap(([, start, end]) => [Math.max(start, startYear), Math.min(end ?? current, current)]))].sort((a, b) => a - b)
    let bars = ""
    boundaries.slice(0, -1).forEach((from, segment) => {
      const to = boundaries[segment + 1]
      const active = periods.filter(([, start, end]) => start < to && (end ?? current) > from).sort((a, b) => (roles.find((role) => role.id === a[0])?.tier ?? 1) - (roles.find((role) => role.id === b[0])?.tier ?? 1))
      active.forEach(([roleId], index) => {
        const role = roles.find((item) => item.id === roleId) || roles[0]
        const clipId = `${safeId}-clip-${row}-${segment}`
        defs.push(`<clipPath id="${clipId}"><rect x="${x(from)}" y="${y - rowHeight / 2 + 2}" width="${Math.max(1, x(to) - x(from))}" height="${rowHeight - 3}" /></clipPath>`)
        bars += `<path d="${makeRockLine(x(Math.max(startYear, periods[0][1])), x(Math.min(current, Math.max(...periods.map((period) => period[2] ?? current)))), y, safeId)}" fill="none" stroke="${role.color}" stroke-width="${Math.max(3, 15 - index * 5)}" stroke-linecap="round" clip-path="url(#${clipId})" />`
      })
    })
    const creationMarkers = member.projects.flatMap((projectId) => {
      const project = projectDates.projects.find((item) => item.id === projectId)
      if (!project?.firstDate) return []
      const date = new Date(`${project.firstDate}T00:00:00Z`)
      const year = date.getUTCFullYear() + date.getUTCMonth() / 12
      if (year < startYear || year > current) return []
      const active = rolesForYear(member, year).sort((a, b) => (roles.find((role) => role.id === a[0])?.tier ?? 1) - (roles.find((role) => role.id === b[0])?.tier ?? 1))[0]
      const color = active ? roles.find((role) => role.id === active[0])?.color : "#fff"
      return [`<path class="amicale-creation" d="${starPath(x(year), y, 7, 3.1, 5)}" fill="${color}" stroke="#111" stroke-width="1" tabindex="0" role="img" aria-label="${esc(project.name)}, première date ${project.firstDate}"><title>${esc(project.name)} · première date ${project.firstDate}</title></path>`]
    }).join("")
    const activeRole = rolesForYear(member, current)[0]
    const labelColor = activeRole ? roles.find((role) => role.id === activeRole[0])?.color : "#fff"
    return `<g class="timeline-person"><text class="timeline-person-name" x="${left - 13}" y="${y + 4}" text-anchor="end" fill="${labelColor}">${esc(member.name)}</text>${bars}${creationMarkers}</g>`
  }).join("")
  const legend = roles.slice(0, 5).map((role) => `<span class="timeline-legend-item"><i style="--role:${role.color}"></i>${esc(role.label)}</span>`).join("")
  return `<section class="amicale-frise" aria-label="Frise des personnes de l’Amicale"><div class="timeline-legend">${legend}<span class="timeline-legend-item"><i class="legend-creation"></i>(création)</span></div><div class="timeline-scroll"><svg class="amicale-timeline" viewBox="0 0 ${width} ${height}" role="img" aria-label="Parcours des personnes de l’Amicale de 2010 à ${current}"><defs>${defs.join("")}</defs>${grid}${rows}</svg></div></section>`
}

function renderFooter() {
  return `<div class="lamicale-footer"><aside class="incubation-note" data-patateur="incubation-note"><p>En 26-27, dans le cadre de son programme d’incubation, l’Amicale accompagne le collectif Bombons, Caramels et chocolats.</p></aside><div class="partners"><img src="${asset("image5.png")}" alt="Ministère de la Culture" /><img src="${asset("image6.png")}" alt="Région Hauts-de-France" /><img src="${asset("image4.png")}" alt="Ville de Lille" /></div><div class="site-credits"><p data-patateur="site-credits" data-patateur-wobble="4"><span>code :</span><br /><a href="#credits">↗ Vincent Dilly</a><br />Samuel Hackwill</p></div></div>`
}

export function renderLamicalePage() {
  wheelApp?.unmount()
  destroyPatateurs()
  const root = document.querySelector("#app")
  root.innerHTML = `<div class="page lamicale-page">
    ${siteHeader({ active: "amicale" })}
    <div class="lamicale-brand"><div class="lamicale-logo"><img src="${import.meta.env.BASE_URL}assets/logo.png" alt="L’Amicale" /></div><img class="lamicale-title" src="${asset("amicale-title.svg")}" alt="L’Amicale" /></div>
    <main class="lamicale-content">
      <div class="amicale-top-grid"><section class="amicale-intro"><p>L’Amicale est une coopérative de projets qui mutualise des moyens (production, administration, diffusion, logistique) pour éditer des formes transversales, entre spectacle vivant et arts visuels. Nous tentons de répondre à des questionnements esthétiques et économiques liés aux nouvelles écritures de la scène, tout en développant une réflexion autour de la production.</p>
        <section class="amicale-faq">${patateurLabel("FAQ :", "amicale-faq", "amicale-label faq-label")}${faq.map(([q, a]) => `<details><summary>↓ ${esc(q)}</summary><p>${esc(a)}</p></details>`).join("")}</section>
      </section><aside class="amicale-contacts"><section>${patateurLabel("production / diffusion :", "amicale-production", "amicale-label production-label")}<ul><li><a href="mailto:camille@example.com">✉ Camille Bono</a></li><li><a href="mailto:apolline@example.com">✉ Apolline Duponchelle</a></li><li><a href="mailto:josephine@example.com">✉ Joséphine Gelot</a></li><li><a href="mailto:paula@example.com">✉ Paula Swinnen</a></li></ul></section><section>${patateurLabel("administration :", "amicale-administration", "amicale-label")}<ul><li><a href="mailto:basile@example.com">✉ Basile Lemasson</a></li></ul></section><section>${patateurLabel("co-direction :", "amicale-direction", "amicale-label")}<ul><li><a href="mailto:samuel@example.com">✉ Samuel Hackwill</a></li><li><a href="mailto:sebastien@example.com">✉ Sebastien Vial</a></li></ul></section></aside></div>
      <figure class="amicale-group-photo" data-patateur-mask="amicale-group-photo" data-patateur-wobble="12"><img src="${asset("teye2.jpg")}" alt="Des membres de l’Amicale réunis dans un parc" /></figure>
      <section class="amicale-people"><p class="people-caption">Toutes les personnes qui ont constitué l’Amicale depuis sa création en 2010 :</p><div data-people-wheel></div></section>
      ${renderTimeline()}
      ${renderFooter()}
    </main>
    ${siteMenu()}
  </div>`
  document.title = "L’Amicale — La coopérative"
  bindSiteInteractions(root)
  wheelApp = createApp(PeopleWheel, {
    items: people.map((member) => ({
      id: member.id,
      src: portraitForPerson(member.name) || placeholderPortrait(),
      alt: member.name,
      label: member.name,
      code: member.code,
      href: personHref(member.name),
    })),
  })
  wheelApp.mount(root.querySelector("[data-people-wheel]"))
  syncPatateurs(root)
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => wheelApp?.unmount())
}
