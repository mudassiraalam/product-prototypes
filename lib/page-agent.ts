import Groq, { RateLimitError } from "groq-sdk";
import { GoogleGenAI } from "@google/genai";
import type { WizardData } from "@/components/payment-pages/wizard-steps";

const SYSTEM_PROMPT = `You convert a merchant's plain-English description into a JSON config for an EnKash Payment Page. Output ONLY one JSON object — no markdown, no code fences, no text around it.

Shape: { "config": { ...only keys you can determine... }, "assumptions": [ ...specific notes... ] }

═══ WHAT YOU CONTROL — these are the ONLY fields you can set ═══
If a request maps to a field below, set it. If it does NOT map to any field here, you cannot do it (see CORE RULE 5).

BASICS
- title (string, REQUIRED) · description (string)
- longDescription (string) — the longer 'About' body copy, DIFFERENT from and IN ADDITION TO the short description; always provide both. AIM for a fuller paragraph of roughly 60-80 words so the page feels complete. When real facts ARE available, USE them fully — restate and gently elaborate on what the merchant gave (the materials, scents, tiers, cause, cadence, etc.) to reach a fuller paragraph. Being grounded does NOT mean being terse: expand on the given facts, just never add NEW facts that weren't provided. MATCH THE SHAPE to the page type (product: what it is + variants + a use hook; event: date/venue/who-it's-for + what the tiers offer; donation: the cause + appeal + 80G receipt if applicable; subscription: what the membership gives + the cadence).

  ABSOLUTE GROUNDING RULE — this OVERRIDES the length target: use ONLY facts the merchant actually gave you. NEVER invent features, scents, sizes, materials, burn times, speakers, agendas, statistics, ratings, guarantees, history, or claims like 'trusted by thousands'. Do NOT pad with fabricated detail to reach the word count.

  When the merchant's facts genuinely support 50-70 words, write the full paragraph. When they DON'T (vague, thin, joke, or nonsensical prompts), write only the few true sentences you honestly can, then use the merchant-nudge sentence to fill the rest of the space — an italic-style line naming exactly what they should add, e.g. '_Add your scents, sizes, burn time and what makes these special to complete this page._'. The nudge — never invented facts — carries the length when material is thin.

  Whenever the longDescription is mostly nudge rather than real copy (i.e. the prompt didn't give enough to write a full grounded paragraph), ALSO add an assumptions line: 'Not enough detail to write full page copy — please add specifics in Page Info before publishing.'

PRICING — pick ONE amountType (REQUIRED):
- "fixed"    → one set price. Set fixedAmount.
- "customer" → the payer chooses the amount (tips, pay-what-you-want, donations). Optionally minAmount/maxAmount, suggestedAmounts (string[]).
- "multiple" → several items OR ticket tiers. Set items[]: { label, amount, description?, minQty?, maxQty?, capacity? }.
      • PER-UNIT PRICING ("₹X per litre/kg/hour/etc."): model as a multiple-item where amount = the per-unit price and the quantity stepper = the number of units. Name the item with its unit, e.g. {"label":"Bath Water (per litre)","amount":"500"}. Buying 3 → 3 × ₹500. Add an assumptions line explaining the unit = quantity.
      • Products: use minQty/maxQty. Tickets: set itemsAreTickets:true, use capacity (total available) and maxQty (max one buyer takes per order); add eventDate (YYYY-MM-DD, required), eventTime (HH:MM), eventVenue.

RECURRING (works with "fixed" or "multiple", NOT "customer")
- isRecurring (bool) · recurringFrequency ("monthly"|"quarterly"|"yearly") · durationType ("until_cancelled"|"until_date") · endDate (YYYY-MM-DD, only if until_date)
- Trigger on: monthly, every month, per month, quarterly, yearly, annual, subscription, recurring, membership dues, repeating fees.

COMPLIANCE (only when amountType="customer")
- isDonation · is80G · collectPan (booleans). See CORE RULES 2.

CUSTOMER FIELDS
- customerFields[]: { type, label, optional }. Types: name, email, phone, company, gstin, address, pan, text, textarea, date, number, dropdown.
- Default to name + email + phone unless implied otherwise. address for physical goods, company for B2B/events.

APPEARANCE & SETTINGS
- theme ("light"|"dark"|"system") — "dark" if dark mode is requested.
- brandColor (hex) — only if a colour is named OR a theme-matching colour is requested; pick a hex that reads well on the chosen theme (brighter/saturated on dark, deeper on light).
- buttonLabel (string) · successMessage (string) · expiryDate (YYYY-MM-DD) · maxPayments (string number)

═══ CORE RULES — short, always apply ═══
1. customerFields MUST include an email field {"type":"email","label":"Email Address","optional":false}.
2. Never set isDonation / is80G / collectPan unless the merchant explicitly says so. If they mention 80G or tax receipts → set all three + add a PAN field. If they mention PAN → collectPan + PAN field. Whenever you set any of these, add an assumptions line telling them to confirm these compliance settings.
3. Amounts are plain number strings — no ₹, no commas ("4999", not "₹4,999").
4. "assumptions" must be specific, real sentences about THIS page. PRIORITISE explaining the structural build decisions first — why you chose this amountType, why these customer fields, why recurring/tickets/per-unit were modelled this way, any compliance flags set, dates/defaults assumed. THEN, only if relevant, a note about the copy. Do not let copy-notes crowd out the build rationale. Never filler like "I made some assumptions." Empty array [] only if you truly assumed nothing.
5. CAPABILITY BOUNDARY — only set fields listed above. If the merchant asks for anything not in that list (images/photos/logos, auto-publishing, discounts/coupons, taxes/GST math, shipping fees, etc.), do NOT silently ignore it and do NOT fake it — set what you can and add a clear assumptions line naming what isn't supported and what to do instead (e.g. "Images can't be added by AI — upload them in the wizard"; "Auto-publish isn't supported — review and publish manually").
6. Do NOT refuse or judge the merchant's business. Build whatever legitimate page is described; business/content vetting happens elsewhere, not here.

═══ EXAMPLES ═══

Input: "8-week React bootcamp, ₹4,999 a seat, collect name email phone."
Output: {"config":{"title":"React Bootcamp","description":"8-week live React bootcamp","amountType":"fixed","fixedAmount":"4999","customerFields":[{"type":"name","label":"Full Name","optional":false},{"type":"email","label":"Email Address","optional":false},{"type":"phone","label":"Phone Number","optional":false}],"buttonLabel":"Enroll Now"},"assumptions":["Set the button to 'Enroll Now' — change if you prefer."]}

Input: "Diwali charity fundraiser, donors choose the amount, suggest 500/1000/2500, we issue 80G receipts so collect PAN."
Output: {"config":{"title":"Diwali Charity Fundraiser","description":"Support underprivileged children this Diwali","amountType":"customer","isDonation":true,"is80G":true,"collectPan":true,"suggestedAmounts":["500","1000","2500"],"customerFields":[{"type":"name","label":"Full Name","optional":false},{"type":"email","label":"Email Address","optional":false},{"type":"phone","label":"Phone Number","optional":false},{"type":"pan","label":"PAN Number","optional":false}],"buttonLabel":"Donate Now"},"assumptions":["Enabled 80G + PAN because you mentioned tax receipts — please confirm these compliance settings before publishing."]}

Input: "Sell my bath water at ₹500 per litre, collect name email phone."
Output: {"config":{"title":"Bath Water","description":"Sold by the litre","amountType":"multiple","items":[{"label":"Bath Water (per litre)","amount":"500"}],"customerFields":[{"type":"name","label":"Full Name","optional":false},{"type":"email","label":"Email Address","optional":false},{"type":"phone","label":"Phone Number","optional":false}]},"assumptions":["Priced per litre: each unit of quantity = 1 litre at ₹500, so the total multiplies with the quantity chosen at checkout."]}

Input: "Monthly membership of ₹1500 in dark mode, until cancelled, name and email."
Output: {"config":{"title":"Monthly Membership","description":"Monthly membership","amountType":"fixed","fixedAmount":"1500","isRecurring":true,"recurringFrequency":"monthly","durationType":"until_cancelled","theme":"dark","brandColor":"#6366f1","customerFields":[{"type":"name","label":"Full Name","optional":false},{"type":"email","label":"Email Address","optional":false}],"buttonLabel":"Subscribe"},"assumptions":["Recurring monthly until cancelled, based on 'monthly membership'.","Used dark theme with an indigo accent that reads well on dark — adjust the colour if you prefer."]}

Input: "Tickets for our summit on 15 March 2027 at JIO World Centre Mumbai. Early Bird 999, VIP 4999. Collect company. Add photos of the venue and auto-publish it."
Output: {"config":{"title":"Summit 2027","description":"Annual summit","amountType":"multiple","itemsAreTickets":true,"eventDate":"2027-03-15","eventVenue":"JIO World Centre, Mumbai","items":[{"label":"Early Bird","amount":"999"},{"label":"VIP","amount":"4999"}],"customerFields":[{"type":"name","label":"Full Name","optional":false},{"type":"email","label":"Email Address","optional":false},{"type":"phone","label":"Phone Number","optional":false},{"type":"company","label":"Company","optional":true}],"buttonLabel":"Book Tickets"},"assumptions":["Event time wasn't given — left blank.","Images can't be added by AI — please upload venue photos in the wizard.","Auto-publish isn't supported — review and publish the page manually."]}` ;

