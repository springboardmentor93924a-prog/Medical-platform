import { useEffect, useState } from 'react';
import { adminService } from '../services/adminService'; // Adjust path if needed
import { useAuth } from '../context/AuthContext'; // Assuming you use AuthContext

export default function AdminDashboardPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { user } = useAuth();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const data = await adminService.getAllUsers();
            setUsers(data);
        } catch (err) {
            setError(err.message || 'Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (userId) => {
        try {
            await adminService.toggleUserStatus(userId);
            fetchUsers(); // Refresh the list after toggling
        } catch (err) {
            alert(err.message || 'Failed to toggle user status');
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading system users...</div>;

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800">Admin Control Panel</h1>
                <p className="text-gray-500">Manage system access, roles, and user credentials.</p>
            </div>

            {error && <div className="bg-red-50 text-red-600 p-4 rounded-md mb-4">{error}</div>}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((u) => (
                            <tr key={u.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-10 w-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-bold">
                                            {u.fullName.charAt(0)}
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900">{u.fullName}</div>
                                            <div className="text-sm text-gray-500">{u.email}</div>
                                        </div>
                                    </div>
                                </td>
                               <td className="px-6 py-4 whitespace-nowrap">
    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
        u.enabled 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
    }`}>
        {u.enabled ? 'Active' : 'Disabled'}
    </span>
</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {/* Note: You may need to pass 'enabled' from the backend to show this correctly */}
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                        Active
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
    <button 
        onClick={() => handleToggleStatus(u.id)}
        className={`font-semibold hover:underline ${
            u.enabled ? 'text-red-600 hover:text-red-900' : 'text-emerald-600 hover:text-emerald-900'
        }`}
    >
        {u.enabled ? 'Revoke Access' : 'Grant Access'}
    </button>
</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}