import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export interface BreadcrumbItem {
  name: string;
  // Omit on the last item — it's the current page, not a link.
  href?: string;
}

// Visible breadcrumb nav + matching BreadcrumbList JSON-LD in one place.
// Previously BreadcrumbList schema existed only on the product page, and
// only as invisible JSON-LD — no page had an actual breadcrumb a user could
// see or click. `items` should NOT include Home; it's added automatically.
export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  const SITE_URL = "https://lapshark.com";
  const all = [{ name: "Home", href: "/" }, ...items];

  return (
    <>
      <nav aria-label="Breadcrumb" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 md:pt-6">
        <ol className="flex flex-wrap items-center gap-1.5 text-sm text-slate-500">
          {all.map((item, i) => {
            const isLast = i === all.length - 1;
            return (
              <li key={item.href ?? item.name} className="flex items-center gap-1.5">
                {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-300" />}
                {isLast || !item.href ? (
                  <span className="font-medium text-slate-700" aria-current="page">
                    {i === 0 ? <Home className="w-3.5 h-3.5" /> : item.name}
                  </span>
                ) : (
                  <Link href={item.href} className="hover:text-teal-600 transition-colors flex items-center gap-1.5">
                    {i === 0 ? <Home className="w-3.5 h-3.5" /> : item.name}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: all.map((item, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: item.name,
              item: `${SITE_URL}${item.href ?? ""}`,
            })),
          }),
        }}
      />
    </>
  );
}
