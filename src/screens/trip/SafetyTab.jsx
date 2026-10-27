import { Check, LoaderCircle, Phone, Send, Siren } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CountryCode, Group, Note, Row, Screen, SectionLabel, SecurityHeader, Sub, TabBar } from "@/components/app/kit"
import { COUNTRIES } from "@/data/mock"
import { keyholderContact, useStore } from "@/lib/store"
import KeyholderPicker from "./KeyholderPicker"
import { useSendCard } from "./Safety"

export default function SafetyTab() {
  const { st, set, toast } = useStore()
  const kh = keyholderContact(st)
  const send = useSendCard()
  const status = st.keyholder.status
  const places = [st.current, ...st.trips.map((t) => t.countryId)].filter((v, i, a) => a.indexOf(v) === i)

  return (
    <>
      <Screen id="safetyTab">
        <SecurityHeader active="safetyTab" sub="Who can help you get back in, and who to call where you are." />

        <SectionLabel>Your Keyholder</SectionLabel>
        <KeyholderPicker callout={false} className="mt-0" />
        {!st.pickingKeyholder && status !== "sent" && (
          <Button className="mt-3 w-full" onClick={send} disabled={status === "sending"}>
            {status === "sending" ? <><LoaderCircle className="animate-spin" />Sending</> : <><Send />Send {kh.name} {kh.pronoun} Keyholder card</>}
          </Button>
        )}
        {status === "sent" && !st.pickingKeyholder && (
          <p className="text-[12.5px] text-muted-foreground mt-2 px-1 flex items-center gap-1.5"><Check className="size-3.5 text-success" />{kh.name} can approve a recovery. {kh.name} can’t see your vault.</p>
        )}

        <SectionLabel>Emergency numbers</SectionLabel>
        <Group>
          {places.map((id) => (
            <Row key={id} onClick={() => toast(`Calling ${COUNTRIES[id].emergency} is disabled in this demo`)}>
              <span className="flex items-center gap-3"><CountryCode code={id} /><span><span className="block font-medium">{COUNTRIES[id].name}</span><Sub>{id === st.current ? "You’re here" : "Upcoming"}</Sub></span></span>
              <span className="flex items-center gap-2 font-mono font-semibold"><Siren className="size-4 text-warning" />{COUNTRIES[id].emergency}</span>
            </Row>
          ))}
          <Row>
            <span className="flex items-center gap-3"><span className="grid place-items-center size-[28px] w-[40px] rounded-md border bg-background"><Phone className="size-3.5" /></span><span><span className="block font-medium">Carrier</span><Sub>From abroad, to lock your SIM</Sub></span></span>
            <span className="font-mono text-[12.5px] whitespace-nowrap">+1 800 555 0199</span>
          </Row>
        </Group>

        <Note tone="quiet" className="mt-4 mb-2">
          Practice once before you need it.{" "}
          <button className="text-primary font-medium cursor-pointer" onClick={() => set({ mode: "loss" })}>Run a Break Glass drill</button>
        </Note>
      </Screen>
      <div className="px-5"><TabBar active="security" /></div>
    </>
  )
}
