import { maskExperiments } from "./mask-experiments.js"
import "./mask-lab.css"

const root = document.querySelector("#mask-lab")
const params = new URLSearchParams(location.search)
let seed = Number(params.get("seed")) || 1
const photos = ["originalite.png", "orchidees.png", "enfance.jpg", "tiret.jpg", "germinal.png"]
root.innerHTML = `
  <header><a href="${import.meta.env.BASE_URL}">← Retour au site</a><h1>Essais de masques</h1>
    <p>Deux finalistes : I3 et G2 affiné. Même grain fin et mêmes accidents occasionnels, avec des coins plus inégaux pour G2. Cinq masques par essai.</p>
  </header>
  <div class="controls">
    <label>Format <select id="format"><option value="square">Carré</option><option value="landscape">Paysage</option></select></label>
    <label><input type="checkbox" id="solid" /> Silhouettes sans photo</label>
    <label><input type="checkbox" id="enlarge" /> Agrandir les masques</label>
    <button id="shuffle" type="button">Autres variations</button>
    <span id="variation" role="status"></span>
  </div>
  <div class="experiments">${maskExperiments.map(experiment => `
    <section class="experiment" aria-labelledby="title-${experiment.id}">
      <h2 id="title-${experiment.id}"><span>${experiment.id}</span> ${experiment.name}</h2>
      <p>${experiment.description}</p>
      <div class="samples">${photos.map((photo, index) => `
        <div class="sample-frame"><div class="sample" data-experiment="${experiment.id}" data-sample="${index}">
          <img src="${import.meta.env.BASE_URL}assets/site/${photo}" alt="Exemple ${index + 1}, masque ${experiment.id}" />
        </div><span class="sample-number">${experiment.id} · ${index + 1}</span></div>`).join("")}</div>
    </section>`).join("")}</div>`

function renderMasks() {
  const landscape = root.querySelector("#format").value === "landscape"
  const width = 160, height = landscape ? 112 : 160
  root.classList.toggle("solid", root.querySelector("#solid").checked)
  for (const element of root.querySelectorAll(".sample")) {
    const experiment = maskExperiments.find(item => item.id === element.dataset.experiment)
    element.style.aspectRatio = `${width} / ${height}`
    if (experiment.assets) {
      element.style.setProperty("--mask", `url("${experiment.assets[Number(element.dataset.sample)]}")`)
    } else {
      const path = experiment.draw(width, height, `variation-${seed}-photo-${element.dataset.sample}`)
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}"><path fill="white" d="${path}"/></svg>`
      element.style.setProperty("--mask", `url("data:image/svg+xml,${encodeURIComponent(svg)}")`)
    }
  }
  root.querySelector("#variation").textContent = `Variation ${seed}`
}
root.querySelector("#format").addEventListener("change", renderMasks)
root.querySelector("#solid").addEventListener("change", renderMasks)
root.querySelector("#enlarge").addEventListener("change", event => root.classList.toggle("enlarged", event.target.checked))
root.querySelector("#shuffle").addEventListener("click", () => {
  seed += 1
  const url = new URL(location.href)
  url.searchParams.set("seed", seed)
  history.replaceState(null, "", url)
  renderMasks()
})
renderMasks()
