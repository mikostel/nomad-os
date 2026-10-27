import { useRef, useState } from "react"
import { Check, Clock, LoaderCircle, Phone, RotateCcw, ShieldCheck, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Co, Note, PersonAvatar, Wordmark } from "@/components/app/kit"
import { DEMO_WORDS, ESCALATIONS, REQUEST_MINUTE, TRIAGE } from "@/data/mock"
import { activeBookings, keyholderContact, useStore } from "@/lib/store"
import { cn } from "@/lib/utils"

const fmtClock = (m) => `${((Math.floor(m / 60) + 11) % 12) + 1}:${String(m % 60).padStart(2, "0")} ${m >= 720 ? "pm" : "am"}`
const fmtLeft = (s) => [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((n) => String(n).padStart(2, "0")).join(":")

function KeyholderAside({ waiting }) {
  const { st } = useStore()
  const kh = keyholderContact(st)
  const noKeyholder = st.keyholder.status !== "sent"
  return (
    <aside className="relative w-[280px] border-l bg-muted p-6 flex flex-col">
      <Co n={15} className="-left-3 top-6" />
      <p className="text-[13px] font-semibold text-muted-foreground">Who approves</p>
      <div className="flex items-center gap-3 mt-3">
        <PersonAvatar contact={kh} className={cn(waiting && "pulse-ring")} />
        <span><span className="block font-semibold">{kh.name}, {kh.relation}</span><span className="text-[13px] text-muted-foreground">Your Keyholder</span></span>
      </div>
      <p className="text-[13px] text-muted-foreground mt-4 leading-relaxed">
        We’ll text {kh.name} to approve. {kh.name} never sees your vault or signs in as you.
      </p>
      {noKeyholder && (
        <p className="text-[12.5px] mt-3 rounded-lg bg-warning-soft text-foreground px-3 py-2 leading-snug">
          Demo note: {kh.name} hasn’t received a Keyholder card yet. The drill works anyway.
        </p>
      )}
      <div className="mt-auto pt-4 border-t text-[13px] text-muted-foreground leading-relaxed">
        No Keyholder? Access opens in 24 hours, and every device you own is notified.
      </div>
    </aside>
  )
}

export function Words() {
  const { st, setLoss, toast } = useStore()
  const refs = useRef([])
  const kh = keyholderContact(st)
  const { words, shared } = st.loss
  const filled = words.filter((w) => w.trim()).length

  const setWord = (i, v) => {
    const next = [...words]
    const parts = v.trim().split(/\s+/)
    if (parts.length > 1) parts.forEach((p, j) => { if (i + j < 12) next[i + j] = p })
    else next[i] = v.replace(/\s/g, "")
    setLoss({ words: next })
    if (v.endsWith(" ") && i < 11) refs.current[i + 1]?.focus()
  }
  // After a failed request, mark each word that doesn't match, and update live as they're fixed.
  const [tried, setTried] = useState(false)
  const wrong = words.map((w, i) => (w.trim().toLowerCase() !== DEMO_WORDS[i] ? i + 1 : 0)).filter(Boolean)
  const showWrong = tried && wrong.length > 0
  const request = () => {
    if (wrong.length) { setTried(true); return }
    setLoss({ step: "waiting", ana: "locked" })
    toast(`Approval request sent to ${kh.name}`)
  }

  return (
    <div className="enter flex-1 flex">
      <div className="flex-1 p-8 flex flex-col">
        <Wordmark className="text-[17px]" />
        <h2 className="text-[30px] font-semibold tracking-[-0.03em] mt-6">Lost your phone?</h2>
        <p className="text-[15px] text-muted-foreground mt-1.5">Enter your 12 recovery words to start Break Glass from this computer.</p>

        <div className="relative grid grid-cols-4 gap-2 mt-6">
          <Co n={14} className="-right-2.5 -top-3" />
          {words.map((w, i) => (
            <div key={i} className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-mono text-[11px] text-faint pointer-events-none">{i + 1}</span>
              <Input ref={(el) => (refs.current[i] = el)} value={w} aria-label={`Recovery word ${i + 1}`} autoComplete="off" spellCheck={false}
                aria-invalid={showWrong && wrong.includes(i + 1) ? true : undefined}
                onChange={(e) => setWord(i, e.target.value)} className="pl-8 font-mono text-[13px] md:text-[13px] h-10" />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mt-2.5">
          {showWrong ? (
            <span role="alert" className="text-[12px] text-destructive font-medium">
              {wrong.length === 1 ? `Word ${wrong[0]} doesn’t match.` : `Words ${wrong.slice(0, -1).join(", ")} and ${wrong.at(-1)} don’t match.`} Check the spelling.
            </span>
          ) : (
            <span className="text-[12px] text-muted-foreground">{filled} of 12 words. You can paste all 12 at once.</span>
          )}
          <Button size="sm" variant="outline" className="border-dashed border-primary/60 text-primary bg-info-soft hover:bg-info-soft/70 hover:text-primary"
            onClick={() => setLoss({ words: [...DEMO_WORDS] })}>Demo: fill words</Button>
        </div>

        <div className="relative mt-5 pr-8">
          <Co n={16} className="right-0 top-1/2 -translate-y-1/2" />
          <Label className="font-normal text-[14px] leading-snug cursor-pointer">
            <Checkbox checked={shared} onCheckedChange={(v) => setLoss({ shared: !!v })} />
            This is a shared computer. Forget everything when I close this tab.
          </Label>
        </div>

        <Button size="xl" className="mt-auto w-[200px]" disabled={filled < 12} onClick={request}>Request access</Button>
      </div>
      <KeyholderAside />
    </div>
  )
}

export function Waiting() {
  const { st } = useStore()
  const kh = keyholderContact(st)
  return (
    <div className="enter flex-1 flex">
      <div className="flex-1 p-8 flex flex-col">
        <Wordmark className="text-[17px]" />
        <div className="flex-1 flex flex-col justify-center max-w-[440px]">
          <span className="grid place-items-center size-12 rounded-full bg-info-soft text-primary"><LoaderCircle className="size-[22px] animate-spin" /></span>
          <h2 className="text-[30px] font-semibold tracking-[-0.03em] mt-5">Waiting for {kh.name}</h2>
          <p className="text-[15px] text-muted-foreground mt-2 leading-relaxed">We texted {kh.name} at {fmtClock(REQUEST_MINUTE)}. Keep this tab open. Access starts the moment {kh.name} approves.</p>
          <div className="mt-6 flex items-center gap-3 rounded-xl border px-4 py-3 text-[14px]">
            <Clock className="size-[17px] text-muted-foreground shrink-0" />
            <span className="flex-1">If {kh.name} can’t answer, access opens on its own in <span className="font-mono">23:59</span>.</span>
          </div>
          <p className="text-[13px] text-primary mt-6">Demo: answer on {kh.name}’s phone.</p>
        </div>
      </div>
      <KeyholderAside waiting />
    </div>
  )
}

export function Declined() {
  const { st, setLoss } = useStore()
  const kh = keyholderContact(st)
  return (
    <div className="enter flex-1 flex">
      <div className="flex-1 p-8 flex flex-col">
        <Wordmark className="text-[17px]" />
        <div className="flex-1 flex flex-col justify-center max-w-[460px]">
          <span className="grid place-items-center size-12 rounded-full bg-warning-soft text-warning"><X className="size-[22px]" strokeWidth={2.6} /></span>
          <h2 className="text-[30px] font-semibold tracking-[-0.03em] mt-5">{kh.name} declined this request</h2>
          <p className="text-[15px] text-muted-foreground mt-2 leading-relaxed">Nothing changed on your accounts. If this was you, call {kh.name} and try again, or wait 24 hours for access to open on its own.</p>
          <div className="flex gap-2 mt-6">
            <Button onClick={() => setLoss({ step: "waiting", ana: "locked" })}><RotateCcw />Ask {kh.name} again</Button>
            <Button variant="outline" onClick={() => setLoss({ step: "words", ana: "locked" })}>Start over</Button>
          </div>
        </div>
      </div>
      <KeyholderAside />
    </div>
  )
}

export function Triage() {
  const { st, setLoss, reset } = useStore()
  const kh = keyholderContact(st)
  const { triageDone, clock, secondsLeft, escalationOpen } = st.loss
  const doneCount = triageDone.length
  // Bookings survive a lost phone. The hotel confirmation is what Dani needs at the front desk tonight.
  const booked = activeBookings(st)
  const hotel = booked.find((b) => b.kind === "hotel")
  const mins = clock - REQUEST_MINUTE
  const doneNote = hotel
    ? `Done ${mins} minutes after you asked ${kh.name}. Your ${hotel.title} booking still stands, confirmation ${hotel.ref}.`
    : booked.length
      ? `Done ${mins} minutes after you asked ${kh.name}. Your ${booked.length} ${booked.length === 1 ? "booking still stands" : "bookings still stand"}. Set up a new phone to see them.`
      : `Done ${mins} minutes after you asked ${kh.name}. Set up NOMAD.OS on your replacement phone to restore your profiles.`
  const complete = doneCount === TRIAGE.length

  return (
    <div className="enter flex-1 p-6 flex flex-col overflow-auto text-pretty">
      <div className="flex items-center justify-between gap-4">
        <span className="flex items-center gap-3">
          <span className="grid place-items-center size-9 rounded-full bg-success-soft text-success"><Check className="size-[18px]" strokeWidth={3} /></span>
          <span className="text-[22px] font-semibold tracking-[-0.025em]">{complete ? "You’re back in control." : `${kh.name} approved. Do these in order.`}</span>
        </span>
        <Badge variant="warning" className="h-auto text-[12.5px] px-2.5 py-1"><Clock />Access ends in <span className="font-mono">{fmtLeft(secondsLeft)}</span></Badge>
      </div>

      <div className="flex items-center gap-3 mt-4">
        <Progress value={(doneCount / TRIAGE.length) * 100}
          className="flex-1 *:data-[slot=progress-track]:h-2 *:data-[slot=progress-track]:bg-secondary **:data-[slot=progress-indicator]:bg-success" />
        <span className="text-[13px] text-muted-foreground font-medium whitespace-nowrap">{doneCount} of {TRIAGE.length} done</span>
      </div>

      <ol className="mt-4 flex flex-col gap-1.5">
        {TRIAGE.map((t, i) => {
          const done = i < doneCount
          const active = i === doneCount
          return (
            <li key={t.title} className={cn("relative rounded-xl px-4 transition-colors",
              done ? "bg-muted py-3" : active ? "border-[1.5px] border-primary py-3.5" : "border py-3")}>
              {i === 0 && <Co n={17} className="-right-2.5 -top-2.5" />}
              {i === 2 && <Co n={18} className="-right-2.5 -top-2.5" />}
              <div className="flex items-center gap-3">
                {done ? (
                  <span className="grid place-items-center size-6 rounded-full bg-success text-white shrink-0"><Check className="size-[13px]" strokeWidth={3.4} /></span>
                ) : (
                  <span className={cn("grid place-items-center size-6 rounded-full border-[1.5px] font-mono text-[11px] font-semibold shrink-0", active ? "border-primary text-primary" : "text-faint")}>{i + 1}</span>
                )}
                <span className={cn("flex-1 text-[15px]", !done && !active && "text-muted-foreground")}>
                  <b className="font-semibold">{t.title}</b>
                  {done && <span className="text-muted-foreground">, {t.done}</span>}
                </span>
                {done && <span className="text-[12.5px] text-faint">Done {fmtClock(triageDone[i])}</span>}
                {active && (
                  <Button size="sm" onClick={() => setLoss((l) => ({ triageDone: [...l.triageDone, l.clock], clock: l.clock + 2 + (i % 2) }))}>
                    {i === 2 && <Phone />}{t.action}
                  </Button>
                )}
              </div>
              {active && <p className="text-[13px] text-muted-foreground mt-1.5 pl-9">{t.detail.replace("{keyholder}", kh.name)}</p>}
            </li>
          )
        })}
      </ol>

      {complete && (
        <div className="mt-3 flex items-center gap-3">
          <Note icon={ShieldCheck} className="flex-1 text-[14px]">
            {doneNote}
          </Note>
          <Button variant="outline" onClick={reset}><RotateCcw />Start the demo over</Button>
        </div>
      )}

      <div className="mt-auto pt-3">
        <div className="relative rounded-xl bg-warning-soft px-4 py-3 text-[14px]">
          <Co n={19} className="-right-2.5 -top-2.5" />
          <div className="flex items-center justify-between gap-3">
            <span><b className="font-semibold">Support not answering?</b> <span className="text-muted-foreground">See escalation paths that worked for 38 nomads.</span></span>
            <Button size="sm" variant="ghost" className="text-warning hover:text-warning" onClick={() => setLoss({ escalationOpen: !escalationOpen })}>{escalationOpen ? "Hide" : "Open"}</Button>
          </div>
          {escalationOpen && (
            <ul className="mt-2 flex flex-col gap-1.5 text-[13px] text-muted-foreground">
              {ESCALATIONS.map((e) => <li key={e.who}><b className="font-semibold text-foreground">{e.who}:</b> {e.how} Worked for {e.count}.</li>)}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
