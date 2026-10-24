function randomFor(seed) {
  let state = 2166136261
  for (const char of String(seed)) state = Math.imul(state ^ char.charCodeAt(0), 16777619)
  return () => {
    state = Math.imul(state, 1664525) + 1013904223 | 0
    return (state >>> 0) / 4294967296
  }
}

// Normalize the complete Bézier control polygon to keep every curve inside its box.
function fitPath(start, segments, width, height) {
  const all = [start, ...segments.flat()]
  const xs = all.map(p => p[0]), ys = all.map(p => p[1])
  const left = Math.min(...xs), top = Math.min(...ys)
  const rangeX = Math.max(...xs) - left, rangeY = Math.max(...ys) - top
  const inset = Math.min(width, height) * 0.015
  const format = p => `${(inset + (p[0] - left) / rangeX * (width - inset * 2)).toFixed(2)} ${(inset + (p[1] - top) / rangeY * (height - inset * 2)).toFixed(2)}`
  return `M ${format(start)} ${segments.map(s => `C ${s.map(format).join(" ")}`).join(" ")} Z`
}

// Aim for an approximate corner, drift along an edge, then correct toward the next.
// Each edge has two broad corrections, with shared tangents instead of fine jitter.
function correctedRectangle(width, height, seed, { mistake, spread, recovery, defects = false, grain = 0, roundness = 0.15 }) {
  const random = randomFor(seed), size = Math.min(width, height)
  const centered = () => random() * 2 - 1
  const add = (a,b,k=1) => [a[0]+b[0]*k,a[1]+b[1]*k]
  const sub = (a,b) => [a[0]-b[0],a[1]-b[1]]
  const unit = vector => { const length=Math.hypot(...vector); return vector.map(v=>v/length) }
  const corners = [[0,0],[width,0],[width,height],[0,height]].map(([x,y]) => [
    x + centered()*size*mistake, y + centered()*size*mistake,
  ])
  const turns = corners.map((corner,i) => {
    const incoming = unit(sub(corner,corners[(i+3)%4]))
    const outgoing = unit(sub(corners[(i+1)%4],corner))
    const before = size*(roundness+centered()*spread*0.1)
    const after = size*(roundness+centered()*spread*0.1)
    return { incoming,outgoing,before,after, enter:add(corner,incoming,-before),exit:add(corner,outgoing,after) }
  })
  const start=turns[0].enter, segments=[]
  for(let i=0;i<4;i++) {
    const turn=turns[i], next=turns[(i+1)%4]
    // The approach and departure are estimated independently, so corners lean.
    segments.push([
      add(turn.enter,turn.incoming,turn.before*(0.55+random()*0.25)),
      add(turn.exit,turn.outgoing,-turn.after*(0.55+random()*0.25)),
      turn.exit,
    ])
    const direction=unit(sub(corners[(i+1)%4],corners[i]))
    const normal=[direction[1],-direction[0]], edge=sub(next.enter,turn.exit)
    const error=centered()*size*mistake
    const first=0.32+random()*0.16, second=0.72+random()*0.12
    const points=[turn.exit,add(add(turn.exit,edge,first),normal,error),
      add(add(turn.exit,edge,second),normal,-error*recovery),next.enter]
    const tangents=points.map((p,j) => j===0 ? direction.map(v=>v*Math.hypot(...sub(points[1],p)))
      : j===3 ? direction.map(v=>v*Math.hypot(...sub(p,points[2])))
      : sub(points[j+1],points[j-1]).map(v=>v/2))
    for(let j=0;j<3;j++)segments.push([
      add(points[j],tangents[j],1/3),add(points[j+1],tangents[j+1],-1/3),points[j+1],
    ])
  }
  if (defects) addRareDefect(start, segments, size, seed)
  if (grain) {
    const textured = addFineGrain(start, segments, size, seed, grain)
    return fitPath(textured.start, textured.segments, width, height)
  }
  return fitPath(start,segments,width,height)
}

