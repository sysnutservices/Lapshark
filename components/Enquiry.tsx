import { useState } from 'react';
import { AlertCircle, CheckCircle, X } from 'lucide-react';
interface LoanEnquirySuccessProps {
    closeEnquiry?: () => void;
}


export function LoanEnquirySuccess({ closeEnquiry }: LoanEnquirySuccessProps) {
    const closeEnquiryModal = () => {
        closeEnquiry?.();
    };

    return (
        <div className="flex items-center justify-center p-4">
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-opacity-50 transition-opacity"
                onClick={closeEnquiryModal}
            />

            {/* Popup Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 transform transition-all">
                {/* Close Button */}
                <button
                    onClick={closeEnquiryModal}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                >
                    <X size={24} />
                </button>

                {/* Success Icon */}
                <div className="flex justify-center mb-6">
                    <div className="rounded-full bg-green-100 p-3">
                        <CheckCircle size={64} className="text-green-600" />
                    </div>
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-center text-slate-800 mb-3">
                    Enquiry Submitted Successfully!
                </h2>

                {/* Message */}
                <p className="text-center text-slate-600 mb-6">
                    Thank you for your loan enquiry. Our team will review your application and get back to you within 24-48 hours.
                </p>
                {/* Action Buttons */}
                <div className="space-y-3">
                    <button
                        onClick={closeEnquiryModal}
                        className="w-full bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 transition-colors"
                    >
                        Continue
                    </button>
                </div>

                {/* Footer Note */}
                <p className="text-xs text-center text-slate-500 mt-6">
                    You will receive a confirmation email shortly
                </p>
            </div>
        </div>
    );
}

export function LoanEnquiryAlreadySuccess({ closeEnquiry }: LoanEnquirySuccessProps) {
    const closeEnquiryModal = () => {
        closeEnquiry?.();
    };

    return (
        <div className="flex items-center justify-center p-4">
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-opacity-50 transition-opacity"
                onClick={closeEnquiryModal}
            />

            {/* Popup Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 transform transition-all">
                {/* Close Button */}
                <button
                    onClick={closeEnquiryModal}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                >
                    <X size={24} />
                </button>

                {/* Success Icon */}
                <div className="flex justify-center mb-6">
                    <div className="rounded-full bg-orange-100 p-3">
                        <AlertCircle size={64} className="text-orange-600" />
                    </div>
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-center text-slate-800 mb-3">
                    Enquiry Already Submitted!
                </h2>

                {/* Message */}
                <p className="text-center text-slate-600 mb-6">
                    You have already submitted a loan enquiry. Our team is currently reviewing your application and will contact you soon.
                </p>
                {/* Action Buttons */}
                <div className="space-y-3">
                    <button
                        onClick={closeEnquiryModal}
                        className="w-full bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 transition-colors"
                    >
                        Continue
                    </button>
                </div>

                {/* Footer Note */}
                <p className="text-xs text-center text-slate-500 mt-6">
                    We typically respond within 24-48 hours
                </p>
            </div>
        </div>
    );
}