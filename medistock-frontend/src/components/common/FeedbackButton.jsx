
import React, { useState } from 'react';
import { MessageCircleHeart, Sparkles, ArrowUpRight } from 'lucide-react';
import { SubmitFeedbackModal } from '../modals/SubmitFeedbackModal';

export const FeedbackButton = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <style>{`
                @keyframes feedbackFloat {
                    0%, 100% {
                        transform: translateY(0);
                    }
                    50% {
                        transform: translateY(-5px);
                    }
                }

                @keyframes feedbackPulse {
                    0% {
                        transform: scale(1);
                        opacity: 0.65;
                    }
                    100% {
                        transform: scale(1.45);
                        opacity: 0;
                    }
                }

                @keyframes feedbackShine {
                    0% {
                        transform: translateX(-150%) skewX(-20deg);
                    }
                    45%, 100% {
                        transform: translateX(250%) skewX(-20deg);
                    }
                }

                @keyframes feedbackSparkle {
                    0%, 100% {
                        transform: scale(0.8) rotate(0deg);
                        opacity: 0.5;
                    }
                    50% {
                        transform: scale(1.2) rotate(18deg);
                        opacity: 1;
                    }
                }

                .feedback-float {
                    animation: feedbackFloat 3.5s ease-in-out infinite;
                }

                .feedback-pulse {
                    animation: feedbackPulse 2.2s ease-out infinite;
                }

                .feedback-shine {
                    animation: feedbackShine 4s ease-in-out infinite;
                }

                .feedback-sparkle {
                    animation: feedbackSparkle 2s ease-in-out infinite;
                }

                @media (prefers-reduced-motion: reduce) {
                    .feedback-float,
                    .feedback-pulse,
                    .feedback-shine,
                    .feedback-sparkle {
                        animation: none !important;
                    }
                }
            `}</style>

            <div className="feedback-float fixed bottom-2 right-2 z-40 sm:bottom-5 sm:right-5">
                <button
                    type="button"
                    onClick={() => setIsOpen(true)}
                    title="Share your feedback"
                    aria-label="Submit feedback"
                    aria-haspopup="dialog"
                    className="
                        group relative flex h-10 w-10 items-center
                        justify-start overflow-hidden rounded-full
                        border border-white/30
                        bg-gradient-to-br from-sky-100 via-blue-400 to-cyan-600
                        text-white shadow-lg
                        shadow-[0_8px_25px_rgba(79,70,229,0.35)]
                        transition-all duration-500 ease-out
                        hover:w-36 hover:-translate-y-1
                        hover:shadow-[0_14px_35px_rgba(79,70,229,0.45)]
                        active:scale-95
                        focus-visible:outline-none
                        focus-visible:ring-4 focus-visible:ring-indigo-400/40
                        dark:border-white/15
                        dark:from-teal-500 from-sky-80 via-blue-90 to-cyan-500
                        dark:shadow-[0_8px_28px_rgba(79,70,229,0.4)]
                        sm:h-14 sm:w-14
                    "
                >
                    {/* Animated outer pulse */}
                    <span className="feedback-pulse pointer-events-none absolute inset-0 rounded-full border-2 border-indigo-400 dark:border-indigo-300" />

                    {/* Shine effect */}
                    <span className="feedback-shine pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-transparent via-white/25 to-transparent" />

                    {/* Icon */}
                    <span className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center">
                        <MessageCircleHeart
                            size={23}
                            strokeWidth={2.2}
                            className="transition-all duration-300 group-hover:scale-110 group-hover:-rotate-6"
                        />

                        <Sparkles
                            size={11}
                            className="feedback-sparkle absolute right-3 top-2.5 text-amber-600"
                        />
                    </span>

                    {/* Expandable text */}
                    <span className="
                        relative z-10 flex items-center gap-1.5
                        whitespace-nowrap pr-4
                        text-[14px] font-bold tracking-wide
                        opacity-0 transition-all duration-300
                        group-hover:opacity-100
                    ">
                        Feedback
                        <ArrowUpRight
                            size={14}
                            className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        />
                    </span>
                </button>
            </div>

            <SubmitFeedbackModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
            />
        </>
    );
};
