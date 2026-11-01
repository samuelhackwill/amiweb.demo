// These filenames are the source of truth for portrait identities.
const files = [
  "antoine_defoort.jpg", "julien_fournet.jpg", "sofia_teillet.jpg",
  "samuel_hackwill.jpg", "louise_siffert.jpg", "Joaquim_Fossi.jpg",
  "sebastien_vial.jpg", "marion_le_guerroue.jpg", "thomas_riou.jpg",
  "celestine_dahan.jpg", "kevin_defrennes.jpg", "Lorette_Moreau.jpg", "marine_thevenet.jpg",
]
const key = name => name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")
const portraits = new Map(files.map(file => [key(file.replace(/\.jpg$/, "")), file]))

export function portraitForPerson(name) {
  const file = portraits.get(key(name))
  return file ? `${import.meta.env.BASE_URL}assets/amicale/${file}` : null
}

export function placeholderPortrait() {
  return `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path fill="#666" d="M0 0h100v100H0z"/><circle cx="50" cy="35" r="18" fill="#aaa"/><path fill="#aaa" d="M15 100V85a35 35 0 0 1 70 0v15z"/></svg>')}`
}
