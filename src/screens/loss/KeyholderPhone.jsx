import { Check, Laptop, MapPin, MonitorSmartphone, ShieldCheck, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Phone } from "@/components/app/device"
import { Group, Note, PersonAvatar, Row, Sub, Wordmark } from "@/components/app/kit"
import { COUNTRIES, USER } from "@/data/mock"
import { keyholderContact, useStore } from "@/lib/store"

function LockScreen({ kh, city, onOpen }) {
  return (
    <div className="flex-1 flex flex-col px-4 text-white">
      <div className="text-center mt-6">
        <p className="text-[17px] font-medium opacity-90">Monday, October 26</p>
        <p className="text-[84px] font-semibold leading-none tracking-[-0.04em] mt-1">{kh.localTime}</p>
      </div>
      <button onClick={onOpen}
        className="notif-in mt-10 text-left rounded-[22px] bg-white/18 backdrop-blur-xl px-4 py-3.5 cursor-pointer outline-none focus-visible:ring-[3px] focus-visible:ring-white/60 hover:bg-white/25 transition-colors">
        <div className="flex items-center justify-between text-[12.5px] opacity-85">
          <span className="flex items-center gap-1.5"><span className="grid place-items-center size-5 rounded-md bg-[#2F5BEA] text-[9px] font-bold">N</span>NOMAD.OS</span>
          <span>now</span>
        </div>
        <p className="font-semibold text-[15px] mt-1.5">{USER.name} needs your approval</p>
        <p className="text-[14px] opacity-90 leading-snug mt-0.5">{USER.name} is starting Break Glass from a browser in {city}. Tap to review.</p>
      </button>
      <p className="mt-auto mb-3 text-center text-[12.5px] opacity-70">You’re {kh.name}. Tap the notification.</p>
    </div>
  )
}

function Review({ kh, city, onApprove, onDecline }) {
  return (
    <div className="enter flex-1 flex flex-col px-5 pb-3 text-[14px]">
      <Wordmark className="mt-2 text-[17px]" />
      <h2 className="text-[26px] font-semibold tracking-[-0.03em] leading-[1.15] mt-4">Approve {USER.name}’s recovery?</h2>
      <p className="text-[14px] text-muted-foreground mt-1.5">{USER.name} named you as Keyholder.</p>

      <Group className="mt-5">
        <Row><span className="flex items-center gap-3"><Laptop className="size-4 text-muted-foreground" />From</span><span className="font-medium">Chrome on Windows</span></Row>
        <Row><span className="flex items-center gap-3"><MapPin className="size-4 text-muted-foreground" />Where</span><span className="font-medium">{city}</span></Row>
        <Row><span className="flex items-center gap-3"><MonitorSmartphone className="size-4 text-muted-foreground" />Computer</span><span className="font-medium">Shared, forgets on close</span></Row>
      </Group>

      <Note icon={ShieldCheck} className="mt-4">Approving lets {USER.name} back into {USER.name}’s accounts for 24 hours. You won’t see the vault or sign in as {USER.name}.</Note>
      <Note tone="quiet" className="mt-2.5">Not sure it’s {USER.name}? Call first. If it isn’t, declining changes nothing.</Note>

      <div className="mt-auto pt-4 flex flex-col gap-2">
        <Button size="xl" onClick={onApprove}><Check strokeWidth={2.6} />Approve</Button>
        <Button size="xl" variant="outline" onClick={onDecline}>This isn’t {USER.name}</Button>
      </div>
    </div>
  )
}

function Result({ approved, kh }) {
  return (
    <div className="enter flex-1 flex flex-col items-center justify-center text-center px-8">
      <span className={approved ? "grid place-items-center size-16 rounded-full bg-success-soft text-success" : "grid place-items-center size-16 rounded-full bg-secondary text-muted-foreground"}>
        {approved ? <Check className="size-8" strokeWidth={2.6} /> : <X className="size-8" strokeWidth={2.6} />}
      </span>
      <h2 className="text-[24px] font-semibold tracking-[-0.03em] mt-5">{approved ? "You approved it" : "You declined it"}</h2>
      <p className="text-[14px] text-muted-foreground mt-2 leading-relaxed">
        {approved
          ? `${USER.name} has 24 hours to secure the accounts. We’ll tell you when ${USER.name} is back in.`
          : `${USER.name}’s accounts stay locked. If it really was ${USER.name}, there’s a way to ask again.`}
      </p>
      <Sub className="mt-6">Thanks for being {USER.name}’s Keyholder, {kh.name}.</Sub>
    </div>
  )
}

export default function KeyholderPhone() {
  const { st, setLoss, toast } = useStore()
  const kh = keyholderContact(st)
  const city = COUNTRIES[st.trips[0]?.countryId || st.current].city
  const state = st.loss.ana
  const locked = state === "locked"

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-2 text-[14px] font-medium text-muted-foreground">
        <PersonAvatar contact={kh} className="size-6" textClassName="text-[11px]" />{kh.name}’s phone, in {kh.place}
      </div>
      <Phone time={kh.localTime} dark={locked} label={`${kh.name}'s phone`}
        screenClassName={locked ? "bg-[linear-gradient(160deg,#1B2F7A_0%,#0A0F1E_70%)]" : undefined}>
        {state === "locked" && <LockScreen kh={kh} city={city} onOpen={() => setLoss({ ana: "review" })} />}
        {state === "review" && (
          <Review kh={kh} city={city}
            onApprove={() => { setLoss({ ana: "approved", step: "triage" }); toast(`${kh.name} approved. Triage is open.`) }}
            onDecline={() => { setLoss({ ana: "declined", step: "declined" }); toast(`${kh.name} declined the request`) }} />
        )}
        {state === "approved" && <Result approved kh={kh} />}
        {state === "declined" && <Result kh={kh} />}
      </Phone>
    </div>
  )
}
