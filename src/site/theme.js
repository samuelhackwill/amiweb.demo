const storageKey = "amicale-demo-theme"

export const getTheme = () => document.documentElement.dataset.theme === "light" ? "light" : "dark"

function syncControls() {
  const light = getTheme() === "light"
  document.querySelectorAll("[data-theme-toggle]").forEach(button => {
    const label = light ? "Activer le mode sombre" : "Activer le mode clair"
    button.setAttribute("aria-label", label)
    button.setAttribute("title", label)
    button.setAttribute("aria-pressed", String(light))
  })
  document.querySelectorAll(".site-header").forEach(header => {
    const suffix = light || header.dataset.whiteWordmark === "true" ? "-white" : ""
    const picture = header.querySelector(".mobile-wordmark picture")
    if (!picture) return
    const prefix = `${import.meta.env.BASE_URL}assets/site/header-wordmark-`
    const variants = [[picture.querySelector("source"), "srcset", "mobile"], [picture.querySelector("img"), "src", "mobile"]]
    variants.forEach(([element, attribute, variant]) => {
      const url = `${prefix}${variant}${suffix}.svg`
      if (element.getAttribute(attribute) !== url) element.setAttribute(attribute, url)
    })
  })
}

function applyTheme(value, persist = false) {
  const theme = value === "light" ? "light" : "dark"
  document.documentElement.dataset.theme = theme
  document.documentElement.style.colorScheme = theme
  if (persist) {
    try { localStorage.setItem(storageKey, theme) } catch {}
  }
  syncControls()
  window.dispatchEvent(new CustomEvent("amicale:themechange", { detail:{ theme } }))
}

export function bindThemeToggle(root) {
  syncControls()
  root.querySelectorAll("[data-theme-toggle]").forEach(button => {
    if (button.dataset.themeBound) return
    button.dataset.themeBound = "true"
    button.addEventListener("click", () => applyTheme(getTheme() === "dark" ? "light" : "dark", true))
  })
}

export function initTheme() {
  let initial = document.documentElement.dataset.theme
  if (!initial) {
    try { initial = localStorage.getItem(storageKey) } catch {}
  }
  applyTheme(initial)
}

function onStorage(event) {
  if (!document.querySelector("#app")) return
  if (event.key === storageKey || event.key === null) applyTheme(event.newValue)
}
window.addEventListener("storage", onStorage)
if (import.meta.hot) import.meta.hot.dispose(() => window.removeEventListener("storage", onStorage))
