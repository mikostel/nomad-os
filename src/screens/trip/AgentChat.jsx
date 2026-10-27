import { useEffect, useRef, useState } from "react"
import {
  ArrowUp, BedDouble, Bike, Check, ChevronRight, Clock, CreditCard, MapPin, Minus, Plane, Plus, ScanFace, ShieldAlert, ShieldCheck,
  Sparkles, Star, TrainFront, Utensils, Wifi,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Co, TabBar } from "@/components/app/kit"
import {
  DELIVERY, GREETING, HOME_ADDRESS, HOTELS, HOTEL_NIGHTS, PARTY_SIZES, PAY_WITH, RESTAURANTS, SECURITY, SETUP_TEXT, STEP_UP_USD,
  SUGGESTIONS, TABLE_TIMES, TILES, TODAY, TOMORROW, TRAINS, TRAIN_ROUTE, about, detectIntent, price, replyFor, toUsd,
} from "@/data/travel"
import { COUNTRIES } from "@/data/mock"
import { readyCount, useStore } from "@/lib/store"
import { cn } from "@/lib/utils"

export const KIND_ICON = { train: TrainFront, table: Utensils, delivery: Bike, hotel: BedDouble, flight: Plane }
const TILE_ICON = { train: TrainFront, restaurants: Utensils, delivery: Bike, hotel: BedDouble }

/* ---------- flows: what the agent says next ---------- */
function useFlows() {
  const { st, set, go, addMessages, agentReply, updateCard, addBooking } = useStore()
  const trip = st.trips[0]
  const tripCity = trip ? COUNTRIES[trip.countryId].city : "your next stop"
  const ctx = { tripCity, tripDates: trip?.dates }

  const send = (text) => {
    if (!text.trim()) return
    addMessages([{ text: text.trim() }])
    // During a user test, the operator panel answers instead of the script.
    if (!st.wizard) agentReply(replyFor(detectIntent(text), ctx))
  }

  const choose = (msg, patch, echo, next) => {
    updateCard(msg.id, patch)
    addMessages([{ text: echo }])
    agentReply(next)
  }

  const confirm = (msg) => {
    const c = msg.card
    updateCard(msg.id, { status: "confirmed" })
    const ref = `NMD-${(4200 + Number(msg.id.slice(1)) * 37).toString(36).toUpperCase()}`
    addBooking({ ...c.booking, id: msg.id, ref })
    const next = [{ text: c.done, card: { type: "receipt", kind: c.kind, title: c.title, summary: c.booking.sub, ref, bookingId: msg.id, state: {} } }]
    // Booking the trip's hotel is a good moment to point at what isn't ready yet.
    if (c.kind === "hotel" && trip && readyCount(st, trip.countryId) < 4) {
      const left = 4 - readyCount(st, trip.countryId)
      next.push({ text: `Before you fly: your ${tripCity} profile has ${left} ${left === 1 ? "thing" : "things"} to fix.`, card: { type: "setup", state: {} } })
    }
    agentReply(next, 900)
  }
  const cancel = (msg) => {
    updateCard(msg.id, { status: "cancelled" })
    agentReply([{ text: "No problem. Nothing was booked and nothing was shared." }])
  }
  const change = (msg) => {
    updateCard(msg.id, { status: "changed" })
    addMessages([{ text: "Let me change that" }])
    agentReply([{ text: "Sure. Pick again and I’ll update it.", card: { ...msg.card.redo, state: { ...msg.card.redo.state } } }])
  }

  const openSetup = () => { set({ agentView: "setup" }); go("agent", { countryId: trip?.countryId }) }

  return { send, choose, confirm, cancel, change, openSetup, trip, tripCity }
}

/* ---------- small pieces ---------- */
function AgentText({ children }) {
  return <p className="self-start max-w-[94%] text-[14px] leading-relaxed">{children}</p>
}

function MyBubble({ children }) {
  return <div className="self-end max-w-[86%] rounded-2xl rounded-br-md bg-primary text-primary-foreground px-3.5 py-2 text-[14px] leading-snug">{children}</div>
}