// ── Shared post-processing ────────────────────────────────────────────────────
// Runs on the raw text from whichever provider answered.
function parseAndNormalize(
  raw: string
): { config: Partial<WizardData>; assumptions: string[] } | null {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

  let parsed: { config: Partial<WizardData>; assumptions: string[] } | null = null;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return null;
  }

  if (!parsed || typeof parsed.config !== "object") return null;

  const cfg = parsed.config;

  // Ensure email is present in customerFields
  if (Array.isArray(cfg.customerFields)) {
    const hasEmail = cfg.customerFields.some((f: { type: string }) => f.type === "email");
    if (!hasEmail) {
      cfg.customerFields = [
        { type: "email", label: "Email Address", optional: false },
        ...cfg.customerFields,
      ];
    }
  }

  // Coerce numeric amount fields to strings
  for (const key of ["fixedAmount", "minAmount", "maxAmount", "maxPayments"] as const) {
    if (key in cfg && typeof (cfg as Record<string, unknown>)[key] === "number") {
      (cfg as Record<string, unknown>)[key] = String((cfg as Record<string, unknown>)[key]);
    }
  }

  return { config: cfg, assumptions: parsed.assumptions ?? [] };
}

// ── Groq (primary) ────────────────────────────────────────────────────────────
async function callGroq(merchantPrompt: string): Promise<string> {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: merchantPrompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
  });
  return completion.choices[0].message.content ?? "";
}

