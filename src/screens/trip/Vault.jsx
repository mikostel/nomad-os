import { Eye, EyeOff, Fingerprint, KeyRound, Landmark, Mail, MessageSquareText, TriangleAlert } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Group, Row, Screen, SectionLabel, SecurityHeader, Sub, TabBar } from "@/components/app/kit"
import { ACCOUNTS, DEMO_WORDS } from "@/data/mock"
import { useStore } from "@/lib/store"

const ICONS = { email: Mail, checking: Landmark, wise: Landmark, work: Mail, social: MessageSquareText }

export default function Vault() {
  const { st, set, toast } = useStore()
  const movable = ACCOUNTS.filter((a) => a.sms && !a.smsOnly && !st.movedOffSms.includes(a.id))

  return (
    <>
      <Screen id="vault">
        <SecurityHeader active="vault" sub="Your accounts, and how each one sends codes." />

        {movable.length > 0 && (
          <div className="mt-4 rounded-xl bg-warning-soft px-3.5 py-3 text-[13px] flex items-start gap-2.5">
            <TriangleAlert className="size-4 text-warning mt-px shrink-0" />
            <span className="flex-1">{movable.length} {movable.length === 1 ? "account still texts" : "accounts still text"} codes. A stolen phone would get them too.</span>
          </div>
        )}

        <SectionLabel>Sign-in codes</SectionLabel>
        <Group>
          {ACCOUNTS.map((a) => {
            const Icon = ICONS[a.id]
            const moved = st.movedOffSms.includes(a.id)
            const method = moved ? "Authenticator" : a.method
            return (
              <Row key={a.id}>
                <span className="flex items-center gap-3 min-w-0">
                  <span className="grid place-items-center size-8 rounded-lg bg-background border shrink-0"><Icon className="size-4 text-muted-foreground" /></span>
                  <span className="min-w-0"><span className="block font-medium">{a.name}</span><Sub>{method}{a.smsOnly ? ", only option" : ""}</Sub></span>
                </span>
                {a.sms && !a.smsOnly && !moved ? (
                  <Button size="sm" variant="outline" onClick={() => { set((s) => ({ movedOffSms: [...s.movedOffSms, a.id] })); toast(`${a.name} codes moved to your authenticator`) }}>Move off texts</Button>
                ) : a.smsOnly ? <Badge variant="info">Home line</Badge> : <Badge variant="success">Safe</Badge>}
              </Row>
            )
          })}
        </Group>

        <SectionLabel>Recovery words</SectionLabel>
        <div className="rounded-2xl border p-4">
          <div className="grid grid-cols-3 gap-1.5 font-mono text-[12px]">
            {DEMO_WORDS.map((w, i) => (
              <span key={w} className="rounded-md bg-muted px-2 py-1.5"><span className="text-faint mr-1">{i + 1}</span>{st.showWords ? w : "•••••"}</span>
            ))}
          </div>
          <div className="flex items-center justify-between mt-3">
            <Sub className="flex items-center gap-1"><Fingerprint className="size-3.5" />Shown only after Face ID</Sub>
            <Button size="sm" variant="ghost" onClick={() => set({ showWords: !st.showWords })}>{st.showWords ? <><EyeOff />Hide</> : <><Eye />Show</>}</Button>
          </div>
        </div>

        <div className="mt-5 mb-2 rounded-2xl border border-dashed p-4">
          <p className="font-semibold flex items-center gap-2"><KeyRound className="size-4 text-primary" />Lost this phone?</p>
          <p className="text-[13px] text-muted-foreground mt-1">Start Break Glass from any browser with these 12 words.</p>
          <Button size="sm" variant="outline" className="mt-3" onClick={() => set({ mode: "loss" })}>Try it: simulate a lost phone</Button>
        </div>
      </Screen>
      <div className="px-5"><TabBar active="security" /></div>
    </>
  )
}
