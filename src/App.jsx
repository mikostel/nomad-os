import { useEffect, useRef, useState } from "react"
import { CircleCheck, Columns2, Headset, Laptop, PanelRightClose, PanelRightOpen, RotateCcw, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Browser, Fit, Phone } from "@/components/app/device"
import { Wordmark } from "@/components/app/kit"
import { ANNOTATIONS, JUMP_GROUPS, SCREEN_META } from "@/data/screens"
import { activeThreadOf, initialLoss, useStore } from "@/lib/store"
import { replyFor } from "@/data/travel"
import { COUNTRIES } from "@/data/mock"
import { OPERATOR_CHANNEL } from "@/screens/operator/Operator"
import { cn } from "@/lib/utils"

import Home from "@/screens/trip/Home"
import AddTrip from "@/screens/trip/AddTrip"
import Layers from "@/screens/trip/Layers"
import Network from "@/screens/trip/Network"
import Money from "@/screens/trip/Money"
import Numbers from "@/screens/trip/Numbers"
import Safety from "@/screens/trip/Safety"
import Vault from "@/screens/trip/Vault"
import SafetyTab from "@/screens/trip/SafetyTab"
import Agent from "@/screens/trip/Agent"
import BookingDetail from "@/screens/trip/BookingDetail"
import { Declined, Triage, Waiting, Words } from "@/screens/loss/Browser"
import KeyholderPhone from "@/screens/loss/KeyholderPhone"

const PHONE_SCREENS = { home: Home, addTrip: AddTrip, layers: Layers, network: Network, money: Money, numbers: Numbers, safety: Safety, vault: Vault, safetyTab: SafetyTab, agent: Agent, booking: BookingDetail }
// Screens that read a country profile. Jumping to one installs the next trip's profile first.
const PROFILE_SCREENS = ["layers", "network", "money", "numbers", "safety"]

function currentKey(st) {
  if (st.mode === "trip") return st.screen === "agent" && st.agentView === "setup" ? "agentSetup" : st.screen
  if (st.loss.step === "triage") return "triage"
  if (st.loss.step === "words") return "words"
  return "waiting"
}

/** Jumps straight to a screen by its deck key, from the side panel or a #link. */
function useJump() {
  const { set } = useStore()
  return (k) => {
    if (!SCREEN_META[k]) return
    if (SCREEN_META[k].group !== "loss") {
      set((s) => {
        if (k === "agentSetup") return { mode: "trip", screen: "agent", agentView: "setup", params: { ...s.params, countryId: s.trips[0]?.countryId } }
        if (k === "agent") return { mode: "trip", screen: "agent", agentView: "chat" }
        // A booking screen needs a booking. Open the latest one, or stay put if there's none.
        if (k === "booking") return s.bookings.length ? { mode: "trip", screen: k, params: { ...s.params, bookingId: s.bookings.at(-1).id } } : {}
        const patch = { mode: "trip", screen: k, pickingKeyholder: false }
        if (PROFILE_SCREENS.includes(k)) {
          const id = s.trips[0]?.countryId || s.current
          patch.params = { countryId: id, from: "home" }
          if (!s.profiles[id]?.installed) patch.profiles = { ...s.profiles, [id]: { ...(s.profiles[id] || {}), ...newIfMissing(s, id), installed: true } }
        }
        return patch
      })
    } else {
      const step = { words: "words", waiting: "waiting", triage: "triage" }[k]
      set((s) => ({ mode: "loss", loss: { ...s.loss, step, ana: k === "triage" ? "approved" : k === "waiting" ? "locked" : s.loss.ana } }))
    }
  }
}

/** Keeps the URL hash on the current screen, so links like #triage open it directly. */
function useHashLinks(key, jump) {
  useEffect(() => {
    const open = () => jump(decodeURIComponent(location.hash.slice(1)))
    open()
    window.addEventListener("hashchange", open)
    return () => window.removeEventListener("hashchange", open)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (location.hash !== `#${key}`) history.replaceState(null, "", `#${key}`)
  }, [key])
}

/**
 * User testing: an operator panel in a second window (#operator) can watch the chat and answer as the agent.
 * The two windows talk over BroadcastChannel, so it works with no server.
 */
