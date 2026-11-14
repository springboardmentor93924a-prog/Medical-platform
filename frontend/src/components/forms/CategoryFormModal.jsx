import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { categoryService } from '../../services/categoryService';
import { useNotification } from '../../context/NotificationContext';

export const CategoryFormModal = ({ isOpen, onClose, category = null, onSuccess }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useNotification();

  useEffect(() => {
    if (category) {
      setName(category.name || '');
      setDescription(category.description || '');
    } else {
      setName('');
      setDescription('');
    }
  }, [category, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast('Category name is required', 'warning');
      return;
    }
    setIsLoading(true);
    try {
      if (category?.id) {
        await categoryService.updateCategory(category.id, { name: name.trim(), description: description.trim() });
        addToast('Category updated successfully', 'success');
      } else {
        await categoryService.createCategory({ name: name.trim(), description: description.trim() });
        addToast('Category created successfully', 'success');
      }
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to save category';
      addToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={category ? 'Edit Medicine Category' : 'Create Medicine Category'}
      subtitle="Organize pharmaceutical stock by therapeutic classification"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Category Name *</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Analgesics, Antibiotics, Cardiovascular"
            className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description of medications included in this class"
            className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl"
          />
        </div>
        <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            {category ? 'Save Changes' : 'Create Category'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CategoryFormModal;
