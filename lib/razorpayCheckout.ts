import { API_URL } from "@/api/api";

// Shared by checkout and the "Complete payment" button on an unpaid order,
// so both open Razorpay and record the payment the same way.

declare global {
    interface Window {
        Razorpay: any;
    }
}

export function loadRazorpayScript(): Promise<boolean> {
    if (typeof window !== "undefined" && window.Razorpay) return Promise.resolve(true);
    return new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
}

// Money has already left the customer's account when this runs — Razorpay's
// own modal confirmed the charge. This only asks our backend to record it.
// Retried: one network blip (common on mobile right after switching back
// from a UPI app) shouldn't strand a paid order. An invalid signature (400)
// won't fix itself, so that isn't retried. Throws if it never succeeds.
async function verifyPayment(response: any): Promise<void> {
    let verifyRes: Response | undefined;
    let verifyData: any;
    for (let attempt = 0; attempt < 3; attempt++) {
        if (attempt) await new Promise(r => setTimeout(r, attempt * 2000));
        try {
            verifyRes = await fetch(`${API_URL}/orders/verify`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify(response)
            });
            verifyData = await verifyRes.json();
        } catch {
            verifyRes = undefined;
            continue;
        }
        if ((verifyRes.ok && verifyData?.success) || verifyRes.status === 400) break;
    }

    if (!verifyRes?.ok || !verifyData?.success) {
        throw new Error(verifyData?.message || "Payment verification failed");
    }
}

// What to tell a customer whose payment went through but couldn't be
// recorded yet. The backend's payment reconciler checks Razorpay every few
// minutes and records it on its own.
export function unverifiedPaymentText(paymentId: string): string {
    return `Your payment went through. Your order will be confirmed automatically within a few minutes. If it isn't, contact support with this reference: ${paymentId}`;
}

export function openRazorpayCheckout(opts: {
    key: string;
    amount: number;
    razorpayOrderId: string;
    prefill?: { name?: string; email?: string; contact?: string };
    // Paid and recorded.
    onVerified: (response: any) => void;
    // Paid, but our backend couldn't record it yet (see unverifiedPaymentText).
    onUnverified: (response: any, error: unknown) => void;
    onDismiss: () => void;
    // A payment attempt failed. Razorpay keeps its window open for another try.
    onFailed: (description: string) => void;
}) {
    const rzp = new window.Razorpay({
        key: opts.key,
        amount: opts.amount,
        order_id: opts.razorpayOrderId,
        prefill: opts.prefill,
        handler: async function (response: any) {
            try {
                await verifyPayment(response);
            } catch (error) {
                opts.onUnverified(response, error);
                return;
            }
            opts.onVerified(response);
        },
        modal: {
            ondismiss: opts.onDismiss
        },
        theme: {
            color: '#0F172A'
        }
    });
    rzp.open();
    rzp.on("payment.failed", function (response: any) {
        opts.onFailed(response?.error?.description);
    });
}
