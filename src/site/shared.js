import { getTheme, bindThemeToggle } from "./theme.js"
import { suggestNewsletterRegion } from "./newsletter-region.js"
import { asset, publicAsset, allProjects, projectDirectory, projectHref, personHref } from "./data.js"

export const esc = (value = "") => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char])
const navItems = [
  ["home", "Projets", "?page=home#top"],
  ["calendar", "Calendrier", "?page=calendar"],
  ["amicale", "L’Amicale", "?page=lamicale"],
  ["blog", "Blog", "?page=blog"],
]

export function siteHeader({ active = "home", whiteWordmark = false } = {}) {
  const wordmarkSuffix = whiteWordmark || getTheme() === "light" ? "-white" : ""
  return `<header class="topbar site-header" id="top" data-active-section="${esc(active)}" data-white-wordmark="${whiteWordmark}"><div class="mobile-header"><a class="mobile-wordmark" href="?page=home" aria-label="Accueil de l’Amicale"><picture><source media="(min-width:681px)" srcset="${asset(`header-wordmark-mobile${wordmarkSuffix}.svg`)}" /><img src="${asset(`header-wordmark-mobile${wordmarkSuffix}.svg`)}" alt="L’Amicale" /></picture></a><button class="mobile-sun" type="button" data-theme-toggle aria-label="Activer le mode clair" aria-pressed="false"><img src="${publicAsset("theme.svg")}" alt="" /></button><button class="menu-open" type="button" data-menu-open aria-expanded="false" aria-haspopup="dialog" aria-controls="site-menu"><span class="menu-lines" aria-hidden="true"></span> Menu</button></div></header>`
}

export function siteMenu() {
  return `<dialog class="site-menu" id="site-menu" aria-label="Menu de navigation"><button class="menu-close" type="button" data-dialog-close data-patateur="menu-close" data-patateur-preset="round" data-patateur-wobble="2" aria-label="Fermer le menu"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="M4 4 20 20M20 4 4 20" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" /></svg></button><nav class="menu-primary" aria-label="Navigation principale">${navItems.map(([, label, href]) => `<a href="${href}">${label}</a>`).join("")}</nav><nav class="menu-projects" aria-label="Les projets">${allProjects.map((project) => `<a href="${projectHref(project.id)}"><span class="menu-thumb" data-patateur-mask="menu-${esc(project.id)}" data-patateur-preset="project" data-patateur-wobble="1"><img src="${asset(project.photo)}" style="object-position:${project.focus || "center"}" alt="" loading="lazy" /></span><i>${esc(project.name)}</i></a>`).join("")}</nav></dialog>`
}

export function siteFooter({ newsletter = true, variant = "default", desktopOnly = false } = {}) {
  const locationGroups = [
    [
      "France — régions",
      [
        "Auvergne-Rhône-Alpes",
        "Bourgogne-Franche-Comté",
        "Bretagne",
        "Centre-Val de Loire",
        "Corse",
        "Grand Est",
        "Guadeloupe",
        "Guyane",
        "Hauts-de-France",
        "Île-de-France",
        "La Réunion",
        "Martinique",
        "Mayotte",
        "Normandie",
        "Nouvelle-Aquitaine",
        "Occitanie",
        "Pays de la Loire",
        "Provence-Alpes-Côte d’Azur",
      ],
    ],
    ["Autres pays", ["Belgique", "Suisse", "Pays-Bas", "Italie", "Allemagne"]],
    ["Autres zones", ["Amériques", "Asie et Océanie", "Afrique"]],
  ]
  const locationOptions = locationGroups
    .map(([label, places]) => `<optgroup label="${esc(label)}">${places.map((place) => `<option value="${esc(place)}"${place === "Hauts-de-France" ? " selected" : ""}>${esc(place)}</option>`).join("")}</optgroup>`)
    .join("")
  const authors = ["Julien Fournet", "Joaquim Fossi", "Samuel Hackwill", "Antoine Defoort", "Louise Siffert", "Sebastien Vial", "Sofia Teillet"]
  const list = (items) => items.map(([label, href]) => `<a class="footer-link" href="${href}">${esc(label)}</a>`).join("")
  const address = `<div class="footer-address"><div class="footer-address-text">L’Amicale<br />34 Rue Louis Bergot<br />59000 Lille</div><a href="?page=lamicale" class="footer-logo"><img class="footer-logo-art" src="${publicAsset("footer-logo.png")}" alt="L’Amicale" /></a></div>`
  return `<footer class="footer site-footer footer--desktop-compact${desktopOnly ? " site-footer--desktop-only" : ""}${newsletter ? "" : " footer--without-newsletter"}${variant === "bio" ? " site-footer--bio" : ""}" id="footer">
    ${
      newsletter
        ? `<div class="footer-newsletter" data-patateur="footer-newsletter-card" data-patateur-wobble="7">
      <div class="socials"><a href="https://www.instagram.com/amicale.coop/" aria-label="Instagram">◎</a><a href="https://www.facebook.com/AmicaleDeProduction/" aria-label="Facebook">f</a><a href="https://vimeo.com/amicale" aria-label="Vimeo">v</a></div>
      <p>Au fait on a une newsletter semestrielle à laquelle vous pouvez vous inscrire ici :</p>
      <form class="newsletter-form">
        <label class="fake-field" for="newsletter-email">Adresse mail</label>
        <input class="fake-input" id="newsletter-email" name="email" type="email" autocomplete="email" placeholder="jeanbob@gmail.com" required />
        <label class="fake-field" for="newsletter-region">Région / Pays</label>
        <select class="fake-input" id="newsletter-region" name="region">${locationOptions}</select>
        <button class="submit-button" data-patateur="newsletter-submit" data-patateur-wobble="4" type="submit">Allez c’est parti</button>
        <p class="newsletter-status" role="status"></p>
      </form>
    </div>`
        : ""
    }
    ${variant === "bio" ? address : ""}
    <div class="footer-column"><strong>Navigation</strong>${list([
      ["Accueil", "?page=home"],
      ["L’Amicale", "?page=lamicale"],
      ["Calendrier", "?page=calendar"],
      ["Blog", "?page=blog"],
    ])}<br /><strong>Associés</strong>${list(authors.map((name) => [name, personHref(name)]))}</div>
    <div class="footer-column"><strong>Projets</strong>${list(projectDirectory.slice(0, 16).map((project) => [project.name, projectHref(project.id)]))}</div>
    <div class="footer-column"><strong>Les thermes</strong>${list(projectDirectory.slice(16, 25).map((project) => [project.name, projectHref(project.id)]))}</div>
    <nav class="footer-social-links" aria-label="Réseaux sociaux" data-patateur="footer-social-card" data-patateur-wobble="4"><a href="https://www.instagram.com/amicale.coop/">↗ Instagram</a><a href="https://vimeo.com/amicale">↗ Vimeo</a><a href="https://www.facebook.com/AmicaleDeProduction/">↗ Facebook</a></nav>
    <div class="footer-credits"><p>admin → <a href="mailto:contact@amicale.coop"><span aria-hidden="true">✉️</span> Basile Lemasson</a></p><p>co-direction → <a href="mailto:contact@amicale.coop"><span aria-hidden="true">✉️</span> Sebastien Vial &amp; Samuel Hackwill</a></p></div>
    ${variant === "bio" ? "" : address}
  </footer>`
}

