// Deck controls: navigation, Talk and Full modes, speaker notes, presenter view, and print.
// Keys: arrows, space, Page Up/Down, Home/End. N notes, P presenter view, F full screen, M mode.
import { ICONS } from "./icons.js"
import titleMap from "./title-map.svg?raw"

const deck = document.getElementById("deck")
const all = [...deck.querySelectorAll(".slide")]
const $ = (id) => document.getElementById(id)
const controls = $("controls")
const count = $("count")
const modeBtn = $("mode")
const notesBtn = $("notes-btn")
const notesPanel = $("notes-panel")
const live = $("live")
const printRoot = $("print-root")
const pageStyle = document.createElement("style")
document.head.append(pageStyle)

let mode = "talk" // talk: the 10-slide presentation. full: adds the appendix.
let list = []
let i = 0
let notesOn = false

/* ---------- one-time setup ---------- */
document.querySelectorAll("[data-title-map]").forEach((el) => el.insertAdjacentHTML("afterbegin", titleMap))
document.querySelectorAll("i[data-i]").forEach((el) => {
  el.outerHTML = `<svg class="ic ${el.className}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[el.dataset.i] ?? ""}</svg>`
})
all.forEach((s) => {
  s.setAttribute("aria-roledescription", "slide")
  if (!s.querySelector(".foot")) s.insertAdjacentHTML("beforeend", '<div class="foot"><span>NOMAD.OS &middot; Assignment 5</span><span class="n"></span></div>')
})
const titleOf = (s) => s?.dataset.title || ""
const notesOf = (s) => s?.querySelector(".notes")?.innerHTML.trim() || "<p>No notes for this slide.</p>"

/* ---------- navigation ---------- */
function applyMode() {
  list = all.filter((s) => (s.dataset.mode || "talk full").split(" ").includes(mode))
  list.forEach((s, k) => { s.querySelector(".foot .n").textContent = String(k + 1).padStart(2, "0") })
  all.forEach((s) => s.setAttribute("aria-label", list.includes(s) ? `Slide ${list.indexOf(s) + 1} of ${list.length}: ${titleOf(s)}` : titleOf(s)))
  modeBtn.textContent = mode === "talk" ? `Talk: ${list.length} slides` : "Full: with appendix"
  modeBtn.setAttribute("aria-pressed", String(mode === "full"))
}

function show(n) {
  i = Math.max(0, Math.min(list.length - 1, n))
  all.forEach((s) => s.classList.toggle("is-active", s === list[i]))
  count.textContent = `${i + 1} / ${list.length}`
  notesPanel.querySelector(".notes-body").innerHTML = notesOf(list[i])
  live.textContent = `Slide ${i + 1} of ${list.length}: ${titleOf(list[i])}`
  try { history.replaceState(null, "", `#${mode}/${i + 1}`) } catch { /* file:// in some browsers */ }
  renderPresenter()
}

function setMode(m) {
  const current = list[i]
  mode = m
  applyMode()
  show(Math.max(0, list.indexOf(current)))
}

function readHash() {
  const m = location.hash.match(/^#(?:(talk|full)\/)?(\d+)$/)
  if (!m) return 0
  if (m[1]) mode = m[1]
  return Number(m[2]) - 1
}

function fit() {
  deck.style.transform = `translate(-50%, -50%) scale(${Math.min(innerWidth / 1280, innerHeight / 720)})`
}

function onKey(e) {
  if (e.metaKey || e.ctrlKey || e.altKey) return // leave Cmd+P and other shortcuts to the browser
  const t = e.target
  if (/^(input|textarea|select)$/i.test(t.tagName)) return
  const onButton = t.closest?.("button, a")
  const k = e.key
  if (["ArrowRight", "ArrowDown", "PageDown"].includes(k) || ((k === " " || k === "Enter") && !onButton)) { e.preventDefault(); show(i + 1) }
  else if (["ArrowLeft", "ArrowUp", "PageUp"].includes(k)) { e.preventDefault(); show(i - 1) }
  else if (k === "Home") show(0)
  else if (k === "End") show(list.length - 1)
  else if (k === "n" || k === "N") toggleNotes()
  else if (k === "p" || k === "P") openPresenter()
  else if (k === "f" || k === "F") toggleFullscreen()
  else if (k === "m" || k === "M") setMode(mode === "talk" ? "full" : "talk")
}

function toggleNotes() {
  notesOn = !notesOn
  notesPanel.hidden = !notesOn
  notesBtn.setAttribute("aria-pressed", String(notesOn))
}

function toggleFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen()
  else document.documentElement.requestFullscreen?.()
}

