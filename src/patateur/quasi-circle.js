/** A smooth, seeded near-circle. Use a square box for circles or a rectangle for ovals. */
export function createQuasiCirclePath(width, height, { seed = 1, irregularity = 0.045 } = {}) {
  if (!(width > 0 && height > 0)) return ""
  let hash = 2166136261
  for (const char of String(seed)) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619)
  const phase = (hash >>> 0) / 4294967296 * Math.PI * 2
  const amount = Math.max(0, Math.min(0.1, irregularity))
  // Low frequency waves give rounded asymmetry without corners or tiny bumps.
  const point = angle => {
    const radius = 1 + amount * (0.65 * Math.sin(3 * angle + phase) + 0.35 * Math.cos(2 * angle - phase))
    const slope = amount * (1.95 * Math.cos(3 * angle + phase) - 0.7 * Math.sin(2 * angle - phase))
    const rx = width * 0.45, ry = height * 0.45
    return {
      x: width / 2 + rx * radius * Math.cos(angle),
      y: height / 2 + ry * radius * Math.sin(angle),
      dx: rx * (slope * Math.cos(angle) - radius * Math.sin(angle)),
      dy: ry * (slope * Math.sin(angle) + radius * Math.cos(angle)),
    }
  }
  const format = value => value.toFixed(3)
  const start = point(0)
  const path = [`M ${format(start.x)} ${format(start.y)}`]
  const step = Math.PI * 2 / 16
  for (let i = 0; i < 16; i++) {
    const a = point(i * step), b = point((i + 1) * step)
    path.push(`C ${format(a.x + a.dx * step / 3)} ${format(a.y + a.dy * step / 3)} ${format(b.x - b.dx * step / 3)} ${format(b.y - b.dy * step / 3)} ${format(b.x)} ${format(b.y)}`)
  }
  return `${path.join(" ")} Z`
}
