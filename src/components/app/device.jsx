import { useLayoutEffect, useRef, useState } from "react"
import { Lock } from "lucide-react"
import { cn } from "@/lib/utils"

function StatusBar({ time = "9:41", dark }) {
  return (
    <div className={cn("relative flex items-center justify-between h-[50px] px-7 pt-1 text-[15px] font-semibold shrink-0", dark && "text-white")}>
      <span>{time}</span>
      <span className="absolute left-1/2 top-[11px] -translate-x-1/2 w-[112px] h-[32px] rounded-full bg-black" />
      <span className="flex items-center gap-1.5">
        <svg width="17" height="11" viewBox="0 0 13 9" fill="currentColor" aria-hidden="true">
          <rect x="0" y="6" width="2.2" height="3" rx=".6" /><rect x="3.4" y="4" width="2.2" height="5" rx=".6" />
          <rect x="6.8" y="2" width="2.2" height="7" rx=".6" /><rect x="10.2" y="0" width="2.2" height="9" rx=".6" />
        </svg>
        <span className="text-[12px]">5G</span>
        <svg width="25" height="12" viewBox="0 0 18 9" aria-hidden="true">
          <rect x=".5" y=".5" width="15" height="8" rx="2.2" fill="none" stroke="currentColor" opacity=".45" />
          <rect x="2" y="2" width="10" height="5" rx="1.2" fill="currentColor" />
          <rect x="16.3" y="3" width="1.2" height="3" rx=".5" fill="currentColor" opacity=".45" />
        </svg>
      </span>
    </div>
  )
}

export function Phone({ children, time, dark, screenClassName, label, overlay }) {
  return (
    <div className="relative w-[390px] h-[800px] rounded-[60px] bg-bezel p-[10px] shadow-[0_40px_80px_-30px_rgba(10,15,30,.55)]" aria-label={label}>
      <div className={cn("relative h-full rounded-[50px] bg-background text-foreground overflow-hidden flex flex-col", screenClassName)}>
        <StatusBar time={time} dark={dark} />
        <div className="flex-1 min-h-0 flex flex-col">{children}</div>
        <div className={cn("mx-auto mb-2 mt-1 h-[5px] w-[134px] rounded-full shrink-0", dark ? "bg-white/80" : "bg-foreground/80")} />
        {overlay}
      </div>
    </div>
  )
}

export function Browser({ url, children }) {
  return (
    <div className="w-[920px] h-[600px] flex flex-col rounded-xl border bg-background text-foreground overflow-hidden shadow-[0_40px_80px_-36px_rgba(10,15,30,.45)]">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b bg-muted">
        <span className="size-3 rounded-full bg-[#FF5F57]" />
        <span className="size-3 rounded-full bg-[#FEBC2E]" />
        <span className="size-3 rounded-full bg-[#28C840]" />
        <span className="ml-4 flex-1 max-w-[520px] mx-auto flex items-center justify-center gap-1.5 rounded-md bg-background border px-3 py-1 font-mono text-xs text-muted-foreground">
          <Lock className="size-[11px]" strokeWidth={2.6} />
          {url}
        </span>
        <span className="w-[60px]" />
      </div>
      <div className="flex-1 min-h-0 flex">{children}</div>
    </div>
  )
}

/** Scales a fixed-size device to fit its container without reflowing the content. */
export function Fit({ w, h, children }) {
  const ref = useRef(null)
  const [s, setS] = useState(1)
  useLayoutEffect(() => {
    const el = ref.current
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect()
      setS(Math.max(0.2, Math.min(1, (r.width - 32) / w, (r.height - 32) / h)))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [w, h])
  return (
    <div ref={ref} className="absolute inset-0 grid place-items-center overflow-hidden">
      <div style={{ width: w * s, height: h * s }}>
        <div style={{ width: w, height: h, transform: `scale(${s})`, transformOrigin: "0 0" }}>{children}</div>
      </div>
    </div>
  )
}
