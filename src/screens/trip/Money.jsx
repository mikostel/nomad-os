import { Lock, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Back, Co, Group, Note, Row, Screen, Sub, Title } from "@/components/app/kit"
import { useStore } from "@/lib/store"
import { useCountry } from "./Layers"

export default function Money() {
  const { st, go, toast, setProfile } = useStore()
  const { id, c, p, trip } = useCountry()
  const dates = trip ? trip.dates : id === st.current ? "Until you leave" : "Trip dates"
  return (
    <Screen id={`money-${id}`}>
      <Back label={c.city} onClick={() => go("layers", { countryId: id })} />
      <Title>Money</Title>

      <div className="relative mt-4">
        <Co n={7} className="-right-2 -top-2.5" />
        <div className="h-[168px] rounded-2xl p-5 text-white flex flex-col shadow-[0_16px_30px_-16px_rgba(47,91,234,.7)]"
          style={{ background: "linear-gradient(135deg,#2F5BEA 0%,#1B2F7A 100%)" }}>
          <div className="flex justify-between items-start">
            <span className="text-[13px] opacity-80">Checking debit</span>
            <Badge variant="glass" className="rounded-full"><Lock strokeWidth={3} />Trip lock</Badge>
          </div>
          <span className="mt-3 w-9 h-7 rounded-md bg-[#E8C46A]/90" />
          <span className="mt-auto font-mono text-[16px] tracking-[0.14em]">•••• 4417</span>
        </div>
        <div className="flex justify-between mt-2 px-1"><Sub>Works {dates}</Sub><Sub>{c.name} only</Sub></div>
      </div>

      <Group className="mt-4">
        <Co n={8} className="-right-2 -top-2.5" />
        <Row>
          <span><span className="block font-semibold">Backup account</span><Sub>{p.backup ? "Savings •• 8820" : "Never one way to pay"}</Sub></span>
          {p.backup ? <Badge variant="success">Ready</Badge> : (
            <Button size="sm" variant="outline" onClick={() => { setProfile(id, { backup: true }); toast("Backup account added") }}><Plus />Add</Button>
          )}
        </Row>
        <Row>
          <span><span className="block font-semibold">Freeze plan</span><Sub>Who to call, 3 escalation paths</Sub></span>
          <Badge variant="success">Saved</Badge>
        </Row>
      </Group>

      {c.flaggedApps.includes("Wise") && <Note tone="warn" className="mt-4">Wise flags VPN logins here, so it’s set to direct.</Note>}

      <div className="mt-auto pt-4">
        <Button size="xl" className="w-full" disabled={!p.backup} onClick={() => go("layers", { countryId: id })}>
          {p.backup ? "Done" : "Add a backup to finish"}
        </Button>
      </div>
    </Screen>
  )
}
