import { Car, Check, Sparkles, TrainFront, Wallet } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Back, Co, CountryCode, Group, Row, Screen, Sub, Title } from "@/components/app/kit"
import { COUNTRIES } from "@/data/mock"
import { layerStatus, tripFor, useStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { LAYER_ICONS } from "./layer-meta"

export function useCountry() {
  const { st } = useStore()
  const id = st.params.countryId || st.trips[0]?.countryId || st.current
  return { id, c: COUNTRIES[id], p: st.profiles[id], trip: tripFor(st, id) }
}

export default function Layers() {
  const { st, set, go, toast, setProfile } = useStore()
  const { id, c, p, trip } = useCountry()
  const layers = layerStatus(st, id)
  const ready = layers.filter((l) => l.ready).length
  const firstFix = layers.find((l) => !l.ready)
  const when = id === st.current ? "Active now" : trip ? trip.dates : p?.ended ? `Last used ${p.ended}` : "Not scheduled"

  return (
    <Screen id={`layers-${id}`}>
      <Back label="Trips" onClick={() => go("home")} />
      <div className="flex items-end justify-between">
        <Title sub={when}>{c.city}</Title>
        <CountryCode code={id} className="mb-1" />
      </div>

      <div className="mt-5">
        <div className="flex justify-between text-[13px] mb-2">
          <span className="font-semibold">{ready} of 4 layers ready</span>
          <span className="text-muted-foreground">{ready === 4 ? "Nothing to fix" : `${4 - ready} to fix`}</span>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {layers.map((l) => <span key={l.key} className={cn("h-1.5 rounded-full transition-colors duration-300", l.ready ? "bg-success" : "bg-warning")} />)}
        </div>
      </div>

      <Group className="mt-5">
        <Co n={3} className="-right-2 -top-2.5" />
        {layers.map((l) => {
          const Icon = LAYER_ICONS[l.key]
          return (
            <Row key={l.key} onClick={() => go(l.key, { countryId: id })} chevron>
              <span className="flex items-center gap-3 min-w-0">
                <span className={cn("grid place-items-center size-9 rounded-xl shrink-0", l.ready ? "bg-info-soft text-primary" : "bg-warning-soft text-warning")}><Icon className="size-[18px]" /></span>
                <span className="min-w-0"><span className="block font-semibold">{l.name}</span><Sub className="truncate">{l.sub}</Sub></span>
              </span>
              <Badge variant={l.ready ? "success" : "warning"} className="ml-auto">{l.ready ? "Ready" : "1 to fix"}</Badge>
            </Row>
          )
        })}
      </Group>

      <Group className="mt-4">
        <Co n={4} className="-right-2 -top-2.5" />
        <Row>
        <span className="flex items-center gap-3">
          <span className="flex -space-x-2">
            <span className="grid place-items-center size-8 rounded-lg ring-2 ring-muted bg-[#111] text-white"><Car className="size-[15px]" /></span>
            <span className="grid place-items-center size-8 rounded-lg ring-2 ring-muted bg-[#E2457A] text-white"><TrainFront className="size-[15px]" /></span>
            <span className="grid place-items-center size-8 rounded-lg ring-2 ring-muted bg-[#0F9D6E] text-white"><Wallet className="size-[15px]" /></span>
          </span>
          <span><span className="block font-semibold">Local essentials</span><Sub>Rides, transit, payments</Sub></span>
        </span>
        <Switch checked={p?.essentials ?? true} onCheckedChange={(v) => setProfile(id, { essentials: v })} aria-label="Install local essentials" className="data-checked:bg-success" />
        </Row>
      </Group>

      <Group className="mt-3 bg-info-soft border-primary/25">
        <Row onClick={() => { set({ agentView: "setup" }); go("agent", { countryId: id }) }} chevron className="hover:bg-primary/5">
          <span className="flex items-center gap-3">
            <span className="grid place-items-center size-9 rounded-xl bg-primary text-primary-foreground shrink-0"><Sparkles className="size-[18px]" /></span>
            <span><span className="block font-semibold">Check my setup</span><Sub>Explains each fix. You approve every change.</Sub></span>
          </span>
        </Row>
      </Group>

      <div className="mt-auto pt-4">
        {firstFix ? (
          <Button size="xl" className="w-full" onClick={() => go(firstFix.key, { countryId: id })}>Fix {4 - ready} {4 - ready === 1 ? "item" : "items"}</Button>
        ) : (
          <Button size="xl" className="w-full" onClick={() => { toast(`${c.city} is ready${trip ? ` for ${trip.dates.split(" to ")[0]}` : ""}`); go("home") }}>
            <Check strokeWidth={2.6} />Profile ready
          </Button>
        )}
      </div>
    </Screen>
  )
}
