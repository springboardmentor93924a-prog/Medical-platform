import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { NotificationBell } from './NotificationBell';
import { Building2, ChevronDown, User, LogOut, RotateCcw, ShieldCheck, Menu, Moon, Sun } from 'lucide-react';
import { api } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

export const Navbar = ({ onOpenProfile, onToggleSidebar }) => {
    const { user, logout, selectedFacility, setSelectedFacility } = useAuth();
    const { showToast } = useToast();
    const [facilityDropdownOpen, setFacilityDropdownOpen] = useState(false);
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);
    const { isDark, toggleTheme } = useTheme();

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

    const togglePharmacistTheme = () => {
    const current = document.documentElement.getAttribute('data-theme');
    document.documentElement.setAttribute('data-theme', current === 'dark' ? 'light' : 'dark');
};

    return (
        <header className="sticky top-0 z-30 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 transition-colors duration-300">
            {/* Left Area: Mobile Menu Trigger + Facility Selector */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                {/* Mobile Menu Button (< lg) */}
                <button
                    onClick={onToggleSidebar}
                    className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shrink-0"
                    aria-label="Open clinical navigation"
                    title="Open Menu"
                >
                    <Menu size={18} />
                </button>

                {/* Facility Selector
                <div className="relative min-w-0">
                    <button 
                        onClick={() => setFacilityDropdownOpen(!facilityDropdownOpen)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                        <Building2 size={14} className="text-blue-600 dark:text-blue-400" />
                        <span className="truncate max-w-[150px] sm:max-w-[250px]">{selectedFacility || facilities[0]}</span>
                        <ChevronDown size={14} className="text-slate-400" />
                    </button>

                    {facilityDropdownOpen && (
                        <div className="absolute left-0 mt-2 w-72 max-w-[85vw] rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl p-2 z-50">
                            <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
                                Select Clinical Site
                            </div>
                            {facilities.map((fac, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        setSelectedFacility(fac);
                                        setFacilityDropdownOpen(false);
                                    }}
                                    className="w-full text-left px-3 py-2 rounded-lg text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                >
                                    {fac}
                                </button>
                            ))}
                        </div>
                    )}
                </div> */}
            </div>

            {/* Right Action Icons & User Menu */}
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
                
                {/* THEME TOGGLE BUTTON */}
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                    title="Toggle Theme"
                >
                    {isDark ? <Sun size={16} /> : <Moon size={16} />}
                </button>

                <button
                    onClick={handleClearAll}
                    className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 border border-slate-200 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-800 transition-all cursor-pointer"
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
                        className="flex items-center gap-2 p-1 sm:p-1.5 sm:pr-3 rounded-full bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                    >
                        {user?.avatar ? (
                            <img
                                src={user.avatar}
                                alt={user?.name || 'Practitioner profile'}
                                className="w-7 h-7 rounded-full object-cover ring-1 ring-emerald-500/30 shrink-0"
                            />
                        ) : (
                            <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold text-xs ring-1 ring-emerald-500/20 shrink-0">
                                <User size={14} />
                            </div>
                        )}
                        <div className="hidden md:flex flex-col text-left leading-tight">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate max-w-[120px]">{user?.name}</span>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium truncate max-w-[120px]">{user?.role}</span>
                        </div>
                        <ChevronDown size={13} className="text-slate-400 hidden sm:block shrink-0" />
                    </button>

                    {userDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-64 max-w-[90vw] rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl p-2 z-50">
                            <div className="p-3 border-b border-slate-100 dark:border-slate-700 mb-1 flex items-center gap-3">
                                {user?.avatar ? (
                                    <img
                                        src={user.avatar}
                                        alt={user?.name || 'Practitioner'}
                                        className="w-10 h-10 rounded-full object-cover ring-1 ring-emerald-500/30 shrink-0"
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold text-xs shrink-0">
                                        <User size={18} />
                                    </div>
                                )}
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user?.name}</p>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                                    <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
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
                                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
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
                                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors cursor-pointer"
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