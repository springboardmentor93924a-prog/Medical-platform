import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { supplierService } from '../../services/supplierService';
import { useNotification } from '../../context/NotificationContext';

export const SupplierFormModal = ({ isOpen, onClose, supplier = null, onSuccess }) => {
  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    businessRegistrationNumber: '',
    notes: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useNotification();

  useEffect(() => {
    if (supplier) {
      setFormData({
        companyName: supplier.companyName || '',
        contactPerson: supplier.contactPerson || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        address: supplier.address || '',
        businessRegistrationNumber: supplier.businessRegistrationNumber || '',
        notes: supplier.notes || '',
      });
    } else {
      setFormData({
        companyName: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: '',
        businessRegistrationNumber: '',
        notes: '',
      });
    }
  }, [supplier, isOpen]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (supplier?.id) {
        await supplierService.updateSupplier(supplier.id, formData);
        addToast('Supplier information updated', 'success');
      } else {
        await supplierService.createSupplier(formData);
        addToast('Supplier registered successfully', 'success');
      }
      onSuccess();
      onClose();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save supplier', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={supplier ? 'Edit Supplier Profile' : 'Add New Healthcare Supplier'}
      subtitle="Register an authorized manufacturer or pharmaceutical distributor"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Company Name *</label>
            <input
              type="text"
              name="companyName"
              required
              value={formData.companyName}
              onChange={handleChange}
              placeholder="e.g. MedVant Health Corp"
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Contact Person *</label>
            <input
              type="text"
              name="contactPerson"
              required
              value={formData.contactPerson}
              onChange={handleChange}
              placeholder="e.g. Marcus Vance"
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email *</label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="orders@medvant.com"
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Phone *</label>
            <input
              type="text"
              name="phone"
              required
              value={formData.phone}
              onChange={handleChange}
              placeholder="+1 800 555 0199"
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Business Address *</label>
            <input
              type="text"
              name="address"
              required
              value={formData.address}
              onChange={handleChange}
              placeholder="Headquarters address"
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Registration / Tax ID</label>
            <input
              type="text"
              name="businessRegistrationNumber"
              value={formData.businessRegistrationNumber}
              onChange={handleChange}
              placeholder="e.g. TAX-883921-A"
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl font-mono text-xs"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Internal Notes</label>
          <textarea
            name="notes"
            rows={2}
            value={formData.notes}
            onChange={handleChange}
            placeholder="Contract terms, lead times, or performance history"
            className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
          />
        </div>

        <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            {supplier ? 'Save Changes' : 'Register Supplier'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default SupplierFormModal;
