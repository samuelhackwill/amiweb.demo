// Hand-drawn underline vectors from Figma's titresProjetMano components.
import underlines from "./project-underlines.json"
import { asset } from "./data.js"

export function underlineProjectTitle(project, imageMarkup, { source = project.title, className = "project-lettering", maxHeight } = {}) {
  const key = source?.split("/").pop()
  const art = underlines[key]
  if (!art) return imageMarkup
  // The stepped underline belongs to the right-aligned two-line title.
  if (project.title === "title-tiret.svg") imageMarkup = imageMarkup.replace(/src="[^"]*"/, `src="${asset("catalog-title-tiret.svg")}"`)
  const underline = art.svg.replace(/<svg[^>]*>/, tag => tag
    .replace(/\s(?:width|height)="[^"]*"/g, "")
    .replace("<svg", `<svg x="${art.x}" y="${art.y}" width="${art.underlineWidth}" height="${art.underlineHeight}" preserveAspectRatio="none"`))
  const width = maxHeight ? `;width:min(100%,${Math.min(art.width, maxHeight * art.width / art.height)}px)` : ""
  return `<span class="${className} catalog-lettering" style="aspect-ratio:${art.width} / ${art.height}${width}">${imageMarkup.replace(/class="[^"]*"/, 'class="catalog-lettering-image"')}<svg class="catalog-custom-underline" viewBox="0 0 ${art.width} ${art.height}" aria-hidden="true" focusable="false">${underline}</svg></span>`
}
