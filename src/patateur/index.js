import { decoratePatateur } from "./patateur.js"
import { createPatateurShape } from "./presets.js"
import "./patateur.css"
import "./site.css"

const decorations = new Map()
const masks = new Map()
const pendingMasks = new Set()
let maskObserver
let maskFrame = null

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char])

export function patateurLabel(label, seed, className = "section-title") {
  return `<div class="${escapeHtml(className)}" data-patateur="${escapeHtml(seed)}" data-patateur-wobble="3"><span>${escapeHtml(label)}</span></div>`
}

function optionsFor(element, seed) {
  const options = { seed, preset: element.dataset.patateurPreset || "bubble", wobble: Number(element.dataset.patateurWobble ?? 8) }
  for (const name of ["roundness", "irregularity"]) {
    const value = element.getAttribute(`data-patateur-${name}`)
    if (value !== null) options[name] = Number(value)
  }
  return options
}

function scheduleMask(instance) {
  pendingMasks.add(instance)
  if (maskFrame === null) maskFrame = requestAnimationFrame(drawMasks)
}

function drawMasks() {
  maskFrame = null
  const measurements = [...pendingMasks].map((instance) => ({
    instance,
    width: instance.element.clientWidth,
    height: instance.element.clientHeight,
  }))
  pendingMasks.clear()

  for (const { instance, width, height } of measurements) {
    if (width === 0 || height === 0) continue
    const options = optionsFor(instance.element, instance.element.dataset.patateurMask)
    const key = JSON.stringify([width, height, options])
    if (key === instance.lastKey) continue
    // The POC's minimum corner radius needs a larger drawing box for tiny
    // calendar/menu thumbnails. Scale the generated SVG down with its viewBox.
    const scale = Math.max(1, 64 / Math.min(width, height))
    const drawingWidth = width * scale
    const drawingHeight = height * scale
    const d = createPatateurShape(drawingWidth, drawingHeight, {
      ...options,
      wobble: options.wobble * scale,
      padX: Math.min(30, drawingWidth * 0.28),
      padY: Math.min(22, drawingHeight * 0.28),
    })
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${drawingWidth} ${drawingHeight}" preserveAspectRatio="none"><path fill="white" d="${d}"/></svg>`
    instance.element.style.setProperty("--patateur-mask", `url("data:image/svg+xml,${encodeURIComponent(svg)}")`)
    instance.lastKey = key
  }
}

function destroyMask(instance) {
  maskObserver.unobserve(instance.element)
  pendingMasks.delete(instance)
  instance.element.classList.remove("patateur-image-mask")
  instance.element.style.removeProperty("--patateur-mask")
  masks.delete(instance.element)
  if (pendingMasks.size === 0 && maskFrame !== null) {
    cancelAnimationFrame(maskFrame)
    maskFrame = null
  }
}

// Called after page renders and instant-preview updates. Existing elements keep
// their decoration; removed ones release their observers before replacement.
export function syncPatateurs(root = document.querySelector("#app")) {
  for (const [element, controller] of decorations) {
    if (!root.contains(element)) {
      controller.destroy()
      decorations.delete(element)
    }
  }
  for (const [element, instance] of masks) {
    if (!root.contains(element)) destroyMask(instance)
  }
  root.querySelectorAll("[data-patateur]").forEach((element) => {
    const controller = decoratePatateur(element, optionsFor(element, element.dataset.patateur))
    decorations.set(element, controller)
  })
  root.querySelectorAll("[data-patateur-mask]").forEach((element) => {
    let instance = masks.get(element)
    if (!instance) {
      instance = { element, lastKey: null }
      masks.set(element, instance)
      element.classList.add("patateur-image-mask")
      maskObserver ??= new ResizeObserver((entries) => {
        for (const entry of entries) {
          const instance = masks.get(entry.target)
          if (instance) scheduleMask(instance)
        }
      })
      maskObserver.observe(element)
    }
    scheduleMask(instance)
  })
}

export function destroyPatateurs() {
  for (const controller of decorations.values()) controller.destroy()
  decorations.clear()
  for (const instance of masks.values()) destroyMask(instance)
}

if (import.meta.hot) import.meta.hot.dispose(destroyPatateurs)