function useOperatorBridge() {
  const { st, set, go, agentReply } = useStore()
  const latest = useRef(st)
  latest.current = st
  const channel = useRef(null)
  const snapshot = () => {
    const s = latest.current
    const t = activeThreadOf(s)
    return { type: "state", wizard: s.wizard, screen: currentKey(s), thread: t?.title || "New chat", chat: (t?.messages || []).map((m) => ({ id: m.id, from: m.from, text: m.text, card: m.card?.type })) }
  }
  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return
    const c = new BroadcastChannel(OPERATOR_CHANNEL)
    channel.current = c
    c.onmessage = ({ data: m }) => {
      const trip = latest.current.trips[0]
      const ctx = trip ? { tripCity: COUNTRIES[trip.countryId].city, tripDates: trip.dates } : {}
      if (m.type === "hello") c.postMessage(snapshot())
      if (m.type === "wizard") set({ wizard: m.on })
      if (m.type === "say") agentReply([{ text: m.text }], 600)
      if (m.type === "intent") agentReply(replyFor(m.intent, ctx))
      if (m.type === "show-agent") { set({ mode: "trip", agentView: "chat" }); go("agent") }
    }
    return () => c.close()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { channel.current?.postMessage(snapshot()) }, [st.threads, st.activeThread, st.wizard, st.screen, st.mode]) // eslint-disable-line react-hooks/exhaustive-deps
}

/** Presenter mode hides the side panel, so the device gets the whole stage. Remembered per browser. */
function usePanelPref() {
  const [open, setOpen] = useState(() => {
    try { return localStorage.getItem("nomad-os:panel") !== "hidden" } catch { return true }
  })
  const toggle = () => setOpen((o) => {
    try { localStorage.setItem("nomad-os:panel", o ? "hidden" : "shown") } catch { /* not saved */ }
    return !o
  })
  return [open, toggle]
}

function Toast({ msg, banner }) {
  return (
    <div key={msg.id} role="status"
      className={cn("absolute z-30 flex items-center gap-2 border bg-background font-medium shadow-lg",
        banner ? "notif-in left-3 right-3 top-[54px] rounded-2xl px-3.5 py-2.5 text-[13px] leading-snug"
          : "toast-in left-1/2 top-4 -translate-x-1/2 rounded-lg px-4 py-2.5 text-sm max-w-[90%]")}>
      <CircleCheck className="size-4 text-success shrink-0" />{msg.m}
    </div>
  )
}

