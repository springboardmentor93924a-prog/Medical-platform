import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  ShieldCheck, 
  CheckCircle, 
  XCircle, 
  UserCheck, 
  UserX,
  Mail,
  Phone,
  Clock
} from 'lucide-react';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import { userService } from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

const UsersPage = () => {
  const { user: currentUser } = useAuth();
  const { showToast } = useNotification();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Create User Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    role: 'STAFF'
  });
  const [isCreating, setIsCreating] = useState(false);

  // Status Change Modal
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [targetUser, setTargetUser] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusReason, setStatusReason] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        size: 10,
        search: search.trim() || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
      };
      const res = await userService.getAll(params);
      const data = res?.data?.data || res?.data || res;
      const list = Array.isArray(data) ? data : (data?.content || []);
      setUsers(list);
      setTotalPages(data?.totalPages || 1);
      setTotalElements(data?.totalElements || list.length);
    } catch (err) {
      console.error('Error fetching users', err);
      showToast('error', 'Failed to load user accounts');
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, statusFilter, showToast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(0);
    fetchUsers();
  };

  const handleOpenStatusModal = (user, status) => {
    setTargetUser(user);
    setNewStatus(status);
    setStatusReason('');
    setIsStatusModalOpen(true);
  };

  const handleConfirmStatus = async (e) => {
    e.preventDefault();
    if (!targetUser || !newStatus) return;

    try {
      setIsUpdatingStatus(true);
      await userService.updateStatus(targetUser.id, {
        status: newStatus,
        reason: statusReason
      });
      showToast('success', `User ${targetUser.fullName} updated to ${newStatus}`);
      setIsStatusModalOpen(false);
      setTargetUser(null);
      fetchUsers();
    } catch (err) {
      console.error('Status update failure', err);
      showToast('error', err.response?.data?.message || 'Failed to update user status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      setIsCreating(true);
      await userService.create(createForm);
      showToast('success', `User account created for ${createForm.fullName}`);
      setIsCreateModalOpen(false);
      setCreateForm({
        fullName: '',
        email: '',
        password: '',
        phone: '',
        address: '',
        role: 'STAFF'
      });
      fetchUsers();
    } catch (err) {
      console.error('Create user failure', err);
      showToast('error', err.response?.data?.message || 'Failed to create user account');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Administration</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage hospital staff accounts, assign security roles, and enforce authentication lifecycle ({totalElements} accounts).
          </p>
        </div>
        <Button
          variant="primary"
          icon={UserPlus}
          onClick={() => setIsCreateModalOpen(true)}
        >
          Create User Account
        </Button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by full name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(0);
              }}
              className="w-full py-2 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="PHARMACIST">Pharmacist</option>
              <option value="STAFF">Staff</option>
              <option value="SUPPLIER">Supplier</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
              className="w-full py-2 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="PENDING">Pending Approval</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
        </form>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12">
            <LoadingSpinner size="lg" message="Loading users..." />
          </div>
        ) : users.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No users found"
              description="No user accounts match the search criteria."
              icon={Users}
              action={{ label: "Create User", onClick: () => setIsCreateModalOpen(true) }}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500 border-b">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Registered Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => {
                  const isSelf = u.id === currentUser?.id;
                  return (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-900 flex items-center gap-2">
                          <span>{u.fullName}</span>
                          {isSelf && (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full font-bold">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 font-mono">ID: #{u.id}</div>
                      </td>
                      <td className="py-3 px-4 text-xs">
                        <div className="flex items-center gap-1.5 text-gray-700">
                          <Mail className="w-3.5 h-3.5 text-gray-400" />
                          <span>{u.email}</span>
                        </div>
                        {u.phone && (
                          <div className="flex items-center gap-1.5 text-gray-500 mt-0.5">
                            <Phone className="w-3.5 h-3.5 text-gray-400" />
                            <span>{u.phone}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                          u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                          u.role === 'PHARMACIST' ? 'bg-emerald-100 text-emerald-700' :
                          u.role === 'SUPPLIER' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {u.status === 'ACTIVE' && <Badge variant="success">Active</Badge>}
                        {u.status === 'INACTIVE' && <Badge variant="secondary">Inactive</Badge>}
                        {u.status === 'PENDING' && <Badge variant="warning">Pending</Badge>}
                        {u.status === 'SUSPENDED' && <Badge variant="danger">Suspended</Badge>}
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-500">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {!isSelf && (
                          <div className="flex items-center justify-end gap-1.5">
                            {u.status === 'PENDING' && (
                              <button
                                onClick={() => handleOpenStatusModal(u, 'ACTIVE')}
                                className="px-2 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded flex items-center gap-1"
                                title="Approve Registration"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Approve</span>
                              </button>
                            )}

                            {u.status === 'ACTIVE' && (
                              <button
                                onClick={() => handleOpenStatusModal(u, 'INACTIVE')}
                                className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded"
                                title="Deactivate Account"
                              >
                                <UserX className="w-4 h-4" />
                              </button>
                            )}

                            {u.status === 'INACTIVE' && (
                              <button
                                onClick={() => handleOpenStatusModal(u, 'ACTIVE')}
                                className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded"
                                title="Reactivate Account"
                              >
                                <UserCheck className="w-4 h-4" />
                              </button>
                            )}

                            {u.status !== 'SUSPENDED' && (
                              <button
                                onClick={() => handleOpenStatusModal(u, 'SUSPENDED')}
                                className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                                title="Suspend Account"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-500">
              Page {page + 1} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {isCreateModalOpen && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Create New User Account"
          size="md"
        >
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={createForm.fullName}
                  onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                  placeholder="e.g. Dr. Alex Mercer"
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  placeholder="name@hospital.org"
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Initial Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Security Role</label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                >
                  <option value="STAFF">Staff (Nurse / Orderly)</option>
                  <option value="PHARMACIST">Pharmacist</option>
                  <option value="ADMIN">System Administrator</option>
                  <option value="SUPPLIER">Supplier</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address / Ward</label>
                <input
                  type="text"
                  value={createForm.address}
                  onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
                  placeholder="Department or physical address"
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={isCreating}
              >
                Create Account
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Status Update Modal */}
      {isStatusModalOpen && targetUser && (
        <Modal
          isOpen={isStatusModalOpen}
          onClose={() => {
            setIsStatusModalOpen(false);
            setTargetUser(null);
          }}
          title={`Update Status: ${targetUser.fullName}`}
          size="sm"
        >
          <form onSubmit={handleConfirmStatus} className="space-y-4">
            <p className="text-sm text-gray-600">
              Set user status to <strong className="text-gray-900">{newStatus}</strong>.
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason / Notes</label>
              <textarea
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                rows={3}
                placeholder="Audit notes for this status change..."
                className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsStatusModalOpen(false)}
                disabled={isUpdatingStatus}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant={newStatus === 'ACTIVE' ? 'primary' : 'danger'}
                loading={isUpdatingStatus}
              >
                Confirm {newStatus}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default UsersPage;