// The control bar fades out while you present and comes back when the mouse moves.
let idle
function wake() {
  controls.classList.remove("is-idle")
  clearTimeout(idle)
  idle = setTimeout(() => { if (!controls.matches(":hover, :focus-within")) controls.classList.add("is-idle") }, 2600)
}

/* ---------- print: every slide in the current mode, optionally with its notes ---------- */
function buildPrint(withNotes) {
  printRoot.innerHTML = ""
  document.documentElement.classList.toggle("with-notes", withNotes)
  pageStyle.textContent = withNotes ? "@page { size: 1280px 1000px; margin: 0; }" : ""
  list.forEach((s, k) => {
    const sheet = document.createElement("div")
    sheet.className = "sheet"
    const copy = s.cloneNode(true)
    copy.classList.add("is-active")
    copy.querySelector(".notes")?.remove()
    sheet.append(copy)
    if (withNotes) {
      const notes = document.createElement("div")
      notes.className = "sheet-notes"
      notes.innerHTML = `<p class="label">Speaker notes &middot; ${String(k + 1).padStart(2, "0")} ${titleOf(s)}</p>${notesOf(s)}`
      sheet.append(notes)
    }
    printRoot.append(sheet)
  })
}
function cleanupPrint() {
  printRoot.innerHTML = ""
  document.documentElement.classList.remove("with-notes")
  pageStyle.textContent = ""
}
// Cmd+P prints the slides too, without notes.
addEventListener("beforeprint", () => { if (!printRoot.childElementCount) buildPrint(false) })
addEventListener("afterprint", cleanupPrint)

/* ---------- presenter view: notes, next slide, and a timer in a second window ---------- */
let pw = null
let started = 0
let ticker

const PRESENTER_CSS = `
  body.presenter { margin: 0; height: 100vh; display: grid; grid-template-rows: auto auto minmax(0, 1fr); background: #f5f5f5; overflow: hidden; font-family: var(--font-sans); color: #171717; }
  .pv-bar { display: flex; align-items: center; gap: 10px; padding: 10px 16px; background: #fff; border-bottom: 1px solid #e5e5e5; }
  .pv-bar button { padding: 7px 12px; border: 1px solid #e5e5e5; border-radius: 6px; background: #fff; font: 500 13px var(--font-sans); cursor: pointer; }
  .pv-bar button:hover { background: #fafafa; }
  .pv-time { font: 600 22px var(--font-mono); letter-spacing: 0.02em; }
  .pv-count { font: 500 14px var(--font-mono); color: #737373; }
  .pv-title { margin-left: 6px; font-weight: 600; }
  .pv-main { display: grid; grid-template-columns: 1.55fr 1fr; align-items: start; gap: 16px; padding: 16px; }
  .pv-col { display: flex; flex-direction: column; gap: 8px; }
  .pv-col .label { color: #737373; }
  .pv-frame { position: relative; flex: none; width: 100%; aspect-ratio: 16 / 9; overflow: hidden; border-radius: 6px; background: #fff; box-shadow: 0 1px 2px rgb(0 0 0 / 0.06), 0 10px 24px -14px rgb(0 0 0 / 0.3); }
  .pv-canvas { position: absolute; left: 0; top: 0; width: 1280px; height: 720px; transform-origin: 0 0; }
  .pv-canvas .slide { display: flex; border-radius: 0; box-shadow: none; animation: none; }
  .pv-end { display: grid; place-items: center; height: 100%; margin: 0; color: #737373; font: 500 14px var(--font-mono); }
  .pv-notes { padding: 0 16px 16px; min-height: 0; overflow: auto; }
  .pv-notes .label { margin-bottom: 8px; color: #2563eb; }
  .pv-notes-body { max-width: 980px; font-size: 21px; line-height: 1.5; }
  .pv-notes-body p + p { margin-top: 10px; }
`

