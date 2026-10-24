import { suggestNewsletterRegion } from "./newsletter-region.js"
import { asset, publicAsset, projects, projectDirectory, projectHref, personHref } from "./data.js"

export const esc = (value = "") => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char])
const navItems = [["home", "Projets", "?page=home#projects"], ["calendar", "Calendrier", "?page=calendar"], ["amicale", "L’Amicale", "?page=lamicale"], ["blog", "Blog", "?page=blog"]]

export function siteHeader({ active = "home", crumb = "" } = {}) {
  const links = navItems.map(([id, label, href]) => `<span class="nav-item"><a class="link" data-route href="${href}" ${id === active && !crumb ? 'aria-current="page"' : ""}>${label}</a>${id === active && crumb ? `<span class="nav-crumb"> → ${esc(crumb)}</span>` : ""}</span>`).join("")
  return `<header class="topbar site-header" id="top"><nav class="desktop-nav" aria-label="Navigation principale">${links}<span class="theme-button" aria-hidden="true"><img src="${publicAsset("theme.svg")}" alt="" /></span></nav><a class="desktop-wordmark" href="?page=home" aria-label="Accueil de l’Amicale"><img src="${asset("header-wordmark.svg")}" alt="" /></a><div class="mobile-header"><a class="mobile-wordmark" href="?page=home" aria-label="Accueil de l’Amicale"><img src="${asset("header-wordmark-mobile.svg")}" alt="L’Amicale" /></a><span class="mobile-sun" aria-hidden="true">☼</span><button class="menu-open" type="button" data-menu-open aria-expanded="false" aria-haspopup="dialog" aria-controls="site-menu"><span class="menu-lines" aria-hidden="true"></span> Menu</button></div></header>`
}

export function siteMenu() {
  return `<dialog class="site-menu" id="site-menu" aria-label="Menu de navigation"><button class="menu-close" type="button" data-dialog-close data-patateur="menu-close" data-patateur-wobble="2" aria-label="Fermer le menu">×</button><nav class="menu-primary" aria-label="Navigation mobile">${navItems.map(([, label, href]) => `<a href="${href}">${label}</a>`).join("")}</nav><nav class="menu-projects" aria-label="Les projets">${projectDirectory.map((project, index) => `<a href="${projectHref(project.id)}"><span class="menu-thumb" data-patateur-mask="menu-${esc(project.id)}" data-patateur-preset="project" data-patateur-wobble="1"><img src="${asset(projects[index % projects.length].photo)}" alt="" loading="lazy" /></span><i>${esc(project.name)}</i></a>`).join("")}</nav></dialog>`
}