function CardShell({ children, className }) {
  return <div className={cn("relative self-stretch rounded-2xl border bg-background p-3", className)}>{children}</div>
}

function OptionList({ children }) {
  return <div className="self-stretch flex flex-col gap-2">{children}</div>
}

function Stars({ rating, count }) {
  return <span className="inline-flex items-center gap-1 text-[12.5px]"><Star className="size-3.5 fill-warning text-warning" /><b className="font-semibold">{rating}</b>{count && <span className="text-muted-foreground">({count})</span>}</span>
}

/** One tappable option. Every list in the chat selects the same way: tap the row. */
function Pick({ selected, done, onClick, children, label, footer }) {
  return (
    <div className={cn("rounded-xl border transition-colors", selected ? "border-primary bg-info-soft" : done && "opacity-50")}>
      <button onClick={onClick} disabled={done} aria-label={label}
        className={cn("w-full text-left px-3 py-2.5 flex items-center gap-2 rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50", !done && "hover:bg-accent/60")}>
        <span className="flex-1 min-w-0">{children}</span>
        {selected ? <Check className="size-4 text-primary shrink-0" strokeWidth={2.6} /> : !done && <ChevronRight className="size-4 text-faint shrink-0" />}
      </button>
      {footer}
    </div>
  )
}

const usdOf = (c) => (c.total ? toUsd(c.total.amount, c.total.cur) : 0)

/* ---------- option cards ---------- */
function Trains({ msg, flows }) {
  const { selected } = msg.card.state
  const pickTrain = (t) => flows.choose(msg, { selected: t.id }, `The ${t.depart} ${t.train}, please`, [{
    text: "Here’s what I’ll book. Check it, then confirm.",
    card: {
      type: "confirm", kind: "train", title: "Lisbon to Porto", total: { amount: t.price, cur: "EUR" }, payNow: true,
      lines: [["Train", t.train], ["When", `${TRAIN_ROUTE.day}, ${t.depart} to ${t.arrive}`], ["From", TRAIN_ROUTE.from], ["To", TRAIN_ROUTE.to], ["Seat", "2nd class, 1 adult"]],
      shared: "Shares your name with the rail company for the ticket.", terms: "Charged now. Free changes until 1 hour before departure.",
      done: "Booked. Your ticket is in Trips and works offline, so you won’t need data on the train. Your VPN stays on for the train’s Wi-Fi.",
      booking: {
        kind: "train", title: "Train to Porto", sub: `${TRAIN_ROUTE.day}, ${t.depart} ${t.train}`, brief: `${t.depart} ${t.train} from ${TRAIN_ROUTE.from}`, date: TOMORROW.iso, day: TOMORROW.label, time: t.depart, security: SECURITY.train,
        lines: [["Train", t.train], ["Departs", `${t.depart}, ${TRAIN_ROUTE.from}`], ["Arrives", `${t.arrive}, ${TRAIN_ROUTE.to}`], ["Seat", "Coach 4, seat 32"], ["Paid", price(t.price, "EUR")]],
        refund: price(t.price, "EUR"),
      },
      redo: { type: "trains", state: {} }, state: {},
    },
  }])
  return (
    <OptionList>
      {TRAINS.map((t) => (
        <Pick key={t.id} selected={selected === t.id} done={!!selected} onClick={() => pickTrain(t)} label={`${t.depart} ${t.train}, ${price(t.price, "EUR")}`}>
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono font-semibold text-[15px]">{t.depart} <span className="text-muted-foreground font-normal">to</span> {t.arrive}</span>
            <span className="font-semibold">{price(t.price, "EUR")}</span>
          </div>
          <div className="text-[12.5px] text-muted-foreground mt-0.5">{t.train}, {t.duration}. {t.note}.</div>
        </Pick>
      ))}
    </OptionList>
  )
}

