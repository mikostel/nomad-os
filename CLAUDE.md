# NOMAD.OS prototype

Clickable prototype for a product design class. Not production code.

## Stack
- React 18, Vite, Tailwind CSS 4 (`@tailwindcss/vite`), shadcn/ui on Base UI (`@base-ui/react`, style `base-vega`, JavaScript), lucide-react.
- Theme tokens live in `src/index.css` using shadcn names (`--background`, `--primary`, and so on) plus `--success`, `--warning`, `--info-soft`, `--navy`.

## Rules
- This is a Base UI project. Use the `render` prop, never `asChild`, and style state with `data-checked`, `data-active`, `data-disabled`, not `data-[state=…]`. Never install `@radix-ui/*`.
- All data is mock data in `src/data/`. No backend, no API calls, no auth.
- State lives in `src/lib/store.jsx`. Navigate with `go(screen, params)`. Layer screens read `params.countryId`.
- Use shadcn components from `@/components/ui` before writing new UI. Add new ones with `npx shadcn@latest add <name>`.
- After any `npx shadcn add`, check the new files before moving on:
  - Change `import { cn } from "cn"` back to `@/lib/utils`, and don’t keep the `cn` package it adds to package.json.
  - Keep `React.forwardRef` on Input. React 18 doesn’t pass `ref` as a prop, and the recovery-word fields need it.
  - Re-add the NOMAD.OS variants: `xl` and `light` buttons; `success`, `warning`, `info`, and `glass` badges.
- Keep the deck’s annotation numbers (`<Co n={…} />`) in sync with `src/data/screens.js`. Screens the deck doesn’t number (like Agent) get a `note` instead of callouts.
- Every screen has a direct link: `#<screen key>` from `SCREEN_META`, like `#agent` or `#triage`.
- The Agent tab is a chat travel agent (`src/screens/trip/AgentChat.jsx`, content in `src/data/travel.js`). It books trains and hotels, finds restaurants, and orders delivery with scripted, mock replies. Anything that spends money or shares personal details must end in a confirm card with Cancel. Nothing books on its own.
- Agent chats are threads: `st.threads` (each `{ id, title, when, updated, typing, messages }`, plus optional `unread` and `held`) and `st.activeThread`. Pass a thread id to `addMessages` and `agentReply` so a late reply lands in the thread it belongs to. Bookings carry the `threadId` they came from.
- Sheets and drawers on the phone go through `PhoneModal` (`src/components/app/device.jsx`). It covers the whole screen under the status bar and home indicator, and makes the screen behind it inert. Don't position overlays with `absolute inset-0` inside a screen.
- “Check my setup” (`src/screens/trip/Agent.jsx`, content in `src/data/agent.js`) is part of the agent and follows deck slide 2. It runs only when tapped, explains every item, and changes nothing without approval. It never changes bank settings or hides location.
- Restaurant, hotel, delivery, and train names, prices, and reviews are invented. Don’t use real businesses.
- Dates: “today” in the before-a-trip flow is Tue Oct 13, 2026; the trip is Oct 16 to Nov 2; the lost-phone flow is Mon Oct 26.
- Tabs are Trips, Agent, Security. Agent callouts are 20 to 23 (S8a). State saves to localStorage; `#operator` is the user-testing panel.
- When you add a field the code relies on (a trip's flight, a booking's date), bump `SAVE_VERSION` in `src/lib/store.jsx`. Otherwise an older save can load without it and crash the app. Optional fields that are fine as undefined don't need a bump.
- Copy is sentence case, plain verbs, and never uses em dashes. Don’t give Dani pronouns; write around them.
- After changing a screen, run `npm run shots` (or `npm run shots -- <name>`), look at the 1440x900 screenshots in `screenshots/`, and fix spacing or overflow before reporting back. Run `npm run shots -- --dark` when colors change.

## Assignment 5 deck (`deck/`)
- Plain HTML and Tailwind 4 (`deck/index.html`, `deck.css`, `deck.js`), separate from the React app. `npm run deck:build` makes one self-contained file in `deck/dist/`.
- Each slide is a `<section class="slide">` with a `data-title` and an `<aside class="notes">` for speaker notes. Appendix slides take `data-mode="full"` and only show in Full mode. The talk is 9 slides; the assignment allows 8 to 10.
- Appendices B to E (framing, the E1 to E27 evidence table, traceability, sources) are carried over word for word from the Assignment 4 deck. Restyle them freely, but don't rewrite their content.
- Icons are `<i data-i="name">`, filled in from `deck/icons.js` (Lucide paths). Add the path there before using a new name.
- Talk slides are visual first: one diagram per slide in the slide 7 style (icon dots, lanes, connecting lines), a few words per item, and the detail in the speaker notes. Slide 4's opportunity statement stays word for word.
- Speaker notes are the exact words the presenter says, read as written: no stage directions, labels, or click lists. On the demo slide, first-person narration ("First, I'll book a hotel") carries the click path. Talk slides run 20 to 30 seconds (about 55 to 75 words), because the live demo needs the time; `npm run deck:check` flags anything over 80 words.
- The prototype is demoed live, so the deck has no screenshot slides. The live demo slide uses `deck/img/ask.jpg`, captured from the prototype with `npm run deck:shots`; recapture it after changing the Agent tab.
- After editing the deck, run `npm run deck:build && npm run deck:check`, look at `screenshots/deck/`, and fix overflow before reporting back. The check also writes the PDFs to `deck/dist/`.
- Blurred shadows (text-shadow, or box-shadow with blur) print as solid boxes in Preview. Turn them off under `@media print` in `deck.css`.
