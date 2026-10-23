import React, { useState, useEffect, useRef } from 'react';
import { 
    User, 
    ShieldCheck, 
    Building2, 
    KeyRound, 
    Check, 
    Award, 
    Lock,
    Save,
    Upload,
    Trash2,
    Camera,
    X,
    Image as ImageIcon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { PasswordResetModal } from '../modals/PasswordResetModal';

export const ProfileView = () => {
    const { user, updateProfile } = useAuth();
    const { showToast } = useToast();
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const fileInputRef = useRef(null);

    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [license, setLicense] = useState(user?.license || 'RPh-NY-893012');
    const [facility, setFacility] = useState(user?.facility || 'Main Hospital Center - Central Pharmacy');
    const [avatar, setAvatar] = useState(user?.avatar || null);
    const [showUrlInput, setShowUrlInput] = useState(false);
    const [customUrl, setCustomUrl] = useState('');

    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setEmail(user.email || '');
            setLicense(user.license || 'RPh-NY-893012');
            setFacility(user.facility || 'Main Hospital Center - Central Pharmacy');
            setAvatar(user.avatar || null);
        }
    }, [user]);

    const handleFileUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            showToast('Image file too large. Please select an image under 2MB.', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const base64 = event.target.result;
            setAvatar(base64);
            updateProfile({ avatar: base64 });
            showToast('Profile picture updated successfully', 'success');
        };
        reader.readAsDataURL(file);
    };

    const handleRemovePhoto = () => {
        setAvatar(null);
        setCustomUrl('');
        setShowUrlInput(false);
        updateProfile({ avatar: null });
        showToast('Profile photo removed. Profile avatar is now empty.', 'info');
    };

    const handleApplyUrl = () => {
        if (!customUrl.trim()) return;
        setAvatar(customUrl.trim());
        updateProfile({ avatar: customUrl.trim() });
        setShowUrlInput(false);
        setCustomUrl('');
        showToast('Profile picture updated from URL', 'success');
    };

    const handleSave = (e) => {
        e.preventDefault();
        updateProfile({
            name,
            email,
            license,
            facility,
            avatar
        });
        showToast('Clinical practitioner credentials updated successfully', 'success');
    };

    return (
        <div className="space-y-6 animate-fadeIn pb-12 max-w-4xl bg-white text-slate-900">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                    <User className="text-emerald-600" size={26} />
                    <span>Clinical Practitioner Credentials & Security</span>
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                    Manage your licensed pharmacist verification, security credentials, and affiliated hospital site.
                </p>
            </div>

            {/* Profile Card */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-100">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                        {/* Avatar Display / Empty Profile Box */}
                        <div className="relative group shrink-0">
                            {avatar ? (
                                <div className="relative">
                                    <img
                                        src={avatar}
                                        alt={user?.name || 'Practitioner profile'}
                                        className="w-20 h-20 rounded-2xl object-cover ring-2 ring-emerald-500/30 shadow-md"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleRemovePhoto}
                                        title="Remove profile picture"
                                        className="absolute -top-2 -right-2 p-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-all cursor-pointer"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ) : (
                                <div className="w-20 h-20 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 shadow-inner">
                                    <User size={32} className="text-slate-400" />
                                    <span className="text-[10px] font-semibold text-slate-400 mt-0.5">No Photo</span>
                                </div>
                            )}
                        </div>

                        {/* Name and Clinical Meta */}
                        <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="text-lg font-bold text-slate-900">{user?.name || 'Chief Pharmacist'}</h2>
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    {user?.role || 'Pharmacist'}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500">{user?.email}</p>
                            <p className="text-xs text-teal-700 font-mono font-semibold">Board License: {user?.license || 'RPh-NY-893012'}</p>

                            {/* Photo Actions */}
                            <div className="flex flex-wrap items-center gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                                >
                                    <Upload size={13} className="text-emerald-600" />
                                    <span>{avatar ? 'Change Picture' : 'Upload Picture'}</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setShowUrlInput(!showUrlInput)}
                                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                                >
                                    <ImageIcon size={13} className="text-cyan-600" />
                                    <span>Add from URL</span>
                                </button>

                                {avatar && (
                                    <button
                                        type="button"
                                        onClick={handleRemovePhoto}
                                        className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold border border-rose-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                                    >
                                        <Trash2 size={13} />
                                        <span>Remove Photo</span>
                                    </button>
                                )}

                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                    accept="image/*"
                                    className="hidden"
                                />
                            </div>

                            {/* Optional URL input toggle */}
                            {showUrlInput && (
                                <div className="flex items-center gap-2 pt-2 animate-fadeIn">
                                    <input
                                        type="url"
                                        placeholder="https://example.com/avatar.jpg"
                                        value={customUrl}
                                        onChange={(e) => setCustomUrl(e.target.value)}
                                        className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 w-64"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleApplyUrl}
                                        className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 cursor-pointer"
                                    >
                                        Apply
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowUrlInput(false)}
                                        className="p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={() => setIsPasswordModalOpen(true)}
                        className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-300 shadow-sm transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto shrink-0"
                    >
                        <KeyRound size={15} className="text-cyan-600" />
                        <span>Change Password</span>
                    </button>
                </div>

                {/* Edit Form */}
                <form onSubmit={handleSave} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Legal Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Work Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">State License / DEA Registration #</label>
                            <input
                                type="text"
                                value={license}
                                onChange={e => setLicense(e.target.value)}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">Default Dispensary Annex</label>
                            <input
                                type="text"
                                value={facility}
                                onChange={e => setFacility(e.target.value)}
                                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex justify-end">
                        <button
                            type="submit"
                            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer"
                        >
                            <Save size={15} />
                            <span>Save Profile Changes</span>
                        </button>
                    </div>
                </form>
            </div>

            {/* Password Modal */}
            <PasswordResetModal
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
            />
        </div>
    );
};
