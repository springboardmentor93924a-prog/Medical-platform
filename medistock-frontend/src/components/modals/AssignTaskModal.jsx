
import React, { useEffect, useState } from 'react';
import {
    X, ClipboardCheck, User, FileText, Flag,
    Users, Loader2, AlertCircle, CheckCircle2,
    ChevronDown, Sparkles
} from 'lucide-react';
import { adminService } from '../../services/adminService';

export const AssignTaskModal = ({ isOpen, onClose, onSave }) => {
    const [staffList, setStaffList] = useState([]);
    const [staffLoading, setStaffLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        assignedToId: '',
        title: '',
        description: '',
        priority: 'NORMAL'
    });

    useEffect(() => {
        if (!isOpen) return;

        setFormData({
            assignedToId: '',
            title: '',
            description: '',
            priority: 'NORMAL'
        });
        setError('');

        const fetchStaff = async () => {
            setStaffLoading(true);
            try {
                const data = await adminService.getAllStaff();
                setStaffList(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error('Failed to load staff:', err);
                setError('Unable to load staff members. Please try again.');
            } finally {
                setStaffLoading(false);
            }
        };

        fetchStaff();
    }, [isOpen]);

    if (!isOpen) return null;

    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.assignedToId) {
            setError('Please select a staff member.');
            return;
        }

        if (!formData.title.trim()) {
            setError('Please enter a task title.');
            return;
        }

        try {
            setSubmitting(true);
            setError('');

            await onSave({
                ...formData,
                title: formData.title.trim(),
                description: formData.description.trim()
            });
        } catch (err) {
            setError(err?.message || 'Failed to assign task. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const priorities = [
        {
            value: 'LOW',
            label: 'Low',
            description: 'Can be handled later',
            style: 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300',
            active: 'border-slate-400 bg-slate-100 ring-2 ring-slate-200 dark:border-slate-500 dark:bg-slate-700/60 dark:ring-slate-700'
        },
        {
            value: 'NORMAL',
            label: 'Normal',
            description: 'Regular priority',
            style: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300',
            active: 'border-blue-500 bg-blue-50 ring-2 ring-blue-100 dark:border-blue-400 dark:bg-blue-500/15 dark:ring-blue-500/20'
        },
        {
            value: 'HIGH',
            label: 'High',
            description: 'Needs attention',
            style: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300',
            active: 'border-amber-500 bg-amber-50 ring-2 ring-amber-100 dark:border-amber-400 dark:bg-amber-500/15 dark:ring-amber-500/20'
        },
        {
            value: 'URGENT',
            label: 'Urgent',
            description: 'Immediate attention',
            style: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300',
            active: 'border-rose-500 bg-rose-50 ring-2 ring-rose-100 dark:border-rose-400 dark:bg-rose-500/15 dark:ring-rose-500/20'
        }
    ];

    const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-500 dark:focus:ring-blue-500/10';

    const labelClass = 'mb-2 flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300';

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-3 backdrop-blur-sm sm:p-5"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget && !submitting) onClose();
            }}
        >
            <div className="my-auto w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">

                {/* Header */}
                <div className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50 px-5 py-5 dark:border-slate-800 dark:from-[#10213e] dark:via-[#142951] dark:to-[#172c4a] sm:px-6">
                    <div className="pointer-events-none absolute -right-8 -top-12 h-36 w-36 rounded-full bg-blue-300/20 blur-3xl dark:bg-cyan-400/10" />

                    <div className="relative flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20 dark:bg-blue-500">
                                <ClipboardCheck size={21} />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                                    Assign New Task
                                </h2>
                                <p className="mt-0.5 text-xs text-slate-500 dark:text-blue-100/60">
                                    Create and assign work to your staff
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="rounded-xl p-2 text-slate-400 transition hover:bg-white hover:text-slate-700 disabled:opacity-50 dark:hover:bg-white/10 dark:hover:text-white"
                        >
                            <X size={19} />
                        </button>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">

                    {/* Staff Selection */}
                    <div>
                        <label className={labelClass}>
                            <Users size={14} className="text-blue-600 dark:text-blue-400" />
                            Assign to Staff
                            <span className="text-rose-500">*</span>
                        </label>

                        <div className="relative">
                            <select
                                required
                                disabled={staffLoading || submitting}
                                value={formData.assignedToId}
                                onChange={e => updateField('assignedToId', e.target.value)}
                                className={`${inputClass} appearance-none pr-10 disabled:cursor-not-allowed disabled:opacity-60`}
                            >
                                <option value="">
                                    {staffLoading ? 'Loading staff members...' : '-- Choose Staff Member --'}
                                </option>
                                {staffList.map(staff => (
                                    <option key={staff.id} value={staff.id}>
                                        {staff.fullName} ({staff.email})
                                    </option>
                                ))}
                            </select>

                            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
                                {staffLoading ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <ChevronDown size={16} />
                                )}
                            </div>
                        </div>

                        {!staffLoading && staffList.length === 0 && (
                            <div className="mt-2 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                                <AlertCircle size={15} className="mt-0.5 shrink-0" />
                                No staff users found. Create a user with role STAFF first.
                            </div>
                        )}

                        {formData.assignedToId && (
                            <div className="mt-2 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 size={14} />
                                Staff member selected
                            </div>
                        )}
                    </div>

                    {/* Task Title */}
                    <div>
                        <label className={labelClass}>
                            <FileText size={14} className="text-blue-600 dark:text-blue-400" />
                            Task Title
                            <span className="text-rose-500">*</span>
                        </label>

                        <input
                            type="text"
                            required
                            maxLength={120}
                            placeholder="e.g. Count Rack A medicines"
                            value={formData.title}
                            disabled={submitting}
                            onChange={e => updateField('title', e.target.value)}
                            className={inputClass}
                        />

                        <p className="mt-1 text-right text-[10px] text-slate-400 dark:text-slate-500">
                            {formData.title.length}/120
                        </p>
                    </div>

                    {/* Description */}
                    <div>
                        <label className={labelClass}>
                            <ClipboardCheck size={14} className="text-blue-600 dark:text-blue-400" />
                            Task Instructions
                            <span className="font-normal text-slate-400">(Optional)</span>
                        </label>

                        <textarea
                            rows={3}
                            maxLength={1000}
                            placeholder="Add instructions or details to help the staff complete this task..."
                            value={formData.description}
                            disabled={submitting}
                            onChange={e => updateField('description', e.target.value)}
                            className={`${inputClass} resize-none`}
                        />

                        <p className="mt-1 text-right text-[10px] text-slate-400 dark:text-slate-500">
                            {formData.description.length}/1000
                        </p>
                    </div>

                    {/* Priority */}
                    <div>
                        <label className={labelClass}>
                            <Flag size={14} className="text-blue-600 dark:text-blue-400" />
                            Set Task Priority
                        </label>

                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                            {priorities.map(priority => {
                                const selected = formData.priority === priority.value;

                                return (
                                    <button
                                        key={priority.value}
                                        type="button"
                                        disabled={submitting}
                                        onClick={() => updateField('priority', priority.value)}
                                        className={`rounded-xl border p-3 text-left transition-all ${
                                            selected ? priority.active : `${priority.style} hover:brightness-95`
                                        }`}
                                    >
                                        <div className="flex items-center justify-between gap-1">
                                            <span className="text-xs font-black">
                                                {priority.label}
                                            </span>
                                            {selected && (
                                                <CheckCircle2 size={14} />
                                            )}
                                        </div>
                                        <p className="mt-1 text-[9px] leading-tight opacity-70">
                                            {priority.description}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
                            <AlertCircle size={15} className="mt-0.5 shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Footer */}
                    <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 dark:border-slate-800 sm:flex-row sm:justify-between">
                        <div className="hidden items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500 sm:flex">
                            <Sparkles size={12} />
                            Assign work and track progress
                        </div>

                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={submitting}
                                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                disabled={submitting || staffLoading || staffList.length === 0}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-500 dark:hover:bg-blue-600"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 size={15} className="animate-spin" />
                                        Assigning...
                                    </>
                                ) : (
                                    <>
                                        <ClipboardCheck size={15} />
                                        Assign Task
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};
