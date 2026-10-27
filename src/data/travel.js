// Mock content for the Agent chat: trains, restaurants, delivery, and hotels.
// Every name, price, rating, and review is invented for the prototype.
// "Today" is Tue Oct 13. Dani is in Lisbon, and the Mexico City trip (Oct 16 to Nov 2) starts in 3 days.

export const TODAY = { iso: "2026-10-13", label: "Tue Oct 13" }
export const TOMORROW = { iso: "2026-10-14", label: "Wed Oct 14" }
export const PAY_WITH = "Checking debit •• 4417"
export const HOME_ADDRESS = "Rua da Rosa 22, 3rd floor"

/** Purchases above this need Face ID, not just a tap. */
export const STEP_UP_USD = 100

/* ---------- money: local price first, then roughly what it is in dollars ---------- */
const RATE = { EUR: 1.08, MXN: 0.055 }
export const toUsd = (amount, cur) => Math.round(amount * RATE[cur])
export const price = (amount, cur) =>
  cur === "EUR" ? `€${amount.toFixed(2)}` : `MX$${amount.toLocaleString("en-US")}`
export const about = (amount, cur) => `about $${toUsd(amount, cur).toLocaleString("en-US")}`

export const GREETING = "Hi Dani. You’re in Lisbon, and Mexico City is in 3 days. What do you need?"

export const TILES = [
  { key: "train", label: "Book a train", sub: "Lisbon to Porto", text: "Book a train to Porto tomorrow" },
  { key: "restaurants", label: "Find dinner", sub: "Nearby, with reviews", text: "Find dinner near me" },
  { key: "delivery", label: "Order delivery", sub: "To your apartment", text: "Order delivery tonight" },
  { key: "hotel", label: "Book a hotel", sub: "Mexico City, Oct 16", text: "Book a hotel in Mexico City" },
]
export const SETUP_TEXT = "Check my setup for Mexico City"

export const SUGGESTIONS = [
  { label: "Train to Porto", text: TILES[0].text },
  { label: "Dinner nearby", text: TILES[1].text },
  { label: "Order delivery", text: TILES[2].text },
  { label: "Hotel in Mexico City", text: TILES[3].text },
  { label: "Check my setup", text: SETUP_TEXT },
]

export const TRAINS = [
  { id: "t1", train: "Intercity 511", depart: "07:09", arrive: "10:04", duration: "2h 55m", price: 25.3, note: "Plenty of seats" },
  { id: "t2", train: "Express 121", depart: "08:39", arrive: "11:28", duration: "2h 49m", price: 31.5, note: "Quiet car, power at every seat" },
  { id: "t3", train: "Express 125", depart: "12:39", arrive: "15:28", duration: "2h 49m", price: 31.5, note: "12 seats left" },
]
export const TRAIN_ROUTE = { from: "Lisboa Oriente", to: "Porto Campanhã", day: TOMORROW.label }

export const RESTAURANTS = [
  {
    id: "r1", name: "Tasca do Largo", cuisine: "Portuguese", price: "€€", rating: 4.7, count: 312, walk: "6 min walk",
    reviews: [
      { who: "Lena, designer", text: "Grilled sea bass was perfect. Go before 8, it fills up fast." },
      { who: "Tomás, developer", text: "Small and loud in a good way. Cards work, no cash needed." },
    ],
  },
  {
    id: "r2", name: "Casa Verde", cuisine: "Vegetarian", price: "€€", rating: 4.6, count: 189, walk: "9 min walk",
    reviews: [
      { who: "Aiko, writer", text: "Best lentil stew in the city. Quiet enough for a call after." },
      { who: "Sam, PM", text: "Slow service on weekends, but worth it." },
    ],
  },
  {
    id: "r3", name: "Pátio 14", cuisine: "Seafood", price: "€€€", rating: 4.5, count: 427, walk: "12 min walk",
    risk: "Wants a €50 deposit by bank transfer to hold a table.",
    reviews: [
      { who: "Marta, consultant", text: "Garden seating, great octopus. Book ahead on Fridays." },
      { who: "Jon, engineer", text: "Pricey, and they asked me for a transfer deposit by text. Felt off." },
    ],
  },
]
export const TABLE_TIMES = ["7:30 pm", "8:00 pm", "8:30 pm", "9:00 pm"]
export const PARTY_SIZES = [1, 2, 4]

export const DELIVERY = [
  {
    id: "d1", name: "Bifana Corner", cuisine: "Sandwiches", rating: 4.6, eta: "25 to 35 min", fee: 1.99,
    items: [{ id: "a", name: "Pork bifana", price: 4.5 }, { id: "b", name: "Fries", price: 2.8 }, { id: "c", name: "Sparkling water", price: 1.5 }],
  },
  {
    id: "d2", name: "Sushi Alfama", cuisine: "Japanese", rating: 4.7, eta: "35 to 45 min", fee: 2.49,
    items: [{ id: "a", name: "Salmon set, 12 pieces", price: 14.9 }, { id: "b", name: "Miso soup", price: 3.2 }, { id: "c", name: "Green tea", price: 2.0 }],
  },
  {
    id: "d3", name: "Green Bowl", cuisine: "Salads and bowls", rating: 4.5, eta: "20 to 30 min", fee: 1.49,
    items: [{ id: "a", name: "Falafel bowl", price: 9.8 }, { id: "b", name: "Lemonade", price: 2.9 }, { id: "c", name: "Brownie", price: 3.4 }],
  },
]