function Restaurants({ msg, flows }) {
  const { selected, flagged = [] } = msg.card.state
  const [open, setOpen] = useState(null)
  const pickPlace = (r) => {
    if (r.risk) {
      // The agent won't pay a deposit by bank transfer. It says why and leaves the other options open.
      flows.choose(msg, { flagged: [...flagged, r.id] }, `Book a table at ${r.name}`, [{
        text: `I didn’t book ${r.name}.`,
        card: { type: "risk", title: "Asks for a bank transfer", reason: `${r.risk} Transfers can’t be reversed if something goes wrong, so I don’t pay that way. The other two take cards, or you can call ${r.name} yourself.`, state: {} },
      }])
      return
    }
    flows.choose(msg, { selected: r.id }, `Book a table at ${r.name}`, [{ text: `When should I book ${r.name}?`, card: { type: "slots", restaurantId: r.id, state: { party: 2 } } }])
  }
  return (
    <OptionList>
      {RESTAURANTS.map((r) => {
        const isFlagged = flagged.includes(r.id)
        return (
          <Pick key={r.id} selected={selected === r.id} done={!!selected || isFlagged} onClick={() => pickPlace(r)} label={`Book a table at ${r.name}`}
            footer={(
              <div className="px-3 pb-2.5 -mt-1">
                {open === r.id && r.reviews.slice(1).map((v) => <p key={v.who} className="text-[12.5px] mb-1.5 leading-snug">“{v.text}” <span className="text-muted-foreground">{v.who}</span></p>)}
                <button onClick={() => setOpen(open === r.id ? null : r.id)} className="text-[12.5px] font-medium text-primary rounded outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
                  {open === r.id ? "Show fewer reviews" : "Read another review"}
                </button>
              </div>
            )}>
            <div className="flex items-start justify-between gap-2">
              <span className="min-w-0">
                <span className="block font-semibold leading-snug">{r.name}</span>
                <span className="block text-[12.5px] text-muted-foreground">{r.cuisine}, {r.price}, {r.walk}</span>
              </span>
              <Stars rating={r.rating} count={r.count} />
            </div>
            {r.risk && <Badge variant="warning" className="mt-1.5"><ShieldAlert />Deposit by bank transfer</Badge>}
            <p className="text-[12.5px] mt-1.5 leading-snug">“{r.reviews[0].text}” <span className="text-muted-foreground">{r.reviews[0].who}</span></p>
          </Pick>
        )
      })}
    </OptionList>
  )
}

function Slots({ msg, flows }) {
  const { updateCard } = useStore()
  const { party, time, done } = msg.card.state
  const r = RESTAURANTS.find((x) => x.id === msg.card.restaurantId)
  const next = () => flows.choose(msg, { done: true }, `${time} for ${party}`, [{
    text: "Here’s the booking. Check it, then confirm.",
    card: {
      type: "confirm", kind: "table", title: r.name,
      lines: [["When", `Tonight, ${time}`], ["Table for", String(party)], ["Where", `${r.walk} from you`]],
      shared: "Shares your name and phone number with the restaurant, nothing else.", terms: "No deposit. Cancel any time before you arrive.",
      done: `Table booked at ${r.name}. It’s in Trips, with directions.`,
      booking: {
        kind: "table", title: r.name, sub: `Tonight, ${time}, table for ${party}`, brief: `${time}, table for ${party}`, date: TODAY.iso, day: TODAY.label, time, security: SECURITY.table,
        lines: [["When", `Tonight, ${time}`], ["Table for", String(party)], ["Where", `${r.walk}, Príncipe Real`]],
      },
      redo: { type: "slots", restaurantId: r.id, state: { party, time } }, state: {},
    },
  }])
  const Chip = ({ on, onClick, children }) => (
    <Button size="sm" variant={on ? "default" : "outline"} className="rounded-full" disabled={done} onClick={onClick}>{children}</Button>
  )
  return (
    <CardShell>
      <p className="text-[12.5px] font-medium text-muted-foreground">People</p>
      <div className="flex gap-1.5 mt-1.5">{PARTY_SIZES.map((n) => <Chip key={n} on={party === n} onClick={() => updateCard(msg.id, { party: n })}>{n}</Chip>)}</div>
      <p className="text-[12.5px] font-medium text-muted-foreground mt-3">Time</p>
      <div className="flex flex-wrap gap-1.5 mt-1.5">{TABLE_TIMES.map((t) => <Chip key={t} on={time === t} onClick={() => updateCard(msg.id, { time: t })}><Clock />{t}</Chip>)}</div>
      {!done && <Button size="sm" className="mt-3 w-full" disabled={!time} onClick={next}>Continue</Button>}
    </CardShell>
  )
}

