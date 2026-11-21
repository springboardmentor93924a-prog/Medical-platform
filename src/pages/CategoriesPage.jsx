import React, { useEffect, useState } from 'react';
import { adminService } from '../services/adminService';
import { Search, Plus, Edit, Trash2, X, Pill, ChevronRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function CategoriesPage() {
    const { user } = useAuth();
    const role = (user?.role || 'ADMIN').toUpperCase();
    const isAdmin = role === 'ADMIN';

    const [categories, setCategories] = useState([]);
    const [medicines, setMedicines] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '', description: '' });
    
    // For Pharmacist: View medicines inside a category
    const [selectedCategory, setSelectedCategory] = useState(null);

    const fetchData = async () => {
        try {
            const [catData, medData] = await Promise.all([
                adminService.getAllCategories(),
                adminService.getAllMedicines()
            ]);
            setCategories(catData);
            setMedicines(medData);
        } catch (err) { console.error(err); }
    };

    useEffect(() => { fetchData(); }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            await adminService.createCategory(formData);
            setIsModalOpen(false);
            setFormData({ name: '', description: '' });
            fetchData();
        } catch (err) { alert("Failed to save category"); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this category?")) return;
        await adminService.deleteCategory(id);
        fetchData();
    };

    const filtered = categories.filter(c => 
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // --- PHARMACIST VIEW: Filtered Medicines ---
    if (selectedCategory) {
        const catMeds = medicines.filter(m => m.category === selectedCategory.name);
        
        return (
            <div className="p-8 max-w-[1400px] mx-auto space-y-6 bg-slate-50 min-h-screen">
                <button 
                    onClick={() => setSelectedCategory(null)}
                    className="flex items-center gap-2 text-blue-600 font-semibold text-sm hover:underline mb-4"
                >
                    <ArrowLeft size={16} /> Back to Categories
                </button>

                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{selectedCategory.name} Inventory</h1>
                    <p className="text-sm text-slate-500">{catMeds.length} medicines found in this category.</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                            <tr>
                                <th className="px-6 py-4">Medicine Name</th>
                                <th className="px-6 py-4">Batch No</th>
                                <th className="px-6 py-4">Stock</th>
                                <th className="px-6 py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {catMeds.map((m) => (
                                <tr key={m.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 font-bold text-slate-800 flex items-center gap-2">
                                        <Pill size={16} className="text-blue-500"/> {m.name}
                                    </td>
                                    <td className="px-6 py-4 font-mono text-slate-600">{m.batchNumber}</td>
                                    <td className="px-6 py-4 font-bold text-slate-800">{m.quantity} units</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                                            m.status === 'OUT_OF_STOCK' ? 'bg-rose-100 text-rose-700' :
                                            m.status === 'LOW_STOCK' ? 'bg-amber-100 text-amber-700' :
                                            'bg-emerald-100 text-emerald-700'
                                        }`}>
                                            {m.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {catMeds.length === 0 && (
                                <tr><td colSpan="4" className="p-8 text-center text-slate-500">No medicines in this category.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    // --- DEFAULT VIEW: Category List ---
    return (
        <div className="p-8 max-w-[1400px] mx-auto space-y-6 bg-slate-50 min-h-screen">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-900">Categories</h1>
                {!isAdmin && <span className="text-sm text-slate-500">Click a category to view its inventory</span>}
            </div>

            {/* Search Bar */}
            <div className="flex items-center gap-4">
                <div className="flex-1 flex items-center gap-2 bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-sm">
                    <Search size={18} className="text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Search categories..." 
                        className="w-full text-sm outline-none bg-transparent"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                {/* Only Admin can add categories */}
                {isAdmin && (
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-5 py-3 rounded-xl flex items-center gap-2 shadow-md transition-colors"
                    >
                        <Plus size={16} /> Add Category
                    </button>
                )}
            </div>

            {/* Table */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                        <tr>
                            <th className="px-6 py-4 w-20">ID</th>
                            <th className="px-6 py-4">Category Name</th>
                            <th className="px-6 py-4">Description</th>
                            {isAdmin ? (
                                <th className="px-6 py-4 text-right">Actions</th>
                            ) : (
                                <th className="px-6 py-4 text-right">View Inventory</th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filtered.map((c) => (
                            <tr key={c.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 text-slate-500">#{c.id}</td>
                                <td className="px-6 py-4 font-bold text-slate-800">{c.name}</td>
                                <td className="px-6 py-4 text-slate-600">{c.description || 'No description'}</td>
                                <td className="px-6 py-4 text-right flex justify-end gap-2">
                                    {isAdmin ? (
                                        <>
                                            <button className="text-blue-600 hover:text-blue-900 p-1.5"><Edit size={16} /></button>
                                            <button onClick={() => handleDelete(c.id)} className="p-1.5 text-slate-400 hover:text-rose-600"><Trash2 size={16} /></button>
                                        </>
                                    ) : (
                                        <button 
                                            onClick={() => setSelectedCategory(c)}
                                            className="flex items-center gap-1 text-blue-600 font-semibold hover:underline"
                                        >
                                            View Medicines <ChevronRight size={16} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr><td colSpan="4" className="p-8 text-center text-slate-500">No categories found. Add a medicine with a category to see it here.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add Modal (Admin Only) */}
            {isAdmin && isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
                        <div className="flex items-center justify-between p-5 border-b border-slate-100">
                            <h3 className="text-base font-bold text-slate-900">Add New Category</h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-700 rounded-lg"><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Category Name *</label>
                                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:border-blue-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:border-blue-500 resize-none h-24" />
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold">Cancel</button>
                                <button type="submit" className="px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold shadow-md">Save Category</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}