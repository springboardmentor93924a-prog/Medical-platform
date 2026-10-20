import React, { useState, useEffect } from 'react';
import { Plus, Truck, Phone, Mail, MapPin } from 'lucide-react';
import { AddSupplierModal } from '../components/modals/AddSupplierModal';
import { supplierService } from '../services/supplierService';

export const SupplierPage = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);

    // 1. Fetch suppliers when page loads
    const loadSuppliers = async () => {
        try {
            setLoading(true);
            const data = await supplierService.getAll();
            setSuppliers(data);
        } catch (error) {
            console.error("Failed to load suppliers", error);
            alert("Failed to load suppliers from the server.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSuppliers();
    }, []);

    // 2. The function that gets called when the modal clicks "Save"
    const handleSaveSupplier = async (formData) => {
        try {
            // Send to Spring Boot
            await supplierService.create(formData);
            
            // Close modal and refresh the list
            setIsModalOpen(false);
            loadSuppliers(); 
            alert("Supplier added successfully!");
        } catch (error) {
            alert(error.message || "Failed to add supplier");
            console.error(error);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Truck className="text-teal-600" />
                        Supplier Management
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Manage your pharmaceutical distributors and contacts.</p>
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-sm font-bold rounded-xl shadow-md flex items-center gap-2 transition-all"
                >
                    <Plus size={16} />
                    Add Supplier
                </button>
            </div>

            {/* Suppliers Table */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-slate-500">Loading suppliers...</div>
                ) : suppliers.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">No suppliers found. Click "Add Supplier" to create one.</div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase tracking-wider">
                                <th className="p-4 font-semibold">Company Name</th>
                                <th className="p-4 font-semibold">Contact Person</th>
                                <th className="p-4 font-semibold">Contact Info</th>
                                <th className="p-4 font-semibold">Address</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {suppliers.map((supplier) => (
                                <tr key={supplier.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4">
                                        <div className="font-bold text-slate-900">{supplier.name}</div>
                                        <div className="text-xs text-slate-500 font-mono mt-0.5">ID: {supplier.id}</div>
                                    </td>
                                    <td className="p-4 text-slate-700 text-sm">{supplier.contactPerson || '-'}</td>
                                    <td className="p-4 text-sm text-slate-600 space-y-1">
                                        {supplier.phone && (
                                            <div className="flex items-center gap-1.5"><Phone size={14} className="text-slate-400"/> {supplier.phone}</div>
                                        )}
                                        {supplier.email && (
                                            <div className="flex items-center gap-1.5"><Mail size={14} className="text-slate-400"/> {supplier.email}</div>
                                        )}
                                    </td>
                                    <td className="p-4 text-sm text-slate-600 max-w-xs truncate">
                                        <div className="flex items-center gap-1.5">
                                            <MapPin size={14} className="text-slate-400 shrink-0"/> 
                                            <span className="truncate">{supplier.address || '-'}</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* The Modal */}
            <AddSupplierModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSave={handleSaveSupplier} 
            />
        </div>
    );
};