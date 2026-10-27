import { ShieldCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Back, Co, Note, Screen, Sub, Title } from "@/components/app/kit"
import { USER } from "@/data/mock"
import { useStore } from "@/lib/store"
import { useCountry } from "./Layers"

export default function Numbers() {
  const { go, toast, setProfile } = useStore()
  const { id, c, p } = useCountry()
  const finish = () => {
    setProfile(id, { linesSet: true })
    toast(`Lines set. Line 2 activates when you land in ${c.name}.`)
    go("layers", { countryId: id })
  }
  return (
    <Screen id={`numbers-${id}`}>
      <Back label={c.city} onClick={() => go("layers", { countryId: id })} />
      <Title sub="Keep your home number for codes. Use a local line for everything else.">Two lines, one phone</Title>

      <div className="relative mt-5 rounded-2xl border">
        <Co n={9} className="-right-2 -top-2.5" />
        <div className="p-4 bg-muted rounded-t-2xl">
          <div className="flex items-center gap-3">
            <span className="grid place-items-center size-9 rounded-full bg-foreground text-background font-mono text-[13px] font-semibold">1</span>
            <span><span className="block font-semibold">Home</span><Sub className="font-mono">{USER.homeLine}</Sub></span>
          </div>
          <div className="flex gap-1.5 mt-3"><Badge variant="info">Codes only</Badge><Badge variant="outline">Texts on</Badge><Badge variant="outline">Data off</Badge></div>
        </div>
        <Separator />
        <div className="p-4">
          <div className="flex items-center gap-3">
            <span className="grid place-items-center size-9 rounded-full bg-primary text-primary-foreground font-mono text-[13px] font-semibold">2</span>
            <span><span className="block font-semibold">{c.name} eSIM</span><Sub>{p.linesSet ? "Activates when you land" : "Needs setup"}</Sub></span>
          </div>
          <div className="flex gap-1.5 mt-3"><Badge variant="info">Data and calls</Badge><Badge variant="outline">{c.esim.plan}</Badge></div>
        </div>
      </div>

      {c.esim.needsSetup && !p.linesSet ? (
        <Note tone="warn" className="mt-4">{c.esim.setupNote}</Note>
      ) : (
        <Note tone="quiet" icon={ShieldCheck} className="mt-4 [&>svg]:text-success">
          <Co n={10} className="-right-2 -top-2.5" />
          If roaming fails, line 1 still gets codes over <span className="whitespace-nowrap">Wi-Fi</span>. Your checking account accepts this.
        </Note>
      )}

      <div className="mt-auto pt-4">
        <Button size="xl" className="w-full" onClick={finish}>{c.esim.needsSetup && !p.linesSet ? "I’ll register on arrival" : "Set up lines"}</Button>
        <Button variant="link" className="w-full mt-1" onClick={() => toast("One line: your home number handles everything")}>Use one line instead</Button>
      </div>
    </Screen>
  )
}
