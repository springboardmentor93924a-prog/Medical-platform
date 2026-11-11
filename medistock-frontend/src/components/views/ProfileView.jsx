
import React, { useState } from 'react';
import {
    User,
    Mail,
    Phone,
    Lock,
    Save,
    Shield,
    KeyRound,
    UserRound,
    AtSign,
    CheckCircle2,
    Fingerprint,
    ArrowRight,
    ShieldCheck,
} from 'lucide-react';

import { adminService } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';

export const ProfileView = () => {
    const { user, refreshUser } = useAuth();

    const [formData, setFormData] = useState({
        fullName: user?.fullName || user?.name || '',
        email: user?.email || '',
        phone: user?.phone || ''
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [saving, setSaving] = useState(false);
    const [changingPwd, setChangingPwd] = useState(false);

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            await adminService.updateMyProfile(formData);
            alert("✅ Profile updated successfully!");

            if (refreshUser) await refreshUser();
        } catch (err) {
            alert("Failed: " + (err.response?.data?.message || err.message));
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            alert("New passwords do not match");
            return;
        }

        if (passwordData.newPassword.length < 6) {
            alert("Password must be at least 6 characters");
            return;
        }

        setChangingPwd(true);

        try {
            await adminService.updateMyProfile({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });

            alert("✅ Password changed successfully!");

            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
        } catch (err) {
            alert("Failed: " + (err.response?.data?.message || err.message));
        } finally {
            setChangingPwd(false);
        }
    };

    const inputClass =
        "w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700/80 dark:bg-slate-900/70 dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:border-slate-600 dark:focus:border-blue-500 dark:focus:bg-slate-900 dark:focus:ring-blue-500/10";

    const labelClass =
        "mb-2 flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300";

    return (
        <div className="min-h-full bg-slate-50/50 px-4 py-6 dark:bg-[#0b1220] sm:px-6 lg:px-8">

            <div className="mx-auto max-w-5xl space-y-6">

                {/* ===================================== */}
                {/* PAGE HEADER */}
                {/* ===================================== */}

                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <div className="mb-2 flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                            <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
                                Account Settings
                            </span>
                        </div>

                        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                            My Profile
                        </h1>

                        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                            Manage your personal information and account security.
                        </p>
                    </div>

                    <div className="flex w-fit items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-500/20 dark:bg-emerald-500/10">
                        <ShieldCheck size={16} className="text-emerald-600 dark:text-emerald-400" />
                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                            Account Protected
                        </span>
                    </div>
                </div>


                {/* ===================================== */}
                {/* PROFILE IDENTITY CARD */}
                {/* ===================================== */}

                <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#111c2e]">

                    {/* Decorative background */}
                    <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-blue-500/5 blur-3xl dark:bg-blue-500/10" />
                    <div className="pointer-events-none absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-cyan-400/5 blur-3xl" />

                    <div className="relative flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-7">

                        {/* Avatar */}
                        <div className="relative shrink-0">
                            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 text-3xl font-extrabold text-white shadow-lg shadow-blue-600/20 ring-4 ring-blue-50 dark:ring-blue-500/10">
                                {(user?.fullName || user?.name || 'U')
                                    .charAt(0)
                                    .toUpperCase()}
                            </div>

                            <span className="absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full border-[3px] border-white bg-emerald-500 text-white dark:border-[#111c2e]">
                                <CheckCircle2 size={12} />
                            </span>
                        </div>

                        {/* User details */}
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                                    {user?.fullName || user?.name || 'User'}
                                </h2>

                                <span className="rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
                                    {user?.role || 'USER'}
                                </span>
                            </div>

                            <p className="mt-1.5 flex items-center gap-2 truncate text-sm text-slate-500 dark:text-slate-400">
                                <Mail size={14} className="shrink-0" />
                                {user?.email || 'No email available'}
                            </p>

                            <div className="mt-4 flex flex-wrap items-center gap-3">
                                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                    <Shield size={13} />
                                    Authorized Account
                                </div>

                                <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600" />

                                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                    <Fingerprint size={13} />
                                    MediStock Workspace
                                </div>
                            </div>
                        </div>

                        {/* Profile badge */}
                        <div className="hidden shrink-0 flex-col items-end gap-1 sm:flex">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                                Account
                            </span>
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                Personal Profile
                            </span>
                        </div>
                    </div>

                    <div className="relative h-1 w-full bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400" />
                </div>


                {/* ===================================== */}
                {/* PROFILE INFORMATION */}
                {/* ===================================== */}

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#111c2e]">

                    {/* Card heading */}
                    <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-5 dark:border-slate-800 sm:px-7">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                            <UserRound size={19} />
                        </div>

                        <div>
                            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                                Personal Information
                            </h2>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                Update your basic account details.
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSaveProfile} className="p-5 sm:p-7">

                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                            {/* Full Name */}
                            <div>
                                <label className={labelClass}>
                                    <User size={14} className="text-blue-500" />
                                    Full Name
                                </label>

                                <div className="relative">
                                    <input
                                        type="text"
                                        required
                                        value={formData.fullName}
                                        onChange={e =>
                                            setFormData({
                                                ...formData,
                                                fullName: e.target.value
                                            })
                                        }
                                        placeholder="Enter your full name"
                                        className={`${inputClass} pl-11`}
                                    />

                                    <User
                                        size={16}
                                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label className={labelClass}>
                                    <Mail size={14} className="text-blue-500" />
                                    Email Address
                                </label>

                                <div className="relative">
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={e =>
                                            setFormData({
                                                ...formData,
                                                email: e.target.value
                                            })
                                        }
                                        placeholder="Enter your email"
                                        className={`${inputClass} pl-11`}
                                    />

                                    <AtSign
                                        size={16}
                                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                                    />
                                </div>
                            </div>

                            {/* Phone */}
                            <div className="md:col-span-2">
                                <label className={labelClass}>
                                    <Phone size={14} className="text-blue-500" />
                                    Phone Number
                                    <span className="ml-1 font-medium text-slate-400">
                                        (Optional)
                                    </span>
                                </label>

                                <div className="relative md:max-w-[calc(50%-0.625rem)]">
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={e =>
                                            setFormData({
                                                ...formData,
                                                phone: e.target.value
                                            })
                                        }
                                        placeholder="Enter your phone number"
                                        className={`${inputClass} pl-11`}
                                    />

                                    <Phone
                                        size={16}
                                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                                    />
                                </div>
                            </div>

                        </div>

                        {/* Save button */}
                        <div className="mt-7 flex flex-col-reverse justify-between gap-3 border-t border-slate-100 pt-5 dark:border-slate-800 sm:flex-row sm:items-center">
                            <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                Make sure your information is accurate before saving.
                            </p>

                            <button
                                type="submit"
                                disabled={saving}
                                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-xs font-extrabold text-white shadow-lg shadow-blue-600/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-blue-600/30 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                            >
                                <Save size={15} />

                                {saving ? 'Saving Changes...' : 'Save Changes'}

                                {!saving && (
                                    <ArrowRight
                                        size={14}
                                        className="transition-transform group-hover:translate-x-1"
                                    />
                                )}
                            </button>
                        </div>

                    </form>
                </div>


                {/* ===================================== */}
                {/* PASSWORD & SECURITY */}
                {/* ===================================== */}

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#111c2e]">

                    {/* Card heading */}
                    <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-5 dark:border-slate-800 sm:px-7">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                                <KeyRound size={19} />
                            </div>

                            <div>
                                <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                                    Password & Security
                                </h2>

                                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                    Keep your account secure with a strong password.
                                </p>
                            </div>
                        </div>

                        <span className="hidden items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 sm:flex">
                            <ShieldCheck size={13} />
                            Security
                        </span>
                    </div>

                    <form onSubmit={handleChangePassword} className="p-5 sm:p-7">

                        <div className="space-y-5">

                            {/* Current password */}
                            <div>
                                <label className={labelClass}>
                                    <Lock size={14} className="text-amber-500" />
                                    Current Password
                                </label>

                                <div className="relative">
                                    <input
                                        type="password"
                                        required
                                        value={passwordData.currentPassword}
                                        onChange={e =>
                                            setPasswordData({
                                                ...passwordData,
                                                currentPassword: e.target.value
                                            })
                                        }
                                        placeholder="Enter your current password"
                                        className={`${inputClass} pl-11`}
                                    />

                                    <Lock
                                        size={16}
                                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                                    />
                                </div>
                            </div>

                            {/* New and confirm password */}
                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                                <div>
                                    <label className={labelClass}>
                                        <KeyRound size={14} className="text-amber-500" />
                                        New Password
                                    </label>

                                    <div className="relative">
                                        <input
                                            type="password"
                                            required
                                            minLength={6}
                                            value={passwordData.newPassword}
                                            onChange={e =>
                                                setPasswordData({
                                                    ...passwordData,
                                                    newPassword: e.target.value
                                                })
                                            }
                                            placeholder="Enter new password"
                                            className={`${inputClass} pl-11`}
                                        />

                                        <KeyRound
                                            size={16}
                                            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                                        />
                                    </div>

                                    <p className="mt-2 text-[10px] text-slate-400 dark:text-slate-500">
                                        Minimum 6 characters required.
                                    </p>
                                </div>

                                <div>
                                    <label className={labelClass}>
                                        <Shield size={14} className="text-amber-500" />
                                        Confirm New Password
                                    </label>

                                    <div className="relative">
                                        <input
                                            type="password"
                                            required
                                            minLength={6}
                                            value={passwordData.confirmPassword}
                                            onChange={e =>
                                                setPasswordData({
                                                    ...passwordData,
                                                    confirmPassword: e.target.value
                                                })
                                            }
                                            placeholder="Confirm new password"
                                            className={`${inputClass} pl-11`}
                                        />

                                        <Shield
                                            size={16}
                                            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                                        />
                                    </div>
                                </div>

                            </div>
                        </div>

                        {/* Security note */}
                        <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50/70 p-3.5 dark:border-amber-500/15 dark:bg-amber-500/5">
                            <ShieldCheck
                                size={17}
                                className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400"
                            />

                            <div>
                                <p className="text-xs font-bold text-amber-800 dark:text-amber-300">
                                    Keep your password confidential
                                </p>

                                <p className="mt-1 text-[11px] leading-relaxed text-amber-700/80 dark:text-amber-400/80">
                                    Never share your password with anyone. Use a strong password that is difficult to guess.
                                </p>
                            </div>
                        </div>

                        {/* Change password button */}
                        <div className="mt-6 flex flex-col-reverse justify-between gap-3 border-t border-slate-100 pt-5 dark:border-slate-800 sm:flex-row sm:items-center">
                            <p className="text-[11px] text-slate-400 dark:text-slate-500">
                                Your new password will be applied after successful verification.
                            </p>

                            <button
                                type="submit"
                                disabled={changingPwd}
                                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-5 py-3 text-xs font-extrabold text-white shadow-lg shadow-amber-600/15 transition-all duration-200 hover:-translate-y-0.5 hover:bg-amber-700 hover:shadow-amber-600/25 focus:outline-none focus:ring-4 focus:ring-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                            >
                                <Shield size={15} />

                                {changingPwd
                                    ? 'Changing Password...'
                                    : 'Update Password'}

                                {!changingPwd && (
                                    <ArrowRight
                                        size={14}
                                        className="transition-transform group-hover:translate-x-1"
                                    />
                                )}
                            </button>
                        </div>

                    </form>
                </div>


                {/* ===================================== */}
                {/* BOTTOM SECURITY FOOTER */}
                {/* ===================================== */}

                <div className="flex flex-col items-center justify-between gap-2 rounded-xl border border-slate-200/80 bg-white/70 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/40 sm:flex-row">
                    <div className="flex items-center gap-2">
                        <ShieldCheck
                            size={15}
                            className="text-emerald-500"
                        />

                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                            Your account information is managed securely.
                        </span>
                    </div>

                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        MediStock · Account Center
                    </span>
                </div>

            </div>
        </div>
    );
};
