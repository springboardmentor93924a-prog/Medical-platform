import React, { useState, useEffect } from 'react';
import { Layers, Plus, Edit2, Trash2, Pill, Search } from 'lucide-react';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import CategoryFormModal from '../../components/forms/CategoryFormModal';
import { categoryService } from '../../services/categoryService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

const CategoriesPage = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const isManager = user?.role === 'ADMIN' || user?.role === 'PHARMACIST';
  const isAdmin = user?.role === 'ADMIN';

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await categoryService.getAll();
      const list = res?.data?.data || res?.data || res || [];
      setCategories(Array.isArray(list) ? list : (list.content || []));
    } catch (err) {
      console.error('Error fetching categories', err);
      showToast('error', 'Failed to load medicine categories');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (cat) => {
    setEditingCategory(cat);
    setIsFormModalOpen(true);
  };

  const handleOpenDelete = (cat) => {
    setDeletingCategory(cat);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingCategory) return;
    try {
      setIsDeleting(true);
      await categoryService.delete(deletingCategory.id);
      showToast('success', `Category "${deletingCategory.name}" removed successfully`);
      setIsDeleteModalOpen(false);
      setDeletingCategory(null);
      fetchCategories();
    } catch (err) {
      console.error('Delete error', err);
      showToast('error', err.response?.data?.message || 'Failed to delete category');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredCategories = categories.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Medicine Categories</h1>
          <p className="text-sm text-gray-500 mt-1">
            Organize pharmaceuticals into therapeutic classes, storage classifications, and administration types.
          </p>
        </div>
        {isManager && (
          <Button variant="primary" icon={Plus} onClick={handleOpenAdd}>
            Add Category
          </Button>
        )}
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">
          {filteredCategories.length} Categories
        </span>
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div className="p-12">
          <LoadingSpinner size="lg" message="Loading categories..." />
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-8">
          <EmptyState
            title="No categories found"
            description={search ? "No categories matching your search." : "No categories configured yet. Create one to organize your medicines."}
            icon={Layers}
            action={isManager ? { label: "Add Category", onClick: handleOpenAdd } : undefined}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCategories.map((cat) => (
            <div 
              key={cat.id} 
              className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:border-emerald-200 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1">
                    {isManager && (
                      <button
                        onClick={() => handleOpenEdit(cat)}
                        className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title="Edit Category"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => handleOpenDelete(cat)}
                        className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                        title="Delete Category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <h3 className="font-bold text-gray-900 mt-3 text-lg">{cat.name}</h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                  {cat.description || 'No specific description provided for this classification.'}
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span className="flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md">
                  <Pill className="w-3.5 h-3.5" />
                  <span>{cat.medicineCount ?? 0} Medicines</span>
                </span>
                <span>ID: #{cat.id}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Category Modal */}
      {isFormModalOpen && (
        <CategoryFormModal
          isOpen={isFormModalOpen}
          onClose={() => {
            setIsFormModalOpen(false);
            setEditingCategory(null);
          }}
          onSuccess={() => {
            setIsFormModalOpen(false);
            setEditingCategory(null);
            fetchCategories();
          }}
          category={editingCategory}
        />
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setDeletingCategory(null);
          }}
          title="Delete Category"
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to remove <strong className="text-gray-900">{deletingCategory?.name}</strong>?
              {deletingCategory?.medicineCount > 0 && (
                <span className="block mt-2 text-rose-600 font-medium">
                  Warning: There are {deletingCategory.medicineCount} medicines currently linked to this category.
                </span>
              )}
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleConfirmDelete}
                loading={isDeleting}
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CategoriesPage;
