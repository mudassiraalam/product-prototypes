// ──────────────────────────────────────────────────────────────────────────────
// Mappers between the dashboard's PaymentPage (a list row) and the wizard's
// WizardData (full builder state). Created/drafted pages carry their full
// WizardData in `draftData`, so those round-trip losslessly. The seed mock rows
// have no builder state, so we fabricate believable details on demand — this is
// what lets "Edit Page" reopen a convincing, pre-filled wizard for the demo.
// ──────────────────────────────────────────────────────────────────────────────
import type { PaymentPage, PageStatus } from "./mock-data";
import type { WizardData, MultiItem } from "./wizard-steps";
import { DEFAULT_WIZARD } from "./wizard-steps";

const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");
const num = (s: string) => parseFloat((s || "").replace(/[^0-9.]/g, "")) || 0;
const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);

function nowStamp(): string {
  const d = new Date();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const hh = d.getHours() % 12 || 12;
  const mm = d.getMinutes().toString().padStart(2, "0");
  const ap = d.getHours() < 12 ? "AM" : "PM";
  return `${d.getDate().toString().padStart(2, "0")} ${months[d.getMonth()]} ${d.getFullYear()}, ${hh}:${mm} ${ap}`;
}

// ── Display amount derived from builder state (for the dashboard row) ──────────
function amountLabel(data: WizardData): string {
  if (data.amountType === "fixed") return inr(num(data.fixedAmount));
  if (data.amountType === "customer") {
    if (data.isDonation) return "Any amount";
    const lo = num(data.minAmount), hi = num(data.maxAmount);
    if (lo && hi) return `${inr(lo)} – ${inr(hi)}`;
    return "Any amount";
  }
  // multiple
  const prices = data.items.map(i => num(i.amount)).filter(Boolean);
  if (!prices.length) return "—";
  const lo = Math.min(...prices), hi = Math.max(...prices);
  return lo === hi ? inr(lo) : `${inr(lo)} – ${inr(hi)}`;
}

// ── WizardData → PaymentPage row (save draft / publish) ───────────────────────
export function wizardDataToPage(
  data: WizardData,
  opts: { id: string; status: PageStatus; step: number; existing?: PaymentPage | null }
): PaymentPage {
  const ex = opts.existing;
  return {
    id: opts.id,
    title: data.title || "Untitled page",
    slug: data.pageSlug || slugify(data.title) || "untitled",
    amountType: data.amountType,
    isDonation: data.isDonation,
    itemsAreTickets: data.itemsAreTickets,
    isRecurring: data.isRecurring || undefined,
    recurringFrequency: data.isRecurring ? data.recurringFrequency : undefined,
    durationType: data.isRecurring ? data.durationType : undefined,
    endDate: (data.isRecurring && data.durationType === "until_date") ? data.endDate : undefined,
    amount: amountLabel(data),
    views: ex?.views ?? 0,
    payments: ex?.payments ?? 0,
    revenue: ex?.revenue ?? "₹0",
    status: opts.status,
    created: ex?.created ?? nowStamp(),
    expires: data.expiryDate || ex?.expires,
    brandColor: data.brandColor,
    buttonLabel: data.buttonLabel,
    theme: data.theme === "dark" ? "dark" : "light",
    layout: data.layout,
    description: data.description,
    draftData: data,
    lastStep: opts.step,
  };
}

