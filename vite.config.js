import { fileURLToPath, URL } from "node:url"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { viteSingleFile } from "vite-plugin-singlefile"

// `npm run build:single` inlines everything into one HTML file for sharing.
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), mode === "single" && viteSingleFile()].filter(Boolean),
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
}))
