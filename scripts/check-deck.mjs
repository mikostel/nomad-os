// Checks the built deck and exports its PDFs.
// Usage: npm run deck:build && npm run deck:check
//
// Renders every slide at 1280x720 into screenshots/deck/, flags anything that spills past the
// slide's margins, checks images, notes, footers, and the presenter view, then prints the
// whole deck, appendix included, to deck/dist/ as a PDF, with and without speaker notes.
import { mkdir } from "node:fs/promises"
import { readFileSync } from "node:fs"
import { fileURLToPath, pathToFileURL } from "node:url"
import { chromium } from "@playwright/test"

const deckFile = fileURLToPath(new URL("../deck/dist/nomad-os-a5-deck.html", import.meta.url))
const shotDir = fileURLToPath(new URL("../screenshots/deck/", import.meta.url))
const distDir = fileURLToPath(new URL("../deck/dist/", import.meta.url))
const url = pathToFileURL(deckFile).href
const problems = []

await mkdir(shotDir, { recursive: true })
const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1, reducedMotion: "reduce" })
const page = await context.newPage()
const errors = []
page.on("pageerror", (e) => errors.push(e.message))
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()) })

await page.goto(`${url}#full/1`)
await page.evaluate(() => document.fonts.ready)
await page.mouse.move(640, 360)
await page.addStyleTag({ content: ".controls { display: none !important; }" }) // keep the bar out of the shots

const count = await page.evaluate(() => window.deck.count)
for (let n = 0; n < count; n++) {
  await page.evaluate((k) => window.deck.show(k), n)
  await page.waitForTimeout(80)
  const report = await page.evaluate(() => {
    const slide = document.querySelector(".slide.is-active")
    const box = slide.getBoundingClientRect()
    const scale = box.width / 1280
    const edge = { left: 64, right: 1216, top: 56, bottom: 648 } // the slide's padding box
    const skip = ".foot, .foot *, .glow, .title-map, .pin-label, .notes, .notes *"
    const spills = []
    for (const el of slide.querySelectorAll("*")) {
      if (el.matches(skip) || el.closest(".title-map, .notes")) continue
      const r = el.getBoundingClientRect()
      if (!r.width || !r.height) continue
      const x = (v) => (v - box.left) / scale
      const y = (v) => (v - box.top) / scale
      const out = []
      if (x(r.left) < edge.left - 1) out.push(`left ${Math.round(x(r.left))}`)
      if (x(r.right) > edge.right + 1) out.push(`right ${Math.round(x(r.right))}`)
      if (y(r.top) < edge.top - 1) out.push(`top ${Math.round(y(r.top))}`)
      if (y(r.bottom) > edge.bottom + 1) out.push(`bottom ${Math.round(y(r.bottom))}`)
      // Text cut off inside its own box
      if (el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflowX !== "visible") out.push("clipped x")
      if (el.scrollHeight > el.clientHeight + 1 && getComputedStyle(el).overflowY !== "visible") out.push("clipped y")
      if (out.length) spills.push(`${el.tagName.toLowerCase()}${el.className && typeof el.className === "string" ? "." + el.className.split(" ")[0] : ""} "${(el.textContent || "").trim().slice(0, 40)}": ${out.join(", ")}`)
    }
    const imgs = [...slide.querySelectorAll("img")].filter((i) => !i.complete || !i.naturalWidth).map((i) => i.alt)
    return {
      title: slide.dataset.title,
      n: slide.querySelector(".foot .n")?.textContent,
      notes: (slide.querySelector(".notes")?.textContent || "").trim().split(/\s+/).filter(Boolean).length,
      talk: (slide.dataset.mode || "talk").includes("talk"),
      spills: spills.slice(0, 8),
      imgs,
      emdash: /—/.test(slide.textContent),
    }
  })
  const name = `${String(n + 1).padStart(2, "0")}`
  await page.locator(".slide.is-active").screenshot({ path: `${shotDir}${name}.png` })
  const flags = []
  if (report.spills.length) flags.push(...report.spills)
  if (report.imgs.length) flags.push(`images not loaded: ${report.imgs.join(", ")}`)
  if (!report.notes) flags.push("no speaker notes")
  // The live demo needs the time, so each talk slide gets 20 to 30 seconds of notes.
  if (report.talk && report.notes > 80) flags.push(`notes run ${report.notes} words; keep talk slides to about 75 (30 seconds)`)
  if (!report.n) flags.push("no slide number")
  if (report.emdash) flags.push("contains an em dash")
  console.log(`${flags.length ? "!" : "✓"} ${name} ${report.title} (${report.notes} words of notes)`)
  flags.forEach((f) => console.log(`    ${f}`))
  if (flags.length) problems.push(name)
}

// Presenter view: opens a second window with the current slide, the next one, and notes.
await page.evaluate(() => { window.deck.setMode("talk"); window.deck.show(2) })
const [pv] = await Promise.all([page.waitForEvent("popup"), page.keyboard.press("p")])
await pv.setViewportSize({ width: 1200, height: 800 })
await pv.waitForSelector("#pv-now .slide")
await page.keyboard.press("ArrowRight")
await pv.waitForTimeout(150)
const pvState = await pv.evaluate(() => ({
  count: document.getElementById("pv-count").textContent,
  now: document.querySelector("#pv-now .slide")?.dataset.title,
  next: document.querySelector("#pv-upnext .slide")?.dataset.title,
  notes: document.getElementById("pv-notes").textContent.trim().length,
}))
await pv.screenshot({ path: `${shotDir}presenter.png` })
console.log(`${pvState.now && pvState.next && pvState.notes ? "✓" : "!"} presenter view: ${pvState.count}, now "${pvState.now}", next "${pvState.next}"`)
if (!(pvState.now && pvState.next && pvState.notes)) problems.push("presenter")
await pv.close()

// PDFs of the whole deck, appendix included: slides only, then slides with notes underneath.
await page.evaluate(() => window.deck.setMode("full"))
const total = await page.evaluate(() => window.deck.count)
for (const [file, withNotes] of [["nomad-os-a5-deck.pdf", false], ["nomad-os-a5-deck-notes.pdf", true]]) {
  await page.evaluate((w) => window.deck.buildPrint(w), withNotes)
  await page.pdf({ path: `${distDir}${file}`, preferCSSPageSize: true, printBackground: true })
  await page.evaluate(() => window.deck.cleanupPrint())
  const pages = (readFileSync(`${distDir}${file}`, "latin1").match(/\/Type\s*\/Page[^s]/g) || []).length
  console.log(`${pages === total ? "✓" : "!"} deck/dist/${file}: ${pages} pages`)
  if (pages !== total) problems.push(file)
}

if (errors.length) { console.log("Console errors:", [...new Set(errors)]); problems.push("console") }
await browser.close()
console.log(problems.length ? `\n${problems.length} to look at: ${problems.join(", ")}` : "\nAll clear.")
process.exitCode = problems.length ? 1 : 0
