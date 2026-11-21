import React, { useEffect, useState } from 'react';
import { adminService } from '../services/adminService';
import { Search, Plus, Edit, Trash2 } from 'lucide-react';
import { AddUserModal } from '../components/modals/AddUserModal';

export default function UsersManagementPage() {
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchUsers = async () => {
        try {
            const data = await adminService.getAllUsers();
            setUsers(data);
        } catch (err) {
            console.error(err);
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
            alert(err.message);
        }
    };
      const handleEdit = (user) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const filteredUsers = users.filter(u => 
        u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 max-w-[1400px] mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-slate-900">Users & Roles</h1>

            {/* Search Bar */}
            <div className="flex items-center gap-4 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex-1 flex items-center gap-2 px-3">
                    <Search size={18} className="text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Search accounts by username, name, or email..." 
                        className="w-full text-sm outline-none text-slate-700 bg-transparent"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors"
                >
                    <Plus size={16} /> New User Account
                </button>
            </div>

            {/* Table */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                        <tr>
                            <th className="px-6 py-4">ID</th>
                            <th className="px-6 py-4">Username</th>
                            <th className="px-6 py-4">Full Name</th>
                            <th className="px-6 py-4">Email</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Assigned Roles</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredUsers.map((u) => (
                            <tr key={u.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 text-slate-500">#{u.id}</td>
                                <td className="px-6 py-4 font-bold text-slate-800">{u.email?.split('@')[0]}</td>
                                <td className="px-6 py-4 text-slate-700">{u.fullName}</td>
                                <td className="px-6 py-4 text-slate-600">{u.email}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${u.enabled !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                        {u.enabled !== false ? 'ACTIVE' : 'DISABLED'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full text-xs font-bold uppercase">
                                        {u.roles?.[0]?.replace('ROLE_', '') || 'STAFF'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right flex justify-end gap-2">
<button onClick={() => handleEdit(u)} className="p-1.5 text-slate-400 hover:text-blue-600">
        <Edit size={16} />
    </button>                                    <button onClick={() => handleDelete(u.id)} className="p-1.5 text-slate-400 hover:text-rose-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50"><Trash2 size={16} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <AddUserModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSave={async (data) => {
                    await adminService.createUser(data);
                    setIsModalOpen(false);
                    fetchUsers();
                }} 
            />
        </div>
    );
}