// All data here is mock content for the prototype. Country notes are illustrative,
// not researched travel or legal guidance.
import { SEED_THREADS, blankThread } from "@/data/travel"

export const USER = { name: "Dani", homeLine: "+1 ••• ••• 4471" }

export const COUNTRIES = {
  PRT: {
    id: "PRT", lat: 38.72, lng: -9.14, name: "Portugal", city: "Lisbon", airport: "LIS", reports: 276, updated: "Oct 2026",
    vpnNote: "No VPN restrictions reported.", vpnWarn: false,
    flaggedApps: ["Checking"],
    esim: { plan: "25 GB, 30 days", needsSetup: false },
    emergency: "112", carrier: "+1 800 555 0199",
  },
  MEX: {
    id: "MEX", lat: 19.43, lng: -99.13, name: "Mexico", city: "Mexico City", airport: "MEX", reports: 214, updated: "Oct 2026",
    vpnNote: "No VPN restrictions reported in Mexico.", vpnWarn: false,
    flaggedApps: ["Checking", "Wise"],
    esim: { plan: "20 GB, 30 days", needsSetup: false },
    emergency: "911", carrier: "+1 800 555 0199",
  },
  COL: {
    id: "COL", lat: 6.24, lng: -75.58, name: "Colombia", city: "Medellín", airport: "MDE", reports: 168, updated: "Sep 2026",
    vpnNote: "No VPN restrictions reported in Colombia.", vpnWarn: false,
    flaggedApps: ["Checking"],
    esim: { plan: "15 GB, 30 days", needsSetup: false },
    emergency: "123", carrier: "+1 800 555 0199",
  },
  THA: {
    id: "THA", lat: 13.76, lng: 100.5, name: "Thailand", city: "Bangkok", airport: "BKK", reports: 302, updated: "Oct 2026",
    vpnNote: "No VPN restrictions reported. Some banking apps block foreign exits.", vpnWarn: false,
    flaggedApps: ["Checking", "Wise", "Work email"],
    esim: { plan: "30 GB, 30 days", needsSetup: true, setupNote: "Local eSIMs need passport registration. Do it at the airport kiosk." },
    emergency: "191", carrier: "+1 800 555 0199",
  },
  TUR: {
    id: "TUR", lat: 41.01, lng: 28.98, name: "Türkiye", city: "Istanbul", airport: "IST", reports: 133, updated: "Aug 2026",
    vpnNote: "Some sites are blocked here, and VPN reports change often. Check the dates on each report.", vpnWarn: true,
    flaggedApps: ["Checking", "Wise"],
    esim: { plan: "10 GB, 15 days", needsSetup: false },
    emergency: "112", carrier: "+1 800 555 0199",
  },
  ESP: {
    id: "ESP", lat: 41.39, lng: 2.17, name: "Spain", city: "Barcelona", airport: "BCN", reports: 187, updated: "Jul 2026",
    vpnNote: "No VPN restrictions reported.", vpnWarn: false,
    flaggedApps: ["Checking"],
    esim: { plan: "20 GB, 30 days", needsSetup: false },
    emergency: "112", carrier: "+1 800 555 0199",
  },
  JPN: {
    id: "JPN", lat: 35.68, lng: 139.69, name: "Japan", city: "Tokyo", airport: "HND", reports: 241, updated: "Mar 2026",
    vpnNote: "No VPN restrictions reported.", vpnWarn: false,
    flaggedApps: ["Wise"],
    esim: { plan: "20 GB, 30 days", needsSetup: false },
    emergency: "110", carrier: "+1 800 555 0199",
  },
}

export const DATE_OPTIONS = ["Nov 4 to Nov 20", "Nov 22 to Dec 14", "Jan 6 to Feb 2"]

export const CONTACTS = [
  { id: "ana", name: "Ana", relation: "sister", pronoun: "her", place: "Ohio", localTime: "4:09", phone: "+1 ••• 2290", bg: "#F2C9A8", ink: "#5A3418" },
  { id: "marco", name: "Marco", relation: "friend", pronoun: "his", place: "Lisbon", localTime: "8:09", phone: "+351 ••• 118", bg: "#C9E4D6", ink: "#1F4D38" },
  { id: "priya", name: "Priya", relation: "coworker", pronoun: "her", place: "Austin", localTime: "3:09", phone: "+1 ••• 7715", bg: "#D9D2F5", ink: "#3B2D7A" },
]

