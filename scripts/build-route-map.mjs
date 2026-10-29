// Precomputes the dotted map behind the "Next trip" card, so the app ships dots, not map data.
// Usage: npm run map   (writes src/data/route-map.json)
//
// The map is framed on the destination: the Pacific and the Americas, with Mexico City in the open
// space at the card's upper right, clear of the text. Change REGION if the next trip's destination changes.
// The app places the city pin itself with the same Mercator math dotted-map uses (see RouteMap.jsx).
// This script checks that math against the library before writing the file.
import { writeFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import DottedMap, { getMapJSON } from "dotted-map"

const REGION = { lat: { min: -19, max: 46 }, lng: { min: -174, max: -84 } }
const SETTINGS = { width: 64, grid: "diagonal", region: REGION }
// Countries that can be a destination in the mock data. Their dots light up when they're the next trip.
const COUNTRIES = ["MEX", "COL", "PRT", "ESP", "TUR", "THA", "JPN"]
const out = fileURLToPath(new URL("../src/data/route-map.json", import.meta.url))

const round = (n) => Math.round(n * 100) / 100
const key = (p) => `${round(p.x)},${round(p.y)}`
const map = JSON.parse(getMapJSON(SETTINGS))
const all = new Set(Object.values(map.points).map(key))

const highlight = {}
for (const id of COUNTRIES) {
  const country = JSON.parse(getMapJSON({ ...SETTINGS, countries: [id] }))
  const pts = Object.values(country.points).filter((p) => all.has(key(p))) // same grid, so these are a subset
  if (pts.length) highlight[id] = pts.map((p) => [round(p.x), round(p.y)])
}

const data = {
  width: map.width,
  height: round(map.height),
  X_MIN: map.X_MIN,
  Y_MAX: map.Y_MAX,
  X_RANGE: map.X_RANGE,
  Y_RANGE: map.Y_RANGE,
  points: Object.values(map.points).map((p) => [round(p.x), round(p.y)]),
  highlight,
}

// Same formula as the app: WGS84 ellipsoidal Mercator, then onto the grid.
const A = 6378137
const E = 0.0818191908426
function project(lat, lng) {
  const phi = (lat * Math.PI) / 180
  const es = E * Math.sin(phi)
  const x = A * ((lng * Math.PI) / 180)
  const y = A * Math.log(Math.tan(Math.PI / 4 + phi / 2) * ((1 - es) / (1 + es)) ** (E / 2))
  return { x: (data.width * (x - data.X_MIN)) / data.X_RANGE, y: (data.height * (data.Y_MAX - y)) / data.Y_RANGE }
}

const lib = new DottedMap(SETTINGS)
for (const [name, lat, lng] of [["Mexico City", 19.43, -99.13], ["Honolulu", 21.31, -157.86]]) {
  const ours = project(lat, lng)
  const theirs = lib.getPin({ lat, lng }) // snapped to the nearest dot
  const off = Math.hypot(ours.x - theirs.x, ours.y - theirs.y)
  console.log(`${name}: ours ${ours.x.toFixed(2)}, ${ours.y.toFixed(2)}  library ${theirs.x}, ${theirs.y}  off by ${off.toFixed(2)}`)
  if (off > 1) throw new Error(`Projection for ${name} is off by ${off.toFixed(2)} dots`)
}

await writeFile(out, JSON.stringify(data))
const lit = Object.entries(highlight).map(([id, p]) => `${id} ${p.length}`).join(", ") || "none"
console.log(`Wrote ${data.points.length} dots (${data.width} x ${data.height}), highlights: ${lit}`)
