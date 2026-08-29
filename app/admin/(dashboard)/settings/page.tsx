"use client";

import React, { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Globe, CreditCard, Truck, BarChart3, Check, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { useStore } from '@/context/StoreContext';
import { api } from '@/api/api';

function AnalyticsSettings() {
    const { siteConfig, updateSiteConfig } = useStore();
    const [gaMeasurementId, setGaMeasurementId] = useState('');
    const [metaPixelId, setMetaPixelId] = useState('');
    const [clarityProjectId, setClarityProjectId] = useState('');
    const [metaCapiAccessToken, setMetaCapiAccessToken] = useState('');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // Sync local form state once siteConfig loads — the CAPI token field
    // stays blank even then, since the backend never sends the real value
    // back (see getSiteConfig); metaCapiAccessTokenSet is what drives the
    // "already configured" hint instead.
    useEffect(() => {
        if (!siteConfig?.analytics) return;
        setGaMeasurementId(siteConfig.analytics.gaMeasurementId || '');
        setMetaPixelId(siteConfig.analytics.metaPixelId || '');
        setClarityProjectId(siteConfig.analytics.clarityProjectId || '');
    }, [siteConfig?.analytics]);

    const handleSave = async () => {
        if (!siteConfig) return;
        setSaving(true);
        try {
            await updateSiteConfig({
                ...siteConfig,
                analytics: {
                    ...siteConfig.analytics,
                    gaMeasurementId,
                    metaPixelId,
                    clarityProjectId,
                    // Blank means "leave it as-is" — the backend preserves
                    // the existing token when this comes through empty.
                    metaCapiAccessToken,
                },
            });
            setMetaCapiAccessToken('');
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-6 flex items-start gap-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-lg"><BarChart3 className="w-6 h-6" /></div>
            <div className="flex-1">
                <h3 className="font-bold text-gray-900">Analytics & Tracking</h3>
                <p className="text-sm text-gray-500 mb-4">Paste in IDs from Google Analytics, Meta Events Manager, and Microsoft Clarity — takes effect within about a minute, no redeploy needed.</p>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">GA4 Measurement ID</label>
                        <input
                            className="w-full border rounded-lg p-2 text-sm font-mono"
                            placeholder="G-XXXXXXXXXX"
                            value={gaMeasurementId}
                            onChange={(e) => setGaMeasurementId(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Meta Pixel ID</label>
                        <input
                            className="w-full border rounded-lg p-2 text-sm font-mono"
                            placeholder="1234567890123456"
                            value={metaPixelId}
                            onChange={(e) => setMetaPixelId(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Microsoft Clarity Project ID</label>
                        <input
                            className="w-full border rounded-lg p-2 text-sm font-mono"
                            placeholder="abc123xyz"
                            value={clarityProjectId}
                            onChange={(e) => setClarityProjectId(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Meta Conversions API Token</label>
                        <input
                            type="password"
                            className="w-full border rounded-lg p-2 text-sm font-mono"
                            placeholder={siteConfig?.analytics?.metaCapiAccessTokenSet ? '•••••••• (configured — paste to replace)' : 'Paste access token'}
                            value={metaCapiAccessToken}
                            onChange={(e) => setMetaCapiAccessToken(e.target.value)}
                        />
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving || !siteConfig}
                    className="mt-4 bg-purple-600 text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
                >
                    {saved ? <><Check className="w-4 h-4" /> Saved</> : saving ? 'Saving...' : 'Save Analytics Settings'}
                </button>
            </div>
        </div>
    );
}

function authHeaders() {
    return { Authorization: `Bearer ${localStorage.getItem('token')}` };
}

// OPENAI_API_KEY management — written to the backend's .env file (never the
// database, never echoed back), same "paste to replace" UX as the Meta CAPI
// token field above. A "Test Connection" button verifies the key without
// spending on a real image edit (see openaiImageService.testConnection).
function AiImageSettings() {
    const [configured, setConfigured] = useState(false);
    const [keyPreview, setKeyPreview] = useState<string | null>(null);
    const [apiKey, setApiKey] = useState('');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

    const loadStatus = () => {
        api.get('/admin/ai-settings', { headers: authHeaders() })
            .then((res) => { setConfigured(res.data.configured); setKeyPreview(res.data.keyPreview); })
            .catch(() => { });
    };
    useEffect(loadStatus, []);

    const handleSave = async () => {
        if (!apiKey.trim()) return;
        setSaving(true);
        setTestResult(null);
        try {
            await api.put('/admin/ai-settings', { apiKey: apiKey.trim() }, { headers: authHeaders() });
            setApiKey('');
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
            loadStatus();
        } catch {
            setTestResult({ success: false, message: 'Could not save the API key.' });
        } finally {
            setSaving(false);
        }
    };

    const handleTest = async () => {
        setTesting(true);
        setTestResult(null);
        try {
            const res = await api.post('/admin/ai-settings/test', {}, { headers: authHeaders() });
            setTestResult(res.data);
        } catch {
            setTestResult({ success: false, message: 'Could not reach the server to test the connection.' });
        } finally {
            setTesting(false);
        }
    };

    return (
        <div className="p-6 flex items-start gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg"><Sparkles className="w-6 h-6" /></div>
            <div className="flex-1">
                <h3 className="font-bold text-gray-900">AI Image Processing (OpenAI)</h3>
                <p className="text-sm text-gray-500 mb-4">
                    API key for the OpenAI GPT Image 2 product-image pipeline. Saved to the backend server only — never stored in the database or sent to the browser.
                </p>
                <div className="max-w-md">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">OpenAI API Key</label>
                    <input
                        type="password"
                        className="w-full border rounded-lg p-2 text-sm font-mono"
                        placeholder={configured ? `${keyPreview} (configured — paste to replace)` : 'sk-...'}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        autoComplete="off"
                    />
                </div>
                <div className="flex items-center gap-3 mt-4">
                    <button
                        onClick={handleSave}
                        disabled={saving || !apiKey.trim()}
                        className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                    >
                        {saved ? <><Check className="w-4 h-4" /> Saved</> : saving ? 'Saving...' : 'Save API Key'}
                    </button>
                    <button
                        onClick={handleTest}
                        disabled={testing || !configured}
                        title={!configured ? 'Save an API key first' : 'Verify the key without generating an image'}
                        className="border border-gray-300 text-gray-700 px-5 py-2 rounded-lg text-sm font-bold hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2"
                    >
                        {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        Test Connection
                    </button>
                </div>
                {testResult && (
                    <p className={`text-sm mt-3 flex items-center gap-1 ${testResult.success ? 'text-green-600' : 'text-red-600'}`}>
                        {testResult.success ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        {testResult.message}
                    </p>
                )}
            </div>
        </div>
    );
}

export default function SettingsPage() {
    return (
        <div className="space-y-6 max-w-4xl">
            <h1 className="text-2xl font-bold text-gray-900">Store Settings</h1>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="grid divide-y divide-gray-100">
                    <AnalyticsSettings />
                    <AiImageSettings />
                    <div className="p-6 flex items-start gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Globe className="w-6 h-6" /></div>
                        <div className="flex-1">
                            <h3 className="font-bold text-gray-900">General Information</h3>
                            <p className="text-sm text-gray-500 mb-4">Store name, currency, and localization</p>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Store Name</label>
                                    <input className="w-full border rounded-lg p-2 text-sm" defaultValue="LAPSHARK" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Currency</label>
                                    <select className="w-full border rounded-lg p-2 text-sm">
                                        <option>INR (₹)</option>
                                        <option>USD ($)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 flex items-start gap-4">
                        <div className="p-3 bg-green-50 text-green-600 rounded-lg"><CreditCard className="w-6 h-6" /></div>
                        <div className="flex-1">
                            <h3 className="font-bold text-gray-900">Payments</h3>
                            <p className="text-sm text-gray-500 mb-4">Configure payment gateways</p>
                            <div className="space-y-2">
                                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer">
                                    <input type="checkbox" checked readOnly className="w-4 h-4 text-blue-600" />
                                    <span className="font-medium text-sm">Razorpay (Active)</span>
                                </label>
                                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer">
                                    <input type="checkbox" checked readOnly className="w-4 h-4 text-blue-600" />
                                    <span className="font-medium text-sm">Cash on Delivery (Active)</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 flex items-start gap-4">
                        <div className="p-3 bg-orange-50 text-orange-600 rounded-lg"><Truck className="w-6 h-6" /></div>
                        <div className="flex-1">
                            <h3 className="font-bold text-gray-900">Shipping</h3>
                            <p className="text-sm text-gray-500 mb-4">Shipping zones and rates</p>
                            <div className="bg-gray-50 p-4 rounded-lg text-sm">
                                <div className="flex justify-between mb-2">
                                    <span>Standard Shipping</span>
                                    <span className="font-bold">₹500</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Free Shipping Threshold</span>
                                    <span className="font-bold">₹10,000</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-gray-50 text-right">
                    <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700">Save Settings</button>
                </div>
            </div>
        </div>
    );
}
