import { useState } from "react"
import { Check, ChefHat, CircleCheck, ShieldCheck, Sparkles, Store, Bike } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Back, Group, Note, Row, Screen, SectionLabel, Title } from "@/components/app/kit"
import { USER } from "@/data/mock"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"

/** A scannable-looking code drawn from the booking ref. Decorative: the ref below it is the real thing. */
function TicketCode({ value }) {
  const n = 21
  let h = 2166136261
  for (const ch of value) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  const bit = (x, y) => {
    const finder = (fx, fy) => x >= fx && x < fx + 7 && y >= fy && y < fy + 7
    if (finder(0, 0) || finder(n - 7, 0) || finder(0, n - 7)) {
      const lx = x < 7 ? x : x - (n - 7), ly = y < 7 ? y : y - (n - 7)
      return lx === 0 || ly === 0 || lx === 6 || ly === 6 || (lx >= 2 && lx <= 4 && ly >= 2 && ly <= 4)
    }
    h = Math.imul(h ^ (x * 31 + y), 16777619)
    return (h >>> 7) % 2 === 0
  }
  const cells = []
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (bit(x, y)) cells.push(<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" />)
  return <svg viewBox={`-1 -1 ${n + 2} ${n + 2}`} className="size-[132px] rounded-lg bg-white p-1 text-[#16181d]" fill="currentColor" aria-hidden="true">{cells}</svg>
}

const STEPS = [{ label: "Order received", icon: Store }, { label: "Cooking", icon: ChefHat }, { label: "On the way", icon: Bike }]

function Pass({ b }) {
  if (b.kind === "train") {
    return (
      <div className="mt-4 rounded-2xl border bg-muted p-4 flex items-center gap-4">
        <TicketCode value={b.ref} />
        <div className="min-w-0">
          <p className="text-[12.5px] text-muted-foreground">Show this to the conductor</p>
          <p className="font-mono font-semibold text-[15px] mt-1">{b.ref}</p>
          <p className="text-[12.5px] text-muted-foreground mt-2">Saved on this phone. Works with no signal.</p>
        </div>
      </div>
    )
  }
  if (b.kind === "delivery") {
    return (
      <div className="mt-4 rounded-2xl border bg-muted p-4">
        <ol className="flex items-center justify-between">
          {STEPS.map((s, i) => (
            <li key={s.label} className="flex flex-col items-center gap-1.5 flex-1">
              <span className={cn("grid place-items-center size-9 rounded-full", i <= 1 ? "bg-primary text-primary-foreground" : "bg-background border text-faint")}><s.icon className="size-4" /></span>
              <span className={cn("text-[12px]", i === 1 ? "font-semibold" : "text-muted-foreground")}>{s.label}</span>
            </li>
          ))}
        </ol>
        <p className="text-[13px] text-center mt-3">{b.sub}</p>
      </div>
    )
  }
  return (
    <div className="mt-4 rounded-2xl border bg-muted p-4 text-center">
      <p className="text-[12.5px] text-muted-foreground">{b.kind === "hotel" ? "Show this at the front desk" : `Table under ${USER.name}`}</p>
      <p className="font-mono font-semibold text-[22px] tracking-wider mt-1">{b.ref}</p>
    </div>
  )
}

export default function BookingDetail() {
  const { st, go, set, cancelBooking, addMessages, toast } = useStore()
  const b = st.bookings.find((x) => x.id === st.params.bookingId)
  const [asking, setAsking] = useState(false)

  if (!b) {
    return (
      <Screen id="booking-missing">
        <Back label="Trips" onClick={() => go("home")} />
        <Title sub="Book something with the agent and it shows up here.">No booking</Title>
      </Screen>
    )
  }

  const cancelled = b.status === "cancelled"
  const refundText = b.refund ? `You get ${b.refund} back on ${b.kind === "hotel" ? "your card" : "Checking"}.` : "Nothing was charged."
  const doCancel = () => {
    cancelBooking(b.id)
    setAsking(false)
    addMessages([{ text: `I cancelled ${b.title}. ${refundText}` }], "agent")
    toast(`${b.title} cancelled`)
  }

  return (
    <Screen id={`booking-${b.id}`}>
      <Back label="Trips" onClick={() => go("home")} />
      <div className="flex items-start justify-between gap-3">
        <Title sub={`${b.day}${b.time ? `, ${b.time}` : ""}`}>{b.title}</Title>
        <Badge variant={cancelled ? "outline" : "success"} className="mt-4">{!cancelled && <Check strokeWidth={3} />}{cancelled ? "Cancelled" : "Booked"}</Badge>
      </div>

      {!cancelled && <Pass b={b} />}

      <SectionLabel>Details</SectionLabel>
      <Group>
        {b.lines.map(([k, v]) => (
          <Row key={k}><span className="text-muted-foreground shrink-0">{k}</span><span className="text-right">{v}</span></Row>
        ))}
        <Row><span className="text-muted-foreground">Booked by</span><span className="flex items-center gap-1.5"><Sparkles className="size-3.5 text-primary" />Agent, with your OK</span></Row>
      </Group>

      <SectionLabel>How it’s protected</SectionLabel>
      <Group>
        {b.security.map((s) => (
          <Row key={s} className="justify-start"><ShieldCheck className="size-4 text-success shrink-0" /><span>{s}</span></Row>
        ))}
      </Group>

      <div className="mt-auto pt-5 flex flex-col gap-2">
        {cancelled ? (
          <Note tone="quiet" icon={CircleCheck}>Cancelled. {refundText}</Note>
        ) : asking ? (
          <div className="rounded-2xl border p-4">
            <p className="font-semibold">Cancel {b.title}?</p>
            <p className="text-[13px] text-muted-foreground mt-1">{refundText}</p>
            <div className="flex gap-2 mt-3">
              <Button className="flex-1" variant="destructive" onClick={doCancel}>Yes, cancel it</Button>
              <Button variant="outline" onClick={() => setAsking(false)}>Keep it</Button>
            </div>
          </div>
        ) : (
          <>
            <Button size="xl" variant="outline" className="w-full" onClick={() => setAsking(true)}>Cancel booking</Button>
            <Button variant="link" className="w-full" onClick={() => { set({ agentView: "chat" }); go("agent") }}>Ask the agent about this</Button>
          </>
        )}
      </div>
    </Screen>
  )
}
