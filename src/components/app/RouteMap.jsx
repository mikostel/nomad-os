import MAP from "@/data/route-map.json"

// Dotted map framed on the destination, precomputed with dotted-map by scripts/build-route-map.mjs.
// The pin uses the same WGS84 Mercator math as the library, so it lands on the right dot.
const A = 6378137
const E = 0.0818191908426
function project(lat, lng) {
  const phi = (lat * Math.PI) / 180
  const es = E * Math.sin(phi)
  const x = A * ((lng * Math.PI) / 180)
  const y = A * Math.log(Math.tan(Math.PI / 4 + phi / 2) * ((1 - es) / (1 + es)) ** (E / 2))
  return { x: (MAP.width * (x - MAP.X_MIN)) / MAP.X_RANGE, y: (MAP.height * (MAP.Y_MAX - y)) / MAP.Y_RANGE }
}
const onMap = (p) => p.x > 1 && p.x < MAP.width - 1 && p.y > 1 && p.y < MAP.height - 1

/**
 * A dotted map with the destination country lit up and a pin on the city.
 * Decorative: the card's text already says where you're going, and the route lives in the text row.
 */
export default function RouteMap({ to, className }) {
  const pin = project(to.lat, to.lng)
  const lit = MAP.highlight[to.id] || []

  return (
    <svg viewBox={`0 0 ${MAP.width} ${MAP.height}`} preserveAspectRatio="xMidYMid slice" className={className} aria-hidden="true">
      <g fill="#9DB3FF" opacity="0.18">
        {MAP.points.map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="0.3" />)}
      </g>
      <g fill="#9DB3FF" opacity="0.4">
        {lit.map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="0.3" />)}
      </g>
      {onMap(pin) && (
        <g>
          <circle className="map-ping" cx={pin.x} cy={pin.y} r="0.8" fill="#FFFFFF" opacity="0.4" />
          <circle cx={pin.x} cy={pin.y} r="0.8" fill="#FFFFFF" opacity="0.9" />
        </g>
      )}
    </svg>
  )
}
