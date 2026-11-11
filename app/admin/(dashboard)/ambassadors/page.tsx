"use client";

// Sales Ambassador Network — admin CRM (distribution/docs/04-api.md, 05).
// Staff-role permissions are enforced by the API; a 403 here surfaces as an
// inline error rather than hiding buttons (the client can't see staffRole).
import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, BadgeIndianRupee, Eye, RefreshCw, Settings2, ShieldCheck, Users, UserPlus, Wallet } from "lucide-react";
import { apiError, COMMISSION_STATUS_LABEL, inr, LEAD_STATUS_LABEL, newIdempotencyKey, PARTNER_STATUS_LABEL, partnerAdminApi as A, PRICING_LEVEL_LABEL, QUOTE_STATUS_LABEL, quoteTone } from "@/lib/partnerApi";
import { Banner, Btn, Card, Empty, Field, fmtDate, fmtDateTime, inputCls, Modal, Pill, Spinner, Stat, statusTone } from "@/components/partner/ui";

const TABS = ["Overview", "Partners", "Waitlist", "Leads", "Price approvals", "Quotations", "Commissions", "Payouts", "Laptop minimums", "Rules", "Tools", "Settings"] as const;
type Tab = (typeof TABS)[number];

export default function AmbassadorsAdminPage() {
    const [tab, setTab] = useState<Tab>("Overview");
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Sales Ambassadors</h1>
                <p className="text-sm text-gray-500">Partner applications, attribution, commission rules and liability.</p>
            </div>
            <div className="flex gap-1 overflow-x-auto border-b border-gray-200">
                {TABS.map((t) => (
                    <button key={t} onClick={() => setTab(t)} className={`whitespace-nowrap px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === t ? "border-blue-600 text-blue-700" : "border-transparent text-gray-500 hover:text-gray-800"}`}>{t}</button>
                ))}
            </div>
            {tab === "Overview" && <OverviewTab go={setTab} />}
            {tab === "Partners" && <PartnersTab />}
            {tab === "Waitlist" && <WaitlistTab />}
            {tab === "Leads" && <LeadsTab />}
            {tab === "Price approvals" && <ApprovalsTab />}
            {tab === "Quotations" && <QuotationsTab />}
            {tab === "Commissions" && <CommissionsTab />}
            {tab === "Payouts" && <PayoutsTab />}
            {tab === "Laptop minimums" && <MinimumsTab />}
            {tab === "Rules" && <RulesTab />}
            {tab === "Tools" && <ToolsTab />}
            {tab === "Settings" && <SettingsTab />}
        </div>
    );
}

