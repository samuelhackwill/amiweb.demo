<!-- Adapted from samuelhackwill/POC-roue-amiweb, MultiWheelPrototype.vue (54adad7).
     Keep the connected-slot, drag, inertia and snapping engine in sync with the POC. -->
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import vectorCircleSvg from './vector-circle.svg?raw'
const portraitMaskAssets = import.meta.glob('./Vector *.svg', { query: '?raw', import: 'default', eager: true }) as Record<string, string>

type PersonItem = {
  id: string | number
  src: string
  alt?: string
  label?: string
  code?: string
  href?: string
  focusX?: number
  focusY?: number
}

type Point = {
  x: number
  y: number
}

type Wheel = Point & {
  id: number
  code: string
}

type SharedEdge = {
  leftWheel: number
  rightWheel: number
}

type SlotToken = number | null

type DisplaySlot = Point & {
  key: string
  occupied: boolean
}

type DisplayPortrait = Point & {
  key: string
  token: number
  src: string
  clipId: string
  clipUrl: string
}

type DisplayInitial = Point & {
  key: string
  text: string
  inside: boolean
  arrowRotation: number | null
}

type NameListItem = {
  token: number
  label: string
  initials: string
  familyName: string
}

type RosterPerson = {
  code: string
  label: string
  familyName: string
}

type MultiWheelPrototypeProps = {
  items?: PersonItem[]
  compact?: boolean
  desktopPortraitScale?: number
}

const props = withDefaults(defineProps<MultiWheelPrototypeProps>(), {
  items: () => [],
  compact: false,
  desktopPortraitScale: 1,
})

const MIN_PEOPLE = 1
const WHEEL_SLOT_COUNT = 10
const WHEEL_RADIUS = 96
const WHEEL_SPACING = WHEEL_RADIUS * 2
const WHEEL_MARGIN_X = 150
const VIEWBOX_HEIGHT = 360
const BASE_VIEWBOX_WIDTH = 900
const PORTRAIT_WIDTH = 44
const PORTRAIT_HEIGHT = 44
const OUTER_LABEL_RADIUS = WHEEL_RADIUS + 50
const INNER_LABEL_RADIUS = WHEEL_RADIUS - 42
const INNER_LABEL_OFFSET_X = -26
const LEFT_SHOULDER_LABEL_OFFSET_X = 24
const LEFT_SHOULDER_LABEL_OFFSET_Y = 18
const SNAP_DURATION_MS = 260
const RELEASE_INERTIA_MS = 420
const RELEASE_INERTIA_FACTOR = 170
const HOVER_RELEASE_DELAY_MS = 200
const WHEEL_CODES = ['HG', 'AB', 'RM', 'MM', 'SB', 'SC', 'RL', 'GO', 'JD', 'SM']
const nameCollator = new Intl.Collator('fr', { numeric: true, sensitivity: 'base' })
const DEFAULT_PEOPLE_COUNT = Math.max(MIN_PEOPLE, props.items.length)


const svgElement = ref<SVGSVGElement | null>(null)
const svgRenderedWidth = ref(256)
const mobileReadingSize = ref(16)
const labelsMeasured = ref(false)
let svgSizeObserver: ResizeObserver | undefined
const activeWheelId = ref<number | null>(null)
const dragRotation = ref(0)
const isSnapping = ref(false)
const peopleCount = ref(DEFAULT_PEOPLE_COUNT)
const hoveredToken = ref<number | null>(null)
const hasNameListExpanded = ref(false)
const wheelVectorRotations = ref(Array(wheelCountForPeople(DEFAULT_PEOPLE_COUNT)).fill(0))
let lastPointerAngle = 0
let lastPointerTime = 0
let angularVelocity = 0
let snapFrameId: number | null = null
let hoverReleaseTimer: ReturnType<typeof setTimeout> | null = null
let dragPointerId: number | null = null
let pointerStart: Point = { x: 0, y: 0 }
const movedPointer = ref(false)
let suppressPortraitClick = false
let portraitTapHref: string | null = null
const touchPointers = new Set<number>()
let isPinching = false

function trackPointerDown(event: PointerEvent) {
  // A link preview can swallow pointerup/pointercancel. A new primary press
  // starts a fresh gesture even if the browser left the previous one hanging.
  if (event.isPrimary && (dragPointerId !== null || touchPointers.size > 0)) {
    resetInterruptedGesture()
  }
  if (event.pointerType !== 'touch') return
  touchPointers.add(event.pointerId)
  if (touchPointers.size > 1) {
    isPinching = true
    cancelPointerDrag()
  }
}

function trackPointerEnd(event: PointerEvent) {
  touchPointers.delete(event.pointerId)
  if (touchPointers.size === 0) isPinching = false
}

function resetInterruptedGesture() {
  touchPointers.clear()
  isPinching = false
  cancelSnap()
  isSnapping.value = false
  cancelPointerDrag()
}

function onVisibilityChange() {
  if (document.hidden) resetInterruptedGesture()
}

// Finish at the nearest slot without inertia when the browser takes over a pinch.
function cancelPointerDrag() {
  suppressPortraitClick = true
  portraitTapHref = null
  const pointerId = dragPointerId
  const wheelId = activeWheelId.value
  dragPointerId = null
  movedPointer.value = false
  if (wheelId !== null && !isSnapping.value) {
    const steps = closestSnapSteps(dragRotation.value)
    wheelVectorRotations.value[wheelId] += steps * slotStep.value
    commitWheelRotation(wheelId, steps)
    dragRotation.value = 0
    angularVelocity = 0
    activeWheelId.value = null
  }
  if (pointerId !== null && svgElement.value?.hasPointerCapture(pointerId)) {
    svgElement.value.releasePointerCapture(pointerId)
  }
}

