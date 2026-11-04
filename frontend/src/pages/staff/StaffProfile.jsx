
import { useEffect, useRef, useState } from "react";
import {
  User,
  Mail,
  ShieldCheck,
  Phone,
  RefreshCw,
  Pencil,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Camera,
  Trash2,
} from "lucide-react";

import { apiFetch } from "../../services/api.js";

export default function StaffProfile() {
  const [profile, setProfile] = useState({
    userId: null,
    fullName: "",
    email: "",
    phone: "",
    role: "STAFF",
    profilePicture: null,
  });

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    profilePicture: null,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fileInputRef = useRef(null);

  useEffect(() => {
    loadProfile();
  }, []);

  // Load profile
  const loadProfile = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const data = await apiFetch("/profile");

      const loadedProfile = {
        userId: data.userId,
        fullName: data.fullName || "",
        email: data.email || "",
        phone: data.phone || "",
        role: data.role || "STAFF",
        profilePicture: data.profilePicture || null,
      };

      setProfile(loadedProfile);

      setForm({
        fullName: loadedProfile.fullName,
        phone: loadedProfile.phone,
        profilePicture: loadedProfile.profilePicture,
      });
    } catch (err) {
      console.error("Profile loading error:", err);
      setError(err.message || "Unable to load profile.");
    } finally {
      setLoading(false);
    }
  };

  // Handle text input
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Upload and preview picture
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image.");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5 MB.");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setForm((prev) => ({
        ...prev,
        profilePicture: reader.result,
      }));

      setError("");
      setSuccess("");
    };

    reader.onerror = () => {
      setError("Unable to read the selected image.");
    };

    reader.readAsDataURL(file);
  };

  // Remove picture
  const handleRemovePicture = () => {
  setForm((prev) => ({
    ...prev,
    profilePicture: "",
  }));

  if (fileInputRef.current) {
    fileInputRef.current.value = "";
  }
};

  // Enable editing
  const handleEdit = () => {
    setForm({
      fullName: profile.fullName,
      phone: profile.phone,
      profilePicture: profile.profilePicture,
    });

    setEditing(true);
    setError("");
    setSuccess("");
  };

  // Cancel editing
  const handleCancel = () => {
    setForm({
      fullName: profile.fullName,
      phone: profile.phone,
      profilePicture: profile.profilePicture,
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setEditing(false);
    setError("");
  };

  // Save profile
  const handleSave = async (e) => {
    e.preventDefault();

    if (!form.fullName.trim()) {
      setError("Full name cannot be empty.");
      return;
    }

    if (form.fullName.trim().length > 100) {
      setError("Full name cannot exceed 100 characters.");
      return;
    }

    if (form.phone.trim().length > 30) {
      setError("Phone cannot exceed 30 characters.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      // Keep the selected picture before sending the request.
      const pictureToSave = form.profilePicture;

      const updatedData = await apiFetch("/profile", {
        method: "PUT",
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          phone: form.phone.trim(),
          profilePicture: pictureToSave,
        }),
      });

      // Use the response picture if returned.
      // Otherwise preserve the picture sent in the request.
      const savedPicture =
        updatedData.profilePicture !== undefined
          ? updatedData.profilePicture
          : pictureToSave;

      const updatedProfile = {
        userId: updatedData.userId ?? profile.userId,
        fullName: updatedData.fullName ?? form.fullName.trim(),
        email: updatedData.email ?? profile.email,
        phone: updatedData.phone ?? form.phone.trim(),
        role: updatedData.role ?? profile.role,
        profilePicture: savedPicture,
      };

      setProfile(updatedProfile);

      setForm({
        fullName: updatedProfile.fullName,
        phone: updatedProfile.phone,
        profilePicture: updatedProfile.profilePicture,
      });

      setEditing(false);
      setSuccess("Profile updated successfully!");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      console.error("Profile update error:", err);
      setError(err.message || "Unable to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-3 p-6 text-slate-500">
        <RefreshCw size={20} className="animate-spin" />
        Loading profile...
      </div>
    );
  }

  if (error && !profile.email && !profile.fullName) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950/30">
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle size={20} />
          <p>{error}</p>
        </div>

        <button
          onClick={loadProfile}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  const displayedPicture = editing
    ? form.profilePicture
    : profile.profilePicture;

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            My Profile
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            View and update your profile information.
          </p>
        </div>

        {!editing && (
          <button
            onClick={handleEdit}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Pencil size={16} />
            Edit Profile
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/30">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* Success message */}
      {success && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700 dark:bg-green-950/30">
          <CheckCircle size={18} />
          {success}
        </div>
      )}

      {/* Profile card */}
      <div className="max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {/* Profile header */}
        <div className="mb-8 flex flex-wrap items-center gap-5 border-b border-slate-200 pb-6 dark:border-slate-700">
          {/* Profile picture */}
          <div className="relative">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-blue-100 bg-blue-100 dark:border-slate-700 dark:bg-slate-800">
              {displayedPicture ? (
                <img
                  src={displayedPicture}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                <User size={42} className="text-blue-600" />
              )}
            </div>

            {editing && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={saving}
                title="Upload profile picture"
                className="absolute bottom-0 right-0 rounded-full bg-blue-600 p-2 text-white shadow hover:bg-blue-700 disabled:opacity-50"
              >
                <Camera size={17} />
              </button>
            )}
          </div>

          <div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
              {profile.fullName || "Staff User"}
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              {profile.role} Account
            </p>

            {editing && (
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={saving}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Change Picture
                </button>

                {form.profilePicture && (
                  <button
                    type="button"
                    onClick={handleRemovePicture}
                    disabled={saving}
                    className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
                  >
                    <Trash2 size={14} />
                    Remove
                  </button>
                )}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleImageChange}
              disabled={!editing || saving}
              className="hidden"
            />
          </div>
        </div>

        {/* Profile form */}
        <form onSubmit={handleSave} className="space-y-6">
          {/* Full Name */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Full Name
            </label>

            <div className="relative">
              <User
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                name="fullName"
                value={editing ? form.fullName : profile.fullName}
                onChange={handleChange}
                disabled={!editing || saving}
                maxLength={100}
                className="w-full rounded-lg border border-slate-300 bg-slate-50 py-3 pl-10 pr-4 text-slate-800 outline-none focus:border-blue-500 disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                placeholder="Enter your full name"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Email Address
            </label>

            <div className="relative">
              <Mail
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full cursor-not-allowed rounded-lg border border-slate-300 bg-slate-100 py-3 pl-10 pr-4 text-slate-500 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>

            <p className="mt-1 text-xs text-slate-400">
              Email address cannot be changed here.
            </p>
          </div>

          {/* Phone */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Phone Number
            </label>

            <div className="relative">
              <Phone
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="tel"
                name="phone"
                value={editing ? form.phone : profile.phone}
                onChange={handleChange}
                disabled={!editing || saving}
                maxLength={30}
                className="w-full rounded-lg border border-slate-300 bg-slate-50 py-3 pl-10 pr-4 text-slate-800 outline-none focus:border-blue-500 disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                placeholder="Enter your phone number"
              />
            </div>
          </div>

          {/* Role */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Account Role
            </label>

            <div className="relative">
              <ShieldCheck
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={profile.role}
                disabled
                className="w-full cursor-not-allowed rounded-lg border border-slate-300 bg-slate-100 py-3 pl-10 pr-4 text-slate-500 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
          </div>

          {/* Action buttons */}
          {editing && (
            <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-5 dark:border-slate-700">
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="flex items-center gap-2 rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <X size={17} />
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <RefreshCw size={17} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={17} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Refresh */}
      {!editing && (
        <button
          onClick={loadProfile}
          className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          <RefreshCw size={16} />
          Refresh Profile
        </button>
      )}
    </div>
  );
}
