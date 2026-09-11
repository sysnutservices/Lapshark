import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

export interface FAQItem {
    question: string;
    answer: string;
}

// Visible FAQ accordion (same styling as the one already on /contact) +
// matching FAQPage JSON-LD, in one place — every question here must be
// grounded in real STORE_POLICIES/business data by the caller, never
// invented copy, since this also feeds structured data.
export function FAQSection({ heading, faqs }: { heading: string; faqs: FAQItem[] }) {
    if (faqs.length === 0) return null;

    return (
        <section className="max-w-2xl mx-auto">
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-6 text-center">{heading}</h2>
            <Accordion multiple className="rounded-2xl border border-slate-200 bg-white px-6">
                {faqs.map((faq, index) => (
                    <AccordionItem key={index} value={`faq-${index}`}>
                        <AccordionTrigger className="text-left font-bold text-slate-900">
                            {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-sm text-slate-600 leading-relaxed">
                            {faq.answer}
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "FAQPage",
                        mainEntity: faqs.map((faq) => ({
                            "@type": "Question",
                            name: faq.question,
                            acceptedAnswer: { "@type": "Answer", text: faq.answer },
                        })),
                    }),
                }}
            />
        </section>
    );
}
