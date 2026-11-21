import React, { useState, useEffect } from 'react';
import { X, ShoppingCart, Plus, Trash2 } from 'lucide-react';
import { adminService } from '../../services/adminService';

export const GeneratePOModal = ({ isOpen, onClose, onSave }) => {
    const [suppliers, setSuppliers] = useState([]);
    const [medicines, setMedicines] = useState([]);
    const [selectedSupplier, setSelectedSupplier] = useState('');
    // Start with 1 empty item
    const [items, setItems] = useState([{ medicineId: '', quantity: 1, unitPrice: 0 }]);

    useEffect(() => {
        if (isOpen) {
            adminService.getAllSuppliers().then(setSuppliers);
            adminService.getAllMedicines().then(setMedicines);
        }
    }, [isOpen]);

    // Calculate Total dynamically
    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

    const handleAddItem = () => setItems([...items, { medicineId: '', quantity: 1, unitPrice: 0 }]);
    
    const handleRemoveItem = (index) => {
        if (items.length === 1) return;
        setItems(items.filter((_, i) => i !== index));
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        
        // Auto-fill price when a medicine is selected
        if (field === 'medicineId') {
            const med = medicines.find(m => m.id.toString() === value);
            if (med) newItems[index].unitPrice = med.unitPrice;
        }
        setItems(newItems);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!selectedSupplier) return alert("Please select a supplier");
        
        const validItems = items.filter(i => i.medicineId && i.quantity > 0);
        if (validItems.length === 0) return alert("Add at least one valid medicine");

        onSave({
            supplierId: parseInt(selectedSupplier),
            items: validItems.map(i => ({
                medicineId: parseInt(i.medicineId),
                quantity: parseInt(i.quantity),
                unitPrice: parseFloat(i.unitPrice)
            }))
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-5 border-b border-slate-100">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <ShoppingCart className="text-blue-600" /> Generate Purchase Order
                    </h3>
                    <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700"><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-2">Select Supplier *</label>
                        <select required value={selectedSupplier} onChange={e => setSelectedSupplier(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm">
                            <option value="">-- Choose Supplier --</option>
                            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>

                    <div className="space-y-3">
                        <label className="block text-xs font-bold text-slate-700">Order Items *</label>
                        {items.map((item, index) => (
                            <div key={index} className="flex gap-2 items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
                                <select required value={item.medicineId} onChange={e => handleItemChange(index, 'medicineId', e.target.value)} className="flex-1 px-2 py-1.5 rounded border text-xs">
                                    <option value="">Select Medicine</option>
                                    {medicines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                </select>
                                <input type="number" required min="1" placeholder="Qty" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', e.target.value)} className="w-20 px-2 py-1.5 rounded border text-xs" />
                                <input type="number" required step="0.01" placeholder="Price" value={item.unitPrice} onChange={e => handleItemChange(index, 'unitPrice', e.target.value)} className="w-24 px-2 py-1.5 rounded border text-xs" readOnly />
                                <button type="button" onClick={() => handleRemoveItem(index)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded"><Trash2 size={16} /></button>
                            </div>
                        ))}
                        <button type="button" onClick={handleAddItem} className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline"><Plus size={14} /> Add Item</button>
                    </div>

                    {/* Total Amount Section */}
                    <div className="bg-blue-50 p-4 rounded-xl flex items-center justify-between">
                        <span className="text-sm font-bold text-blue-900">Total Order Amount:</span>
                        <span className="text-xl font-black text-blue-700">₹{totalAmount.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">Cancel</button>
                        <button type="submit" className="px-5 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700">Submit Order</button>
                    </div>
                </form>
            </div>
        </div>
    );
};