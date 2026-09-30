import { Product, ConfigOption } from "@/types";

// Admin "Export to Excel" on the products page — every product field an
// admin would want in a spreadsheet, flattened to one row per product.
// write-excel-file is loaded only on click so it stays out of the bundle,
// same as the orders/customers exports.

// write-excel-file stores dates as UTC wall-clock; shift so Excel shows the
// admin's local (IST) time.
const toLocalCell = (iso?: string) => {
  if (!iso) return undefined;
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000);
};

// Descriptions are stored as rich-text HTML; Excel wants plain text.
const plainText = (html?: string) =>
  (html || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|li|h\d)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const optionList = (list?: ConfigOption[]) =>
  (list || []).map((o) => (o.price ? `${o.label} (+₹${o.price.toLocaleString("en-IN")})` : o.label)).join("; ");

const QUALITY_CHECKS = ["display", "keyboard", "trackpad", "webcam", "speaker", "microphone", "wifi", "bluetooth", "ports"] as const;

// "All 9 passed", or just the checks that didn't pass (e.g. "keyboard: minor-wear").
const qualitySummary = (q: Product["qualityReport"]) => {
  if (!q) return "";
  const done = QUALITY_CHECKS.filter((c) => q[`${c}Status`]);
  if (!done.length) return "";
  const notPassed = done.filter((c) => q[`${c}Status`] !== "passed").map((c) => `${c}: ${q[`${c}Status`]}`);
  return notPassed.length ? notPassed.join("; ") : `All ${done.length} passed`;
};

const offerSummary = (o: Product["extraOffer"]) => {
  if (!o) return "";
  const value =
    o.discountType === "percentage" ? `${o.discountValue}% off`
    : o.discountType === "specialPrice" ? `Special price ₹${o.discountValue.toLocaleString("en-IN")}`
    : `₹${o.discountValue.toLocaleString("en-IN")} off`;
  return [o.offerLabel, value, o.isActive === false ? "(inactive)" : ""].filter(Boolean).join(" · ");
};

export async function exportProductsToExcel(products: Product[]) {
  const { default: writeExcelFile } = await import("write-excel-file/browser");
  const header = (value: string) => ({ value, fontWeight: "bold" as const });
  const text = (value?: string | null) => ({ value: value || "", type: String, format: "@" });
  const num = (value?: number | null, format?: string) =>
    ({ value: value ?? undefined, type: Number, ...(format ? { format } : {}) });
  const money = (value?: number | null) => num(value, "#,##0");
  const yesNo = (b?: boolean) => text(b === true ? "Yes" : b === false ? "No" : "");
  const date = (iso?: string) => ({ value: toLocalCell(iso), type: Date, format: "dd/mm/yyyy hh:mm AM/PM" });

  const columns = [
    { header: header("Product ID"), cell: (p: Product) => text(p.productId), width: 14 },
    { header: header("Title"), cell: (p: Product) => text(p.title), width: 50 },
    { header: header("Brand"), cell: (p: Product) => text(p.brand), width: 12 },
    { header: header("Category"), cell: (p: Product) => text(p.category), width: 18 },
    { header: header("Condition"), cell: (p: Product) => text(p.condition), width: 11 },
    { header: header("Processor"), cell: (p: Product) => text(p.specs?.processor), width: 22 },
    { header: header("RAM"), cell: (p: Product) => text(p.specs?.ram), width: 9 },
    { header: header("Storage"), cell: (p: Product) => text(p.specs?.storage), width: 12 },
    { header: header("Display"), cell: (p: Product) => text(p.specs?.display), width: 16 },
    { header: header("Graphics"), cell: (p: Product) => text(p.specs?.graphics), width: 16 },
    { header: header("OS"), cell: (p: Product) => text(p.specs?.os), width: 14 },
    { header: header("MRP (₹)"), cell: (p: Product) => money(p.price), width: 11 },
    { header: header("Discount %"), cell: (p: Product) => num(p.discountPercent), width: 10 },
    { header: header("Final Price (₹)"), cell: (p: Product) => money(p.finalPrice), width: 14 },
    { header: header("Extra Offer"), cell: (p: Product) => text(offerSummary(p.extraOffer)), width: 32 },
    { header: header("Stock"), cell: (p: Product) => num(p.stock), width: 7 },
    { header: header("Rating"), cell: (p: Product) => num(p.rating, "0.0"), width: 7 },
    { header: header("Reviews"), cell: (p: Product) => num(p.reviews), width: 8 },
    { header: header("New"), cell: (p: Product) => yesNo(p.isNewItem), width: 6 },
    { header: header("Trending"), cell: (p: Product) => yesNo(p.isTrending), width: 9 },
    { header: header("Best Deal"), cell: (p: Product) => yesNo(p.isBestDeal), width: 9 },
    { header: header("Performance Tier"), cell: (p: Product) => text(p.performanceTier), width: 16 },
    { header: header("Use Cases"), cell: (p: Product) => text((p.useCases || []).join(", ")), width: 30 },
    { header: header("Tags"), cell: (p: Product) => text((p.tags || []).join(", ")), width: 20 },
    { header: header("RAM Options"), cell: (p: Product) => text(optionList(p.configOptions?.ram)), width: 30 },
    { header: header("Storage Options"), cell: (p: Product) => text(optionList(p.configOptions?.storage)), width: 30 },
    { header: header("Warranty Options"), cell: (p: Product) => text(optionList(p.configOptions?.warranty)), width: 45 },
    { header: header("Battery Health %"), cell: (p: Product) => num(p.qualityReport?.batteryHealthPercent), width: 15 },
    { header: header("Storage Health %"), cell: (p: Product) => num(p.qualityReport?.storageHealthPercent), width: 15 },
    { header: header("Quality Checks"), cell: (p: Product) => text(qualitySummary(p.qualityReport)), width: 20 },
    { header: header("Serial Verified"), cell: (p: Product) => yesNo(p.qualityReport?.serialVerified), width: 13 },
    { header: header("Technician Checked"), cell: (p: Product) => yesNo(p.qualityReport?.technicianChecked), width: 17 },
    { header: header("Condition Notes"), cell: (p: Product) => text(p.qualityReport?.physicalConditionNotes), width: 30 },
    { header: header("Weight (kg)"), cell: (p: Product) => num(p.weightKg), width: 10 },
    { header: header("Size L×W×H (cm)"), cell: (p: Product) => text([p.lengthCm, p.widthCm, p.heightCm].join(" × ")), width: 15 },
    { header: header("Product URL"), cell: (p: Product) => text(p.slug ? `https://lapshark.com/products/${p.slug}` : ""), width: 50 },
    { header: header("Main Image"), cell: (p: Product) => text(p.image), width: 50 },
    { header: header("Gallery Images"), cell: (p: Product) => num((p.images || []).length), width: 13 },
    { header: header("Gallery Image URLs"), cell: (p: Product) => text((p.images || []).join("\n")), width: 50 },
    { header: header("Description"), cell: (p: Product) => text(plainText(p.description)), width: 80 },
    { header: header("Created"), cell: (p: Product) => date(p.createdAt), width: 20 },
    { header: header("Updated"), cell: (p: Product) => date(p.updatedAt), width: 20 },
  ];

  // Newest first, same as the orders/customers exports.
  const rows = [...products].sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  const now = new Date();
  const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  await writeExcelFile(rows, { columns, sheet: "Products", stickyRowsCount: 1 }).toFile(`lapshark-products-${stamp}.xlsx`);
}
