import { drawPeriods, starPath, seededNumber } from "./rocknroll.js"
import projectDates from "../../data/project-first-dates.json"
import { portraitForPerson, placeholderPortrait } from "../../data/people-portraits.js"
import { personHref } from "../../site/data.js"
import { patateurLabel } from "../../patateur/index.js"
import "./people-history.css"

const SVG_NS = "http://www.w3.org/2000/svg"
const FINISH_OVERRUN = 69 // Mirrors the portrait-to-2010 spacing at the left end.
const faceMasks = Object.values(import.meta.glob("../people-wheel/Vector *.svg", { eager: true, query: "?raw", import: "default" })).map(source => {
  const svg = new DOMParser().parseFromString(source, "image/svg+xml").documentElement
  return { viewBox:svg.getAttribute("viewBox"), path:svg.querySelector("path").getAttribute("d") }
})
const escape = value => String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c])
const svgElement = (tag, attributes = {}) => {
  const node = document.createElementNS(SVG_NS, tag)
  Object.entries(attributes).forEach(([key,value]) => node.setAttribute(key,String(value)))
  return node
}

function chartMetrics(availableWidth) {
  const currentYear = new Date().getFullYear()
  const startYear = 2010, left = 24, right = 36
  const yearWidth = availableWidth ? (availableWidth - left - right) / (currentYear - startYear) : 44
  const ticks = []
  for (let year = startYear; year <= currentYear; year += 5) ticks.push(year)
  if (!ticks.includes(currentYear)) ticks.push(currentYear)
  return { currentYear, startYear, endYear: currentYear, yearWidth, left, right,
    rowHeight: 48, width: left + (currentYear - startYear) * yearWidth + right, ticks }
}
const xForYear = (year, chart) => chart.left + (year-chart.startYear)*chart.yearWidth

function yearGrid(svg, chart, height, header = false) {
  for (const year of chart.ticks) {
    const x = xForYear(year,chart), today = year === chart.currentYear
    svg.append(svgElement("line", {x1:x,x2:x,y1:header?67:0,y2:height,class:`history-year-line${today ? " is-now" : ""}`}))
    if (header && (today || Math.abs(year-chart.currentYear)>=2.2)) {
      const label = svgElement("text", {x,y:53,"text-anchor":today?"end":"middle",class:`history-year${today ? " is-now" : ""}`})
      label.textContent = today ? "aujourd’hui" : year
      svg.append(label)
    }
  }
}

function projectCreations(member, chart) {
  return member.projects.flatMap(id => {
    const project = projectDates.projects.find(item=>item.id===id)
    if (!project?.firstDate) return []
    const date = new Date(`${project.firstDate}T00:00:00Z`), year=date.getUTCFullYear()
    const position = year+(date.getTime()-Date.UTC(year,0,1))/(Date.UTC(year+1,0,1)-Date.UTC(year,0,1))
    return position>=chart.startYear && position<=chart.endYear ? [{...project,position}] : []
  }).sort((a,b)=>a.position-b.position)
}

function timelineRow(member, chart, roles) {
  const svg = svgElement("svg", {width:chart.width,height:chart.rowHeight,viewBox:`0 0 ${chart.width} ${chart.rowHeight}`,class:"history-track",role:"group","aria-label":`Parcours de ${member.name}`})
  const title=svgElement("title")
  title.textContent=member.periods.map(([id,start,end])=>`${roles.find(role=>role.id===id)?.label || id} : ${Math.max(2010,Math.floor(start))}–${end===null?"aujourd’hui":Math.floor(end)}`).join(" ; ")
  svg.append(title)
  yearGrid(svg,chart,chart.rowHeight)
  const periods=svgElement("g")
  // The POC renderer owns curve geometry, segment clipping and concentric roles.
  drawPeriods(periods,{...member,periods:member.periods.map(([role,start,end],i)=>({id:`p${i}`,role,start,end}))},24,chart,roles,"amicale-history")
  svg.append(periods)
  for (const project of projectCreations(member,chart)) {
    const rotation=-18+seededNumber(`${member.id}-${project.id}`)*36
    svg.append(svgElement("path", {
      d:starPath(xForYear(project.position,chart),24,10,4.3,6,rotation),
      class:"history-creation",fill:"#7890ff",stroke:"#111","stroke-width":2.2,"stroke-linejoin":"round",
      tabindex:0,role:"button","aria-label":`${project.name}, création ${project.firstDate}`,
      "aria-describedby":"amicale-history-tooltip","data-project-name":project.name,"data-project-date":project.firstDate,
    }))
  }
  return svg.outerHTML
}

