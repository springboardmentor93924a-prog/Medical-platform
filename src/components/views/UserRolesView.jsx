import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { Trash2, Edit, Plus, UserPlus } from 'lucide-react';
import { AddUserModal } from '../modals/AddUserModal';

export const UserRolesView = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    
    const fetchUsers = async () => {
        try {
            setLoading(true);
            const data = await adminService.getAllUsers();
            setUsers(data);
        } catch (err) {
            console.error("Failed to fetch users:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this user?")) return;
        try {
            await adminService.deleteUser(id);
            fetchUsers();
        } catch (err) {
            alert(err.response?.data?.message || err.message);
        }
    };

    const handleEdit = (user) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

       const handleToggleStatus = async (userId) => {
        try {
            // Make sure this endpoint matches your backend
            await adminService.toggleUserStatus(userId);
            fetchUsers(); // Refresh the table to show the new status
        } catch (err) {
            alert("Failed to toggle status: " + err.message);
        }
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold">User Management</h2>
                <button 
                    onClick={() => { setEditingUser(null); setIsModalOpen(true); }}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm px-4 py-2 rounded-lg flex items-center gap-2"
                >
                    <Plus size={16} /> Add User
                </button>
            </div>

            {loading ? (
                <p className="text-center text-slate-500 py-8">Loading users...</p>
            ) : (
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b">
                        <tr>
                            <th className="px-4 py-3">Name</th>
                            <th className="px-4 py-3">Email</th>
                            <th className="px-4 py-3">Role</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {users.map(u => (
                            <tr key={u.id} className="hover:bg-slate-50">
                                <td className="px-4 py-3 font-semibold">{u.fullName}</td>
                                <td className="px-4 py-3 text-slate-500">{u.email}</td>
                                <td className="px-4 py-3">
                                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold uppercase">
                                        {u.roles?.[0]?.replace('ROLE_', '') || 'STAFF'}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <button onClick={() => handleEdit(u)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded mr-2"><Edit size={16} /></button>
                                    <button onClick={() => handleDelete(u.id)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded"><Trash2 size={16} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {/* We will reuse the AddUserModal for editing */}
            {isModalOpen && (
                <AddUserModal 
                    isOpen={isModalOpen} 
                    initialData={editingUser} 
                    onClose={() => setIsModalOpen(false)} 
                    onSave={async (data) => {
                        try {
                            if (editingUser) {
                                await adminService.updateUser(editingUser.id, data);
                            } else {
                                await adminService.createUser(data);
                            }
                            setIsModalOpen(false);
                            fetchUsers();
                        } catch (err) {
                            alert("Failed to save user: " + err.message);
                        }
                    }} 
                />
            )}
        </div>
    );
};