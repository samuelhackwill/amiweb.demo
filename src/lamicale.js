import { renderPeopleHistory, bindPeopleHistory } from "./components/amicale-history/people-history.js"
import { patateurLabel, syncPatateurs, destroyPatateurs } from "./patateur/index.js"
import { siteHeader, siteFooter, siteMenu, bindSiteInteractions } from "./site/shared.js"
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

let destroyHistory = null

// The mobile reference starts with these nine people; keep each person only once.
// Additional periods are demo data, like the existing cooperative timeline.
const cooperativePeople = [
  ...people,
  { id: "marine-thevenet", name: "Marine Thévenet", periods: [["artiste", 2010, 2017.2]], projects: [] },
  { id: "louise-siffert", name: "Louise Siffert", periods: [["artiste", 2010, null]], projects: [] },
  { id: "joaquim-fossi", name: "Joaquim Fossi", periods: [["production", 2012.5, 2017], ["artiste", 2017, null]], projects: [] },
]
const mobileOrder = ["marine-thevenet", "samuel-hackwill", "louise-siffert", "sofia-teillet", "marion-le-guerroue", "sebastien-vial", "celestine-dahan", "joaquim-fossi", "kevin-defrennes"]
const historyPeople = [...mobileOrder.map(id => cooperativePeople.find(person => person.id === id)), ...cooperativePeople.filter(person => !mobileOrder.includes(person.id))]

function renderFooter() {
  return `<div class="lamicale-footer"><aside class="incubation-note" data-patateur="incubation-note"><p>En 26-27, dans le cadre de son programme d’incubation, l’Amicale accompagne le collectif Bombons, Caramels et chocolats.</p></aside><div class="partners"><img src="${asset("image5.png")}" alt="Ministère de la Culture" /><img src="${asset("image6.png")}" alt="Région Hauts-de-France" /><img src="${asset("image4.png")}" alt="Ville de Lille" /></div><div class="site-credits"><p data-patateur="site-credits" data-patateur-wobble="4"><span>code :</span><br /><a href="#credits">↗ Vincent Dilly</a><br />Samuel Hackwill</p></div></div>`
}

export function renderLamicalePage() {
  destroyHistory?.()
  destroyPatateurs()
  const root = document.querySelector("#app")
  root.innerHTML = `<div class="page lamicale-page">
    ${siteHeader({ active: "amicale", whiteWordmark:true })}
    <main class="lamicale-content">
      <div class="amicale-top-grid"><section class="amicale-intro"><p>L’Amicale est une coopérative de projets qui mutualise des moyens (production, administration, diffusion, logistique) pour éditer des formes transversales, entre spectacle vivant et arts visuels. Nous tentons de répondre à des questionnements esthétiques et économiques liés aux nouvelles écritures de la scène, tout en développant une réflexion autour de la production.</p>
        <section class="amicale-faq">${patateurLabel("FAQ :", "amicale-faq", "amicale-label faq-label")}${faq.map(([q, a]) => `<details><summary>↓ ${esc(q)}</summary><p>${esc(a)}</p></details>`).join("")}</section>
      </section><aside class="amicale-contacts"><section>${patateurLabel("production / diffusion :", "amicale-production", "amicale-label production-label")}<ul><li><a href="mailto:camille@example.com">✉ Camille Bono</a></li><li><a href="mailto:apolline@example.com">✉ Apolline Duponchelle</a></li><li><a href="mailto:josephine@example.com">✉ Joséphine Gelot</a></li><li><a href="mailto:paula@example.com">✉ Paula Swinnen</a></li></ul></section><section>${patateurLabel("administration :", "amicale-administration", "amicale-label")}<ul><li><a href="mailto:basile@example.com">✉ Basile Lemasson</a></li></ul></section><section>${patateurLabel("co-direction :", "amicale-direction", "amicale-label")}<ul><li><a href="mailto:samuel@example.com">✉ Samuel Hackwill</a></li><li><a href="mailto:sebastien@example.com">✉ Sebastien Vial</a></li></ul></section></aside></div>
      <figure class="amicale-group-photo" data-patateur-mask="amicale-group-photo" data-patateur-wobble="12"><img src="${asset("teye2.jpg")}" alt="Des membres de l’Amicale réunis dans un parc" /></figure>
      ${renderPeopleHistory(historyPeople, roles)}
      ${renderFooter()}
    </main>
    ${siteFooter({ desktopOnly:true })}
    ${siteMenu()}
  </div>`
  document.title = "L’Amicale — La coopérative"
  bindSiteInteractions(root)
  destroyHistory = bindPeopleHistory(root, historyPeople, roles)
  syncPatateurs(root)
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
      destroyHistory?.()
  })
}
