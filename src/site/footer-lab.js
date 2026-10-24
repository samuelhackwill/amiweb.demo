import { syncPatateurs, destroyPatateurs } from "../patateur/index.js"
import { asset, publicAsset, projectDirectory, projectHref, personHref, wheelPeople, events, getProject } from "./data.js"
import "./footer-lab.css"

const root = document.querySelector("#footer-lab")
const site = path => `${import.meta.env.BASE_URL}${path}`
const escape = value => String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c])
const destinations = [["Projets", "?page=home#projects"], ["Calendrier", "?page=calendar"], ["L’Amicale", "?page=lamicale"], ["Blog", "?page=blog"]]
const navigation = (id, pills = false) => `<nav class="footer-nav${pills ? " pill-nav" : ""}" aria-label="Navigation, proposition ${id}">${destinations.map(([label, href], i) => `<a href="${site(href)}" ${pills ? `data-patateur="${id}-nav-${i}" data-patateur-wobble="3"` : ""}>${label}</a>`).join("")}</nav>`
const socials = () => `<nav class="social-links" aria-label="Réseaux sociaux"><a href="https://www.instagram.com/amicale.coop/">↗ Instagram</a><a href="https://vimeo.com/amicale">↗ Vimeo</a><a href="https://www.facebook.com/AmicaleDeProduction/">↗ Facebook</a></nav>`
const logo = () => `<a class="brand-logo" href="${site("?page=lamicale")}" aria-label="L’Amicale"><img src="${publicAsset("footer-logo.png")}" alt="L’Amicale" /></a>`
const address = () => `<address>L’Amicale<br />34 rue Louis Bergot<br />59000 Lille</address>`
const signature = () => `<div class="signature">${address()}${logo()}</div>`
const pill = (id, text, href, extra = "") => `<a class="pill ${extra}" href="${href}" data-patateur="${id}" data-patateur-wobble="3">${text}</a>`
const newsletter = (id, compact = false) => `<form class="newsletter${compact ? " newsletter-compact" : ""}" data-newsletter="${id}"><label for="email-${id}">Votre adresse mail</label><div class="email-row"><input id="email-${id}" name="email" type="email" autocomplete="email" placeholder="vous@exemple.fr" required /><button class="pill" type="submit" data-patateur="${id}-submit" data-patateur-wobble="3">M’inscrire</button></div><p class="form-status" role="status"></p></form>`
const credits = () => `<div class="credits"><a href="mailto:contact@amicale.coop">↗ contact@amicale.coop</a><span>Une coopérative de projets vivants.</span></div>`
const newsletterToggle = id => `<details class="newsletter-toggle"><summary>Recevoir nos nouvelles <span aria-hidden="true">+</span></summary><div class="details-content"><p>Deux nouvelles par an, pour suivre les projets.</p>${newsletter(id)}</div></details>`