export function renderPeopleHistory(people, roles) {
  const chart=chartMetrics()
  const years=svgElement("svg",{width:chart.width,height:76,viewBox:`0 0 ${chart.width} 76`,class:"history-years","aria-hidden":"true"})
  yearGrid(years,chart,76,true)
  const legend=roles.filter(role=>role.id!=="collaborateur").map(role=>`<span class="history-role">${escape(role.label)}<i data-patateur="history-role-${role.id}" data-patateur-preset="round" style="--patateur-fill:${role.color}"></i></span>`).join("")
  return `<section class="amicale-history" data-people-history aria-label="Les personnes et leurs parcours à l’Amicale">
    ${patateurLabel("Les personnes de l’Amicale :","history-label","amicale-label history-label")}
    <div class="history-scroll" data-history-end-x="${chart.width - chart.right}" tabindex="0" role="region" aria-label="Faites défiler horizontalement pour découvrir la frise. Les portraits suivent les parcours.">
      <div class="history-sheet" style="--history-track-width:${chart.width}px;--history-end-space:${chart.right}px;--history-finish-overrun:${FINISH_OVERRUN}px">
        <div class="history-heading"><div class="history-heading-track"><div class="history-role-legend">${legend}<span class="history-role">(création)<svg width="21" height="21" viewBox="0 0 21 21" aria-hidden="true"><path d="${starPath(10.5,10.5,8,3.4,6,-15)}" fill="#7890ff" stroke="#111" stroke-width="1.7" /></svg></span></div>${years.outerHTML}</div></div>
        ${people.map((member,index)=>{
          const mask=faceMasks[Math.floor(seededNumber(member.id)*faceMasks.length)%faceMasks.length]
          const [, , width, height] = mask.viewBox.split(/\s+/).map(Number)
          const clipId = `history-face-${member.id}`
          const start = Math.max(chart.startYear, Math.min(...member.periods.map(([, start]) => start)))
          const end = Math.min(chart.endYear, Math.max(...member.periods.map(([, , end]) => end ?? chart.currentYear)))
          const remaining = member.periods.some(([, start, end]) => start <= chart.currentYear && (end === null || end >= chart.currentYear))
          return `<div class="history-row${index%2?" is-offset":""}" data-history-person="${escape(member.id)}" data-ride-start="${xForYear(start, chart)}" data-ride-end="${xForYear(end, chart)}">
            <a class="history-name" href="${personHref(member.name)}"><span>${escape(member.name)}</span><span class="history-name-arrow"> →</span></a>
            <a class="history-face" href="${personHref(member.name)}" aria-label="Voir la page de ${escape(member.name)}"><svg class="history-face-mask" viewBox="${mask.viewBox}" aria-hidden="true"><defs><clipPath id="${clipId}"><path d="${mask.path}" /></clipPath></defs><image href="${escape(portraitForPerson(member.name)||placeholderPortrait())}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${clipId})" /></svg></a>
            ${timelineRow(member,chart,roles)}
            ${remaining ? `<div class="history-end-labels" hidden><a class="history-end-name" href="${personHref(member.name)}">← ${escape(member.name)}</a></div>` : ""}
          </div>`
        }).join("")}
      </div>
    </div>
    <div class="history-tooltip" id="amicale-history-tooltip" role="tooltip" hidden></div>
  </section>`
}

