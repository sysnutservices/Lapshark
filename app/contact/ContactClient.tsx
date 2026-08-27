"use client"

import React, { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send, MessageSquare, CheckCircle } from 'lucide-react';
import { SEO } from '@/components/SEO';
import { STORE_POLICIES } from '@/lib/policies';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';

export const ContactClient: React.FC = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        // Simulate API call
        setTimeout(() => {
            setIsSubmitting(false);
            setIsSuccess(true);
            setFormData({ name: '', email: '', subject: '', message: '' });
        }, 1500);
    };

    // Sourced from STORE_POLICIES / app/warranty & app/returns (the actual
    // policy pages) rather than restated by hand — this page previously
    // claimed batteries get a separate 3-month term (the warranty page says
    // batteries are covered under the same 6-month term, only if fully dead)
    // and a "No Questions Asked" return policy (the returns page lists real
    // eligibility conditions — it isn't unconditional).
    const faqs = [
        {
            question: "Do you offer a warranty on refurbished laptops?",
            answer: `Yes! All our laptops come with a comprehensive ${STORE_POLICIES.warrantyMonths}-month warranty covering hardware defects. ${STORE_POLICIES.batteryPolicyLabel}`
        },
        {
            question: "How long does shipping take?",
            answer: "We typically dispatch within 24 hours. Delivery takes 2-5 business days depending on your location in India."
        },
        {
            question: "Can I return the product if I don't like it?",
            answer: `Yes — you have ${STORE_POLICIES.returnDays} days from delivery to request a return, as long as the device is in its original condition with all accessories and the warranty seal intact.`
        },
        {
            question: "Are these laptops quality tested?",
            answer: `Every device undergoes a rigorous ${STORE_POLICIES.qualityCheckPoints}-point quality inspection by certified technicians before being listed.`
        }
    ];

    return (
        <div className="bg-slate-50 min-h-screen py-12 md:py-20 font-sans">


            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">Get in Touch</h1>
                    <p className="text-slate-500 max-w-2xl mx-auto text-lg leading-relaxed">
                        Have questions about a product or your order? We're here to help. {STORE_POLICIES.supportResponseLabel}
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 mb-20">
                    {/* Contact Info Cards */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 h-full">
                            <h3 className="text-xl font-bold text-slate-900 mb-8">Contact Information</h3>

                            <div className="space-y-8">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0">
                                        <Phone className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Phone Support</p>
                                        <a href="tel:+918971319555" className="text-lg font-bold text-slate-900 hover:text-teal-600 transition-colors block">
                                            +91 897 131 9555
                                        </a>
                                        <p className="text-sm text-slate-500 mt-1">{STORE_POLICIES.supportHoursLabel}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0">
                                        <Mail className="w-6 h-6" />
                                    </div>
                                    {/* min-w-0 on the flex child + wrap-anywhere on the address
                                        itself: "support@lapshark.com" has no space/hyphen to wrap
                                        at, so without either it forced this card 18px wider than
                                        the viewport at 320px instead of wrapping to a second line.
                                        Verified live: min-w-0 alone wasn't enough, needed both. */}
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Email Us</p>
                                        <a href="mailto:support@lapshark.com" className="text-lg font-bold text-slate-900 hover:text-teal-600 transition-colors block wrap-anywhere">
                                            support@lapshark.com
                                        </a>
                                        {/* Was "24/7 Response Time" — contradicted the phone card's real
                                            Mon-Sat hours and the page hero's own "within 2 hours during
                                            business hours" claim, with no support for a genuine 24/7
                                            commitment anywhere in the codebase. */}
                                        <p className="text-sm text-slate-500 mt-1">{STORE_POLICIES.supportResponseLabel}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                                        <MapPin className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Visit Store</p>
                                        <p className="text-base font-bold text-slate-900 leading-snug">
                                            Sysnut Technologies,<br />
                                            36, near Vidyapeeta Circle,<br />
                                            Ashok Nagar, Banashankari 1st Stage,<br />
                                            Bengaluru, Karnataka 560050
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="lg:col-span-2">
                        <div className="bg-white p-8 md:p-10 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden">

                            {isSuccess ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-10 animate-in fade-in zoom-in-95 duration-500">
                                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                                        <CheckCircle className="w-10 h-10 text-green-600" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Message Sent!</h3>
                                    <p className="text-slate-500 text-center max-w-sm">
                                        Thank you for reaching out. Our team will get back to you shortly at {formData.email || 'your email'}.
                                    </p>
                                    <button
                                        onClick={() => setIsSuccess(false)}
                                        className="mt-8 text-teal-600 font-bold hover:underline"
                                    >
                                        Send another message
                                    </button>
                                </div>
                            ) : null}

                            <h3 className="text-2xl font-bold text-slate-900 mb-8">Send us a Message</h3>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Your Name</label>
                                        <input
                                            type="text"
                                            name="name"
                                            required
                                            className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
                                            placeholder="John Doe"
                                            value={formData.name}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
                                        <input
                                            type="email"
                                            name="email"
                                            required
                                            className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
                                            placeholder="john@example.com"
                                            value={formData.email}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Subject</label>
                                    <select
                                        name="subject"
                                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all appearance-none cursor-pointer"
                                        value={formData.subject}
                                        onChange={handleChange}
                                    >
                                        <option value="">Select a topic</option>
                                        <option value="Order Status">Order Status</option>
                                        <option value="Warranty Claim">Warranty Claim</option>
                                        <option value="Product Inquiry">Product Inquiry</option>
                                        <option value="Returns">Returns & Refunds</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Message</label>
                                    <textarea
                                        name="message"
                                        required
                                        rows={5}
                                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all resize-none"
                                        placeholder="How can we help you?"
                                        value={formData.message}
                                        onChange={handleChange}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-teal-600 text-white font-bold py-4 rounded-xl hover:bg-teal-700 transition-all shadow-xl shadow-teal-200 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? (
                                        <span className="flex items-center gap-2">Processing...</span>
                                    ) : (
                                        <>
                                            <Send className="w-5 h-5" /> Send Message
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Map & FAQ Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                    {/* FAQ */}
                    <div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-6">Frequently Asked Questions</h3>
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
                    </div>

                    {/* Map Placeholder */}
                    <div className="bg-slate-200 rounded-3xl h-[400px] overflow-hidden relative shadow-inner border border-slate-300">
                        {/* Using an image placeholder for the map to keep it purely frontend without API keys */}
                        <iframe
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3888.583907765104!2d77.55394537599723!3d12.934458315693766!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae3e2a7706d87b%3A0x6b45566792372579!2sSysnut%20Technologies!5e0!3m2!1sen!2sin!4v1709462854035!5m2!1sen!2sin"
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            allowFullScreen={true}
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            className="filter grayscale contrast-125 opacity-90 hover:grayscale-0 hover:opacity-100 transition-all duration-500"
                        ></iframe>
                        <div className="absolute bottom-4 left-4 bg-white p-3 rounded-xl shadow-lg flex items-center gap-3">
                            <div className="bg-teal-600 text-white p-2 rounded-lg"><MapPin className="w-4 h-4" /></div>
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase">Our Location</p>
                                <p className="text-sm font-bold text-slate-900">Banashankari, Bengaluru</p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
