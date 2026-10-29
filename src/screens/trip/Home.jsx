import { Download, Globe, Plane, Plus, ShieldCheck, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Co, CountryCode, Group, Row, Screen, SectionLabel, Sub, TabBar, Wordmark } from "@/components/app/kit"
import { COUNTRIES } from "@/data/mock"
import { activeBookings, readyCount, tripFor, useStore } from "@/lib/store"
import { SECURITY, TODAY, TOMORROW, detectIntent, replyFor } from "@/data/travel"
import { cn } from "@/lib/utils"
import { KIND_ICON } from "./AgentChat"
import RouteMap from "@/components/app/RouteMap"

function ProfileButton({ countryId, big }) {
  const { st, go, startDownload } = useStore()
  const p = st.profiles[countryId]
  const dl = st.downloading?.id === countryId ? st.downloading : null
  const ready = p?.installed ? readyCount(st, countryId) : 0

  if (dl) {
    return (
      <div className={big ? "h-12 rounded-xl bg-white/10 px-4 flex flex-col justify-center gap-2" : "w-[110px] flex flex-col gap-1"}>
        <div className="flex justify-between text-[12px]"><span>Downloading</span><span className="font-mono">{Math.round(dl.pct)}%</span></div>
        <Progress value={dl.pct}
          className={big ? "*:data-[slot=progress-track]:bg-white/15 **:data-[slot=progress-indicator]:bg-white" : "*:data-[slot=progress-track]:h-1 *:data-[slot=progress-track]:bg-primary/20"} />
      </div>
    )
  }
  if (p?.installed) {
    return big ? (
      <Button size="xl" variant="light" className="w-full" onClick={() => go("layers", { countryId, from: "home" })}>
        Open profile
        <Badge variant={ready === 4 ? "success" : "warning"} className="rounded-full">{ready === 4 ? "Ready" : `${4 - ready} to fix`}</Badge>
      </Button>
    ) : (
      <Badge variant={ready === 4 ? "success" : "warning"}>{ready === 4 ? "Ready" : `${4 - ready} to fix`}</Badge>
    )
  }
  return big ? (
    <Button size="xl" variant="light" className="w-full" onClick={() => startDownload(countryId)} disabled={!!st.downloading}>
      <Download />Download profile
    </Button>
  ) : (
    <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); startDownload(countryId) }} disabled={!!st.downloading}>
      <Download />Get
    </Button>
  )
}

/** Today's and upcoming plans in date order, with how each one is protected. */
function useItinerary() {
  const { st } = useStore()
  const trip = st.trips[0]
  const items = activeBookings(st).map((b) => ({ ...b, order: b.kind === "hotel" ? 3 : 0 }))
  if (trip?.start) {
    const c = COUNTRIES[trip.countryId]
    const p = st.profiles[trip.countryId]
    const left = p?.installed ? 4 - readyCount(st, trip.countryId) : null
    if (trip.flight) {
      items.push({
        id: "flight", kind: "flight", date: trip.start, day: "Fri Oct 16", order: 1,
        title: `Flight to ${c.city}`, sub: `${trip.from} ${trip.flight.depart} to ${c.airport} ${trip.flight.arrive}`, security: SECURITY.flight,
      })
    }
    items.push({
      id: "profile", kind: "profile", date: trip.start, day: "Fri Oct 16", order: 2, countryId: trip.countryId,
      title: `${c.city} profile turns on`,
      sub: left === null ? "Download it before you fly" : left ? `${left} to fix before you go` : "All four layers ready",
      warn: left !== 0,
    })
    if (!items.some((i) => i.kind === "hotel")) {
      items.push({ id: "no-hotel", kind: "ask", date: trip.start, day: "Fri Oct 16", order: 3, title: "No place to stay yet", sub: "Ask the agent to find one", ask: "Book a hotel in Mexico City" })
    }
  }
  items.sort((a, b) => (a.date || "").localeCompare(b.date || "") || a.order - b.order)
  const days = []
  for (const it of items) {
    const label = it.date === TODAY.iso ? `Today, ${it.day}` : it.date === TOMORROW.iso ? `Tomorrow, ${it.day}` : it.day
    const day = days.find((d) => d.label === label) || (days.push({ label, items: [] }), days.at(-1))
    day.items.push(it)
  }
  return days
}