export const HOTEL_NIGHTS = 17
export const HOTELS = [
  { id: "h1", name: "Casa Roma Suites", area: "Roma Norte", rating: 4.8, count: 540, perNight: 1400, mbps: 210, perks: ["Desk in room", "24-hour front desk", "In-room safe"] },
  { id: "h2", name: "Hotel Parque Condesa", area: "Condesa", rating: 4.6, count: 812, perNight: 1730, mbps: 150, perks: ["Gym", "24-hour front desk", "Key card elevator"] },
  { id: "h3", name: "Nómada Coliving", area: "Juárez", rating: 4.5, count: 233, perNight: 940, mbps: 300, perks: ["Coworking floor", "Weekly cleaning", "Lockers"] },
]
/** The listing the agent leaves out, and says why. */
export const SCAM_HOTEL = {
  name: "Reforma Luxury Loft", perNight: 520,
  reason: "It asks you to pay by wire, outside the booking site, and the listing is 3 days old with no reviews. That’s a common scam pattern.",
}

/** What each kind of booking protects, shown on confirm cards, in Trips, and on the booking screen. */
export const SECURITY = {
  train: ["Ticket works offline, no data needed", "VPN stays on for train Wi-Fi"],
  table: ["Shares only your name and phone number"],
  delivery: ["Courier sees your door for this order only"],
  hotel: ["Hotel Wi-Fi tested, and your VPN stays on", "Paid with your trip-locked card"],
  flight: ["Home line stays on for bank codes"],
}

/** Matches a typed request to a flow. Order matters: "order food" is delivery, not dinner. */
export function detectIntent(text) {
  const t = text.toLowerCase()
  if (/(train|rail|porto|ticket)/.test(t)) return "train"
  if (/(hotel|stay|room|accommodation|place to sleep)/.test(t)) return "hotel"
  if (/(deliver|takeaway|takeout|take-out|order food|order in)/.test(t)) return "delivery"
  if (/(restaurant|dinner|lunch|brunch|breakfast|eat|food|review|table)/.test(t)) return "restaurants"
  if (/(setup|secure|security|safe|ready|check)/.test(t)) return "setup"
  return "help"
}

/* ---------- chat threads ---------- */
// The agent keeps one thread per conversation. A new thread opens with the greeting.
export const blankThread = (id, updated = 0) => ({
  id, title: "", when: "Today", updated, typing: 0,
  messages: [{ id: `${id}-hi`, from: "agent", text: GREETING, greeting: true }],
})

// A thread is named after its first request, so history reads like a list of trips, not timestamps.
const THREAD_TITLE = { train: "Train to Porto", restaurants: "Dinner nearby", delivery: "Delivery tonight", hotel: "Hotel in Mexico City", setup: "Setup check" }
export const titleFor = (text) => {
  const t = text.trim()
  return THREAD_TITLE[detectIntent(t)] || (t.length > 34 ? `${t.slice(0, 32).trimEnd()}…` : t)
}

// Past chats from the trips already in the mock data (Barcelona in July, Tokyo in March).
export const SEED_THREADS = [
  {
    id: "seed-bcn", title: "Hotel in Barcelona", when: "Jul 2026", updated: -1, typing: 0, pastBookings: 1,
    messages: [
      { id: "seed-bcn-1", from: "me", text: "Find a quiet place to stay in Barcelona, Jul 2 to 20" },
      { id: "seed-bcn-2", from: "agent", text: "Booked Gràcia Courtyard Rooms for 18 nights. The Wi-Fi tested at 180 Mbps, and your VPN stays on there." },
    ],
  },
  {
    id: "seed-kyo", title: "Train to Kyoto", when: "Mar 2026", updated: -2, typing: 0, pastBookings: 1,
    messages: [
      { id: "seed-kyo-1", from: "me", text: "Train from Tokyo to Kyoto on Friday morning" },
      { id: "seed-kyo-2", from: "agent", text: "Booked the 9:03 express to Kyoto, seat 7D. Your ticket works offline, so you won’t need data on the train." },
    ],
  },
]

export const INTENT_LABEL ={ train: "Train options", restaurants: "Restaurants", delivery: "Delivery places", hotel: "Hotels", setup: "Setup check card", help: "What I can do" }

/** The agent's first reply to each kind of request. The chat and the operator panel both use this. */
export function replyFor(intent, { tripCity = "Mexico City", tripDates = "your dates" } = {}) {
  switch (intent) {
    case "train":
      return [{ text: `Here are trains from Lisbon to Porto tomorrow, ${TRAIN_ROUTE.day}. Pick one and I’ll show you every detail before anything is booked.`, card: { type: "trains", state: {} } }]
    case "restaurants":
      return [{ text: "Three places near you in Príncipe Real, with what other nomads said.", card: { type: "restaurants", state: {} } }]
    case "delivery":
      return [{ text: `These deliver to ${HOME_ADDRESS} tonight.`, card: { type: "delivery", state: {} } }]
    case "hotel":
      return [
        { text: `Hotels in ${tripCity} for ${tripDates}, ${HOTEL_NIGHTS} nights. Each one has Wi-Fi other nomads tested and a front desk open around the clock.`, card: { type: "hotels", state: {} } },
        { text: `I left one listing out: ${SCAM_HOTEL.name}, at ${price(SCAM_HOTEL.perNight, "MXN")} a night.`, card: { type: "risk", title: "Not offered", reason: SCAM_HOTEL.reason, state: {} } },
      ]
    case "setup":
      return [{ text: `I’ll check your ${tripCity} profile against your banks, lines, and accounts. You choose what I can see first.`, card: { type: "setup", state: {} } }]
    default:
      return [{ text: "I can book a train, find a place to eat, order delivery, book a hotel, or check your setup. Pick one below or tell me what you need." }]
  }
}