function Delivery({ msg, flows }) {
  const { selected } = msg.card.state
  const pickPlace = (d) => flows.choose(msg, { selected: d.id }, `Order from ${d.name}`, [{
    text: "Here’s a starting order. Change anything, then review it.",
    card: { type: "basket", placeId: d.id, state: { qty: { a: 1, b: 1, c: 0 } } },
  }])
  return (
    <OptionList>
      {DELIVERY.map((d) => (
        <Pick key={d.id} selected={selected === d.id} done={!!selected} onClick={() => pickPlace(d)} label={`Order from ${d.name}`}>
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold">{d.name}</span>
            <Stars rating={d.rating} />
          </div>
          <div className="text-[12.5px] text-muted-foreground mt-0.5">{d.cuisine}. {d.eta}, {price(d.fee, "EUR")} delivery.</div>
        </Pick>
      ))}
    </OptionList>
  )
}

function Basket({ msg, flows }) {
  const { updateCard } = useStore()
  const { qty, done } = msg.card.state
  const d = DELIVERY.find((x) => x.id === msg.card.placeId)
  const subtotal = d.items.reduce((sum, i) => sum + i.price * (qty[i.id] || 0), 0)
  const count = Object.values(qty).reduce((a, b) => a + b, 0)
  const setQty = (id, n) => updateCard(msg.id, { qty: { ...qty, [id]: Math.max(0, Math.min(9, n)) } })
  const itemLines = d.items.filter((i) => qty[i.id]).map((i) => [`${qty[i.id]} × ${i.name}`, price(i.price * qty[i.id], "EUR")])
  const review = () => flows.choose(msg, { done: true }, "Looks good", [{
    text: "Here’s your order. Confirm when you’re ready.",
    card: {
      type: "confirm", kind: "delivery", title: d.name, total: { amount: subtotal + d.fee, cur: "EUR" }, payNow: true,
      lines: [...itemLines, ["Delivery", price(d.fee, "EUR")], ["To", HOME_ADDRESS]],
      shared: "The courier sees your street and door for this order only.", terms: "Charged now. Free to cancel until the kitchen starts.",
      done: `Order placed with ${d.name}. It should arrive in ${d.eta}.`,
      booking: {
        kind: "delivery", title: `Delivery from ${d.name}`, sub: `${count} ${count === 1 ? "item" : "items"}, arriving in ${d.eta}`, brief: `Arriving in ${d.eta}`, date: TODAY.iso, day: TODAY.label, time: "Tonight", security: SECURITY.delivery,
        lines: [...itemLines, ["To", HOME_ADDRESS], ["Paid", price(subtotal + d.fee, "EUR")]], refund: price(subtotal + d.fee, "EUR"),
      },
      redo: { type: "basket", placeId: d.id, state: { qty } }, state: {},
    },
  }])
  return (
    <CardShell>
      <ul className="flex flex-col divide-y">
        {d.items.map((i) => (
          <li key={i.id} className="flex items-center justify-between gap-2 py-2 first:pt-0">
            <span className="min-w-0"><span className="block text-[14px]">{i.name}</span><span className="text-[12.5px] text-muted-foreground">{price(i.price, "EUR")}</span></span>
            <span className="flex items-center gap-2">
              <Button size="icon-sm" variant="outline" aria-label={`One less ${i.name}`} disabled={done || !qty[i.id]} onClick={() => setQty(i.id, qty[i.id] - 1)}><Minus /></Button>
              <span className="w-4 text-center font-mono text-[13px]">{qty[i.id] || 0}</span>
              <Button size="icon-sm" variant="outline" aria-label={`One more ${i.name}`} disabled={done} onClick={() => setQty(i.id, (qty[i.id] || 0) + 1)}><Plus /></Button>
            </span>
          </li>
        ))}
      </ul>
      <div className="flex justify-between text-[13px] mt-2 pt-2 border-t"><span className="text-muted-foreground">Subtotal</span><span className="font-semibold">{price(subtotal, "EUR")}</span></div>
      {!done && <Button size="sm" className="mt-3 w-full" disabled={!count} onClick={review}>Review order</Button>}
    </CardShell>
  )
}