function openPresenter() {
  if (pw && !pw.closed) { pw.focus(); return }
  pw = window.open("", "nomad-os-presenter", "width=1200,height=800")
  if (!pw) { if (!notesOn) toggleNotes(); return } // popup blocked: fall back to the notes panel
  const d = pw.document
  d.open()
  d.write('<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Presenter view: NOMAD.OS</title></head><body class="presenter"></body></html>')
  d.close()
  document.querySelectorAll('style, link[rel="stylesheet"]').forEach((el) => d.head.append(d.importNode(el, true)))
  const css = d.createElement("style")
  css.textContent = PRESENTER_CSS
  d.head.append(css)
  d.body.innerHTML = `
    <div class="pv-bar">
      <span class="pv-time" id="pv-time">00:00</span>
      <button id="pv-reset" type="button">Reset timer</button>
      <span class="pv-count" id="pv-count"></span><span class="pv-title" id="pv-title"></span>
      <span style="flex:1"></span>
      <button id="pv-prev" type="button">Previous</button><button id="pv-next" type="button">Next</button>
    </div>
    <div class="pv-main">
      <div class="pv-col"><p class="label">Now</p><div class="pv-frame" id="pv-now"></div></div>
      <div class="pv-col"><p class="label">Next</p><div class="pv-frame" id="pv-upnext"></div></div>
    </div>
    <div class="pv-notes"><p class="label">Speaker notes</p><div class="pv-notes-body" id="pv-notes"></div></div>`
  d.getElementById("pv-prev").onclick = () => show(i - 1)
  d.getElementById("pv-next").onclick = () => show(i + 1)
  d.getElementById("pv-reset").onclick = () => { started = Date.now(); tick() }
  d.addEventListener("keydown", onKey)
  pw.addEventListener("resize", renderPresenter)
  started = Date.now()
  clearInterval(ticker)
  ticker = setInterval(tick, 1000)
  tick()
  renderPresenter()
}

function tick() {
  if (!pw || pw.closed) { clearInterval(ticker); return }
  const s = Math.floor((Date.now() - started) / 1000)
  pw.document.getElementById("pv-time").textContent = `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`
}

function mountPreview(frame, slide) {
  const d = frame.ownerDocument
  frame.innerHTML = ""
  if (!slide) { frame.innerHTML = '<p class="pv-end">End of deck</p>'; return }
  const canvas = d.createElement("div")
  canvas.className = "pv-canvas"
  canvas.style.transform = `scale(${frame.clientWidth / 1280})`
  const copy = d.importNode(slide, true)
  copy.classList.add("is-active")
  copy.querySelector(".notes")?.remove()
  canvas.append(copy)
  frame.append(canvas)
}

function renderPresenter() {
  if (!pw || pw.closed) return
  const d = pw.document
  d.getElementById("pv-count").textContent = `${i + 1} / ${list.length}`
  d.getElementById("pv-title").textContent = titleOf(list[i])
  mountPreview(d.getElementById("pv-now"), list[i])
  mountPreview(d.getElementById("pv-upnext"), list[i + 1])
  d.getElementById("pv-notes").innerHTML = notesOf(list[i])
}

/* ---------- wire up ---------- */
$("prev").onclick = () => show(i - 1)
$("next").onclick = () => show(i + 1)
modeBtn.onclick = () => setMode(mode === "talk" ? "full" : "talk")
notesBtn.onclick = toggleNotes
$("presenter").onclick = openPresenter
$("print").onclick = () => { buildPrint(false); print() }
$("print-notes").onclick = () => { buildPrint(true); print() }
addEventListener("keydown", onKey)
addEventListener("resize", fit)
addEventListener("mousemove", wake)
addEventListener("hashchange", () => { const n = readHash(); applyMode(); show(n) })
let x0 = null
addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX }, { passive: true })
addEventListener("touchend", (e) => {
  if (x0 === null) return
  const dx = e.changedTouches[0].clientX - x0
  if (Math.abs(dx) > 50) show(i + (dx < 0 ? 1 : -1))
  x0 = null
})

const start = readHash()
applyMode()
fit()
show(start)
wake()

// For the check script: jump around and build print layouts without a dialog.
window.deck = { show, setMode, buildPrint, cleanupPrint, get count() { return list.length }, get index() { return i } }
