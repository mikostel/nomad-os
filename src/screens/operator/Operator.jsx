import { useEffect, useRef, useState } from "react"
import { Headset, Send, Smartphone } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Wordmark } from "@/components/app/kit"
import { INTENT_LABEL } from "@/data/travel"
import { cn } from "@/lib/utils"

export const OPERATOR_CHANNEL = "nomad-os-operator"

const CARD_LABEL = {
  trains: "Train options", restaurants: "Restaurants", slots: "Time and party size", delivery: "Delivery places", basket: "Order",
  hotels: "Hotels", confirm: "Confirm card", risk: "Risk warning", receipt: "Receipt", setup: "Setup check card",
}

const PHRASES = [
  "Let me check.",
  "Sure. Which day works for you?",
  "I can’t do that in this prototype yet. I can book a train, find dinner, order delivery, or book a hotel.",
  "Done. Anything else for the trip?",
]

/** A second window for user tests: watch the participant's chat and answer as the agent. Open it at #operator. */
export default function Operator() {
  const [state, setState] = useState(null)
  const [text, setText] = useState("")
  const channel = useRef(null)
  const log = useRef(null)

  useEffect(() => {
    document.title = "NOMAD.OS operator"
    if (typeof BroadcastChannel === "undefined") return
    const c = new BroadcastChannel(OPERATOR_CHANNEL)
    channel.current = c
    c.onmessage = ({ data }) => { if (data.type === "state") setState(data) }
    c.postMessage({ type: "hello" })
    const t = setInterval(() => c.postMessage({ type: "hello" }), 3000)
    return () => { clearInterval(t); c.close() }
  }, [])

  useEffect(() => { if (log.current) log.current.scrollTop = log.current.scrollHeight }, [state?.chat?.length])

  const post = (m) => channel.current?.postMessage(m)
  const say = (t) => { if (t.trim()) { post({ type: "say", text: t.trim() }); setText("") } }
  const connected = !!state
  const supported = typeof BroadcastChannel !== "undefined"

  return (
    <div className="h-full flex flex-col bg-background">
      <header className="shrink-0 border-b px-5 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Wordmark className="text-[17px]" />
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground"><Headset className="size-4" />Operator panel</span>
        </div>
        <Badge variant={connected ? "success" : "warning"}>{connected ? "Connected to the prototype" : "Waiting for the prototype"}</Badge>
      </header>

      {!supported && <p className="m-5 rounded-xl bg-warning-soft px-4 py-3 text-sm">This browser can’t link two windows. Use a current Chrome, Edge, Firefox, or Safari.</p>}
      {supported && !connected && (
        <p className="mx-5 mt-4 rounded-xl bg-info-soft px-4 py-3 text-sm">Keep the prototype open in another window or tab of this browser. This panel finds it on its own.</p>
      )}

      <div className="flex-1 min-h-0 grid grid-cols-[1fr_380px]">
        <section className="min-h-0 flex flex-col border-r">
          <p className="px-5 pt-4 pb-2 text-[13px] font-semibold text-muted-foreground">
            What the participant sees{state && <span className="font-normal"> on {state.screen}, in “{state.thread}”</span>}
          </p>
          <div ref={log} className="flex-1 min-h-0 overflow-y-auto px-5 pb-5 flex flex-col gap-2">
            {state?.chat?.map((m) => (
              <div key={m.id} className={cn("max-w-[80%] rounded-xl px-3 py-2 text-sm", m.from === "me" ? "self-end bg-primary text-primary-foreground" : "self-start bg-muted")}>
                <span className="block text-[11px] opacity-70 mb-0.5">{m.from === "me" ? "Participant" : "Agent"}</span>
                {m.text}
                {m.card && <span className="block mt-1 text-[12px] opacity-80">[{CARD_LABEL[m.card] || m.card}]</span>}
              </div>
            ))}
          </div>
        </section>

        <section className="min-h-0 overflow-y-auto p-5 flex flex-col gap-6">
          <div>
            <Label className="cursor-pointer text-[15px]">
              <Switch checked={!!state?.wizard} disabled={!connected} onCheckedChange={(on) => post({ type: "wizard", on })} />
              You answer for the agent
            </Label>
            <p className="text-[13px] text-muted-foreground mt-2 leading-snug">When this is on, the agent waits for you instead of replying from its script. The participant still sees typing dots.</p>
          </div>

          <div>
            <p className="text-[13px] font-semibold text-muted-foreground mb-2">Send a scripted reply</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(INTENT_LABEL).map(([k, label]) => (
                <Button key={k} size="sm" variant="outline" disabled={!connected} onClick={() => post({ type: "intent", intent: k })}>{label}</Button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[13px] font-semibold text-muted-foreground mb-2">Type a reply</p>
            <form onSubmit={(e) => { e.preventDefault(); say(text) }} className="flex gap-2">
              <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="What the agent says next" aria-label="Reply as the agent" disabled={!connected} />
              <Button type="submit" size="icon" aria-label="Send reply" disabled={!connected || !text.trim()}><Send /></Button>
            </form>
            <div className="flex flex-col gap-1.5 mt-3">
              {PHRASES.map((p) => (
                <button key={p} disabled={!connected} onClick={() => say(p)}
                  className="text-left text-[13px] rounded-lg border px-3 py-2 hover:bg-accent disabled:opacity-50 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">{p}</button>
              ))}
            </div>
          </div>

          <Button variant="outline" disabled={!connected} onClick={() => post({ type: "show-agent" })}><Smartphone />Open the Agent tab for the participant</Button>
        </section>
      </div>
    </div>
  )
}
