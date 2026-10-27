import { useEffect, useState } from "react"
import { BookOpen, Check, ChevronDown, CircleCheck, Download, Hand, LoaderCircle, ShieldOff, Sparkles, Undo2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Back, Group, Note, Row, Screen, SectionLabel, Sub, TabBar, Title } from "@/components/app/kit"
import { CHECKING_STEPS, LAYER_LABEL, SHARE_OPTIONS, WONT_DO, buildChecklist } from "@/data/agent"
import { agentFor, keyholderContact, tripFor, useStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { useCountry } from "./Layers"
import { useSendCard } from "./Safety"
import AgentChat from "./AgentChat"

function Intro({ id, c, installed, trip }) {
  const { st, setAgent, startDownload } = useStore()
  const { share } = agentFor(st, id)
  return (
    <>
      <Title sub={`Turns the ${c.city} profile and your own setup into a short checklist. Each item says why.`}>Check my setup</Title>

      <SectionLabel>Choose what to share</SectionLabel>
      <Group>
        {SHARE_OPTIONS.map((o) => (
          <Row key={o.key}>
            <span><span className="block font-medium">{o.label}</span><Sub>{o.key === "trip" ? `${c.city}, ${trip?.dates || "no dates yet"}` : o.sub}</Sub></span>
            <Switch checked={!!share[o.key]} disabled={o.locked} aria-label={`Share ${o.label.toLowerCase()}`}
              onCheckedChange={(v) => setAgent(id, (a) => ({ share: { ...a.share, [o.key]: v } }))} />
          </Row>
        ))}
      </Group>

      <Note tone="quiet" icon={ShieldOff} className="mt-4">
        <p className="font-medium text-foreground">What the agent won’t do</p>
        <ul className="mt-1 list-disc pl-4">{WONT_DO.map((w) => <li key={w}>{w}</li>)}</ul>
      </Note>

      <div className="mt-auto pt-4">
        {installed ? (
          <>
            <Button size="xl" className="w-full" onClick={() => setAgent(id, { phase: "checking" })}><Sparkles />Check my setup</Button>
            <p className="text-[12.5px] text-muted-foreground text-center mt-2">Runs once, when you tap. Nothing runs in the background.</p>
          </>
        ) : (
          <>
            <Button size="xl" className="w-full" onClick={() => startDownload(id, "agent")} disabled={!!st.downloading}><Download />Download the {c.city} profile</Button>
            <p className="text-[12.5px] text-muted-foreground text-center mt-2">The check reads this profile, so it comes first.</p>
          </>
        )}
      </div>
    </>
  )
}

function Checking({ id, c }) {
  const { st, setAgent } = useStore()
  const { share } = agentFor(st, id)
  const steps = CHECKING_STEPS.filter((s) => s.needs.every((k) => share[k])).map((s) => s.text)
  const [n, setN] = useState(0)
  useEffect(() => {
    if (n >= steps.length) { setAgent(id, { phase: "results" }); return }
    const t = setTimeout(() => setN(n + 1), 500)
    return () => clearTimeout(t)
  }, [n, id, steps.length, setAgent])
  return (
    <div className="flex-1 flex flex-col justify-center">
      <span className="grid place-items-center size-12 rounded-full bg-info-soft text-primary"><Sparkles className="size-[22px]" /></span>
      <h2 className="text-[24px] font-semibold tracking-[-0.03em] mt-4">Checking your setup</h2>
      <ul className="mt-4 flex flex-col gap-2.5" aria-live="polite">
        {steps.map((s, i) => (
          <li key={s} className={cn("flex items-center gap-2.5 text-[14px]", i > n && "text-faint")}>
            {i < n ? <CircleCheck className="size-4 text-success" /> : i === n ? <LoaderCircle className="size-4 text-primary animate-spin" /> : <span className="size-4 rounded-full border" />}
            {s.replace("{city}", c.city)}
          </li>
        ))}
      </ul>
    </div>
  )
}

const isPending = (item, decision) => !decision && item.kind !== "set"

function Steps({ steps }) {
  return <ol className="mt-1.5 list-decimal pl-5 text-[12.5px] text-muted-foreground flex flex-col gap-0.5">{steps.map((s) => <li key={s}>{s}</li>)}</ol>
}

const linkButton = "flex items-center gap-1 text-[12.5px] font-medium text-primary rounded outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"

/** An item that still needs a decision: the reason up front, then approve or skip. */
function OpenItem({ item, onApprove, onSkip }) {
  const [open, setOpen] = useState(false)
  return (
    <li className="rounded-2xl border bg-background p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12px] font-medium text-muted-foreground">{LAYER_LABEL[item.layer]}</span>
        <Badge variant={item.kind === "yours" ? "info" : "warning"}>{item.kind === "yours" ? "Yours to do" : "Needs OK"}</Badge>
      </div>
      <p className="font-semibold mt-1.5 leading-snug">{item.title}</p>
      <p className="text-[13px] text-muted-foreground mt-1 leading-snug">{item.why}</p>
      <button onClick={() => setOpen(!open)} aria-expanded={open} className={cn(linkButton, "mt-2")}>
        <BookOpen className="size-3.5" />Do it yourself next time<ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} />
      </button>
      {open && <Steps steps={item.steps} />}
      <div className="flex gap-2 mt-3">
        <Button size="sm" onClick={onApprove}><Check />{item.kind === "yours" ? "Mark as done" : "Approve"}</Button>
        <Button size="sm" variant="ghost" onClick={onSkip}>Skip</Button>
      </div>
    </li>
  )
}

