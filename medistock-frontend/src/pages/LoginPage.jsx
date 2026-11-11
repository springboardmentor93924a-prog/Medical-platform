
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import {
    ArrowRight,
    Activity,
    ShieldCheck,
    HeartPulse,
    PackageCheck,
    Sparkles,
    Mail,
    LockKeyhole,
    ChevronDown,
    CheckCircle2,
    Stethoscope,
    Boxes,
} from 'lucide-react'

import Logo from '../components/Logo'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import TermsPolicyModal from '../components/modals/TermsPolicyModal'


function PasswordHeart({ visible }) {
    return (
        <svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="transition-transform duration-300 group-hover:scale-110"
        >
            {visible ? (
                <>
                    <path d="M12 21S3 15.5 3 9.2C3 5.8 5.3 3.5 8.2 3.5c1.8 0 3.1 1 3.8 2.2" />
                    <path d="M12 21s9-5.5 9-11.8c0-3.4-2.3-5.7-5.2-5.7-1.8 0-3.1 1-3.8 2.2" />
                    <path d="M12.3 7.8 10 11l2.1 1-1.5 2.3" />
                </>
            ) : (
                <path d="M20.8 8.8c0 5.2-8.8 11.2-8.8 11.2S3.2 14 3.2 8.8C3.2 5.7 5.3 3.5 8.1 3.5c1.7 0 3.1.9 3.9 2.3.8-1.4 2.2-2.3 3.9-2.3 2.8 0 4.9 2.2 4.9 5.3Z" />
            )}
        </svg>
    )
}


const roleOptions = [
    { value: 'admin', label: 'Administrator', description: 'Manage your healthcare operations' },
    { value: 'pharmacist', label: 'Pharmacist', description: 'Manage medicines and inventory' },
    { value: 'staff', label: 'Staff', description: 'Access your assigned workspace' },
    { value: 'supplier', label: 'Supplier', description: 'Manage orders and deliveries' },
]


