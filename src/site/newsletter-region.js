// IP-based suggestion only: https://ipapi.co/api/ . Manual choices take priority.
const frenchRegions = {
  ARA: "Auvergne-Rhône-Alpes", BFC: "Bourgogne-Franche-Comté", BRE: "Bretagne",
  CVL: "Centre-Val de Loire", COR: "Corse", GES: "Grand Est", HDF: "Hauts-de-France",
  IDF: "Île-de-France", NOR: "Normandie", NAQ: "Nouvelle-Aquitaine", OCC: "Occitanie",
  PDL: "Pays de la Loire", PAC: "Provence-Alpes-Côte d’Azur",
}
const countries = {
  BE: "Belgique", CH: "Suisse", NL: "Pays-Bas", IT: "Italie", DE: "Allemagne",
  GP: "Guadeloupe", GF: "Guyane", RE: "La Réunion", MQ: "Martinique", YT: "Mayotte",
}
const continents = { NA: "Amériques", SA: "Amériques", AS: "Asie et Océanie", OC: "Asie et Océanie", AF: "Afrique" }
const normalize = value => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z]/g, "")
const cacheKey = "amicale-newsletter-region-guess"
const choiceKey = "amicale-newsletter-region-choice"
let pendingGuess

function guessRegion() {
  try {
    const cached = sessionStorage.getItem(cacheKey)
    if (cached !== null) return Promise.resolve(cached || null)
  } catch {}
  pendingGuess ??= (async () => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 4000)
    let guess = null
    try {
      const response = await fetch("https://ipapi.co/json/", {
        signal: controller.signal, credentials: "omit", referrerPolicy: "no-referrer",
      })
      if (!response.ok) throw new Error("Location lookup unavailable")
      const data = await response.json()
      if (!data.error) {
        const country = data.country_code || data.country
        const code = String(data.region_code || "").replace(/^FR-/, "")
        guess = countries[country] || (country === "FR" ? frenchRegions[code] || data.region : continents[data.continent_code]) || null
      }
    } catch {} finally { clearTimeout(timeout) }
    // Cache only the suggested label, never the IP or full location response.
    try { sessionStorage.setItem(cacheKey, guess || "") } catch {}
    return guess
  })()
  return pendingGuess
}

export function suggestNewsletterRegion(select) {
  if (!select) return
  const matchingOption = value => [...select.options].find(option => normalize(option.value) === normalize(value))
  let manuallyChosen = false
  select.addEventListener("change", () => {
    manuallyChosen = true
    try { localStorage.setItem(choiceKey, select.value) } catch {}
  })
  try {
    const saved = localStorage.getItem(choiceKey) || JSON.parse(localStorage.getItem("amicale-demo-newsletter") || "null")?.region
    const option = matchingOption(saved)
    if (option) { select.value = option.value; return }
  } catch {}
  const initialValue = select.value
  guessRegion().then(guess => {
    if (!select.isConnected || manuallyChosen || select.value !== initialValue) return
    const option = matchingOption(guess)
    if (!option) return
    select.value = option.value
  })
}
