import { syncPatateurs, destroyPatateurs } from "../patateur/index.js"
import { createPatateurShape } from "../patateur/presets.js"
import { asset, personHref, projectHref } from "./data.js"
import { portraitForPerson } from "../data/people-portraits.js"
import "./internal-links-lab.css"

const root = document.querySelector("#internal-links-lab")
const site = path => `${import.meta.env.BASE_URL}${path}`
const candidates = [
  { id:"a", name:"Le trait", note:"Une ligne sous les mots, un contour autour du visage. Rien ne bouge, la couleur reste la même.", tag:"Le plus discret" },
  { id:"b", name:"Le contraste", note:"La patate et les mots passent en négatif. Le portrait s’éclaire et retrouve sa couleur.", tag:"Le plus évident" },
  { id:"c", name:"Le décalage", note:"Un deuxième contour légèrement décalé, comme un repérage d’impression. Les mots ont leur petit socle.", tag:"Le plus graphique" },
  { id:"d", name:"Le surligneur", note:"Un jaune papier souligne les passages possibles. Une couleur réservée aux liens internes, distincte du bleu externe.", tag:"Le plus chaleureux" },
  { id:"e", name:"Le petit mouvement", note:"La patate se soulève, le visage se rapproche et une ligne se dessine sous les mots. Un mouvement court et léger.", tag:"Le plus vivant" },
]
const portraitPath = createPatateurShape(144,144,{ preset:"round", seed:"internal-link-person", wobble:4, padX:5, padY:5 })

root.innerHTML = `<header class="lab-heading">
  <div class="lab-top"><a href="${site("")}">Retour au site</a><button class="theme-toggle" type="button" aria-pressed="false">Fond clair</button></div>
  <p class="eyebrow">L’Amicale · laboratoire</p>
  <h1>On reste dans le coin.</h1>
  <p class="intro">Cinq façons de reconnaître un lien interne. Même contenu, mêmes destinations ; seul le signal change. Le bleu et la flèche restent aux <a class="external-link" href="https://amicale.coop/" target="_blank" rel="noopener noreferrer">↗ liens externes</a>.</p>
  <nav class="candidate-nav" aria-label="Les cinq propositions">${candidates.map(c => `<a href="#candidate-${c.id}">${c.id.toUpperCase()} · ${c.name}</a>`).join("")}</nav>
</header>
${candidates.map(c => `<section class="candidate variant-${c.id}" id="candidate-${c.id}" aria-labelledby="title-${c.id}">
  <header class="candidate-heading"><div><p class="eyebrow">${c.tag}</p><h2 id="title-${c.id}"><span>${c.id.toUpperCase()}</span> ${c.name}</h2><p>${c.note}</p></div><button class="preview-toggle" type="button" aria-pressed="false">Maintenir l’effet</button></header>
  <div class="examples">
    <div class="example"><h3>Une patate</h3><div class="example-stage"><a class="demo-link potato-link" href="${site("?page=calendar")}" data-patateur="internal-potato" data-patateur-wobble="3"><span class="link-label">Voir le calendrier</span></a></div></div>
    <div class="example"><h3>Un visage & son nom</h3><div class="example-stage"><a class="demo-link person-link" href="${site(personHref("Samuel Hackwill"))}"><svg class="portrait" viewBox="0 0 144 144" role="img" aria-label="Portrait de Samuel Hackwill"><defs><clipPath id="portrait-${c.id}"><path d="${portraitPath}" /></clipPath></defs><image class="portrait-image" href="${portraitForPerson("Samuel Hackwill")}" width="144" height="144" preserveAspectRatio="xMidYMid slice" clip-path="url(#portrait-${c.id})" /><path class="portrait-outline" d="${portraitPath}" /></svg><span class="link-label">Samuel Hackwill</span></a></div></div>
    <div class="example"><h3>Dans le texte</h3><div class="example-stage text-stage"><p>Des artistes, des idées et des aventures communes. Découvrez <a class="demo-link text-link" href="${site("?page=lamicale")}"><span class="link-label">l’histoire de l’Amicale</span></a>, une coopérative de projets vivants.</p></div></div>
  </div>
  <div class="row-example"><h3>Et sur toute une ligne de projet</h3><a class="demo-link project-link" href="${site(projectHref("germinal"))}"><span class="project-photo" data-patateur-mask="internal-project" data-patateur-preset="project"><img src="${asset("germinal.png")}" alt="" /></span><span class="project-title"><span class="link-label">Germinal</span><small>Halory Goerger & Antoine Defoort</small></span><span class="project-copy">Si on avait la possibilité de repartir de zéro, à l’intérieur de huit mètres par dix, on ferait comment ?</span></a></div>
</section>`).join("")}
<footer class="lab-footer">Survolez les liens, ou parcourez-les avec Tab. « Maintenir l’effet » permet de comparer les propositions sans souris. Les liens ouvrent les vraies pages de la démo.</footer>`

root.querySelectorAll(".preview-toggle").forEach(button => button.addEventListener("click", () => {
  const enabled = button.getAttribute("aria-pressed") !== "true"
  button.setAttribute("aria-pressed", String(enabled))
  button.textContent = enabled ? "Relâcher l’effet" : "Maintenir l’effet"
  button.closest(".candidate").querySelectorAll(".demo-link").forEach(link => link.toggleAttribute("data-preview", enabled))
}))
root.querySelector(".theme-toggle").addEventListener("click", event => {
  const light = document.documentElement.dataset.labTheme !== "light"
  document.documentElement.dataset.labTheme = light ? "light" : "dark"
  event.currentTarget.setAttribute("aria-pressed", String(light))
  event.currentTarget.textContent = light ? "Fond sombre" : "Fond clair"
})
syncPatateurs(root)
if (import.meta.hot) import.meta.hot.dispose(destroyPatateurs)