/** A handled item, kept short. The reason and steps stay one tap away. */
function DoneItem({ item, decision, onUndo }) {
  const [open, setOpen] = useState(false)
  const approved = decision === "approved" || decision === "done"
  const status = decision === "done" ? "Done" : decision === "approved" ? "Approved" : decision === "skipped" ? "Skipped" : "Already set"
  const canUndo = decision && !(item.noUndo && approved)
  return (
    <li className="px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[12px] font-medium text-muted-foreground">{LAYER_LABEL[item.layer]}</span>
        <Badge variant={decision === "skipped" ? "outline" : "success"}>{(approved || !decision) && <Check strokeWidth={3} />}{status}</Badge>
      </div>
      <p className="font-medium leading-snug mt-1">{item.title}</p>
      <div className="flex items-center gap-4 mt-1.5">
        <button onClick={() => setOpen(!open)} aria-expanded={open} className={linkButton}>
          Why<ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} />
        </button>
        {canUndo && <button onClick={onUndo} className={cn(linkButton, "text-muted-foreground")}><Undo2 className="size-3.5" />Undo</button>}
      </div>
      {open && (
        <>
          <p className="text-[13px] text-muted-foreground mt-1.5 leading-snug">{item.why}</p>
          <p className="text-[12.5px] font-medium mt-2">Do it yourself next time</p>
          <Steps steps={item.steps} />
        </>
      )}
    </li>
  )
}