function useLoad<T>(fn: () => Promise<T>, deps: unknown[]) {
    const [data, setData] = useState<T | null>(null);
    const [error, setError] = useState("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const load = useCallback(() => { setError(""); fn().then(setData).catch((e) => setError(apiError(e).message)); }, deps);
    useEffect(load, [load]);
    return { data, error, load };
}

// ---------------------------------------------------------------- Overview
function OverviewTab({ go }: { go: (t: Tab) => void }) {
    const { data, error } = useLoad<any>(() => A.get("/admin/partners/overview"), []);
    if (error) return <Banner tone="red">{error}</Banner>;
    if (!data) return <Spinner />;
    return (
        <div className="space-y-6">
            {!data.settings.programmeEnabled && <Banner tone="amber">The programme is <b>disabled</b>. Partners can't sign in and referral links are ignored. Enable it under Settings once commission rules are configured.</Banner>}
            {data.pendingPriceApprovals > 0 && (
                <Banner tone="amber">{data.pendingPriceApprovals} special-price request(s) from partners waiting for a decision. Each holds up a customer quotation. <button className="underline font-semibold" onClick={() => go("Price approvals")}>Review now</button></Banner>
            )}
            {data.partners.awaitingReview > 0 && (
                <Banner>{data.partners.awaitingReview} application(s) waiting for review. <button className="underline font-semibold" onClick={() => go("Partners")}>Review now</button></Banner>
            )}
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
                <Stat label="Applications" value={data.partners.applications} icon={UserPlus} />
                <Stat label="Approved partners" value={data.partners.approved} icon={ShieldCheck} tone="teal" />
                <Stat label="Active ambassadors" value={data.partners.active} icon={Users} tone="navy" />
                <Stat label="Total leads" value={`${data.leads.total} (${data.leads.qualified} qualified)`} icon={Users} tone="slate" />
                <Stat label="Attributed orders" value={data.sales.attributedOrders} icon={BadgeIndianRupee} tone="blue" />
                <Stat label="Revenue via partners" value={inr(data.sales.revenue)} icon={BadgeIndianRupee} tone="teal" />
                <Stat label="Commission liability" value={inr(data.commission.liability)} icon={Wallet} tone="amber" />
                <Stat label="Commission paid" value={inr(data.commission.paid)} icon={Wallet} tone="teal" />
            </div>
            {data.commission.onHold > 0 && <Banner tone="amber">{data.commission.onHold} commission line(s) on hold. <button className="underline font-semibold" onClick={() => go("Commissions")}>Review</button></Banner>}
            <Card>
                <h2 className="font-semibold text-gray-900">Top partners</h2>
                {data.topPartners.length === 0 ? <p className="mt-2 text-sm text-gray-500">No attributed sales yet.</p> : (
                    <table className="mt-3 min-w-full text-sm">
                        <thead className="text-left text-xs uppercase text-gray-500"><tr><th className="py-2">Partner</th><th className="py-2 text-right">Units</th><th className="py-2 text-right">Revenue</th><th className="py-2 text-right">Commission</th></tr></thead>
                        <tbody className="divide-y divide-gray-100">{data.topPartners.map((t: any) => <tr key={t._id}><td className="py-2">{t.fullName} <span className="font-mono text-xs text-gray-400">{t.partnerCode}</span></td><td className="py-2 text-right">{t.units}</td><td className="py-2 text-right">{inr(t.revenue)}</td><td className="py-2 text-right">{inr(t.commission)}</td></tr>)}</tbody>
                    </table>
                )}
                <p className="mt-3 text-xs text-gray-400">Contribution after commission can&apos;t be computed yet: products have no cost data (decisions log Q4).</p>
            </Card>
        </div>
    );
}

// ---------------------------------------------------------------- Partners
function PartnersTab() {
    const [status, setStatus] = useState("application_submitted");
    const [q, setQ] = useState("");
    const [openId, setOpenId] = useState<string | null>(null);
    const { data, error, load } = useLoad<any>(() => A.get("/admin/partners", { ...(status ? { status } : {}), ...(q ? { q } : {}) }), [status, q]);
    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
                <select className={`${inputCls} w-56`} value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="">All statuses</option>
                    {Object.entries(PARTNER_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <input className={`${inputCls} w-64`} placeholder="Name, code, email, phone, city" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            {error && <Banner tone="red">{error}</Banner>}
            {!data && !error && <Spinner />}
            {data && data.partners.length === 0 && <Empty title="No partners match" />}
            {data && data.partners.length > 0 && (
                <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500"><tr><th className="px-4 py-3">Partner</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">City</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Applied</th><th className="px-4 py-3">Flags</th></tr></thead>
                        <tbody className="divide-y divide-gray-100">
                            {data.partners.map((p: any) => (
                                <tr key={p._id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setOpenId(p._id)}>
                                    <td className="px-4 py-3"><p className="font-medium text-gray-900">{p.fullName}</p><p className="text-xs text-gray-500"><span className="font-mono">{p.partnerCode}</span> · {p.phone} · {p.email}</p></td>
                                    <td className="px-4 py-3">{p.partnerType === "independent" ? "Independent" : "Referral"}</td>
                                    <td className="px-4 py-3">{p.city}</td>
                                    <td className="px-4 py-3"><Pill tone={statusTone(p.status)}>{PARTNER_STATUS_LABEL[p.status as keyof typeof PARTNER_STATUS_LABEL]}</Pill></td>
                                    <td className="px-4 py-3 text-gray-600">{fmtDate(p.createdAt)}</td>
                                    <td className="px-4 py-3">{p.flags?.length ? <Pill tone="amber">{p.flags.length} flag(s)</Pill> : null}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {openId && <PartnerDetail id={openId} onClose={() => setOpenId(null)} onChanged={load} />}
        </div>
    );
}

function PartnerDetail({ id, onClose, onChanged }: { id: string; onClose: () => void; onChanged: () => void }) {
    const { data, error, load } = useLoad<any>(() => A.get(`/admin/partners/${id}`), [id]);
    const [reason, setReason] = useState("");
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState<{ tone: "red" | "green"; text: string } | null>(null);
    const [revealed, setRevealed] = useState<any>(null);
    const [purpose, setPurpose] = useState("");

    const act = async (action: string, needsReason: boolean) => {
        if (needsReason && !reason.trim()) return setMsg({ tone: "red", text: "Enter a reason first." });
        setBusy(true);
        setMsg(null);
        try {
            const r = await A.patch(`/admin/partners/${id}/${action}`, { reason });
            setMsg({ tone: "green", text: `Done.${r.commissionsHeld ? ` ${r.commissionsHeld} open commission line(s) put on hold.` : ""}` });
            setReason("");
            load();
            onChanged();
        } catch (e) {
            setMsg({ tone: "red", text: apiError(e).message });
        } finally {
            setBusy(false);
        }
    };
    const reveal = async () => {
        setBusy(true);
        try {
            setRevealed(await A.post(`/admin/partners/${id}/reveal`, { purpose }));
        } catch (e) {
            setMsg({ tone: "red", text: apiError(e).message });
        } finally {
            setBusy(false);
        }
    };

    const p = data?.partner;
    const s = p?.status;
    return (
        <Modal open onClose={onClose} title={p ? `${p.fullName} · ${p.partnerCode}` : "Partner"} wide>
            {error && <Banner tone="red">{error}</Banner>}
            {!p ? <Spinner /> : (
                <div className="space-y-5 text-sm">
                    {msg && <Banner tone={msg.tone}>{msg.text}</Banner>}
                    <div className="flex flex-wrap items-center gap-2"><Pill tone={statusTone(s)}>{PARTNER_STATUS_LABEL[s as keyof typeof PARTNER_STATUS_LABEL]}</Pill><Pill tone="slate">{p.partnerType === "independent" ? "Independent Sales" : "Referral"}</Pill>{p.emailVerified ? <Pill tone="green">Email verified</Pill> : <Pill tone="slate">Email not verified</Pill>}</div>
                    <div className="grid gap-3 sm:grid-cols-3">
                        <Info k="Mobile (OTP-verified)" v={p.phone} />
                        <Info k="Email" v={p.email} />
                        <Info k="Date of birth" v={fmtDate(p.dateOfBirth)} />
                        <Info k="Address" v={[p.address?.line1, p.address?.line2, p.address?.city, p.address?.state, p.address?.pincode].filter(Boolean).join(", ")} wide />
                        <Info k="Occupation" v={p.occupation || "—"} />
                        <Info k="Heard from" v={p.heardFrom || "—"} />
                        <Info k="Business" v={p.business?.name ? `${p.business.name}${p.business.gstin ? ` (${p.business.gstin})` : ""}` : "—"} />
                        <Info k="PAN" v={p.pan?.masked} />
                        <Info k="Payout" v={`${p.payout?.method?.toUpperCase()} · ${p.payout?.masked}`} />
                        <Info k="Agreement" v={`${p.agreement?.version} · ${fmtDate(p.agreement?.acceptedAt)}`} />
                        <Info k="Leads" v={String(data.stats.leads)} />
                        <Info k="Commissions" v={data.stats.commissions.map((c: any) => `${c.status}: ${c.count} (${inr(c.amount)})`).join(" · ") || "—"} wide />
                    </div>
                    {(p.flags?.length > 0 || data.sharedPayoutWith?.length > 0) && (
                        <Banner tone="amber">
                            <div className="flex gap-2"><AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /><div>
                                {p.flags.map((f: any, i: number) => <p key={i}>{f.type}: {f.detail}</p>)}
                                {data.sharedPayoutWith?.length > 0 && <p>Same payout destination as: {data.sharedPayoutWith.map((x: any) => `${x.partnerCode} (${x.fullName}, ${x.status})`).join(", ")}</p>}
                            </div></div>
                        </Banner>
                    )}

                    <div className="rounded-lg border border-gray-200 p-4 space-y-3">
                        <p className="font-semibold text-gray-900">Actions</p>
                        <input className={inputCls} placeholder="Reason (required to reject, suspend or terminate; shown to the partner)" value={reason} onChange={(e) => setReason(e.target.value)} />
                        <div className="flex flex-wrap gap-2">
                            {s === "application_submitted" && <Btn variant="secondary" loading={busy} onClick={() => act("verification", false)}>Mark verification pending</Btn>}
                            {(s === "application_submitted" || s === "verification_pending") && <><Btn loading={busy} onClick={() => act("approve", false)}>Approve</Btn><Btn variant="danger" loading={busy} onClick={() => act("reject", true)}>Reject</Btn></>}
                            {(s === "approved" || s === "active") && <Btn variant="danger" loading={busy} onClick={() => act("suspend", true)}>Suspend</Btn>}
                            {s === "suspended" && <Btn loading={busy} onClick={() => act("reactivate", false)}>Reactivate</Btn>}
                            {s !== "terminated" && s !== "rejected" && <Btn variant="ghost" loading={busy} onClick={() => act("terminate", true)}>Terminate</Btn>}
                        </div>
                    </div>

                    <div className="rounded-lg border border-gray-200 p-4 space-y-3">
                        <p className="font-semibold text-gray-900 flex items-center gap-2"><Eye className="w-4 h-4" />Reveal PAN & payout details (Super Admin / Finance, audited)</p>
                        {revealed ? (
                            <div className="font-mono text-sm bg-gray-50 rounded p-3">
                                <p>PAN: {revealed.pan}</p>
                                {revealed.payout.method === "upi" ? <p>UPI: {revealed.payout.upiId}</p> : <p>Bank: {revealed.payout.accountName} · {revealed.payout.accountNumber} · {revealed.payout.ifsc}</p>}
                            </div>
                        ) : (
                            <div className="flex gap-2"><input className={inputCls} placeholder="Purpose, e.g. payout verification" value={purpose} onChange={(e) => setPurpose(e.target.value)} /><Btn variant="secondary" disabled={!purpose.trim()} loading={busy} onClick={reveal}>Reveal</Btn></div>
                        )}
                    </div>

                    <div>
                        <p className="font-semibold text-gray-900">Status history</p>
                        <ul className="mt-2 space-y-1">{p.statusHistory?.slice().reverse().map((h: any, i: number) => <li key={i} className="text-xs text-gray-600">{fmtDateTime(h.at)} · <b>{h.status}</b>{h.reason ? ` · ${h.reason}` : ""}</li>)}</ul>
                    </div>
                </div>
            )}
        </Modal>
    );
}

const Info = ({ k, v, wide }: { k: string; v?: string; wide?: boolean }) => (
    <div className={wide ? "sm:col-span-3" : ""}><p className="text-xs text-gray-400">{k}</p><p className="text-gray-900 break-words">{v || "—"}</p></div>
);

// ---------------------------------------------------------------- Waitlist
function WaitlistTab() {
    const [status, setStatus] = useState("waiting");
    const [msg, setMsg] = useState<{ tone: "red" | "green"; text: string } | null>(null);
    const [busyId, setBusyId] = useState("");
    const { data, error, load } = useLoad<any>(() => A.get("/admin/partner-waitlist", status ? { status } : {}), [status]);
    const invite = async (id: string) => {
        setBusyId(id);
        setMsg(null);
        try {
            const r = await A.post(`/admin/partner-waitlist/${id}/invite`);
            setMsg({ tone: "green", text: r.message });
            load();
        } catch (e) {
            setMsg({ tone: "red", text: apiError(e).message });
        } finally {
            setBusyId("");
        }
    };
    return (
        <div className="space-y-4">
            <Banner>People who reserved a spot on /partner. <b>Invite</b> adds their mobile to the pilot allowlist so they can apply. There&apos;s no automatic invite message yet, so contact them yourself.</Banner>
            <select className={`${inputCls} w-48`} value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">All</option><option value="waiting">Waiting</option><option value="invited">Invited</option><option value="registered">Registered</option>
            </select>
            {msg && <Banner tone={msg.tone}>{msg.text}</Banner>}
            {error && <Banner tone="red">{error}</Banner>}
            {!data && !error && <Spinner />}
            {data && data.entries.length === 0 && <Empty title="No one here yet" />}
            {data && data.entries.length > 0 && (
                <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500"><tr><th className="px-4 py-3">Person</th><th className="px-4 py-3">Interest</th><th className="px-4 py-3">Source</th><th className="px-4 py-3">Joined</th><th className="px-4 py-3">Status</th><th /></tr></thead>
                        <tbody className="divide-y divide-gray-100">
                            {data.entries.map((w: any) => (
                                <tr key={w._id}>
                                    <td className="px-4 py-3"><p className="font-medium">{w.fullName}</p><p className="text-xs text-gray-500"><a href={`tel:${w.phone}`} className="text-blue-600">{w.phone}</a>{w.email ? ` · ${w.email}` : ""}</p></td>
                                    <td className="px-4 py-3"><p>{w.partnerType === "independent" ? "Independent" : "Referral"}</p><p className="text-xs text-gray-500">{[w.occupation, w.city].filter(Boolean).join(" · ")}</p></td>
                                    <td className="px-4 py-3 text-xs text-gray-600">{[w.source?.utmSource, w.source?.utmCampaign].filter(Boolean).join(" / ") || "direct"}</td>
                                    <td className="px-4 py-3 text-gray-600">{fmtDate(w.createdAt)}</td>
                                    <td className="px-4 py-3"><Pill tone={w.applied ? "green" : w.status === "invited" ? "blue" : "amber"}>{w.applied ? "applied" : w.status}</Pill></td>
                                    <td className="px-4 py-3 text-right">{!w.applied && w.status === "waiting" && <Btn variant="secondary" loading={busyId === w._id} onClick={() => invite(w._id)}>Invite</Btn>}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// ---------------------------------------------------------------- Leads
function LeadsTab() {
    const [status, setStatus] = useState("");
    const [q, setQ] = useState("");
    const [edit, setEdit] = useState<any>(null);
    const { data, error, load } = useLoad<any>(() => A.get("/admin/partner-leads", { ...(status ? { status } : {}), ...(q ? { q } : {}) }), [status, q]);
    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
                <select className={`${inputCls} w-48`} value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All stages</option>{Object.entries(LEAD_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
                <input className={`${inputCls} w-64`} placeholder="Customer name or phone" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            {error && <Banner tone="red">{error}</Banner>}
            {!data && !error && <Spinner />}
            {data && data.leads.length === 0 && <Empty title="No leads" />}
            {data && data.leads.length > 0 && (
                <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500"><tr><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Partner</th><th className="px-4 py-3">Stage</th><th className="px-4 py-3">Budget</th><th className="px-4 py-3">Owned until</th><th /></tr></thead>
                        <tbody className="divide-y divide-gray-100">
                            {data.leads.map((l: any) => (
                                <tr key={l._id}>
                                    <td className="px-4 py-3"><p className="font-medium">{l.customerName}</p><p className="text-xs text-gray-500">{l.phone}{l.existingCustomer ? " · existing customer" : ""}</p></td>
                                    <td className="px-4 py-3">{l.partner?.fullName} <span className="font-mono text-xs text-gray-400">{l.partner?.partnerCode}</span></td>
                                    <td className="px-4 py-3"><Pill tone={statusTone(l.status)}>{LEAD_STATUS_LABEL[l.status as keyof typeof LEAD_STATUS_LABEL]}</Pill></td>
                                    <td className="px-4 py-3">{inr(l.budget)}</td>
                                    <td className="px-4 py-3">{l.ownershipActive ? fmtDate(l.ownershipExpiresAt) : <span className="text-gray-400">Expired</span>}</td>
                                    <td className="px-4 py-3 text-right"><Btn variant="ghost" onClick={() => setEdit(l)}>Manage</Btn></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {edit && <LeadManage lead={edit} onClose={() => setEdit(null)} onDone={() => { setEdit(null); load(); }} />}
        </div>
    );
}

function LeadManage({ lead, onClose, onDone }: { lead: any; onClose: () => void; onDone: () => void }) {
    const [action, setAction] = useState<"extend" | "reassign">("extend");
    const [days, setDays] = useState("15");
    const [to, setTo] = useState("");
    const [reason, setReason] = useState("");
    const [err, setErr] = useState("");
    const [busy, setBusy] = useState(false);
    const partners = useLoad<any>(() => A.get("/admin/partners", { status: "active" }), []);
    const submit = async () => {
        setBusy(true);
        setErr("");
        try {
            await A.patch(`/admin/partner-leads/${lead._id}`, action === "extend" ? { action, days: Number(days), reason } : { action, toAmbassadorId: to, reason });
            onDone();
        } catch (e) {
            setErr(apiError(e).message);
        } finally {
            setBusy(false);
        }
    };
    return (
        <Modal open onClose={onClose} title={`Manage lead: ${lead.customerName}`}>
            <div className="space-y-4">
                {err && <Banner tone="red">{err}</Banner>}
                <div className="flex gap-2">{(["extend", "reassign"] as const).map((a) => <button key={a} onClick={() => setAction(a)} className={`rounded-full px-3 py-1 text-sm border ${action === a ? "bg-blue-600 text-white border-blue-600" : "border-gray-300"}`}>{a === "extend" ? "Extend ownership" : "Reassign"}</button>)}</div>
                {action === "extend" ? (
                    <Field label="Extend by (days)"><input type="number" min={1} max={180} className={inputCls} value={days} onChange={(e) => setDays(e.target.value)} /></Field>
                ) : (
                    <Field label="Reassign to"><select className={inputCls} value={to} onChange={(e) => setTo(e.target.value)}><option value="">Choose an active partner</option>{partners.data?.partners?.filter((p: any) => p._id !== lead.ambassadorId).map((p: any) => <option key={p._id} value={p._id}>{p.fullName} ({p.partnerCode})</option>)}</select></Field>
                )}
                <Field label="Reason (audited)"><input className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
                <div className="flex justify-end"><Btn loading={busy} onClick={submit}>Save</Btn></div>
            </div>
        </Modal>
    );
}

// ---------------------------------------------------------------- Price approvals (Level 3)
function ApprovalsTab() {
    const [status, setStatus] = useState("pending");
    const [open, setOpen] = useState<any | null>(null);
    const { data, error, load } = useLoad<any>(() => A.get("/admin/discount-requests", { status }), [status]);
    return (
        <div className="space-y-4">
            <Banner>Independent partners can negotiate down to each laptop&apos;s minimum on their own. Prices below the minimum (or any discount where no minimum is set) wait here. Approving locks the price for 24 hours and sets the partner&apos;s commission for those laptops; rejecting lets the partner revise. <b>Only the super admin can approve or reject</b>; other staff can view.</Banner>
            <select className={`${inputCls} w-48`} value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="withdrawn">Withdrawn</option><option value="all">All</option>
            </select>
            {error && <Banner tone="red">{error}</Banner>}
            {!data && !error && <Spinner />}
            {data && data.requests.length === 0 && <Empty title={status === "pending" ? "Nothing waiting" : "No requests"} />}
            {data && data.requests.length > 0 && (
                <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500"><tr><th className="px-4 py-3">Quotation</th><th className="px-4 py-3">Partner</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Below minimum</th><th className="px-4 py-3">Asked</th><th className="px-4 py-3">Status</th><th /></tr></thead>
                        <tbody className="divide-y divide-gray-100">
                            {data.requests.map((d: any) => (
                                <tr key={d._id}>
                                    <td className="px-4 py-3 font-mono">{d.quoteNumber} v{d.quoteVersion}<p className="font-sans text-xs text-gray-500">{inr(d.quoteTotals?.quoted)} (listed {inr(d.quoteTotals?.listed)})</p></td>
                                    <td className="px-4 py-3">{d.partner?.fullName} <span className="font-mono text-xs text-gray-400">{d.partner?.partnerCode}</span></td>
                                    <td className="px-4 py-3">{d.customer?.name}{d.customer?.location ? <span className="text-xs text-gray-500"> · {d.customer.location}</span> : null}</td>
                                    <td className="px-4 py-3">{d.lines.map((l: any) => <p key={String(l.itemId)} className="text-xs">{l.quantity}× {l.title}: <b>{inr(l.requestedUnitPrice)}</b> {l.floorUnitPrice === null ? "(no minimum set)" : `(min ${inr(l.floorUnitPrice)}, −${inr(l.belowFloorBy)})`}</p>)}</td>
                                    <td className="px-4 py-3 text-gray-600">{fmtDateTime(d.createdAt)}</td>
                                    <td className="px-4 py-3"><Pill tone={d.status === "pending" ? "amber" : d.status === "approved" ? "green" : d.status === "rejected" ? "red" : "slate"}>{d.status}</Pill></td>
                                    <td className="px-4 py-3 text-right"><Btn variant="secondary" onClick={() => setOpen(d)}>{d.status === "pending" ? "Decide" : "View"}</Btn></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {open && <ApprovalDecision d={open} onClose={() => setOpen(null)} onDone={() => { setOpen(null); load(); }} />}
        </div>
    );
}

function ApprovalDecision({ d, onClose, onDone }: { d: any; onClose: () => void; onDone: () => void }) {
    const [commission, setCommission] = useState<Record<string, string>>(() => Object.fromEntries(d.lines.map((l: any) => [String(l.itemId), l.approvedCommissionPerUnit === null ? "" : String(l.approvedCommissionPerUnit)])));
    const [note, setNote] = useState("");
    const [err, setErr] = useState("");
    const [busy, setBusy] = useState(false);
    const pending = d.status === "pending";
    const allSet = d.lines.every((l: any) => commission[String(l.itemId)] !== "" && Number(commission[String(l.itemId)]) >= 0);
    const run = async (path: string, body: any) => {
        setBusy(true);
        setErr("");
        try {
            await A.post(path, body);
            onDone();
        } catch (e) {
            setErr(apiError(e).message);
        } finally {
            setBusy(false);
        }
    };
    return (
        <Modal open onClose={onClose} title={`Special price · ${d.quoteNumber} v${d.quoteVersion}`} wide>
            <div className="space-y-4 text-sm">
                {err && <Banner tone="red">{err}</Banner>}
                <div className="grid gap-3 sm:grid-cols-3">
                    <Info k="Partner" v={`${d.partner?.fullName} (${d.partner?.partnerCode})`} />
                    <Info k="Customer" v={d.customer?.name || "—"} />
                    <Info k="Quotation total" v={`${inr(d.quoteTotals?.quoted)} (listed ${inr(d.quoteTotals?.listed)})`} />
                    <Info k="Partner's reason" v={d.reason} wide />
                </div>
                <table className="min-w-full text-sm">
                    <thead className="text-left text-xs uppercase text-gray-500"><tr><th className="py-2 pr-4">Laptop</th><th className="py-2 px-3 text-right">Listed</th><th className="py-2 px-3 text-right">Minimum</th><th className="py-2 px-3 text-right">Asked</th><th className="py-2 pl-3 text-right whitespace-nowrap">Commission / unit (₹)</th></tr></thead>
                    <tbody className="divide-y divide-gray-100">
                        {d.lines.map((l: any) => (
                            <tr key={String(l.itemId)}>
                                <td className="py-2 pr-4">{l.quantity}× {l.title}</td>
                                <td className="py-2 px-3 text-right whitespace-nowrap">{inr(l.listedUnitPrice)}</td>
                                <td className="py-2 px-3 text-right whitespace-nowrap">{l.floorUnitPrice === null ? "Not set" : inr(l.floorUnitPrice)}</td>
                                <td className="py-2 px-3 text-right whitespace-nowrap font-semibold">{inr(l.requestedUnitPrice)}</td>
                                <td className="py-2 pl-3 text-right">
                                    {pending ? <input className={`${inputCls} w-28 text-right`} inputMode="decimal" value={commission[String(l.itemId)]} onChange={(e) => setCommission({ ...commission, [String(l.itemId)]: e.target.value.replace(/[^\d.]/g, "") })} placeholder="e.g. 0" /> : inr(l.approvedCommissionPerUnit)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {pending ? (
                    <>
                        <p className="text-xs text-gray-500">The commission rule pays ₹0 below the minimum, so set what the partner earns per laptop if this sale goes through (₹0 is allowed). It is fixed when the customer pays and still needs delivery and the return period.</p>
                        <Field label="Note (shown to the partner; required to reject)"><input className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
                        <div className="flex flex-wrap justify-end gap-2">
                            <Btn variant="danger" loading={busy} disabled={!note.trim()} onClick={() => run(`/admin/discount-requests/${d._id}/reject`, { reason: note })}>Reject</Btn>
                            <Btn loading={busy} disabled={!allSet} onClick={() => run(`/admin/discount-requests/${d._id}/approve`, { note: note || undefined, lines: d.lines.map((l: any) => ({ itemId: l.itemId, commissionPerUnit: Number(commission[String(l.itemId)]) })) })}>Approve special price</Btn>
                        </div>
                    </>
                ) : (
                    d.decision && <Banner tone={d.status === "approved" ? "green" : "red"}>{d.status} on {fmtDateTime(d.decision.at)}{d.decision.note ? `: ${d.decision.note}` : ""}</Banner>
                )}
            </div>
        </Modal>
    );
}

// ---------------------------------------------------------------- Quotations
function QuotationsTab() {
    const [status, setStatus] = useState("");
    const [q, setQ] = useState("");
    const { data, error } = useLoad<any>(() => A.get("/admin/partner-quotations", { ...(status ? { status } : {}), ...(q.trim() ? { q: q.trim() } : {}) }), [status, q]);
    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
                <input className={`${inputCls} w-64`} placeholder="Quotation number or customer" value={q} onChange={(e) => setQ(e.target.value)} />
                <select className={`${inputCls} w-52`} value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="">All (latest versions)</option>
                    {(["active", "pending_approval", "converted", "expired", "rejected", "cancelled", "superseded"] as const).map((s) => <option key={s} value={s}>{QUOTE_STATUS_LABEL[s]}</option>)}
                </select>
            </div>
            {error && <Banner tone="red">{error}</Banner>}
            {!data && !error && <Spinner />}
            {data && data.quotations.length === 0 && <Empty title="No quotations" />}
            {data && data.quotations.length > 0 && (
                <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500"><tr><th className="px-4 py-3">Quotation</th><th className="px-4 py-3">Partner</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Lines</th><th className="px-4 py-3 text-right">Quoted</th><th className="px-4 py-3 text-right">Discount</th><th className="px-4 py-3 text-right">Est. commission</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Created</th></tr></thead>
                        <tbody className="divide-y divide-gray-100">
                            {data.quotations.map((x: any) => (
                                <tr key={x._id}>
                                    <td className="px-4 py-3 font-mono">{x.quoteNumber} v{x.version}</td>
                                    <td className="px-4 py-3">{x.partner?.fullName} <span className="font-mono text-xs text-gray-400">{x.partner?.partnerCode}</span></td>
                                    <td className="px-4 py-3">{x.customer?.name}<p className="text-xs text-gray-500">{x.customer?.phone}</p></td>
                                    <td className="px-4 py-3">{x.items.map((i: any, n: number) => <p key={n} className="text-xs">{i.quantity}× {i.title} @ {inr(i.quotedUnitPrice)} <Pill tone={i.level === 3 ? "amber" : i.level === 2 ? "teal" : "slate"}>{PRICING_LEVEL_LABEL[i.level as 1 | 2 | 3]}</Pill></p>)}</td>
                                    <td className="px-4 py-3 text-right font-semibold">{inr(x.totals.quoted)}</td>
                                    <td className="px-4 py-3 text-right text-emerald-700">{inr(x.totals.discount)}</td>
                                    <td className="px-4 py-3 text-right">{inr(x.totals.estCommission)}</td>
                                    <td className="px-4 py-3"><Pill tone={quoteTone(x.status)}>{QUOTE_STATUS_LABEL[x.status as keyof typeof QUOTE_STATUS_LABEL]}</Pill>{x.convertedOrderNumber ? <p className="text-xs text-gray-500">{x.convertedOrderNumber}</p> : null}</td>
                                    <td className="px-4 py-3 text-gray-600">{fmtDateTime(x.createdAt)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// ---------------------------------------------------------------- Commissions
function CommissionsTab() {
    const [status, setStatus] = useState("");
    const [held, setHeld] = useState(false);
    const [order, setOrder] = useState("");
    const [sel, setSel] = useState<any>(null);
    const { data, error, load } = useLoad<any>(() => A.get("/admin/commissions", { ...(status ? { status } : {}), ...(held ? { hold: "1" } : {}), ...(order ? { order } : {}) }), [status, held, order]);
    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
                <select className={`${inputCls} w-48`} value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All statuses</option>{Object.entries(COMMISSION_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
                <button onClick={() => setHeld((h) => !h)} className={`rounded-lg border px-3 py-2 text-sm ${held ? "border-amber-400 bg-amber-50 text-amber-800" : "border-gray-300 bg-white"}`}>On hold only</button>
                <input className={`${inputCls} w-48`} placeholder="Order number" value={order} onChange={(e) => setOrder(e.target.value)} />
            </div>
            {error && <Banner tone="red">{error}</Banner>}
            {!data && !error && <Spinner />}
            {data && data.commissions.length === 0 && <Empty title="No commission lines" />}
            {data && data.commissions.length > 0 && (
                <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500"><tr><th className="px-4 py-3">Created</th><th className="px-4 py-3">Partner</th><th className="px-4 py-3">Order / line</th><th className="px-4 py-3 text-right">Unit price</th><th className="px-4 py-3 text-right">Commission</th><th className="px-4 py-3">Status</th><th /></tr></thead>
                        <tbody className="divide-y divide-gray-100">
                            {data.commissions.map((c: any) => (
                                <tr key={c._id}>
                                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{fmtDate(c.createdAt)}</td>
                                    <td className="px-4 py-3">{c.partner?.fullName} <span className="font-mono text-xs text-gray-400">{c.partner?.partnerCode}</span></td>
                                    <td className="px-4 py-3"><p className="font-mono text-xs">{c.orderNumber}</p><p className="text-xs text-gray-500">{c.productTitle} × {c.quantity} · {c.attribution?.type}</p></td>
                                    <td className="px-4 py-3 text-right">{inr(c.unitSellingPrice)}</td>
                                    <td className="px-4 py-3 text-right font-semibold">{inr(c.commission)}<p className="text-xs font-normal text-gray-400">{c.calcReason}{c.ruleVersion ? ` · v${c.ruleVersion}` : ""}</p></td>
                                    <td className="px-4 py-3"><Pill tone={statusTone(c.status)}>{COMMISSION_STATUS_LABEL[c.status as keyof typeof COMMISSION_STATUS_LABEL]}</Pill>{c.hold && <p className="mt-1 text-xs text-amber-700">Hold: {c.hold.reason}</p>}</td>
                                    <td className="px-4 py-3 text-right"><Btn variant="ghost" onClick={() => setSel(c)}>Review</Btn></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {sel && <CommissionReview c={sel} onClose={() => setSel(null)} onDone={() => { setSel(null); load(); }} />}
        </div>
    );
}

function CommissionReview({ c, onClose, onDone }: { c: any; onClose: () => void; onDone: () => void }) {
    const [text, setText] = useState("");
    const [err, setErr] = useState("");
    const [busy, setBusy] = useState(false);
    const run = async (path: string, body: any) => {
        setBusy(true);
        setErr("");
        try {
            await A.post(path, body);
            onDone();
        } catch (e) {
            setErr(apiError(e).message);
        } finally {
            setBusy(false);
        }
    };
    const reversible = ["pending", "delivery_confirmed", "eligible", "approved"].includes(c.status);
    return (
        <Modal open onClose={onClose} title={`Commission · ${c.orderNumber}`} wide>
            <div className="space-y-4 text-sm">
                {err && <Banner tone="red">{err}</Banner>}
                <div className="grid gap-3 sm:grid-cols-3">
                    <Info k="Partner" v={`${c.partner?.fullName} (${c.partner?.partnerCode})`} />
                    <Info k="Attribution" v={`${c.attribution?.type}${c.attribution?.code ? ` · ${c.attribution.code}` : ""}${c.attribution?.evidence ? ` · ${c.attribution.evidence}` : ""}`} />
                    <Info k="Captured" v={fmtDateTime(c.attribution?.capturedAt)} />
                    <Info k="Line" v={`${c.productTitle} × ${c.quantity} @ ${inr(c.unitSellingPrice)}`} wide />
                    <Info k="Commission" v={`${inr(c.commission)} (${c.calcReason})`} />
                    <Info k="Rule" v={c.ruleSnapshot ? `${c.ruleSnapshot.kind} v${c.ruleSnapshot.version}` : "none"} />
                    <Info k="Conflict with" v={c.attribution?.conflictWith?.length ? `${c.attribution.conflictWith.length} other partner(s)` : "—"} />
                </div>
                {c.hold && <Banner tone="amber">On hold: <b>{c.hold.reason}</b>{c.hold.detail ? ` (${c.hold.detail})` : ""} since {fmtDateTime(c.hold.at)}</Banner>}
                <Field label={c.hold ? "Note (required to clear hold)" : "Reason (required to reverse)"}><input className={inputCls} value={text} onChange={(e) => setText(e.target.value)} /></Field>
                <div className="flex flex-wrap gap-2 justify-end">
                    {c.hold && <Btn loading={busy} disabled={!text.trim()} onClick={() => run(`/admin/commissions/${c._id}/clear-hold`, { note: text })}>Clear hold</Btn>}
                    {reversible && <Btn variant="danger" loading={busy} disabled={!text.trim()} onClick={() => run(`/admin/commissions/${c._id}/reverse`, { reason: text })}>Reverse</Btn>}
                </div>
                <div>
                    <p className="font-semibold text-gray-900">History</p>
                    <ul className="mt-1 space-y-1 text-xs text-gray-600">{c.statusHistory?.map((h: any, i: number) => <li key={i}>{fmtDateTime(h.at)} · <b>{h.status}</b> · {h.reason}</li>)}{c.holdHistory?.map((h: any, i: number) => <li key={`h${i}`}>{fmtDateTime(h.clearedAt || h.at)} · hold {h.clearedAt ? "cleared" : "placed"}: {h.reason}{h.note ? ` · ${h.note}` : ""}</li>)}</ul>
                </div>
            </div>
        </Modal>
    );
}

// ---------------------------------------------------------------- Payouts (Phase 3)
const PAYOUT_SECTIONS = ["Approve", "Pay", "Payouts", "Adjustments", "Reconciliation"] as const;

function PayoutsTab() {
    const [section, setSection] = useState<(typeof PAYOUT_SECTIONS)[number]>("Approve");
    return (
        <div className="space-y-4">
            <Banner>Commission becomes <b>eligible</b> automatically (checked hourly) once the order is delivered, fully paid (COD balance collected), not cancelled or refunded, and the {""}return-window hold has passed. Finance approves it, creates a payout, transfers the money, then records the bank/UPI reference here. Finance and super admin only.</Banner>
            <div className="flex flex-wrap gap-2">
                {PAYOUT_SECTIONS.map((s, i) => (
                    <button key={s} onClick={() => setSection(s)} className={`rounded-full border px-3 py-1 text-sm ${section === s ? "border-blue-600 bg-blue-600 text-white" : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"}`}>{i < 3 ? `${i + 1}. ` : ""}{s}</button>
                ))}
            </div>
            {section === "Approve" && <ApproveSection />}
            {section === "Pay" && <PaySection />}
            {section === "Payouts" && <PayoutListSection />}
            {section === "Adjustments" && <AdjustmentsSection />}
            {section === "Reconciliation" && <ReconSection />}
        </div>
    );
}

const WAIT_LABEL: Record<string, string> = {
    hold_period: "inside the return-window hold",
    cod_not_collected: "COD balance not collected",
    not_delivered: "not delivered",
    not_paid: "not paid",
    cancellation_open: "cancellation open",
    refunded: "refunded",
    partner_not_active: "partner not active",
    order_missing: "order missing",
};

function ApproveSection() {
    const { data, error, load } = useLoad<any>(() => A.get("/admin/commissions", { status: "eligible" }), []);
    const [sel, setSel] = useState<Set<string>>(new Set());
    const [msg, setMsg] = useState<{ tone: "red" | "green" | "blue"; text: string } | null>(null);
    const [busy, setBusy] = useState(false);
    const rows = (data?.commissions || []) as any[];
    const approvable = rows.filter((c) => !c.hold);
    const total = rows.filter((c) => sel.has(c._id)).reduce((t, c) => t + c.commission, 0);
    const run = async () => {
        setBusy(true);
        setMsg(null);
        try {
            const r = await A.post("/admin/commissions/run-eligibility");
            const waiting = Object.entries(r.waiting || {}).map(([k, n]) => `${n} ${WAIT_LABEL[k] || k}`).join(", ");
            setMsg({ tone: "blue", text: `Checked ${r.checked} delivered line(s): ${r.madeEligible} became eligible.${waiting ? ` Waiting: ${waiting}.` : ""}` });
            load();
        } catch (e) {
            setMsg({ tone: "red", text: apiError(e).message });
        } finally {
            setBusy(false);
        }
    };
    const approve = async () => {
        setBusy(true);
        setMsg(null);
        try {
            const r = await A.post("/admin/commissions/approve", { ids: [...sel] });
            setMsg({ tone: "green", text: `${r.approved} line(s) approved${r.skipped ? `, ${r.skipped} skipped (no longer eligible or on hold)` : ""}. Next: 2. Pay.` });
            setSel(new Set());
            load();
        } catch (e) {
            setMsg({ tone: "red", text: apiError(e).message });
        } finally {
            setBusy(false);
        }
    };
    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
                <Btn variant="secondary" loading={busy} onClick={run}><RefreshCw className="w-4 h-4" />Check eligibility now</Btn>
                <Btn loading={busy} disabled={!sel.size} onClick={approve}>Approve {sel.size || ""} selected{sel.size ? ` (${inr(total)})` : ""}</Btn>
                {approvable.length > 0 && <button className="text-sm text-blue-600" onClick={() => setSel(new Set(approvable.map((c) => c._id)))}>Select all {approvable.length}</button>}
            </div>
            {msg && <Banner tone={msg.tone}>{msg.text}</Banner>}
            {error && <Banner tone="red">{error}</Banner>}
            {!data && !error && <Spinner />}
            {data && rows.length === 0 && <Empty title="Nothing eligible yet" text="Lines appear here after delivery, full payment and the return-window hold." />}
            {rows.length > 0 && (
                <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500"><tr><th className="px-4 py-3" /><th className="px-4 py-3">Partner</th><th className="px-4 py-3">Order</th><th className="px-4 py-3">Laptop</th><th className="px-4 py-3 text-right">Sold at</th><th className="px-4 py-3 text-right">Commission</th><th className="px-4 py-3">Rule</th><th className="px-4 py-3">Delivered</th></tr></thead>
                        <tbody className="divide-y divide-gray-100">
                            {rows.map((c) => (
                                <tr key={c._id}>
                                    <td className="px-4 py-3"><input type="checkbox" disabled={!!c.hold} checked={sel.has(c._id)} onChange={(e) => { const n = new Set(sel); if (e.target.checked) n.add(c._id); else n.delete(c._id); setSel(n); }} /></td>
                                    <td className="px-4 py-3">{c.partner?.fullName} <span className="font-mono text-xs text-gray-400">{c.partner?.partnerCode}</span></td>
                                    <td className="px-4 py-3 font-mono text-xs">{c.orderNumber}</td>
                                    <td className="px-4 py-3">{c.productTitle}{c.quantity > 1 ? ` × ${c.quantity}` : ""}{c.hold && <p className="text-xs text-amber-700">On hold: {c.hold.reason}</p>}</td>
                                    <td className="px-4 py-3 text-right">{inr(c.unitSellingPrice)}</td>
                                    <td className="px-4 py-3 text-right font-semibold">{inr(c.commission)}</td>
                                    <td className="px-4 py-3 text-xs text-gray-600">{c.calcReason}{c.ruleSnapshot ? ` v${c.ruleSnapshot.version}` : ""}</td>
                                    <td className="px-4 py-3 text-gray-600">{fmtDate(c.deliveredAt)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function PaySection() {
    const { data, error, load } = useLoad<any>(() => A.get("/admin/payouts/ready"), []);
    const [sel, setSel] = useState<Set<string>>(new Set());
    // One key per intended batch: a double click or a retry after a network
    // error sends the same key, so the server returns the same payouts.
    const [key, setKey] = useState(() => newIdempotencyKey());
    const [busy, setBusy] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [err, setErr] = useState("");
    const rows = (data?.partners || []) as any[];
    const payable = rows.filter((r) => r.payable);
    const chosen = payable.filter((r) => sel.has(String(r.ambassadorId)));
    const create = async () => {
        setBusy(true);
        setErr("");
        try {
            const r = await A.postIdempotent("/admin/payouts", key, { ambassadorIds: chosen.map((x) => x.ambassadorId) });
            setResult(r);
            setKey(newIdempotencyKey());
            setSel(new Set());
            load();
        } catch (e) {
            setErr(apiError(e).message);
        } finally {
            setBusy(false);
        }
    };
    return (
        <div className="space-y-3">
            {err && <Banner tone="red">{err}</Banner>}
            {result && <Banner tone="green">{result.replay ? "Already created (same request): " : "Created: "}{result.payouts.map((p: any) => `${p.payoutNumber} ${inr(p.net)}`).join(", ") || "no payouts"}.{result.skipped?.length ? ` Skipped: ${result.skipped.map((s: any) => `${s.partnerCode} (${s.reason})`).join(", ")}.` : ""} Transfer the money, then record the reference under 3. Payouts.</Banner>}
            {error && <Banner tone="red">{error}</Banner>}
            {!data && !error && <Spinner />}
            {data && rows.length === 0 && <Empty title="Nothing approved to pay" text="Approve eligible commission under 1. Approve." />}
            {rows.length > 0 && (
                <>
                    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500"><tr><th className="px-4 py-3" /><th className="px-4 py-3">Partner</th><th className="px-4 py-3">Pay to</th><th className="px-4 py-3 text-right">Commission</th><th className="px-4 py-3 text-right">Adjustments</th><th className="px-4 py-3 text-right">TDS</th><th className="px-4 py-3 text-right">Net to transfer</th><th className="px-4 py-3" /></tr></thead>
                            <tbody className="divide-y divide-gray-100">
                                {rows.map((r) => (
                                    <tr key={String(r.ambassadorId)} className={r.payable ? "" : "opacity-60"}>
                                        <td className="px-4 py-3"><input type="checkbox" disabled={!r.payable} checked={sel.has(String(r.ambassadorId))} onChange={(e) => { const n = new Set(sel); if (e.target.checked) n.add(String(r.ambassadorId)); else n.delete(String(r.ambassadorId)); setSel(n); }} /></td>
                                        <td className="px-4 py-3">{r.fullName} <span className="font-mono text-xs text-gray-400">{r.partnerCode}</span>{r.partnerStatus !== "active" && <p className="text-xs text-amber-700">Partner {r.partnerStatus}</p>}</td>
                                        <td className="px-4 py-3 text-xs">{r.method ? `${r.method === "upi" ? "UPI" : "Bank"} ${r.destinationMasked}` : "—"}</td>
                                        <td className="px-4 py-3 text-right">{inr(r.totals.gross)} <span className="text-xs text-gray-400">({r.commissionCount})</span></td>
                                        <td className="px-4 py-3 text-right">{r.totals.adjustments ? inr(r.totals.adjustments) : "—"}</td>
                                        <td className="px-4 py-3 text-right">{r.totals.tds ? `−${inr(r.totals.tds)} (${r.totals.tdsPercent}%)` : "—"}</td>
                                        <td className="px-4 py-3 text-right font-semibold">{inr(r.totals.net)}</td>
                                        <td className="px-4 py-3 text-xs text-amber-700">{r.blockedReason}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        {payable.length > 0 && <button className="text-sm text-blue-600" onClick={() => setSel(new Set(payable.map((x) => String(x.ambassadorId))))}>Select all {payable.length}</button>}
                        <Btn loading={busy} disabled={!chosen.length} onClick={create}>Create {chosen.length || ""} payout(s){chosen.length ? `: ${inr(chosen.reduce((t, x) => t + x.totals.net, 0))}` : ""}</Btn>
                        <span className="text-xs text-gray-500">Creating a payout locks those lines. To see full UPI/bank details for the transfer, use Partners → Reveal (audited).</span>
                    </div>
                </>
            )}
        </div>
    );
}

function PayoutListSection() {
    const [status, setStatus] = useState("processing");
    const { data, error, load } = useLoad<any>(() => A.get("/admin/payouts", status ? { status } : {}), [status]);
    const [action, setAction] = useState<{ kind: "paid" | "fail" | "view"; p: any } | null>(null);
    return (
        <div className="space-y-3">
            <select className={`${inputCls} w-52`} value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="processing">To transfer / confirm</option><option value="paid">Paid</option><option value="failed">Failed</option><option value="">All</option>
            </select>
            {error && <Banner tone="red">{error}</Banner>}
            {!data && !error && <Spinner />}
            {data && data.payouts.length === 0 && <Empty title="No payouts here" />}
            {data && data.payouts.length > 0 && (
                <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500"><tr><th className="px-4 py-3">Payout</th><th className="px-4 py-3">Partner</th><th className="px-4 py-3">Pay to</th><th className="px-4 py-3 text-right">Net</th><th className="px-4 py-3">Status</th><th className="px-4 py-3" /></tr></thead>
                        <tbody className="divide-y divide-gray-100">
                            {data.payouts.map((p: any) => (
                                <tr key={p._id}>
                                    <td className="px-4 py-3"><p className="font-mono">{p.payoutNumber}</p><p className="text-xs text-gray-500">{fmtDateTime(p.createdAt)} · {p.commissionCount} line(s){p.adjustmentCount ? ` · ${p.adjustmentCount} adj.` : ""}</p></td>
                                    <td className="px-4 py-3">{p.partnerName} <span className="font-mono text-xs text-gray-400">{p.partnerCode}</span></td>
                                    <td className="px-4 py-3 text-xs">{p.method === "upi" ? "UPI" : "Bank"} {p.destinationMasked}</td>
                                    <td className="px-4 py-3 text-right font-semibold">{inr(p.net)}{p.tds ? <p className="text-xs font-normal text-gray-500">after TDS {inr(p.tds)}</p> : null}</td>
                                    <td className="px-4 py-3"><Pill tone={p.status === "paid" ? "green" : p.status === "failed" ? "red" : "blue"}>{p.status}</Pill>{p.reference && <p className="text-xs text-gray-500">{p.reference} · {fmtDate(p.paidAt)}</p>}{p.failureReason && <p className="text-xs text-gray-500">{p.failureReason}</p>}</td>
                                    <td className="px-4 py-3 text-right whitespace-nowrap">
                                        <Btn variant="ghost" onClick={() => setAction({ kind: "view", p })}>Lines</Btn>
                                        {p.status === "processing" && <><Btn variant="secondary" onClick={() => setAction({ kind: "fail", p })}>Failed</Btn> <Btn onClick={() => setAction({ kind: "paid", p })}>Mark paid</Btn></>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {action && action.kind !== "view" && <PayoutAction kind={action.kind} p={action.p} onClose={() => setAction(null)} onDone={() => { setAction(null); load(); }} />}
            {action?.kind === "view" && <PayoutLines id={action.p._id} onClose={() => setAction(null)} />}
        </div>
    );
}

function PayoutAction({ kind, p, onClose, onDone }: { kind: "paid" | "fail"; p: any; onClose: () => void; onDone: () => void }) {
    const [text, setText] = useState("");
    const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [err, setErr] = useState("");
    const [busy, setBusy] = useState(false);
    const go = async () => {
        setBusy(true);
        setErr("");
        try {
            if (kind === "paid") await A.post(`/admin/payouts/${p._id}/mark-paid`, { reference: text, paidAt: (date === new Date().toISOString().slice(0, 10) ? new Date() : new Date(`${date}T12:00:00+05:30`)).toISOString() });
            else await A.post(`/admin/payouts/${p._id}/fail`, { reason: text });
            onDone();
        } catch (e) {
            setErr(apiError(e).message);
        } finally {
            setBusy(false);
        }
    };
    return (
        <Modal open onClose={onClose} title={`${kind === "paid" ? "Record payment" : "Transfer failed"} · ${p.payoutNumber}`}>
            <div className="space-y-3 text-sm">
                <p>{p.partnerName} · {p.method === "upi" ? "UPI" : "Bank"} {p.destinationMasked} · <b>{inr(p.net)}</b></p>
                {err && <Banner tone="red">{err}</Banner>}
                {kind === "paid" ? (
                    <>
                        <Field label="Bank / UPI reference (UTR)"><input className={inputCls} value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. 431298765432" /></Field>
                        <Field label="Paid on"><input type="date" className={inputCls} value={date} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setDate(e.target.value)} /></Field>
                        <p className="text-xs text-gray-500">Once recorded, a paid payout can&apos;t be changed. Corrections go in as adjustments on the next payout.</p>
                    </>
                ) : (
                    <>
                        <Field label="What went wrong?"><input className={inputCls} value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. UPI id inactive" /></Field>
                        <p className="text-xs text-gray-500">The lines go back to “Pay” so you can include them in a new payout once the details are fixed.</p>
                    </>
                )}
                <div className="flex justify-end gap-2"><Btn variant="secondary" onClick={onClose}>Cancel</Btn><Btn variant={kind === "fail" ? "danger" : "primary"} loading={busy} disabled={text.trim().length < (kind === "paid" ? 4 : 1)} onClick={go}>{kind === "paid" ? "Mark paid" : "Mark failed"}</Btn></div>
            </div>
        </Modal>
    );
}

function PayoutLines({ id, onClose }: { id: string; onClose: () => void }) {
    const { data, error } = useLoad<any>(() => A.get(`/admin/payouts/${id}`), [id]);
    return (
        <Modal open onClose={onClose} title={data ? `${data.payout.payoutNumber} · ${data.payout.partnerName}` : "Payout"} wide>
            {error && <Banner tone="red">{error}</Banner>}
            {!data && !error && <Spinner />}
            {data && (
                <div className="space-y-3 text-sm">
                    <table className="min-w-full"><tbody className="divide-y divide-gray-100">
                        {data.commissions.map((c: any) => <tr key={c._id}><td className="py-1.5 font-mono text-xs">{c.orderNumber}</td><td className="py-1.5">{c.productTitle}</td><td className="py-1.5 text-right">{inr(c.commission)}</td><td className="py-1.5 pl-3"><Pill tone={statusTone(c.status)}>{c.status}</Pill></td></tr>)}
                        {data.adjustments.map((a: any) => <tr key={a._id}><td className="py-1.5 text-xs">{a.kind}</td><td className="py-1.5">{a.reason}</td><td className="py-1.5 text-right">{inr(a.amount)}</td><td className="py-1.5 pl-3"><Pill tone="slate">{a.status}</Pill></td></tr>)}
                    </tbody></table>
                    <p className="text-right">Commission {inr(data.payout.gross)} · adjustments {inr(data.payout.adjustments)} · TDS {inr(data.payout.tds)} · <b>net {inr(data.payout.net)}</b></p>
                    <ul className="text-xs text-gray-500">{data.payout.statusHistory?.map((h: any, i: number) => <li key={i}>{fmtDateTime(h.at)} · {h.status}{h.note ? ` · ${h.note}` : ""}</li>)}</ul>
                </div>
            )}
        </Modal>
    );
}

function AdjustmentsSection() {
    const [status, setStatus] = useState("open");
    const { data, error, load } = useLoad<any>(() => A.get("/admin/partner-adjustments", status ? { status } : {}), [status]);
    const partners = useLoad<any>(() => A.get("/admin/partners", {}), []);
    const [f, setF] = useState({ ambassadorId: "", amount: "", reason: "" });
    const [msg, setMsg] = useState<{ tone: "red" | "green"; text: string } | null>(null);
    const [busy, setBusy] = useState(false);
    const add = async () => {
        setBusy(true);
        setMsg(null);
        try {
            await A.post("/admin/partner-adjustments", { ...f, amount: Number(f.amount) });
            setF({ ambassadorId: "", amount: "", reason: "" });
            setMsg({ tone: "green", text: "Adjustment added. It will be included in the partner's next payout." });
            load();
        } catch (e) {
            const x = apiError(e);
            setMsg({ tone: "red", text: Object.keys(x.errors).length ? Object.values(x.errors).join("; ") : x.message });
        } finally {
            setBusy(false);
        }
    };
    const voidIt = async (id: string) => {
        const reason = prompt("Why void this adjustment?");
        if (!reason) return;
        try { await A.post(`/admin/partner-adjustments/${id}/void`, { reason }); load(); } catch (e) { setMsg({ tone: "red", text: apiError(e).message }); }
    };
    return (
        <div className="space-y-4">
            <Card>
                <p className="font-semibold text-gray-900">New manual adjustment</p>
                <p className="text-xs text-gray-500">Clawbacks for orders reversed after payout are created automatically. Use this for anything else; negative amounts reduce the next payout.</p>
                {msg && <div className="mt-2"><Banner tone={msg.tone}>{msg.text}</Banner></div>}
                <div className="mt-3 grid gap-3 sm:grid-cols-4 items-end">
                    <Field label="Partner"><select className={inputCls} value={f.ambassadorId} onChange={(e) => setF({ ...f, ambassadorId: e.target.value })}><option value="">Choose…</option>{(partners.data?.partners || []).map((p: any) => <option key={p._id} value={p._id}>{p.fullName} ({p.partnerCode})</option>)}</select></Field>
                    <Field label="Amount ₹ (− to deduct)"><input className={inputCls} value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} placeholder="-500" /></Field>
                    <Field label="Reason" className="sm:col-span-2"><input className={inputCls} value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} /></Field>
                </div>
                <div className="mt-3 flex justify-end"><Btn loading={busy} disabled={!f.ambassadorId || !f.amount || f.reason.trim().length < 5} onClick={add}>Add adjustment</Btn></div>
            </Card>
            <select className={`${inputCls} w-48`} value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="open">Open</option><option value="in_payout">In a payout</option><option value="settled">Settled</option><option value="void">Void</option><option value="">All</option>
            </select>
            {error && <Banner tone="red">{error}</Banner>}
            {data && data.adjustments.length === 0 && <Empty title="No adjustments" />}
            {data && data.adjustments.length > 0 && (
                <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500"><tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Partner</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Reason</th><th className="px-4 py-3 text-right">Amount</th><th className="px-4 py-3">Status</th><th /></tr></thead>
                        <tbody className="divide-y divide-gray-100">
                            {data.adjustments.map((a: any) => (
                                <tr key={a._id}>
                                    <td className="px-4 py-3 text-gray-600">{fmtDate(a.createdAt)}</td>
                                    <td className="px-4 py-3">{a.partner?.fullName} <span className="font-mono text-xs text-gray-400">{a.partner?.partnerCode}</span></td>
                                    <td className="px-4 py-3">{a.kind}</td>
                                    <td className="px-4 py-3 max-w-md">{a.reason}{a.voidReason && <p className="text-xs text-gray-500">Void: {a.voidReason}</p>}</td>
                                    <td className={`px-4 py-3 text-right font-semibold ${a.amount < 0 ? "text-rose-700" : "text-emerald-700"}`}>{inr(a.amount)}</td>
                                    <td className="px-4 py-3"><Pill tone={a.status === "open" ? "amber" : a.status === "settled" ? "green" : "slate"}>{a.status}</Pill></td>
                                    <td className="px-4 py-3 text-right">{a.status === "open" && <Btn variant="ghost" onClick={() => voidIt(a._id)}>Void</Btn>}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function ReconSection() {
    const today = new Date().toISOString().slice(0, 10);
    const [from, setFrom] = useState(() => new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10));
    const [to, setTo] = useState(today);
    const { data, error } = useLoad<any>(() => A.get("/admin/payouts/reconciliation", { from, to }), [from, to]);
    const csv = () => {
        const head = ["payout", "partner", "status", "method", "destination", "created", "paid_at", "reference", "lines", "adjustments_count", "commission", "adjustments", "tds", "net", "consistent", "problems"];
        const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
        const lines = data.rows.map((r: any) => [r.payoutNumber, r.partnerCode, r.status, r.method, r.destinationMasked, r.createdAt, r.paidAt || "", r.reference || "", r.lines, r.adjustmentLines, r.gross, r.adjustments, r.tds, r.net, r.consistent, r.problems.join("; ")].map(esc).join(","));
        const blob = new Blob([[head.join(","), ...lines].join("\n")], { type: "text/csv" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `lapshark-partner-payouts-${from}-to-${to}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
    };
    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-end gap-3">
                <Field label="From"><input type="date" className={inputCls} value={from} max={to} onChange={(e) => setFrom(e.target.value)} /></Field>
                <Field label="To"><input type="date" className={inputCls} value={to} max={today} onChange={(e) => setTo(e.target.value)} /></Field>
                {data?.rows?.length > 0 && <Btn variant="secondary" onClick={csv}>Download CSV</Btn>}
            </div>
            {error && <Banner tone="red">{error}</Banner>}
            {!data && !error && <Spinner />}
            {data && (
                <>
                    <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
                        <Stat label={`Paid (${data.totals.paid.count})`} value={inr(data.totals.paid.net)} icon={Wallet} tone="teal" />
                        <Stat label="TDS deducted on paid" value={inr(data.totals.paid.tds)} icon={BadgeIndianRupee} tone="slate" />
                        <Stat label={`To confirm (${data.totals.processing.count})`} value={inr(data.totals.processing.net)} icon={RefreshCw} tone="blue" />
                        <Stat label="Checks failing" value={data.totals.inconsistent} icon={AlertTriangle} tone={data.totals.inconsistent ? "amber" : "slate"} />
                    </div>
                    {data.totals.inconsistent > 0 && <Banner tone="red">{data.totals.inconsistent} payout(s) don&apos;t add up. See the Problems column.</Banner>}
                    {data.rows.length === 0 ? <Empty title="No payouts in this period" /> : (
                        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500"><tr><th className="px-4 py-3">Payout</th><th className="px-4 py-3">Partner</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Reference</th><th className="px-4 py-3 text-right">Commission</th><th className="px-4 py-3 text-right">Adj.</th><th className="px-4 py-3 text-right">TDS</th><th className="px-4 py-3 text-right">Net</th><th className="px-4 py-3">Check</th></tr></thead>
                                <tbody className="divide-y divide-gray-100">
                                    {data.rows.map((r: any) => (
                                        <tr key={r._id}>
                                            <td className="px-4 py-3 font-mono">{r.payoutNumber}<p className="font-sans text-xs text-gray-500">{fmtDate(r.createdAt)}</p></td>
                                            <td className="px-4 py-3 font-mono text-xs">{r.partnerCode}</td>
                                            <td className="px-4 py-3"><Pill tone={r.status === "paid" ? "green" : r.status === "failed" ? "red" : "blue"}>{r.status}</Pill></td>
                                            <td className="px-4 py-3 text-xs">{r.reference || "—"}{r.paidAt ? <p className="text-gray-500">{fmtDate(r.paidAt)}</p> : null}</td>
                                            <td className="px-4 py-3 text-right">{inr(r.gross)}</td>
                                            <td className="px-4 py-3 text-right">{r.adjustments ? inr(r.adjustments) : "—"}</td>
                                            <td className="px-4 py-3 text-right">{r.tds ? inr(r.tds) : "—"}</td>
                                            <td className="px-4 py-3 text-right font-semibold">{inr(r.net)}</td>
                                            <td className="px-4 py-3">{r.consistent ? <Pill tone="green">OK</Pill> : <span className="text-xs text-rose-700">{r.problems.join(", ")}</span>}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

// ---------------------------------------------------------------- Laptop minimums (D17)
function MinimumsTab() {
    const [q, setQ] = useState("");
    const [onlyMissing, setOnlyMissing] = useState(false);
    const [editing, setEditing] = useState<any | null>(null);
    const { data, error, load } = useLoad<any>(() => A.get("/admin/laptop-minimums", q.trim() ? { q: q.trim() } : {}), [q]);
    const rows = (data?.laptops || []).filter((l: any) => !onlyMissing || !l.rule);
    return (
        <div className="space-y-4">
            <Banner>
                The <b>minimum</b> is the lowest price an Independent partner may agree with a customer on their own. RAM, SSD and warranty upgrades are added on top at full price. Below the minimum, the quotation comes to you under <b>Price approvals</b>. Commission = base + share% of the price above the minimum. Each change is a new rule version; past commissions keep the version they were calculated with.
            </Banner>
            {data && data.withoutMinimum > 0 && (
                <Banner tone="amber">
                    {data.withoutMinimum} laptop(s) in stock have no minimum of their own.{" "}
                    {data.defaultRule ? <>They use the default rule&apos;s minimum of <b>{inr(data.defaultRule.minimumPrice)}</b> for every laptop. Set each laptop&apos;s own minimum.</> : <>Partners can only quote these at the listed price; any discount needs your approval, and sales at the listed price have no commission rule (held for review).</>}
                </Banner>
            )}
            <div className="flex flex-wrap items-center gap-3">
                <input className={`${inputCls} w-72`} placeholder="Search laptops" value={q} onChange={(e) => setQ(e.target.value)} />
                <label className="flex items-center gap-2 text-sm text-gray-600"><input type="checkbox" checked={onlyMissing} onChange={(e) => setOnlyMissing(e.target.checked)} />Only laptops without a minimum</label>
            </div>
            {error && <Banner tone="red">{error}</Banner>}
            {!data && !error && <Spinner />}
            {data && rows.length === 0 && <Empty title={onlyMissing ? "Every laptop in stock has a minimum" : "No laptops in stock"} />}
            {data && rows.length > 0 && (
                <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500"><tr><th className="px-4 py-3">Laptop</th><th className="px-4 py-3 text-right">Stock</th><th className="px-4 py-3 text-right">Listed price</th><th className="px-4 py-3 text-right">Minimum</th><th className="px-4 py-3 text-right">Max discount</th><th className="px-4 py-3">Commission</th><th /></tr></thead>
                        <tbody className="divide-y divide-gray-100">
                            {rows.map((l: any) => {
                                const min = l.rule?.minimumPrice ?? null;
                                const room = min === null ? null : Math.max(0, l.listedPrice - min);
                                return (
                                    <tr key={l._id}>
                                        <td className="px-4 py-3 max-w-md"><p className="font-medium text-gray-900 line-clamp-2">{l.title}</p><p className="text-xs text-gray-500">{l.brand}</p></td>
                                        <td className="px-4 py-3 text-right">{l.stock}</td>
                                        <td className="px-4 py-3 text-right whitespace-nowrap">{inr(l.listedPrice)}</td>
                                        <td className="px-4 py-3 text-right whitespace-nowrap">
                                            {min === null ? <Pill tone="amber">Not set</Pill> : <b>{inr(min)}</b>}
                                            {min !== null && min > l.listedPrice && <p className="text-xs text-rose-600">above listed price</p>}
                                        </td>
                                        <td className="px-4 py-3 text-right whitespace-nowrap">{room === null ? "—" : `${inr(room)} (${l.listedPrice ? Math.round((room / l.listedPrice) * 100) : 0}%)`}</td>
                                        <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{l.rule ? `${inr(l.rule.baseCommission)} + ${l.rule.marginSharePercent}% · v${l.rule.version}` : l.skuRuleKind === "slab" ? "slab rule (no minimum)" : "—"}</td>
                                        <td className="px-4 py-3 text-right"><Btn variant={l.rule ? "secondary" : "primary"} onClick={() => setEditing(l)}>{l.rule ? "Change" : "Set minimum"}</Btn></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
            {editing && <MinimumEditor laptop={editing} fallback={data?.defaultRule} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
        </div>
    );
}

function MinimumEditor({ laptop, fallback, onClose, onSaved }: { laptop: any; fallback: any; onClose: () => void; onSaved: () => void }) {
    const start = laptop.rule || fallback;
    const [f, setF] = useState({
        minimumPrice: laptop.rule ? String(laptop.rule.minimumPrice) : "",
        baseCommission: start ? String(start.baseCommission) : "",
        marginSharePercent: start ? String(start.marginSharePercent) : "",
        notes: "",
    });
    const [err, setErr] = useState("");
    const [busy, setBusy] = useState(false);
    const min = Number(f.minimumPrice);
    const base = Number(f.baseCommission);
    const share = Number(f.marginSharePercent);
    const valid = f.minimumPrice !== "" && f.baseCommission !== "" && f.marginSharePercent !== "" && min > 0 && base >= 0 && share >= 0 && share <= 100;
    const atListed = valid && laptop.listedPrice >= min ? base + Math.floor(((laptop.listedPrice - min) * share) / 100) : null;
    const save = async () => {
        setBusy(true);
        setErr("");
        try {
            await A.post("/admin/commission-rules", { partnerType: "independent", kind: "margin_share", productId: laptop._id, minimumPrice: min, baseCommission: base, marginSharePercent: share, notes: f.notes || `Minimum for ${laptop.title}` });
            onSaved();
        } catch (e) {
            const x = apiError(e);
            setErr(Object.keys(x.errors).length ? `${x.message}: ${Object.values(x.errors).join("; ")}` : x.message);
        } finally {
            setBusy(false);
        }
    };
    return (
        <Modal open onClose={onClose} title={laptop.rule ? "Change minimum" : "Set minimum"} wide>
            <div className="space-y-4 text-sm">
                <p className="font-semibold text-gray-900">{laptop.title}</p>
                <p className="text-gray-600">Listed price today: <b>{inr(laptop.listedPrice)}</b> (base configuration, before upgrades)</p>
                {err && <Banner tone="red">{err}</Banner>}
                <div className="grid gap-3 sm:grid-cols-3">
                    <Field label="Minimum price ₹"><input className={inputCls} inputMode="numeric" value={f.minimumPrice} onChange={(e) => setF({ ...f, minimumPrice: e.target.value.replace(/[^0-9]/g, "") })} /></Field>
                    <Field label="Base commission ₹"><input className={inputCls} inputMode="numeric" value={f.baseCommission} onChange={(e) => setF({ ...f, baseCommission: e.target.value.replace(/[^0-9]/g, "") })} /></Field>
                    <Field label="Share above minimum %"><input className={inputCls} inputMode="numeric" value={f.marginSharePercent} onChange={(e) => setF({ ...f, marginSharePercent: e.target.value.replace(/[^0-9]/g, "") })} /></Field>
                </div>
                {valid && min > laptop.listedPrice && <Banner tone="amber">The minimum is above today&apos;s listed price, so partners get no room to negotiate on this laptop.</Banner>}
                {atListed !== null && (
                    <p className="rounded-lg bg-blue-50 px-3 py-2 text-blue-900">
                        Partners may discount up to <b>{inr(laptop.listedPrice - min)}</b>. Commission per laptop: <b>{inr(base)}</b> at the minimum, <b>{inr(atListed)}</b> at the listed price.
                    </p>
                )}
                <Field label="Note (optional)"><input className={inputCls} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} placeholder="e.g. Based on purchase + refurb cost, Nov batch" /></Field>
                <div className="flex justify-end gap-2">
                    <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
                    <Btn loading={busy} disabled={!valid} onClick={save}>{laptop.rule ? "Save new version" : "Set minimum"}</Btn>
                </div>
            </div>
        </Modal>
    );
}

// ---------------------------------------------------------------- Rules
function RulesTab() {
    const [showRetired, setShowRetired] = useState(false);
    const [editing, setEditing] = useState<any>(null);
    const { data, error, load } = useLoad<any>(() => A.get("/admin/commission-rules", showRetired ? {} : { status: "active" }), [showRetired]);
    const [preview, setPreview] = useState({ partnerType: "referral", sellingPrice: "25000", productId: "" });
    const [pv, setPv] = useState<any>(null);

    return (
        <div className="space-y-4">
            <Banner>No rule is active by default. The spec&apos;s pilot rates are offered as a template only; confirm real numbers against your SKU margins before activating. Editing a rule creates a new version; past commissions keep the version they were calculated with.</Banner>
            <div className="flex flex-wrap gap-2">
                <Btn onClick={() => setEditing({ partnerType: "referral", kind: "slab", productId: "", slabs: data?.template?.slabs || [], minimumPrice: "", baseCommission: "", marginSharePercent: "" })}>New referral rule (from template)</Btn>
                <Btn variant="secondary" onClick={() => setEditing({ partnerType: "independent", kind: "margin_share", productId: "", slabs: [], minimumPrice: "", baseCommission: "", marginSharePercent: "50" })}>New independent rule</Btn>
                <label className="ml-auto flex items-center gap-2 text-sm text-gray-600"><input type="checkbox" checked={showRetired} onChange={(e) => setShowRetired(e.target.checked)} />Show retired versions</label>
            </div>
            {error && <Banner tone="red">{error}</Banner>}
            {!data && !error && <Spinner />}
            {data && data.rules.length === 0 && <Empty title="No commission rules yet" text="Without an active rule, attributed sales are recorded at ₹0 and held for review." />}
            {data && data.rules.length > 0 && (
                <div className="grid gap-3 md:grid-cols-2">
                    {data.rules.map((r: any) => (
                        <Card key={r._id} className={r.status === "retired" ? "opacity-60" : ""}>
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <p className="font-semibold text-gray-900">{r.partnerType === "independent" ? "Independent" : "Referral"} · {r.product ? r.product.title : "Default (all products)"}</p>
                                    <p className="text-xs text-gray-500">{r.kind === "slab" ? "Price slabs" : "Base + margin share"} · v{r.version} · {r.status} · {fmtDate(r.createdAt)}</p>
                                </div>
                                {r.status === "active" && <div className="flex gap-1"><Btn variant="ghost" onClick={() => setEditing({ ...r, productId: r.productId || "" })}>Edit</Btn><Btn variant="ghost" onClick={async () => { if (confirm("Retire this rule? New sales will have no rule until you create one.")) { try { await A.post(`/admin/commission-rules/${r._id}/retire`); load(); } catch (e) { alert(apiError(e).message); } } }}>Retire</Btn></div>}
                            </div>
                            {r.kind === "slab" ? (
                                <table className="mt-3 w-full text-xs"><tbody>{r.slabs.map((s: any, i: number) => <tr key={i} className="border-t border-gray-100"><td className="py-1">{inr(s.minPrice)} – {s.maxPrice === null ? "and above" : inr(s.maxPrice)}</td><td className="py-1 text-right font-semibold">{inr(s.commission)}</td></tr>)}</tbody></table>
                            ) : (
                                <p className="mt-3 text-sm">Floor {inr(r.minimumPrice)} · base {inr(r.baseCommission)} · {r.marginSharePercent}% of price above floor</p>
                            )}
                        </Card>
                    ))}
                </div>
            )}

            <Card>
                <p className="font-semibold text-gray-900">Preview a commission</p>
                <div className="mt-3 flex flex-wrap gap-2 items-end">
                    <Field label="Partner type"><select className={inputCls} value={preview.partnerType} onChange={(e) => setPreview({ ...preview, partnerType: e.target.value })}><option value="referral">Referral</option><option value="independent">Independent</option></select></Field>
                    <Field label="Unit selling price ₹"><input className={inputCls} value={preview.sellingPrice} onChange={(e) => setPreview({ ...preview, sellingPrice: e.target.value })} /></Field>
                    <Field label="Product id (optional)"><input className={inputCls} value={preview.productId} onChange={(e) => setPreview({ ...preview, productId: e.target.value })} /></Field>
                    <Btn variant="secondary" onClick={async () => { try { setPv(await A.post("/admin/commission-rules/preview", { ...preview, sellingPrice: Number(preview.sellingPrice) })); } catch (e) { setPv({ error: apiError(e).message }); } }}>Calculate</Btn>
                </div>
                {pv && <p className="mt-3 text-sm">{pv.error ? <span className="text-rose-600">{pv.error}</span> : <>Commission <b>{inr(pv.commission)}</b> · {pv.reason}{pv.needsReview ? " · would be held for review" : ""}{pv.rule ? ` · rule v${pv.rule.version}` : " · no active rule"}</>}</p>}
            </Card>

            {editing && <RuleEditor rule={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
        </div>
    );
}

function RuleEditor({ rule, onClose, onSaved }: { rule: any; onClose: () => void; onSaved: () => void }) {
    const [r, setR] = useState<any>({ ...rule, slabs: (rule.slabs || []).map((s: any) => ({ ...s })) });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [msg, setMsg] = useState("");
    const [busy, setBusy] = useState(false);
    const isEdit = !!rule._id;
    const save = async () => {
        setBusy(true);
        setErrors({});
        setMsg("");
        const body: any = { partnerType: r.partnerType, productId: r.productId || null, kind: r.kind, notes: r.notes };
        if (r.kind === "slab") body.slabs = r.slabs.map((s: any) => ({ minPrice: Number(s.minPrice), maxPrice: s.maxPrice === "" || s.maxPrice === null ? null : Number(s.maxPrice), commission: Number(s.commission) }));
        else Object.assign(body, { minimumPrice: Number(r.minimumPrice), baseCommission: Number(r.baseCommission), marginSharePercent: Number(r.marginSharePercent) });
        try {
            if (isEdit) await A.patch(`/admin/commission-rules/${rule._id}`, body);
            else await A.post("/admin/commission-rules", body);
            onSaved();
        } catch (e) {
            const x = apiError(e);
            setErrors(x.errors);
            setMsg(x.message);
        } finally {
            setBusy(false);
        }
    };
    const setSlab = (i: number, k: string, v: string) => setR((x: any) => ({ ...x, slabs: x.slabs.map((s: any, j: number) => (j === i ? { ...s, [k]: v } : s)) }));
    return (
        <Modal open onClose={onClose} title={isEdit ? `New version of v${rule.version}` : "New commission rule"} wide>
            <div className="space-y-4 text-sm">
                {msg && <Banner tone="red">{msg}{Object.keys(errors).length ? `: ${Object.entries(errors).map(([k, v]) => `${k} ${v}`).join("; ")}` : ""}</Banner>}
                <div className="grid gap-3 sm:grid-cols-3">
                    <Field label="Partner type"><select disabled={isEdit} className={inputCls} value={r.partnerType} onChange={(e) => setR({ ...r, partnerType: e.target.value })}><option value="referral">Referral</option><option value="independent">Independent</option></select></Field>
                    <Field label="Model"><select className={inputCls} value={r.kind} onChange={(e) => setR({ ...r, kind: e.target.value })}><option value="slab">Price slabs</option><option value="margin_share">Base + margin share</option></select></Field>
                    <Field label="Product id (blank = default rule; use the Laptop minimums tab for one laptop)" error={errors.productId}><input disabled={isEdit} className={inputCls} value={r.productId || ""} onChange={(e) => setR({ ...r, productId: e.target.value.trim() })} /></Field>
                </div>
                {r.kind === "slab" ? (
                    <div className="space-y-2">
                        {r.slabs.map((s: any, i: number) => (
                            <div key={i} className="flex gap-2 items-end">
                                <Field label="From ₹"><input className={inputCls} value={s.minPrice} onChange={(e) => setSlab(i, "minPrice", e.target.value)} /></Field>
                                <Field label="To ₹ (blank = no limit)"><input className={inputCls} value={s.maxPrice ?? ""} onChange={(e) => setSlab(i, "maxPrice", e.target.value)} /></Field>
                                <Field label="Commission ₹"><input className={inputCls} value={s.commission} onChange={(e) => setSlab(i, "commission", e.target.value)} /></Field>
                                <Btn variant="ghost" onClick={() => setR((x: any) => ({ ...x, slabs: x.slabs.filter((_: any, j: number) => j !== i) }))}>Remove</Btn>
                            </div>
                        ))}
                        <Btn variant="secondary" onClick={() => setR((x: any) => ({ ...x, slabs: [...x.slabs, { minPrice: "", maxPrice: "", commission: "" }] }))}>Add slab</Btn>
                        <p className="text-xs text-gray-500">Slabs must ascend without overlap. Prices above the last bounded slab are held for review.</p>
                    </div>
                ) : (
                    <div className="grid gap-3 sm:grid-cols-3">
                        <Field label="Minimum approved price ₹ (floor)" error={errors.minimumPricePaise}><input className={inputCls} value={r.minimumPrice ?? ""} onChange={(e) => setR({ ...r, minimumPrice: e.target.value })} /></Field>
                        <Field label="Base commission ₹" error={errors.baseCommissionPaise}><input className={inputCls} value={r.baseCommission ?? ""} onChange={(e) => setR({ ...r, baseCommission: e.target.value })} /></Field>
                        <Field label="Share of price above floor %" error={errors.marginSharePercent}><input className={inputCls} value={r.marginSharePercent ?? ""} onChange={(e) => setR({ ...r, marginSharePercent: e.target.value })} /></Field>
                    </div>
                )}
                <Field label="Notes"><input className={inputCls} value={r.notes || ""} onChange={(e) => setR({ ...r, notes: e.target.value })} placeholder="e.g. Pilot rates approved on 12 Nov" /></Field>
                <div className="flex justify-end"><Btn loading={busy} onClick={save}>{isEdit ? "Save as new version" : "Activate rule"}</Btn></div>
            </div>
        </Modal>
    );
}

// ---------------------------------------------------------------- Tools
function ToolsTab() {
    const partners = useLoad<any>(() => A.get("/admin/partners", { status: "active" }), []);
    const [f, setF] = useState({ orderId: "", ambassadorId: "", evidence: "", override: false });
    const [res, setRes] = useState<{ tone: "red" | "green"; text: string } | null>(null);
    const [busy, setBusy] = useState(false);
    const [days, setDays] = useState("30");
    const attribute = async () => {
        setBusy(true);
        setRes(null);
        try {
            const r = await A.post("/admin/partner-attribution", f);
            setRes({ tone: "green", text: `Attributed: ${r.created} line(s) created${r.superseded ? `, ${r.superseded} superseded` : ""}.` });
        } catch (e) {
            const x = apiError(e);
            setRes({ tone: "red", text: x.message });
        } finally {
            setBusy(false);
        }
    };
    const reconcile = async () => {
        setBusy(true);
        setRes(null);
        try {
            const r = await A.post("/admin/partners/reconcile", { sinceDays: Number(days) });
            setRes({ tone: "green", text: `Checked ${r.orders} paid orders: ${r.created} commission line(s) created, ${r.delivered} delivered, ${r.reversed} reversed, ${r.errors} error(s).` });
        } catch (e) {
            setRes({ tone: "red", text: apiError(e).message });
        } finally {
            setBusy(false);
        }
    };
    return (
        <div className="space-y-4">
            {res && <Banner tone={res.tone}>{res.text}</Banner>}
            <Card>
                <p className="font-semibold text-gray-900">Manual attribution (offline or direct sales)</p>
                <p className="text-xs text-gray-500">Credit a paid order to a partner after checking the referral evidence. Audited.</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <Field label="Order number (LS-…)"><input className={inputCls} value={f.orderId} onChange={(e) => setF({ ...f, orderId: e.target.value })} /></Field>
                    <Field label="Partner"><select className={inputCls} value={f.ambassadorId} onChange={(e) => setF({ ...f, ambassadorId: e.target.value })}><option value="">Choose an active partner</option>{partners.data?.partners?.map((p: any) => <option key={p._id} value={p._id}>{p.fullName} ({p.partnerCode})</option>)}</select></Field>
                    <Field label="Evidence" className="sm:col-span-2"><input className={inputCls} value={f.evidence} onChange={(e) => setF({ ...f, evidence: e.target.value })} placeholder="e.g. Customer confirmed by phone on 12 Nov that Asha referred them" /></Field>
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.override} onChange={(e) => setF({ ...f, override: e.target.checked })} />Override an existing attribution</label>
                </div>
                <div className="mt-3 flex justify-end"><Btn loading={busy} onClick={attribute}>Attribute order</Btn></div>
            </Card>
            <Card>
                <p className="font-semibold text-gray-900 flex items-center gap-2"><RefreshCw className="w-4 h-4" />Reconcile commissions</p>
                <p className="text-xs text-gray-500">Re-checks recent paid orders and brings their commissions in line (creates missing lines, confirms deliveries, reverses cancellations). Safe to run any time; it never creates duplicates.</p>
                <div className="mt-3 flex gap-2 items-end"><Field label="Orders updated in the last (days)"><input className={`${inputCls} w-32`} value={days} onChange={(e) => setDays(e.target.value)} /></Field><Btn variant="secondary" loading={busy} onClick={reconcile}>Run</Btn></div>
            </Card>
        </div>
    );
}

// ---------------------------------------------------------------- Settings
function SettingsTab() {
    const { data, error, load } = useLoad<any>(() => A.get("/admin/partner-settings"), []);
    const [s, setS] = useState<any>(null);
    const [msg, setMsg] = useState<{ tone: "red" | "green"; text: string } | null>(null);
    const [busy, setBusy] = useState(false);
    useEffect(() => { if (data) setS({ ...data.settings, pilotAllowlist: (data.settings.pilotAllowlist || []).join("\n") }); }, [data]);
    if (error) return <Banner tone="red">{error}</Banner>;
    if (!s) return <Spinner />;
    const save = async () => {
        setBusy(true);
        setMsg(null);
        try {
            await A.put("/admin/partner-settings", {
                programmeEnabled: s.programmeEnabled,
                registrationOpen: s.registrationOpen,
                pilotAllowlist: String(s.pilotAllowlist).split(/[\s,]+/).filter(Boolean),
                leadOwnershipDays: Number(s.leadOwnershipDays),
                eligibilityHoldDays: Number(s.eligibilityHoldDays),
                quotationValidityHours: Number(s.quotationValidityHours),
                minimumAge: Number(s.minimumAge),
                agreementVersion: s.agreementVersion,
                referralBaseUrl: s.referralBaseUrl,
                foundingCohortSize: Number(s.foundingCohortSize),
                tdsPercent: Number(s.tdsPercent ?? 0),
            });
            setMsg({ tone: "green", text: "Settings saved." });
            load();
        } catch (e) {
            const x = apiError(e);
            setMsg({ tone: "red", text: `${x.message}${Object.keys(x.errors).length ? `: ${Object.entries(x.errors).map(([k, v]) => `${k} ${v}`).join("; ")}` : ""}` });
        } finally {
            setBusy(false);
        }
    };
    return (
        <Card className="space-y-4">
            <p className="font-semibold text-gray-900 flex items-center gap-2"><Settings2 className="w-4 h-4" />Programme settings (Super Admin)</p>
            {msg && <Banner tone={msg.tone}>{msg.text}</Banner>}
            <label className="flex items-start gap-3 text-sm"><input type="checkbox" className="mt-1" checked={s.programmeEnabled} onChange={(e) => setS({ ...s, programmeEnabled: e.target.checked })} /><span><b>Programme enabled</b>: partners can sign in, referral links are honoured, commissions are recorded.</span></label>
            <label className="flex items-start gap-3 text-sm"><input type="checkbox" className="mt-1" checked={s.registrationOpen} onChange={(e) => setS({ ...s, registrationOpen: e.target.checked })} /><span><b>Public registration open</b>. When off, only the pilot allowlist can apply.</span></label>
            <Field label="Pilot allowlist (10-digit mobiles, one per line)"><textarea rows={4} className={`${inputCls} font-mono`} value={s.pilotAllowlist} onChange={(e) => setS({ ...s, pilotAllowlist: e.target.value })} /></Field>
            <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Lead ownership (days)"><input className={inputCls} value={s.leadOwnershipDays} onChange={(e) => setS({ ...s, leadOwnershipDays: e.target.value })} /></Field>
                <Field label="Eligibility hold after delivery (days)" hint="Matches the 14-day return window"><input className={inputCls} value={s.eligibilityHoldDays} onChange={(e) => setS({ ...s, eligibilityHoldDays: e.target.value })} /></Field>
                <Field label="Quotation validity (hours)"><input className={inputCls} value={s.quotationValidityHours} onChange={(e) => setS({ ...s, quotationValidityHours: e.target.value })} /></Field>
                <Field label="Minimum age"><input className={inputCls} value={s.minimumAge} onChange={(e) => setS({ ...s, minimumAge: e.target.value })} /></Field>
                <Field label="Agreement version" hint="Changing it requires new applicants to accept the new version"><input className={inputCls} value={s.agreementVersion} onChange={(e) => setS({ ...s, agreementVersion: e.target.value })} /></Field>
                <Field label="Referral base URL"><input className={inputCls} value={s.referralBaseUrl} onChange={(e) => setS({ ...s, referralBaseUrl: e.target.value })} /></Field>
                <Field label="Founding cohort size" hint="Shown live on /partner as spots left. Approved + active partners count as taken. 0 hides the counter."><input className={inputCls} value={s.foundingCohortSize ?? 20} onChange={(e) => setS({ ...s, foundingCohortSize: e.target.value })} /></Field>
                <Field label="TDS on payouts (%)" hint="Deducted from each payout. Leave 0 until your accountant confirms the rate (decisions Q7)."><input className={inputCls} value={s.tdsPercent ?? 0} onChange={(e) => setS({ ...s, tdsPercent: e.target.value })} /></Field>
            </div>
            <div className="flex justify-end"><Btn loading={busy} onClick={save}>Save settings</Btn></div>
        </Card>
    );
}
