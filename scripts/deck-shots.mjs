// Captures the phone screens the deck shows (deck/img/*.jpg), straight from the prototype.
// Usage: npm run deck:shots
//
// Each shot is the phone alone at 2x, on white so its corners blend into the slide.
// Callouts stay on, so the numbers match the annotations on the prototype slides.
import { mkdir } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import { chromium } from "@playwright/test"
import { createServer } from "vite"

const root = fileURLToPath(new URL("..", import.meta.url))
const outDir = fileURLToPath(new URL("../deck/img/", import.meta.url))
const only = process.argv[2]

const side = (page, name) => page.locator("aside").getByRole("button", { name: new RegExp(`${name}$`) }).click()
const tap = (page, name, exact = true) => page.locator("main").getByRole("button", { name, exact }).first().click()
const saw = (page, text) => page.locator("main").getByText(text).first().waitFor()
const pause = (page, ms) => page.waitForTimeout(ms)
const toastGone = (page) => page.locator("main [role=status]").filter({ hasNotText: "Agent is typing" }).waitFor({ state: "detached", timeout: 4000 }).catch(() => {})
const scrollToEnd = (page) => page.evaluate(() => {
  for (const el of document.querySelectorAll("main *")) {
    const oy = getComputedStyle(el).overflowY
    if ((oy === "auto" || oy === "scroll") && el.scrollHeight > el.clientHeight) el.scrollTop = el.scrollHeight
  }
})

async function toHotelConfirm(page) {
  await side(page, "Agent"); await tap(page, "Book a hotel", false); await saw(page, "17 nights")
  await tap(page, "Casa Roma Suites", false); await saw(page, "Here’s the stay")
}
async function bookTrain(page) {
  await side(page, "Agent"); await tap(page, "Book a train", false); await saw(page, "Here are trains")
  await tap(page, "Express 121", false); await saw(page, "Here’s what I’ll book")
  await tap(page, "Confirm and pay"); await saw(page, "Your ticket is in Trips")
}

const SHOTS = [
  // Booking path
  ["ask", async (p) => side(p, "Agent")],
  ["compare", async (p) => { await side(p, "Agent"); await tap(p, "Book a hotel", false); await saw(p, "I left one listing out") }],
  ["approve", async (p) => toHotelConfirm(p)],
  ["booked", async (p) => { await toHotelConfirm(p); await tap(p, "Confirm booking"); await saw(p, "Before you fly") }],
  // Control and recovery
  ["verify", async (p) => { await toHotelConfirm(p); await tap(p, "Confirm booking"); await pause(p, 450) }],
  ["refuse", async (p) => {
    await side(p, "Agent"); await tap(p, "Find dinner", false); await saw(p, "Three places")
    await tap(p, "Book a table at Pátio 14"); await saw(p, "I didn’t book")
  }],
  ["undo", async (p) => { await bookTrain(p); await tap(p, "Open Lisbon to Porto booking"); await tap(p, "Cancel booking"); await scrollToEnd(p) }],
  ["learn", async (p) => {
    await side(p, "Four layers"); await tap(p, "Check my setup", false); await saw(p, "Choose what to share")
    await tap(p, "Check my setup"); await p.getByText("Mexico City setup").waitFor()
    await tap(p, "Do it yourself next time")
  }],
]

const server = await createServer({ root, logLevel: "error", server: { port: 5198, strictPort: false } })
await server.listen()
const base = server.resolvedUrls.local[0]
const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2, reducedMotion: "reduce", colorScheme: "light" })
await context.addInitScript(() => localStorage.clear()) // every shot starts from the demo's first screen
const page = await context.newPage()
page.setDefaultTimeout(6000)
const errors = []
page.on("pageerror", (e) => errors.push(e.message))
await mkdir(outDir, { recursive: true })

for (const [name, run] of SHOTS) {
  if (only && !name.includes(only)) continue
  await page.goto(base)
  await page.locator("main").waitFor()
  await page.evaluate(() => document.fonts.ready)
  await run(page)
  await toastGone(page)
  await page.addStyleTag({ content: "main { background: #fff !important; }" })
  await page.mouse.move(1, 999)
  await pause(page, 200)
  await page.locator('[aria-label="Dani\'s phone"]').screenshot({ path: `${outDir}${name}.jpg`, type: "jpeg", quality: 84 })
  console.log(`✓ ${name}`)
}
if (errors.length) console.log("Console errors:", [...new Set(errors)])
await browser.close()
await server.close()