onMounted(() => {
  if (svgElement.value) {
    const measure = () => {
      const svg = svgElement.value
      if (!svg || svg.clientWidth === 0) return
      svgRenderedWidth.value = svg.clientWidth
      mobileReadingSize.value = parseFloat(getComputedStyle(svg).getPropertyValue('--mobile-reading-size')) || 16
      labelsMeasured.value = true
    }
    measure()
    svgSizeObserver = new ResizeObserver(measure)
    svgSizeObserver.observe(svgElement.value)
  }
  // Capture also catches a second finger landing outside the wheel.
  document.addEventListener('pointerdown', trackPointerDown, { capture: true, passive: true })
  document.addEventListener('pointerup', trackPointerEnd, { capture: true, passive: true })
  document.addEventListener('pointercancel', trackPointerEnd, { capture: true, passive: true })
  document.addEventListener('visibilitychange', onVisibilityChange)
  window.addEventListener('blur', resetInterruptedGesture)
  window.addEventListener('pagehide', resetInterruptedGesture)
  window.addEventListener('pageshow', resetInterruptedGesture)
})

const circlePathData = parseSvgPath(vectorCircleSvg)
const circleViewBox = parseViewBox(vectorCircleSvg)
const circleScale = (WHEEL_RADIUS * 2) / circleViewBox.width
const wheelCount = computed(() => props.compact ? 1 : wheelCountForPeople(peopleCount.value))
const viewBoxWidth = computed(() => {
  return props.compact ? (isMobile.value ? 256 : 320) : Math.max(BASE_VIEWBOX_WIDTH, WHEEL_MARGIN_X * 2 + (wheelCount.value - 1) * WHEEL_SPACING)
})
const viewBoxHeight = computed(() => props.compact ? 320 : VIEWBOX_HEIGHT)
const viewBox = computed(() => `0 0 ${viewBoxWidth.value} ${viewBoxHeight.value}`)
const wheels = computed<Wheel[]>(() => {
  const chainWidth = (wheelCount.value - 1) * WHEEL_SPACING
  const firstWheelX = viewBoxWidth.value / 2 - chainWidth / 2

  return Array.from({ length: wheelCount.value }, (_, id) => ({
    id,
    code: WHEEL_CODES[id % WHEEL_CODES.length],
    x: firstWheelX + id * WHEEL_SPACING,
    y: viewBoxHeight.value / 2,
  }))
})
const renderWheels = computed(() => {
  if (activeWheelId.value === null) {
    return wheels.value
  }

  const activeWheel = wheels.value.find((wheel) => wheel.id === activeWheelId.value)

  if (!activeWheel) {
    return wheels.value
  }

  return [...wheels.value.filter((wheel) => wheel.id !== activeWheel.id), activeWheel]
})
const sharedEdges = computed<SharedEdge[]>(() => {
  return wheels.value.slice(0, -1).map((wheel) => ({
    leftWheel: wheel.id,
    rightWheel: wheel.id + 1,
  }))
})
const slotCount = computed(() => props.compact ? peopleCount.value : WHEEL_SLOT_COUNT)
const slotStep = computed(() => 360 / slotCount.value)
const leftConnectorSlot = computed(() => slotCount.value / 2)
const mobileMedia = window.matchMedia('(max-width: 680px)')
const isMobile = ref(mobileMedia.matches)
const compactLabelFontSize = computed(() => isMobile.value
  ? mobileReadingSize.value * viewBoxWidth.value / svgRenderedWidth.value
  : 10)
function updateMobile(event: MediaQueryListEvent) { isMobile.value = event.matches }
onMounted(() => mobileMedia.addEventListener('change', updateMobile))
const portraitScale = computed(() => Math.max(0.78, Math.min(1, 10 / slotCount.value)) * (props.compact && isMobile.value ? 1.76 : props.desktopPortraitScale))
const portraitWidth = computed(() => PORTRAIT_WIDTH * portraitScale.value)
const portraitHeight = computed(() => PORTRAIT_HEIGHT * portraitScale.value)
// Shuffle a bag so all seven masks get used before any are repeated.
const maskShapes = Object.values(portraitMaskAssets).map(svg => ({ path: parseSvgPath(svg), box: parseViewBox(svg) }))
const personMasks = new Map<string, number>()
let maskBag: number[] = []
function maskForPerson(token: number) {
  const personId = String(props.items[token]?.id ?? token)
  let index = personMasks.get(personId)
  if (index === undefined) {
    if (!maskBag.length) {
      maskBag = maskShapes.map((_, i) => i)
      for (let i = maskBag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[maskBag[i], maskBag[j]] = [maskBag[j], maskBag[i]]
      }
    }
    index = maskBag.pop()!
    personMasks.set(personId, index)
  }
  return maskShapes[index]
}
const portraitPaths = computed(() => Array.from({ length: peopleCount.value }, (_, token) => maskForPerson(token).path))
function portraitMaskTransform(token: number) {
  const { box } = maskForPerson(token)
  const scale = Math.min(portraitWidth.value / box.width, portraitHeight.value / box.height)
  return `scale(${scale}) translate(${-box.x - box.width / 2} ${-box.y - box.height / 2})`
}
const slots = ref(createSlotsForPeople(peopleCount.value, slotCount.value))

const tokenIds = computed(() => {
  // Stable SVG order avoids repainting referenced clips when slots are reassigned.
  return [...new Set(slots.value.flat().filter((token): token is number => token !== null))].sort((a, b) => a - b)
})
const visiblePortraits = computed(() => {
  return renderWheels.value.flatMap((wheel) => displayPortraitsForWheel(wheel))
})
const peopleList = computed<NameListItem[]>(() => {
  return Array.from({ length: peopleCount.value }, (_, token) => {
    const rosterPerson = rosterPersonForToken(token)

    return {
      token,
      label: rosterPerson.label,
      initials: rosterPerson.code,
      familyName: rosterPerson.familyName,
    }
  }).sort((firstPerson, secondPerson) => {
    return (
      nameCollator.compare(firstPerson.familyName, secondPerson.familyName) ||
      nameCollator.compare(firstPerson.label, secondPerson.label) ||
      firstPerson.token - secondPerson.token
    )
  })
})
const isNameListExpanded = computed(() => {
  return hasNameListExpanded.value
})

function displaySlotsForWheel(wheel: Wheel) {
  return (slots.value[wheel.id] ?? []).flatMap<DisplaySlot>((token, slot) => {
    if (!shouldRenderSlot(wheel.id, slot)) {
      return []
    }

    return [
      {
        ...slotPosition(wheel, slot, portraitRotationForWheel(wheel.id)),
        key: `multi-wheel-slot-${wheel.id}-${slot}`,
        occupied: token !== null,
      },
    ]
  })
}

