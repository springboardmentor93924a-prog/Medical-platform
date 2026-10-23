import React, { useState, useEffect } from 'react';
import { X, Pill, Sparkles } from 'lucide-react';
import { StorageCondition } from '../../types';

export const AddEditMedicineModal = ({ isOpen, onClose, onSave, initialData, suppliers = [] }) => {
    const [formData, setFormData] = useState({
        name: '',
        genericName: '',
        ndc: '',
        category: 'Antibiotics',
        dosageForm: 'Oral Tablet',
        strength: '',
        quantity: 100,
        minQuantity: 20,
        unit: 'Bottles',
        batchNumber: '',
        expiryDate: '',
        storageCondition: StorageCondition.AMBIENT,
        unitPrice: 15.00,
        supplierId: suppliers[0]?.id || '',
        supplierName: suppliers[0]?.name || '',
        location: 'Zone A - Formulary Shelf 1',
        requiresPrescription: true,
        temperatureRequired: '20°C'
    });

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        } else {
            setFormData({
                name: '',
                genericName: '',
                ndc: '',
                category: 'Antibiotics',
                dosageForm: 'Oral Tablet',
                strength: '',
                quantity: 50,
                minQuantity: 15,
                unit: 'Bottles',
                batchNumber: `LOT-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
                expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                storageCondition: StorageCondition.AMBIENT,
                unitPrice: 20.00,
                supplierId: suppliers[0]?.id || '',
                supplierName: suppliers[0]?.name || '',
                location: 'Zone A - Shelf 3',
                requiresPrescription: true,
                temperatureRequired: '21.0°C'
            });
        }
    }, [initialData, suppliers, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        const selectedSupp = suppliers.find(s => s.id === formData.supplierId);
        onSave({
            ...formData,
            supplierName: selectedSupp ? selectedSupp.name : (formData.supplierName || 'Direct Distributor')
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Pill size={18} />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900">
                                {initialData ? 'Modify Pharmaceutical Record' : 'Register New Pharmaceutical Product'}
                            </h3>
                            <p className="text-xs text-slate-500">
                                Enter FDA NDC barcode, lot traceability, and storage specifications.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Form Fields */}
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Product / Brand Name *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. Augmentin ES-600"
                                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Generic / Chemical Formulation
                            </label>
                            <input
                                type="text"
                                value={formData.genericName}
                                onChange={e => setFormData({ ...formData, genericName: e.target.value })}
                                placeholder="e.g. Amoxicillin & Clavulanate"
                                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                NDC Barcode (National Drug Code)
                            </label>
                            <input
                                type="text"
                                value={formData.ndc}
                                onChange={e => setFormData({ ...formData, ndc: e.target.value })}
                                placeholder="0000-0000-00"
                                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white font-mono transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Therapeutic Category
                            </label>
                            <select
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-emerald-500"
                            >
                                <option value="Antibiotics">Antibiotics</option>
                                <option value="Cardiovascular">Cardiovascular</option>
                                <option value="Endocrinology / Biologics">Endocrinology / Biologics</option>
                                <option value="Emergency / Anaphylaxis">Emergency / Anaphylaxis</option>
                                <option value="Anesthesia / Critical Care">Anesthesia / Critical Care</option>
                                <option value="Vaccines / Immunology">Vaccines / Immunology</option>
                                <option value="Analgesics & Antipyretics">Analgesics & Antipyretics</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Dosage Form & Strength
                            </label>
                            <input
                                type="text"
                                value={formData.strength}
                                onChange={e => setFormData({ ...formData, strength: e.target.value })}
                                placeholder="e.g. 500mg or 100 units/mL"
                                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Stock Packaging Unit
                            </label>
                            <input
                                type="text"
                                value={formData.unit}
                                onChange={e => setFormData({ ...formData, unit: e.target.value })}
                                placeholder="e.g. Bottles, Vials, Packs"
                                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Initial Quantity *
                            </label>
                            <input
                                type="number"
                                required
                                min="0"
                                value={formData.quantity}
                                onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Reorder Threshold (Min Quantity) *
                            </label>
                            <input
                                type="number"
                                required
                                min="1"
                                value={formData.minQuantity}
                                onChange={e => setFormData({ ...formData, minQuantity: parseInt(e.target.value) || 0 })}
                                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Batch / Lot Number *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.batchNumber}
                                onChange={e => setFormData({ ...formData, batchNumber: e.target.value })}
                                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white font-mono transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Expiration Date *
                            </label>
                            <input
                                type="date"
                                required
                                value={formData.expiryDate}
                                onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
                                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Storage Specification
                            </label>
                            <select
                                value={formData.storageCondition}
                                onChange={e => setFormData({ ...formData, storageCondition: e.target.value })}
                                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-emerald-500"
                            >
                                <option value={StorageCondition.AMBIENT}>{StorageCondition.AMBIENT}</option>
                                <option value={StorageCondition.REFRIGERATED}>{StorageCondition.REFRIGERATED}</option>
                                <option value={StorageCondition.FROZEN}>{StorageCondition.FROZEN}</option>
                                <option value={StorageCondition.CONTROLLED}>{StorageCondition.CONTROLLED}</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Unit Acquisition Cost ($)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.unitPrice}
                                onChange={e => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
                                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Certified Supplier
                            </label>
                            <select
                                value={formData.supplierId}
                                onChange={e => {
                                    const s = suppliers.find(sup => sup.id === e.target.value);
                                    setFormData({
                                        ...formData,
                                        supplierId: e.target.value,
                                        supplierName: s?.name || formData.supplierName
                                    });
                                }}
                                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-emerald-500"
                            >
                                <option value="">-- Select or direct distributor --</option>
                                {suppliers.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                                Storage Location / Bin
                            </label>
                            <input
                                type="text"
                                value={formData.location}
                                onChange={e => setFormData({ ...formData, location: e.target.value })}
                                placeholder="e.g. Zone A - Shelf 4"
                                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                            />
                        </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                            <Sparkles size={14} />
                            <span>{initialData ? 'Save Changes' : 'Register Product'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
