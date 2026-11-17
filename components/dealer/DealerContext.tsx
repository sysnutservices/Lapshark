"use client";

import { createContext, useContext } from "react";
import type { DealerProfile, DealerProgramme } from "@/lib/dealerApi";

export const DealerCtx = createContext<{ profile: DealerProfile; programme: DealerProgramme } | null>(null);

export const useDealer = () => {
    const v = useContext(DealerCtx);
    if (!v) throw new Error("useDealer must be used inside the dealer portal");
    return v;
};
