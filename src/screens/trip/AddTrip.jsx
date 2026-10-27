import { useState } from "react"
import { Check, CalendarDays } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Back, CountryCode, Group, Note, Row, Screen, SectionLabel, Sub, Title } from "@/components/app/kit"
import { COUNTRIES, DATE_OPTIONS } from "@/data/mock"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"

export default function AddTrip() {
  const { st, set, go, toast } = useStore()
  const [country, setCountry] = useState(null)
  const [dates, setDates] = useState(null)
  const taken = new Set([st.current, ...st.trips.map((t) => t.countryId)])
  const options = Object.values(COUNTRIES).filter((c) => !taken.has(c.id) && !st.profiles[c.id]?.ended)

  const add = () => {
    const c = COUNTRIES[country]
    set((s) => ({ trips: [...s.trips, { id: `t${Date.now()}`, countryId: country, dates, from: COUNTRIES[s.current].airport }] }))
    toast(`Trip to ${c.city} added. Its profile is ready to download.`)
    go("home")
  }

  return (
    <Screen id="addTrip">
      <Back label="Trips" onClick={() => go("home")} />
      <Title sub="Each destination comes with a country profile.">Where to next?</Title>

      <SectionLabel>Destination</SectionLabel>
      {options.length ? (
        <Group>
          {options.map((c) => (
            <Row key={c.id} onClick={() => setCountry(c.id)} className={cn(country === c.id && "bg-info-soft hover:bg-info-soft")}>
              <span className="flex items-center gap-3">
                <CountryCode code={c.id} className={cn(country === c.id && "border-primary text-primary")} />
                <span><span className="block font-medium">{c.city}, {c.name}</span><Sub>{c.reports} reports, updated {c.updated}</Sub></span>
              </span>
              {country === c.id && <Check className="size-5 text-primary" strokeWidth={2.6} />}
            </Row>
          ))}
        </Group>
      ) : (
        <Note tone="quiet">You already have trips to every country in this demo. Reset to start over.</Note>
      )}

      {country && (
        <>
          <SectionLabel>Dates</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {DATE_OPTIONS.map((d) => (
              <Button key={d} variant={dates === d ? "default" : "outline"} size="sm" className="rounded-full" onClick={() => setDates(d)}>
                <CalendarDays />{d}
              </Button>
            ))}
          </div>
        </>
      )}

      {country && COUNTRIES[country].vpnWarn && (
        <Note tone="warn" className="mt-4">{COUNTRIES[country].vpnNote}</Note>
      )}

      <div className="mt-auto pt-4">
        <Button size="xl" className="w-full" disabled={!country || !dates} onClick={add}>
          {country ? (dates ? `Add trip to ${COUNTRIES[country].city}` : "Pick your dates") : "Pick a destination"}
        </Button>
      </div>
    </Screen>
  )
}
