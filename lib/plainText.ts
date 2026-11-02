// Markdown -> plain text. Product descriptions are authored in Markdown;
// meta descriptions and the Google Merchant feed both need them without
// raw ** / # / link syntax leaking through.
export function plainText(md?: string) {
    return (md || "")
        .replace(/!\[[^\]]*\]\([^)]*\)/g, "")   // images
        .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links -> label
        .replace(/[*_`#>~]/g, "")                // emphasis, headings, code
        .replace(/\s+/g, " ")
        .trim();
}
