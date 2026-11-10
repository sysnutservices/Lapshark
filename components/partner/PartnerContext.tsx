"use client";

import { createContext, useContext } from "react";
import type { PartnerProfile } from "@/lib/partnerApi";

// Provided by app/partner/(portal)/layout.tsx once the partner is active.
export const PartnerCtx = createContext<{ profile: PartnerProfile; reload: () => void } | null>(null);

export const usePartner = () => {
    const v = useContext(PartnerCtx);
    if (!v) throw new Error("usePartner must be used inside the partner portal");
    return v;
};
