import { ChevronLeft, ChevronRight, Info, TriangleAlert, Plane, Lock, KeyRound, ShieldCheck, Sparkles } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { useStore } from "@/lib/store"

/** Numbered callout that matches the deck’s annotations. Hidden when callouts are off. */
export function Co({ n, className }) {
  const { callouts } = useStore()
  if (!callouts) return null
  return (
    <span aria-hidden="true"
      className={cn("absolute z-10 grid place-items-center size-[22px] rounded-full bg-primary text-primary-foreground font-mono text-[11px] font-semibold ring-[3px] ring-background pointer-events-none", className)}>
      {n}
    </span>
  )
}

export function Screen({ id, children, className }) {
  return <div key={id} className={cn("enter flex-1 min-h-0 flex flex-col px-5 pb-3 text-[14px] text-pretty overflow-y-auto", className)}>{children}</div>
}

export function Back({ label, onClick }) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-0.5 -ml-1.5 text-primary text-[15px] font-medium cursor-pointer w-fit rounded-md px-1 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
      <ChevronLeft className="size-5" strokeWidth={2.4} />{label}
    </button>
  )
}

export function Title({ children, sub, className }) {
  return (
    <div className={cn("mt-2", className)}>
      <h2 className="text-[28px] font-semibold tracking-[-0.03em] leading-[1.1]">{children}</h2>
      {sub && <p className="text-[14px] text-muted-foreground mt-1.5 leading-snug">{sub}</p>}
    </div>
  )
}

export function Sub({ children, className }) {
  return <span className={cn("block text-[12.5px] text-muted-foreground", className)}>{children}</span>
}

export function SectionLabel({ children, className }) {
  return <p className={cn("text-[13px] font-semibold text-muted-foreground mt-5 mb-2 px-1", className)}>{children}</p>
}

export function CountryCode({ code, className }) {
  return <span className={cn("grid place-items-center h-[28px] w-[40px] rounded-md border bg-background font-mono text-[11px] font-semibold tracking-wide shrink-0", className)}>{code}</span>
}

export function Group({ className, children }) {
  return <div className={cn("relative rounded-2xl bg-muted border divide-y", className)}>{children}</div>
}

export function Row({ children, onClick, className, chevron }) {
  const Comp = onClick ? "button" : "div"
  return (
    <Comp onClick={onClick}
      className={cn("w-full flex items-center justify-between gap-3 px-4 py-3 text-left",
        onClick && "cursor-pointer hover:bg-accent/70 first:rounded-t-2xl last:rounded-b-2xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:relative",
        className)}>
      {children}
      {chevron && <ChevronRight className="size-4 text-faint shrink-0 -ml-1" />}
    </Comp>
  )
}

const noteTones = {
  info: "bg-info-soft text-foreground [&>svg]:text-primary",
  warn: "bg-warning-soft text-foreground [&>svg]:text-warning",
  quiet: "bg-muted text-muted-foreground border",
}
export function Note({ tone = "info", icon: Icon = tone === "warn" ? TriangleAlert : Info, children, className }) {
  return (
    <div className={cn("relative flex gap-2.5 rounded-xl px-3.5 py-3 text-[13px] leading-snug", noteTones[tone], className)}>
      <Icon className="size-4 mt-px shrink-0" strokeWidth={2.2} />
      <div>{children}</div>
    </div>
  )
}

export function PersonAvatar({ contact, className, textClassName }) {
  return (
    <Avatar className={cn("size-11", className)}>
      <AvatarFallback className={cn("text-[16px] font-semibold", textClassName)} style={{ background: contact.bg, color: contact.ink }}>
        {contact.name[0]}
      </AvatarFallback>
    </Avatar>
  )
}

export function Wordmark({ className }) {
  return <p className={cn("text-[19px] font-bold tracking-[-0.03em]", className)}>NOMAD<span className="text-primary">.OS</span></p>
}

// Three tabs: your trips, the agent, and everything that keeps you safe (vault and Keyholder).
const TABS = [
  { id: "home", screen: "home", label: "Trips", icon: Plane },
  { id: "agent", screen: "agent", label: "Agent", icon: Sparkles },
  { id: "security", screen: "vault", label: "Security", icon: ShieldCheck },
]
export function TabBar({ active }) {
  const { go } = useStore()
  return (
    <nav className="-mx-5 px-6 flex justify-around pt-2 border-t bg-background shrink-0 mt-auto">
      {TABS.map(({ id, screen, label, icon: Icon }) => (
        <button key={id} onClick={() => go(screen, { from: screen })} aria-current={active === id ? "page" : undefined}
          className={cn("flex flex-col items-center gap-1 px-4 py-1 rounded-lg text-[11px] cursor-pointer outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
            active === id ? "text-primary" : "text-faint hover:text-muted-foreground")}>
          <Icon className="size-[22px]" />{label}
        </button>
      ))}
    </nav>
  )
}

/** Title and section switch shared by the two halves of the Security tab. */
export function SecurityHeader({ active, sub }) {
  const { go } = useStore()
  return (
    <div className="mt-4">
      <h2 className="text-[28px] font-semibold tracking-[-0.03em] leading-[1.1]">Security</h2>
      <Tabs value={active} onValueChange={(v) => go(v)} className="mt-3">
        <TabsList className="w-full">
          <TabsTrigger value="vault"><Lock />Vault</TabsTrigger>
          <TabsTrigger value="safetyTab"><KeyRound />Keyholder and SOS</TabsTrigger>
        </TabsList>
      </Tabs>
      <p className="text-[14px] text-muted-foreground mt-3 leading-snug">{sub}</p>
    </div>
  )
}
