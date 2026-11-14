import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { medicineService } from '../../services/medicineService';
import { categoryService } from '../../services/categoryService';
import { supplierService } from '../../services/supplierService';
import { useNotification } from '../../context/NotificationContext';

export const MedicineFormModal = ({ isOpen, onClose, medicine = null, onSuccess }) => {
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    genericName: '',
    batchNumber: '',
    categoryId: '',
    supplierId: '',
    quantity: 0,
    minimumStockLevel: 10,
    unitPrice: 0.0,
    dosageForm: 'Tablet',
    storageConditions: 'Store below 25°C in a dry place',
    manufacturingDate: '',
    expiryDate: '',
    description: '',
  });

  const { addToast } = useNotification();

  useEffect(() => {
    if (isOpen) {
      // Load categories and suppliers
      categoryService.getCategories().then((res) => {
        const catList = res?.data?.data || res?.data || [];
        setCategories(Array.isArray(catList) ? catList : (catList.content || []));
      }).catch(err => console.error('Failed to load categories in form', err));

      supplierService.getSuppliers().then((res) => {
        const supList = res?.data?.data || res?.data || [];
        const arr = Array.isArray(supList) ? supList : (supList.content || []);
        setSuppliers(arr.filter((s) => s.status === 'APPROVED' || !s.status));
      }).catch(err => console.error('Failed to load suppliers in form', err));

      if (medicine) {
        setFormData({
          name: medicine.name || '',
          genericName: medicine.genericName || '',
          batchNumber: medicine.batchNumber || '',
          categoryId: medicine.category?.id || medicine.categoryId || '',
          supplierId: medicine.supplier?.id || medicine.supplierId || '',
          quantity: medicine.quantity ?? 0,
          minimumStockLevel: medicine.minimumStockLevel ?? medicine.reorderLevel ?? 10,
          unitPrice: medicine.unitPrice || 0.0,
          dosageForm: medicine.dosageForm || 'Tablet',
          storageConditions: medicine.storageConditions || '',
          manufacturingDate: medicine.manufacturingDate || '',
          expiryDate: medicine.expiryDate || '',
          description: medicine.description || '',
        });
      } else {
        setFormData({
          name: '',
          genericName: '',
          batchNumber: '',
          categoryId: '',
          supplierId: '',
          quantity: 0,
          minimumStockLevel: 10,
          unitPrice: 0.0,
          dosageForm: 'Tablet',
          storageConditions: 'Store below 25°C in a dry place',
          manufacturingDate: '',
          expiryDate: '',
          description: '',
        });
      }
    }
  }, [isOpen, medicine]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (new Date(formData.expiryDate) <= new Date(formData.manufacturingDate)) {
      addToast('Expiry date must be after manufacturing date', 'error');
      return;
    }

    setIsLoading(true);
    const payload = {
      ...formData,
      categoryId: formData.categoryId ? Number(formData.categoryId) : null,
      supplierId: formData.supplierId ? Number(formData.supplierId) : null,
      quantity: Number(formData.quantity) || 0,
      minimumStockLevel: Number(formData.minimumStockLevel) || 10,
      unitPrice: Number(formData.unitPrice) || 0.0,
    };

    try {
      if (medicine?.id) {
        await medicineService.updateMedicine(medicine.id, payload);
        addToast('Medicine details updated successfully', 'success');
      } else {
        await medicineService.createMedicine(payload);
        addToast('Medicine added to inventory successfully', 'success');
      }
      onSuccess();
      onClose();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save medicine record', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={medicine ? 'Edit Medicine Details' : 'Register New Medicine'}
      subtitle="Complete pharmaceutical details, batch tracking, and pricing"
      maxWidth="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Brand Name *</label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Augmentin 625mg"
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Generic Name</label>
            <input
              type="text"
              name="genericName"
              value={formData.genericName}
              onChange={handleChange}
              placeholder="e.g. Amoxicillin + Clavulanic Acid"
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Batch Number *</label>
            <input
              type="text"
              name="batchNumber"
              required
              value={formData.batchNumber}
              onChange={handleChange}
              placeholder="e.g. BATCH-2026-X1"
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl font-mono text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
            <select
              name="categoryId"
              required
              value={formData.categoryId}
              onChange={handleChange}
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl bg-white"
            >
              <option value="">Select Category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Supplier</label>
            <select
              name="supplierId"
              value={formData.supplierId}
              onChange={handleChange}
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl bg-white"
            >
              <option value="">Select Approved Supplier</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.companyName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Quantity *</label>
            <input
              type="number"
              name="quantity"
              min="0"
              required
              value={formData.quantity}
              onChange={handleChange}
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Min. Stock Alert Level *</label>
            <input
              type="number"
              name="minimumStockLevel"
              min="0"
              required
              value={formData.minimumStockLevel}
              onChange={handleChange}
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Unit Price ($) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              name="unitPrice"
              required
              value={formData.unitPrice}
              onChange={handleChange}
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Manufacturing Date *</label>
            <input
              type="date"
              name="manufacturingDate"
              required
              value={formData.manufacturingDate}
              onChange={handleChange}
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Expiry Date *</label>
            <input
              type="date"
              name="expiryDate"
              required
              value={formData.expiryDate}
              onChange={handleChange}
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Dosage Form</label>
            <select
              name="dosageForm"
              value={formData.dosageForm}
              onChange={handleChange}
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl bg-white"
            >
              <option value="Tablet">Tablet</option>
              <option value="Capsule">Capsule</option>
              <option value="Syrup">Syrup / Suspension</option>
              <option value="Injection">Injection / Infusion</option>
              <option value="Ointment">Ointment / Cream</option>
              <option value="Inhaler">Inhaler / Aerosol</option>
              <option value="Drops">Eye/Ear Drops</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Storage Conditions</label>
            <input
              type="text"
              name="storageConditions"
              value={formData.storageConditions}
              onChange={handleChange}
              placeholder="e.g. 2°C - 8°C Refrigerated"
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Description & Usage Notes</label>
          <textarea
            name="description"
            rows={2}
            value={formData.description}
            onChange={handleChange}
            placeholder="Clinical details, side-effect warnings, or handling instructions"
            className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
          />
        </div>

        <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            {medicine ? 'Save Changes' : 'Add to Inventory'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default MedicineFormModal;
