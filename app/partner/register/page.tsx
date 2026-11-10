import type { Metadata } from "next";
import { RegisterContent } from "./RegisterContent";

export const metadata: Metadata = {
    title: "Apply | Lapshark Sales Ambassador Network",
    robots: { index: false, follow: false },
};

export default function PartnerRegisterPage() {
    return <RegisterContent />;
}
