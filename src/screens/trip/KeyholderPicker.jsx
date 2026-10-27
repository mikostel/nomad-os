import { Check, KeyRound } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Co, Group, PersonAvatar, Row, Sub } from "@/components/app/kit"
import { CONTACTS } from "@/data/mock"
import { keyholderContact, useStore } from "@/lib/store"
import { cn } from "@/lib/utils"

export default function KeyholderPicker({ callout = true, className }) {
  const { st, set, toast } = useStore()
  const kh = keyholderContact(st)

  if (st.pickingKeyholder) {
    return (
      <Group className={cn("mt-5", className)}>
        {CONTACTS.map((c) => (
          <Row key={c.id} onClick={() => {
            const changed = c.id !== kh.id
            set({ keyholder: { contactId: c.id, status: changed ? "none" : st.keyholder.status }, pickingKeyholder: false })
            if (changed) toast(`${c.name} selected. Send ${c.name} a Keyholder card to finish.`)
          }}>
            <span className="flex items-center gap-3">
              <PersonAvatar contact={c} className="size-10" textClassName="text-[15px]" />
              <span><span className="block font-semibold">{c.name}, {c.relation}</span><Sub>{c.place}, {c.phone}</Sub></span>
            </span>
            {c.id === kh.id && <Check className="size-5 text-primary" strokeWidth={2.6} />}
          </Row>
        ))}
      </Group>
    )
  }

  return (
    <div className={cn("relative mt-5 rounded-2xl border-[1.5px] border-primary bg-info-soft p-4 flex items-center gap-3", className)}>
      {callout && <Co n={11} className="-right-2 -top-2.5" />}
      <span className="relative">
        <PersonAvatar contact={kh} className="size-12" textClassName="text-[17px]" />
        <span className="absolute -bottom-0.5 -right-0.5 grid place-items-center size-5 rounded-full bg-primary text-primary-foreground ring-2 ring-info-soft">
          <KeyRound className="size-[11px]" strokeWidth={2.6} />
        </span>
      </span>
      <span className="flex-1 min-w-0">
        <span className="block font-semibold text-[15px]">{kh.name}, {kh.relation}</span>
        <Sub>{kh.place}, {kh.phone}</Sub>
        {st.keyholder.status === "sent" && <Badge variant="success" className="mt-1.5"><Check strokeWidth={3} />Card sent</Badge>}
      </span>
      <Button size="sm" variant="ghost" className="text-primary hover:text-primary" onClick={() => set({ pickingKeyholder: true })}>Change</Button>
    </div>
  )
}
