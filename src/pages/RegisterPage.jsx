import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import Logo from '../components/Logo'
import { useAuth } from '../context/AuthContext'

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

function RegisterPage() {
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [selectedRole, setSelectedRole] = useState('')
    const [roleError, setRoleError] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [successMsg, setSuccessMsg] = useState('')
    const [errorMsg, setErrorMsg] = useState('')

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm({ mode: 'onBlur' })

    const password = watch('password', '')

    const inputClass = (hasError) =>
        `w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10 ${
            hasError
                ? 'border-red-500'
                : 'border-slate-200 hover:border-teal-300'
        }`

    const navigate = useNavigate()
    const { register: registerAuth } = useAuth()

    const onSubmit = async (data) => {
        if (!selectedRole) {
            setRoleError('Please select your role')
            return
        }

        setRoleError('')
        setErrorMsg('')
        setIsLoading(true)
        setSuccessMsg('')

        try {
            await registerAuth({
                fullName: (data.fullName || '').trim(),
                email: (data.email || '').trim(),
                password: data.password,
                role: selectedRole
            })
            setSuccessMsg('Account created successfully! Redirecting...')
            setTimeout(() => navigate('/'), 1200)
        } catch (e) {
            setErrorMsg(e.message || 'Registration failed. Please check your information.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <main className="min-h-screen bg-[#f1faf8]">
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[0.88fr_1.12fr]">

                {/* LEFT: IMAGE AND BRAND PANEL */}
                <section className="relative isolate flex min-h-[220px] sm:min-h-[300px] flex-col justify-between overflow-hidden bg-teal-950 px-5 py-6 sm:px-10 sm:py-9 lg:sticky lg:top-0 lg:h-screen lg:px-10 xl:px-14">
                    <img
                        src="/images/reg_page.jpeg"
                        alt="Healthcare professional in a medical inventory setting"
                        className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
                        onError={(event) => {
                            console.error('Registration image failed to load:', event.currentTarget.src)
                        }}
                    />

                    <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#053d40]/90 via-[#006c69]/75 to-[#062b3b]/85" />

                    {/* Decorative circles */}
                    <div className="pointer-events-none absolute -right-24 top-20 -z-10 h-72 w-72 rounded-full border border-teal-200/20" />
                    <div className="pointer-events-none absolute -right-12 top-32 -z-10 h-52 w-52 rounded-full border border-teal-200/20" />

                    {/* Logo */}
                    <div className="relative z-10 w-fit rounded-2xl bg-white p-2.5 sm:p-3 shadow-xl shadow-black/10">
                        <Logo size={160} />
                    </div>

                    {/* Brand message */}
                    <div className="relative z-10 my-6 sm:my-10 max-w-xl lg:my-6">
                        <span className="mb-3 sm:mb-5 inline-flex items-center gap-2 rounded-full border border-teal-100/40 bg-white/10 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium backdrop-blur-md">
                            <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-teal-300" />
                            Join MediStock Today
                        </span>

                        <h1 className="text-2xl sm:text-4xl lg:text-5xl xl:text-[3.2rem] font-bold leading-tight tracking-tight">
                            Manage Medicines.
                            <span className="mt-1 block text-teal-200">
                                Reduce Shortages.
                            </span>
                            <span className="mt-1 block text-white">
                                Save Lives.
                            </span>
                        </h1>

                        <p className="mt-3 sm:mt-5 max-w-md text-xs sm:text-base leading-relaxed sm:leading-7 text-teal-50/90 hidden xs:block">
                            Join healthcare professionals managing medical
                            inventory more efficiently.
                        </p>

                        {/* Benefits */}
                        <div className="mt-4 sm:mt-8 grid max-w-lg grid-cols-3 gap-2 sm:gap-3 hidden sm:grid">
                            <div className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-sm">
                                <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-teal-300/20 text-teal-100">
                                    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                                        <path d="M12 3 20 6v5c0 5-3.4 8.3-8 10-4.6-1.7-8-5-8-10V6l8-3Z" />
                                        <path d="m8.5 12 2.2 2.2 4.8-5" />
                                    </svg>
                                </span>
                                <p className="text-sm font-semibold">Better</p>
                                <p className="text-xs text-teal-100/85">Stock Control</p>
                            </div>

                            <div className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-sm">
                                <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-teal-300/20 text-teal-100">
                                    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                                        <circle cx="9" cy="8" r="3.5" />
                                        <path d="M2.5 20v-1.5A5.5 5.5 0 0 1 8 13h2a5.5 5.5 0 0 1 5.5 5.5V20" />
                                        <path d="M16 5a3.5 3.5 0 0 1 0 6.8M18 14a5.5 5.5 0 0 1 3.5 5.1V20" />
                                    </svg>
                                </span>
                                <p className="text-sm font-semibold">Improved</p>
                                <p className="text-xs text-teal-100/85">Collaboration</p>
                            </div>

                            <div className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-sm">
                                <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-teal-300/20 text-teal-100">
                                    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                                        <path d="M20.8 8.8c0 5.2-8.8 11.2-8.8 11.2S3.2 14 3.2 8.8C3.2 5.7 5.3 3.5 8.1 3.5c1.7 0 3.1.9 3.9 2.3.8-1.4 2.2-2.3 3.9-2.3 2.8 0 4.9 2.2 4.9 5.3Z" />
                                        <path d="M4 12h4l2-3 3.2 6 2-3H20" />
                                    </svg>
                                </span>
                                <p className="text-sm font-semibold">Healthier</p>
                                <p className="text-xs text-teal-100/85">Communities</p>
                            </div>
                        </div>
                    </div>

                    <p className="relative z-10 text-xs tracking-wide text-white/75 sm:text-sm">
                        MediStock · Medical Inventory Intelligence
                    </p>
                </section>

                {/* RIGHT: REGISTRATION FORM */}
<section className="relative flex min-w-0 items-center justify-center overflow-hidden bg-gradient-to-br from-white via-white to-teal-50/80 px-5 py-10 sm:px-9 lg:min-h-screen lg:px-10 lg:py-10 xl:px-14">
                    {/* Top-right decoration */}
                    <img
                        src="/images/medi.png"
                        alt=""
                        aria-hidden="true"
                        className="pointer-events-none absolute right-0 top-0 z-0 w-28 opacity-75 sm:w-36 lg:w-44"
                    />

                    {/* Bottom-right decoration */}
                    <img
                        src="/images/medi1.svg"
                        alt=""
                        aria-hidden="true"
                        className="pointer-events-none absolute bottom-0 right-0 z-0 w-32 opacity-75 sm:w-40 lg:w-48"
                    />

                    <div className="relative z-10 w-full max-w-2xl">

                        {/* Mobile logo */}
                        <div className="mb-6 lg:hidden">
                            <Logo size={170} />
                        </div>

                        <div className="mb-6 hidden h-1.5 w-16 rounded-full bg-gradient-to-r from-teal-700 to-emerald-300 lg:block" />

                        <div className="mb-6">
                            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-teal-700">
                                Your healthcare journey starts here
                            </p>

                            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                                Create Account
                            </h2>

                            <p className="mt-2 text-sm leading-6 text-slate-500 sm:text-base">
                                Join MediStock to manage your inventory.
                            </p>
                        </div>

                        {successMsg && (
                            <div
                                role="status"
                                className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-sm text-emerald-800"
                            >
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white font-bold">
                                    ✓
                                </span>
                                <span>{successMsg}</span>
                            </div>
                        )}

                        {errorMsg && (
                            <div
                                role="alert"
                                className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-800"
                            >
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-600 text-white font-bold text-xs">
                                    !
                                </span>
                                <span>{errorMsg}</span>
                            </div>
                        )}

                        <form
                            onSubmit={handleSubmit(onSubmit)}
                            noValidate
                            className="space-y-4"
                        >
                            {/* Full Name + Username */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label htmlFor="fullName" className="mb-1.5 block text-sm font-semibold text-slate-700">
                                        Full Name
                                    </label>
                                    <input
                                        id="fullName"
                                        type="text"
                                        autoComplete="name"
                                        placeholder="Enter your full name"
                                        aria-invalid={Boolean(errors.fullName)}
                                        {...register('fullName', {
                                            required: 'Full name is required',
                                            minLength: {
                                                value: 2,
                                                message: 'Minimum 2 characters',
                                            },
                                        })}
                                        className={inputClass(errors.fullName)}
                                    />
                                    {errors.fullName && (
                                        <p className="mt-1 text-xs text-red-600">
                                            {errors.fullName.message}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="username" className="mb-1.5 block text-sm font-semibold text-slate-700">
                                        Username
                                    </label>
                                    <input
                                        id="username"
                                        type="text"
                                        autoComplete="username"
                                        placeholder="Choose a username"
                                        aria-invalid={Boolean(errors.username)}
                                        {...register('username', {
                                            required: 'Username is required',
                                            minLength: {
                                                value: 5,
                                                message: 'Minimum 5 characters',
                                            },
                                            pattern: {
                                                value: /^[a-zA-Z0-9_]+$/,
                                                message: 'Use letters, numbers and underscores only',
                                            },
                                        })}
                                        className={inputClass(errors.username)}
                                    />
                                    {errors.username && (
                                        <p className="mt-1 text-xs text-red-600">
                                            {errors.username.message}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-slate-700">
                                    Email Address
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    autoComplete="email"
                                    placeholder="Enter your email address"
                                    aria-invalid={Boolean(errors.email)}
                                    {...register('email', {
                                        required: 'Email is required',
                                        pattern: {
                                            value: /^\S+@\S+\.\S+$/,
                                            message: 'Enter a valid email address',
                                        },
                                    })}
                                    className={inputClass(errors.email)}
                                />
                                {errors.email && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {errors.email.message}
                                    </p>
                                )}
                            </div>

                            {/* Password + Confirm Password */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-slate-700">
                                        Password
                                    </label>

                                    <div className="relative">
                                        <input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            autoComplete="new-password"
                                            placeholder="At least 8 characters"
                                            aria-invalid={Boolean(errors.password)}
                                            {...register('password', {
                                                required: 'Password is required',
                                                minLength: {
                                                    value: 8,
                                                    message: 'Minimum 8 characters',
                                                },
                                                pattern: {
                                                    value: /^(?=.*[A-Z])(?=.*[0-9])/,
                                                    message: 'Include one uppercase letter and one number',
                                                },
                                            })}
                                            className={`${inputClass(errors.password)} pr-12`}
                                        />

                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(value => !value)}
                                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                                            aria-pressed={showPassword}
                                            title={showPassword ? 'Hide password' : 'Show password'}
                                            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-red-500 transition hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-300"
                                        >
                                            <PasswordHeart visible={showPassword} />
                                        </button>
                                    </div>

                                    {errors.password && (
                                        <p className="mt-1 text-xs text-red-600">
                                            {errors.password.message}
                                        </p>
                                    )}

                                    {password && !errors.password && (
                                        <p className="mt-1 text-xs text-slate-500">
                                            8+ characters, one uppercase letter and one number.
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-semibold text-slate-700">
                                        Confirm Password
                                    </label>

                                    <div className="relative">
                                        <input
                                            id="confirmPassword"
                                            type={showConfirm ? 'text' : 'password'}
                                            autoComplete="new-password"
                                            placeholder="Re-enter your password"
                                            aria-invalid={Boolean(errors.confirmPassword)}
                                            {...register('confirmPassword', {
                                                required: 'Please confirm your password',
                                                validate: value =>
                                                    value === password || 'Passwords do not match',
                                            })}
                                            className={`${inputClass(errors.confirmPassword)} pr-12`}
                                        />

                                        <button
                                            type="button"
                                            onClick={() => setShowConfirm(value => !value)}
                                            aria-label={showConfirm ? 'Hide password confirmation' : 'Show password confirmation'}
                                            aria-pressed={showConfirm}
                                            title={showConfirm ? 'Hide password' : 'Show password'}
                                            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-red-500 transition hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-300"
                                        >
                                            <PasswordHeart visible={showConfirm} />
                                        </button>
                                    </div>

                                    {errors.confirmPassword && (
                                        <p className="mt-1 text-xs text-red-600">
                                            {errors.confirmPassword.message}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Role */}
                            <div>
                                <label htmlFor="role" className="mb-1.5 block text-sm font-semibold text-slate-700">
                                    Register As
                                </label>

                                <select
                                    id="role"
                                    value={selectedRole}
                                    onChange={event => {
                                        setSelectedRole(event.target.value)
                                        setRoleError('')
                                    }}
                                    aria-invalid={Boolean(roleError)}
                                    className={inputClass(roleError)}
                                >
                                    <option value="">Select your role</option>
                                    <option value="admin">Admin</option>
                                    <option value="pharmacist">Pharmacist</option>
                                    <option value="staff">Staff</option>
                                    <option value="supplier">Supplier</option>
                                </select>

                                {roleError && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {roleError}
                                    </p>
                                )}
                            </div>

                            {/* Terms */}
                            <div>
                                <label className="flex cursor-pointer items-start gap-2.5 text-sm leading-5 text-slate-600">
                                    <input
                                        type="checkbox"
                                        {...register('terms', {
                                            required: 'You must accept the terms to continue',
                                        })}
                                        className="mt-1 h-4 w-4 shrink-0 rounded accent-teal-700 focus:ring-teal-600"
                                    />
                                    <span>
                                        I agree to the{' '}
                                        <span className="font-medium text-teal-700 underline underline-offset-2">
                                            Terms &amp; Conditions
                                        </span>
                                        {' '}and{' '}
                                        <span className="font-medium text-teal-700 underline underline-offset-2">
                                            Privacy Policy
                                        </span>
                                        .
                                    </span>
                                </label>

                                {errors.terms && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {errors.terms.message}
                                    </p>
                                )}
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-700 to-teal-600 px-4 py-3.5 font-semibold text-white shadow-lg shadow-teal-700/20 transition hover:-translate-y-0.5 hover:from-teal-800 hover:to-teal-700 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-teal-600/20 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isLoading ? (
                                    <>
                                        <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                        Creating Account...
                                    </>
                                ) : (
                                    <>
                                        Create Account
                                        <span aria-hidden="true">→</span>
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Sign in */}
                        <p className="mt-6 text-center text-sm text-slate-500">
                            Already have an account?{' '}
                            <Link
                                to="/"
                                className="font-semibold text-teal-700 transition hover:text-teal-900 hover:underline"
                            >
                                Sign In
                            </Link>
                        </p>

                        <p className="mt-5 flex items-center justify-center gap-2 text-center text-xs text-slate-400">
                            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
                                <rect x="5" y="10" width="14" height="11" rx="2" />
                                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                            </svg>
                            Secure registration for healthcare professionals
                        </p>
                    </div>
                </section>
            </div>
        </main>
    )
}

export default RegisterPage
