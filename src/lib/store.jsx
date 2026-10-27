import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
import { COUNTRIES, CONTACTS, initialLoss, initialState, newProfile } from "@/data/mock"
import { blankThread, titleFor } from "@/data/travel"

const StoreContext = createContext(null)
let msgSeq = 0

/* ---------- saved state: a reload mid-demo picks up where you were ---------- */
export const STORAGE_KEY = "nomad-os:state"
// Bump this when you add a field the code relies on, like a trip's flight. Saves from an older build
// are thrown away instead of loaded, so a stale save can never crash the prototype. Optional fields
// that are fine as undefined (a thread's unread or held) don't need a bump.
const SAVE_VERSION = 4

function loadState() {
  try {
    localStorage.removeItem("nomad-os:state:v2") // the save format before versioning
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (!saved?.st || saved.version !== SAVE_VERSION) return null
    const base = initialState()
    // Fill in fields a save might lack, like a trip's flight, from the current mock data.
    const trips = saved.st.trips.map((t) => ({ ...base.trips.find((b) => b.id === t.id), ...t }))
    // Replies that were on their way when the page closed won't arrive, so no thread is still typing
    // or waiting on the operator.
    const threads = saved.st.threads.map((t) => ({ ...t, typing: 0, held: 0 }))
    const st = { ...base, ...saved.st, trips, threads, loss: { ...initialLoss(), ...saved.st.loss }, downloading: null }
    if (!threads.some((t) => t.id === st.activeThread)) st.activeThread = threads[0]?.id
    // Keep new message and thread ids unique after a reload.
    msgSeq = Math.max(0, ...threads.flatMap((t) => [t.id, ...t.messages.map((m) => m.id)]).map((id) => Number(String(id).slice(1)) || 0))
    return { st, callouts: saved.callouts ?? true }
  } catch {
    return null
  }
}

function saveState(st, callouts) {
  try {
    const { downloading, ...rest } = st // eslint-disable-line no-unused-vars
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

  // Chat threads. Your messages appear right away. The agent's appear after a short typing pause,
  // in the thread they were asked in, even if you've switched threads or started a new one since.
  const replyTimers = useRef([])
  const latest = useRef(st)
  latest.current = st
  const addMessages = useCallback((msgs, from = "me", threadId) =>
    setSt((s) => {
      const id = threadId && s.threads.some((t) => t.id === threadId) ? threadId : s.activeThread
      return withThread(s, id, (t) => ({
        ...t,
        title: t.title || (from === "me" && msgs[0]?.text ? titleFor(msgs[0].text) : ""),
        updated: ++msgSeq,
        messages: [...t.messages, ...msgs.map((m) => ({ id: `m${++msgSeq}`, from, ...m }))],
      }))
    }), [])
  const agentReply = useCallback((msgs, delay = 750, threadId) => {
    const id = threadId || latest.current.activeThread
    setSt((s) => withThread(s, id, (t) => ({ ...t, typing: t.typing + 1 })))
    replyTimers.current.push(setTimeout(() => {
      setSt((s) => withThread(s, id, (t) => ({
        ...t, typing: Math.max(0, t.typing - 1), updated: ++msgSeq,
        // A reply you weren't looking at gets a dot on the Agent tab and in History.
        unread: t.unread || !isViewing(s, id),
        messages: [...t.messages, ...msgs.map((m) => ({ id: `m${++msgSeq}`, from: "agent", ...m }))],
      })))
    }, delay))
  }, [])
  const markRead = useCallback((id) => setSt((s) => withThread(s, id, (t) => ({ ...t, unread: false }))), [])
  // User testing: while the operator answers instead of the script, the thread shows typing dots
  // until a reply arrives, so the participant knows the agent is working on it.
  const holdForOperator = useCallback((id) => setSt((s) => withThread(s, id, (t) => ({ ...t, held: (t.held || 0) + 1 }))), [])
  const releaseHold = useCallback((id) => setSt((s) => withThread(s, id, (t) => ({ ...t, held: 0 }))), [])
  const updateCard = useCallback((id, patch) =>
    setSt((s) => ({
      ...s,
      threads: s.threads.map((t) => (t.messages.some((m) => m.id === id)
        ? { ...t, messages: t.messages.map((m) => (m.id === id ? { ...m, card: { ...m.card, state: { ...m.card.state, ...patch } } } : m)) }
        : t)),
    })), [])

  /** Starts a fresh thread and returns its id. If the open thread is still empty, keeps using it. */
  const newThread = useCallback(() => {
    const s = latest.current
    const open = s.threads.find((t) => t.id === s.activeThread)
    if (open && isEmptyThread(open)) return open.id
    const t = blankThread(`c${++msgSeq}`, ++msgSeq)
    // Empty threads aren't worth keeping, so starting one drops any others.
    setSt((cur) => ({ ...cur, threads: [t, ...cur.threads.filter((x) => !isEmptyThread(x))], activeThread: t.id }))
    return t.id
  }, [])
  const openThread = useCallback((id) =>
    setSt((s) => ({ ...s, activeThread: id, threads: s.threads.filter((t) => t.id === id || !isEmptyThread(t)) })), [])
  /** Deletes a thread. Its bookings stay. Deleting the open thread starts a fresh one. */
  const deleteThread = useCallback((id) =>
    setSt((s) => {
      let threads = s.threads.filter((t) => t.id !== id)
      let activeThread = s.activeThread
      if (!threads.some((t) => t.id === activeThread)) {
        const t = blankThread(`c${++msgSeq}`, ++msgSeq)
        threads = [t, ...threads]
        activeThread = t.id
      }
      return { ...s, threads, activeThread }
    }), [])

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
    st, set, setProfile, setLoss, setAgent, addMessages, agentReply, updateCard, markRead, holdForOperator, releaseHold,
    newThread, openThread, deleteThread, addBooking, cancelBooking,
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

/* ---------- chat threads ---------- */
function withThread(s, id, fn) {
  return { ...s, threads: s.threads.map((t) => (t.id === id ? fn(t) : t)) }
}
export const isEmptyThread = (t) => !t.messages.some((m) => m.from === "me")
/** Is this thread on screen right now? */
const isViewing = (s, id) => s.mode === "trip" && s.screen === "agent" && s.agentView !== "setup" && s.activeThread === id
export const activeThreadOf = (st) => st.threads.find((t) => t.id === st.activeThread) || st.threads[0]
/** Bookings made in a thread that still stand, plus any from before this prototype's session. */
export const threadBookings = (st, t) => (t.pastBookings || 0) + st.bookings.filter((b) => b.threadId === t.id && b.status !== "cancelled").length

export { initialLoss }
