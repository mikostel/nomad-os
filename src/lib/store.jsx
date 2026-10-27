import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
import { COUNTRIES, CONTACTS, initialLoss, initialState, newProfile } from "@/data/mock"

const StoreContext = createContext(null)
let msgSeq = 0

/* ---------- saved state: a reload mid-demo picks up where you were ---------- */
export const STORAGE_KEY = "nomad-os:state"
// Bump this whenever the shape of the mock data or state changes. Saves from an older build are
// thrown away instead of loaded, so a stale save can never crash the prototype.
const SAVE_VERSION = 3

function loadState() {
  try {
    localStorage.removeItem("nomad-os:state:v2") // the save format before versioning
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (!saved?.st || saved.version !== SAVE_VERSION) return null
    const base = initialState()
    // Fill in fields a save might lack, like a trip's flight, from the current mock data.
    const trips = saved.st.trips.map((t) => ({ ...base.trips.find((b) => b.id === t.id), ...t }))
    const st = { ...base, ...saved.st, trips, loss: { ...initialLoss(), ...saved.st.loss }, downloading: null, chatTyping: 0 }
    // Keep new message ids unique after a reload.
    msgSeq = Math.max(0, ...st.chat.map((m) => Number(String(m.id).slice(1)) || 0))
    return { st, callouts: saved.callouts ?? true }
  } catch {
    return null
  }
}

function saveState(st, callouts) {
  try {
    const { downloading, chatTyping, ...rest } = st // eslint-disable-line no-unused-vars
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: SAVE_VERSION, st: rest, callouts }))
  } catch {
    // Storage can be full or blocked. The prototype still works, it just won't survive a reload.
  }
}

