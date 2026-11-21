import React, { useEffect, useState } from 'react';
import { adminService } from '../services/adminService';
import { useAuth } from '../context/AuthContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { 
    Pill, DollarSign, ShoppingCart, Users, AlertTriangle, 
    ArrowRight, Plus, Receipt, RefreshCw, FileText, Clock, CheckCircle2
} from 'lucide-react';

export default function AdminDashboardPage({ onNavigate }) {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [statsData, usersData, ordersData] = await Promise.all([
                    adminService.getDashboardStats(),
                    adminService.getAllUsers(),
                    adminService.getPurchaseOrders ? adminService.getPurchaseOrders() : Promise.resolve([])
                ]);
                
                setStats(statsData);
                setUsers(usersData);
                
                // SAFE CHECK: Ensure ordersData is an array before sorting
                if (Array.isArray(ordersData)) {
                    const sortedOrders = [...ordersData].sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
                    setOrders(sortedOrders.slice(0, 4));
                } else {
                    setOrders([]);
                }
                
            } catch (err) {
                console.error("Dashboard fetch error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading || !stats) return <div className="p-8 text-center text-gray-500">Loading Dashboard...</div>;

    // --- MATHEMATICALLY SAFE CHART DATA ---
    const totalMeds = stats.totalMedicines || 0;
    
    // Use the EXACT counts from the backend, no guessing
    const inStockCount = stats.inStockCount || 0;
    const lowStockCount = stats.lowStockCount || 0;
    const outOfStockCount = stats.outOfStockCount || 0;
    const expiredCount = stats.expiredCount || 0;
    
    const getPct = (count) => totalMeds === 0 ? 0 : Math.round((count / totalMeds) * 100);
    
    const inStockPct = getPct(inStockCount);
    const lowStockPct = getPct(lowStockCount);
    const outOfStockPct = getPct(outOfStockCount);
    
    const pieData = [
        { name: 'In Stock', value: inStockCount, color: '#10b981' },
        { name: 'Low Stock', value: lowStockCount, color: '#f59e0b' },
        { name: 'Out of Stock', value: outOfStockCount, color: '#ef4444' },
    ].filter(item => item.value > 0); // Only render segments that actually have items

    const supplierCount = users.filter(u => u.roles?.includes('SUPPLIER')).length;

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-6 bg-slate-50 min-h-screen">
            
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
                <p className="text-sm text-slate-500">Welcome back, {user?.fullName || 'admin'}! Here's what's happening with your inventory today.</p>
            </div>

            {/* TOP 5 STAT CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div onClick={() => onNavigate('inventory')} className="bg-white p-4 rounded-xl border border-slate-300 shadow-lg flex items-start gap-4 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all group">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors"><Pill size={20} /></div>
                    <div>
                        <p className="text-[11px] font-bold text-slate-500 uppercase">TOTAL MEDICINES</p>
                        <h3 className="text-2xl font-black text-slate-900">{totalMeds}</h3>
                        <p className="text-xs text-blue-600 font-semibold flex items-center gap-1 mt-1 group-hover:underline">View Catalogue <ArrowRight size={12} /></p>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-lg flex items-start gap-4">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg"><DollarSign size={20} /></div>
                    <div>
                        <p className="text-[11px] font-bold text-slate-500 uppercase">INVENTORY VALUE</p>
                        <h3 className="text-2xl font-black text-slate-900">₹{stats.totalInventoryValue?.toLocaleString() || 0}</h3>
                        <p className="text-xs text-emerald-600 font-semibold mt-1">Total Assets Value</p>
                    </div>
                </div>

                <div onClick={() => onNavigate('purchase-orders')} className="bg-white p-4 rounded-xl border border-slate-300 shadow-lg flex items-start gap-4 cursor-pointer hover:shadow-md hover:border-purple-300 transition-all group">
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-lg group-hover:bg-purple-100 transition-colors"><ShoppingCart size={20} /></div>
                    <div>
                        <p className="text-[11px] font-bold text-slate-500 uppercase">PURCHASE ORDERS</p>
                        <h3 className="text-2xl font-black text-slate-900">{orders.length}</h3>
                        <p className="text-xs text-purple-600 font-semibold mt-1">Recent Orders</p>
                    </div>
                </div>

                <div onClick={() => onNavigate('suppliers')} className="bg-white p-4 rounded-xl border border-slate-300 shadow-lg flex items-start gap-4 cursor-pointer hover:shadow-md hover:border-amber-300 transition-all group">
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-lg group-hover:bg-amber-100 transition-colors"><Users size={20} /></div>
                    <div>
                        <p className="text-[11px] font-bold text-slate-500 uppercase">SUPPLIERS</p>
                        <h3 className="text-2xl font-black text-slate-900">{supplierCount}</h3>
                        <p className="text-xs text-amber-600 font-semibold flex items-center gap-1 mt-1 group-hover:underline">View Suppliers <ArrowRight size={12} /></p>
                    </div>
                </div>

                <div onClick={() => onNavigate('expiry')} className="bg-white p-4 rounded-xl border border-slate-300 shadow-lg flex items-start gap-4 cursor-pointer hover:shadow-md hover:border-red-300 transition-all group">
                    <div className="p-3 bg-red-50 text-red-600 rounded-lg group-hover:bg-red-100 transition-colors"><AlertTriangle size={20} /></div>
                    <div>
                        <p className="text-[11px] font-bold text-slate-500 uppercase">LOW STOCK ITEMS</p>
                        <h3 className="text-2xl font-black text-slate-900">{lowStockCount}</h3>
                        <p className="text-xs text-red-600 font-semibold flex items-center gap-1 mt-1 group-hover:underline">Restock Now <ArrowRight size={12} /></p>
                    </div>
                </div>
            </div>

            {/* MIDDLE ROW */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 1. Dynamic Donut Chart */}
                <div className="bg-white p-6 rounded-xl border border-slate-300 shadow-lg">
                    <h3 className="text-base font-bold text-slate-900">Stock Status</h3>
                    <p className="text-xs text-slate-500 mb-4">Overview of your stock status</p>
                    
                    <div className="flex items-center gap-6">
                        <div className="relative w-32 h-32 shrink-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie 
                                        data={pieData.length > 0 ? pieData : [{name: 'Empty', value: 1, color: '#e2e8f0'}]} 
                                        dataKey="value" 
                                        cx="50%" cy="50%" 
                                        innerRadius={45} outerRadius={60} 
                                        paddingAngle={2}
                                        stroke="none"
                                    >
                                        {pieData.length > 0 ? pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        )) : <Cell fill="#e2e8f0" />}
                                    </Pie>
                                    <Tooltip formatter={(value) => [`${value} items`, '']} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-sm font-bold text-slate-900">{inStockPct}%</span>
                                <span className="text-[9px] text-slate-500">In Stock</span>
                            </div>
                        </div>

                        {/* Dynamic Legend */}
                        <div className="space-y-3 text-xs w-full">
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500"/>In Stock</span>
                                <span className="font-semibold text-slate-700">{inStockCount} ({inStockPct}%)</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500"/>Low Stock</span>
                                <span className="font-semibold text-slate-700">{lowStockCount} ({lowStockPct}%)</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-rose-500"/>Out of Stock</span>
                                <span className="font-semibold text-slate-700">{outOfStockCount} ({outOfStockPct}%)</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700">Total Medicines</span>
                        <span className="text-sm font-black text-slate-900">{totalMeds}</span>
                    </div>
                    
                    <div className={`mt-3 text-[11px] font-semibold p-2 rounded-lg text-center flex items-center justify-center gap-1 ${
                        (lowStockCount > 0 || outOfStockCount > 0) 
                            ? 'bg-amber-50 text-amber-700' 
                            : 'bg-emerald-50 text-emerald-700'
                    }`}>
                        {(lowStockCount > 0 || outOfStockCount > 0) ? (
                            <><AlertTriangle size={12} /> Some items need your attention.</>
                        ) : (
                            <><CheckCircle2 size={12} /> All medicines are in stock. Great job!</>
                        )}
                    </div>
                </div>

                {/* 2. Expiring Soon */}
                <div className="bg-white p-6 rounded-xl border border-slate-300 shadow-lg flex flex-col justify-between">
                    <div>
                        <h3 className="text-base font-bold text-slate-900">Expiring Soon</h3>
                        <p className="text-xs text-slate-500 mb-4">Medicines expiring in the next 30 days</p>
                        
                        <div className="space-y-3">
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => onNavigate('expiry')}>
                                <div>
                                    <p className="text-xs font-semibold text-slate-500">Near Expiry</p>
                                    {/* Since we don't have a separate "near expiry" count, we show expired as a stand-in for attention */}
                                    <p className="text-xl font-black text-slate-900">{expiredCount}</p>
                                    <p className="text-[10px] text-slate-500">Requires Attention</p>
                                </div>
                                <div className="p-2 bg-amber-100 text-amber-600 rounded-full"><Clock size={16} /></div>
                            </div>

                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => onNavigate('expiry')}>
                                <div>
                                    <p className="text-xs font-semibold text-slate-500">Expired Items</p>
                                    <p className="text-xl font-black text-slate-900">{expiredCount}</p>
                                    <p className="text-[10px] text-slate-500">Already Expired</p>
                                </div>
                                <div className="p-2 bg-rose-100 text-rose-600 rounded-full"><AlertTriangle size={16} /></div>
                            </div>
                        </div>
                    </div>
                    <button onClick={() => onNavigate('expiry')} className="text-xs text-blue-600 font-semibold flex items-center gap-1 mt-4 hover:underline">View All Expiry <ArrowRight size={12} /></button>
                </div>

                {/* 3. Recent Purchase Orders */}
                <div className="bg-white p-6 rounded-xl border border-slate-300 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-base font-bold text-slate-900">Recent Purchase Orders</h3>
                            <p className="text-xs text-slate-500">Latest orders from your suppliers</p>
                        </div>
                        <button onClick={() => onNavigate('purchase-orders')} className="text-xs text-blue-600 font-semibold flex items-center gap-1 hover:underline">View All <ArrowRight size={12} /></button>
                    </div>
                    
                    <table className="w-full text-left text-xs">
                        <thead className="text-slate-400 font-semibold border-b border-slate-100">
                            <tr>
                                <th className="pb-2 font-medium">PO Number</th>
                                <th className="pb-2 font-medium">Supplier</th>
                                <th className="pb-2 font-medium">Amount</th>
                                <th className="pb-2 font-medium text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {orders.length > 0 ? orders.map((po) => (
                                <tr key={po.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => onNavigate('purchase-orders')}>
                                    <td className="py-3 text-blue-600 font-semibold">{po.orderNumber}</td>
                                    <td className="py-3 text-slate-700">{po.supplier?.name || po.supplierName || 'Unknown'}</td>
                                    <td className="py-3 text-slate-900 font-bold">₹{po.totalAmount?.toLocaleString() || '0.00'}</td>
                                    <td className="py-3 text-right">
                                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                                            po.status === 'APPROVED' || po.status === 'RECEIVED' ? 'bg-emerald-50 text-emerald-600' :
                                            po.status === 'PENDING' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                                        }`}>{po.status}</span>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan="4" className="py-4 text-center text-slate-400">No recent orders found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* BOTTOM ROW */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Top Medicines List */}
                <div className="bg-white p-6 rounded-xl border border-slate-300 shadow-md">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-base font-bold text-slate-900">Top Medicines</h3>
                            <p className="text-xs text-slate-500">Most stocked medicines</p>
                        </div>
                        <button onClick={() => onNavigate('inventory')} className="text-xs text-blue-600 font-semibold flex items-center gap-1 hover:underline">View All <ArrowRight size={12} /></button>
                    </div>
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                            <tr>
                                <th className="py-2 px-3 font-medium">#</th>
                                <th className="py-2 px-3 font-medium">Medicine</th>
                                <th className="py-2 px-3 font-medium text-right">Quantity</th>
                                <th className="py-2 px-3 font-medium text-right">Unit</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            <tr>
                                <td className="py-3 px-3 text-slate-400">1</td>
                                <td className="py-3 px-3 font-semibold text-slate-900 flex items-center gap-2"><Pill size={12} className="text-blue-500"/> Amoxicillin 250 mg</td>
                                <td className="py-3 px-3 text-right font-bold">110</td>
                                <td className="py-3 px-3 text-right text-slate-500">units</td>
                            </tr>
                            <tr>
                                <td className="py-3 px-3 text-slate-400">2</td>
                                <td className="py-3 px-3 font-semibold text-slate-900 flex items-center gap-2"><Pill size={12} className="text-emerald-500"/> Atorvastatin 10 mg</td>
                                <td className="py-3 px-3 text-right font-bold">60</td>
                                <td className="py-3 px-3 text-right text-slate-500">units</td>
                            </tr>
                            <tr>
                                <td className="py-3 px-3 text-slate-400">3</td>
                                <td className="py-3 px-3 font-semibold text-slate-900 flex items-center gap-2"><Pill size={12} className="text-rose-500"/> Albuterol Inhaler 90 mcg</td>
                                <td className="py-3 px-3 text-right font-bold">60</td>
                                <td className="py-3 px-3 text-right text-slate-500">units</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Quick Actions */}
                <div className="bg-white p-6 rounded-xl border border-slate-300 shadow-md">
                    <h3 className="text-base font-bold text-slate-900">Quick Actions</h3>
                    <p className="text-xs text-slate-500 mb-6">Perform common tasks quickly</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <button onClick={() => onNavigate('inventory')} className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-blue-50 border border-slate-100 rounded-xl transition-all group">
                            <div className="p-2 bg-blue-100 text-blue-600 rounded-full mb-2 group-hover:scale-110 transition-transform"><Plus size={16} /></div>
                            <span className="text-xs font-semibold text-slate-700">Add Medicine</span>
                        </button>
                        <button onClick={() => onNavigate('billing')} className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-emerald-50 border border-slate-100 rounded-xl transition-all group">
                            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-full mb-2 group-hover:scale-110 transition-transform"><Receipt size={16} /></div>
                            <span className="text-xs font-semibold text-slate-700">Billing / POS</span>
                        </button>
                        <button onClick={() => onNavigate('purchase-orders')} className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-purple-50 border border-slate-100 rounded-xl transition-all group">
                            <div className="p-2 bg-purple-100 text-purple-600 rounded-full mb-2 group-hover:scale-110 transition-transform"><ShoppingCart size={16} /></div>
                            <span className="text-xs font-semibold text-slate-700 text-center">New Purchase Order</span>
                        </button>
                        <button onClick={() => onNavigate('inventory')} className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-amber-50 border border-slate-100 rounded-xl transition-all group">
                            <div className="p-2 bg-amber-100 text-amber-600 rounded-full mb-2 group-hover:scale-110 transition-transform"><RefreshCw size={16} /></div>
                            <span className="text-xs font-semibold text-slate-700 text-center">Stock Adjustment</span>
                        </button>
                        <button onClick={() => onNavigate('reports')} className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-rose-50 border border-slate-100 rounded-xl transition-all group">
                            <div className="p-2 bg-rose-100 text-rose-600 rounded-full mb-2 group-hover:scale-110 transition-transform"><FileText size={16} /></div>
                            <span className="text-xs font-semibold text-slate-700 text-center">Generate Report</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}