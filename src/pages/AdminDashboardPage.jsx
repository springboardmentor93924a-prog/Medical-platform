import { useEffect, useState } from 'react';
import { adminService } from '../services/adminService'; 
import { useAuth } from '../context/AuthContext';
import { 
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

export default function AdminDashboardPage() {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchDashboardData();
    }, []);

const [categoryData, setCategoryData] = useState([]);

// Update fetchDashboardData
    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError(''); // Clear previous errors
            
            // Use Promise.allSettled so if ONE call fails, the others still succeed
            const results = await Promise.allSettled([
                adminService.getAllUsers(),
                adminService.getDashboardStats(),
                adminService.getCategoryStats()
            ]);

            // Users
            // Users
            if (results[0].status === 'fulfilled') {
                setUsers(results[0].value);
            } else {
                console.error("Users API failed:", results[0].reason);
                // ADD THIS to alert you on screen:
                alert("Error loading users: " + results[0].reason.message);
            }            
            // Stats
            if (results[1].status === 'fulfilled') {
                setStats(results[1].value);
            } else {
                console.error("Stats API failed:", results[1].reason);
            }

            // Categories
            if (results[2].status === 'fulfilled') {
                setCategoryData(results[2].value);
            } else {
                console.error("Category API failed:", results[2].reason);
            }

        } catch (err) {
            setError(err.message || 'Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };



    const handleToggleStatus = async (userId) => {
        try {
            await adminService.toggleUserStatus(userId);
            // Refresh only the users list after toggling
            const updatedUsers = await adminService.getAllUsers();
            setUsers(updatedUsers);
        } catch (err) {
            alert(err.message || 'Failed to toggle user status');
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading Admin Dashboard...</div>;
    if (error) return <div className="p-8 text-center text-red-500 bg-red-50 rounded-md m-8">{error}</div>;

    // Format data for the Recharts Pie Chart
    const pieData = stats ? [
        { name: 'In Stock', value: Math.max(0, stats.totalMedicines - stats.lowStockCount - stats.outOfStockCount - stats.expiredCount), color: '#10b981' }, // Emerald
        { name: 'Low Stock', value: stats.lowStockCount, color: '#f59e0b' }, // Amber
        { name: 'Out of Stock', value: stats.outOfStockCount, color: '#ef4444' }, // Red
        { name: 'Expired', value: stats.expiredCount, color: '#6b7280' }, // Gray
    ] : [];

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-800">Admin Control Panel</h1>
                <p className="text-gray-500">{user?.fullName || 'Admin'}. Here is your system overview.</p>
            </div>

            {/* --- INVENTORY OVERVIEW CARDS --- */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col">
                        <span className="text-sm font-medium text-gray-500">Total Medicines</span>
                        <span className="text-3xl font-bold text-gray-900">{stats.totalMedicines}</span>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col">
                        <span className="text-sm font-medium text-gray-500">Total Inventory Value</span>
                        <span className="text-3xl font-bold text-emerald-600">${stats.totalInventoryValue.toLocaleString()}</span>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col">
                        <span className="text-sm font-medium text-gray-500">Low Stock Alerts</span>
                        <span className="text-3xl font-bold text-red-500">{stats.lowStockCount}</span>
                    </div>
                </div>
            )}

            {/* --- GRAPHS SECTION --- */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    {/* Pie Chart: Stock Status */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Stock Status Overview</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie 
                                        data={pieData} 
                                        dataKey="value" 
                                        nameKey="name" 
                                        cx="50%" cy="50%" 
                                        outerRadius={90} 
                                        label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" height={36}/>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Bar Chart: Mocked Categories (Can be wired to real data later) */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Categories</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={categoryData}>
    <XAxis dataKey="name" tick={{fontSize: 12}} />
    <YAxis />
    <Tooltip />
    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
</BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* --- USER MANAGEMENT TABLE --- */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800">User Management</h3>
                    <p className="text-sm text-gray-500">Manage system access, roles, and user credentials.</p>
                </div>
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
    {users.length === 0 ? (
        <tr>
            <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                No users found or loading failed.
            </td>
        </tr>
    ) : (
        users.map((u) => (
            <tr key={u.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-bold">
                            {u.fullName ? u.fullName.charAt(0) : 'U'}
                        </div>
                        <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                                {u.fullName || 'Unknown User'}
                            </div>
                            <div className="text-sm text-gray-500">
                                {u.email || 'No email'}
                            </div>
                        </div>
                    </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 uppercase">
                        {u.roles && u.roles.length > 0 ? u.roles[0].replace('ROLE_', '') : 'STAFF'}
                    </span>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        u.enabled !== false // Defaults to true if undefined
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                    }`}>
                        {u.enabled !== false ? 'Active' : 'Disabled'}
                    </span>
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                        onClick={() => handleToggleStatus(u.id)}
                        className={`font-semibold hover:underline ${
                            u.enabled !== false ? 'text-red-600 hover:text-red-900' : 'text-emerald-600 hover:text-emerald-900'
                        }`}
                    >
                        {u.enabled !== false ? 'Revoke Access' : 'Grant Access'}
                    </button>
                </td>
            </tr>
        ))
    )}
</tbody>
                </table>
            </div>
        </div>
    );
}