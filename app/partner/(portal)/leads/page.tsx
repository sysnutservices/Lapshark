"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell, FileText, Plus, Search } from "lucide-react";
import { usePartner } from "@/components/partner/PartnerContext";
import { apiError, inr, Lead, LeadActivity, LEAD_STATUS_LABEL, LeadStatus, partnerApi } from "@/lib/partnerApi";
import { Banner, Btn, Empty, Field, fmtDate, fmtDateTime, inputCls, Modal, Pill, Spinner, statusTone } from "@/components/partner/ui";

const EDITABLE: LeadStatus[] = ["new", "contacted", "qualified", "quotation_sent", "negotiation", "lost"];
const CUSTOMER_TYPES = [
    ["individual", "Individual"],
    ["professional", "Working professional"],
    ["student", "Student"],
    ["business", "Business"],
    ["other", "Other"],
];

const blank = { customerName: "", phone: "", email: "", location: "", customerType: "individual", requirements: "", preferredSpecs: "", budget: "", source: "", followUpAt: "", notes: "", consent: false };

export default function PartnerLeadsPage() {
    const [leads, setLeads] = useState<Lead[] | null>(null);
    const [total, setTotal] = useState(0);
    const [status, setStatus] = useState("");
    const [q, setQ] = useState("");
    const [due, setDue] = useState(false);
    const [error, setError] = useState("");
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState(blank);
    const [formErr, setFormErr] = useState<Record<string, string>>({});
    const [formMsg, setFormMsg] = useState("");
    const [saving, setSaving] = useState(false);
    const [notice, setNotice] = useState("");
    const [openId, setOpenId] = useState<string | null>(null);

    const load = useCallback(() => {
        const params: Record<string, string> = {};
        if (status) params.status = status;
        if (q.trim()) params.q = q.trim();
        if (due) params.due = "1";
        partnerApi.leads(params).then((r) => { setLeads(r.leads); setTotal(r.total); }).catch((e) => setError(apiError(e).message));
    }, [status, q, due]);

    useEffect(() => {
        const t = setTimeout(load, 250);
        return () => clearTimeout(t);
    }, [load]);

    useEffect(() => {
        const sp = new URLSearchParams(window.location.search);
        if (sp.get("new") === "1") setCreating(true);
        if (sp.get("due") === "1") setDue(true);
    }, []);

    const create = async () => {
        setSaving(true);
        setFormErr({});
        setFormMsg("");
        try {
            const r = await partnerApi.createLead({ ...form, followUpAt: form.followUpAt ? new Date(form.followUpAt).toISOString() : undefined });
            setCreating(false);
            setForm(blank);
            setNotice(r.notice || `Lead added. You own this customer until ${fmtDate(r.lead.ownershipExpiresAt)}.`);
            load();
        } catch (e) {
            const x = apiError(e);
            setFormErr(x.errors);
            setFormMsg(x.message);
        } finally {
            setSaving(false);
        }
    };

    const f = (k: keyof typeof blank, v: string | boolean) => setForm((s) => ({ ...s, [k]: v }));

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
                <div>
                    <h1 className="text-xl font-medium text-slate-900">My customers</h1>
                    <p className="text-sm text-slate-500">{total} leads. A lead you register is yours for 30 days; their orders are credited to you.</p>
                </div>
                <Btn onClick={() => setCreating(true)}><Plus className="w-4 h-4" />Add customer lead</Btn>
            </div>

            <div className="flex flex-wrap gap-2">
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input className={`${inputCls} pl-9 w-56`} placeholder="Name or phone" value={q} onChange={(e) => setQ(e.target.value)} />
                </div>
                <select className={`${inputCls} w-44`} value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="">All stages</option>
                    {(Object.keys(LEAD_STATUS_LABEL) as LeadStatus[]).map((s) => <option key={s} value={s}>{LEAD_STATUS_LABEL[s]}</option>)}
                </select>
                <button onClick={() => setDue((d) => !d)} className={`inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm ${due ? "border-amber-400 bg-amber-50 text-amber-800" : "border-slate-300 bg-white text-slate-600"}`}><Bell className="w-4 h-4" />Follow-ups due</button>
            </div>

            {notice && <Banner tone="green">{notice}</Banner>}
            {error && <Banner tone="red">{error}</Banner>}
            {!leads && !error && <Spinner />}
            {leads && leads.length === 0 && <Empty title="No leads yet" text="Add the people who asked you about laptops. Their orders will be credited to you." action={<Btn onClick={() => setCreating(true)}>Add your first lead</Btn>} />}

            {leads && leads.length > 0 && (
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-50 text-left text-xs text-slate-500">
                            <tr><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Stage</th><th className="px-4 py-3">Budget</th><th className="px-4 py-3">Follow-up</th><th className="px-4 py-3">Owned until</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {leads.map((l) => (
                                <tr key={l._id} className="hover:bg-slate-50 cursor-pointer" onClick={() => setOpenId(l._id)}>
                                    <td className="px-4 py-3"><p className="font-medium text-slate-900">{l.customerName}</p><p className="text-xs text-slate-500">{l.phone}{l.location ? ` · ${l.location}` : ""}</p></td>
                                    <td className="px-4 py-3"><Pill tone={statusTone(l.status)}>{LEAD_STATUS_LABEL[l.status]}</Pill>{l.existingCustomer && <span className="ml-2"><Pill tone="amber">Existing customer</Pill></span>}</td>
                                    <td className="px-4 py-3">{inr(l.budget)}</td>
                                    <td className={`px-4 py-3 ${l.followUpAt && new Date(l.followUpAt) < new Date() && l.status !== "won" && l.status !== "lost" ? "text-amber-700 font-medium" : "text-slate-600"}`}>{fmtDateTime(l.followUpAt)}</td>
                                    <td className="px-4 py-3">{l.ownershipActive ? fmtDate(l.ownershipExpiresAt) : <span className="text-slate-400">Expired</span>}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <Modal open={creating} onClose={() => setCreating(false)} title="Add customer lead" wide>
                <div className="grid gap-4 sm:grid-cols-2">
                    {formMsg && <div className="sm:col-span-2"><Banner tone="red">{formMsg}</Banner></div>}
                    <Field label="Customer name" error={formErr.customerName}><input className={inputCls} value={form.customerName} onChange={(e) => f("customerName", e.target.value)} /></Field>
                    <Field label="Mobile number" error={formErr.phone}><input inputMode="tel" className={inputCls} value={form.phone} onChange={(e) => f("phone", e.target.value)} placeholder="98765 43210" /></Field>
                    <Field label="Email (optional)" error={formErr.email}><input type="email" className={inputCls} value={form.email} onChange={(e) => f("email", e.target.value)} /></Field>
                    <Field label="Location (optional)"><input className={inputCls} value={form.location} onChange={(e) => f("location", e.target.value)} placeholder="Whitefield, Bengaluru" /></Field>
                    <Field label="Customer type"><select className={inputCls} value={form.customerType} onChange={(e) => f("customerType", e.target.value)}>{CUSTOMER_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Field>
                    <Field label="Budget in ₹ (optional)" error={formErr.budget}><input inputMode="numeric" className={inputCls} value={form.budget} onChange={(e) => f("budget", e.target.value.replace(/[^\d]/g, ""))} /></Field>
                    <Field label="What do they need?" className="sm:col-span-2"><textarea rows={2} className={inputCls} value={form.requirements} onChange={(e) => f("requirements", e.target.value)} placeholder="e.g. Laptop for Java development, light, good battery" /></Field>
                    <Field label="Preferred specs (optional)"><input className={inputCls} value={form.preferredSpecs} onChange={(e) => f("preferredSpecs", e.target.value)} placeholder="16GB RAM, i5 or better" /></Field>
                    <Field label="Where did this lead come from?"><input className={inputCls} value={form.source} onChange={(e) => f("source", e.target.value)} placeholder="Colleague, WhatsApp group…" /></Field>
                    <Field label="Follow-up (optional)" error={formErr.followUpAt}><input type="datetime-local" className={inputCls} value={form.followUpAt} onChange={(e) => f("followUpAt", e.target.value)} /></Field>
                    <Field label="Notes (optional)"><input className={inputCls} value={form.notes} onChange={(e) => f("notes", e.target.value)} /></Field>
                    <label className="sm:col-span-2 flex items-start gap-3 text-sm text-slate-800">
                        <input type="checkbox" className="mt-1" checked={form.consent} onChange={(e) => f("consent", e.target.checked)} />
                        The customer has agreed to be contacted by Lapshark about laptops.
                    </label>
                    {formErr.consent && <p className="sm:col-span-2 -mt-3 text-xs text-rose-600">{formErr.consent}</p>}
                    <div className="sm:col-span-2 flex justify-end gap-2"><Btn variant="secondary" onClick={() => setCreating(false)}>Cancel</Btn><Btn onClick={create} loading={saving}>Save lead</Btn></div>
                </div>
            </Modal>

            {openId && <LeadDrawer id={openId} onClose={() => setOpenId(null)} onChanged={load} />}
        </div>
    );
}

function LeadDrawer({ id, onClose, onChanged }: { id: string; onClose: () => void; onChanged: () => void }) {
    const { profile } = usePartner();
    const independent = profile.partnerType === "independent";
    const [lead, setLead] = useState<Lead | null>(null);
    const [acts, setActs] = useState<LeadActivity[]>([]);
    const [note, setNote] = useState("");
    const [followUp, setFollowUp] = useState("");
    const [lostReason, setLostReason] = useState("");
    const [err, setErr] = useState("");
    const [busy, setBusy] = useState(false);

    const load = useCallback(() => {
        partnerApi.lead(id).then((r) => {
            setLead(r.lead);
            setActs(r.activities);
            setFollowUp(r.lead.followUpAt ? new Date(r.lead.followUpAt).toISOString().slice(0, 16) : "");
        }).catch((e) => setErr(apiError(e).message));
    }, [id]);
    useEffect(load, [load]);

    const run = async (fn: () => Promise<unknown>) => {
        setBusy(true);
        setErr("");
        try {
            await fn();
            load();
            onChanged();
        } catch (e) {
            setErr(apiError(e).message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <Modal open onClose={onClose} title={lead ? lead.customerName : "Lead"} wide>
            {!lead ? <Spinner /> : (
                <div className="space-y-5">
                    {err && <Banner tone="red">{err}</Banner>}
                    <div className="grid gap-3 sm:grid-cols-3 text-sm">
                        <div><p className="text-xs text-slate-400">Phone</p><a href={`tel:${lead.phone}`} className="font-medium text-[#0f766e]">{lead.phone}</a></div>
                        <div><p className="text-xs text-slate-400">Budget</p><p className="font-medium">{inr(lead.budget)}</p></div>
                        <div><p className="text-xs text-slate-400">Owned until</p><p className="font-medium">{lead.ownershipActive ? fmtDate(lead.ownershipExpiresAt) : "Expired"}</p></div>
                        {lead.requirements && <div className="sm:col-span-3"><p className="text-xs text-slate-400">Needs</p><p>{lead.requirements}</p></div>}
                        {lead.preferredSpecs && <div className="sm:col-span-3"><p className="text-xs text-slate-400">Preferred specs</p><p>{lead.preferredSpecs}</p></div>}
                    </div>

                    {independent && lead.status !== "won" && lead.status !== "lost" && lead.ownershipActive && (
                        <Link href={`/partner/quotations/new?lead=${lead._id}`} className="inline-flex items-center gap-2 rounded-lg bg-[#0f766e] px-4 py-2 text-sm font-medium text-white hover:bg-[#115e59]">
                            <FileText className="w-4 h-4" /> Create quotation for {lead.customerName.split(" ")[0]}
                        </Link>
                    )}
                    {lead.status === "won" ? (
                        <Banner tone="green">This customer placed an order credited to you.</Banner>
                    ) : (
                        <div className="rounded-lg border border-slate-200 p-4 space-y-3">
                            <p className="text-sm font-medium text-slate-900">Stage</p>
                            <div className="flex flex-wrap gap-2">
                                {EDITABLE.map((s) => (
                                    <button key={s} disabled={busy || (s === "lost" && !lostReason.trim())} onClick={() => run(() => partnerApi.updateLead(id, s === "lost" ? { status: s, lostReason } : { status: s }))} className={`rounded-full px-3 py-1 text-xs font-medium border disabled:opacity-40 ${lead.status === s ? "bg-[#0f766e] text-white border-[#0f766e]" : "border-slate-300 text-slate-700 hover:bg-slate-50"}`}>{LEAD_STATUS_LABEL[s]}</button>
                                ))}
                            </div>
                            <input className={inputCls} placeholder="Reason, if marking as lost" value={lostReason} onChange={(e) => setLostReason(e.target.value)} />
                            <div className="flex gap-2 items-end">
                                <Field label="Follow-up" className="flex-1"><input type="datetime-local" className={inputCls} value={followUp} onChange={(e) => setFollowUp(e.target.value)} /></Field>
                                <Btn variant="secondary" loading={busy} onClick={() => run(() => partnerApi.updateLead(id, { followUpAt: followUp ? new Date(followUp).toISOString() : null }))}>Save</Btn>
                            </div>
                            <p className="text-xs text-slate-500">&quot;Won&quot; is set automatically when the customer&apos;s order is paid.</p>
                        </div>
                    )}

                    <div>
                        <p className="text-sm font-medium text-slate-900">Activity</p>
                        <div className="mt-2 flex gap-2">
                            <input className={inputCls} placeholder="Add a note (call summary, objections…)" value={note} onChange={(e) => setNote(e.target.value)} />
                            <Btn disabled={!note.trim()} loading={busy} onClick={() => run(async () => { await partnerApi.addNote(id, note); setNote(""); })}>Add</Btn>
                        </div>
                        <ul className="mt-3 space-y-2 max-h-64 overflow-y-auto">
                            {acts.map((a) => (
                                <li key={a._id} className="text-sm border-l-2 border-slate-200 pl-3">
                                    <p className="text-slate-800">{a.description}</p>
                                    <p className="text-xs text-slate-400">{fmtDateTime(a.createdAt)} · {a.actorType === "system" ? "Lapshark" : a.actorType === "staff" ? "Lapshark team" : "You"}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </Modal>
    );
}
