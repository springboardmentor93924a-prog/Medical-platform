import { useState, useEffect } from 'react';
import { medicineService } from '../../services/medicineService';
import { X } from 'lucide-react';

export default function AddEditMedicineModal({ isOpen, onClose, onSave, initialData }) {
    const [suppliers, setSuppliers] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        batchNumber: '',
        category: '',
        supplierId: '',
        quantity: 0,
        minQuantity: 10,
        manufacturingDate: '',
        expiryDate: '',
        unitPrice: 0
    });
    const [error, setError] = useState('');

    // Load suppliers when the modal opens
    useEffect(() => {
        if (isOpen) {
            medicineService.getSuppliers().then(setSuppliers).catch(console.error);
            
            if (initialData) {
                setFormData({
                    ...initialData,
                    supplierId: initialData.supplierId || ''
                });
            } else {
                // Reset form if adding new
                setFormData({
                    name: '', batchNumber: '', category: '', supplierId: '',
                    quantity: 0, minQuantity: 10, manufacturingDate: '', expiryDate: '', unitPrice: 0
                });
            }
        }
    }, [isOpen, initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (initialData?.id) {
                await medicineService.update(initialData.id, formData);
            } else {
                await medicineService.create(formData);
            }
            onSave(); // Trigger refresh in parent component
            onClose(); // Close modal
        } catch (err) {
            setError(err.message || 'Failed to save medicine');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden">
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-800">
                        {initialData ? 'Edit Medicine' : 'Add New Medicine'}
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && <div className="text-red-500 bg-red-50 p-3 rounded">{error}</div>}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Medicine Name</label>
                            <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full border rounded-lg p-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Batch Number</label>
                            <input required type="text" name="batchNumber" value={formData.batchNumber} onChange={handleChange} className="w-full border rounded-lg p-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <input type="text" name="category" value={formData.category} onChange={handleChange} className="w-full border rounded-lg p-2" placeholder="e.g. Antibiotic" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                            <select required name="supplierId" value={formData.supplierId} onChange={handleChange} className="w-full border rounded-lg p-2 bg-white">
                                <option value="">Select a Supplier</option>
                                {suppliers.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                            <input required type="number" name="quantity" value={formData.quantity} onChange={handleChange} className="w-full border rounded-lg p-2" min="0" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Min. Quantity (Alert Level)</label>
                            <input required type="number" name="minQuantity" value={formData.minQuantity} onChange={handleChange} className="w-full border rounded-lg p-2" min="0" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturing Date</label>
                            <input type="date" name="manufacturingDate" value={formData.manufacturingDate} onChange={handleChange} className="w-full border rounded-lg p-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                            <input required type="date" name="expiryDate" value={formData.expiryDate} onChange={handleChange} className="w-full border rounded-lg p-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price ($)</label>
                            <input required type="number" step="0.01" name="unitPrice" value={formData.unitPrice} onChange={handleChange} className="w-full border rounded-lg p-2" min="0" />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Medicine</button>
                    </div>
                </form>
            </div>
        </div>
    );
}