
import React, { useState, useEffect, useMemo } from 'react';
import { adminService } from '../../services/adminService';
import {
    Trash2,
    Edit,
    Plus,
    UserPlus,
    Search,
    Users,
    ShieldCheck,
    ShieldAlert,
    RefreshCw,
    Mail,
    MoreVertical,
    UserRound,
    CheckCircle2,
    XCircle,
    Filter,
    ChevronDown,
    UserCog,
    Activity,
    AlertCircle,
    X
} from 'lucide-react';
import { AddUserModal } from '../modals/AddUserModal';

export const UserRolesView = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [actionUser, setActionUser] = useState(null);
    const [error, setError] = useState('');

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await adminService.getAllUsers();
            setUsers(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to fetch users:', err);
            setError('Unable to load users. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const getRole = (user) =>
        user.roles?.[0]?.replace('ROLE_', '').toUpperCase() || 'STAFF';

    const getUserStatus = (user) => {
        if (typeof user.enabled === 'boolean') return user.enabled;
        if (typeof user.active === 'boolean') return user.active;
        if (typeof user.isActive === 'boolean') return user.isActive;
        return null;
    };

    const roleCounts = useMemo(() => {
        return users.reduce((acc, user) => {
            const role = getRole(user);
            acc[role] = (acc[role] || 0) + 1;
            return acc;
        }, {});
    }, [users]);

    const activeCount = users.filter(user => getUserStatus(user) === true).length;
    const inactiveCount = users.filter(user => getUserStatus(user) === false).length;

    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const search = searchTerm.trim().toLowerCase();
            const matchesSearch =
                !search ||
                (user.fullName || '').toLowerCase().includes(search) ||
                (user.email || '').toLowerCase().includes(search) ||
                getRole(user).toLowerCase().includes(search);

            const matchesRole =
                roleFilter === 'ALL' || getRole(user) === roleFilter;

            const status = getUserStatus(user);
            const matchesStatus =
                statusFilter === 'ALL' ||
                (statusFilter === 'ACTIVE' && status === true) ||
                (statusFilter === 'INACTIVE' && status === false) ||
                (statusFilter === 'UNKNOWN' && status === null);

            return matchesSearch && matchesRole && matchesStatus;
        });
    }, [users, searchTerm, roleFilter, statusFilter]);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;

        try {
            await adminService.deleteUser(id);
            setActionUser(null);
            await fetchUsers();
        } catch (err) {
            alert(err.response?.data?.message || err.message);
        }
    };

    const handleEdit = (user) => {
        setEditingUser(user);
        setIsModalOpen(true);
        setActionUser(null);
    };

    const handleToggleStatus = async (userId) => {
        try {
            await adminService.toggleUserStatus(userId);
            await fetchUsers();
            setActionUser(null);
        } catch (err) {
            alert('Failed to toggle status: ' + err.message);
        }
    };

    const handleSaveUser = async (data) => {
        try {
            if (editingUser) {
                await adminService.updateUser(editingUser.id, data);
            } else {
                await adminService.createUser(data);
            }

            setIsModalOpen(false);
            setEditingUser(null);
            await fetchUsers();
        } catch (err) {
            alert('Failed to save user: ' + err.message);
        }
    };

    const getRoleStyle = (role) => {
        const styles = {
            ADMIN: 'bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-400/20',
            PHARMACIST: 'bg-cyan-50 text-cyan-700 ring-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-300 dark:ring-cyan-400/20',
            SUPPLIER: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/20',
            STAFF: 'bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-400/20'
        };

        return styles[role] || styles.STAFF;
    };

    const getInitials = (name) =>
        (name || 'U')
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map(part => part[0])
            .join('')
            .toUpperCase();

    const roleOptions = [...new Set(users.map(getRole))].sort();

    const clearFilters = () => {
        setSearchTerm('');
        setRoleFilter('ALL');
        setStatusFilter('ALL');
    };

    return (
        <div className="min-h-full space-y-6 bg-slate-50 p-4 text-slate-900 transition-colors dark:bg-[#080f1e] dark:text-slate-100 sm:p-6">

            {/* HEADER */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#101a2d] sm:p-7">
                <div className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-16 right-1/3 h-36 w-36 rounded-full bg-cyan-500/10 blur-3xl" />

                <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                    <div className="flex items-start gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-600/20">
                            <UserCog size={27} />
                        </div>
                        <div>
                            <div className="mb-1 flex flex-wrap items-center gap-2">
                                <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                                    User Management
                                </h1>
                                <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-blue-300">
                                    Admin only
                                </span>
                            </div>
                            <p className="max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                                Manage user accounts, update profiles, control access, and maintain role assignments across MediStock.
                            </p>
                        </div>
                    </div>

                    <div className="flex shrink-0 gap-2">
                        <button
                            onClick={fetchUsers}
                            disabled={loading}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                            Refresh
                        </button>

                        <button
                            onClick={() => {
                                setEditingUser(null);
                                setIsModalOpen(true);
                            }}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:shadow-blue-600/30"
                        >
                            <Plus size={18} />
                            Add User
                        </button>
                    </div>
                </div>
            </div>

            {/* STAT CARDS */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    title="Total Users"
                    value={users.length}
                    subtitle="Registered accounts"
                    icon={Users}
                    iconStyle="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300"
                    accent="from-blue-500 to-cyan-400"
                />
                <StatCard
                    title="Administrators"
                    value={roleCounts.ADMIN || 0}
                    subtitle="Administrative role"
                    icon={ShieldCheck}
                    iconStyle="bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300"
                    accent="from-violet-500 to-purple-400"
                />
                <StatCard
                    title="Active Users"
                    value={activeCount}
                    subtitle={activeCount + ' accounts reporting active status'}
                    icon={Activity}
                    iconStyle="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300"
                    accent="from-emerald-500 to-teal-400"
                />
                <StatCard
                    title="Inactive Users"
                    value={inactiveCount}
                    subtitle="Accounts reporting inactive status"
                    icon={ShieldAlert}
                    iconStyle="bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300"
                    accent="from-rose-500 to-pink-400"
                />
            </div>

            {/* ERROR */}
            {error && (
                <div className="flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-300 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                        <AlertCircle size={18} />
                        {error}
                    </div>
                    <button
                        onClick={fetchUsers}
                        className="self-start rounded-lg border border-rose-200 px-3 py-1.5 font-semibold hover:bg-rose-100 dark:border-rose-400/20 dark:hover:bg-rose-500/10 sm:self-auto"
                    >
                        Try again
                    </button>
                </div>
            )}

            {/* MAIN PANEL */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#101a2d]">

                {/* PANEL HEADER */}
                <div className="flex flex-col gap-4 border-b border-slate-200 p-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                    <div>
                        <h2 className="text-lg font-bold">Team Directory</h2>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {loading ? 'Loading accounts...' : `Showing ${filteredUsers.length} of ${users.length} users`}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                            <ShieldCheck size={15} className="text-emerald-500" />
                            Role-based access
                        </span>
                    </div>
                </div>

                {/* SEARCH AND FILTERS */}
                <div className="grid grid-cols-1 gap-3 border-b border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/40 md:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_190px_190px_auto]">
                    <div className="relative">
                        <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Search name, email, or role..."
                            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-10 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-[#101a2d] dark:text-slate-100 dark:focus:border-blue-400"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                                title="Clear search"
                            >
                                <X size={15} />
                            </button>
                        )}
                    </div>

                    <div className="relative">
                        <Filter size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <select
                            value={roleFilter}
                            onChange={e => setRoleFilter(e.target.value)}
                            className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-9 pr-9 text-sm font-medium outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-[#101a2d] dark:text-slate-200"
                        >
                            <option value="ALL">All roles</option>
                            {roleOptions.map(role => (
                                <option key={role} value={role}>{role}</option>
                            ))}
                        </select>
                        <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>

                    <div className="relative">
                        <Activity size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-9 pr-9 text-sm font-medium outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-[#101a2d] dark:text-slate-200"
                        >
                            <option value="ALL">All statuses</option>
                            <option value="ACTIVE">Active</option>
                            <option value="INACTIVE">Inactive</option>
                            <option value="UNKNOWN">Status unavailable</option>
                        </select>
                        <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>

                    <button
                        onClick={clearFilters}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-600 dark:border-slate-700 dark:bg-[#101a2d] dark:text-slate-300 dark:hover:border-blue-400/40 dark:hover:text-blue-300"
                    >
                        Clear filters
                    </button>
                </div>

                {/* TABLE */}
                {loading ? (
                    <div className="space-y-3 p-5">
                        {Array.from({ length: 5 }).map((_, index) => (
                            <div key={index} className="flex animate-pulse items-center gap-4 rounded-xl border border-slate-100 p-4 dark:border-slate-800">
                                <div className="h-10 w-10 rounded-xl bg-slate-200 dark:bg-slate-700" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-3 w-1/3 rounded bg-slate-200 dark:bg-slate-700" />
                                    <div className="h-3 w-1/2 rounded bg-slate-100 dark:bg-slate-800" />
                                </div>
                                <div className="h-7 w-20 rounded-full bg-slate-100 dark:bg-slate-800" />
                            </div>
                        ))}
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="px-5 py-16 text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                            <Users size={29} />
                        </div>
                        <h3 className="text-base font-bold">No users found</h3>
                        <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                            {users.length === 0
                                ? 'No user accounts are available yet. Add a user to get started.'
                                : 'Try changing your search or filters to find the account.'}
                        </p>
                        {users.length > 0 ? (
                            <button onClick={clearFilters} className="mt-4 text-sm font-bold text-blue-600 hover:underline dark:text-blue-400">
                                Clear filters
                            </button>
                        ) : (
                            <button
                                onClick={() => {
                                    setEditingUser(null);
                                    setIsModalOpen(true);
                                }}
                                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-500"
                            >
                                <UserPlus size={16} /> Add first user
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Desktop table */}
                        <div className="hidden overflow-x-auto md:block">
                            <table className="w-full min-w-[760px] text-left text-sm">
                                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-400">
                                    <tr>
                                        <th className="px-6 py-4 font-bold">User</th>
                                        <th className="px-6 py-4 font-bold">Role</th>
                                        <th className="px-6 py-4 font-bold">Account status</th>
                                        <th className="px-6 py-4 text-right font-bold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {filteredUsers.map(user => {
                                        const role = getRole(user);
                                        const status = getUserStatus(user);

                                        return (
                                            <tr key={user.id} className="group transition-colors hover:bg-blue-50/40 dark:hover:bg-slate-800/40">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/15 to-cyan-500/15 text-sm font-extrabold text-blue-700 ring-1 ring-blue-500/10 dark:text-blue-300">
                                                            {getInitials(user.fullName)}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="truncate font-bold text-slate-800 dark:text-slate-100">
                                                                {user.fullName || 'Unnamed user'}
                                                            </p>
                                                            <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-slate-500 dark:text-slate-400">
                                                                <Mail size={12} />
                                                                {user.email || 'No email provided'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-extrabold tracking-wide ring-1 ${getRoleStyle(role)}`}>
                                                        <ShieldCheck size={12} />
                                                        {role}
                                                    </span>
                                                </td>

                                                <td className="px-6 py-4">
                                                    {status === null ? (
                                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                                            <AlertCircle size={13} /> Unknown
                                                        </span>
                                                    ) : (
                                                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-bold ${status
                                                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                                                            : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300'
                                                            }`}>
                                                            {status ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                                                            {status ? 'Active' : 'Inactive'}
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleEdit(user)}
                                                            title="Edit user"
                                                            aria-label={`Edit ${user.fullName || 'user'}`}
                                                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-400/40 dark:hover:bg-blue-500/10 dark:hover:text-blue-300"
                                                        >
                                                            <Edit size={14} /> Edit
                                                        </button>

                                                        <button
                                                            onClick={() => handleToggleStatus(user.id)}
                                                            title={status === true ? 'Revoke access' : status === false ? 'Grant access' : 'Toggle account status'}
                                                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-amber-400/40 dark:hover:bg-amber-500/10 dark:hover:text-amber-300"
                                                        >
                                                            {status === true ? <ShieldAlert size={14} /> : <ShieldCheck size={14} />}
                                                            {status === true ? 'Revoke' : 'Grant'}
                                                        </button>

                                                        <button
                                                            onClick={() => handleDelete(user.id)}
                                                            title="Delete user"
                                                            aria-label={`Delete ${user.fullName || 'user'}`}
                                                            className="inline-flex items-center justify-center rounded-lg border border-rose-200 bg-rose-50 p-2 text-rose-600 transition hover:bg-rose-100 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20"
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile cards */}
                        <div className="space-y-3 p-4 md:hidden">
                            {filteredUsers.map(user => {
                                const role = getRole(user);
                                const status = getUserStatus(user);

                                return (
                                    <div key={user.id} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/60">
                                        <div className="flex items-start gap-3">
                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 font-extrabold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                                                {getInitials(user.fullName)}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate font-bold">{user.fullName || 'Unnamed user'}</p>
                                                <p className="mt-1 break-all text-xs text-slate-500 dark:text-slate-400">{user.email || 'No email provided'}</p>
                                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                                    <span className={`rounded-lg px-2.5 py-1 text-[10px] font-extrabold ring-1 ${getRoleStyle(role)}`}>
                                                        {role}
                                                    </span>
                                                    {status !== null && (
                                                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${status
                                                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                                                            : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300'
                                                            }`}>
                                                            {status ? 'Active' : 'Inactive'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                                            <button onClick={() => handleEdit(user)} className="flex items-center justify-center gap-1.5 rounded-lg bg-blue-50 px-2 py-2.5 text-xs font-bold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                                                <Edit size={14} /> Edit
                                            </button>
                                            <button onClick={() => handleToggleStatus(user.id)} className="flex items-center justify-center gap-1.5 rounded-lg bg-amber-50 px-2 py-2.5 text-xs font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                                                {status === true ? <ShieldAlert size={14} /> : <ShieldCheck size={14} />}
                                                {status === true ? 'Revoke' : 'Grant'}
                                            </button>
                                            <button onClick={() => handleDelete(user.id)} className="flex items-center justify-center gap-1.5 rounded-lg bg-rose-50 px-2 py-2.5 text-xs font-bold text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
                                                <Trash2 size={14} /> Delete
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>

            {/* ROLE SUMMARY */}
            {!loading && users.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#101a2d] sm:p-6">
                    <div className="mb-4 flex items-center gap-2">
                        <div className="rounded-lg bg-slate-100 p-2 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            <UserRound size={17} />
                        </div>
                        <div>
                            <h3 className="font-bold">Role Distribution</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Current user accounts grouped by role</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
                        {Object.entries(roleCounts).map(([role, count]) => (
                            <button
                                key={role}
                                onClick={() => setRoleFilter(roleFilter === role ? 'ALL' : role)}
                                className={`rounded-xl border p-4 text-left transition hover:-translate-y-0.5 ${roleFilter === role
                                    ? 'border-blue-400 bg-blue-50 dark:border-blue-400/50 dark:bg-blue-500/10'
                                    : 'border-slate-200 bg-slate-50 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900/50 dark:hover:border-slate-600'
                                    }`}
                            >
                                <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">{role}</p>
                                <div className="mt-2 flex items-end justify-between">
                                    <span className="text-2xl font-black">{count}</span>
                                    <Users size={17} className="text-slate-400" />
                                </div>
                                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                                    <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400" style={{ width: `${users.length ? (count / users.length) * 100 : 0}%` }} />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {isModalOpen && (
                <AddUserModal
                    isOpen={isModalOpen}
                    initialData={editingUser}
                    onClose={() => {
                        setIsModalOpen(false);
                        setEditingUser(null);
                    }}
                    onSave={handleSaveUser}
                />
            )}
        </div>
    );
};

const StatCard = ({ title, value, subtitle, icon: Icon, iconStyle, accent }) => (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-[#101a2d]">
        <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accent}`} />
        <div className="flex items-start justify-between gap-3">
            <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{title}</p>
                <p className="mt-3 text-3xl font-black tracking-tight">{value}</p>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
            </div>
            <div className={`rounded-xl p-3 ${iconStyle}`}>
                <Icon size={21} />
            </div>
        </div>
    </div>
);
