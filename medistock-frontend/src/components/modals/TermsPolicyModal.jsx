import React, { useState } from 'react';
import { X, ShieldCheck, FileText, Lock, CheckCircle2 } from 'lucide-react';

export const TermsPolicyModal = ({ isOpen, onClose, initialTab = 'terms' }) => {
    const [activeTab, setActiveTab] = useState(initialTab);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
                            {activeTab === 'terms' ? <FileText size={18} /> : <Lock size={18} />}
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900">
                                {activeTab === 'terms' ? 'Terms & Conditions of Service' : 'Privacy & Clinical Data Policy'}
                            </h3>
                            <p className="text-xs text-slate-500">
                                MediStock Clinical Inventory Compliance Framework (Revision 2026.1)
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Tab Switcher */}
                <div className="flex border-b border-slate-100 bg-slate-50/50 px-6 pt-2">
                    <button
                        onClick={() => setActiveTab('terms')}
                        className={`pb-3 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                            activeTab === 'terms'
                                ? 'border-teal-600 text-teal-800'
                                : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        Terms & Conditions
                    </button>
                    <button
                        onClick={() => setActiveTab('privacy')}
                        className={`pb-3 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                            activeTab === 'privacy'
                                ? 'border-teal-600 text-teal-800'
                                : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        Privacy Policy (HIPAA / GxP)
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-600 leading-relaxed">
                    {activeTab === 'terms' ? (
                        <>
                            <div className="p-3.5 rounded-2xl bg-teal-50/70 border border-teal-200/80 text-teal-900 flex items-start gap-2.5">
                                <ShieldCheck size={18} className="shrink-0 text-teal-700 mt-0.5" />
                                <p className="text-xs leading-snug">
                                    <strong>Authorized Practitioner Access Only:</strong> Access to this platform is restricted to licensed healthcare personnel, certified pharmacists, and hospital procurement staff.
                                </p>
                            </div>

                            <h4 className="text-sm font-bold text-slate-800 pt-1">1. Clinical Inventory & Formulary Integrity</h4>
                            <p>
                                By accessing MediStock, you agree that all lot updates, dosage verification entries, and disposal records submitted through your account are accurate and reflect verified physical stock counts in compliance with DEA, FDA, and hospital guidelines.
                            </p>

                            <h4 className="text-sm font-bold text-slate-800 pt-1">2. Audit Logging & Immutable Traceability</h4>
                            <p>
                                Every stock adjustment, prescription dispensing event, and temperature telemetry override is cryptographically logged with your practitioner digital signature, timestamp, and IP address for 21 CFR Part 11 and GxP compliance.
                            </p>

                            <h4 className="text-sm font-bold text-slate-800 pt-1">3. Credential Security</h4>
                            <p>
                                Staff credentials may not be shared under any circumstances. Concurrent session detection and automatic 15-minute idle sign-outs are enforced for hospital ward safety.
                            </p>

                            <h4 className="text-sm font-bold text-slate-800 pt-1">4. Emergency Override Protocol</h4>
                            <p>
                                Emergency medication access during Code Blue or trauma surges must be verified post-intervention within 12 hours by the attending charge nurse or supervising pharmacist.
                            </p>
                        </>
                    ) : (
                        <>
                            <div className="p-3.5 rounded-2xl bg-cyan-50/70 border border-cyan-200/80 text-cyan-900 flex items-start gap-2.5">
                                <Lock size={18} className="shrink-0 text-cyan-700 mt-0.5" />
                                <p className="text-xs leading-snug">
                                    <strong>Data Protection & PHI Safeguards:</strong> MediStock adheres to strict HIPAA, HITECH, and GDPR clinical data privacy standards. All telemetry and transaction data is encrypted with AES-256.
                                </p>
                            </div>

                            <h4 className="text-sm font-bold text-slate-800 pt-1">1. Information We Collect</h4>
                            <p>
                                MediStock collects authorized practitioner identification (name, board license number, institutional email), hospital site assignment, and operational event metadata needed for prescription traceability.
                            </p>

                            <h4 className="text-sm font-bold text-slate-800 pt-1">2. Protection of Health Information (PHI)</h4>
                            <p>
                                Patient data associated with medication dispenses is de-identified and encrypted both in transit (TLS 1.3) and at rest. No protected health information is ever sold or utilized for third-party marketing.
                            </p>

                            <h4 className="text-sm font-bold text-slate-800 pt-1">3. Cold-Chain Sensor Telemetry</h4>
                            <p>
                                Refrigeration unit temperatures, humidity sensors, and equipment telemetry are transmitted in real time to prevent vaccine and biologic degradation. Environmental records are archived for 7 years per regulatory mandates.
                            </p>

                            <h4 className="text-sm font-bold text-slate-800 pt-1">4. Data Access Rights & Revocation</h4>
                            <p>
                                Medical facilities retain full ownership of their formulary database. Administrative access can be modified or revoked instantaneously by hospital credentialing administrators.
                            </p>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-slate-50">
                    <span className="text-[11px] text-slate-500 font-medium">
                        Effective: October 2026 • MediStock Legal & Compliance
                    </span>
                    <button
                        onClick={onClose}
                        className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-600 text-white font-bold text-xs shadow-md shadow-teal-700/20 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                        <CheckCircle2 size={14} />
                        <span>I Understand & Agree</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TermsPolicyModal;