function ItineraryRow({ it }) {
  const { st, set, go, newThread, addMessages, agentReply } = useStore()
  const trip = st.trips[0]
  const Icon = it.kind === "profile" ? Globe : it.kind === "ask" ? Sparkles : KIND_ICON[it.kind]
  const askAgent = () => {
    // A request from Trips gets its own chat, not the end of whatever thread was open.
    set({ agentView: "chat" })
    const id = newThread()
    addMessages([{ text: it.ask }], "me", id)
    agentReply(replyFor(detectIntent(it.ask), { tripCity: COUNTRIES[trip.countryId].city, tripDates: trip.dates }), 750, id)
    go("agent")
  }
  const open = it.kind === "flight" ? undefined
    : it.kind === "profile" ? () => go("layers", { countryId: it.countryId, from: "home" })
    : it.kind === "ask" ? askAgent
    : () => go("booking", { bookingId: it.id })
  return (
    <Row onClick={open} chevron={!!open} className="items-start">
      <span className="flex items-start gap-3 min-w-0">
        <span className={cn("grid place-items-center size-9 rounded-xl shrink-0 mt-0.5", it.kind === "ask" ? "bg-background border border-dashed text-primary" : it.warn ? "bg-warning-soft text-warning" : "bg-info-soft text-primary")}>
          <Icon className="size-[18px]" />
        </span>
        <span className="min-w-0">
          <span className="block font-semibold leading-snug">{it.title}</span>
          <Sub className={cn(it.warn && "text-warning")}>{it.brief || it.sub}</Sub>
          {it.security?.[0] && (
            <span className="flex items-center gap-1 mt-1 text-[12px] text-muted-foreground"><ShieldCheck className="size-3 text-success shrink-0" />{it.security[0]}</span>
          )}
        </span>
      </span>
    </Row>
  )
}

