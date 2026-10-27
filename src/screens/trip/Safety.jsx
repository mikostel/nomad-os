import { Check, Clock, LoaderCircle, Send, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Back, Co, Group, Note, Row, Screen, Title } from "@/components/app/kit"
import { keyholderContact, useStore } from "@/lib/store"
import KeyholderPicker from "./KeyholderPicker"
import { useCountry } from "./Layers"

export function useSendCard() {
  const { st, set, toast } = useStore()
  const kh = keyholderContact(st)
  return () => {
    set({ keyholder: { ...st.keyholder, status: "sending" } })
    setTimeout(() => {
      set((s) => ({ keyholder: { ...s.keyholder, status: "sent" } }))
      toast(`Keyholder card sent to ${kh.name}`)
    }, 900)
  }
}

export default function Safety() {
  const { st, go, toast } = useStore()
  const { id, c } = useCountry()
  const kh = keyholderContact(st)
  const send = useSendCard()
  const status = st.keyholder.status

  return (
    <Screen id={`safety-${id}`}>
      <Back label={c.city} onClick={() => go("layers", { countryId: id })} />
      <Title sub="Someone you trust who can approve a recovery if you lose your phone.">
        {st.pickingKeyholder ? "Pick a Keyholder" : "Choose a Keyholder"}
      </Title>

      <KeyholderPicker />

      {!st.pickingKeyholder && (
        <>
          <Group className="mt-4">
            <Co n={12} className="-right-2 -top-2.5" />
            <Row className="justify-start">
              <span className="grid place-items-center size-6 rounded-full bg-success-soft text-success shrink-0"><Check className="size-[13px]" strokeWidth={3.2} /></span>
              <span className="flex-1"><b className="font-semibold">{kh.name} can</b> approve a Break Glass request</span>
            </Row>
            <Row className="justify-start">
              <span className="grid place-items-center size-6 rounded-full bg-secondary text-muted-foreground shrink-0"><X className="size-3" strokeWidth={3.2} /></span>
              <span className="flex-1"><b className="font-semibold">{kh.name} can’t</b> see your vault or sign in as you</span>
            </Row>
          </Group>

          <Note tone="quiet" icon={Clock} className="mt-4">
            <Co n={13} className="-right-2 -top-2.5" />
            No Keyholder? Recovery opens after a <span className="whitespace-nowrap">24-hour</span> wait.
          </Note>

          <div className="mt-auto pt-4">
            {status === "sent" ? (
              <Button size="xl" className="w-full" onClick={() => go("layers", { countryId: id })}>Done</Button>
            ) : (
              <Button size="xl" className="w-full" onClick={send} disabled={status === "sending"}>
                {status === "sending" ? <><LoaderCircle className="animate-spin" />Sending</> : <><Send />Send {kh.name} {kh.pronoun} Keyholder card</>}
              </Button>
            )}
            <Button variant="link" className="w-full mt-1" onClick={() => toast("A printable card is ready to download")}>Print a card instead</Button>
          </div>
        </>
      )}
    </Screen>
  )
}
