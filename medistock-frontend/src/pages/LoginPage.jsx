import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
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
        >
            {visible ? (
                <>
                    {/* Split heart: password visible */}
                    <path d="M12 21S3 15.5 3 9.2C3 5.8 5.3 3.5 8.2 3.5c1.8 0 3.1 1 3.8 2.2" />
                    <path d="M12 21s9-5.5 9-11.8c0-3.4-2.3-5.7-5.2-5.7-1.8 0-3.1 1-3.8 2.2" />
                    <path d="M12.3 7.8 10 11l2.1 1-1.5 2.3" />
                </>
            ) : (
                /* Complete heart: password hidden */
                <path d="M20.8 8.8c0 5.2-8.8 11.2-8.8 11.2S3.2 14 3.2 8.8C3.2 5.7 5.3 3.5 8.1 3.5c1.7 0 3.1.9 3.9 2.3.8-1.4 2.2-2.3 3.9-2.3 2.8 0 4.9 2.2 4.9 5.3Z" />
            )}
        </svg>
    )
}

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

    return (
        <main className="min-h-screen bg-[#f2fbf9] lg:h-screen lg:overflow-hidden">
            <div className="grid min-h-screen grid-cols-1 lg:h-full lg:grid-cols-[1.03fr_0.97fr]">

                {/* LEFT IMAGE PANEL */}
                <section className="relative isolate flex min-h-[220px] sm:min-h-[300px] flex-col justify-between overflow-hidden bg-teal-950 px-5 py-6 sm:px-10 sm:py-9 lg:min-h-0 lg:px-12 lg:py-10 xl:px-16">

                    <img
                        src="/images/login-image.jpg"
                        alt="Healthcare and medical inventory"
                        className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
                        onError={(event) => {
                            console.error('Login image could not load:', event.currentTarget.src)
                        }}
                    />

                    {/* Teal overlay keeps the text readable */}
                    <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#073b3b]/85 via-[#087e79]/65 to-[#102b3a]/70" />

                    {/* Decorative accents */}
                    <div className="pointer-events-none absolute -right-20 top-16 -z-10 h-64 w-64 rounded-full border border-white/15" />
                    <div className="pointer-events-none absolute -right-10 top-28 -z-10 h-44 w-44 rounded-full border border-white/15" />

                    <div className="relative z-10 w-fit rounded-2xl bg-white p-2.5 sm:p-3 shadow-xl shadow-black/10">
                        <Logo size={160} />
                    </div>

                    <div className="relative z-10 my-6 sm:my-10 max-w-xl lg:my-0 lg:py-10">
                        <span className="mb-3 sm:mb-5 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-white backdrop-blur-md">
                            <span className="h-2 w-2 rounded-full bg-teal-300" />
                            Care Begins With Confidence
                        </span>

                        <h1 className="text-2xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight tracking-tight">
                            Smarter Inventory.
                            <span className="mt-1 block text-teal-200">
                                Safer Healthcare.
                            </span>
                        </h1>

                        <p className="mt-3 sm:mt-6 max-w-md text-xs sm:text-base leading-relaxed sm:leading-7 text-teal-50/90 hidden xs:block">
                            Keeping essential medicines in stock.
                            Keeping better care within reach.
                        </p>

                        <div className="mt-4 sm:mt-8 flex flex-wrap gap-2 sm:gap-3 text-xs sm:text-sm text-white/90">
                            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 sm:px-4 sm:py-2 backdrop-blur-sm">
                                Reliable stock tracking
                            </span>
                            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 sm:px-4 sm:py-2 backdrop-blur-sm">
                                Better patient care
                            </span>
                        </div>
                    </div>

                    <p className="relative z-10 text-[11px] sm:text-xs tracking-wide text-white/75 sm:text-sm hidden sm:block">
                        MediStock · Medical Inventory Intelligence
                    </p>
                </section>

                {/* RIGHT LOGIN PANEL */}
                <section className="flex min-w-0 items-center justify-center overflow-y-auto bg-gradient-to-br from-white via-white to-teal-50/80 px-5 py-9 sm:px-10 lg:min-h-0 lg:px-12 lg:py-8 xl:px-16">
                    <div className="w-full max-w-md">

                        <div className="mb-7 flex items-center gap-3 lg:hidden">
                            <Logo size={170} />
                        </div>

                        <div className="mb-7 hidden h-1.5 w-16 rounded-full bg-gradient-to-r from-teal-600 to-emerald-300 lg:block" />

                        <div className="mb-8">
                            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
                                Welcome to MediStock
                            </p>

                            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                                Welcome Back
                            </h2>

                            <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base">
                                Sign in to manage your medical inventory.
                            </p>
                        </div>

                        <form
                            onSubmit={handleSubmit(onSubmit)}
                            noValidate
                            className="space-y-5"
                        >
                            {/* Username or Email */}
                            <div>
                                <label
                                    htmlFor="identifier"
                                    className="mb-2 block text-sm font-semibold text-slate-700"
                                >
                                    Username or Email
                                </label>

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
                                    className={`w-full rounded-xl border bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10 ${
                                        errors.identifier
                                            ? 'border-red-500'
                                            : 'border-slate-200 hover:border-teal-300'
                                    }`}
                                />

                                {errors.identifier && (
                                    <p className="mt-1.5 text-sm text-red-600">
                                        {errors.identifier.message}
                                    </p>
                                )}
                            </div>

                            {/* Password with heart toggle */}
                            <div>
                                <label
                                    htmlFor="password"
                                    className="mb-2 block text-sm font-semibold text-slate-700"
                                >
                                    Password
                                </label>

                                <div className="relative">
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
                                        className={`w-full rounded-xl border bg-white px-4 py-3.5 pr-14 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10 ${
                                            errors.password
                                                ? 'border-red-500'
                                                : 'border-slate-200 hover:border-teal-300'
                                        }`}
                                    />

                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((value) => !value)}
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        aria-pressed={showPassword}
                                        title={showPassword ? 'Hide password' : 'Show password'}
                                        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-red-500 transition hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-300"
                                    >
                                        <PasswordHeart visible={showPassword} />
                                    </button>
                                </div>

                                {errors.password && (
                                    <p className="mt-1.5 text-sm text-red-600">
                                        {errors.password.message}
                                    </p>
                                )}
                            </div>

                            {/* Role */}
                            <div>
                                <label
                                    htmlFor="role"
                                    className="mb-2 block text-sm font-semibold text-slate-700"
                                >
                                    Sign in as
                                </label>

                                <select
                                    id="role"
                                    value={selectedRole}
                                    onChange={(event) => {
                                        setSelectedRole(event.target.value)
                                        setRoleError('')
                                    }}
                                    className={`w-full rounded-xl border bg-white px-4 py-3.5 text-sm text-slate-800 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10 ${
                                        roleError
                                            ? 'border-red-500'
                                            : 'border-slate-200 hover:border-teal-300'
                                    }`}
                                >
                                    <option value="">Select your role</option>
                                    <option value="admin">Admin</option>
                                    <option value="pharmacist">Pharmacist</option>
                                    <option value="staff">Staff</option>
                                    <option value="supplier">Supplier</option>
                                </select>

                                {roleError && (
                                    <p className="mt-1.5 text-sm text-red-600">
                                        {roleError}
                                    </p>
                                )}
                            </div>

                            {/* Remember me and forgot password */}
                            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                                <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                                    <input
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(event) => setRememberMe(event.target.checked)}
                                        className="h-4 w-4 rounded border-slate-300 accent-teal-700 focus:ring-teal-600"
                                    />
                                    Remember Me
                                </label>

                                <Link
                                    to="/forgot-password"
                                    className="text-sm font-semibold text-teal-700 transition hover:text-teal-900 hover:underline"
                                >
                                    Forgot Password?
                                </Link>
                            </div>

                            {/* Sign in */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-700 to-teal-600 px-4 py-3.5 font-semibold text-white shadow-lg shadow-teal-700/20 transition hover:-translate-y-0.5 hover:from-teal-800 hover:to-teal-700 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-teal-600/25 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isLoading ? (
                                    <>
                                        <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                        Signing In...
                                    </>
                                ) : (
                                    <>
                                        Sign In
                                        <span aria-hidden="true">→</span>
                                    </>
                                )}
                            </button>

                            {/* Terms & Privacy Consent Note */}
                            <p className="mt-4 text-center text-xs text-slate-500 leading-relaxed">
                                By signing in, you agree to our{' '}
                                <button
                                    type="button"
                                    onClick={() => openTerms('terms')}
                                    className="font-semibold text-teal-700 underline underline-offset-2 hover:text-teal-900 cursor-pointer"
                                >
                                    Terms &amp; Conditions
                                </button>{' '}
                                and{' '}
                                <button
                                    type="button"
                                    onClick={() => openTerms('privacy')}
                                    className="font-semibold text-teal-700 underline underline-offset-2 hover:text-teal-900 cursor-pointer"
                                >
                                    Privacy Policy
                                </button>.
                            </p>
                        </form>

                        <p className="mt-6 text-center text-sm text-slate-500">
                            Don&apos;t have an account?{' '}
                            <Link
                                to="/register"
                                className="font-semibold text-teal-700 transition hover:text-teal-900 hover:underline"
                            >
                                Create Account
                            </Link>
                        </p>

                        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-[11px] text-slate-400">
                            <button
                                type="button"
                                onClick={() => openTerms('terms')}
                                className="hover:text-teal-700 hover:underline cursor-pointer"
                            >
                                Terms &amp; Conditions
                            </button>
                            <span>•</span>
                            <button
                                type="button"
                                onClick={() => openTerms('privacy')}
                                className="hover:text-teal-700 hover:underline cursor-pointer"
                            >
                                Privacy Policy
                            </button>
                            <span>•</span>
                            <span>HIPAA &amp; GxP Verified</span>
                        </div>

                        <div className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-slate-400">
                            <svg
                                viewBox="0 0 24 24"
                                width="15"
                                height="15"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.7"
                                aria-hidden="true"
                            >
                                <rect x="5" y="10" width="14" height="11" rx="2" />
                                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                            </svg>
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