function displayPortraitsForWheel(wheel: Wheel) {
  // Only coordinates change at snap completion; moving SVG image nodes can flash in Safari.
  return (slots.value[wheel.id] ?? []).flatMap<DisplayPortrait>((token, slot) => {
    if (token === null || !shouldRenderSlot(wheel.id, slot)) {
      return []
    }

    const rotation = portraitRotationForWheel(wheel.id)
    const position = slotPosition(wheel, slot, rotation)

    return [
      {
        ...position,
        key: `multi-wheel-token-${token}`,
        token,
        src: personForToken(token).src,
        clipId: `multi-wheel-clip-${token}`,
        clipUrl: `url(#multi-wheel-clip-${token})`,
      },
    ]
  }).sort((a, b) => a.token - b.token)
}

function displayInitialsForWheel(wheel: Wheel) {
  return (slots.value[wheel.id] ?? []).flatMap<DisplayInitial>((token, slot) => {
    if (token === null || !shouldRenderSlot(wheel.id, slot)) {
      return []
    }

    const inside = !props.compact && isInsideLabelSlot(slot)

    return [
      {
        ...labelPosition(wheel, slot, inside),
        key: `multi-wheel-initial-${token}`,
        text: props.compact ? nameForToken(token) : initialsForToken(token),
        inside,
        arrowRotation: props.compact ? null : arrowRotationForLabelSlot(wheel.id, slot),
      },
    ]
  })
}

// Figma mobile home: labels belong to stationary slots, not moving portraits.
const compactLabelSlots = [
  { x: 56, y: -10, anchor: 'end', arrow: '→', line: 1, before: false },
  { x: 60, y: 131, anchor: 'middle', arrow: '↑', line: 0, before: false },
  { x: -58, y: 99, anchor: 'end', arrow: '→', line: 1, before: false },
  { x: -45, y: 22, anchor: 'start', arrow: '←', line: 1, before: true },
  { x: -45, y: -40, anchor: 'start', arrow: '←', line: 0, before: true },
  { x: -58, y: -116, anchor: 'end', arrow: '→', line: 1, before: false },
  { x: 60, y: -142, anchor: 'middle', arrow: '↓', line: 1, before: false },
] as const
function compactLabelsForWheel(wheel: Wheel) {
  return (slots.value[wheel.id] ?? []).flatMap((token, slot) => {
    if (token === null) return []
    const layout = compactLabelSlots[slot % compactLabelSlots.length]
    const [first = '', ...family] = nameForToken(token).trim().split(/\s+/)
    const lines = [first, family.join(' ')]
    lines[layout.line] = layout.before ? `${layout.arrow} ${lines[layout.line]}` : `${lines[layout.line]} ${layout.arrow}`
    return [{ ...layout, x: wheel.x + layout.x, y: wheel.y + layout.y - (!isMobile.value && slot === 1 ? 12 : 0), slot, token, lines }]
  })
}

watch(peopleCount, () => {
  cancelHoverRelease()
  hoveredToken.value = null
  cancelSnap()
  activeWheelId.value = null
  dragRotation.value = 0
  angularVelocity = 0
  wheelVectorRotations.value = resizeRotations(wheelVectorRotations.value, wheelCount.value)
  slots.value = createSlotsForPeople(peopleCount.value, slotCount.value)
})

watch(() => props.items.length, (count) => {
  peopleCount.value = Math.max(MIN_PEOPLE, count)
})

function createSlotsForPeople(count: number, slotsPerWheel: number) {
  if (props.compact) return [shuffledTokenIds(count)]
  const wheelSlots = wheels.value.map(() => Array<SlotToken>(slotsPerWheel).fill(null))
  const randomizedTokens = shuffledTokenIds(count)
  let tokenIndex = 0

  sharedEdges.value.forEach((edge) => {
    if (tokenIndex >= randomizedTokens.length) {
      return
    }

    const token = randomizedTokens[tokenIndex]

    wheelSlots[edge.leftWheel][0] = token
    wheelSlots[edge.rightWheel][slotsPerWheel / 2] = token
    tokenIndex += 1
  })

  nonSharedSlotOrder(slotsPerWheel).forEach((slot) => {
    wheels.value.forEach((wheel) => {
      if (tokenIndex >= randomizedTokens.length || sharedEdgeForSlot(wheel.id, slot)) {
        return
      }

      wheelSlots[wheel.id][slot] = randomizedTokens[tokenIndex]
      tokenIndex += 1
    })
  })

  return wheelSlots
}

function shuffledTokenIds(count: number) {
  const tokens = Array.from({ length: count }, (_, token) => token)

  for (let index = tokens.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    const token = tokens[index]

    tokens[index] = tokens[randomIndex]
    tokens[randomIndex] = token
  }

  return tokens
}

function wheelCountForPeople(count: number) {
  let wheelsNeeded = 1

  while (uniqueCapacityForWheelCount(wheelsNeeded) < count) {
    wheelsNeeded += 1
  }

  return wheelsNeeded
}

function uniqueCapacityForWheelCount(wheelsNeeded: number) {
  return wheelsNeeded * WHEEL_SLOT_COUNT - Math.max(0, wheelsNeeded - 1)
}

function nonSharedSlotOrder(slotsPerWheel: number) {
  const centerSlot = slotsPerWheel / 2
  const orderedSlots = [0, centerSlot]

  for (let offset = 1; offset <= centerSlot; offset += 1) {
    orderedSlots.push(offset)

    if (offset !== centerSlot) {
      orderedSlots.push(slotsPerWheel - offset)
    }
  }

  return [...new Set(orderedSlots)]
}

function resizeRotations(rotations: number[], nextLength: number) {
  return Array.from({ length: nextLength }, (_, index) => rotations[index] ?? 0)
}

function personForToken(token: number) {
  const rosterPerson = rosterPersonForToken(token)
  const fallback = {
    id: token,
    src: '',
    alt: rosterPerson.label,
    label: rosterPerson.label,
  }

  if (props.items.length === 0) {
    return fallback
  }

  const item = props.items[token % props.items.length]

  return item
    ? {
        ...item,
        alt: item.alt ?? rosterPerson.label,
        label: rosterPerson.label,
      }
    : fallback
}

