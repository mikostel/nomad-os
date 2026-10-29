// Screenshots every prototype screen and flags overflow.
// Usage: npm run shots                      (all states at 1440x900)
//        npm run shots -- vault             (only states whose name contains "vault")
//        npm run shots -- --dark            (dark theme, saved to screenshots/dark/)
//        npm run shots -- --size=1280x720   (a classroom projector, saved to screenshots/1280x720/)
import { mkdir, readdir, rm, writeFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import { chromium } from "@playwright/test"
import { createServer } from "vite"

const args = process.argv.slice(2)
const dark = args.includes("--dark")
const size = (args.find((a) => a.startsWith("--size="))?.slice(7) || "1440x900").split("x").map(Number)
const filter = args.find((a) => !a.startsWith("--"))
const folder = dark ? "dark/" : size[0] !== 1440 ? `${size.join("x")}/` : ""
const root = fileURLToPath(new URL("..", import.meta.url))
const outDir = fileURLToPath(new URL(`../screenshots/${folder}`, import.meta.url))
let base // set once the dev server is up

/* ---------- helpers ---------- */
// Jump buttons are named "<deck label><title>", like "S2Four layers", so match the end.
const side = (page, name) => page.locator("aside").getByRole("button", { name: new RegExp(`${name}$`) }).click()
const tap = (page, name, exact = true) => page.locator("main").getByRole("button", { name, exact }).first().click()
const mode = (page, name) => page.getByRole("tab", { name }).click()
const pause = (page, ms) => page.waitForTimeout(ms)
const saw = (page, text) => page.locator("main").getByText(text).first().waitFor()
const toastGone = (page) => page.locator("main [role=status]").waitFor({ state: "detached", timeout: 4000 }).catch(() => {})

async function scrollScreens(page) {
  await page.evaluate(() => {
    for (const el of document.querySelectorAll("main *")) {
      const oy = getComputedStyle(el).overflowY
      if ((oy === "auto" || oy === "scroll") && el.scrollHeight > el.clientHeight) el.scrollTop = el.scrollHeight
    }
  })
}
async function scrollScreenTo(page, text) {
  await page.locator("main").getByText(text).first().evaluate((el) => el.scrollIntoView({ block: "start" }))
}

// After a loss
async function toLoss(page) {
  await mode(page, "After a loss")
  await tap(page, "Demo: fill words")
  await tap(page, "Request access")
}
async function toReview(page) { await toLoss(page); await tap(page, "needs your approval", false) }
async function toTriage(page) { await toReview(page); await tap(page, "Approve") }
async function finishTriage(page) {
  for (const a of ["Freeze all 3", "Mark lost", "Call carrier", "Sign out others", "Change password"]) await tap(page, a)
}

// Agent chat. The empty chat starts from tiles; after that, from chips.
async function toTrainConfirm(page) {
  await side(page, "Agent"); await tap(page, "Book a train", false); await saw(page, "Here are trains")
  await tap(page, "Express 121", false); await saw(page, "Here’s what I’ll book")
}
async function bookTrain(page) { await toTrainConfirm(page); await tap(page, "Confirm and pay"); await saw(page, "Your ticket is in Trips") }
async function toSlots(page) {
  await side(page, "Agent"); await tap(page, "Find dinner", false); await saw(page, "Three places")
  await tap(page, "Book a table at Tasca do Largo"); await saw(page, "When should I book")
}
async function toBasket(page) {
  await side(page, "Agent"); await tap(page, "Order delivery", false); await saw(page, "These deliver")
  await tap(page, "Sushi Alfama", false); await saw(page, "starting order")
}
async function toHotelConfirm(page, fromChips = false) {
  if (!fromChips) await side(page, "Agent")
  await tap(page, fromChips ? "Hotel in Mexico City" : "Book a hotel", false); await saw(page, "17 nights")
  await tap(page, "Casa Roma Suites", false); await saw(page, "Here’s the stay")
}
async function bookHotel(page, fromChips = false) {
  await toHotelConfirm(page, fromChips); await tap(page, "Confirm booking"); await saw(page, "The Wi-Fi tested")
}

// Check my setup
// Chat history drawer
const historyPanel = (page) => page.getByRole("dialog", { name: "Chat history" })
async function openHistory(page) {
  await page.locator("main").getByRole("button", { name: "Chat history" }).click()
  await historyPanel(page).waitFor()
}
const pickThread = (page, title) => historyPanel(page).getByRole("button", { name: new RegExp(`^${title}`) }).click()

async function toSetup(page) { await side(page, "Four layers"); await tap(page, "Check my setup", false); await saw(page, "Choose what to share") }
async function toResults(page) { await toSetup(page); await tap(page, "Check my setup"); await page.getByText("Mexico City setup").waitFor() }

async function addTrip(page, city, dates = "Nov 4 to Nov 20") {
  await side(page, "Add a trip")
  await tap(page, city, false)
  await tap(page, dates, false)
  await tap(page, `Add trip to ${city}`)
}

/* ---------- every state worth checking ---------- */
const STATES = [
  // Before a trip
  ["s1-home", async () => {}],
  ["s1-home-downloading", async (p) => { await tap(p, "Download profile"); await pause(p, 350) }, { keepToast: true }],
  ["s1-home-itinerary", async (p) => scrollScreenTo(p, "Coming up")],
  ["s1-home-profiles", async (p) => scrollScreens(p)],
  ["s1-home-installed", async (p) => { await side(p, "Four layers"); await tap(p, "Trips") }],
  ["s2-layers", async (p) => side(p, "Four layers")],
  ["s2-layers-all-ready", async (p) => {
    await side(p, "Money"); await tap(p, "Add")
    await side(p, "Safety net"); await tap(p, "Send Ana her Keyholder card"); await pause(p, 1100)
    await side(p, "Four layers")
  }],
  ["s3-network", async (p) => side(p, "Network")],
  ["s4-money", async (p) => side(p, "Money")],
  ["s4-money-backup-added", async (p) => { await side(p, "Money"); await tap(p, "Add") }],
  ["s5-numbers", async (p) => side(p, "Numbers")],
  ["s6-safety", async (p) => side(p, "Safety net")],
  ["s6-safety-picker", async (p) => { await side(p, "Safety net"); await tap(p, "Change") }],
  ["s6-safety-sent", async (p) => { await side(p, "Safety net"); await tap(p, "Send Ana her Keyholder card"); await pause(p, 1100) }],

  // Rest of the app
  ["app-add-trip", async (p) => side(p, "Add a trip")],
  ["app-add-trip-picked", async (p) => { await side(p, "Add a trip"); await tap(p, "Bangkok", false); await tap(p, "Nov 22 to Dec 14", false) }],
  ["app-add-trip-warning", async (p) => { await side(p, "Add a trip"); await tap(p, "Istanbul", false) }],
  ["app-home-later-trip", async (p) => { await addTrip(p, "Bangkok"); await toastGone(p); await scrollScreenTo(p, "Later trips") }],
  ["app-numbers-needs-setup", async (p) => {
    await addTrip(p, "Bangkok"); await toastGone(p); await scrollScreenTo(p, "Later trips"); await tap(p, "Get"); await pause(p, 2500)
    await tap(p, "Numbers", false)
  }],
  ["security-vault", async (p) => side(p, "Vault")],
  ["security-vault-bottom", async (p) => { await side(p, "Vault"); await tap(p, "Show"); await scrollScreens(p) }],
  ["security-safety", async (p) => side(p, "Keyholder and SOS")],
  ["security-from-tab", async (p) => { await tap(p, "Security"); await p.getByRole("tab", { name: "Keyholder and SOS" }).click() }],
  ["app-callouts-off", async (p) => { await side(p, "Four layers"); await p.getByRole("switch", { name: "Show callouts" }).click() }],
  ["app-presenter-mode", async (p) => { await p.getByRole("button", { name: "Hide notes" }).click() }],
  ["app-saved-after-reload", async (p) => {
    await bookTrain(p); await tap(p, "Trips")
    await p.evaluate(() => sessionStorage.setItem("shots-keep", "1"))
    await p.reload(); await p.locator("main").waitFor()
    await p.evaluate(() => sessionStorage.removeItem("shots-keep"))
    await scrollScreenTo(p, "Coming up")
  }],

  // A save from an older build must never crash the app (it once left a black screen).
  ["app-old-save-loads", async (p) => {
    await p.evaluate(() => {
      localStorage.setItem("nomad-os:state", JSON.stringify({ version: 1, st: { screen: "home", trips: [{ id: "t1", countryId: "MEX" }] } }))
      localStorage.setItem("nomad-os:state:v2", JSON.stringify({ st: { trips: [{ id: "t1", countryId: "MEX" }] } }))
      sessionStorage.setItem("shots-keep", "1")
    })
    await p.reload(); await p.locator("main").waitFor()
    await p.evaluate(() => sessionStorage.removeItem("shots-keep"))
    await saw(p, "Coming up")
  }],

  // Agent chat
  ["chat-start", async (p) => side(p, "Agent")],
  ["chat-typed-help", async (p) => {
    await side(p, "Agent"); await p.getByLabel("Message the agent").fill("hi, what can you do?"); await tap(p, "Send")
    await saw(p, "Pick one below")
  }],
  ["chat-train-options", async (p) => { await side(p, "Agent"); await tap(p, "Book a train", false); await saw(p, "Here are trains") }],
  ["chat-train-confirm", async (p) => toTrainConfirm(p)],
  ["chat-train-change", async (p) => { await toTrainConfirm(p); await tap(p, "Change"); await saw(p, "Pick again") }],
  ["chat-train-booked", async (p) => bookTrain(p)],
  ["chat-train-cancelled", async (p) => { await toTrainConfirm(p); await tap(p, "Cancel"); await saw(p, "Nothing was booked") }],
  ["chat-restaurants", async (p) => { await side(p, "Agent"); await tap(p, "Find dinner", false); await saw(p, "Three places"); await tap(p, "Read another review") }],
  ["chat-restaurant-risk", async (p) => {
    await side(p, "Agent"); await tap(p, "Find dinner", false); await saw(p, "Three places")
    await tap(p, "Book a table at Pátio 14"); await saw(p, "I didn’t book")
  }],
  ["chat-table-slots", async (p) => toSlots(p)],
  ["chat-table-confirm", async (p) => { await toSlots(p); await tap(p, "8:00 pm"); await tap(p, "Continue"); await saw(p, "Here’s the booking") }],
  ["chat-delivery-basket", async (p) => toBasket(p)],
  ["chat-delivery-confirm", async (p) => { await toBasket(p); await tap(p, "One more Green tea"); await tap(p, "Review order"); await saw(p, "Here’s your order") }],
  ["chat-hotels", async (p) => { await side(p, "Agent"); await tap(p, "Book a hotel", false); await saw(p, "I left one listing out") }],
  ["chat-hotel-confirm", async (p) => toHotelConfirm(p)],
  ["chat-hotel-faceid", async (p) => { await toHotelConfirm(p); await tap(p, "Confirm booking"); await pause(p, 400) }],
  ["chat-hotel-booked", async (p) => { await bookHotel(p); await saw(p, "Before you fly") }],
  ["chat-setup-card", async (p) => { await side(p, "Agent"); await tap(p, "Check my setup", false); await saw(p, "You choose what I can see") }],
  // Threads: new chat, history, reopen, delete
  ["chat-history", async (p) => { await side(p, "Agent"); await openHistory(p) }],
  ["chat-history-after-booking", async (p) => { await bookTrain(p); await openHistory(p) }],
  ["chat-new-after-booking", async (p) => { await bookTrain(p); await tap(p, "New chat"); await saw(p, "What do you need?") }],
  ["chat-reopen-thread", async (p) => {
    await bookTrain(p); await tap(p, "New chat"); await openHistory(p); await pickThread(p, "Train to Porto"); await saw(p, "Your ticket is in Trips")
  }],
  ["chat-past-thread", async (p) => { await side(p, "Agent"); await openHistory(p); await pickThread(p, "Hotel in Barcelona"); await saw(p, "Gràcia Courtyard") }],
  ["chat-delete-ask", async (p) => { await side(p, "Agent"); await openHistory(p); await historyPanel(p).getByRole("button", { name: "Delete Train to Kyoto" }).click() }],
  ["chat-deleted", async (p) => {
    await side(p, "Agent"); await openHistory(p); await historyPanel(p).getByRole("button", { name: "Delete Train to Kyoto" }).click()
    await historyPanel(p).getByRole("button", { name: "Delete", exact: true }).click()
    await historyPanel(p).getByText("Train to Kyoto").waitFor({ state: "detached" })
  }],
  ["chat-left-and-back", async (p) => { await bookTrain(p); await tap(p, "Trips"); await tap(p, "Agent"); await saw(p, "Your ticket is in Trips") }],
  ["chat-reply-lands-in-its-thread", async (p) => {
    // Start a new chat while the train reply is still on its way. The reply belongs to the first thread.
    await side(p, "Agent"); await tap(p, "Book a train", false); await tap(p, "New chat")
    await pause(p, 1200); await openHistory(p); await pickThread(p, "Train to Porto"); await saw(p, "Here are trains")
  }],
  // Unread replies, cancelled receipts, and bookings that open their own chat
  ["chat-unread-tab", async (p) => { await side(p, "Agent"); await tap(p, "Book a train", false); await tap(p, "Trips"); await pause(p, 1100) }],
  ["chat-unread-header", async (p) => { await side(p, "Agent"); await tap(p, "Book a train", false); await tap(p, "New chat"); await pause(p, 1100) }],
  ["chat-unread-history", async (p) => { await side(p, "Agent"); await tap(p, "Book a train", false); await tap(p, "New chat"); await pause(p, 1100); await openHistory(p) }],
  ["chat-receipt-cancelled", async (p) => {
    await bookTrain(p); await tap(p, "Open Lisbon to Porto booking"); await tap(p, "Cancel booking"); await tap(p, "Yes, cancel it")
    await tap(p, "Trips"); await tap(p, "Agent"); await saw(p, "I cancelled")
  }],
  ["booking-ask-agent", async (p) => {
    await bookTrain(p); await tap(p, "New chat"); await tap(p, "Trips"); await tap(p, "Train to Porto", false)
    await tap(p, "Ask the agent about this"); await saw(p, "Your ticket is in Trips")
  }],
  ["link-agent", async (p) => { await p.goto(`${base}#agent`); await saw(p, "Books and pays only when you confirm") }],

  // Bookings
  ["booking-train", async (p) => { await bookTrain(p); await tap(p, "Open Lisbon to Porto booking") }],
  ["booking-train-bottom", async (p) => { await bookTrain(p); await tap(p, "Open Lisbon to Porto booking"); await scrollScreens(p) }],
  ["booking-cancel-ask", async (p) => {
    await bookTrain(p); await tap(p, "Open Lisbon to Porto booking"); await tap(p, "Cancel booking"); await scrollScreens(p)
  }],
  ["booking-cancelled", async (p) => {
    await bookTrain(p); await tap(p, "Open Lisbon to Porto booking"); await tap(p, "Cancel booking"); await tap(p, "Yes, cancel it")
  }],
  ["booking-hotel", async (p) => { await bookHotel(p); await tap(p, "Open Casa Roma Suites booking") }],
  ["booking-delivery", async (p) => {
    await toBasket(p); await tap(p, "Review order"); await saw(p, "Here’s your order"); await tap(p, "Confirm and pay"); await saw(p, "Order placed")
    await tap(p, "Open Sushi Alfama booking")
  }],
  ["home-booked", async (p) => {
    await bookTrain(p); await bookHotel(p, true)
    await tap(p, "Trips"); await scrollScreenTo(p, "Coming up")
  }],

  // Check my setup (deck slide 2), opened from chat or Four layers
  ["setup-intro", async (p) => toSetup(p)],
  ["setup-from-chat-not-downloaded", async (p) => {
    await tap(p, "Agent"); await tap(p, "Check my setup", false); await saw(p, "You choose what I can see"); await tap(p, "Open")
  }],
  ["setup-download-returns", async (p) => {
    await tap(p, "Agent"); await tap(p, "Check my setup", false); await saw(p, "You choose what I can see"); await tap(p, "Open")
    await tap(p, "Download the Mexico City profile"); await pause(p, 2500); await saw(p, "Choose what to share")
  }],
  ["setup-checking", async (p) => { await toSetup(p); await tap(p, "Check my setup"); await pause(p, 700) }],
  ["setup-results", async (p) => toResults(p)],
  ["setup-results-decided", async (p) => { await toResults(p); await tap(p, "Approve"); await tap(p, "Mark as done"); await tap(p, "Do it yourself next time") }],
  ["setup-results-bottom", async (p) => { await toResults(p); await scrollScreens(p) }],
  ["setup-share-limited", async (p) => {
    await toSetup(p)
    await p.getByRole("switch", { name: "Share banks and payment apps" }).click()
    await p.getByRole("switch", { name: "Share how accounts send codes" }).click()
    await tap(p, "Check my setup"); await p.getByText("Mexico City setup").waitFor()
  }],

  // User testing: the operator panel in a second window answers for the agent
  ["operator-answering", async (p, ctx) => {
    await side(p, "Agent")
    const op = await ctx.newPage()
    await op.goto(`${base}#operator`)
    await op.getByText("Connected to the prototype").waitFor()
    await op.getByRole("switch").click()
    await p.getByLabel("Message the agent").fill("Can you find me a gym near the hotel?"); await tap(p, "Send")
    await op.getByText("Can you find me a gym near the hotel?").last().waitFor() // the bubble, not the chat title
    // While the operator writes, the participant sees typing dots and the panel says someone's waiting.
    await p.getByRole("status", { name: "Agent is typing" }).waitFor()
    await op.getByText("The participant is waiting for your reply").waitFor()
    await p.screenshot({ path: `${outDir}operator-participant-waiting.png` })
    await op.screenshot({ path: `${outDir}operator-panel-waiting.png` })
    await op.getByLabel("Reply as the agent").fill("There’s a gym two blocks from Casa Roma Suites. Want me to check day passes?")
    await op.getByRole("button", { name: "Send reply" }).click()
    await saw(p, "day passes")
    await op.screenshot({ path: `${outDir}operator-panel.png` })
    await op.close()
  }],

  // After a loss
  ["s7a-words", async (p) => mode(p, "After a loss")],
  ["s7a-words-filled", async (p) => { await mode(p, "After a loss"); await tap(p, "Demo: fill words") }],
  ["s7a-words-wrong", async (p) => {
    await mode(p, "After a loss"); await tap(p, "Demo: fill words")
    await p.getByLabel("Recovery word 3", { exact: true }).fill("orbis")
    await p.getByLabel("Recovery word 9", { exact: true }).fill("sumit")
    await tap(p, "Request access")
  }],
  ["decision-waiting", async (p) => toLoss(p)],
  ["decision-focus-phone", async (p) => { await toLoss(p); await mode(p, "Phone") }],
  ["decision-focus-laptop", async (p) => { await toLoss(p); await mode(p, "Laptop") }],
  ["link-triage", async (p) => { await p.goto(`${base}#triage`); await p.getByText("Do these in order").waitFor() }],
  ["decision-review", async (p) => toReview(p)],
  ["decision-declined", async (p) => { await toReview(p); await tap(p, "This isn’t Dani") }],
  ["s7b-triage", async (p) => toTriage(p)],
  ["s7b-triage-step-3", async (p) => { await toTriage(p); await tap(p, "Freeze all 3"); await tap(p, "Mark lost") }],
  ["s7b-triage-other-keyholder", async (p) => {
    await side(p, "Safety net"); await tap(p, "Change"); await tap(p, "Marco, friend", false)
    await toTriage(p); await tap(p, "Freeze all 3")
  }],
  ["s7b-triage-escalations", async (p) => { await toTriage(p); await tap(p, "Open"); await scrollScreens(p) }],
  ["s7b-triage-complete", async (p) => { await toTriage(p); await finishTriage(p) }],
  ["s7b-triage-complete-hotel", async (p) => { await bookHotel(p); await toTriage(p); await finishTriage(p) }],
]

/* ---------- overflow check, runs inside the page ---------- */
// Measures real text, so decorations that poke out on purpose (callouts, hit areas) don't count.
function findOverflow() {
  const issues = []
  const short = (s) => `"${s.trim().replace(/\s+/g, " ").slice(0, 40)}"`
  const clipper = (el) => {
    for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
      const o = getComputedStyle(a)
      if (o.overflowX !== "visible" || o.overflowY !== "visible") return a
    }
    return null
  }

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.textContent
    const parent = node.parentElement
    if (!text.trim() || !parent || parent.closest("svg, script, style")) continue
    const cs = getComputedStyle(parent)
    if (cs.visibility === "hidden" || cs.textOverflow === "ellipsis") continue
    const box = parent.getBoundingClientRect()
    if (box.width < 2 || box.height < 2) continue // visually hidden text for screen readers
    const range = document.createRange()
    range.selectNodeContents(node)
    const rects = [...range.getClientRects()].filter((r) => r.width > 0)
    if (!rects.length) continue
    if (rects.some((r) => r.right > box.right + 1 || r.left < box.left - 1)) {
      issues.push(`text spills out of its box: ${short(text)} (${Math.round(Math.max(...rects.map((r) => r.right)) - box.right)}px past the edge)`)
    }
    const clip = clipper(parent)
    if (!clip) continue
    const c = clip.getBoundingClientRect()
    const cut = rects.some((r) => r.bottom > c.bottom + 1 || r.right > c.right + 1 || r.top < c.top - 1 || r.left < c.left - 1)
    const co = getComputedStyle(clip)
    if (cut && (co.overflowY === "hidden" || co.overflowY === "clip" || co.overflowX === "hidden")) {
      issues.push(`text cut off by its container: ${short(text)}`)
    }
  }

  // Scroll areas aren't bugs, but anything below the fold won't show in a screenshot or a slide.
  for (const el of document.querySelectorAll("main *")) {
    const oy = getComputedStyle(el).overflowY
    const hidden = el.scrollHeight - el.clientHeight - el.scrollTop
    if ((oy === "auto" || oy === "scroll") && hidden > 1) issues.push(`scrolls: ${hidden}px below the fold in ${short(el.innerText)}`)
  }
  return [...new Set(issues)]
}

