// The Assignment 5 deck: plain HTML and Tailwind 4, built into one self-contained file.
// npm run deck        live preview at http://localhost:5174
// npm run deck:build  writes deck/dist/nomad-os-a5-deck.html (fonts, images, and code inlined)
import { renameSync } from "node:fs"
import { fileURLToPath } from "node:url"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "vite"
import { viteSingleFile } from "vite-plugin-singlefile"

const here = (p) => fileURLToPath(new URL(p, import.meta.url))

export default defineConfig({
  root: here("."),
  base: "./",
  plugins: [
    tailwindcss(),
    viteSingleFile(),
    {
      name: "name-the-deck",
      apply: "build",
      closeBundle: () => renameSync(here("dist/index.html"), here("dist/nomad-os-a5-deck.html")),
    },
  ],
  server: { port: 5174, strictPort: true },
  build: { outDir: here("dist"), emptyOutDir: true },
})
