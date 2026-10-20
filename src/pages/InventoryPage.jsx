import { useState, useEffect } from 'react';
import { medicineService } from '../services/medicineService';
import AddEditMedicineModal from '../components/modals/AddEditMedicineModal';
import { Plus, Search, AlertTriangle } from 'lucide-react';

export default function InventoryPage() {
    const [medicines, setMedicines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMedicine, setEditingMedicine] = useState(null);

    const fetchInventory = async () => {
        try {
            setLoading(true);
            const data = await medicineService.getAll();
            setMedicines(data);
        } catch (error) {
            console.error("Failed to fetch inventory", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInventory();
    }, []);

    // Filter based on search
    const filteredMedicines = medicines.filter(m => 
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.batchNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Helper to color-code the status tags returned by the backend
    const getStatusBadge = (status) => {
        switch(status) {
            case 'IN_STOCK': return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold">In Stock</span>;
            case 'LOW_STOCK': return <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-semibold">Low Stock</span>;
            case 'OUT_OF_STOCK': return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-semibold">Out of Stock</span>;
            case 'EXPIRING_SOON': return <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-semibold">Expiring Soon</span>;
            case 'EXPIRED': return <span className="bg-red-600 text-white px-2 py-1 rounded-full text-xs font-semibold">Expired</span>;
            default: return <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-semibold">{status}</span>;
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header Area */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Inventory Management</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage medicines, stock levels, and expiries.</p>
                </div>
                <button 
                    onClick={() => { setEditingMedicine(null); setIsModalOpen(true); }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium"
                >
                    <Plus size={18} /> Add Medicine
                </button>
            </div>

            {/* Search Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex items-center gap-3">
                <Search className="text-gray-400" size={20} />
                <input 
                    type="text" 
                    placeholder="Search by medicine name or batch number..." 
                    className="flex-1 outline-none text-gray-700"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 text-gray-600 text-sm border-b">
                            <th className="p-4 font-semibold">Medicine</th>
                            <th className="p-4 font-semibold">Batch</th>
                            <th className="p-4 font-semibold">Supplier</th>
                            <th className="p-4 font-semibold">Qty</th>
                            <th className="p-4 font-semibold">Expiry</th>
                            <th className="p-4 font-semibold">Status</th>
                            <th className="p-4 font-semibold">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="7" className="p-8 text-center text-gray-500">Loading inventory...</td></tr>
                        ) : filteredMedicines.length === 0 ? (
                            <tr><td colSpan="7" className="p-8 text-center text-gray-500">No medicines found.</td></tr>
                        ) : (
                            filteredMedicines.map(med => (
                                <tr key={med.id} className="border-b hover:bg-gray-50">
                                    <td className="p-4">
                                        <div className="font-medium text-gray-800">{med.name}</div>
                                        <div className="text-xs text-gray-500">{med.category}</div>
                                    </td>
                                    <td className="p-4 text-gray-600">{med.batchNumber}</td>
                                    <td className="p-4 text-gray-600">{med.supplierName || '-'}</td>
                                    <td className="p-4">
                                        <span className={`font-medium ${med.quantity <= med.minQuantity ? 'text-red-600 flex items-center gap-1' : 'text-gray-800'}`}>
                                            {med.quantity <= med.minQuantity && <AlertTriangle size={14} />}
                                            {med.quantity}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-600">{med.expiryDate || 'N/A'}</td>
                                    <td className="p-4">{getStatusBadge(med.status)}</td>
                                    <td className="p-4">
                                        <button 
                                            onClick={() => { setEditingMedicine(med); setIsModalOpen(true); }}
                                            className="text-blue-600 hover:underline text-sm font-medium"
                                        >
                                            Edit
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <AddEditMedicineModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSave={fetchInventory}
                initialData={editingMedicine}
            />
        </div>
    );
}