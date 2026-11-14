import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Lock, 
  Building2, 
  Shield, 
  CheckCircle2, 
  KeyRound,
  Pill,
  FileCheck,
  Tag
} from 'lucide-react';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { userService } from '../../services/userService';
import { supplierService } from '../../services/supplierService';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

const ProfilePage = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [supplierInfo, setSupplierInfo] = useState(null);
  const [suppliedMedicines, setSuppliedMedicines] = useState([]);

  // User Profile Edit State
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    phone: '',
    address: ''
  });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Supplier Business Profile Edit State
  const [supplierForm, setSupplierForm] = useState({
    companyName: '',
    contactPerson: '',
    phone: '',
    address: '',
    businessRegistrationNumber: ''
  });
  const [isUpdatingSupplier, setIsUpdatingSupplier] = useState(false);

  // Password Change State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const res = await userService.getProfile();
      const p = res.data?.data;
      setProfile(p);
      setProfileForm({
        fullName: p?.fullName || '',
        phone: p?.phone || '',
        address: p?.address || ''
      });

      if (p?.role === 'SUPPLIER') {
        try {
          const [supRes, medRes] = await Promise.all([
            supplierService.getMyProfile(),
            supplierService.getMyMedicines().catch(() => ({ data: { data: [] } }))
          ]);
          const sup = supRes.data?.data;
          setSupplierInfo(sup);
          setSupplierForm({
            companyName: sup?.companyName || '',
            contactPerson: sup?.contactPerson || '',
            phone: sup?.phone || '',
            address: sup?.address || '',
            businessRegistrationNumber: sup?.businessRegistrationNumber || sup?.licenseNumber || ''
          });

          const meds = medRes.data?.data;
          setSuppliedMedicines(Array.isArray(meds) ? meds : (meds?.content || []));
        } catch (err) {
          console.warn('Supplier profile lookup returned 404/error', err);
        }
      }
    } catch (err) {
      console.error('Error fetching profile', err);
      showToast('error', 'Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setIsUpdatingProfile(true);
      const res = await userService.updateProfile(profileForm);
      setProfile(res.data?.data);
      showToast('success', 'Personal profile updated successfully');
    } catch (err) {
      console.error('Update profile error', err);
      showToast('error', err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdateSupplierProfile = async (e) => {
    e.preventDefault();
    try {
      setIsUpdatingSupplier(true);
      const res = await supplierService.updateMyProfile({
        companyName: supplierForm.companyName,
        contactPerson: supplierForm.contactPerson,
        phone: supplierForm.phone,
        address: supplierForm.address,
        businessRegistrationNumber: supplierForm.businessRegistrationNumber,
        fullName: supplierForm.contactPerson
      });
      const updatedSup = res.data?.data;
      setSupplierInfo(updatedSup);
      showToast('success', 'Supplier organization details saved successfully');
    } catch (err) {
      console.error('Update supplier profile error', err);
      showToast('error', err.response?.data?.message || 'Failed to update supplier profile');
    } finally {
      setIsUpdatingSupplier(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('error', 'New password and confirm password do not match');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      showToast('error', 'New password must be at least 6 characters');
      return;
    }

    try {
      setIsChangingPassword(true);
      await userService.changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword,
        passwordForm.confirmPassword
      );
      showToast('success', 'Password updated successfully');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      console.error('Change password error', err);
      showToast('error', err.response?.data?.message || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <LoadingSpinner size="lg" message="Loading profile..." />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold text-xl">
            {profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">{profile?.fullName}</h1>
              <Badge variant="primary">{profile?.role}</Badge>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{profile?.email}</p>
          </div>
        </div>

        <div className="text-right text-xs text-gray-400">
          <div>Status: <span className="font-semibold text-emerald-600">{profile?.status || 'ACTIVE'}</span></div>
          <div>Registered: {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}</div>
        </div>
      </div>

      {/* Supplier Business Profile Form & Overview */}
      {profile?.role === 'SUPPLIER' && (
        <>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <Building2 className="w-5 h-5 text-emerald-600" />
                <h2 className="text-lg font-bold text-gray-900">Supplier Business Profile</h2>
              </div>
              <Badge variant={supplierInfo?.status === 'APPROVED' ? 'success' : 'warning'}>
                {supplierInfo?.status || 'PENDING'}
              </Badge>
            </div>

            <form onSubmit={handleUpdateSupplierProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Company / Vendor Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={supplierForm.companyName}
                    onChange={(e) => setSupplierForm({ ...supplierForm, companyName: e.target.value })}
                    placeholder="e.g. Apollo MedSolutions Ltd"
                    className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Primary Contact Person <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={supplierForm.contactPerson}
                    onChange={(e) => setSupplierForm({ ...supplierForm, contactPerson: e.target.value })}
                    placeholder="Full name of representative"
                    className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Registered Business Email
                  </label>
                  <input
                    type="email"
                    disabled
                    value={supplierInfo?.email || profile?.email || ''}
                    className="w-full text-sm border border-gray-200 bg-gray-50 text-gray-500 rounded-lg p-2.5 cursor-not-allowed"
                  />
                  <span className="text-[11px] text-gray-400 mt-0.5 block">Managed via account login email</span>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Contact Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={supplierForm.phone}
                    onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                    placeholder="+91 (555) 000-0000"
                    className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Drug License / Registration Number
                  </label>
                  <input
                    type="text"
                    value={supplierForm.businessRegistrationNumber}
                    onChange={(e) => setSupplierForm({ ...supplierForm, businessRegistrationNumber: e.target.value })}
                    placeholder="e.g. DL-2024-TN-8921"
                    className="w-full text-sm font-mono border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Warehouse / Business Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={supplierForm.address}
                    onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                    placeholder="Registered street address and state"
                    className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  loading={isUpdatingSupplier}
                >
                  Save Business Profile
                </Button>
              </div>
            </form>
          </div>

          {/* Supplied Medicines Catalog */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Pill className="w-5 h-5 text-emerald-600" />
                <h2 className="text-lg font-bold text-gray-900">Your Supplied Medicine Portfolio</h2>
              </div>
              <span className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-2.5 py-1 rounded-full">
                {suppliedMedicines.length} Products Linked
              </span>
            </div>

            {suppliedMedicines.length === 0 ? (
              <EmptyState
                title="No medicines currently linked"
                description="When hospital staff associates products with your supplier catalog, they will be listed here."
                icon={Pill}
              />
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500 border-b">
                    <tr>
                      <th className="py-3 px-4">Medicine Name</th>
                      <th className="py-3 px-4">SKU</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Batch Number</th>
                      <th className="py-3 px-4 text-center">In-Stock Qty</th>
                      <th className="py-3 px-4 text-right">Unit Price</th>
                      <th className="py-3 px-4">Expiry Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {suppliedMedicines.map((m) => (
                      <tr key={m.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4 font-semibold text-gray-900">{m.name}</td>
                        <td className="py-3 px-4 font-mono text-xs text-gray-500">{m.sku}</td>
                        <td className="py-3 px-4 text-xs">
                          <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-medium">
                            {m.category?.name || 'General'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-gray-600">{m.batchNumber}</td>
                        <td className="py-3 px-4 text-center font-bold text-gray-900">{m.quantity}</td>
                        <td className="py-3 px-4 text-right font-medium text-emerald-700">
                          ${Number(m.unitPrice || 0).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-xs text-gray-600">
                          {m.expiryDate ? new Date(m.expiryDate).toLocaleDateString() : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Personal Account Information */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-emerald-600" />
          <span>User Account Information</span>
        </h2>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={profileForm.fullName}
                onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                disabled
                value={profile?.email || ''}
                className="w-full text-sm border border-gray-200 bg-gray-50 text-gray-500 rounded-lg p-2.5 cursor-not-allowed"
              />
              <span className="text-[11px] text-gray-400 mt-0.5 block">Email cannot be modified directly</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Personal Phone</label>
              <input
                type="text"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                placeholder="+1 (555) 000-0000"
                className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address / Ward Location</label>
              <input
                type="text"
                value={profileForm.address}
                onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                placeholder="Department or street address"
                className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="outline"
              loading={isUpdatingProfile}
            >
              Save Account Changes
            </Button>
          </div>
        </form>
      </div>

      {/* Security & Password Change */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-emerald-600" />
          <span>Security & Password</span>
        </h2>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <input
              type="password"
              required
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              placeholder="••••••••"
              className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                placeholder="Minimum 6 characters"
                className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                placeholder="Repeat new password"
                className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="outline"
              loading={isChangingPassword}
            >
              Update Password
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
