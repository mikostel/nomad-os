// Precomputes the dotted map on the deck's title slide (deck/title-map.svg).
// Usage: npm run deck:map
//
// The Atlantic, from Mexico to Lisbon: where Dani is now and where the next trip goes.
// Dots are drawn as one stroked path (a zero-length segment per dot), so ~2,000 dots stay small.
import { writeFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import DottedMap, { getMapJSON } from "dotted-map"

const REGION = { lat: { min: -35, max: 68 }, lng: { min: -125, max: 40 } }
const SETTINGS = { width: 116, grid: "diagonal", region: REGION }
const PINS = { from: { name: "Lisbon", lat: 38.72, lng: -9.14 }, to: { name: "Mexico City", lat: 19.43, lng: -99.13 } }
const out = fileURLToPath(new URL("../deck/title-map.svg", import.meta.url))

const r = (n) => Math.round(n * 100) / 100
const key = (p) => `${r(p.x)},${r(p.y)}`
const map = JSON.parse(getMapJSON(SETTINGS))
const points = Object.values(map.points)
const lit = (iso) => new Set(Object.values(JSON.parse(getMapJSON({ ...SETTINGS, countries: [iso] })).points).map(key))
const mex = lit("MEX")
const prt = lit("PRT")
const path = (pts) => pts.map((p) => `M${r(p.x)} ${r(p.y)}h0`).join("")

const lib = new DottedMap(SETTINGS)
const from = lib.getPin(PINS.from)
const to = lib.getPin(PINS.to)
const W = map.width
const H = r(map.height)

const svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<path class="map-land" d="${path(points.filter((p) => !mex.has(key(p)) && !prt.has(key(p))))}"/>
<path class="map-from" d="${path(points.filter((p) => prt.has(key(p))))}"/>
<path class="map-to" d="${path(points.filter((p) => mex.has(key(p))))}"/>
<circle class="pin-from" cx="${r(from.x)}" cy="${r(from.y)}" r="0.62"/>
<circle class="pin-ping" cx="${r(to.x)}" cy="${r(to.y)}" r="0.8"/>
<circle class="pin-to" cx="${r(to.x)}" cy="${r(to.y)}" r="0.8"/>
</svg>
`
await writeFile(out, svg)
const pct = (p) => `left ${r((p.x / W) * 100)}%, top ${r((p.y / H) * 100)}%`
console.log(`Wrote ${points.length} dots (${W} x ${H}, aspect ${r(W / H)}) to deck/title-map.svg, ${Math.round(svg.length / 1024)} KB`)
console.log(`  ${PINS.from.name}: ${pct(from)}   ${PINS.to.name}: ${pct(to)}`)
