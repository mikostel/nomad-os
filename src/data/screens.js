// Maps each prototype screen to its deck label and annotations.
export const SCREEN_META = {
  home: { label: "S1", title: "Profile ready", group: "trip" },
  layers: { label: "S2", title: "Four layers", group: "trip" },
  network: { label: "S3", title: "Network", group: "trip" },
  money: { label: "S4", title: "Money", group: "trip" },
  numbers: { label: "S5", title: "Numbers", group: "trip" },
  safety: { label: "S6", title: "Safety net", group: "trip" },
  addTrip: { label: "Trigger", title: "Add a trip", group: "app", note: "The trigger in the core task flow. Picking a destination offers that country’s profile." },
  vault: { label: "Tab", title: "Vault", group: "app", note: "Shows which accounts still text codes, so a stolen phone takes fewer codes with it. Holds the 12 recovery words." },
  safetyTab: { label: "Tab", title: "Keyholder and SOS", group: "app", note: "Keyholder management and emergency numbers for where you are and where you’re going." },
  agent: { label: "S8a", title: "Agent", group: "app" },
  agentSetup: { label: "S8b", title: "Check my setup", group: "app", note: "Deck slide 2. Turns your destination and your own setup into a short, explained checklist. Runs only when you tap. You approve, skip, or undo every change." },
  booking: { label: "Detail", title: "Booking", group: "app", note: "Every booking works offline, says what it shared and how it’s protected, and can be cancelled." },
  words: { label: "S7a", title: "Break Glass", group: "loss" },
  waiting: { label: "Decision", title: "Keyholder approves?", group: "loss", note: "The decision point in the secondary flow, from the Keyholder’s side. Approve opens triage. Decline leaves the accounts locked." },
  triage: { label: "S7b", title: "Triage in order", group: "loss" },
}

export const ANNOTATIONS = {
  home: [{ k: 1, t: "Offered when you add a trip." }, { k: 2, t: "Ten minutes per country." }],
  layers: [{ k: 3, t: "Every layer: ready, or one to fix." }, { k: 4, t: "Local essentials install with it." }],
  network: [{ k: 5, t: "On for café Wi-Fi, exits where you are.", ev: ["E2", "E20"] }, { k: 6, t: "Banks that freeze VPN logins go direct.", ev: ["E13", "E26"] }],
  money: [{ k: 7, t: "Card works only on trip dates and places.", ev: ["E22"] }, { k: 8, t: "A backup way to pay, and a freeze plan.", ev: ["E12", "E21"] }],
  numbers: [{ k: 9, t: "Home line for codes, local line for data.", ev: ["E14", "E18"] }, { k: 10, t: "A fallback if roaming fails.", ev: ["E23"] }],
  safety: [{ k: 11, t: "The sealed kit back home, made digital.", ev: ["E15"] }, { k: 12, t: "Can approve, never see inside." }, { k: 13, t: "No Keyholder? A 24-hour wait." }],
  words: [{ k: 14, t: "Any browser, anywhere.", ev: ["E10", "E11"] }, { k: 15, t: "Keyholder replaces the familiar-place check." }, { k: 16, t: "Shared-computer mode for coworking." }],
  agent: [
    { k: 20, t: "Every booking ends in a confirm card. Nothing books on its own." },
    { k: 21, t: "Says exactly what gets shared, and with whom." },
    { k: 22, t: "Big purchases need Face ID, not just a tap." },
    { k: 23, t: "Won’t pay by transfer or off the booking site. Says why." },
  ],
  triage: [{ k: 17, t: "Money first.", ev: ["E6", "E22"] }, { k: 18, t: "Numbers that work from abroad." }, { k: 19, t: "Escalation paths from other nomads.", ev: ["E12"] }],
}

export const JUMP_GROUPS = [
  { label: "Before a trip", items: ["home", "layers", "network", "money", "numbers", "safety"] },
  { label: "Rest of the app", items: ["addTrip", "agent", "agentSetup", "vault", "safetyTab"] },
  { label: "After a loss", items: ["words", "waiting", "triage"] },
]
