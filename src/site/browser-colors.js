// Browser chrome has one theme color; follow the footer at the viewport's bottom.
// Keep the actual content gray while the canvas/safe-area color follows the page.
const root = document.documentElement
const app = document.querySelector("#app")
const theme = document.querySelector('meta[name="theme-color"]')
let frame = null
let previousColor

function update() {
  frame = null
  let progress = 0
  const footer = app?.querySelector(".site-footer")
  if (footer) {
    const bounds = footer.getBoundingClientRect()
    const viewport = window.visualViewport
    const bottom = viewport ? viewport.offsetTop + viewport.height : innerHeight
    const pixelStop = getComputedStyle(footer).backgroundImage.match(/([\d.]+)px\)/)
    const zoom = parseFloat(getComputedStyle(app).zoom) || 1
    const fadeHeight = pixelStop ? Number(pixelStop[1]) * zoom : bounds.height * 0.38
    progress = Math.max(0, Math.min(1, (bottom - bounds.top) / Math.max(1, fadeHeight)))
  }
  const channel = Math.round(58 + (27 - 58) * progress).toString(16).padStart(2, "0")
  const color = `#${channel}${channel}${channel}`
  if (color === previousColor) return
  previousColor = color
  root.style.setProperty("--browser-edge-color", color)
  theme?.setAttribute("content", color)
}

function schedule() {
  if (frame === null) frame = requestAnimationFrame(update)
}

const resize = new ResizeObserver(schedule)
const content = new MutationObserver(schedule)
if (app) {
  resize.observe(app)
  content.observe(app, { childList: true })
}
window.addEventListener("scroll", schedule, { passive: true })
window.addEventListener("resize", schedule, { passive: true })
window.visualViewport?.addEventListener("resize", schedule, { passive: true })
window.visualViewport?.addEventListener("scroll", schedule, { passive: true })
schedule()

if (import.meta.hot) import.meta.hot.dispose(() => {
  if (frame !== null) cancelAnimationFrame(frame)
  resize.disconnect()
  content.disconnect()
  window.removeEventListener("scroll", schedule)
  window.removeEventListener("resize", schedule)
  window.visualViewport?.removeEventListener("resize", schedule)
  window.visualViewport?.removeEventListener("scroll", schedule)
  root.style.removeProperty("--browser-edge-color")
  theme?.setAttribute("content", "#3a3a3a")
})
