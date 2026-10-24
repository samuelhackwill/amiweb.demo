import { createPatateurPath } from "./patateur-path.js"
import { createQuasiCirclePath } from "./quasi-circle.js"
import { createProjectMaskPath, projectMaskDefaults } from "./project-mask.js"

// Proportions of the shorter side; tune the site’s shapes here.
export const shapePresets = {
  bubble: {},
  round: { irregularity: 0.035 },
  project: projectMaskDefaults,
}

export function createPatateurShape(width, height, options = {}) {
  const { preset = "bubble", seed = 1 } = options
  const settings = { ...shapePresets[preset], ...options }
  if (preset === "bubble") return createPatateurPath(width, height, options)
  if (preset === "round") return createQuasiCirclePath(width, height, { seed, irregularity: settings.irregularity })
  if (preset === "project") return createProjectMaskPath(width, height, settings)
  throw new TypeError(`Unknown Patateur preset: ${preset}`)
}
