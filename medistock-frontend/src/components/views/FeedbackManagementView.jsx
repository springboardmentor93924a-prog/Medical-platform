
import React, { useEffect, useState } from 'react';
import {
    MessageSquare,
    AlertCircle,
    Bug,
    Lightbulb,
    MessageCircle,
    CheckCircle,
    Trash2,
    Reply,
} from 'lucide-react';
import { adminService } from '../../services/adminService';

export const FeedbackManagementView = () => {
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [filterPriority, setFilterPriority] = useState('ALL');
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyText, setReplyText] = useState('');

    const fetchFeedback = async () => {
        try {
            setLoading(true);
            const data = await adminService.getAllFeedback();
            setFeedbacks(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchFeedback(); }, []);

    const handleStatusChange = async (id, status) => {
        await adminService.updateFeedback(id, { status });
        fetchFeedback();
    };

    const handleReply = async (id) => {
        if (!replyText.trim()) return;
        await adminService.updateFeedback(id, { adminReply: replyText, status: 'IN_REVIEW' });
        setReplyingTo(null);
        setReplyText('');
        fetchFeedback();
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this feedback?")) return;
        await adminService.deleteFeedback(id);
        fetchFeedback();
    };

    const filtered = feedbacks.filter(fb => {
        const matchStatus = filterStatus === 'ALL' || fb.status === filterStatus;
        const matchPriority = filterPriority === 'ALL' || fb.priority === filterPriority;
        return matchStatus && matchPriority;
    });

    const stats = {
        total: feedbacks.length,
        open: feedbacks.filter(f => f.status === 'OPEN').length,
        resolved: feedbacks.filter(f => f.status === 'RESOLVED').length,
        critical: feedbacks.filter(f => f.priority === 'CRITICAL' && f.status !== 'RESOLVED').length
    };

    const getPriorityColor = (p) => {
        if (p === 'CRITICAL') return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20';
        if (p === 'HIGH') return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20';
        if (p === 'LOW') return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700/50 dark:text-slate-300 dark:border-slate-600';
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20';
    };

    const getStatusColor = (s) => {
        if (s === 'RESOLVED') return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300';
        if (s === 'IN_REVIEW') return 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300';
        if (s === 'REJECTED') return 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300';
        return 'bg-slate-100 text-slate-700 dark:bg-slate-700/50 dark:text-slate-300';
    };

    const getCategoryIcon = (c) => {
        if (c === 'BUG') return <Bug size={17} className="text-rose-600 dark:text-rose-400" />;
        if (c === 'FEATURE') return <Lightbulb size={17} className="text-amber-600 dark:text-amber-400" />;
        if (c === 'COMPLAINT') return <AlertCircle size={17} className="text-orange-600 dark:text-orange-400" />;
        return <MessageCircle size={17} className="text-blue-600 dark:text-blue-400" />;
    };

    return (
        <div className="mx-auto max-w-[1450px] space-y-6 p-4 sm:p-6 lg:p-7">

            {/* Page Header */}
            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-purple-50 p-5 shadow-sm dark:border-slate-700/70 dark:from-[#111c32] dark:via-[#111c32] dark:to-[#252044] sm:p-7">
                <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-purple-400/10 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-24 right-1/3 h-48 w-48 rounded-full bg-blue-400/10 blur-3xl" />

                <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-purple-100 text-purple-700 shadow-sm dark:bg-purple-500/15 dark:text-purple-300">
                        <MessageSquare size={27} />
                    </div>

                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                                Feedback Management
                            </h1>
                            <span className="rounded-full border border-purple-200 bg-purple-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-300">
                                Admin Center
                            </span>
                        </div>
                        <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-slate-500 dark:text-slate-400 sm:text-sm">
                            Review user suggestions, manage reported issues and track feedback resolution.
                        </p>
                    </div>
                </div>

                <div className="relative mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-200/80 pt-4 text-[11px] text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1.5">
                        <MessageCircle size={14} className="text-purple-500" />
                        User suggestions
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                        <Bug size={14} className="text-rose-500" />
                        Issue tracking
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                        <CheckCircle size={14} className="text-emerald-500" />
                        Resolution management
                    </span>
                </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                {[
                    {
                        label: 'Total Feedback',
                        value: stats.total,
                        icon: MessageSquare,
                        iconStyle: 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-300',
                        accent: 'text-slate-900 dark:text-white',
                        description: 'All submitted feedback',
                    },
                    {
                        label: 'Open',
                        value: stats.open,
                        icon: MessageCircle,
                        iconStyle: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300',
                        accent: 'text-amber-600 dark:text-amber-400',
                        description: 'Awaiting attention',
                    },
                    {
                        label: 'Resolved',
                        value: stats.resolved,
                        icon: CheckCircle,
                        iconStyle: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300',
                        accent: 'text-emerald-600 dark:text-emerald-400',
                        description: 'Successfully resolved',
                    },
                    {
                        label: 'Critical Pending',
                        value: stats.critical,
                        icon: AlertCircle,
                        iconStyle: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300',
                        accent: 'text-rose-600 dark:text-rose-400',
                        description: 'Unresolved critical items',
                    },
                ].map((item) => {
                    const Icon = item.icon;

                    return (
                        <div
                            key={item.label}
                            className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-slate-700/70 dark:bg-slate-900/70 sm:p-5"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        {item.label}
                                    </p>
                                    <p className={`mt-2 text-2xl font-black tracking-tight ${item.accent} sm:text-3xl`}>
                                        {item.value}
                                    </p>
                                    <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">
                                        {item.description}
                                    </p>
                                </div>

                                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.iconStyle}`}>
                                    <Icon size={19} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Feedback Workspace */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700/70 dark:bg-slate-900/70">

                {/* Section Header */}
                <div className="flex flex-col gap-3 border-b border-slate-100 p-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <div>
                        <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                            <MessageSquare size={17} className="text-purple-500" />
                            Submitted Feedback
                        </h2>
                        <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                            Review and manage feedback from all user roles
                        </p>
                    </div>

                    <span className="inline-flex w-fit items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                        {filtered.length} {filtered.length === 1 ? 'Feedback' : 'Feedbacks'}
                    </span>
                </div>

                {/* Filters */}
                <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/30 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-purple-600 shadow-sm dark:bg-slate-800 dark:text-purple-300">
                            <MessageCircle size={15} />
                        </span>
                        Filter feedback
                    </div>

                    <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
                        <select
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 outline-none transition-all focus:border-purple-400 focus:ring-4 focus:ring-purple-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-purple-500"
                        >
                            <option value="ALL">All Statuses</option>
                            <option value="OPEN">Open</option>
                            <option value="IN_REVIEW">In Review</option>
                            <option value="RESOLVED">Resolved</option>
                            <option value="REJECTED">Rejected</option>
                        </select>

                        <select
                            value={filterPriority}
                            onChange={e => setFilterPriority(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 outline-none transition-all focus:border-purple-400 focus:ring-4 focus:ring-purple-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-purple-500"
                        >
                            <option value="ALL">All Priorities</option>
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                            <option value="CRITICAL">Critical</option>
                        </select>
                    </div>
                </div>

                {/* Feedback List */}
                <div className="space-y-3 bg-slate-50/40 p-3 dark:bg-slate-950/20 sm:p-4">
                    {loading ? (
                        <div className="space-y-3 py-2">
                            {Array.from({ length: 3 }).map((_, index) => (
                                <div
                                    key={index}
                                    className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900"
                                >
                                    <div className="flex gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-slate-200 dark:bg-slate-700" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-3 w-1/3 rounded bg-slate-200 dark:bg-slate-700" />
                                            <div className="h-2.5 w-2/3 rounded bg-slate-100 dark:bg-slate-800" />
                                        </div>
                                    </div>
                                    <div className="mt-5 h-12 rounded-lg bg-slate-100 dark:bg-slate-800" />
                                </div>
                            ))}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center dark:border-slate-700 dark:bg-slate-900/60">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-50 text-purple-400 dark:bg-purple-500/10 dark:text-purple-300">
                                <MessageSquare size={30} />
                            </div>
                            <p className="mt-4 text-sm font-bold text-slate-800 dark:text-slate-200">
                                No feedback to display
                            </p>
                            <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-slate-400 dark:text-slate-500">
                                Users can submit feedback from any role. Feedback matching your selected filters will appear here.
                            </p>
                        </div>
                    ) : (
                        filtered.map(fb => (
                            <div
                                key={fb.id}
                                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:border-purple-200 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-purple-500/30"
                            >
                                {/* Feedback Card Header */}
                                <div className="p-4 sm:p-5">
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                        <div className="flex min-w-0 items-start gap-3">
                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 ring-1 ring-slate-200/70 dark:bg-slate-800 dark:ring-slate-700">
                                                {getCategoryIcon(fb.category)}
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h3 className="text-sm font-bold leading-snug text-slate-900 dark:text-white sm:text-base">
                                                        {fb.title}
                                                    </h3>
                                                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                                        {fb.category || 'GENERAL'}
                                                    </span>
                                                </div>

                                                <p className="mt-1.5 break-all text-[11px] text-slate-500 dark:text-slate-400">
                                                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                                                        {fb.submittedByName}
                                                    </span>
                                                    <span className="mx-1">·</span>
                                                    {fb.submittedByRole}
                                                    <span className="mx-1">·</span>
                                                    {fb.submittedByEmail}
                                                </p>

                                                <p className="mt-1.5 text-[10px] text-slate-400 dark:text-slate-500">
                                                    Submitted {new Date(fb.createdAt).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                                            <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] font-bold ${getPriorityColor(fb.priority)}`}>
                                                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                                {fb.priority} PRIORITY
                                            </span>

                                            <span className={`rounded-lg px-2.5 py-1.5 text-[10px] font-bold ${getStatusColor(fb.status)}`}>
                                                {fb.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Message */}
                                    <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/80 p-3.5 dark:border-slate-800 dark:bg-slate-800/40 sm:p-4">
                                        <p className="whitespace-pre-wrap break-words text-xs leading-relaxed text-slate-700 dark:text-slate-300 sm:text-sm">
                                            {fb.message}
                                        </p>
                                    </div>

                                    {/* Existing Admin Reply */}
                                    {fb.adminReply && (
                                        <div className="mt-3 overflow-hidden rounded-xl border border-blue-100 bg-blue-50/70 dark:border-blue-500/20 dark:bg-blue-500/[0.07]">
                                            <div className="flex items-center gap-2 border-b border-blue-100 px-3.5 py-2.5 dark:border-blue-500/20">
                                                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
                                                    <Reply size={13} />
                                                </div>
                                                <p className="text-[11px] font-bold text-blue-900 dark:text-blue-200">
                                                    Admin Reply
                                                </p>
                                            </div>
                                            <p className="whitespace-pre-wrap break-words px-3.5 py-3 text-xs leading-relaxed text-blue-800 dark:text-blue-200">
                                                {fb.adminReply}
                                            </p>
                                        </div>
                                    )}

                                    {/* Reply Composer */}
                                    {replyingTo === fb.id && (
                                        <div className="mt-4 rounded-xl border border-purple-200 bg-purple-50/50 p-3.5 dark:border-purple-500/25 dark:bg-purple-500/[0.06] sm:p-4">
                                            <div className="mb-2 flex items-center gap-2">
                                                <Reply size={15} className="text-purple-600 dark:text-purple-300" />
                                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                                    Write your reply
                                                </p>
                                            </div>

                                            <textarea
                                                rows="3"
                                                value={replyText}
                                                onChange={e => setReplyText(e.target.value)}
                                                placeholder="Write a helpful response to this feedback..."
                                                className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-xs leading-relaxed text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-purple-400 focus:ring-4 focus:ring-purple-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-purple-500"
                                            />

                                            <div className="mt-3 flex flex-wrap justify-end gap-2">
                                                <button
                                                    onClick={() => { setReplyingTo(null); setReplyText(''); }}
                                                    className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={() => handleReply(fb.id)}
                                                    className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-purple-700 hover:shadow-md"
                                                >
                                                    <Reply size={13} />
                                                    Send Reply
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Card Actions */}
                                <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 bg-slate-50/70 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/30 sm:px-5">
                                    {fb.status !== 'RESOLVED' && (
                                        <button
                                            onClick={() => handleStatusChange(fb.id, 'RESOLVED')}
                                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-[11px] font-bold text-white shadow-sm transition hover:bg-emerald-700 hover:shadow-md"
                                        >
                                            <CheckCircle size={13} />
                                            Mark Resolved
                                        </button>
                                    )}

                                    {fb.status !== 'IN_REVIEW' && fb.status !== 'RESOLVED' && (
                                        <button
                                            onClick={() => handleStatusChange(fb.id, 'IN_REVIEW')}
                                            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-bold text-amber-700 transition hover:bg-amber-100 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/20"
                                        >
                                            <MessageCircle size={13} />
                                            Set In Review
                                        </button>
                                    )}

                                    {!fb.adminReply && (
                                        <button
                                            onClick={() => { setReplyingTo(fb.id); setReplyText(''); }}
                                            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-[11px] font-bold text-blue-700 transition hover:bg-blue-100 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300 dark:hover:bg-blue-500/20"
                                        >
                                            <Reply size={13} />
                                            Reply
                                        </button>
                                    )}

                                    <button
                                        onClick={() => handleDelete(fb.id)}
                                        title="Delete feedback"
                                        aria-label="Delete feedback"
                                        className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* List Footer */}
                {!loading && feedbacks.length > 0 && (
                    <div className="flex flex-col gap-1 border-t border-slate-100 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Showing <span className="font-bold text-slate-800 dark:text-slate-200">{filtered.length}</span> of{' '}
                            <span className="font-bold text-slate-800 dark:text-slate-200">{feedbacks.length}</span> feedback entries
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">
                            Feedback management overview
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
