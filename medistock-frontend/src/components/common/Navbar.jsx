import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { NotificationBell } from './NotificationBell';
import { Building2, ChevronDown, User, LogOut, RotateCcw, ShieldCheck, Menu } from 'lucide-react';
import { api } from '../../services/api';

export const Navbar = ({ onOpenProfile, onToggleSidebar }) => {
    const { user, logout, selectedFacility, setSelectedFacility } = useAuth();
    const { showToast } = useToast();
    const [facilityDropdownOpen, setFacilityDropdownOpen] = useState(false);
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);

    const facilities = [
        'Main Hospital Center - Central Pharmacy',
        'Emergency Care & Trauma Dispensary',
        'Inpatient Surgical Annex B2',
        'Cold-Chain Biologics Depot'
    ];

    const handleClearAll = () => {
        if (window.confirm('Delete all data and wipe clean?')) {
            api.resetToDefaults();
            showToast('All formulary and supplier records have been erased', 'info');
            window.location.reload();
        }
    };

    return (
        <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4">
            {/* Left Area: Mobile Menu Trigger + Facility Selector */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                {/* Mobile Menu Button (< lg) */}
                <button
                    onClick={onToggleSidebar}
                    className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer shrink-0"
                    aria-label="Open clinical navigation"
                    title="Open Menu"
                >
                    <Menu size={18} />
                </button>

                {/* Facility Selector */}
                <div className="relative min-w-0">
                    <button
                        onClick={() => setFacilityDropdownOpen(!facilityDropdownOpen)}
                        className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 transition-all cursor-pointer max-w-full"
                    >
                        <Building2 size={14} className="text-emerald-600 shrink-0" />
                        <span className="truncate max-w-[120px] xs:max-w-[170px] sm:max-w-[220px] md:max-w-xs">{selectedFacility}</span>
                        <ChevronDown size={13} className="text-slate-400 shrink-0" />
                    </button>

                    {facilityDropdownOpen && (
                        <div className="absolute left-0 mt-2 w-72 max-w-[85vw] rounded-2xl bg-white border border-slate-200 shadow-xl p-2 z-50">
                            <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                Select Clinical Site
                            </div>
                            {facilities.map(fac => (
                                <button
                                    key={fac}
                                    onClick={() => {
                                        setSelectedFacility(fac);
                                        setFacilityDropdownOpen(false);
                                        showToast(`Switched active dispensary to: ${fac}`, 'info');
                                    }}
                                    className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors flex items-center justify-between cursor-pointer ${
                                        selectedFacility === fac
                                            ? 'bg-emerald-50 text-emerald-700 font-semibold'
                                            : 'text-slate-600 hover:bg-slate-50'
                                    }`}
                                >
                                    <span className="truncate">{fac}</span>
                                    {selectedFacility === fac && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Right Action Icons & User Menu */}
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
                <button
                    onClick={handleClearAll}
                    className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-all cursor-pointer"
                    title="Delete and wipe all data"
                >
                    <RotateCcw size={13} className="shrink-0" />
                    <span className="hidden sm:inline">Clear Data</span>
                </button>

                <NotificationBell />

                {/* User Dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                        className="flex items-center gap-2 p-1 sm:p-1.5 sm:pr-3 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer"
                    >
                        {user?.avatar ? (
                            <img
                                src={user.avatar}
                                alt={user?.name || 'Practitioner profile'}
                                className="w-7 h-7 rounded-full object-cover ring-1 ring-emerald-500/30 shrink-0"
                            />
                        ) : (
                            <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-300 text-slate-600 flex items-center justify-center font-bold text-xs ring-1 ring-emerald-500/20 shrink-0">
                                <User size={14} className="text-slate-600" />
                            </div>
                        )}
                        <div className="hidden md:flex flex-col text-left leading-tight">
                            <span className="text-xs font-bold text-slate-800 truncate max-w-[120px]">{user?.name}</span>
                            <span className="text-[10px] text-emerald-600 font-medium truncate max-w-[120px]">{user?.role}</span>
                        </div>
                        <ChevronDown size={13} className="text-slate-400 hidden sm:block shrink-0" />
                    </button>

                    {userDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-64 max-w-[90vw] rounded-2xl bg-white border border-slate-200 shadow-xl p-2 z-50">
                            <div className="p-3 border-b border-slate-100 mb-1 flex items-center gap-3">
                                {user?.avatar ? (
                                    <img
                                        src={user.avatar}
                                        alt={user?.name || 'Practitioner'}
                                        className="w-10 h-10 rounded-full object-cover ring-1 ring-emerald-500/30 shrink-0"
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-300 text-slate-600 flex items-center justify-center font-bold text-xs shrink-0">
                                        <User size={18} className="text-slate-500" />
                                    </div>
                                )}
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-slate-900 truncate">{user?.name}</p>
                                    <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                                    <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                        <ShieldCheck size={11} />
                                        <span className="truncate">{user?.role}</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    setUserDropdownOpen(false);
                                    if (onOpenProfile) onOpenProfile();
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                            >
                                <User size={15} className="text-slate-400" />
                                <span>Profile & Credentials</span>
                            </button>

                            <button
                                onClick={() => {
                                    setUserDropdownOpen(false);
                                    logout();
                                    showToast('Session terminated safely.', 'info');
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            >
                                <LogOut size={15} />
                                <span>Sign Out</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};
