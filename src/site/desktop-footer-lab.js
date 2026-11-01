import { siteFooter } from "./shared.js"
import { syncPatateurs, destroyPatateurs } from "../patateur/index.js"
import { asset } from "./data.js"
import "./desktop-footer-lab.css"

const root = document.querySelector("#desktop-footer-lab")
const site = path => `${import.meta.env.BASE_URL}${path}`
const candidates = [
  { id:"A", name:"Le grand annuaire", note:"Une carte de newsletter à gauche, les liens à droite, puis les contacts et l’adresse. Le plus proche du footer actuel." },
  { id:"B", name:"L’adresse en tête", note:"Le logo et l’adresse ouvrent le footer. Une lettre à gauche et un annuaire à droite, avec les mails regroupés en bas." },
  { id:"C", name:"Les îlots", note:"La piste D du mobile, déployée en largeur : newsletter, annuaire et réseaux dans des patates distinctes." },
  { id:"D", name:"La lettre en bandeau", note:"La newsletter occupe toute la largeur, puis viennent les liens. Un rythme horizontal et une fin de page noire." },
  { id:"E", name:"La fin légère", note:"Logo, adresse, mails et réseaux restent visibles. Newsletter et annuaires se déplient, pour une fin de page plus courte." },
]

function footerMarkup(id) {
  const template = document.createElement("template")
  template.innerHTML = siteFooter()
  const footer = template.content.firstElementChild
  footer.classList.add("desktop-footer", `footer-${id.toLowerCase()}`)
  footer.querySelectorAll("[id]").forEach(element => {
    const previous = element.id
    element.id = `${id}-${previous}`
    footer.querySelectorAll("label[for]").forEach(label => {
      if (label.htmlFor === previous) label.htmlFor = element.id
    })
  })
  footer.id = `preview-footer-${id}`
  footer.querySelectorAll("[data-patateur]").forEach(element => {
    element.dataset.patateur = `desktop-${id}-${element.dataset.patateur}`
  })
  footer.querySelectorAll('a[href^="?"]').forEach(link => link.setAttribute("href", site(link.getAttribute("href"))))
  footer.querySelector(".socials")?.remove()
  if (id !== "C") footer.querySelector(".footer-social-links")?.removeAttribute("data-patateur")

  if (id === "C") {
    const directory = document.createElement("div")
    directory.className = "directory-island"
    directory.dataset.patateur = "desktop-C-directory"
    directory.dataset.patateurPreset = "project"
    const columns = [...footer.querySelectorAll(".footer-column")]
    columns[0].before(directory)
    directory.append(...columns)
  }
  if (id === "E") {
    const newsletter = footer.querySelector(".footer-newsletter")
    const toggle = document.createElement("details")
    toggle.className = "newsletter-toggle"
    toggle.innerHTML = '<summary>Recevoir nos nouvelles <span aria-hidden="true">+</span></summary>'
    newsletter.before(toggle)
    toggle.append(newsletter)
    footer.querySelectorAll(".footer-column").forEach(column => {
      const firstHeading = column.querySelector("strong")
      const label = firstHeading.textContent
      firstHeading.remove()
      const details = document.createElement("details")
      details.className = "directory-toggle"
      const summary = document.createElement("summary")
      summary.innerHTML = `${label} <span aria-hidden="true">+</span>`
      column.replaceWith(details)
      details.append(summary,column)
    })
  }
  return footer.outerHTML
}

root.innerHTML = `<header class="lab-header"><a href="${site("")}">← Retour au site</a><h1>Cinq footers pour grand écran</h1><p>Les mêmes informations, cinq façons de finir la page. Les liens, formulaires et sections dépliables fonctionnent ; les inscriptions restent dans cette démo.</p><a class="mobile-lab-link" href="${site("footer-lab.html")}">Voir aussi le lab mobile ↗</a></header>
  <nav class="lab-nav" aria-label="Choisir une proposition">${candidates.map(c => `<a href="#candidate-${c.id}"><span>${c.id}</span> ${c.name}</a>`).join("")}</nav>
  ${candidates.map(c => `<section class="candidate" id="candidate-${c.id}" aria-labelledby="candidate-title-${c.id}"><header class="candidate-heading"><h2 id="candidate-title-${c.id}"><span>${c.id}</span> ${c.name}</h2><p>${c.note}</p></header><div class="footer-preview"><div class="page-context"><span class="context-photo" data-patateur-mask="context-${c.id}" data-patateur-preset="project"><img src="${asset("germinal.png")}" alt="Germinal" /></span><div><img src="${asset("title-germinal.svg")}" alt="Germinal" /><p>Halory Goerger &amp; Antoine Defoort</p></div></div>${footerMarkup(c.id)}</div></section>`).join("")}`

root.querySelectorAll(".newsletter-form").forEach(form => form.addEventListener("submit", event => {
  event.preventDefault()
  const candidate = form.closest(".candidate").id
  try { sessionStorage.setItem(`desktop-footer-lab-${candidate}`, JSON.stringify(Object.fromEntries(new FormData(form)))) } catch {}
  form.querySelector(".newsletter-status").textContent = "Merci ! Inscription enregistrée pour cette démo."
  syncPatateurs(root)
}))
root.querySelectorAll("details").forEach(details => details.addEventListener("toggle", () => syncPatateurs(root)))
syncPatateurs(root)
if (import.meta.hot) import.meta.hot.dispose(destroyPatateurs)