function Hotels({ msg, flows }) {
  const { selected } = msg.card.state
  const pickHotel = (h) => {
    const total = h.perNight * HOTEL_NIGHTS
    flows.choose(msg, { selected: h.id }, `Book ${h.name}`, [{
      text: "Here’s the stay. Check it, then confirm.",
      card: {
        type: "confirm", kind: "hotel", title: h.name, total: { amount: total, cur: "MXN" }, payNow: false,
        lines: [["Where", `${h.area}, ${flows.tripCity}`], ["Dates", `${flows.trip?.dates}, ${HOTEL_NIGHTS} nights`], ["Room", "Queen room with desk"], ["Per night", price(h.perNight, "MXN")]],
        shared: "Shares your name, phone, and passport number with the hotel for check-in.",
        terms: "Charged in pesos at check-in. Free cancellation until Oct 15. Your card’s trip lock covers Mexico from Oct 16.",
        done: `Booked ${h.name}. It’s in Trips. The Wi-Fi tested at ${h.mbps} Mbps, and your VPN stays on there.`,
        booking: {
          kind: "hotel", title: h.name, sub: `${flows.trip?.dates}, ${h.area}`, brief: `${HOTEL_NIGHTS} nights in ${h.area}`, date: flows.trip?.start, day: "Fri Oct 16", time: "Check-in 3 pm", security: SECURITY.hotel,
          lines: [["Check-in", "Fri Oct 16, from 3 pm"], ["Check-out", "Mon Nov 2, by noon"], ["Where", `${h.area}, ${flows.tripCity}`], ["Room", "Queen room with desk"], ["Total", `${price(total, "MXN")} at check-in`]],
          refund: "the full amount",
        },
        redo: { type: "hotels", state: {} }, state: {},
      },
    }])
  }
  return (
    <OptionList>
      {HOTELS.map((h) => (
        <Pick key={h.id} selected={selected === h.id} done={!!selected} onClick={() => pickHotel(h)} label={`Book ${h.name}, ${price(h.perNight, "MXN")} a night`}>
          <div className="flex items-start justify-between gap-2">
            <span className="min-w-0"><span className="block font-semibold leading-snug">{h.name}</span><span className="text-[12.5px] text-muted-foreground flex items-center gap-1"><MapPin className="size-3" />{h.area}</span></span>
            <span className="text-right shrink-0"><span className="block font-semibold">{price(h.perNight, "MXN")}</span><span className="block text-[11.5px] text-muted-foreground">a night, {about(h.perNight, "MXN")}</span></span>
          </div>
          <div className="flex items-center gap-3 mt-1.5 text-[12.5px]"><Stars rating={h.rating} count={h.count} /><span className="flex items-center gap-1 text-muted-foreground"><Wifi className="size-3.5" />{h.mbps} Mbps tested</span></div>
          <div className="flex flex-wrap gap-1 mt-2">{h.perks.map((p) => <Badge key={p} variant="outline">{p}</Badge>)}</div>
        </Pick>
      ))}
    </OptionList>
  )
}