function nameForToken(token: number) {
  return rosterPersonForToken(token).label
}

function initialsForToken(token: number) {
  return rosterPersonForToken(token).code
}

function rosterPersonForToken(token: number): RosterPerson {
  const person = props.items[token]
  const label = person?.label ?? person?.alt ?? ''

  return {
    code: person?.code ?? codeForName(label),
    label,
    familyName: nameParts(label)[1],
  }
}

function codeForName(rawName: string) {
  const [firstName, lastName] = nameParts(rawName)

  return `${lastName.slice(0, 2)}${firstName.slice(0, 1)}`.toUpperCase()
}

function arrowRotationForLabelSlot(wheelId: number, slot: number) {
  if (slot === slotCount.value - 1) {
    return -45
  }

  if (slot === 0) {
    return 0
  }

  if (slot === 1) {
    return 45
  }

  if (wheelId > 0 && slot === leftConnectorSlot.value - 1) {
    return -90
  }

  if (wheelId > 0 && slot === leftConnectorSlot.value + 1) {
    return 90
  }

  return null
}

function nameParts(rawName: string) {
  const trimmedName = rawName.trim()

  if (trimmedName.includes(',')) {
    const [lastName, firstName] = trimmedName.split(',').map((part) => normalizeNamePart(part))

    return [firstName ?? '', lastName ?? '']
  }

  const parts = trimmedName.split(/\s+/).map((part) => normalizeNamePart(part))
  const firstName = parts[0] ?? ''
  const lastName = parts[parts.length - 1] ?? firstName

  return [firstName, lastName]
}

function normalizeNamePart(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z]/gi, '')
}

function onPointerDown(wheelId: number, event: PointerEvent, token: number) {
  if (event.button !== 0 || isSnapping.value || dragPointerId !== null || isPinching || (event.pointerType === 'touch' && !event.isPrimary)) {
    return
  }

  const svg = svgElement.value

  if (!svg) {
    return
  }

  cancelSnap()
  dragPointerId = event.pointerId
  pointerStart = { x: event.clientX, y: event.clientY }
  movedPointer.value = false
  suppressPortraitClick = false
  portraitTapHref = personForToken(token).href ?? null
  activeWheelId.value = wheelId
  dragRotation.value = 0
  lastPointerAngle = angleFromPointer(wheelId, event)
  lastPointerTime = performance.now()
  angularVelocity = 0
  cancelHoverRelease()
  hoveredToken.value = null
  svg.setPointerCapture(event.pointerId)
}

function onPointerMove(event: PointerEvent) {
  if (activeWheelId.value === null) {
    if (event.pointerType !== 'touch') updateHoveredTokenFromPointer(event)
    return
  }

  if (event.pointerId !== dragPointerId || isPinching) return
  if (!movedPointer.value) {
    if (Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) < 8) return
    movedPointer.value = true
    suppressPortraitClick = true
  }

  const angle = angleFromPointer(activeWheelId.value, event)
  const delta = shortestAngleDelta(lastPointerAngle, angle)
  const now = performance.now()
  const elapsed = Math.max(1, now - lastPointerTime)
  const currentVelocity = delta / elapsed

  dragRotation.value += delta
  angularVelocity = angularVelocity * 0.65 + currentVelocity * 0.35
  lastPointerAngle = angle
  lastPointerTime = now
}

function onPointerUp(event: PointerEvent) {
  const svg = svgElement.value

  if (event.pointerId !== dragPointerId) return
  if (event.type !== 'pointerup') {
    cancelPointerDrag()
    return
  }
  dragPointerId = null

  if (activeWheelId.value === null || isSnapping.value) {
    return
  }

  if (!movedPointer.value) {
    const href = performance.now() - lastPointerTime < 500 ? portraitTapHref : null
    portraitTapHref = null
    suppressPortraitClick = true
    activeWheelId.value = null
    dragRotation.value = 0
    angularVelocity = 0
    if (svg?.hasPointerCapture(event.pointerId)) svg.releasePointerCapture(event.pointerId)
    if (href) {
      if (event.ctrlKey || event.metaKey) window.open(href, '_blank', 'noopener')
      else window.location.assign(href)
    }
    return
  }

  portraitTapHref = null
  snapActiveWheel()

  if (svg?.hasPointerCapture(event.pointerId)) {
    svg.releasePointerCapture(event.pointerId)
  }
}

function onPortraitClick(event: MouseEvent) {
  if (isSnapping.value || isPinching || (event.detail !== 0 && suppressPortraitClick)) {
    event.preventDefault()
  }
}

function updateHoveredTokenFromPointer(event: PointerEvent) {
  const nameLink = (event.target as Element)?.closest('[data-label-token]')
  if (!isMobile.value && nameLink && activeWheelId.value === null && !isSnapping.value) {
    setHoveredToken(Number(nameLink.getAttribute('data-label-token')))
    return
  }
  const point = clientPointToSvgPoint(event)
  const hoveredPortrait = [...visiblePortraits.value].reverse().find((portrait) => {
    return (
      Math.abs(point.x - portrait.x) <= portraitWidth.value / 2 &&
      Math.abs(point.y - portrait.y) <= portraitHeight.value / 2
    )
  })

  if (hoveredPortrait) {
    setHoveredToken(hoveredPortrait.token)
    expandNameList()
  } else {
    clearHoveredToken()
  }
}

function onCompactLabelEnter(event: PointerEvent, token: number) {
  if (!isMobile.value && event.pointerType !== 'touch' && activeWheelId.value === null && !isSnapping.value) setHoveredToken(token)
}

function onCompactLabelLeave(event: PointerEvent) {
  if (!isMobile.value && event.pointerType !== 'touch') clearHoveredToken()
}

function onCompactLabelFocus(token: number) {
  if (!isMobile.value && activeWheelId.value === null) setHoveredToken(token)
}

function cancelHoverRelease() {
  if (hoverReleaseTimer !== null) {
    clearTimeout(hoverReleaseTimer)
    hoverReleaseTimer = null
  }
}