export function bindSiteInteractions(root) {
  bindThemeToggle(root)
  suggestNewsletterRegion(root.querySelector("#newsletter-region"))
  const menu = root.querySelector("#site-menu")
  const menuButton = root.querySelector("[data-menu-open]")
  const activeSection = root.querySelector(".site-header")?.dataset.activeSection
  menu?.querySelectorAll(".menu-primary a").forEach((link, index) => {
    if (navItems[index]?.[0] === activeSection) link.setAttribute("aria-current", "page")
  })
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches
  let menuAnimation
  let menuClosing = false
  const hiddenMenuTransform = () => `translateX(${getComputedStyle(menu).getPropertyValue("--menu-offscreen-x").trim()})`
  const closeDialog = (dialog) => {
    if (dialog !== menu) {
      dialog.close()
      return
    }
    if (!menu.open || menuClosing) return
    menuClosing = true
    const transform = getComputedStyle(menu).transform
    menuAnimation?.cancel()
    menu.classList.add("is-closing")
    menuAnimation = menu.animate([{ transform }, { transform: hiddenMenuTransform() }], {
      duration: reducedMotion ? 0 : 220,
      easing: "ease-in",
      fill: "forwards",
    })
    menuAnimation.finished
      .then(() => {
        menu.close()
        menuAnimation.cancel()
        menu.classList.remove("is-closing")
        menuClosing = false
      })
      .catch(() => {})
  }
  menuButton?.addEventListener("click", () => {
    if (!menu || menu.open) return
    menu.showModal()
    menu.scrollTop = 0
    menuButton.setAttribute("aria-expanded", "true")
    menuAnimation = menu.animate([{ transform: hiddenMenuTransform() }, { transform: "translateX(0)" }], { duration: reducedMotion ? 0 : 280, easing: "cubic-bezier(0.22, 1, 0.36, 1)" })
  })
  menu?.addEventListener("cancel", (event) => {
    event.preventDefault()
    closeDialog(menu)
  })
  menu?.addEventListener("close", () => menuButton?.setAttribute("aria-expanded", "false"))
  root.querySelectorAll("[data-dialog-close]").forEach((button) => button.addEventListener("click", () => closeDialog(button.closest("dialog"))))
  root.querySelectorAll("dialog").forEach((dialog) =>
    dialog.addEventListener("click", (event) => {
      if (event.target !== dialog) return
      const box = dialog.getBoundingClientRect()
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) closeDialog(dialog)
    }),
  )
  root.querySelector(".newsletter-form")?.addEventListener("submit", (event) => {
    event.preventDefault()
    const data = Object.fromEntries(new FormData(event.currentTarget))
    try {
      localStorage.setItem("amicale-demo-newsletter", JSON.stringify(data))
    } catch {}
    root.querySelector(".newsletter-status").textContent = "Merci ! Inscription enregistrée pour cette démo."
  })
}