/* ---------- decision cards ---------- */
function Confirm({ msg, flows, onStepUp }) {
  const c = msg.card
  const { status } = c.state
  const Icon = KIND_ICON[c.kind]
  const stepUp = usdOf(c) > STEP_UP_USD
  const settled = status && status !== "verifying"
  const label = !c.total ? "Confirm" : c.payNow ? "Confirm and pay" : "Confirm booking"
  const badge = { confirmed: "Confirmed", cancelled: "Cancelled", changed: "Changed" }[status]
  return (
    <CardShell className={cn((status === "cancelled" || status === "changed") && "opacity-60")}>
      {!settled && <Co n={20} className="-right-2 -top-2.5" />}
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 font-semibold"><span className="grid place-items-center size-7 rounded-lg bg-info-soft text-primary"><Icon className="size-4" /></span>{c.title}</span>
        {badge && <Badge variant={status === "confirmed" ? "success" : "outline"}>{status === "confirmed" && <Check strokeWidth={3} />}{badge}</Badge>}
      </div>
      <dl className="mt-2.5 flex flex-col gap-1 text-[13px]">
        {c.lines.map(([k, v]) => <div key={k} className="flex justify-between gap-3"><dt className="text-muted-foreground shrink-0">{k}</dt><dd className="text-right">{v}</dd></div>)}
      </dl>
      {c.total && (
        <div className="mt-2 pt-2 border-t">
          <div className="flex justify-between font-semibold"><span>Total</span><span>{price(c.total.amount, c.total.cur)}</span></div>
          <p className="text-right text-[12px] text-muted-foreground">{about(c.total.amount, c.total.cur)}</p>
        </div>
      )}
      <ul className="mt-2 flex flex-col gap-1.5 text-[12.5px] text-muted-foreground leading-snug">
        <li className="flex gap-1.5">{c.total ? <CreditCard className="size-3.5 mt-px shrink-0" /> : <Clock className="size-3.5 mt-px shrink-0" />}{c.total ? `Pays with ${PAY_WITH}. ` : ""}{c.terms}</li>
        <li className="relative flex gap-1.5 pr-4">
          {!settled && <Co n={21} className="-right-2 -top-0.5" />}
          <ShieldCheck className="size-3.5 mt-px shrink-0 text-success" />{c.shared}
        </li>
        {stepUp && (
          <li className="relative flex gap-1.5 pr-4">
            {!settled && <Co n={22} className="-right-2 -top-0.5" />}
            <ScanFace className="size-3.5 mt-px shrink-0 text-primary" />Over ${STEP_UP_USD}, so this needs Face ID, not just a tap.
          </li>
        )}
      </ul>
      {!settled && (
        <div className="flex gap-2 mt-3">
          <Button size="sm" className="flex-1" onClick={() => (stepUp ? onStepUp(msg) : flows.confirm(msg))}>{stepUp ? <ScanFace /> : <Check />}{label}</Button>
          <Button size="sm" variant="outline" onClick={() => flows.change(msg)}>Change</Button>
          <Button size="sm" variant="ghost" onClick={() => flows.cancel(msg)}>Cancel</Button>
        </div>
      )}
    </CardShell>
  )
}

function Risk({ msg }) {
  const c = msg.card
  return (
    <CardShell className="bg-warning-soft border-transparent">
      <Co n={23} className="-right-2 -top-2.5" />
      <p className="flex items-center gap-1.5 font-semibold text-[14px]"><ShieldAlert className="size-4 text-warning" />{c.title}</p>
      <p className="text-[13px] mt-1 leading-snug">{c.reason}</p>
    </CardShell>
  )
}

