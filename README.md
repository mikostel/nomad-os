# NOMAD.OS prototype

A clickable prototype of NOMAD.OS, built with React, Tailwind CSS 4, and shadcn/ui on Base UI primitives. Every screen runs on mock data in `src/data/mock.js`.

## Run it

```bash
npm install
npm run dev
```

`npm run build:single` produces `dist-single/index.html`, one self-contained file you can share or upload.

## What you can click through

**Before a trip (Dani’s phone)**
- Trips: download the next trip’s profile, add a trip, open later trips and installed profiles. The trip card’s background is a dotted map of the destination, precomputed with dotted-map (`npm run map` regenerates it).
- Add a trip: pick a destination and dates. Each country has its own mock profile.
- Four layers: tap any layer, or “Fix N items” to jump to what isn’t ready.
- Network, Money, Numbers, and Safety net are all driven by the selected country.
- Tabs: Trips (next trip, a Coming up itinerary, and your profiles), Agent, and Security (Vault, plus Keyholder and SOS).
- Bookings open a detail screen with an offline ticket, how it’s protected, and Cancel.
- Agent: a travel agent in chat. Tap a suggestion or type a request to book a train to Porto, find dinner nearby with reviews, order delivery, or book a Mexico City hotel. Each one ends with a confirm card showing the total (local price, about in dollars), the card it pays with, and what gets shared, with Change and Cancel. Over $100 needs Face ID. The agent refuses a restaurant that wants a bank transfer and leaves out a scam hotel listing, and says why. Confirmed bookings appear in Coming up on Trips, and the hotel confirmation shows in triage after a lost phone.
- Agent chats: the pen icon starts a new chat, and the clock icon opens History. Each chat is named after its first request. Reopen any chat, or delete it (its bookings stay in Trips). Two past chats from the Barcelona and Tokyo trips are there from the start.
- Check my setup (deck slide 2): ask the agent, or tap it on Four layers. Choose what to share, then work through a short checklist one item at a time. Each item says why, shows how to do it yourself next time, and waits for you to approve, skip, or undo. Approving updates the matching layer.

**After a loss (borrowed laptop plus the Keyholder’s phone)**
- Break Glass: enter or demo-fill the 12 words, then request access. Wrong words are marked in place.
- The Keyholder’s phone gets a notification. Approve opens triage. Decline shows the declined path.
- Triage: work through the five steps in order while the access timer counts down.
- Use Both, Laptop, or Phone at the top left to show one device at full size when presenting.

The side panel shows each screen’s deck label and annotations, and lets you jump to any screen.

## Presenting and user testing

- Your place survives a reload. Reset starts over.
- Hide notes in the header hides the side panel so the device gets the whole stage.
- Open operator panel (bottom of the side panel) opens a second window. Turn on “You answer for the agent” and reply to a participant live, with free text or the scripted cards. It uses BroadcastChannel, so both windows must be in the same browser, served from `npm run dev` or a host (not a `file://` copy).

## Direct links

Every screen has its own link, so you can put it in a deck or send it to a reviewer. Add `#` and the screen key to the address, for example `localhost:5173/#agent` or `#triage`. Keys: `home`, `layers`, `network`, `money`, `numbers`, `safety`, `addTrip`, `agent`, `agentSetup`, `vault`, `safetyTab`, `booking`, `words`, `waiting`, `triage`. `#operator` opens the operator panel.

## Screenshots

```bash
npm run shots
```

Captures every screen and state at 1440x900 with Playwright, checks each one for text that overflows or gets cut off, and writes `screenshots/REPORT.md`. Add a name to run only matching states (`npm run shots -- agent`), `--dark` for the dark theme (saved to `screenshots/dark/`), or `--size=1280x720` for a projector. The first time, run `npx playwright install chromium`.

## Project layout

```
src/
  components/ui/      shadcn/ui components (Base UI primitives)
  components/app/     device frames and shared phone pieces
  data/mock.js        countries, contacts, accounts, triage steps
  data/agent.js       Check my setup: share options and the checklist it builds
  data/travel.js      Agent chat: trains, restaurants, delivery, hotels (all invented)
  data/screens.js     deck labels and annotations per screen
  lib/store.jsx       app state, navigation, and selectors
  screens/trip/       phone screens
  screens/loss/       Break Glass browser and Keyholder phone
scripts/screenshots.mjs   Playwright screenshots and overflow checks
```

## shadcn/ui and Base UI

`components.json` uses the `base-vega` style, so the shadcn CLI installs Base UI versions of components (`@base-ui/react`) instead of Radix. The components in `src/components/ui` follow that pattern, with a few NOMAD.OS variants added (`xl` and `light` buttons; `success`, `warning`, `info`, and `glass` badges). To pull the official versions, run `npx shadcn@latest add button --overwrite` and so on, then:
- Re-add those variants.
- Change `import { cn } from "cn"` back to `@/lib/utils`, and remove the `cn` package the CLI adds.
- Keep `React.forwardRef` on Input. This project is on React 18, which doesn’t pass `ref` as a prop.

A few Base UI differences worth knowing:
- Compose with the `render` prop, not `asChild`. Example: `<Button render={<a href="#" />} nativeButton={false}>`.
- State styling uses `data-checked`, `data-unchecked`, `data-active`, and `data-disabled` instead of `data-[state=…]`.
- `onCheckedChange` and `onValueChange` receive `(value, eventDetails)`.

## Content note

Country notes, eSIM plans, account names, escalation counts, and phone numbers are mock content for the prototype, not researched guidance. Restaurants, hotels, delivery places, trains, prices, and reviews in the Agent chat are invented. The agent doesn’t call a model or book anything real.
