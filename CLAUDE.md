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
- “Check my setup” (`src/screens/trip/Agent.jsx`, content in `src/data/agent.js`) is part of the agent and follows deck slide 2. It runs only when tapped, explains every item, and changes nothing without approval. It never changes bank settings or hides location.
- Restaurant, hotel, delivery, and train names, prices, and reviews are invented. Don’t use real businesses.
- Dates: “today” in the before-a-trip flow is Tue Oct 13, 2026; the trip is Oct 16 to Nov 2; the lost-phone flow is Mon Oct 26.
- Tabs are Trips, Agent, Security. Agent callouts are 20 to 23 (S8a). State saves to localStorage; `#operator` is the user-testing panel.
- When you change the shape of mock data or state (a new field on a trip, booking, or message), bump `SAVE_VERSION` in `src/lib/store.jsx`. Otherwise an older save can load without the new field and crash the app.
- Copy is sentence case, plain verbs, and never uses em dashes. Don’t give Dani pronouns; write around them.
- After changing a screen, run `npm run shots` (or `npm run shots -- <name>`), look at the 1440x900 screenshots in `screenshots/`, and fix spacing or overflow before reporting back. Run `npm run shots -- --dark` when colors change.