function Receipt({ msg }) {
  const { go } = useStore()
  const c = msg.card
  const Icon = KIND_ICON[c.kind]
  return (
    <button onClick={() => go("booking", { bookingId: c.bookingId })} aria-label={`Open ${c.title} booking`}
      className="self-stretch rounded-2xl bg-success-soft p-3 flex items-center gap-3 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
      <span className="grid place-items-center size-9 rounded-xl bg-success text-white shrink-0"><Icon className="size-[18px]" /></span>
      <span className="min-w-0 flex-1"><span className="block font-semibold leading-snug">{c.title}</span><span className="block text-[12.5px] text-muted-foreground">{c.summary}</span></span>
      <span className="font-mono text-[11.5px] text-muted-foreground shrink-0">{c.ref}</span>
      <ChevronRight className="size-4 text-faint shrink-0" />
    </button>
  )
}

function SetupCard({ flows }) {
  return (
    <CardShell className="flex items-center gap-3">
      <span className="grid place-items-center size-9 rounded-xl bg-primary text-primary-foreground shrink-0"><Sparkles className="size-[18px]" /></span>
      <span className="flex-1 min-w-0"><span className="block font-semibold leading-snug">Check my setup</span><span className="block text-[12.5px] text-muted-foreground">Explains each fix. You approve every change.</span></span>
      <Button size="sm" onClick={flows.openSetup}>Open</Button>
    </CardShell>
  )
}

const CARDS = { trains: Trains, restaurants: Restaurants, slots: Slots, delivery: Delivery, basket: Basket, hotels: Hotels, confirm: Confirm, risk: Risk, receipt: Receipt, setup: SetupCard }

/* ---------- Face ID: the extra step for big purchases ---------- */
function FaceIdSheet({ msg, onDone, onCancel }) {
  const [ok, setOk] = useState(false)
  const done = useRef(onDone)
  done.current = onDone
  useEffect(() => {
    const a = setTimeout(() => setOk(true), 1100)
    const b = setTimeout(() => done.current(), 1700)
    return () => { clearTimeout(a); clearTimeout(b) }
  }, [])
  const c = msg.card
  return (
    <div className="absolute inset-0 z-20 flex items-end bg-black/40" role="dialog" aria-modal="true" aria-label="Confirm with Face ID">
      <div className="notif-in w-full rounded-t-3xl border-t bg-card px-5 pt-5 pb-6 text-center shadow-2xl">
        <span className={cn("mx-auto grid place-items-center size-16 rounded-2xl transition-colors", ok ? "bg-success-soft text-success" : "bg-info-soft text-primary")}>
          {ok ? <Check className="size-8" strokeWidth={2.6} /> : <ScanFace className="size-8 animate-pulse" />}
        </span>
        <p className="font-semibold mt-3">{ok ? "Confirmed" : "Face ID"}</p>
        <p className="text-[13px] text-muted-foreground mt-1">{price(c.total.amount, c.total.cur)} ({about(c.total.amount, c.total.cur)}) to {c.title}</p>
        <Button variant="ghost" className={cn("mt-2", ok && "invisible")} onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  )
}

