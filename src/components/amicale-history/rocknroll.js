// Drawing functions adapted directly from POC-amiweb-frise-rocknroll, commit 4e857b1.
// Preserve the shared curve and clipped concentric strokes when roles overlap.
const SVG_NS = "http://www.w3.org/2000/svg"
function createSvg(tag, attrs = {}) {
  const element = document.createElementNS(SVG_NS, tag)
  Object.entries(attrs).forEach(([name, value]) => element.setAttribute(name, String(value)))
  return element
}

export function drawPeriods(group, person, y, chart, roles, prefix) {
  const roleById = new Map(roles.map(role => [role.id, role]));
  const periods = normalizedPeriods(person)
    .map((period) => ({
      ...period,
      start: clamp(period.start, chart.startYear, chart.endYear),
      end: clamp(period.end ?? chart.currentYear, chart.startYear, chart.endYear),
    }))
    .filter((period) => period.end > period.start);
  if (periods.length === 0) return;

  const boundaries = [...new Set(periods.flatMap((period) => [period.start, period.end]))]
    .sort((a, b) => a - b);
  const path = createRockLinePath(
    xForYear(boundaries[0], chart),
    xForYear(boundaries.at(-1), chart),
    y,
    person.id,
  );

  // Clip a shared curve at role changes so overlapping strokes stay concentric.
  boundaries.slice(0, -1).forEach((start, segmentIndex) => {
    const end = boundaries[segmentIndex + 1];
    const active = periods
      .filter((period) => period.start < end && period.end > start)
      .sort((a, b) => (roleById.get(a.role) ?? roles[0]).tier
        - (roleById.get(b.role) ?? roles[0]).tier);
    if (active.length === 0) return;

    const clipId = `${prefix}-period-clip-${person.id}-${y}-${segmentIndex}`;
    const clip = createSvg("clipPath", { id: clipId });
    clip.append(createSvg("rect", {
      x: xForYear(start, chart),
      y: y - chart.rowHeight / 2,
      width: xForYear(end, chart) - xForYear(start, chart),
      height: chart.rowHeight,
    }));
    group.append(clip);

    active.forEach((period, index) => {
      const role = roleById.get(period.role) ?? roles[0];
      group.append(createSvg("path", {
        d: path,
        class: "person-period",
        "clip-path": `url(#${clipId})`,
        fill: "none",
        stroke: role.color,
        "stroke-width": Math.max(2, 24 - index * 8),
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
      }));
    });
  });
}

function createRockLinePath(x1, x2, y, seed) {
  const length = x2 - x1;
  const bendA = (seededNumber(`${seed}-a`) - 0.5) * 7;
  const bendB = (seededNumber(`${seed}-b`) - 0.5) * 7;
  const endBend = (seededNumber(`${seed}-c`) - 0.5) * 2.8;

  if (length < 70) {
    return `M ${x1.toFixed(2)} ${y.toFixed(2)} C ${(x1 + length * 0.38).toFixed(2)} ${(y + bendA).toFixed(2)} ${(x1 + length * 0.62).toFixed(2)} ${(y + bendB).toFixed(2)} ${x2.toFixed(2)} ${(y + endBend).toFixed(2)}`;
  }

  const mid = x1 + length * (0.48 + (seededNumber(`${seed}-m`) - 0.5) * 0.08);

  return [
    `M ${x1.toFixed(2)} ${y.toFixed(2)}`,
    `C ${(x1 + length * 0.24).toFixed(2)} ${(y + bendA).toFixed(2)} ${(mid - length * 0.16).toFixed(2)} ${(y - bendB).toFixed(2)} ${mid.toFixed(2)} ${(y + bendB * 0.55).toFixed(2)}`,
    `C ${(mid + length * 0.16).toFixed(2)} ${(y + bendA).toFixed(2)} ${(x2 - length * 0.24).toFixed(2)} ${(y - bendB).toFixed(2)} ${x2.toFixed(2)} ${(y + endBend).toFixed(2)}`,
  ].join(" ");
}

export function starPath(cx, cy, outerRadius, innerRadius, points, rotation = 0) {
  const commands = [];
  const steps = points * 2;
  const offset = (-90 + rotation) * (Math.PI / 180);

  for (let index = 0; index < steps; index += 1) {
    const radius = index % 2 === 0 ? outerRadius : innerRadius;
    const angle = offset + (index / steps) * Math.PI * 2;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;

    commands.push(`${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`);
  }

  commands.push("Z");
  return commands.join(" ");
}

function xForYear(year, chart) {
  return chart.left + (year - chart.startYear) * chart.yearWidth;
}

function normalizedPeriods(person) {
  return [...person.periods]
    .filter((period) => Number.isFinite(period.start))
    .sort((a, b) => a.start - b.start);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function seededNumber(input) {
  let hash = 2166136261;
  const value = String(input);

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0) / 4294967295;
}