function LoginPage() {
    const navigate = useNavigate()
    const { login } = useAuth()
    const { showToast } = useToast()

    const [showPassword, setShowPassword] = useState(false)
    const [selectedRole, setSelectedRole] = useState('')
    const [roleError, setRoleError] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [rememberMe, setRememberMe] = useState(false)
    const [termsModalOpen, setTermsModalOpen] = useState(false)
    const [termsModalTab, setTermsModalTab] = useState('terms')

    const openTerms = (tab = 'terms') => {
        setTermsModalTab(tab)
        setTermsModalOpen(true)
    }

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({ mode: 'onBlur' })

    const onSubmit = async (data) => {
        if (!selectedRole) {
            setRoleError('Please select your role')
            return
        }

        setRoleError('')
        setIsLoading(true)

        try {
            const emailInput = (data.email || data.identifier || '').trim()
            await login(emailInput, data.password, selectedRole)
            showToast(`Welcome back! Authenticated as ${selectedRole}`, 'success')
            navigate('/')
        } catch (e) {
            showToast(e.message || 'Login failed. Please verify credentials.', 'error')
        } finally {
            setIsLoading(false)
        }
    }

    const inputBase = `
        w-full rounded-xl border bg-white/80 px-4 py-3.5
        text-sm text-slate-900 outline-none transition-all duration-300
        placeholder:text-slate-400
        hover:border-teal-300
        focus:border-teal-500 focus:bg-white
        focus:ring-4 focus:ring-teal-500/10
        dark:border-slate-700 dark:bg-slate-800/80
        dark:text-white dark:placeholder:text-slate-500
        dark:hover:border-teal-500/60
        dark:focus:border-teal-400 dark:focus:bg-slate-800
        dark:focus:ring-teal-400/10
    `

    const labelBase = `
        mb-2 block text-[13px] font-bold tracking-wide
        text-slate-700 dark:text-slate-200
    `

    return (
        <main className="
            relative min-h-screen overflow-hidden
            bg-[#f3fbf9] text-slate-900
            dark:bg-[#07151b] dark:text-white
            lg:h-screen lg:overflow-hidden
        ">

            {/* Global decorative background */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="
                    absolute -left-40 -top-40 h-[450px] w-[450px]
                    rounded-full bg-teal-300/10 blur-[700px]
                    dark:bg-teal-500/10
                " />
                <div className="
                    absolute -bottom-40 -right-40 h-[500px] w-[500px]
                    rounded-full bg-cyan-300/10 blur-[110px]
                    dark:bg-cyan-500/10
                " />
            </div>

            <div className="
                relative z-10 grid min-h-screen grid-cols-1
                lg:h-full lg:grid-cols-[1.02fr_0.98fr]
            ">

                {/* =====================================================
                    LEFT PANEL
                ====================================================== */}
                <section className="
                    group relative isolate flex min-h-[320px] flex-col
                    justify-between overflow-hidden bg-[#063b3b]
                    px-6 py-7 text-white sm:px-10 sm:py-9
                    lg:min-h-0 lg:px-12 lg:py-10 xl:px-16
                ">

                    {/* Background image */}
                    <img
                        src="/images/login-image.jpg"
                        alt="Healthcare and medical inventory"
                        className="
                            absolute inset-0 -z-30 h-full w-full
                            object-cover object-center
                            transition-transform duration-[12000ms]
                            ease-out group-hover:scale-105
                        "
                        onError={(event) => {
                            console.error(
                                'Login image could not load:',
                                event.currentTarget.src
                            )
                        }}
                    />

                    {/* Image overlays */}
                    <div className="
                        absolute inset-0 -z-20
                        bg-gradient-to-br from-[#052f32]/95
                        via-[#087b73]/80 to-[#061d30]/90
                    " />

                    <div className="
                        absolute inset-0 -z-10 opacity-30
                        [background-image:linear-gradient(rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.07)_1px,transparent_1px)]
                        [background-size:48px_48px]
                        [mask-image:linear-gradient(to_bottom,black,transparent)]
                    " />

                    {/* Ambient decorative orbs */}
                    <div className="
                        pointer-events-none absolute -right-28 top-20
                        -z-10 h-80 w-80 animate-[pulse_8s_ease-in-out_infinite]
                        rounded-full bg-teal-300/15 blur-3xl
                    " />
                    <div className="
                        pointer-events-none absolute -bottom-32 -left-20
                        -z-10 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl
                    " />

                    {/* Decorative rings */}
                    <div className="
                        pointer-events-none absolute -right-28 top-24
                        -z-10 h-96 w-96 rounded-full border border-white/10
                    " />
                    <div className="
                        pointer-events-none absolute -right-12 top-40
                        -z-10 h-64 w-64 rounded-full border border-white/10
                    " />
                    <div className="
                        pointer-events-none absolute -right-4 top-48
                        -z-10 h-40 w-40 rounded-full border border-white/10
                    " />

                    {/* Brand */}
                    <div className="relative z-10 flex items-center justify-between">
                        <div className="
                            rounded-2xl bg-white p-2.5 shadow-2xl
                            shadow-black/20 transition-transform
                            duration-500 hover:scale-[1.04]
                        ">
                            <Logo size={150} />
                        </div>

                        <div className="
                            hidden items-center gap-2 rounded-full
                            border border-white/20 bg-white/10
                            px-3.5 py-2 text-xs font-semibold
                            text-white/90 backdrop-blur-xl sm:flex
                        ">
                            <span className="
                                h-2 w-2 animate-pulse rounded-full
                                bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,0.8)]
                            " />
                            Healthcare Platform
                        </div>
                    </div>

                    {/* Main content */}
                    <div className="relative z-10 my-9 max-w-xl lg:my-0 lg:py-10">

                        <div className="
                            mb-6 inline-flex items-center gap-2.5
                            rounded-full border border-white/20
                            bg-white/10 px-4 py-2 text-xs
                            font-semibold tracking-wide text-teal-50
                            shadow-lg shadow-black/5 backdrop-blur-xl
                        ">
                            <Sparkles size={15} className="text-teal-200" />
                            CARE BEGINS WITH CONFIDENCE
                        </div>

                        <h1 className="
                            text-4xl font-black leading-[1.12]
                            tracking-tight sm:text-5xl xl:text-[58px]
                        ">
                            Smarter
                            <br />
                            Inventory.
                            <span className="
                                mt-1 block bg-gradient-to-r
                                from-teal-200 via-cyan-100 to-emerald-200
                                bg-clip-text text-transparent
                            ">
                                Safer Healthcare.
                            </span>
                        </h1>

                        <p className="
                            mt-6 max-w-md text-sm leading-7
                            text-teal-50/85 sm:text-base
                        ">
                            A smarter way to manage medical inventory,
                            streamline operations and keep essential
                            medicines within reach.
                        </p>

                        {/* Feature cards */}
                        <div className="mt-8 grid max-w-lg grid-cols-2 gap-3">

                            <div className="
                                group/feature rounded-2xl border
                                border-white/15 bg-white/[0.09]
                                p-4 backdrop-blur-xl transition-all
                                duration-300 hover:-translate-y-1
                                hover:border-teal-200/40 hover:bg-white/[0.15]
                            ">
                                <div className="
                                    mb-3 flex h-10 w-10 items-center
                                    justify-center rounded-xl
                                    bg-teal-300/15 text-teal-200
                                    transition-transform duration-300
                                    group-hover/feature:scale-110
                                ">
                                    <PackageCheck size={21} />
                                </div>
                                <h3 className="text-sm font-bold text-white">
                                    Smart Inventory
                                </h3>
                                <p className="mt-1 text-[11px] leading-5 text-teal-50/70">
                                    Track stock with confidence
                                </p>
                            </div>

                            <div className="
                                group/feature rounded-2xl border
                                border-white/15 bg-white/[0.09]
                                p-4 backdrop-blur-xl transition-all
                                duration-300 hover:-translate-y-1
                                hover:border-teal-200/40 hover:bg-white/[0.15]
                            ">
                                <div className="
                                    mb-3 flex h-10 w-10 items-center
                                    justify-center rounded-xl
                                    bg-cyan-300/15 text-cyan-200
                                    transition-transform duration-300
                                    group-hover/feature:scale-110
                                ">
                                    <Activity size={21} />
                                </div>
                                <h3 className="text-sm font-bold text-white">
                                    Real-time Insights
                                </h3>
                                <p className="mt-1 text-[11px] leading-5 text-teal-50/70">
                                    Stay ahead of stock alerts
                                </p>
                            </div>
                        </div>

                        {/* Trust indicators */}
                        <div className="
                            mt-7 flex flex-wrap items-center gap-x-5
                            gap-y-3 text-xs font-medium text-white/80
                        ">
                            <span className="flex items-center gap-2">
                                <ShieldCheck size={15} className="text-teal-200" />
                                Secure Access
                            </span>
                            <span className="flex items-center gap-2">
                                <HeartPulse size={15} className="text-teal-200" />
                                Better Patient Care
                            </span>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="
                        relative z-10 flex items-center justify-between
                        border-t border-white/15 pt-5 text-[11px]
                        tracking-wide text-white/60 sm:text-xs
                    ">
                        <span>MediStock · Medical Inventory Intelligence</span>
                        <span className="hidden sm:block">Built for Better Care</span>
                    </div>
                </section>


                {/* =====================================================
                    RIGHT PANEL
                ====================================================== */}
                <section className="
                    relative flex min-w-0 items-center justify-center
                    overflow-y-auto bg-gradient-to-br from-white
                    via-[#f8fdfb] to-[#eaf8f5]
                    px-5 py-10 sm:px-10
                    dark:from-[#0c1b22] dark:via-[#0b1b23]
                    dark:to-[#102a30]
                    lg:min-h-0 lg:px-12 lg:py-8 xl:px-16
                ">

                    {/* Right side decorative elements */}
                    <div className="
                        pointer-events-none absolute -right-24 -top-24
                        h-72 w-72 rounded-full bg-teal-300/15 blur-[90px]
                        dark:bg-teal-500/10
                    " />
                    <div className="
                        pointer-events-none absolute -bottom-24 -left-24
                        h-72 w-72 rounded-full bg-cyan-300/15 blur-[90px]
                        dark:bg-cyan-500/10
                    " />

                    <div className="relative z-10 w-full max-w-[430px]">

                        {/* Mobile brand */}
                        <div className="mb-9 flex items-center justify-between lg:hidden">
                            <div className="
                                rounded-xl bg-white p-2 shadow-lg
                                shadow-slate-900/5 dark:bg-white
                            ">
                                <Logo size={140} />
                            </div>

                            <div className="
                                flex items-center gap-2 rounded-full
                                border border-emerald-200 bg-emerald-50
                                px-3 py-2 text-[10px] font-bold
                                text-emerald-700
                                dark:border-emerald-500/20
                                dark:bg-emerald-500/10 dark:text-emerald-400
                            ">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                SECURE PORTAL
                            </div>
                        </div>

                        {/* Heading */}
                        <div className="mb-8">

                            <div className="
                                mb-5 hidden h-1.5 w-16 rounded-full
                                bg-gradient-to-r from-teal-600
                                via-emerald-400 to-cyan-300 lg:block
                            " />

                            <div className="
                                mb-3 inline-flex items-center gap-2
                                text-xs font-extrabold uppercase
                                tracking-[0.18em] text-teal-700
                                dark:text-teal-400
                            ">
                                <Stethoscope size={15} />
                                Welcome to MediStock
                            </div>

                            <h2 className="
                                text-3xl font-black tracking-tight
                                text-slate-900 sm:text-[38px]
                                dark:text-white
                            ">
                                Welcome Back<span className="text-teal-600 dark:text-teal-400">.</span>
                            </h2>

                            <p className="
                                mt-3 max-w-sm text-sm leading-6
                                text-slate-500 dark:text-slate-400
                            ">
                                Sign in to your workspace and take control
                                of your medical inventory.
                            </p>
                        </div>


                        {/* Login Card */}
                        <div className="
                            relative rounded-3xl border border-white/80
                            bg-white/75 p-5 shadow-[0_20px_70px_-25px_rgba(15,118,110,0.18)]
                            backdrop-blur-2xl sm:p-7
                            dark:border-slate-700/70 dark:bg-slate-800/55
                            dark:shadow-[0_20px_70px_-25px_rgba(0,0,0,0.5)]
                        ">

                            {/* Card accent */}
                            <div className="
                                absolute left-8 right-8 top-0 h-[2px]
                                rounded-full bg-gradient-to-r
                                from-transparent via-teal-500/70 to-transparent
                            " />

                            <form
                                onSubmit={handleSubmit(onSubmit)}
                                noValidate
                                className="space-y-5"
                            >

                                {/* Username / Email */}
                                <div>
                                    <label
                                        htmlFor="identifier"
                                        className={labelBase}
                                    >
                                        Username or Email
                                    </label>

                                    <div className="group relative">
                                        <Mail
                                            size={18}
                                            className="
                                                absolute left-4 top-1/2
                                                -translate-y-1/2
                                                text-slate-400 transition-colors
                                                group-focus-within:text-teal-600
                                                dark:group-focus-within:text-teal-400
                                            "
                                        />

                                        <input
                                            id="identifier"
                                            type="text"
                                            autoComplete="username"
                                            placeholder="Enter username or email"
                                            aria-invalid={Boolean(errors.identifier)}
                                            {...register('identifier', {
                                                required: 'Username or email is required',
                                                minLength: {
                                                    value: 2,
                                                    message: 'Minimum 2 characters',
                                                },
                                            })}
                                            className={`
                                                ${inputBase}
                                                pl-11
                                                ${errors.identifier
                                                    ? '!border-rose-500 !ring-4 !ring-rose-500/10'
                                                    : ''
                                                }
                                            `}
                                        />

                                        {errors.identifier && (
                                            <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
                                                <span>•</span>
                                                {errors.identifier.message}
                                            </p>
                                        )}
                                    </div>
                                </div>


                                {/* Password */}
                                <div>
                                    <label
                                        htmlFor="password"
                                        className={labelBase}
                                    >
                                        Password
                                    </label>

                                    <div className="group relative">
                                        <LockKeyhole
                                            size={18}
                                            className="
                                                absolute left-4 top-1/2
                                                -translate-y-1/2
                                                text-slate-400 transition-colors
                                                group-focus-within:text-teal-600
                                                dark:group-focus-within:text-teal-400
                                            "
                                        />

                                        <input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            autoComplete="current-password"
                                            placeholder="Enter your password"
                                            aria-invalid={Boolean(errors.password)}
                                            {...register('password', {
                                                required: 'Password is required',
                                                minLength: {
                                                    value: 6,
                                                    message: 'Minimum 6 characters',
                                                },
                                            })}
                                            className={`
                                                ${inputBase}
                                                pl-11 pr-14
                                                ${errors.password
                                                    ? '!border-rose-500 !ring-4 !ring-rose-500/10'
                                                    : ''
                                                }
                                            `}
                                        />

                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(value => !value)}
                                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                                            aria-pressed={showPassword}
                                            title={showPassword ? 'Hide password' : 'Show password'}
                                            className="
                                                group absolute inset-y-0 right-0
                                                flex w-12 items-center justify-center
                                                rounded-r-xl text-rose-500
                                                transition-all duration-300
                                                hover:bg-rose-50 hover:text-rose-600
                                                focus:outline-none focus:ring-2
                                                focus:ring-inset focus:ring-rose-300
                                                dark:hover:bg-rose-500/10
                                                dark:hover:text-rose-400
                                            "
                                        >
                                            <PasswordHeart visible={showPassword} />
                                        </button>

                                        {errors.password && (
                                            <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
                                                <span>•</span>
                                                {errors.password.message}
                                            </p>
                                        )}
                                    </div>
                                </div>


                                {/* Role selection */}
                                <div>
                                    <label
                                        htmlFor="role"
                                        className={labelBase}
                                    >
                                        Sign in as
                                    </label>

                                    <div className="group relative">
                                        <Boxes
                                            size={18}
                                            className="
                                                absolute left-4 top-1/2
                                                -translate-y-1/2
                                                text-slate-400 transition-colors
                                                group-focus-within:text-teal-600
                                                dark:group-focus-within:text-teal-400
                                            "
                                        />

                                        <select
                                            id="role"
                                            value={selectedRole}
                                            onChange={event => {
                                                setSelectedRole(event.target.value)
                                                setRoleError('')
                                            }}
                                            className={`
                                                ${inputBase}
                                                appearance-none pl-11 pr-10
                                                cursor-pointer
                                                ${roleError
                                                    ? '!border-rose-500 !ring-4 !ring-rose-500/10'
                                                    : ''
                                                }
                                            `}
                                        >
                                            <option value="">Select your role</option>
                                            {roleOptions.map(role => (
                                                <option key={role.value} value={role.value}>
                                                    {role.label}
                                                </option>
                                            ))}
                                        </select>

                                        <ChevronDown
                                            size={17}
                                            className="
                                                pointer-events-none absolute
                                                right-4 top-1/2 -translate-y-1/2
                                                text-slate-400 transition-transform
                                                group-focus-within:rotate-180
                                            "
                                        />
                                    </div>

                                    {selectedRole && (
                                        <div className="
                                            mt-2 flex items-center gap-2
                                            rounded-lg border border-teal-100
                                            bg-teal-50/70 px-3 py-2
                                            dark:border-teal-500/20
                                            dark:bg-teal-500/10
                                        ">
                                            <CheckCircle2
                                                size={14}
                                                className="shrink-0 text-teal-600 dark:text-teal-400"
                                            />
                                            <p className="text-xs text-teal-800 dark:text-teal-300">
                                                {roleOptions.find(
                                                    role => role.value === selectedRole
                                                )?.description}
                                            </p>
                                        </div>
                                    )}

                                    {roleError && (
                                        <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
                                            <span>•</span>
                                            {roleError}
                                        </p>
                                    )}
                                </div>


                                {/* Remember / Forgot */}
                                <div className="
                                    flex flex-wrap items-center
                                    justify-between gap-3 pt-1
                                ">
                                    <label className="
                                        group flex cursor-pointer
                                        items-center gap-2.5 text-sm
                                        text-slate-600 transition
                                        hover:text-teal-700
                                        dark:text-slate-300
                                        dark:hover:text-teal-400
                                    ">
                                        <input
                                            type="checkbox"
                                            checked={rememberMe}
                                            onChange={event => setRememberMe(event.target.checked)}
                                            className="
                                                h-4 w-4 cursor-pointer
                                                rounded border-slate-300
                                                accent-teal-600
                                                focus:ring-2 focus:ring-teal-500/30
                                                dark:border-slate-600
                                            "
                                        />
                                        <span className="font-medium">Remember Me</span>
                                    </label>

                                    <Link
                                        to="/forgot-password"
                                        className="
                                            text-sm font-bold text-teal-700
                                            transition-all hover:text-teal-900
                                            hover:underline hover:underline-offset-4
                                            dark:text-teal-400
                                            dark:hover:text-teal-300
                                        "
                                    >
                                        Forgot Password?
                                    </Link>
                                </div>


                                {/* Submit */}
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="
                                        group relative flex w-full
                                        items-center justify-center gap-2.5
                                        overflow-hidden rounded-xl
                                        bg-gradient-to-r from-teal-700
                                        via-teal-600 to-emerald-600
                                        px-5 py-4 text-sm font-extrabold
                                        tracking-wide text-white
                                        shadow-lg shadow-teal-700/20
                                        transition-all duration-300
                                        hover:-translate-y-0.5
                                        hover:shadow-xl hover:shadow-teal-700/30
                                        active:translate-y-0 active:scale-[0.99]
                                        focus:outline-none focus:ring-4
                                        focus:ring-teal-500/25
                                        disabled:cursor-not-allowed
                                        disabled:opacity-60
                                        disabled:hover:translate-y-0
                                        dark:shadow-teal-950/40
                                    "
                                >
                                    <span className="
                                        absolute inset-0 -translate-x-full
                                        bg-gradient-to-r from-transparent
                                        via-white/15 to-transparent
                                        transition-transform duration-700
                                        group-hover:translate-x-full
                                    " />

                                    {isLoading ? (
                                        <>
                                            <span className="
                                                h-5 w-5 animate-spin
                                                rounded-full border-2
                                                border-white/30 border-t-white
                                            " />
                                            Signing In...
                                        </>
                                    ) : (
                                        <>
                                            <span>Sign In to MediStock</span>
                                            <ArrowRight
                                                size={18}
                                                className="
                                                    transition-transform duration-300
                                                    group-hover:translate-x-1
                                                "
                                            />
                                        </>
                                    )}
                                </button>


                                {/* Terms note */}
                                <p className="
                                    pt-1 text-center text-[11px]
                                    leading-5 text-slate-500
                                    dark:text-slate-400
                                ">
                                    By signing in, you agree to our{' '}
                                    <button
                                        type="button"
                                        onClick={() => openTerms('terms')}
                                        className="
                                            cursor-pointer font-bold
                                            text-teal-700 underline
                                            underline-offset-2
                                            hover:text-teal-900
                                            dark:text-teal-400
                                            dark:hover:text-teal-300
                                        "
                                    >
                                        Terms &amp; Conditions
                                    </button>
                                    {' '}and{' '}
                                    <button
                                        type="button"
                                        onClick={() => openTerms('privacy')}
                                        className="
                                            cursor-pointer font-bold
                                            text-teal-700 underline
                                            underline-offset-2
                                            hover:text-teal-900
                                            dark:text-teal-400
                                            dark:hover:text-teal-300
                                        "
                                    >
                                        Privacy Policy
                                    </button>.
                                </p>
                            </form>
                        </div>


                        {/* Register */}
                        <div className="
                            mt-7 text-center text-sm
                            text-slate-500 dark:text-slate-400
                        ">
                            Don&apos;t have an account?{' '}
                            <Link
                                to="/register"
                                className="
                                    font-extrabold text-teal-700
                                    transition hover:text-teal-900
                                    hover:underline hover:underline-offset-4
                                    dark:text-teal-400 dark:hover:text-teal-300
                                "
                            >
                                Create Account
                            </Link>
                        </div>


                        {/* Footer links */}
                        <div className="
                            mt-7 flex flex-wrap items-center
                            justify-center gap-x-3 gap-y-2
                            text-[10px] font-medium tracking-wide
                            text-slate-400 dark:text-slate-500
                        ">
                            <button
                                type="button"
                                onClick={() => openTerms('terms')}
                                className="transition hover:text-teal-700 hover:underline dark:hover:text-teal-400"
                            >
                                Terms &amp; Conditions
                            </button>

                            <span>•</span>

                            <button
                                type="button"
                                onClick={() => openTerms('privacy')}
                                className="transition hover:text-teal-700 hover:underline dark:hover:text-teal-400"
                            >
                                Privacy Policy
                            </button>

                            <span>•</span>
                            <span>HIPAA &amp; GxP Verified</span>
                        </div>


                        {/* Security indicator */}
                        <div className="
                            mt-5 flex items-center justify-center
                            gap-2 text-center text-[11px]
                            font-medium text-slate-400
                            dark:text-slate-500
                        ">
                            <ShieldCheck size={14} className="text-teal-600 dark:text-teal-500" />
                            Secure access for healthcare inventory management
                        </div>

                    </div>
                </section>
            </div>


            {/* Terms & Conditions / Privacy Policy Modal */}
            <TermsPolicyModal
                isOpen={termsModalOpen}
                onClose={() => setTermsModalOpen(false)}
                initialTab={termsModalTab}
            />
        </main>
    )
}

export default LoginPage
