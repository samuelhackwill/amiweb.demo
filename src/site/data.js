import { portraitForPerson } from "../data/people-portraits.js"
import projectDates from "../data/project-first-dates.json"

export const asset = (name) => `${import.meta.env.BASE_URL}assets/site/${name}`
export const publicAsset = (name) => `${import.meta.env.BASE_URL}assets/${name}`
export const projectHref = (id) => `?page=project&project=${encodeURIComponent(id)}`
export const personHref = (name) => `?person=${name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")}`

export const projects = [
  { id: "un-faible-degre-originalite", name: "Un Faible Degré d’Originalité", author: "Antoine Defoort", photo: "originalite.png", title: "title-originalite.svg", type: "spectacle", status: "création 27–28", description: "Une heure quinze pour retracer la rocambolesque histoire des droits d’auteurs du XVème siècle à nos jours." },
  { id: "de-la-sexualite-des-orchidees", name: "De la sexualité des orchidées", author: "Sofia Teillet", photo: "orchidees.png", title: "title-orchidees.svg", type: "spectacle", status: "création 27–28", description: "Car je fus, pendant un temps, garçon et fille, arbre et oiseau, et poisson muet dans la mer. (Empédocle)", italic: true },
  { id: "lenfance-majeure", name: "L’Enfance Majeure", author: "Julien Fournet", photo: "enfance.jpg", title: "title-enfance.svg", type: "spectacle", status: "en recherche", description: "Dans L’Enfance Majeure, la rue se transforme en un terrain de jeu carnavalesque où la puissance de l’enfance devient le moteur d’une micro-utopie." },
  { id: "tiret-du-six", name: "Le Tiret du Six", author: "Samuel Hackwill", photo: "tiret.jpg", title: "title-tiret.svg", type: "LAN Party", description: "On y parle du destin tragique du médecin de famille de Samuel qui n’aimait pas les ordinateurs." },
  { id: "germinal", name: "Germinal", author: "Halory Goerger, Antoine Defoort", photo: "germinal.png", title: "title-germinal.svg", type: "spectacle", description: "Si on avait la possibilité de repartir de zéro, à l’intérieur de huit mètres par dix, on ferait comment ?" },
]

const extraProjects = [
  { id: "tryhard", name: "Tryhard", author: "Samuel Hackwill", photo: "tryhard.jpg", titleUrl: publicAsset("project-title-tryhard.svg"), type: "jeu collectif", description: "Un jeu de foule basé sur les CAPTCHAs, que le public résout à l’aide de 56 souris connectées au même écran." },
  { id: "vitesse-80", name: "Vitesse 80", author: "Sébastien Vial", photo: "vitesse-outdoor.jpg", focus: "70% 50%", title: "title-vitesse.svg", type: "spectacle", description: "Une rencontre en mouvement, à partager dans l’espace public." },
  { id: "sauvez-vos-projets", name: "Sauvez vos projets", author: "Antoine Defoort", photo: "sauvez.png", type: "spectacle", description: "Une histoire de projets, de bifurcations et de possibilités." },
  { id: "le-plaisir-la-peur-et-le-triomphe", name: "Le plaisir, la peur et le triomphe", author: "Joaquim Fossi", photo: "plaisir.png", type: "spectacle", description: "Une invitation à traverser ensemble le plaisir, la peur et le triomphe." },
  { id: "les-thermes", name: "Les thermes", author: "Belinda Analoro", photo: "thermes.png", type: "installation", description: "Un espace pour se retrouver, prendre le temps et inventer d’autres manières d’être ensemble." },
  { id: "big-data-yoyo", name: "Big Data Yoyo", author: "Sébastien Vial", photo: "big-data.png", type: "spectacle", description: "Une expérience collective entre spectacle vivant et arts visuels." },
]

export const allProjects = [...projects, ...extraProjects]
export const projectDirectory = projectDates.projects.map(({ id, name }) => ({ id, name }))
export function getProject(id = "tiret-du-six") {
  const found = allProjects.find((item) => item.id === id)
  if (found) return found
  const entry = projectDirectory.find((item) => item.id === id)
  return entry ? { ...extraProjects[0], ...entry, titleUrl: null, title: null, author: "L’Amicale", description: "Une création accompagnée par l’Amicale. Le contenu de cette fiche est un exemple pour la démonstration du site." } : null
}