export default function Home() {
  const { st, go } = useStore()
  const current = COUNTRIES[st.current]
  const [next, ...later] = st.trips
  const nextC = next && COUNTRIES[next.countryId]
  const days = useItinerary()
  // Profiles live with trips now: where you are, where you're going, then where you've been.
  const order = (id) => (id === st.current ? 0 : tripFor(st, id) ? 1 : 2)
  const profiles = Object.entries(st.profiles).filter(([, p]) => p.installed).sort((a, b) => order(a[0]) - order(b[0]))

  return (
    <>
      <Screen id="home">
        <div className="flex items-center justify-between mt-2">
          <Wordmark />
          <Badge variant="success" className="rounded-full"><span className="size-1.5 rounded-full bg-success" />In {current.name}</Badge>
        </div>

        {next ? (
          <div className="relative mt-4 rounded-3xl bg-navy text-white p-5 shrink-0 ring-1 ring-white/10">
            {/* The destination on a dotted map, faded out behind the text rows. On its own clipped layer so the callouts can still overhang the card. */}
            <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none [mask-image:linear-gradient(to_bottom,transparent_26%,black_40%,black_58%,transparent_92%)]">
              <RouteMap to={nextC} className="size-full" />
            </div>
            <Co n={1} className="-right-1.5 -top-1.5" />
            <div className="relative">
            <p className="text-[13px] text-[#A3AECB]">{next.inDays ? `Next trip, in ${next.inDays} days` : `Next trip, ${next.dates}`}</p>
            <div className="flex items-center gap-3 mt-2 font-mono font-semibold text-[26px] tracking-wide">
              <span>{next.from}</span>
              <span className="flex-1 flex items-center gap-1.5 text-[#9DB3FF]">
                <span className="flex-1 border-t border-dashed border-[#9DB3FF]/50" /><Plane className="size-[18px]" /><span className="flex-1 border-t border-dashed border-[#9DB3FF]/50" />
              </span>
              <span>{nextC.airport}</span>
            </div>
            <p className="text-[18px] font-semibold mt-4 tracking-[-0.01em]">{nextC.city} profile</p>
            <p className="text-[13px] text-[#A3AECB] mt-0.5">Updated {nextC.updated}, from {nextC.reports} nomad reports</p>
            <div className="relative mt-4">
              <Co n={2} className="-right-2.5 -top-2.5" />
              <ProfileButton countryId={next.countryId} big />
            </div>
            {!st.profiles[next.countryId]?.installed && st.downloading?.id !== next.countryId && (
              <p className="text-[12px] text-[#A3AECB] text-center mt-2.5">About 10 minutes to set up</p>
            )}
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-3xl border border-dashed p-6 text-center">
            <p className="font-semibold">No trips yet</p>
            <p className="text-[13px] text-muted-foreground mt-1">Add one to get its country profile.</p>
          </div>
        )}

        {days.length > 0 && (
          <>
            <SectionLabel>Coming up</SectionLabel>
            <div className="flex flex-col gap-3">
              {days.map((d) => (
                <div key={d.label}>
                  <p className="text-[12px] font-medium text-muted-foreground px-1 mb-1.5">{d.label}</p>
                  <Group>{d.items.map((it) => <ItineraryRow key={it.id} it={it} />)}</Group>
                </div>
              ))}
            </div>
          </>
        )}

        {later.length > 0 && (
          <>
            <SectionLabel>Later trips</SectionLabel>
            <Group>
              {later.map((t) => {
                const c = COUNTRIES[t.countryId]
                const inst = st.profiles[t.countryId]?.installed
                return (
                  <Row key={t.id} onClick={inst ? () => go("layers", { countryId: t.countryId, from: "home" }) : undefined}>
                    <span className="flex items-center gap-3 min-w-0">
                      <CountryCode code={t.countryId} />
                      <span className="min-w-0"><span className="block font-medium">{c.city}</span><Sub>{t.dates}</Sub></span>
                    </span>
                    <ProfileButton countryId={t.countryId} />
                  </Row>
                )
              })}
            </Group>
          </>
        )}

        <Button variant="outline" className="mt-3 h-11 rounded-xl border-dashed shadow-none" onClick={() => go("addTrip")}>
          <Plus />Add a trip
        </Button>

        <SectionLabel>Your profiles</SectionLabel>
        <Group>
          {profiles.map(([id, p]) => {
            const ready = readyCount(st, id)
            const trip = tripFor(st, id)
            return (
              <Row key={id} onClick={() => go("layers", { countryId: id, from: "home" })} chevron>
                <span className="flex items-center gap-3 min-w-0">
                  <CountryCode code={id} />
                  <span className="min-w-0"><span className="block font-medium">{COUNTRIES[id].city}, {COUNTRIES[id].name}</span><Sub>{id === st.current ? "You’re here" : trip ? trip.dates : `Last used ${p.ended}`}</Sub></span>
                </span>
                <span className="ml-auto">
                  {id === st.current ? <Badge variant="success">Active</Badge>
                    : p.ended ? <Badge variant="outline">Ended</Badge>
                    : <Badge variant={ready === 4 ? "info" : "warning"}>{ready === 4 ? "Ready" : `${4 - ready} to fix`}</Badge>}
                </span>
              </Row>
            )
          })}
        </Group>
        <p className="text-[12.5px] text-muted-foreground mt-2 mb-2 px-1">Profiles update as nomads report what worked. Every note shows a count and a date.</p>
      </Screen>
      <div className="px-5"><TabBar active="home" /></div>
    </>
  )
}
