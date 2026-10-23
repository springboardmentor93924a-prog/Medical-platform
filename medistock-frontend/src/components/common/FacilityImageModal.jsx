import React from 'react';
import { X, Thermometer, Droplets, MapPin, CheckCircle } from 'lucide-react';

export const FacilityImageModal = ({ item, onClose }) => {
    if (!item) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-white/90 text-slate-700 hover:text-slate-900 hover:bg-white border border-slate-200 shadow-md backdrop-blur-sm transition-all cursor-pointer"
                >
                    <X size={18} />
                </button>

                {/* Hero Image Section */}
                <div className="relative h-72 md:h-96 w-full overflow-hidden bg-slate-100">
                    <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover object-center"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
                    
                    <div className="absolute bottom-4 left-6 right-6 flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/95 text-emerald-800 shadow-sm border border-slate-200 backdrop-blur-md">
                                {item.badge || item.category}
                            </span>
                            <h2 className="text-2xl font-bold text-white mt-2 drop-shadow-md">
                                {item.title}
                            </h2>
                            <p className="text-sm text-slate-200 drop-shadow">
                                {item.subtitle}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Facility Telemetry & Metadata */}
                <div className="p-6 overflow-y-auto space-y-6">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                                <MapPin size={13} className="text-teal-600" /> Location Zone
                            </span>
                            <p className="text-sm font-bold text-slate-900">{item.zone}</p>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                                <Thermometer size={13} className="text-cyan-600" /> Temperature
                            </span>
                            <p className="text-sm font-bold text-cyan-800">{item.temperature || '21.0°C Ambient'}</p>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                                <Droplets size={13} className="text-blue-600" /> Humidity
                            </span>
                            <p className="text-sm font-bold text-blue-800">{item.humidity || '45% RH'}</p>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                                <CheckCircle size={13} className="text-emerald-600" /> Operational
                            </span>
                            <p className="text-sm font-bold text-emerald-700">{item.operationalStatus || 'Nominal'}</p>
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed flex items-center justify-between">
                        <span>GxP Compliant Automated Temperature & Humidity Logging System (Sensor ID: TELE-B2-0941)</span>
                        <span className="text-emerald-700 font-semibold shrink-0 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" /> Live Telemetry
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};