export function siteFooter() {
  const locationGroups = [
    ["France — régions", ["Auvergne-Rhône-Alpes", "Bourgogne-Franche-Comté", "Bretagne", "Centre-Val de Loire", "Corse", "Grand Est", "Guadeloupe", "Guyane", "Hauts-de-France", "Île-de-France", "La Réunion", "Martinique", "Mayotte", "Normandie", "Nouvelle-Aquitaine", "Occitanie", "Pays de la Loire", "Provence-Alpes-Côte d’Azur"]],
    ["Autres pays", ["Belgique", "Suisse", "Pays-Bas", "Italie", "Allemagne"]],
    ["Autres zones", ["Amériques", "Asie et Océanie", "Afrique"]],
  ]
  const locationOptions = locationGroups.map(([label, places]) => `<optgroup label="${esc(label)}">${places.map(place => `<option value="${esc(place)}"${place === "Hauts-de-France" ? " selected" : ""}>${esc(place)}</option>`).join("")}</optgroup>`).join("")
  const authors = ["Julien Fournet", "Joaquim Fossi", "Samuel Hackwill", "Antoine Defoort", "Louise Siffert", "Sebastien Vial", "Sofia Teillet"]
  const list = (items) => items.map(([label, href]) => `<a class="footer-link" href="${href}">${esc(label)}</a>`).join("")
  return `<footer class="footer site-footer" id="footer">
    <div class="footer-newsletter" data-patateur="footer-newsletter-card" data-patateur-wobble="7">
      <div class="socials"><a href="https://www.instagram.com/amicale.coop/" aria-label="Instagram">◎</a><a href="https://www.facebook.com/AmicaleDeProduction/" aria-label="Facebook">f</a><a href="https://vimeo.com/amicale" aria-label="Vimeo">v</a></div>
      <p>Au fait on a une newsletter semestrielle à laquelle vous pouvez vous inscrire ici (+5000 abonné·e·s) ↘</p>
      <form class="newsletter-form">
        <label class="fake-field" for="newsletter-email">Adresse mail</label>
        <input class="fake-input" id="newsletter-email" name="email" type="email" autocomplete="email" placeholder="jeanbob@gmail.com" required />
        <label class="fake-field" for="newsletter-region">Région / Pays</label>
        <select class="fake-input" id="newsletter-region" name="region">${locationOptions}</select>
        <button class="submit-button" data-patateur="newsletter-submit" data-patateur-wobble="4" type="submit">Allez c’est parti</button>
        <p class="newsletter-status" role="status"></p>
      </form>
    </div>
    <div class="footer-column"><strong>Navigation</strong>${list([["Accueil", "?page=home"], ["L’Amicale", "?page=lamicale"], ["Calendrier", "?page=calendar"], ["Blog", "?page=blog"]])}<br /><strong>Associés</strong>${list(authors.map(name => [name, personHref(name)]))}</div>
    <div class="footer-column"><strong>Projets</strong>${list(projectDirectory.slice(0, 16).map(project => [project.name, projectHref(project.id)]))}</div>
    <div class="footer-column"><strong>Les thermes</strong>${list(projectDirectory.slice(16, 25).map(project => [project.name, projectHref(project.id)]))}</div>
    <nav class="footer-social-links" aria-label="Réseaux sociaux" data-patateur="footer-social-card" data-patateur-wobble="4"><a href="https://www.instagram.com/amicale.coop/">↗ Instagram</a><a href="https://vimeo.com/amicale">↗ Vimeo</a><a href="https://www.facebook.com/AmicaleDeProduction/">↗ Facebook</a></nav>
    <div class="footer-credits"><p>admin → <a href="mailto:contact@amicale.coop">✉ Basile Lemasson</a></p><p>co-direction → <a href="mailto:contact@amicale.coop">✉ Sebastien Vial &amp; Samuel Hackwill</a></p></div>
    <div class="footer-address"><div class="footer-address-text">L’Amicale<br />34 Rue Louis Bergot<br />59000 Lille</div><a href="?page=lamicale" class="footer-logo"><img class="footer-logo-art" src="${publicAsset("footer-logo.png")}" alt="L’Amicale" /></a></div>
  </footer>`
}

export function bindSiteInteractions(root) {
  suggestNewsletterRegion(root.querySelector("#newsletter-region"))
  const menu = root.querySelector("#site-menu")
  const menuButton = root.querySelector("[data-menu-open]")
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches
  let menuAnimation
  let menuClosing = false
  const closeDialog = dialog => {
    if (dialog !== menu) { dialog.close(); return }
    if (!menu.open || menuClosing) return
    menuClosing = true
    const transform = getComputedStyle(menu).transform
    menuAnimation?.cancel()
    menu.classList.add("is-closing")
    menuAnimation = menu.animate([{ transform }, { transform: "translateX(100%)" }], {
      duration: reducedMotion ? 0 : 220, easing: "ease-in", fill: "forwards",
    })
    menuAnimation.finished.then(() => {
      menu.close()
      menuAnimation.cancel()
      menu.classList.remove("is-closing")
      menuClosing = false
    }).catch(() => {})
  }
  menuButton?.addEventListener("click", () => {
    if (!menu || menu.open) return
    menu.showModal()
    menuButton.setAttribute("aria-expanded", "true")
    menuAnimation = menu.animate([
      { transform: "translateX(100%)" }, { transform: "translateX(0)" },
    ], { duration: reducedMotion ? 0 : 280, easing: "cubic-bezier(0.22, 1, 0.36, 1)" })
  })
  menu?.addEventListener("cancel", event => { event.preventDefault(); closeDialog(menu) })
  menu?.addEventListener("close", () => menuButton?.setAttribute("aria-expanded", "false"))
  root.querySelectorAll("[data-dialog-close]").forEach(button => button.addEventListener("click", () => closeDialog(button.closest("dialog"))))
  root.querySelectorAll("dialog").forEach(dialog => dialog.addEventListener("click", event => {
    if (event.target !== dialog) return
    const box = dialog.getBoundingClientRect()
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) closeDialog(dialog)
  }))
  root.querySelector(".newsletter-form")?.addEventListener("submit", event => {
    event.preventDefault()
    const data = Object.fromEntries(new FormData(event.currentTarget))
    try { localStorage.setItem("amicale-demo-newsletter", JSON.stringify(data)) } catch {}
    root.querySelector(".newsletter-status").textContent = "Merci ! Inscription enregistrée pour cette démo."
  })
}
