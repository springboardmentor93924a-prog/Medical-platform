import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import Logo from '../components/Logo'

function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [successMsg, setSuccessMsg] = useState('')
    const [errorMsg, setErrorMsg] = useState('')

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({ mode: 'onBlur' })

    const onSubmit = (data) => {
        setIsLoading(true)
        setSuccessMsg('')
        setErrorMsg('')

        // Demo only: connect your password-reset API here.
        console.log('Password reset requested for:', data.email)

        setTimeout(() => {
            setIsLoading(false)
            setSuccessMsg(
                'If an account exists for this email, password-reset instructions will be sent.'
            )
        }, 800)
    }

    return (
        <main className="min-h-screen bg-[#f1faf8]">
            <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[0.88fr_1.12fr]">


                {/* LEFT PANEL */}
                <section className="relative isolate flex min-h-[220px] sm:min-h-[300px] flex-col justify-between overflow-hidden bg-[#053d40] px-5 py-6 sm:px-10 sm:py-10 lg:sticky lg:top-0 lg:h-screen lg:min-h-0 lg:px-10 xl:px-14">

                    {/* Background image */}
                    <img
                        src="/images/forgot-password-bg.jpeg"
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
                    />

                    {/* Dark teal overlay for readable text */}
                    <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#032f35]/90 via-[#006c69]/75 to-[#062b3b]/85" />

                    {/* Decorative glow */}
                    <div className="pointer-events-none absolute -right-20 top-20 -z-10 h-64 w-64 rounded-full bg-teal-300/10 blur-3xl" />

                    {/* Logo */}
                    <div className="relative z-10 w-fit rounded-2xl bg-white p-2.5 sm:p-3 shadow-xl">
                        <Logo size={160} />
                    </div>

                    {/* Main content */}
                    <div className="relative z-10 my-6 sm:my-10 max-w-xl lg:my-5">

                        <span className="mb-3 sm:mb-5 inline-flex items-center gap-2 rounded-full border border-teal-100/30 bg-white/10 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm backdrop-blur-md">
                            <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-teal-300 shadow-[0_0_10px_rgba(94,234,212,0.8)]" />
                            Secure Account Recovery
                        </span>

                        <h1 className="text-2xl sm:text-4xl lg:text-5xl xl:text-[3.25rem] font-bold leading-tight tracking-tight">
                            Forgot Your
                            <span className="mt-1 block text-teal-300">
                                Password?
                            </span>
                        </h1>

                        <p className="mt-3 sm:mt-5 max-w-md text-xs sm:text-base leading-relaxed sm:leading-7 text-teal-50/90 hidden xs:block">
                            No worries! We’ll help you get back into your
                            MediStock account securely and easily.
                        </p>

                        {/* Feature cards */}
                        <div className="mt-4 sm:mt-8 grid max-w-lg grid-cols-3 gap-2 sm:gap-3 hidden sm:grid">

                            {/* Secure */}
                            <div className="rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:bg-white/15 sm:p-4">
                                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-teal-300/20 text-teal-200">
                                    <svg
                                        viewBox="0 0 24 24"
                                        className="h-6 w-6"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.7"
                                    >
                                        <path d="M12 3 20 6v5c0 5-3.4 8.3-8 10-4.6-1.7-8-5-8-10V6l8-3Z" />
                                        <path d="m8.5 12 2.2 2.2 4.8-5" />
                                    </svg>
                                </div>
                                <p className="text-sm font-semibold">Secure</p>
                                <p className="mt-1 text-xs text-teal-50/80">Process</p>
                            </div>

                            {/* Quick */}
                            <div className="rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:bg-white/15 sm:p-4">
                                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-teal-300/20 text-teal-200">
                                    <svg
                                        viewBox="0 0 24 24"
                                        className="h-6 w-6"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.7"
                                    >
                                        <circle cx="12" cy="12" r="9" />
                                        <path d="M12 7v5l3 2" />
                                    </svg>
                                </div>
                                <p className="text-sm font-semibold">Quick</p>
                                <p className="mt-1 text-xs text-teal-50/80">Recovery</p>
                            </div>

                            {/* Connected */}
                            <div className="rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:bg-white/15 sm:p-4">
                                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-teal-300/20 text-teal-200">
                                    <svg
                                        viewBox="0 0 24 24"
                                        className="h-6 w-6"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.7"
                                    >
                                        <path d="M20.8 8.8c0 5.2-8.8 11.2-8.8 11.2S3.2 14 3.2 8.8C3.2 5.7 5.3 3.5 8.1 3.5c1.7 0 3.1.9 3.9 2.3.8-1.4 2.2-2.3 3.9-2.3 2.8 0 4.9 2.2 4.9 5.3Z" />
                                    </svg>
                                </div>
                                <p className="text-sm font-semibold">Stay</p>
                                <p className="mt-1 text-xs text-teal-50/80">Connected</p>
                            </div>

                        </div>
                    </div>

                    {/* Footer */}
                    <p className="relative z-10 text-xs tracking-wide text-white/75 sm:text-sm">
                        MediStock · Medical Inventory Intelligence
                    </p>

                </section>


                {/* RIGHT PANEL */}
                <section className="relative flex min-w-0 items-center justify-center overflow-hidden bg-gradient-to-br from-white via-white to-teal-50/80 px-5 py-12 sm:px-9 lg:min-h-screen lg:px-10 xl:px-14">

                    <img
                        src="/images/medi.png"
                        alt=""
                        aria-hidden="true"
                        className="pointer-events-none absolute right-0 top-0 z-0 w-28 opacity-70 sm:w-36 lg:w-44"
                    />

                    <img
                        src="/images/medi1.svg"
                        alt=""
                        aria-hidden="true"
                        className="pointer-events-none absolute bottom-0 right-0 z-0 w-32 opacity-70 sm:w-40 lg:w-48"
                    />

                    <div className="relative z-10 w-full max-w-xl">

                        <div className="mb-10 lg:hidden">
                            <Logo size={170} />
                        </div>

                        <div className="mb-8">
                            <div className="mb-6 hidden lg:block">
                                <Logo size={190} />
                            </div>

                            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-teal-700">
                                Get back to your account
                            </p>

                            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                                Reset Your Password
                            </h2>

                            <p className="mt-4 max-w-lg text-base leading-7 text-slate-500 sm:text-lg">
                                Enter your email address and we’ll send you
                                instructions to reset your password.
                            </p>
                        </div>

                        {successMsg && (
                            <div
                                role="status"
                                className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800"
                            >
                                <p className="font-semibold">Check your email</p>
                                <p className="mt-1">{successMsg}</p>
                            </div>
                        )}

                        {errorMsg && (
                            <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                {errorMsg}
                            </div>
                        )}

                        <form
                            onSubmit={handleSubmit(onSubmit)}
                            noValidate
                            className="space-y-6"
                        >
                            <div>
                                <label
                                    htmlFor="email"
                                    className="mb-2 block text-sm font-semibold text-slate-700"
                                >
                                    Email Address
                                </label>

                                <div className="relative">
                                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                                        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
                                            <rect x="3" y="5" width="18" height="14" rx="2" />
                                            <path d="m4 7 8 6 8-6" />
                                        </svg>
                                    </span>

                                    <input
                                        id="email"
                                        type="email"
                                        autoComplete="email"
                                        placeholder="Enter your email address"
                                        aria-invalid={Boolean(errors.email)}
                                        {...register('email', {
                                            required: 'Email address is required',
                                            pattern: {
                                                value: /^\S+@\S+\.\S+$/,
                                                message: 'Enter a valid email address',
                                            },
                                        })}
                                        className={`w-full rounded-xl border bg-white py-4 pl-12 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10 ${errors.email
                                                ? 'border-red-500'
                                                : 'border-slate-200 hover:border-teal-300'
                                            }`}
                                    />
                                </div>

                                {errors.email && (
                                    <p className="mt-2 text-sm text-red-600">
                                        {errors.email.message}
                                    </p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-teal-700 to-teal-500 px-5 py-4 font-semibold text-white shadow-lg shadow-teal-700/20 transition hover:-translate-y-0.5 hover:from-teal-800 hover:to-teal-600 focus:outline-none focus:ring-4 focus:ring-teal-600/20 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {isLoading ? (
                                    <>
                                        <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        Send Reset Link
                                        <span aria-hidden="true" className="text-xl">→</span>
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="my-8 flex items-center gap-4">
                            <div className="h-px flex-1 bg-slate-200" />
                            <span className="text-sm text-slate-400">
                                Remember your password?
                            </span>
                            <div className="h-px flex-1 bg-slate-200" />
                        </div>

                        <p className="text-center text-sm text-slate-600">
                            Return to{' '}
                            <Link
                                to="/"
                                className="font-semibold text-teal-700 underline decoration-teal-300 underline-offset-4 transition hover:text-teal-900"
                            >
                                Sign In
                            </Link>
                        </p>

                        <p className="mt-10 flex items-center justify-center gap-2 text-center text-xs text-slate-400">
                            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7">
                                <rect x="5" y="10" width="14" height="11" rx="2" />
                                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                            </svg>
                            Your account security matters to us
                        </p>
                    </div>
                </section>
            </div>
        </main>
    )
}

export default ForgotPasswordPage
