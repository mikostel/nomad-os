import { Lock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Back, Co, CountryCode, Group, Note, Row, Screen, SectionLabel, Sub, Title } from "@/components/app/kit"
import { useStore } from "@/lib/store"
import { useCountry } from "./Layers"

const APP_STYLE = {
  Checking: { bg: "#1F3A8A", fg: "#fff", label: "CK" },
  Wise: { bg: "#9FE870", fg: "#163300", label: "W" },
  "Work email": { bg: "#5B5BD6", fg: "#fff", label: "WE" },
}

export default function Network() {
  const { go, toast, setProfile } = useStore()
  const { id, c, p } = useCountry()
  return (
    <Screen id={`network-${id}`}>
      <Back label={c.city} onClick={() => go("layers", { countryId: id })} />
      <Title sub="Encrypt, don’t disguise.">Network</Title>

      <Group className="mt-5">
        <Co n={5} className="-right-2 -top-2.5" />
        <Row>
          <span><span className="block font-medium">Untrusted Wi-Fi</span><Sub>Cafés, hotels, coworking</Sub></span>
          <span className="flex items-center gap-2"><span className="text-[12px] text-muted-foreground">VPN</span>
            <Switch checked={p.wifiVpn} onCheckedChange={(v) => setProfile(id, { wifiVpn: v })} aria-label="VPN on untrusted Wi-Fi" className="data-checked:bg-success" /></span>
        </Row>
        <Row>
          <span><span className="block font-medium">Your hotspot</span><Sub>Already private</Sub></span>
          <span className="flex items-center gap-2"><span className="text-[12px] text-muted-foreground">VPN</span>
            <Switch checked={p.hotspotVpn} onCheckedChange={(v) => setProfile(id, { hotspotVpn: v })} aria-label="VPN on your hotspot" className="data-checked:bg-success" /></span>
        </Row>
        <Row onClick={() => toast("Exit location always matches the country you’re in")}>
          <span><span className="block font-medium">Exit location</span><Sub>Always where you are</Sub></span>
          <span className="flex items-center gap-1.5 text-muted-foreground"><CountryCode code={id} /><Lock className="size-3.5" /></span>
        </Row>
      </Group>

      <SectionLabel>Apps that flag VPNs here</SectionLabel>
      <Group>
        <Co n={6} className="-right-2 -top-2.5" />
        {c.flaggedApps.map((a) => {
          const s = APP_STYLE[a]
          return (
            <Row key={a}>
              <span className="flex items-center gap-3">
                <span className="grid place-items-center size-8 rounded-lg text-[11px] font-bold" style={{ background: s.bg, color: s.fg }}>{s.label}</span>
                <span className="font-medium">{a}</span>
              </span>
              <Badge variant="outline">Direct</Badge>
            </Row>
          )
        })}
      </Group>

      <Note tone={c.vpnWarn ? "warn" : "info"} className="mt-4">{c.vpnNote} <span className="text-muted-foreground">Updated {c.updated}.</span></Note>

      <div className="mt-auto pt-4">
        <Button size="xl" className="w-full" onClick={() => { toast("Network rules saved"); go("layers", { countryId: id }) }}>Save rules</Button>
      </div>
    </Screen>
  )
}
