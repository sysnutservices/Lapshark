// What the customer actually bought, for an order item. createOrder saves a
// specs snapshot with the chosen RAM/SSD written over the product's base
// specs, so it also covers customers who kept the default config (their
// selectedConfig is empty). Older orders placed before specs existed fall
// back to the raw selectedConfig.
// Some products were entered as "512Gb"; show them as "512GB".
const tidy = (v: unknown): string | undefined =>
    typeof v === 'string' && v.trim() ? v.trim().replace(/(\d)\s*gb\b/gi, '$1GB').replace(/(\d)\s*tb\b/gi, '$1TB') : undefined;

export const itemRam = (item: any): string | undefined => tidy(item?.specs?.ram) || tidy(item?.selectedConfig?.ram);
export const itemSsd = (item: any): string | undefined => tidy(item?.specs?.storage) || tidy(item?.selectedConfig?.storage);

// "16GB RAM • 512GB SSD" for customer-facing order views.
export const itemRamSsdText = (item: any): string => {
    const ram = itemRam(item);
    const ssd = itemSsd(item);
    return [
        ram && (/ram/i.test(ram) ? ram : `${ram} RAM`),
        ssd && (/ssd|hdd/i.test(ssd) ? ssd : `${ssd} SSD`),
    ].filter(Boolean).join(' • ');
};

// Labelled parts for the admin order view and Excel export.
export const itemConfigParts = (item: any): string[] => {
    const s = item?.specs || {};
    const warranty = item?.warranty?.label || item?.selectedConfig?.warranty;
    const ram = itemRam(item);
    const ssd = itemSsd(item);
    return [
        s.processor && `Processor: ${s.processor}`,
        ram && `RAM: ${ram}`,
        ssd && `SSD: ${ssd}`,
        s.display && `Display: ${s.display}`,
        s.graphics && `Graphics: ${s.graphics}`,
        warranty && `Warranty: ${warranty}`,
    ].filter(Boolean) as string[];
};