export function bindPeopleHistory(root, people, roles) {
  const section=root.querySelector("[data-people-history]")
  if (!section) return ()=>{}
  const scroller=section.querySelector(".history-scroll"),tooltip=section.querySelector(".history-tooltip")
  // Keep viewport-positioned tooltips outside the app’s CSS zoom.
  document.body.append(tooltip)
  const riders = [...section.querySelectorAll(".history-row")].map(row => ({
    row,
    face: row.querySelector(".history-face"),
    portrait: row.querySelector(".history-face-mask"),
    endLabels: row.querySelector(".history-end-labels"),
    revealed: false,
    start: Number(row.dataset.rideStart), end: Number(row.dataset.rideEnd),
    stagger: row.classList.contains("is-offset") ? 32 : 0,
    joinOffset: 0,
  }))
  let endX = Number(scroller.dataset.historyEndX)
  const mobile = matchMedia("(max-width:680px)")
  const reducedMotion = matchMedia("(prefers-reduced-motion:reduce)")
  let riding = false, frame = 0, joinStarted = -Infinity
  let rightDriven = false, returnOffset = 0, resetLefts = null
  const updateRiders = (now = performance.now()) => {
    frame = 0
    if (!mobile.matches) return
    if (rightDriven && scroller.scrollLeft <= returnOffset) {
      // Remove the return runway at the left end without moving the chart.
      resetLefts = riders.map(rider => (rider.portrait.getBoundingClientRect().left - scroller.getBoundingClientRect().left) / (scroller.getBoundingClientRect().width / scroller.clientWidth || 1))
      const nextScroll = Math.max(0, scroller.scrollLeft - returnOffset)
      rightDriven = false
      section.classList.remove("is-right-driven")
      scroller.scrollLeft = nextScroll
      scheduleRiders()
      return
    }
    const bounds = scroller.getBoundingClientRect()
    const zoom = bounds.width / scroller.clientWidth || 1
    const visibleRiders = riders.filter(rider => !rider.row.hidden)
    if (!visibleRiders.length) return
    const firstTrack = visibleRiders[0].row.querySelector(".history-track")
    const firstName = visibleRiders[0].row.querySelector(".history-name")
    const styles = getComputedStyle(section)
    const pinInset = parseFloat(styles.getPropertyValue("--history-pin-inset")) || 0
    const stagger = parseFloat(styles.getPropertyValue("--history-stagger")) || 32
    const settleStagger = stagger / 2
    visibleRiders.forEach(rider => { rider.stagger = rider.row.classList.contains("is-offset") ? stagger : 0 })
    const localLeft = element => (element.getBoundingClientRect().left - bounds.left) / zoom
    const scrollBounds = { left:0, right:scroller.clientWidth }
    const naturalTrackLeft = (firstName.getBoundingClientRect().right - bounds.left) / zoom + 88 - (rightDriven ? returnOffset : 0)
    const pinnedLeft = pinInset
    // CSS sticky freezes the chart in the browser's native scroll pass. Measure
    // its displacement only to advance the riders; never counter-scroll it in JS.
    const trackLeft = localLeft(firstTrack)
    const trackShift = Math.max(0, trackLeft - naturalTrackLeft)
    const finishDistance = Math.max(1, trackLeft + endX - pinnedLeft - 27)
    const finishProgress = rightDriven
      ? Math.max(0, Math.min(1, 1 - (trackLeft + endX - (scrollBounds.right - 40)) / 54))
      : Math.min(1, trackShift / finishDistance)
    const nextRiding = rightDriven || naturalTrackLeft - 88 <= pinnedLeft
    const changingMode = nextRiding !== riding
    // Capture the visible positions once, before writing any styles.
    const previousLefts = resetLefts || (changingMode ? riders.map(rider => (rider.portrait.getBoundingClientRect().left - scroller.getBoundingClientRect().left) / (scroller.getBoundingClientRect().width / scroller.clientWidth || 1)) : null)
    resetLefts = null
    if (changingMode) {
      riding = nextRiding
      joinStarted = now
    }
    const progress = reducedMotion.matches ? 1 : Math.min(1, Math.max(0, (now - joinStarted) / 380))
    const remaining = (1 - progress) ** 3
    // The sticky anchor keeps doing the initial collapse. Only translate its
    // portrait once it becomes sticky: wait at entry, ride, then leave at exit.
    const stickyLeft = Math.max(pinnedLeft, naturalTrackLeft - 88)
    const rideLeft = rightDriven ? scrollBounds.right - 40 - 27 : stickyLeft + trackShift
    riders.forEach((rider, index) => {
      if (rider.row.hidden) return
      const restingLeft = stickyLeft + rider.stagger
      const endOverrun = rider.endLabels ? FINISH_OVERRUN : 0
      const lineLeft = riding
        ? Math.min(trackLeft + rider.end - 27 + endOverrun, Math.max(rideLeft, trackLeft + rider.start - 27))
        : restingLeft
      const crossedFinish = endOverrun
        ? Math.max(0, Math.min(1, (lineLeft + 27 - trackLeft - rider.end) / endOverrun))
        : 0
      const left = lineLeft + (settleStagger - rider.stagger) * crossedFinish ** 2
      if (changingMode) rider.joinOffset = previousLefts[index] - left
      // Scroll geometry updates immediately. Only the initial joining offset
      // eases away, so scrolling never retargets a transition or ends in a snap.
      rider.face.style.setProperty("--history-ride-x", `${left - restingLeft + rider.joinOffset * remaining}px`)
      if (rider.endLabels) {
        const settledLeft = trackLeft + rider.end - 27 + endOverrun + settleStagger - rider.stagger
        if (finishProgress >= 1 - 0.0001 && Math.abs(left + rider.joinOffset * remaining - settledLeft) < 0.5) {
          rider.revealed = true
        } else if (trackLeft + endX + 55 + endOverrun - rider.stagger >= scrollBounds.right) {
          // Re-arm only after the name has naturally scrolled completely away.
          rider.revealed = false
        }
        rider.endLabels.hidden = !rider.revealed
      }
    })
    if (!rightDriven && finishProgress >= 1 - 0.0001 && remaining === 0) {
      // At arrival both layouts have exactly this displacement. A constant CSS
      // offset then lets native scrolling carry the chart in either direction,
      // while the right viewport edge drives the portraits on the return trip.
      rightDriven = true
      returnOffset = trackShift
      section.style.setProperty("--history-return-offset", `${returnOffset}px`)
      section.classList.add("is-right-driven")
    }
    if (progress < 1) frame = requestAnimationFrame(updateRiders)
  }
  const scheduleRiders = () => { if (!frame) frame = requestAnimationFrame(updateRiders) }
  const hide=()=>{tooltip.hidden=true}
  const updateFade=()=>{
    scroller.style.setProperty("--history-fade-right",scroller.scrollWidth-scroller.clientWidth-scroller.scrollLeft>1?"32px":"0px")
  }
  let layoutKey = ""
  const onResize = () => {
    scroller.style.setProperty("--history-viewport-width",`${scroller.clientWidth}px`)
    const sheet = section.querySelector(".history-sheet")
    const availableWidth = Math.max(180, scroller.clientWidth - 198)
    const key = mobile.matches ? "mobile" : `desktop-${availableWidth}`
    if (key !== layoutKey) {
      const chart = chartMetrics(mobile.matches ? undefined : availableWidth)
      endX = chart.width - chart.right
      scroller.dataset.historyEndX = endX
      sheet.style.setProperty("--history-track-width", `${chart.width}px`)
      const years = svgElement("svg", {width:chart.width,height:76,viewBox:`0 0 ${chart.width} 76`,class:"history-years","aria-hidden":"true"})
      yearGrid(years,chart,76,true)
      section.querySelector(".history-years").replaceWith(years)
      riders.forEach((rider,index) => {
        const member = people[index]
        rider.row.querySelector(".history-track").outerHTML = timelineRow(member,chart,roles)
        rider.start = xForYear(Math.max(chart.startYear, Math.min(...member.periods.map(([,start]) => start))), chart)
        rider.end = xForYear(Math.min(chart.endYear, Math.max(...member.periods.map(([, ,end]) => end ?? chart.currentYear))), chart)
      })
      if (!layoutKey || key === "mobile" || layoutKey === "mobile") {
        cancelAnimationFrame(frame)
        frame = 0
        riding = rightDriven = false
        returnOffset = 0
        resetLefts = null
        joinStarted = -Infinity
        section.classList.remove("is-right-driven")
        section.style.removeProperty("--history-return-offset")
        riders.forEach(rider => {
          rider.face.style.removeProperty("--history-ride-x")
          rider.revealed = false
          rider.joinOffset = 0
          if (rider.endLabels) rider.endLabels.hidden = true
        })
        scroller.scrollLeft = 0
      }
      layoutKey = key
      hide()
    }
    if (mobile.matches && rightDriven) {
      returnOffset=Math.max(0,scroller.clientWidth-40-20-27)
      section.style.setProperty("--history-return-offset",`${returnOffset}px`)
    }
    scroller.setAttribute("aria-label", mobile.matches ? "Faites défiler horizontalement pour découvrir la frise. Les portraits suivent les parcours." : "Les personnes et leurs parcours, de 2010 à aujourd’hui")
    updateFade()
    if (mobile.matches) scheduleRiders()
  }
  const resize=new ResizeObserver(() => {
    onResize()
  })
  resize.observe(scroller)
  scroller.addEventListener("scroll",updateFade,{passive:true})
  scroller.addEventListener("scroll",scheduleRiders,{passive:true})
  mobile.addEventListener("change",onResize)
  window.addEventListener("resize",onResize)
  onResize()
  updateRiders()
  const show=marker=>{
    const title=document.createElement("strong"),date=document.createElement("span")
    title.textContent=marker.dataset.projectName
    date.textContent=`Création : ${new Intl.DateTimeFormat("fr-FR",{day:"numeric",month:"long",year:"numeric",timeZone:"UTC"}).format(new Date(`${marker.dataset.projectDate}T00:00:00Z`))}`
    tooltip.replaceChildren(title,date)
    tooltip.hidden=false
    const box=marker.getBoundingClientRect(),tip=tooltip.getBoundingClientRect()
    const clamp=(value,min,max)=>Math.max(min,Math.min(max,value))
    tooltip.style.left=`${clamp(box.left+box.width/2-tip.width/2,8,innerWidth-tip.width-8)}px`
    tooltip.style.top=`${clamp(box.top-tip.height-10>=8?box.top-tip.height-10:box.bottom+10,8,innerHeight-tip.height-8)}px`
  }
  const markerEvent = event => {
    const marker = event.target.closest(".history-creation")
    if (!marker) return
    if (event.type === "keydown") {
      if (event.key !== "Enter" && event.key !== " ") return
      event.preventDefault()
    }
    if (event.type === "pointerover" && event.pointerType === "touch") return
    show(marker)
  }
  const markerLeave = event => { if (event.target.closest(".history-creation")) hide() }
  ;["pointerover", "focusin", "click", "keydown"].forEach(type => section.addEventListener(type, markerEvent))
  ;["pointerout", "focusout"].forEach(type => section.addEventListener(type, markerLeave))
  const outside=event=>{if(!event.target.closest(".history-creation"))hide()}
  const escape=event=>{if(event.key==="Escape")hide()}
  document.addEventListener("pointerdown",outside)
  document.addEventListener("scroll",hide,true)
  document.addEventListener("keydown",escape)
  window.addEventListener("resize",hide)
  return ()=>{
    tooltip.remove()
    resize.disconnect()
    cancelAnimationFrame(frame)
    mobile.removeEventListener("change",onResize)
    window.removeEventListener("resize",onResize)
    ;["pointerover", "focusin", "click", "keydown"].forEach(type => section.removeEventListener(type, markerEvent))
    ;["pointerout", "focusout"].forEach(type => section.removeEventListener(type, markerLeave))
    scroller.removeEventListener("scroll",scheduleRiders)
    scroller.removeEventListener("scroll",updateFade)
    document.removeEventListener("pointerdown",outside)
    document.removeEventListener("scroll",hide,true)
    document.removeEventListener("keydown",escape)
    window.removeEventListener("resize",hide)
  }
}
