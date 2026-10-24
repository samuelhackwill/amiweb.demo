import { createProjectMaskPath } from "./project-mask.js"

export const maskExperiments = [
  { id: "I3", name: "Grain fin, forme douce", description: "La version I3 : petites corrections de trajectoire, contours rugueux et quelques accidents occasionnels.",
    draw: (w,h,seed)=>createProjectMaskPath(w,h,{seed,mistake:0.018,spread:0.45}) },
  { id: "G2", name: "Coins à la main — affinés", description: "La version retenue pour le site : coins inégaux, grain fin et petits accidents occasionnels.",
    draw: (w,h,seed)=>createProjectMaskPath(w,h,{seed}) },
]