function Results({ id, c, p, trip }) {
  const { st, set, setProfile, setAgent, go, toast } = useStore()
  const sendCard = useSendCard()
  const agent = agentFor(st, id)
  const kh = keyholderContact(st)
  const items = buildChecklist({
    countryId: id, profile: p, share: agent.share, keyholder: kh, keyholderSent: st.keyholder.status !== "none", movedOffSms: st.movedOffSms, trip,
  })
  const hidden = SHARE_OPTIONS.filter((o) => !agent.share[o.key])
  const [focusKey, setFocusKey] = useState(null)
  const decide = (key, d) => setAgent(id, (a) => ({ decisions: { ...a.decisions, [key]: d } }))

  const apply = (item, on) => {
    if (item.key === "backup") setProfile(id, { backup: on })
    if (item.key === "register") setProfile(id, { linesSet: on })
    if (item.accountId) set((s) => ({ movedOffSms: on ? [...s.movedOffSms, item.accountId] : s.movedOffSms.filter((x) => x !== item.accountId) }))
    if (item.key === "keyholder" && on) sendCard()
  }
  const approve = (item) => {
    apply(item, true)
    decide(item.key, item.kind === "yours" ? "done" : "approved")
    if (item.key !== "keyholder") toast(item.kind === "yours" ? "Marked as done" : `${LAYER_LABEL[item.layer]} updated`)
  }
  const undo = (item) => {
    if (agent.decisions[item.key] !== "skipped") apply(item, false)
    decide(item.key, undefined)
    toast("Undone. Nothing else changed.")
  }

  const open = items.filter((i) => isPending(i, agent.decisions[i.key]))
  const handled = items.filter((i) => !isPending(i, agent.decisions[i.key]))
  // One item at a time keeps the checklist short. Tapping an upcoming item brings it forward.
  const current = open.find((i) => i.key === focusKey) || open[0]
  const upNext = open.filter((i) => i !== current)
  return (
    <>
      <Title sub={open.length ? `${open.length} ${open.length === 1 ? "item needs" : "items need"} you. Nothing changes until you approve it.` : "All set. Every change was yours to make."}>
        {c.city} setup
      </Title>

      {current && (
        <ul className="mt-4">
          <OpenItem key={current.key} item={current} onApprove={() => approve(current)} onSkip={() => decide(current.key, "skipped")} />
        </ul>
      )}

      {upNext.length > 0 && (
        <>
          <SectionLabel>Up next</SectionLabel>
          <Group>
            {upNext.map((item) => (
              <Row key={item.key} onClick={() => setFocusKey(item.key)} chevron>
                <span className="flex-1 min-w-0">
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-[12px] font-medium text-muted-foreground">{LAYER_LABEL[item.layer]}</span>
                    <Badge variant={item.kind === "yours" ? "info" : "warning"}>{item.kind === "yours" ? "Yours to do" : "Needs OK"}</Badge>
                  </span>
                  <span className="block font-medium leading-snug mt-1">{item.title}</span>
                </span>
              </Row>
            ))}
          </Group>
        </>
      )}

      {handled.length > 0 && (
        <>
          <SectionLabel>Handled</SectionLabel>
          <ul className="rounded-2xl bg-muted border divide-y">
            {handled.map((item) => <DoneItem key={item.key} item={item} decision={agent.decisions[item.key]} onUndo={() => undo(item)} />)}
          </ul>
        </>
      )}

      {hidden.length > 0 && (
        <Note tone="quiet" icon={Hand} className="mt-3">
          Not checked: {hidden.map((h) => h.label.toLowerCase()).join(", ")}. You chose not to share {hidden.length === 1 ? "it" : "them"}.
        </Note>
      )}

      <div className="mt-4 pt-1 flex flex-col gap-1">
        <Button size="xl" className="w-full" onClick={() => go("layers", { countryId: id })}>See the four layers</Button>
        <Button variant="link" className="w-full" onClick={() => setAgent(id, { phase: "intro" })}>Change what I share</Button>
      </div>
    </>
  )
}

export default function Agent() {
  const { st, set } = useStore()
  const { id, c, p } = useCountry()
  const { phase } = agentFor(st, id)
  const trip = tripFor(st, id)
  const installed = !!p?.installed
  const view = !installed ? "intro" : phase

  // The chat is home base. The setup check opens from a chat card or from Four layers.
  if (st.agentView !== "setup") return <AgentChat />

  return (
    <>
      <Screen id={`agent-${id}-${view}`}>
        <Back label="Agent" onClick={() => set({ agentView: "chat" })} />
        {view === "intro" && <Intro id={id} c={c} installed={installed} trip={trip} />}
        {view === "checking" && <Checking id={id} c={c} />}
        {view === "results" && <Results id={id} c={c} p={p} trip={trip} />}
      </Screen>
      <div className="px-5"><TabBar active="agent" /></div>
    </>
  )
}