const futureDates = [...events].sort((a,b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`)).filter(event => new Date(`${event.date}T23:59:59`) >= new Date()).slice(0,3)
const dateFormat = new Intl.DateTimeFormat("fr-FR", {day:"2-digit",month:"2-digit"})
const candidates = [
  { id:"A", name:"La fin tranquille", note:"Compact : newsletter, navigation, adresse. Une fin de page simple.",
    html:`<footer class="mobile-footer footer-a"><p class="eyebrow">On garde le lien ?</p><h2>Deux nouvelles<br />par an.</h2>${newsletter("a",true)}${navigation("a")}${socials()}${signature()}${credits()}</footer>` },
  { id:"B", name:"Le petit annuaire", note:"Les rubriques se déplient au besoin. Toute la navigation tient dans peu de place.",
    html:`<footer class="mobile-footer footer-b"><h2>Et sinon…</h2>${newsletterToggle("b")}<details><summary>Se promener <span aria-hidden="true">+</span></summary><div class="details-content">${navigation("b")}</div></details><details><summary>Les projets <span aria-hidden="true">+</span></summary><nav class="details-content directory" aria-label="Tous les projets">${projectDirectory.map(p=>`<a href="${site(projectHref(p.id))}">${escape(p.name)}</a>`).join("")}</nav></details><details><summary>Les personnes <span aria-hidden="true">+</span></summary><nav class="details-content directory" aria-label="Les personnes">${wheelPeople.map(p=>`<a href="${site(personHref(p.label))}">${escape(p.label)}</a>`).join("")}</nav></details><details><summary>Ailleurs <span aria-hidden="true">+</span></summary><div class="details-content">${socials()}</div></details>${signature()}${credits()}</footer>` },
  { id:"C", name:"Le contact d’abord", note:"Une invitation à écrire, avec les autres informations en second plan.",
    html:`<footer class="mobile-footer footer-c"><span class="eyebrow" data-patateur="c-hello" data-patateur-wobble="3">Ça commence par un bonjour.</span><h2>Une question ?<br />Une envie ?</h2><p>Parlons projets, spectacles<br />et autres bonnes idées.</p>${pill("c-email","↗ Écrivez-nous","mailto:contact@amicale.coop","contact-pill")}${socials()}${newsletterToggle("c")}${navigation("c")}${signature()}</footer>` },
  { id:"D", name:"Les petites patates", note:"Des blocs autonomes, plus joueurs : une carte pour les nouvelles, une pour les raccourcis.",
    html:`<footer class="mobile-footer footer-d"><section class="newsletter-island" data-patateur="d-newsletter" data-patateur-wobble="7"><h2>Des nouvelles<br />du vivant.</h2><p>Une lettre, deux fois par an.</p>${newsletter("d")}</section><section class="shortcut-island"><span class="eyebrow">Encore un petit tour ?</span>${navigation("d",true)}</section><div class="contact-island" data-patateur="d-contact" data-patateur-wobble="4"><p>On est à Lille,<br />et aussi par ici :</p>${socials()}</div>${signature()}${credits()}</footer>` },
  { id:"E", name:"La prochaine rencontre", note:"Le footer ouvre sur la suite : trois prochaines dates, puis une fin de page légère.",
    html:`<footer class="mobile-footer footer-e"><span class="eyebrow" data-patateur="e-dates" data-patateur-wobble="3">On se voit bientôt ?</span><div class="footer-dates">${futureDates.map(event=>`<a class="footer-date" href="${site(`?page=calendar&event=${encodeURIComponent(event.id)}`)}"><time datetime="${event.date}">${dateFormat.format(new Date(`${event.date}T12:00:00`))}</time><span>${escape(event.city)}<strong>${escape(getProject(event.project).name)}</strong></span></a>`).join("")}</div>${pill("e-calendar","Voir le calendrier",site("?page=calendar"))}${newsletterToggle("e")}${navigation("e")}<div class="goodbye"><h2>À bientôt !</h2>${logo()}</div>${address()}${socials()}${credits()}</footer>` },
]

root.innerHTML = `<header class="lab-header"><a href="${site("")}">← Retour au site</a><h1>Cinq fins de page</h1><p>Propositions pour mobile, avec des aperçus de 390 px maximum. Menus dépliables et formulaires sont interactifs ; les inscriptions restent dans cette démo.</p><nav class="candidate-links" aria-label="Choisir une proposition">${candidates.map(c=>`<a href="#footer-${c.id}">${c.id} · ${c.name}</a>`).join("")}</nav></header><div class="variants">${candidates.map(c=>`<section class="variant-card" id="footer-${c.id}" aria-labelledby="variant-${c.id}"><div class="variant-heading"><h2 id="variant-${c.id}"><span>${c.id}</span> ${c.name}</h2><p>${c.note}</p></div><div class="phone-preview"><div class="context-strip"><span class="context-image" data-patateur-mask="footer-${c.id}-context" data-patateur-preset="project"><img src="${asset("germinal.png")}" alt="Germinal" /></span><div><img class="context-title" src="${asset("title-germinal.svg")}" alt="Germinal" /><p>Halory Goerger &amp;<br />Antoine Defoort</p></div></div>${c.html}</div></section>`).join("")}</div>`

root.querySelectorAll("[data-newsletter]").forEach(form=>form.addEventListener("submit",event=>{
  event.preventDefault()
  const email=new FormData(form).get("email")
  try { sessionStorage.setItem(`footer-lab-newsletter-${form.dataset.newsletter}`,String(email)) } catch {}
  form.querySelector(".form-status").textContent="Merci ! Inscription de démonstration enregistrée."
}))
root.querySelectorAll("details").forEach(details=>details.addEventListener("toggle",()=>syncPatateurs(root)))
syncPatateurs(root)
if(import.meta.hot)import.meta.hot.dispose(destroyPatateurs)
