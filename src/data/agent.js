// Mock content for the Agent tab (deck slide 2). The agent is an interpreter:
// it turns the destination plus your own setup into a short, explained checklist.
// Nothing here calls a model. Every item is built from the mock data below.
import { ACCOUNTS, COUNTRIES, USER } from "@/data/mock"

export const SHARE_OPTIONS = [
  { key: "trip", label: "Destination and dates", sub: "Needed for any check", locked: true },
  { key: "money", label: "Banks and payment apps", sub: "Checking, savings, and Wise" },
  { key: "lines", label: "Phone lines", sub: "Home line and eSIM plan" },
  { key: "signins", label: "How accounts send codes", sub: "Texts, authenticator, passkeys" },
]

export const WONT_DO = ["Change bank settings", "Hide or fake your location", "Change anything you haven’t approved"]

// Each step only runs if you shared what it needs.
export const CHECKING_STEPS = [
  { text: "Reading the {city} profile", needs: ["trip"] },
  { text: "Matching your banks and apps", needs: ["money"] },
  { text: "Checking your lines", needs: ["lines"] },
  { text: "Checking how accounts send codes", needs: ["signins"] },
]

const list = (xs) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}`)

/**
 * kind "change": the agent can make it, after you approve.
 * kind "yours":  only you can do it. The agent explains how.
 * kind "set":    already right. Shown so you know why.
 */
export function buildChecklist({ countryId, profile: p, share, keyholder, keyholderSent, movedOffSms, trip }) {
  const c = COUNTRIES[countryId]
  const dates = trip?.dates || "your trip dates"
  const items = []

  if (share.money) {
    items.push({
      key: "backup", layer: "money", kind: p.backup ? "set" : "change",
      title: p.backup ? "Savings is your backup way to pay" : "Add savings as a backup way to pay",
      why: `Your debit card only works in ${c.name} on your trip dates. If it gets frozen, savings •• 8820 keeps you paying.`,
      steps: ["Open Money in this profile", "Tap Add next to Backup account"],
    })
    if (c.flaggedApps.length) {
      items.push({
        key: "direct", layer: "network", kind: "set",
        title: `${list(c.flaggedApps)} ${c.flaggedApps.length > 1 ? "skip" : "skips"} the VPN`,
        why: `${list(c.flaggedApps)} ${c.flaggedApps.length > 1 ? "flag" : "flags"} VPN logins in ${c.name}. Going direct avoids a locked account. Everything else stays on the VPN.`,
        steps: ["Open Network in this profile", "Under Apps that flag VPNs here, set each app to Direct"],
      })
    }
    items.push({
      key: "travel", layer: "money", kind: "yours",
      title: "Tell Checking you’re traveling",
      why: `NOMAD.OS can’t change bank settings. A travel notice stops Checking from declining card payments in ${c.name}.`,
      steps: ["In the Checking app, open Profile", `Choose Travel notice and add ${dates}`],
    })
  }

  if (share.lines) {
    if (c.esim.needsSetup && !p.linesSet) {
      items.push({
        key: "register", layer: "numbers", kind: "yours",
        title: "Register your eSIM when you land",
        why: c.esim.setupNote,
        steps: ["Bring your passport to the airport kiosk", "Ask to register a travel eSIM", "Open Numbers and tap I registered"],
      })
    }
    const smsOnly = ACCOUNTS.filter((a) => a.smsOnly).map((a) => a.name)
    items.push({
      key: "line1", layer: "numbers", kind: "set",
      title: "Your home line stays on for codes",
      why: `${share.signins && smsOnly.length ? `${list(smsOnly)} only ${smsOnly.length > 1 ? "send" : "sends"} codes by text to ${USER.homeLine}. ` : ""}Data is off on that line, so roaming costs nothing. Your ${c.name} eSIM handles data and calls.`,
      steps: ["Open Settings, then Cellular", "Set your home line to Texts on and Data off"],
    })
  }

  if (share.signins) {
    for (const a of ACCOUNTS.filter((x) => x.sms && !x.smsOnly)) {
      items.push({
        key: `sms-${a.id}`, layer: "vault", kind: movedOffSms.includes(a.id) ? "set" : "change", accountId: a.id,
        title: movedOffSms.includes(a.id) ? `${a.name} uses your authenticator` : `Move ${a.name} codes to your authenticator`,
        why: `${a.name} still texts codes to your home line. A stolen phone would get them too.`,
        steps: [`In ${a.name}, open Settings, then Security`, "Choose Two-factor, then Authentication app"],
      })
    }
  }

  items.push({
    key: "keyholder", layer: "safety", kind: keyholderSent ? "set" : "change",
    title: keyholderSent ? `${keyholder.name} is your Keyholder` : `Send ${keyholder.name} ${keyholder.pronoun} Keyholder card`,
    why: `Without a Keyholder, recovery after a lost phone waits 24 hours. ${keyholder.name} can approve a recovery but never sees inside your vault.`,
    steps: ["Open Safety net in this profile", "Pick someone you trust, then send the card"],
    noUndo: true,
  })

  return items
}

export const LAYER_LABEL = { money: "Money", network: "Network", numbers: "Numbers", vault: "Vault", safety: "Safety net" }