// ── PaymentPage → WizardData (edit / resume) ──────────────────────────────────
export function pageToWizardData(page: PaymentPage): WizardData {
  // Lossless path for anything created/saved through the wizard.
  if (page.draftData) return page.draftData;

  // Otherwise fabricate believable builder state for the seed demo rows.
  const base: WizardData = {
    ...DEFAULT_WIZARD,
    merchantName: "EnKash Demo",
    title: page.title,
    pageSlug: page.slug,
    slugTouched: true,
    description: page.description ?? "",
    amountType: page.amountType,
    isRecurring: page.isRecurring ?? false,
    recurringFrequency: page.recurringFrequency ?? "monthly",
    durationType: page.durationType ?? "until_cancelled",
    endDate: page.endDate ?? "",
    isDonation: page.isDonation ?? false,
    itemsAreTickets: page.itemsAreTickets ?? false,
    brandColor: page.brandColor,
    buttonLabel: page.buttonLabel,
    theme: page.theme,
    layout: page.layout,
  };

  switch (page.id) {
    case "PP-ENK-MERCH05":
      return {
        ...base,
        amountType: "multiple",
        longDescription:
          "Official EnKash merch — soft cotton tees, cozy hoodies and desk essentials, all featuring the EnKash brand. Ships pan-India within 5–7 working days.",
        items: [
          { label: "Classic T-Shirt", amount: "499", description: "100% combed cotton, unisex fit", minQty: "1", maxQty: "5" },
          { label: "Pullover Hoodie", amount: "1499", description: "Fleece-lined, embroidered logo", minQty: "1", maxQty: "3" },
          { label: "Coffee Mug", amount: "299", description: "350ml ceramic", minQty: "1", maxQty: "6" },
          { label: "Notebook", amount: "399", description: "A5 dotted, hardcover" },
          { label: "Snapback Cap", amount: "699", description: "Adjustable, embroidered" },
        ] as MultiItem[],
        customerFields: [
          { type: "name", label: "Full Name", optional: false },
          { type: "email", label: "Email Address", optional: false },
          { type: "phone", label: "Phone Number", optional: false },
          { type: "address", label: "Shipping Address", optional: false },
        ],
      };

    case "PP-ENK-CONF2024":
    case "PP-ENK-CONF2023":
      return {
        ...base,
        amountType: "multiple",
        itemsAreTickets: true,
        longDescription:
          "India's biggest product & fintech summit. Three tracks, 40+ speakers, and a full day of workshops and networking.",
        eventDate: "2024-12-12",
        eventTime: "09:00",
        eventVenue: "JIO World Convention Centre, Mumbai",
        items: [
          { label: "Early Bird", amount: "999", description: "Limited seats", capacity: "200" },
          { label: "Regular", amount: "2499", description: "Full-day access + lunch", capacity: "600" },
          { label: "VIP", amount: "4999", description: "Front rows + speaker dinner", capacity: "80" },
        ] as MultiItem[],
        customerFields: [
          { type: "name", label: "Full Name", optional: false },
          { type: "email", label: "Email Address", optional: false },
          { type: "phone", label: "Phone Number", optional: false },
          { type: "company", label: "Company", optional: true },
        ],
      };

    case "PP-ENK-DIWALI24":
      return {
        ...base,
        amountType: "customer",
        isDonation: true,
        is80G: true,
        collectPan: true,
        longDescription:
          "Every contribution helps us bring festive joy — meals, clothes and school kits — to underprivileged children this Diwali. 80G tax-exemption receipts issued automatically.",
        suggestedAmounts: ["500", "1000", "2500", "5000"],
        customerFields: [
          { type: "name", label: "Full Name", optional: false },
          { type: "email", label: "Email Address", optional: false },
          { type: "phone", label: "Phone Number", optional: false },
          { type: "pan", label: "PAN Number", optional: false },
        ],
        buttonLabel: page.buttonLabel || "Donate Now",
      };

    case "PP-ENK-COURSE01":
      return {
        ...base,
        amountType: "fixed",
        fixedAmount: "4999",
        longDescription:
          "An 8-week intensive React bootcamp — live sessions, weekly project reviews, and job referrals on completion. Limited to 30 seats per batch.",
        customerFields: [
          { type: "name", label: "Full Name", optional: false },
          { type: "email", label: "Email Address", optional: false },
          { type: "phone", label: "Phone Number", optional: false },
        ],
      };

    default:
      // Generic fallback from the row's display amount.
      if (page.amountType === "fixed") return { ...base, fixedAmount: String(num(page.amount)) };
      if (page.amountType === "customer") return { ...base, suggestedAmounts: ["500", "1000", "2500"] };
      return {
        ...base,
        items: [{ label: "Item 1", amount: String(num(page.amount) || 499) }] as MultiItem[],
      };
  }
}
