import { Component } from "react"
import { RotateCcw, TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { STORAGE_KEY } from "@/lib/store"

/**
 * If a screen throws, show a way back instead of a blank page.
 * The usual cause is a saved state the current build doesn't expect, so resetting clears it.
 */
export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error("NOMAD.OS crashed:", error, info.componentStack)
  }

  reset = () => {
    try { localStorage.removeItem(STORAGE_KEY) } catch { /* nothing saved */ }
    history.replaceState(null, "", location.pathname + location.search)
    location.reload()
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="h-full grid place-items-center bg-stage p-6">
        <div role="alert" className="max-w-[420px] rounded-2xl border bg-background p-6 shadow-lg">
          <span className="grid place-items-center size-10 rounded-full bg-warning-soft text-warning"><TriangleAlert className="size-5" /></span>
          <h1 className="text-[20px] font-semibold tracking-[-0.02em] mt-4">The prototype hit a snag</h1>
          <p className="text-[14px] text-muted-foreground mt-1.5 leading-relaxed">
            Something on this screen didn’t load. Resetting clears your saved progress and starts the demo over.
          </p>
          <p className="font-mono text-[12px] text-muted-foreground mt-3 rounded-lg bg-muted px-3 py-2 break-words">{String(this.state.error.message || this.state.error)}</p>
          <Button className="mt-4" onClick={this.reset}><RotateCcw />Reset and reload</Button>
        </div>
      </div>
    )
  }
}
