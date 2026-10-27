import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "@fontsource-variable/geist"
import "@fontsource-variable/geist-mono"
import "./index.css"
import App from "./App"
import Operator from "@/screens/operator/Operator"
import ErrorBoundary from "@/components/app/ErrorBoundary"
import { StoreProvider } from "@/lib/store"

// #operator opens the user-testing panel instead of the prototype. It keeps no state of its own.
const operator = location.hash === "#operator"

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {operator ? <Operator /> : (
      <ErrorBoundary>
        <StoreProvider>
          <App />
        </StoreProvider>
      </ErrorBoundary>
    )}
  </StrictMode>
)
