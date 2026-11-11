
import React, { useState } from 'react';
import {
    X,
    MessageSquare,
    Check,
    Send,
    Bug,
    Lightbulb,
    MessageCircle,
    AlertCircle,
    Flag,
    Sparkles,
    ShieldCheck,
} from 'lucide-react';
import { adminService } from '../../services/adminService';

export const SubmitFeedbackModal = ({ isOpen, onClose, onSubmitted }) => {
    const [formData, setFormData] = useState({
        title: '',
        message: '',
        category: 'GENERAL',
        priority: 'MEDIUM'
    });

    const [submitting, setSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            await adminService.submitFeedback(formData);
            alert("✅ Thank you! Your feedback has been submitted.");
            setFormData({
                title: '',
                message: '',
                category: 'GENERAL',
                priority: 'MEDIUM'
            });

            if (onSubmitted) onSubmitted();
            onClose();
        } catch (err) {
            alert("Failed to submit: " + (err.response?.data?.message || err.message));
        } finally {
            setSubmitting(false);
        }
    };

    const categoryIcons = {
        GENERAL: MessageCircle,
        BUG: Bug,
        FEATURE: Lightbulb,
        COMPLAINT: AlertCircle
    };

    const CategoryIcon = categoryIcons[formData.category] || MessageCircle;

    const priorityStyles = {
        LOW: 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300',
        MEDIUM: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300',
        HIGH: 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-300',
        CRITICAL: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300'
    };

    const inputClass =
        "w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition-all duration-200 placeholder:font-normal placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:border-slate-600 dark:focus:border-blue-500 dark:focus:bg-slate-900 dark:focus:ring-blue-500/10";

    const labelClass =
        "mb-2 block text-xs font-bold text-slate-700 dark:text-slate-300";

    return (
        <>
            <style>{`
                @keyframes feedbackBackdropIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes feedbackModalIn {
                    0% {
                        opacity: 0;
                        transform: translateY(24px) scale(0.94);
                    }
                    70% {
                        opacity: 1;
                        transform: translateY(-3px) scale(1.01);
                    }
                    100% {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }

                @keyframes feedbackContentIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .feedback-backdrop {
                    animation: feedbackBackdropIn 220ms ease-out both;
                }

                .feedback-modal {
                    animation: feedbackModalIn 420ms cubic-bezier(.2,.8,.2,1) both;
                }

                .feedback-content {
                    animation: feedbackContentIn 450ms ease-out 100ms both;
                }

                @media (prefers-reduced-motion: reduce) {
                    .feedback-backdrop,
                    .feedback-modal,
                    .feedback-content {
                        animation: none !important;
                    }
                }
            `}</style>

            <div
                className="feedback-backdrop fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/65 p-3 backdrop-blur-md sm:p-5"
                onMouseDown={(e) => {
                    if (e.target === e.currentTarget) onClose();
                }}
            >
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="feedback-modal-title"
                    className="feedback-modal relative my-auto w-full max-w-xl overflow-hidden rounded-3xl border border-white/60 bg-white shadow-[0_30px_100px_rgba(0,0,0,0.30)] dark:border-slate-700/80 dark:bg-[#111c2e] dark:shadow-[0_30px_100px_rgba(0,0,0,0.55)]"
                >
                    {/* Top accent */}
                    <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400" />

                    {/* Decorative background */}
                    <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-500/5 blur-3xl dark:bg-blue-500/10" />

                    {/* Header */}
                    <div className="relative flex items-center justify-between border-b border-slate-100 px-5 py-5 dark:border-slate-800 sm:px-7">
                        <div className="flex min-w-0 items-center gap-3.5">
                            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/20">
                                <MessageSquare size={21} />
                                <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-cyan-400 text-blue-950 dark:border-[#111c2e]">
                                    <Sparkles size={10} />
                                </span>
                            </div>

                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h3
                                        id="feedback-modal-title"
                                        className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white"
                                    >
                                        Share Your Feedback
                                    </h3>

                                    <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
                                        We listen
                                    </span>
                                </div>

                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                    Help us make MediStock better.
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close feedback modal"
                            className="ml-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 transition-all hover:rotate-90 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-rose-500/30 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
                        >
                            <X size={17} />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="feedback-content">

                        <div className="max-h-[70vh] space-y-5 overflow-y-auto px-5 py-6 sm:px-7">

                            {/* Intro */}
                            <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50/70 p-4 dark:border-blue-500/15 dark:from-blue-500/10 dark:to-indigo-500/5">
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-blue-600 shadow-sm dark:bg-slate-800 dark:text-blue-400">
                                        <Lightbulb size={17} />
                                    </div>

                                    <div>
                                        <p className="text-xs font-extrabold text-blue-900 dark:text-blue-200">
                                            Your voice matters!
                                        </p>
                                        <p className="mt-1 text-[11px] leading-relaxed text-blue-800/75 dark:text-blue-300/70">
                                            Report an issue, suggest a feature, or share your experience. Every submission helps improve your workspace.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Title */}
                            <div>
                                <label className={labelClass}>
                                    Feedback Title <span className="text-rose-500">*</span>
                                </label>

                                <input
                                    type="text"
                                    required
                                    maxLength="120"
                                    placeholder="e.g. POS is running slowly"
                                    value={formData.title}
                                    onChange={e =>
                                        setFormData({
                                            ...formData,
                                            title: e.target.value
                                        })
                                    }
                                    className={inputClass}
                                />

                                <div className="mt-1.5 flex justify-end">
                                    <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                                        {formData.title.length} / 120
                                    </span>
                                </div>
                            </div>

                            {/* Category and Priority */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                                <div>
                                    <label className={labelClass}>
                                        <span className="flex items-center gap-1.5">
                                            <CategoryIcon size={13} className="text-blue-500" />
                                            Category
                                        </span>
                                    </label>

                                    <div className="relative">
                                        <select
                                            value={formData.category}
                                            onChange={e =>
                                                setFormData({
                                                    ...formData,
                                                    category: e.target.value
                                                })
                                            }
                                            className={`${inputClass} appearance-none pr-9`}
                                        >
                                            <option value="GENERAL">General Feedback</option>
                                            <option value="BUG">Bug Report</option>
                                            <option value="FEATURE">Feature Request</option>
                                            <option value="COMPLAINT">Complaint</option>
                                        </select>

                                        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                                            ▾
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <label className={labelClass}>
                                        <span className="flex items-center gap-1.5">
                                            <Flag size={13} className="text-orange-500" />
                                            Priority
                                        </span>
                                    </label>

                                    <div className="relative">
                                        <select
                                            value={formData.priority}
                                            onChange={e =>
                                                setFormData({
                                                    ...formData,
                                                    priority: e.target.value
                                                })
                                            }
                                            className={`${inputClass} appearance-none pr-9 ${priorityStyles[formData.priority] || ''}`}
                                        >
                                            <option value="LOW">Low</option>
                                            <option value="MEDIUM">Medium</option>
                                            <option value="HIGH">High</option>
                                            <option value="CRITICAL">Critical</option>
                                        </select>

                                        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-current opacity-60">
                                            ▾
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Message */}
                            <div>
                                <div className="mb-2 flex items-center justify-between">
                                    <label className={`${labelClass} mb-0`}>
                                        Your Message <span className="text-rose-500">*</span>
                                    </label>

                                    <span className={`text-[10px] font-semibold ${
                                        formData.message.length >= 1900
                                            ? 'text-rose-500'
                                            : 'text-slate-400 dark:text-slate-500'
                                    }`}>
                                        {formData.message.length}/2000
                                    </span>
                                </div>

                                <textarea
                                    required
                                    rows="5"
                                    maxLength="2000"
                                    placeholder="Tell us what happened, what you expected, or how we can improve..."
                                    value={formData.message}
                                    onChange={e =>
                                        setFormData({
                                            ...formData,
                                            message: e.target.value
                                        })
                                    }
                                    className={`${inputClass} min-h-[130px] resize-y leading-relaxed`}
                                />

                                <p className="mt-1.5 text-[10px] text-slate-400 dark:text-slate-500">
                                    Please provide enough detail to help us understand your feedback.
                                </p>
                            </div>

                            {/* Privacy note */}
                            <div className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50 px-3.5 py-3 dark:border-slate-700/70 dark:bg-slate-900/50">
                                <ShieldCheck size={15} className="shrink-0 text-emerald-500" />
                                <p className="text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">
                                    Your feedback will be shared with the MediStock administration team.
                                </p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex flex-col-reverse gap-2.5 border-t border-slate-100 bg-slate-50/80 px-5 py-4 dark:border-slate-800 dark:bg-slate-900/50 sm:flex-row sm:justify-end sm:px-7">

                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs font-bold text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-slate-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-xs font-extrabold text-white shadow-lg shadow-blue-600/20 transition-all duration-200 hover:-translate-y-0.5 hover:from-blue-700 hover:to-indigo-700 hover:shadow-blue-600/30 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                            >
                                {submitting ? (
                                    <>
                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <Send size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                        Submit Feedback
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};
