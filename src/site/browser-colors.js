// Browser chrome has one theme color; follow the footer at the viewport's bottom.
// Keep the actual content gray while the canvas/safe-area color follows the page.
const root = document.documentElement
const app = document.querySelector("#app")
const theme = document.querySelector('meta[name="theme-color"]')
let frame = null
let previousColor
let previousViewportWidth

function update() {
  frame = null
  // Viewport units include classic scrollbars; full-width artwork must not.
  const viewportWidth = root.clientWidth
  if (viewportWidth !== previousViewportWidth) {
    previousViewportWidth = viewportWidth
    root.style.setProperty("--site-viewport-width", `${viewportWidth}px`)
  }
  let progress = 0
  const footer = app?.querySelector(".site-footer")
  if (footer && footer.offsetHeight > 0) {
    const bounds = footer.getBoundingClientRect()
    const viewport = window.visualViewport
    const bottom = viewport ? viewport.offsetTop + viewport.height : innerHeight
    const pixelStop = getComputedStyle(footer).backgroundImage.match(/([\d.]+)px\)/)
    const zoom = parseFloat(getComputedStyle(app).zoom) || 1
    const fadeHeight = pixelStop ? Number(pixelStop[1]) * zoom : bounds.height * 0.38
    progress = Math.max(0, Math.min(1, (bottom - bounds.top) / Math.max(1, fadeHeight)))
  }
  const styles = getComputedStyle(root)
  const rgb = (property, fallback) => {
    const hex = styles.getPropertyValue(property).trim().replace("#", "")
    return /^[0-9a-f]{6}$/i.test(hex) ? [0,2,4].map(i => parseInt(hex.slice(i,i+2),16)) : fallback
  }
  const start = rgb("--theme-edge-start", [58,58,58])
  const end = rgb("--theme-edge-end", [0,0,0])
  const color = "#" + start.map((channel,i) => Math.round(channel + (end[i]-channel)*progress).toString(16).padStart(2,"0")).join("")
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
resize.observe(root)
if (app) {
  resize.observe(app)
  content.observe(app, { childList: true })
}
window.addEventListener("scroll", schedule, { passive: true })
window.addEventListener("resize", schedule, { passive: true })
window.addEventListener("amicale:themechange", schedule)
window.visualViewport?.addEventListener("resize", schedule, { passive: true })
window.visualViewport?.addEventListener("scroll", schedule, { passive: true })
schedule()

if (import.meta.hot) import.meta.hot.dispose(() => {
  if (frame !== null) cancelAnimationFrame(frame)
  resize.disconnect()
  content.disconnect()
  window.removeEventListener("scroll", schedule)
  window.removeEventListener("resize", schedule)
  window.removeEventListener("amicale:themechange", schedule)
  window.visualViewport?.removeEventListener("resize", schedule)
  window.visualViewport?.removeEventListener("scroll", schedule)
  root.style.removeProperty("--browser-edge-color")
  root.style.removeProperty("--site-viewport-width")
  theme?.setAttribute("content", root.dataset.theme === "light" ? "#eeeeee" : "#3a3a3a")
})