export function StoreProvider({ children }) {
  const [saved] = useState(loadState)
  const [st, setSt] = useState(() => saved?.st || initialState())
  const [callouts, setCallouts] = useState(saved?.callouts ?? true)
  const [toastMsg, setToastMsg] = useState(null)
  const toastTimer = useRef()
  const downloadTimer = useRef()

  useEffect(() => { saveState(st, callouts) }, [st, callouts])

  const set = useCallback((patch) => setSt((s) => ({ ...s, ...(typeof patch === "function" ? patch(s) : patch) })), [])
  const setProfile = useCallback((id, patch) =>
    setSt((s) => ({ ...s, profiles: { ...s.profiles, [id]: { ...(s.profiles[id] || newProfile(id)), ...patch } } })), [])
  const setLoss = useCallback((patch) =>
    setSt((s) => ({ ...s, loss: { ...s.loss, ...(typeof patch === "function" ? patch(s.loss) : patch) } })), [])
  const setAgent = useCallback((id, patch) =>
    setSt((s) => {
      const cur = s.agent[id] || initialAgent()
      return { ...s, agent: { ...s.agent, [id]: { ...cur, ...(typeof patch === "function" ? patch(cur) : patch) } } }
    }), [])

  // Chat: your messages appear right away. The agent's appear after a short typing pause.
  // chatTyping counts replies still on their way, so overlapping replies keep the dots up.
  const replyTimers = useRef([])
  const addMessages = useCallback((msgs, from = "me") =>
    setSt((s) => ({ ...s, chat: [...s.chat, ...msgs.map((m) => ({ id: `m${++msgSeq}`, from, ...m }))] })), [])
  const agentReply = useCallback((msgs, delay = 750) => {
    setSt((s) => ({ ...s, chatTyping: s.chatTyping + 1 }))
    replyTimers.current.push(setTimeout(() => {
      setSt((s) => ({ ...s, chatTyping: Math.max(0, s.chatTyping - 1), chat: [...s.chat, ...msgs.map((m) => ({ id: `m${++msgSeq}`, from: "agent", ...m }))] }))
    }, delay))
  }, [])
  const updateCard = useCallback((id, patch) =>
    setSt((s) => ({ ...s, chat: s.chat.map((m) => (m.id === id ? { ...m, card: { ...m.card, state: { ...m.card.state, ...patch } } } : m)) })), [])

  const addBooking = useCallback((b) => setSt((s) => ({ ...s, bookings: [...s.bookings, { status: "booked", ...b }] })), [])
  const cancelBooking = useCallback((id) =>
    setSt((s) => ({ ...s, bookings: s.bookings.map((b) => (b.id === id ? { ...b, status: "cancelled" } : b)) })), [])

  const go = useCallback((screen, params = {}) => setSt((s) => ({ ...s, screen, params: { ...s.params, ...params } })), [])

  const toast = useCallback((m) => {
    clearTimeout(toastTimer.current)
    setToastMsg({ m, id: Date.now() })
    toastTimer.current = setTimeout(() => setToastMsg(null), 2600)
  }, [])

  /** Downloads a country profile. When it finishes, opens `then` (Four layers unless told otherwise). */
  const startDownload = useCallback((id, then = "layers") => {
    clearInterval(downloadTimer.current)
    let pct = 0
    setSt((s) => ({ ...s, downloading: { id, pct: 1 } }))
    downloadTimer.current = setInterval(() => {
      pct += 9 + Math.random() * 12
      if (pct >= 100) {
        clearInterval(downloadTimer.current)
        setSt((s) => ({
          ...s,
          downloading: null,
          profiles: { ...s.profiles, [id]: { ...(s.profiles[id] || newProfile(id)), installed: true } },
          screen: then,
          params: { ...s.params, countryId: id, from: then === "layers" ? "home" : s.params.from },
        }))
        toast(`${COUNTRIES[id].city} profile downloaded`)
      } else {
        setSt((s) => ({ ...s, downloading: { id, pct } }))
      }
    }, 120)
  }, [toast])

  const reset = useCallback(() => {
    clearInterval(downloadTimer.current)
    replyTimers.current.forEach(clearTimeout)
    replyTimers.current = []
    try { localStorage.removeItem(STORAGE_KEY) } catch { /* nothing saved */ }
    setSt(initialState())
    setToastMsg(null)
  }, [])

  // Live countdown while triage is open
  useEffect(() => {
    if (st.mode !== "loss" || st.loss.step !== "triage") return
    const t = setInterval(() => setLoss((l) => ({ secondsLeft: Math.max(0, l.secondsLeft - 1) })), 1000)
    return () => clearInterval(t)
  }, [st.mode, st.loss.step, setLoss])

  const value = {
    st, set, setProfile, setLoss, setAgent, addMessages, agentReply, updateCard, addBooking, cancelBooking,
    go, toast, toastMsg, startDownload, reset, callouts, setCallouts,
  }
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export const useStore = () => useContext(StoreContext)

/* ---------- selectors ---------- */
export const keyholderContact = (st) => CONTACTS.find((c) => c.id === st.keyholder.contactId)

export function tripFor(st, countryId) {
  return st.trips.find((t) => t.countryId === countryId)
}

export function layerStatus(st, countryId) {
  const p = st.profiles[countryId] || newProfile(countryId)
  const c = COUNTRIES[countryId]
  const kh = keyholderContact(st)
  return [
    { key: "network", name: "Network", ready: true, sub: p.wifiVpn ? `VPN on café Wi-Fi, ${c.flaggedApps.length} direct` : "VPN off on café Wi-Fi" },
    { key: "money", name: "Money", ready: p.backup, sub: p.backup ? "Trip lock and backup set" : "Add a backup account" },
    { key: "numbers", name: "Numbers", ready: p.linesSet, sub: p.linesSet ? "Home line plus local eSIM" : "Set up your local line" },
    { key: "safety", name: "Safety net", ready: st.keyholder.status === "sent", sub: st.keyholder.status === "sent" ? `${kh.name} is your Keyholder` : "Choose a Keyholder" },
  ]
}

export const initialAgent = () => ({ phase: "intro", share: { trip: true, money: true, lines: true, signins: true }, decisions: {} })
export const agentFor = (st, countryId) => st.agent[countryId] || initialAgent()

export function readyCount(st, countryId) {
  return layerStatus(st, countryId).filter((l) => l.ready).length
}

export const activeBookings = (st) => st.bookings.filter((b) => b.status !== "cancelled")

export { initialLoss }