function clearHoveredToken() {
  if (hoverReleaseTimer !== null || hoveredToken.value === null) {
    return
  }

  // Bridge gaps between portraits without flashing every image back to full color.
  hoverReleaseTimer = setTimeout(() => {
    hoveredToken.value = null
    hoverReleaseTimer = null
  }, HOVER_RELEASE_DELAY_MS)
}

function expandNameList() {
  hasNameListExpanded.value = true
}

function onWheelPointerLeave() {
  clearHoveredToken()
}

function isTokenMuted(token: number) {
  return hoveredToken.value !== null && hoveredToken.value !== token
}

function setHoveredToken(token: number) {
  cancelHoverRelease()
  hoveredToken.value = token
}

function onNameListMouseLeave() {
  clearHoveredToken()
}

function snapActiveWheel() {
  const wheelId = activeWheelId.value

  if (wheelId === null || isSnapping.value) {
    return
  }

  const startRotation = dragRotation.value
  const inertialRotation = angularVelocity * RELEASE_INERTIA_FACTOR
  const overshootRotation = startRotation + inertialRotation
  const targetSteps = closestSnapSteps(overshootRotation)
  const targetRotation = targetSteps * slotStep.value
  const startedAt = performance.now()

  isSnapping.value = true

  function animate(timestamp: number) {
    const progress = Math.min(1, (timestamp - startedAt) / (RELEASE_INERTIA_MS + SNAP_DURATION_MS))
    const inertiaDurationRatio = RELEASE_INERTIA_MS / (RELEASE_INERTIA_MS + SNAP_DURATION_MS)
    const snapDurationRatio = SNAP_DURATION_MS / (RELEASE_INERTIA_MS + SNAP_DURATION_MS)

    if (progress < inertiaDurationRatio) {
      const inertiaProgress = progress / inertiaDurationRatio
      const easedProgress = 1 - (1 - inertiaProgress) ** 2

      dragRotation.value = startRotation + (overshootRotation - startRotation) * easedProgress
    } else {
      const snapProgress = (progress - inertiaDurationRatio) / snapDurationRatio
      const easedProgress = 1 - (1 - snapProgress) ** 3

      dragRotation.value = overshootRotation + (targetRotation - overshootRotation) * easedProgress
    }

    if (progress < 1) {
      snapFrameId = requestAnimationFrame(animate)
      return
    }

    wheelVectorRotations.value = wheelVectorRotations.value.map((rotation, index) => {
      return index === wheelId ? rotation + targetRotation : rotation
    })
    dragRotation.value = 0
    angularVelocity = 0
    activeWheelId.value = null
    commitWheelRotation(wheelId, targetSteps)
    isSnapping.value = false
    snapFrameId = null
  }

  snapFrameId = requestAnimationFrame(animate)
}

function commitWheelRotation(wheelId: number, stepDelta: number) {
  const normalizedStep = ((stepDelta % slotCount.value) + slotCount.value) % slotCount.value

  if (normalizedStep === 0) {
    return
  }

  const nextSlots = slots.value.map((wheelSlots) => [...wheelSlots])
  const rotatedSlots = Array<SlotToken>(slotCount.value)

  nextSlots[wheelId].forEach((token, slot) => {
    rotatedSlots[(slot + normalizedStep) % slotCount.value] = token
  })

  nextSlots[wheelId] = rotatedSlots

  if (wheelId > 0) {
    nextSlots[wheelId - 1][0] = rotatedSlots[leftConnectorSlot.value]
  }

  if (wheelId < wheels.value.length - 1) {
    nextSlots[wheelId + 1][leftConnectorSlot.value] = rotatedSlots[0]
  }

  slots.value = nextSlots
}

function closestSnapSteps(rotation: number) {
  return Math.round(rotation / slotStep.value)
}

function cancelSnap() {
  if (snapFrameId !== null) {
    cancelAnimationFrame(snapFrameId)
    snapFrameId = null
  }
}

function portraitRotationForWheel(wheelId: number) {
  return activeWheelId.value === wheelId ? dragRotation.value : 0
}

function wheelVectorRotationForWheel(wheelId: number) {
  const dragOffset = activeWheelId.value === wheelId ? dragRotation.value : 0

  return (wheelVectorRotations.value[wheelId] ?? 0) + dragOffset
}

function slotPosition(wheel: Wheel, slot: number, rotation: number) {
  const angle = ((slot * slotStep.value + rotation) * Math.PI) / 180

  return {
    x: wheel.x + Math.cos(angle) * WHEEL_RADIUS,
    y: wheel.y + Math.sin(angle) * WHEEL_RADIUS,
  }
}

function labelPosition(wheel: Wheel, slot: number, inside: boolean) {
  const radius = props.compact ? WHEEL_RADIUS + (isMobile.value ? -10 : 36) : inside ? INNER_LABEL_RADIUS : OUTER_LABEL_RADIUS
  const angle = (slot * slotStep.value * Math.PI) / 180
  const offset = labelOffsetForSlot(slot, inside)

  return {
    x: wheel.x + Math.cos(angle) * radius + offset.x,
    y: wheel.y + Math.sin(angle) * radius + offset.y,
  }
}

function labelOffsetForSlot(slot: number, inside: boolean) {
  if (inside) {
    return { x: INNER_LABEL_OFFSET_X, y: 0 }
  }

  if (slot === leftConnectorSlot.value + 1) {
    return {
      x: LEFT_SHOULDER_LABEL_OFFSET_X,
      y: -LEFT_SHOULDER_LABEL_OFFSET_Y,
    }
  }

  if (slot === leftConnectorSlot.value - 1) {
    return {
      x: LEFT_SHOULDER_LABEL_OFFSET_X,
      y: LEFT_SHOULDER_LABEL_OFFSET_Y,
    }
  }

  return { x: 0, y: 0 }
}

function isInsideLabelSlot(slot: number) {
  const rightmostSlots = [slotCount.value - 1, 0, 1]

  return rightmostSlots.includes(slot)
}

function sharedEdgeForSlot(wheelId: number, slot: number) {
  if (slot === 0 && wheelId < wheels.value.length - 1) {
    return sharedEdges.value[wheelId]
  }

  if (slot === leftConnectorSlot.value && wheelId > 0) {
    return sharedEdges.value[wheelId - 1]
  }

  return null
}