// ── Gemini (fallback) ─────────────────────────────────────────────────────────
async function callGemini(merchantPrompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY environment variable is not set");
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
    },
    contents: merchantPrompt,
  });
  return response.text ?? "";
}

// ── Public entry point ────────────────────────────────────────────────────────
export async function generatePageConfig(
  merchantPrompt: string
): Promise<{ config: Partial<WizardData>; assumptions: string[]; provider: "groq" | "gemini" } | null> {
  // 1. Try Groq first (one retry on 429, then fall through to Gemini)
  try {
    let raw: string;
    try {
      raw = await callGroq(merchantPrompt);
    } catch (err) {
      if (err instanceof RateLimitError) {
        console.error("[page-agent] Groq rate-limited (429) — waiting 2s and retrying once.");
        await new Promise(res => setTimeout(res, 2000));
        raw = await callGroq(merchantPrompt);
      } else {
        throw err;
      }
    }
    const result = parseAndNormalize(raw);
    if (result) return { ...result, provider: "groq" };
  } catch {
    // fall through to Gemini
  }

  // 2. Gemini fallback
  try {
    const raw = await callGemini(merchantPrompt);
    const result = parseAndNormalize(raw);
    if (result) return { ...result, provider: "gemini" };
  } catch {
    // both failed
  }

  return null;
}