export const ACCOUNTS = [
  { id: "email", name: "Personal email", method: "Authenticator", sms: false },
  { id: "checking", name: "Checking", method: "Texts to home line", sms: true, smsOnly: true },
  { id: "wise", name: "Wise", method: "Authenticator", sms: false },
  { id: "work", name: "Work email", method: "Passkey", sms: false },
  { id: "social", name: "Instagram", method: "Texts to home line", sms: true, smsOnly: false },
]

export const DEMO_WORDS = ["harbor", "velvet", "orbit", "maple", "quiet", "lantern", "copper", "ribbon", "summit", "thistle", "canvas", "ember"]

// {keyholder} is replaced with the chosen Keyholder's name.
export const TRIAGE = [
  { title: "Freeze cards", detail: "Checking debit, savings, and Wise", action: "Freeze all 3", done: "3 cards frozen" },
  { title: "Mark phone as lost", detail: "Locks the screen and shows {keyholder}’s number", action: "Mark lost", done: "marked lost" },
  { title: "Lock your SIM", detail: "From abroad, call +1 800 555 0199. Free over Wi-Fi.", action: "Call carrier", done: "SIM locked" },
  { title: "Sign out other email sessions", detail: "Ends every session except this tab", action: "Sign out others", done: "4 sessions ended" },
  { title: "Change your vault password", detail: "{keyholder}’s approval stays valid", action: "Change password", done: "password changed" },
]

export const ESCALATIONS = [
  { who: "Card issuer", how: "Ask for the fraud team, not general support.", count: 21 },
  { who: "Carrier", how: "Request a SIM lock on the international line.", count: 12 },
  { who: "Email provider", how: "Use the recovery form, not chat.", count: 5 },
]

export const REQUEST_MINUTE = 14 * 60 + 9 // 2:09 pm

export const newProfile = (countryId, installed = false) => ({
  installed,
  wifiVpn: true,
  hotspotVpn: false,
  essentials: true,
  backup: false,
  linesSet: !COUNTRIES[countryId].esim.needsSetup,
})

export const initialLoss = () => ({
  step: "words", // words | waiting | declined | triage
  ana: "locked", // locked | review | approved | declined
  words: Array(12).fill(""),
  shared: true,
  triageDone: [],
  clock: 14 * 60 + 14,
  secondsLeft: 23 * 3600 + 41 * 60,
  escalationOpen: false,
})

export const initialState = () => ({
  mode: "trip", // trip | loss
  screen: "home",
  params: {},
  current: "PRT",
  // "Today" in the before-a-trip flow is Tue Oct 13. The lost-phone flow happens mid-trip, on Mon Oct 26.
  trips: [{ id: "t1", countryId: "MEX", dates: "Oct 16 to Nov 2", from: "LIS", inDays: 3, start: "2026-10-16", flight: { depart: "11:05", arrive: "15:40" } }],
  profiles: {
    PRT: { ...newProfile("PRT", true), backup: true },
    ESP: { ...newProfile("ESP", true), backup: true, ended: "Jul 2026" },
    JPN: { ...newProfile("JPN", true), backup: true, ended: "Mar 2026" },
  },
  downloading: null, // { id, pct }
  keyholder: { contactId: "ana", status: "none" }, // none | sending | sent
  pickingKeyholder: false,
  movedOffSms: [],
  showWords: false,
  agent: {}, // per country: { phase: intro | checking | results, share, decisions }
  agentView: "chat", // chat | setup
  // Agent chats. Each thread: { id, title, when, updated, typing, messages }.
  // A message: { id, from: agent | me, text?, card?: { type, ..., state } }. typing counts replies on their way.
  threads: [blankThread("c0"), ...SEED_THREADS],
  activeThread: "c0",
  wizard: false, // operator panel controls the agent's replies (user testing)
  bookings: [], // { id, kind: train | table | delivery | hotel, title, sub }
  loss: initialLoss(),
})