function shouldRenderSlot(wheelId: number, slot: number) {
  const edge = sharedEdgeForSlot(wheelId, slot)

  if (!edge) {
    return true
  }

  if (activeWheelId.value === edge.leftWheel) {
    return wheelId === edge.leftWheel && slot === 0
  }

  if (activeWheelId.value === edge.rightWheel) {
    return wheelId === edge.rightWheel && slot === leftConnectorSlot.value
  }

  return wheelId === edge.leftWheel && slot === 0
}

function angleFromPointer(wheelId: number, event: PointerEvent) {
  const point = clientPointToSvgPoint(event)
  const wheel = wheels.value[wheelId]

  if (!wheel) {
    return 0
  }

  return (Math.atan2(point.y - wheel.y, point.x - wheel.x) * 180) / Math.PI
}

function clientPointToSvgPoint(event: PointerEvent) {
  const svg = svgElement.value

  if (svg) {
    // Firefox's screen CTM does not account for the page's CSS zoom reliably.
    // Map the displayed SVG rectangle to its viewBox (xMidYMid meet) instead.
    const rect = svg.getBoundingClientRect()
    const box = svg.viewBox.baseVal
    const scale = Math.min(rect.width / box.width, rect.height / box.height)

    if (scale > 0) {
      const offsetX = (rect.width - box.width * scale) / 2
      const offsetY = (rect.height - box.height * scale) / 2

      return {
        x: box.x + (event.clientX - rect.left - offsetX) / scale,
        y: box.y + (event.clientY - rect.top - offsetY) / scale,
      }
    }
  }

  return {
    x: 0,
    y: 0,
  }
}

function shortestAngleDelta(from: number, to: number) {
  return ((to - from + 540) % 360) - 180
}

function parseSvgPath(svg: string) {
  return svg.match(/<path[^>]*\sd="([^"]+)"/)?.[1] ?? ''
}

function parseViewBox(svg: string) {
  const [x, y, width, height] = (svg.match(/\sviewBox="([^"]+)"/)?.[1] ?? '0 0 190 194')
    .split(/\s+/)
    .map(Number)

  return {
    x,
    y,
    width,
    height,
  }
}

function wheelVectorTransform(wheel: Wheel) {
  const x = wheel.x - circleViewBox.x * circleScale - (circleViewBox.width * circleScale) / 2
  const y = wheel.y - circleViewBox.y * circleScale - (circleViewBox.height * circleScale) / 2

  return `translate(${x} ${y}) scale(${circleScale})`
}

onBeforeUnmount(() => {
  svgSizeObserver?.disconnect()
  document.removeEventListener('pointerdown', trackPointerDown, true)
  document.removeEventListener('pointerup', trackPointerEnd, true)
  document.removeEventListener('pointercancel', trackPointerEnd, true)
  document.removeEventListener('visibilitychange', onVisibilityChange)
  window.removeEventListener('blur', resetInterruptedGesture)
  window.removeEventListener('pagehide', resetInterruptedGesture)
  window.removeEventListener('pageshow', resetInterruptedGesture)
  mobileMedia.removeEventListener('change', updateMobile)
  cancelHoverRelease()
  cancelSnap()
})
</script>