export const wheelPeople = [
  "Antoine Defoort", "Julien Fournet", "Sofia Teillet", "Samuel Hackwill",
  "Louise Siffert", "Joaquim Fossi", "Sébastien Vial",
].map(name => ({ id: name, label: name, alt: name, src: portraitForPerson(name) }))

export const gallery = [
  { photo: "gallery-performance.jpg", caption: "Le Tiret du Six — sur scène", video: true },
  { photo: "gallery-receipt.jpg", caption: "Un fragment du texte" },
  { photo: "gallery-audience.jpg", caption: "Le public joue en réseau" },
  { photo: "gallery-garden.jpg", caption: "Samuel Hackwill, en plein air" },
]

const year = new Date().getFullYear()
function dayOffset(offset) {
  const date = new Date()
  date.setDate(date.getDate() + offset)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}
const event = (id, project, city, venue, date, time = "19:00", extra = {}) => ({ id, project, city, venue, date, time, ...extra })
export const events = [
  event("today", "un-faible-degre-originalite", "Valenciennes", "Le Phénix scène nationale", dayOffset(0), "18:30"),
  event("tomorrow", "un-faible-degre-originalite", "Valenciennes", "Le Phénix scène nationale", dayOffset(1), "18:30"),
  event("friday", "de-la-sexualite-des-orchidees", "Paris", "La Maison des métallos", dayOffset(3)),
  event("sauvez-1", "sauvez-vos-projets", "Amiens", "Maison de la Culture", `${year}-11-10`),
  event("sauvez-2", "sauvez-vos-projets", "Amiens", "Maison de la Culture", `${year}-11-10`, "20:00"),
  event("vitesse-1", "vitesse-80", "Lille", "Festival Plaine d’été", `${year}-11-17`, "15:00"),
  event("vitesse-2", "vitesse-80", "Lille", "Festival Plaine d’été", `${year}-11-18`, "17:30"),
  event("vitesse-3", "vitesse-80", "Lille", "Festival Plaine d’été", `${year}-11-19`, "17:30"),
  event("yoyo", "big-data-yoyo", "Villeneuve-d’Ascq", "La rose des vents", `${year}-11-21`),
  event("tryhard-1", "tryhard", "Grenoble", "La Cinémathèque de Grenoble", `${year}-12-02`, "18:00"),
  event("tryhard-2", "tryhard", "Grenoble", "La Cinémathèque de Grenoble", `${year}-12-02`, "20:00"),
  event("tiret-1", "tiret-du-six", "Valenciennes", "Le Phénix scène nationale", `${year + 1}-03-13`),
  event("tiret-2", "tiret-du-six", "Valenciennes", "Le Phénix scène nationale", `${year + 1}-03-14`),
  event("tiret-3", "tiret-du-six", "Paris", "Théâtre de la Ville", `${year + 1}-03-20`),
  ...Array.from({ length: 6 }, (_, index) => event(`plaisir-${index}`, "le-plaisir-la-peur-et-le-triomphe", "Lyon", "Les SUBS", `${year}-12-${String(3 + index).padStart(2, "0")}`, index > 2 ? "15:30" : "20:00")),
  ...Array.from({ length: 6 }, (_, index) => event(`thermes-${index}`, "les-thermes", "Berlin", "HAU Hebbel am Ufer", `${year}-12-${25 + index}`, "09:00", { endTime: "18:00" })),
]
export const archives = events.slice(0, 12).map((item, index) => ({ ...item, id: `archive-${index}`, date: `${year - 1}-07-${String(index + 10).padStart(2, "0")}` }))

export const posts = [
  { id: "des-projets-vivants", title: "Des projets vivants, et des nouvelles de l’Amicale", date: "22 octobre 2026", photo: "enfance.jpg", excerpt: "Quelques nouvelles des projets, des personnes et de tout ce qui se fabrique entre les deux." },
  { id: "sur-la-route", title: "Sur la route avec Le Tiret du Six", date: "8 octobre 2026", photo: "tiret.jpg", excerpt: "Des ordinateurs, un réseau local et des histoires à partager. Retour sur quelques jours de tournée." },
  { id: "faire-ensemble", title: "Faire ensemble", date: "18 septembre 2026", photo: "gallery-garden.jpg", excerpt: "Prendre le temps de se rencontrer, de chercher et de mettre nos idées en commun." },
]