/* ---------- screen ---------- */
export default function AgentChat() {
  const { st, updateCard } = useStore()
  const flows = useFlows()
  const [text, setText] = useState("")
  const [verifying, setVerifying] = useState(null)
  const scroller = useRef(null)
  const busy = st.chatTyping > 0
  const started = st.chat.some((m) => m.from === "me")
  const lastAgent = [...st.chat].reverse().find((m) => m.from === "agent" && m.text)

  useEffect(() => {
    const el = scroller.current
    if (el) el.scrollTop = el.scrollHeight
  }, [st.chat, st.chatTyping])

  const submit = (e) => { e.preventDefault(); if (busy) return; flows.send(text); setText("") }
  const stepUp = (msg) => { updateCard(msg.id, { status: "verifying" }); setVerifying(msg) }
  const stepUpDone = () => { flows.confirm(verifying); setVerifying(null) }
  const stepUpCancel = () => { updateCard(verifying.id, { status: undefined }); setVerifying(null) }

  return (
    <div className="relative flex-1 min-h-0 flex flex-col">
      <div className="px-5 pt-2 pb-3 border-b shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="grid place-items-center size-9 rounded-xl bg-primary text-primary-foreground"><Sparkles className="size-[18px]" /></span>
          <span>
            <span className="block text-[17px] font-semibold tracking-[-0.02em] leading-tight">Agent</span>
            <span className="flex items-center gap-1 text-[12px] text-muted-foreground"><ShieldCheck className="size-3 text-success" />Books and pays only when you confirm</span>
          </span>
        </div>
      </div>

      {/* Screen readers hear each new agent message once, not the whole chat again. */}
      <p className="sr-only" aria-live="polite">{lastAgent && lastAgent.id !== "m0" ? lastAgent.text : ""}</p>

      <div ref={scroller} className="flex-1 min-h-0 overflow-y-auto px-4 py-3 flex flex-col gap-3 text-pretty">
        {st.chat.map((m) => {
          const Card = m.card && CARDS[m.card.type]
          return (
            <div key={m.id} className="contents">
              {m.text && (m.from === "me" ? <MyBubble>{m.text}</MyBubble> : <AgentText>{m.id === "m0" ? GREETING : m.text}</AgentText>)}
              {Card && <Card msg={m} flows={flows} onStepUp={stepUp} />}
            </div>
          )
        })}

        {!started && (
          <>
            <div className="grid grid-cols-2 gap-2">
              {TILES.map((t) => {
                const Icon = TILE_ICON[t.key]
                return (
                  <button key={t.key} onClick={() => flows.send(t.text)}
                    className="text-left rounded-2xl border bg-background p-3 hover:bg-accent/60 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
                    <span className="grid place-items-center size-8 rounded-lg bg-info-soft text-primary"><Icon className="size-4" /></span>
                    <span className="block font-semibold mt-2 leading-snug">{t.label}</span>
                    <span className="block text-[12.5px] text-muted-foreground">{t.sub}</span>
                  </button>
                )
              })}
            </div>
            <button onClick={() => flows.send(SETUP_TEXT)}
              className="flex items-center gap-3 rounded-2xl border border-primary/25 bg-info-soft p-3 text-left hover:bg-primary/5 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
              <span className="grid place-items-center size-8 rounded-lg bg-primary text-primary-foreground shrink-0"><Sparkles className="size-4" /></span>
              <span className="flex-1"><span className="block font-semibold leading-snug">Check my setup</span><span className="block text-[12.5px] text-muted-foreground">Before Mexico City</span></span>
              <ChevronRight className="size-4 text-faint" />
            </button>
            <p className="text-[12.5px] text-muted-foreground flex items-start gap-1.5 px-1"><ShieldCheck className="size-3.5 mt-px text-success shrink-0" />Anything that costs money or shares your details waits for your OK.</p>
          </>
        )}

        {busy && (
          <div className="self-start flex gap-1 py-2" aria-label="Agent is typing">
            {[0, 1, 2].map((i) => <span key={i} className="size-1.5 rounded-full bg-muted-foreground/60 animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />)}
          </div>
        )}
      </div>

      <div className="shrink-0 border-t pt-2">
        {started && (
          <div className="flex gap-1.5 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [mask-image:linear-gradient(to_right,black_85%,transparent)]">
            {SUGGESTIONS.map((s) => (
              <Button key={s.label} size="sm" variant="outline" className="rounded-full shrink-0" disabled={busy} onClick={() => flows.send(s.text)}>{s.label}</Button>
            ))}
          </div>
        )}
        <form onSubmit={submit} className="flex items-center gap-2 px-4">
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Ask for a train, dinner, a hotel…" aria-label="Message the agent" className="h-10 rounded-full px-4" />
          <Button type="submit" size="icon" className="rounded-full shrink-0 size-10" aria-label="Send" disabled={!text.trim() || busy}><ArrowUp /></Button>
        </form>
      </div>
      <div className="px-5"><TabBar active="agent" /></div>

      {verifying && <FaceIdSheet msg={verifying} onDone={stepUpDone} onCancel={stepUpCancel} />}
    </div>
  )
}