/* ---------- run ---------- */
const server = await createServer({ root, logLevel: "error", server: { port: 5199, strictPort: false } })
await server.listen()
base = server.resolvedUrls.local[0]

const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: size[0], height: size[1] }, reducedMotion: "reduce", deviceScaleFactor: 1, colorScheme: dark ? "dark" : "light" })
// The prototype saves its state, so every screenshot starts from a clean slate unless a state asks to keep it.
await context.addInitScript(() => {
  if (location.hash !== "#operator" && !sessionStorage.getItem("shots-keep")) localStorage.clear()
})
const page = await context.newPage()
context.setDefaultTimeout(5000)
const errors = []
page.on("pageerror", (e) => errors.push(e.message))
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()) })

await mkdir(outDir, { recursive: true })
if (!filter) {
  for (const f of await readdir(outDir)) if (f.endsWith(".png") || f === "REPORT.md") await rm(`${outDir}${f}`)
}

const report = []
for (const [name, run, opts = {}] of STATES) {
  if (filter && !name.includes(filter)) continue
  await page.goto(base)
  await page.locator("main").waitFor()
  await page.evaluate(() => document.fonts.ready)
  try {
    await run(page, context)
  } catch (e) {
    report.push({ name, issues: [`could not reach this state: ${e.message.split("\n")[0]}`] })
    console.log(`✗ ${name}  could not reach this state: ${e.message.split("\n")[0]}`)
    continue
  }
  if (!opts.keepToast) await toastGone(page)
  await page.mouse.move(1, size[1] - 1) // park the mouse so nothing shows a hover state
  await pause(page, 150)
  await page.screenshot({ path: `${outDir}${name}.png` })
  const issues = await page.evaluate(findOverflow)
  report.push({ name, issues })
  console.log(`${issues.length ? "!" : "✓"} ${name}${issues.length ? `  ${issues.length} issue(s)` : ""}`)
  for (const i of issues) console.log(`    ${i}`)
}

const md = ["# Screenshot report", "", `${report.length} states at ${size.join("x")}${dark ? ", dark theme" : ""}.`, ""]
for (const r of report) md.push(`## ${r.name}`, "", `![${r.name}](${r.name}.png)`, "", ...(r.issues.length ? r.issues.map((i) => `- ${i}`) : ["No overflow found."]), "")
if (errors.length) md.push("## Console errors", "", ...[...new Set(errors)].map((e) => `- ${e}`), "")
await writeFile(`${outDir}REPORT.md`, md.join("\n"))
if (errors.length) console.log(`\nConsole errors:\n${[...new Set(errors)].join("\n")}`)
console.log(`\nSaved to screenshots/${folder} (see REPORT.md there)`)

await browser.close()
await server.close()