<template>
  <section class="multi-wheel-prototype" :class="{ 'multi-wheel-prototype--compact': props.compact }">
    <div class="multi-wheel-prototype__stage">
      <svg
        ref="svgElement"
        class="multi-wheel-prototype__svg"
        :class="{ 'multi-wheel-prototype__svg--portrait-hovered': hoveredToken !== null && activeWheelId === null }"
        :viewBox="viewBox"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Roues des personnes de l’Amicale : faites glisser un portrait pour faire tourner sa roue"
        @pointermove="onPointerMove"
        @pointerleave="onWheelPointerLeave"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
        @lostpointercapture="onPointerUp"
        @contextmenu="resetInterruptedGesture"
      >
      <defs>
        <clipPath
          v-for="token in tokenIds"
          :id="`multi-wheel-clip-${token}`"
          :key="token"
          clipPathUnits="userSpaceOnUse"
        >
          <!-- Explicit portrait coordinates keep the clip aligned in Firefox under CSS zoom. -->
          <path
            :d="portraitPaths[token]"
            :transform="portraitMaskTransform(token)"
          />
        </clipPath>
      </defs>

      <line
        v-if="!props.compact"
        class="multi-wheel-prototype__axis"
        :x1="wheels[0].x"
        :x2="wheels[wheels.length - 1].x"
        :y1="wheels[0].y"
        :y2="wheels[0].y"
      />

      <g class="multi-wheel-prototype__rings">
        <g
          v-for="wheel in wheels"
          :key="wheel.id"
          :transform="`rotate(${wheelVectorRotationForWheel(wheel.id)} ${wheel.x} ${wheel.y})`"
        >
          <g :transform="wheelVectorTransform(wheel)">
            <path
              class="multi-wheel-prototype__ring"
              :class="{ 'multi-wheel-prototype__ring--active': activeWheelId === wheel.id }"
              :d="circlePathData"
              fill="none"
              stroke="#6d82ff"
              stroke-width="10"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </g>
        </g>
      </g>

      <g
        v-for="wheel in renderWheels"
        :key="wheel.id"
        class="multi-wheel-prototype__wheel-layer"
        :class="{ 'multi-wheel-prototype__wheel-layer--active': activeWheelId === wheel.id }"
      >
        <g
          class="multi-wheel-prototype__wheel"
          :class="{ 'multi-wheel-prototype__wheel--active': activeWheelId === wheel.id }"
        >
          <g v-if="!props.compact" class="multi-wheel-prototype__slots">
            <circle
              v-for="slot in displaySlotsForWheel(wheel)"
              :key="slot.key"
              class="multi-wheel-prototype__slot"
              :class="{ 'multi-wheel-prototype__slot--occupied': slot.occupied }"
              :cx="slot.x"
              :cy="slot.y"
              r="4"
            />
          </g>

          <g class="multi-wheel-prototype__portraits">
            <g
              v-for="portrait in displayPortraitsForWheel(wheel)"
              :key="portrait.key"
              :transform="`translate(${portrait.x} ${portrait.y})`"
            >
              <a :href="personForToken(portrait.token).href" :aria-label="nameForToken(portrait.token)" @click="onPortraitClick" @dragstart.prevent>
                <path
                  class="multi-wheel-prototype__portrait-outline"
                  :class="{ 'multi-wheel-prototype__portrait-outline--active': hoveredToken === portrait.token }"
                  :d="portraitPaths[portrait.token]"
                  :transform="portraitMaskTransform(portrait.token)"
                  vector-effect="non-scaling-stroke"
                />

                <image
                  class="multi-wheel-prototype__portrait-image"
                  :class="{
                    'multi-wheel-prototype__portrait-image--muted': isTokenMuted(portrait.token),
                    'multi-wheel-prototype__portrait-image--active': hoveredToken === portrait.token,
                  }"
                  :href="portrait.src"
                  :x="-portraitWidth / 2"
                  :y="-portraitHeight / 2"
                  :width="portraitWidth"
                  :height="portraitHeight"
                  :clip-path="portrait.clipUrl"
                  preserveAspectRatio="xMidYMid slice"
                  draggable="false"
                  @pointerdown.stop="onPointerDown(wheel.id, $event, portrait.token)"
                />
              </a>
            </g>
          </g>

          <g v-if="props.compact" class="multi-wheel-prototype__compact-labels"
            :class="{ 'multi-wheel-prototype__compact-labels--hidden': !labelsMeasured || (activeWheelId === wheel.id && movedPointer) || isSnapping }"
            :aria-hidden="!labelsMeasured || (activeWheelId === wheel.id && movedPointer) || isSnapping">
            <a v-for="label in compactLabelsForWheel(wheel)" :key="label.slot"
              class="multi-wheel-prototype__compact-label-link"
              :class="{ 'multi-wheel-prototype__compact-label-link--active': !isMobile && hoveredToken === label.token }"
              :data-label-token="label.token"
              :href="personForToken(label.token).href"
              @pointerenter="onCompactLabelEnter($event,label.token)"
              @pointerleave="onCompactLabelLeave"
              @focus="onCompactLabelFocus(label.token)"
              @blur="clearHoveredToken">
            <text
              class="multi-wheel-prototype__compact-label"
              :data-slot="label.slot" :data-token="label.token"
              :style="{ fontSize: `${compactLabelFontSize}px` }"
              :transform="`translate(${label.x} ${label.y})`"
              :text-anchor="label.anchor" dominant-baseline="hanging">
              <tspan x="0" y="0">{{ label.lines[0] }}</tspan>
              <tspan x="0" :y="compactLabelFontSize * 1.15">{{ label.lines[1] }}</tspan>
            </text>
            </a>
          </g>

          <g v-if="!props.compact" class="multi-wheel-prototype__initials">
            <g
              v-for="initial in displayInitialsForWheel(wheel)"
              :key="initial.key"
              class="multi-wheel-prototype__initial"
              :class="{
                'multi-wheel-prototype__initial--inside': initial.inside,
                'multi-wheel-prototype__initial--active-wheel': activeWheelId === wheel.id,
              }"
              :transform="`translate(${initial.x} ${initial.y})`"
            >
              <text
                :x="initial.arrowRotation === null ? 0 : -8"
                text-anchor="middle"
                dominant-baseline="middle"
              ><template v-if="props.compact"><tspan x="0" dy="-5">{{ initial.text.split(' ')[0] }}</tspan><tspan x="0" dy="13">{{ initial.text.split(' ').slice(1).join(' ') }}</tspan></template><template v-else>{{ initial.text }}</template></text>
              <text
                v-if="initial.arrowRotation !== null"
                class="multi-wheel-prototype__arrow"
                :transform="`translate(${initial.text.length * 3.6 + 6} 0) rotate(${initial.arrowRotation})`"
                text-anchor="middle"
                dominant-baseline="central"
                aria-hidden="true"
              >→</text>
            </g>
          </g>

        </g>
      </g>
      </svg>
    </div>

    <div
      v-if="!props.compact"
      class="multi-wheel-prototype__name-list"
      :class="{ 'multi-wheel-prototype__name-list--expanded': isNameListExpanded }"
      @mouseenter="expandNameList"
      @mouseleave="onNameListMouseLeave"
    >
      <div class="multi-wheel-prototype__name-list-header">
        <span>Les personnes de l’Amicale</span>
        <button
          class="multi-wheel-prototype__name-list-toggle"
          type="button"
          :aria-expanded="isNameListExpanded"
          :aria-label="isNameListExpanded ? 'Réduire la liste des personnes' : 'Afficher toutes les personnes'"
          aria-controls="amicale-wheel-names"
          @click="hasNameListExpanded = !hasNameListExpanded"
        >
          {{ isNameListExpanded ? '−' : '+' }}
        </button>
      </div>

      <ol id="amicale-wheel-names" class="multi-wheel-prototype__names" aria-label="Les personnes sur les roues">
        <li
          v-for="person in peopleList"
          :key="person.token"
          class="multi-wheel-prototype__name-item"
        >
          <component
            :is="props.items[person.token]?.href ? 'a' : 'button'"
            class="multi-wheel-prototype__name-button"
            :class="{
              'multi-wheel-prototype__name-button--muted': isTokenMuted(person.token),
              'multi-wheel-prototype__name-button--active': hoveredToken === person.token,
            }"
            :type="props.items[person.token]?.href ? undefined : 'button'"
            :href="props.items[person.token]?.href"
            :tabindex="isNameListExpanded ? 0 : -1"
            @mouseenter="setHoveredToken(person.token)"
            @mouseleave="clearHoveredToken"
            @focus="setHoveredToken(person.token)"
            @blur="clearHoveredToken"
            @click="setHoveredToken(person.token)"
          >
            <span class="multi-wheel-prototype__name-initials">{{ person.initials }} :</span>
            <span class="multi-wheel-prototype__name-label">{{ person.label }}</span>
          </component>
        </li>
      </ol>
    </div>
  </section>
</template>

<style scoped>
.multi-wheel-prototype {
  display: grid;
  gap: 12px;
  min-width: 0;
}

.multi-wheel-prototype__stage {
  overflow: visible;
  overflow-y: visible;
}