function SidePanel() {
  const { st } = useStore()
  const key = currentKey(st)
  const meta = SCREEN_META[key]
  const notes = ANNOTATIONS[key]
  const jump = useJump()

  return (
    <aside className="lg:w-[340px] shrink-0 border-t lg:border-t-0 lg:border-l bg-background overflow-auto">
      <div className="p-5">
        <p className="text-sm font-medium text-primary">{meta.label}</p>
        <h1 className="text-[24px] font-semibold tracking-[-0.03em] mt-1">{meta.title}</h1>
        {notes ? (
          <ul className="mt-5 flex flex-col gap-3.5">
            {notes.map((a) => (
              <li key={a.k} className="flex gap-2.5 text-[14.5px] leading-snug">
                <span className="grid place-items-center size-[22px] rounded-full bg-primary text-primary-foreground font-mono text-[11px] font-semibold shrink-0">{a.k}</span>
                <span className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
                  <span>{a.t}</span>
                  {a.ev?.map((e) => <span key={e} className="font-mono text-[11.5px] font-medium px-1.5 rounded-[5px] bg-muted border text-muted-foreground">{e}</span>)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-[14.5px] text-muted-foreground leading-relaxed">{meta.note}</p>
        )}

        <Separator className="my-6" />
        <p className="text-[13px] font-semibold text-muted-foreground mb-1">Jump to a screen</p>
        <nav className="flex flex-col gap-0.5">
          {JUMP_GROUPS.map((g) => (
            <div key={g.label} className="flex flex-col gap-0.5">
              <p className="text-[12px] text-faint mt-3 mb-1 px-2">{g.label}</p>
              {g.items.map((k) => (
                <button key={k} onClick={() => jump(k)} aria-current={k === key ? "page" : undefined}
                  className={cn("flex items-center gap-3 rounded-md px-2 py-1.5 text-sm text-left cursor-pointer outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                    k === key ? "bg-info-soft text-primary font-medium" : "hover:bg-accent")}>
                  <span className="font-mono text-[11.5px] w-[60px] text-muted-foreground">{SCREEN_META[k].label}</span>
                  {SCREEN_META[k].title}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <Separator className="my-6" />
        <p className="text-[13px] font-semibold text-muted-foreground">User testing</p>
        <p className="text-[13px] text-muted-foreground mt-1 leading-snug">
          Answer as the agent from a second window while someone tries the prototype.
          {st.wizard && <span className="block mt-1 font-medium text-primary">The operator is answering right now.</span>}
        </p>
        <Button variant="outline" size="sm" className="mt-3"
          onClick={() => window.open(`${location.pathname}${location.search}#operator`, "nomad-os-operator", "width=1000,height=760")}>
          <Headset />Open operator panel
        </Button>
      </div>
    </aside>
  )
}

function newIfMissing(s, id) {
  return s.profiles[id] ? {} : { wifiVpn: true, hotspotVpn: false, essentials: true, backup: false, linesSet: true }
}

export default function App() {
  const { st, set, toastMsg, reset, callouts, setCallouts } = useStore()
  const PhoneScreen = PHONE_SCREENS[st.screen]
  const twoDevices = st.mode === "loss" && st.loss.step !== "words"
  // Both devices scale down to fit side by side. Focusing one shows it at full size for presenting.
  const [focus, setFocus] = useState("both")
  const showLaptop = !twoDevices || focus !== "phone"
  const showPhone = twoDevices && focus !== "laptop"
  const stage = !twoDevices ? [920, 600] : focus === "both" ? [1360, 836] : focus === "laptop" ? [920, 640] : [390, 836]
  useHashLinks(currentKey(st), useJump())
  useOperatorBridge()
  const [panel, togglePanel] = usePanelPref()

  return (
    <div className="h-full flex flex-col">
      <header className="shrink-0 border-b bg-background">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
          <div className="flex items-center gap-3">
            <Wordmark className="text-[17px]" />
            <span className="text-sm text-muted-foreground hidden sm:inline">Clickable prototype</span>
          </div>
          <Tabs value={st.mode} onValueChange={(m) => set((s) => ({ mode: m, loss: m === "loss" && s.loss.step === "triage" && s.loss.triageDone.length === 5 ? initialLoss() : s.loss }))}>
            <TabsList>
              <TabsTrigger value="trip"><Smartphone />Before a trip</TabsTrigger>
              <TabsTrigger value="loss"><Laptop />After a loss</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex items-center gap-4">
            <Label className="text-muted-foreground font-normal cursor-pointer">
              <Switch checked={callouts} onCheckedChange={setCallouts} aria-label="Show callouts" />
              Callouts
            </Label>
            <Button variant="outline" size="sm" onClick={togglePanel} aria-pressed={!panel}>
              {panel ? <PanelRightClose /> : <PanelRightOpen />}{panel ? "Hide notes" : "Show notes"}
            </Button>
            <Button variant="outline" size="sm" onClick={reset}><RotateCcw />Reset</Button>
          </div>
        </div>
      </header>

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
        <main className="relative flex-1 min-h-[560px]"
          style={{ backgroundImage: "radial-gradient(color-mix(in srgb, var(--primary) 14%, transparent) 1px, transparent 1.3px)", backgroundSize: "22px 22px" }}>
          {st.mode === "trip" ? (
            <Fit w={390} h={800}>
              <Phone label="Dani's phone" overlay={toastMsg && <Toast msg={toastMsg} banner />}>
                <PhoneScreen key={`${st.screen}-${st.params.countryId || ""}`} />
              </Phone>
            </Fit>
          ) : (
            <Fit w={stage[0]} h={stage[1]}>
              <div className="flex items-center justify-center gap-12 h-full">
                {showLaptop && (
                  <div className="flex flex-col items-center gap-3">
                    {twoDevices && <p className="text-[14px] font-medium text-muted-foreground">Dani, on a borrowed laptop</p>}
                    <Browser url={st.loss.step === "triage" ? "nomados.app/break-glass/triage" : "nomados.app/break-glass"}>
                      {st.loss.step === "words" && <Words />}
                      {st.loss.step === "waiting" && <Waiting />}
                      {st.loss.step === "declined" && <Declined />}
                      {st.loss.step === "triage" && <Triage />}
                    </Browser>
                  </div>
                )}
                {showPhone && <KeyholderPhone />}
              </div>
            </Fit>
          )}

          {twoDevices && (
            <Tabs value={focus} onValueChange={setFocus} className="absolute left-4 top-4 z-20">
              <TabsList aria-label="Devices to show">
                <TabsTrigger value="both"><Columns2 />Both</TabsTrigger>
                <TabsTrigger value="laptop"><Laptop />Laptop</TabsTrigger>
                <TabsTrigger value="phone"><Smartphone />Phone</TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          {toastMsg && st.mode !== "trip" && <Toast msg={toastMsg} />}
        </main>
        {panel && <SidePanel />}
      </div>
    </div>
  )
}