function addFineGrain(start, segments, size, seed, amount) {
  const random = randomFor(`${seed}-fine-grain`)
  const distance = (a,b) => Math.hypot(a[0]-b[0],a[1]-b[1])
  const dense = []
  let from = start
  for (const segment of segments) {
    const estimatedLength = (distance(from,segment[0])+distance(segment[0],segment[1])+distance(segment[1],segment[2])+distance(from,segment[2]))/2
    const pieces = Math.max(1,Math.ceil(estimatedLength/(size*0.055)))
    let remainder = segment, point = from
    for (let remaining=pieces; remaining>1; remaining--) {
      // Unevenly spaced anchors avoid a repetitive scalloped outline.
      const [left,right] = splitCurve(point,remainder,(0.8+random()*0.4)/remaining)
      dense.push(left)
      point=left[2]
      remainder=right
    }
    dense.push(remainder)
    from=segment[2]
  }
  const count=dense.length
  const anchors=[start,...dense.slice(0,-1).map(s=>s[2])]
  const noise=Array.from({length:count},()=>random()*2-1)
  const offsets=anchors.map((_,i)=>{
    const prev=dense[(i+count-1)%count][1],next=dense[i][0]
    const dx=next[0]-prev[0],dy=next[1]-prev[1],length=Math.hypot(dx,dy)||1
    const variation=noise[(i+count-1)%count]*0.2+noise[i]*0.6+noise[(i+1)%count]*0.2
    // A fraction of a pixel at project-thumbnail size, not large edge waves.
    const offset=size*amount*variation
    return [dy/length*offset,-dx/length*offset]
  })
  const add=(p,d)=>[p[0]+d[0],p[1]+d[1]]
  const shifted=anchors.map((p,i)=>add(p,offsets[i]))
  const rotateHandle=(anchor,handle,angle)=>{
    const x=handle[0]-anchor[0],y=handle[1]-anchor[1]
    return [anchor[0]+x*Math.cos(angle)-y*Math.sin(angle),anchor[1]+x*Math.sin(angle)+y*Math.cos(angle)]
  }
  const textured=dense.map((s,i)=>{
    const next=(i+1)%count
    let c1=add(s[0],offsets[i]),c2=add(s[1],offsets[next])
    // Some tiny joins change direction slightly, as in the original vector.
    // The base corners and rare H defects remain intact.
    if(random()<0.3)c1=rotateHandle(shifted[i],c1,(random()*2-1)*amount*18)
    if(random()<0.3)c2=rotateHandle(shifted[next],c2,(random()*2-1)*amount*18)
    return [c1,c2,shifted[next]]
  })
  return {start:shifted[0],segments:textured}
}

function splitCurve(start, segment, t) {
  const lerp = (a,b) => [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]
  const a=lerp(start,segment[0]),b=lerp(segment[0],segment[1]),c=lerp(segment[1],segment[2])
  const d=lerp(a,b),e=lerp(b,c),join=lerp(d,e)
  return [[a,d,join],[e,c,segment[2]]]
}

function addRareDefect(start, segments, size, seed) {
  // Independent randomness preserves G1's underlying shape. Most masks stay clean.
  const random=randomFor(`${seed}-rare-defect`)
  if (random() >= 0.4) return
  const corner=Math.floor(random()*4), type=Math.floor(random()*3)
  const index=corner*4+(type===1 ? 3 : 0)
  const from=index===0 ? start : segments[index-1][2]
  const segment=segments[index]
  if (type===0) {
    // One slightly clipped turn, with an intentionally imperfect tangent join.
    const to=segment[2]
    segments[index]=[
      [from[0]+(to[0]-from[0])/3,from[1]+(to[1]-from[1])/3],
      [from[0]+(to[0]-from[0])*2/3,from[1]+(to[1]-from[1])*2/3],to,
    ]
    return
  }
  const [left,right]=splitCurve(from,segment,type===1 ? 0.76 : 0.82)
  const join=left[2], dx=right[0][0]-left[1][0],dy=right[0][1]-left[1][1]
  const length=Math.hypot(dx,dy),tx=dx/length,ty=dy/length
  // An isolated direction correction or a tiny overshoot, not repeated edge noise.
  const normal=size*(type===1 ? 0.011 : 0.008)
  const ahead=type===2 ? size*0.012 : 0
  left[2]=[join[0]+ty*normal+tx*ahead,join[1]-tx*normal+ty*ahead]
  segments.splice(index,1,left,right)
}

// The approved G2 settings, shared by production and the comparison lab.
export const projectMaskDefaults = Object.freeze({
  mistake: 0.028,
  spread: 1.0,
  recovery: 0.2,
  roundness: 0.15,
  defects: true,
  grain: 0.01,
})

export function createProjectMaskPath(width, height, options = {}) {
  if (!(width > 0 && height > 0)) return ""
  const settings = { ...projectMaskDefaults, ...options }
  if (options.irregularity !== undefined) settings.grain = options.irregularity
  return correctedRectangle(width, height, options.seed ?? 1, settings)
}