.multi-wheel-prototype__svg {
  display: block;
  width: 100%;
  height: auto;
  overflow: visible;
  cursor: default;
  touch-action: pan-y pinch-zoom;
}

.multi-wheel-prototype__svg--portrait-hovered {
  cursor: pointer;
}

.multi-wheel-prototype__axis {
  stroke: rgba(255, 255, 255, 0.18);
  stroke-dasharray: 6 8;
  stroke-width: 1;
}

.multi-wheel-prototype__ring {
  transition: opacity 160ms ease;
}

.multi-wheel-prototype__ring--active {
  opacity: 0.72;
}

.multi-wheel-prototype__rings,
.multi-wheel-prototype__slots {
  filter: grayscale(0);
  transition: filter 360ms ease;
}

.multi-wheel-prototype__svg--portrait-hovered .multi-wheel-prototype__rings,
.multi-wheel-prototype__svg--portrait-hovered .multi-wheel-prototype__slots {
  filter: grayscale(1);
  transition: filter 180ms ease;
}

.multi-wheel-prototype__slot {
  fill: #fff;
  opacity: 0.82;
  pointer-events: none;
  stroke: #3c4b9d;
  stroke-width: 1.4;
}

.multi-wheel-prototype__slot--occupied {
  fill: #3c4b9d;
  opacity: 0.48;
  stroke-width: 0;
}

.multi-wheel-prototype__portrait-outline {
  fill: none;
  opacity: 0;
  pointer-events: none;
  stroke: #fff;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 6px;
  transition: opacity 360ms ease 120ms;
}

.multi-wheel-prototype__portrait-outline--active {
  opacity: 1;
  transition: opacity 180ms ease;
}

.multi-wheel-prototype__portrait-image {
  pointer-events: auto;
  touch-action: pinch-zoom;
  cursor: grab;
  /* Keep the filtered SVG rendering path active between hover states, so
     fractional portrait positions are rasterized consistently. */
  filter: grayscale(0) brightness(1) contrast(1);
  transition: filter 360ms ease;
  user-select: none;
}

.multi-wheel-prototype__portrait-image--muted {
  filter: grayscale(1) brightness(0.45);
  transition: filter 180ms ease;
}

.multi-wheel-prototype__portrait-image--active {
  filter: grayscale(0) brightness(1) contrast(1);
  transition: filter 180ms ease;
}

.multi-wheel-prototype__initial {
  fill: #fff;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0;
  opacity: 1;
  paint-order: stroke;
  pointer-events: none;
  stroke: #3a3a3a;
  stroke-linejoin: round;
  stroke-width: 4px;
  transition: opacity 180ms ease;
  user-select: none;
}

.multi-wheel-prototype__initial--inside {
  font-size: 13px;
}

.multi-wheel-prototype__arrow {
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 400;
}

.multi-wheel-prototype__initial--active-wheel {
  opacity: 0;
}

.multi-wheel-prototype__name-list {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 0 15px;
}

.multi-wheel-prototype__name-list-header {
  order: 1;
  display: flex;
  justify-content: center;
  margin-top: 14px;
}

.multi-wheel-prototype__name-list-header > span {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
}

.multi-wheel-prototype__name-list-toggle {
  width: 33px;
  height: 33px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: var(--panel-bg,#292929);
  color: var(--text-color,#fff);
  cursor: pointer;
  font: inherit;
  font-size: 25px;
  line-height: 1;
}

@media (hover: hover) and (pointer: fine) {
  .multi-wheel-prototype__name-list-toggle:hover {
  background: var(--button-bg,#606060);
}
}

.multi-wheel-prototype__name-list-toggle:focus-visible,
.multi-wheel-prototype__name-button:focus-visible {
  outline: 2px solid var(--link-hover,#aab9ff);
  outline-offset: 3px;
}

.multi-wheel-prototype__names {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px 18px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.multi-wheel-prototype__name-list:not(.multi-wheel-prototype__name-list--expanded) .multi-wheel-prototype__name-item:nth-child(n + 19) {
  display: none;
}

.multi-wheel-prototype__name-item {
  min-width: 0;
}

.multi-wheel-prototype__name-button {
  display: flex;
  align-items: baseline;
  gap: 5px;
  width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--text-color,#fff);
  cursor: pointer;
  font: inherit;
  font-size: 14px;
  text-align: left;
  text-decoration: none;
  transition: color 180ms ease, opacity 180ms ease;
}

.multi-wheel-prototype__name-button--muted {
  opacity: .35;
}

.multi-wheel-prototype__name-button--active {
  color: var(--link-hover,#aab9ff);
}

.multi-wheel-prototype__name-initials {
  flex-shrink: 0;
}

.multi-wheel-prototype__name-label {
  min-width: 0;
}

.multi-wheel-prototype--compact .multi-wheel-prototype__svg {
  min-width: 0;
  width: 100%;
}
.multi-wheel-prototype--compact .multi-wheel-prototype__initial {
  font-size: 12px;
  font-weight: 400;
  stroke-width: 3px;
}

@media (max-width: 680px) {
  .multi-wheel-prototype__stage {
    overflow-x: auto;
  }

  .multi-wheel-prototype__svg {
    min-width: 620px;
  }

  .multi-wheel-prototype__name-list {
    padding: 0;
  }

  .multi-wheel-prototype__names {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px 10px;
  }

  .multi-wheel-prototype__name-button {
    font-size: 12px;
  }
}

.multi-wheel-prototype__compact-labels { pointer-events: none; }
.multi-wheel-prototype__compact-label-link { pointer-events:auto; cursor:pointer; touch-action:pan-y pinch-zoom; }
.multi-wheel-prototype__compact-labels--hidden { visibility: hidden; }
@media (min-width:681px) {
  .multi-wheel-prototype__compact-label-link--active .multi-wheel-prototype__compact-label {
    fill:var(--text-color,#fff);
    text-decoration:underline;
    text-underline-offset:3px;
    text-decoration-thickness:1px;
  }
}
.multi-wheel-prototype__compact-label {
  fill: #fff;
  font-family: var(--font-body);
  font-size: 10px;
  font-weight: 400;
  user-select: none;
  -webkit-user-select: none;
}
</style>
