
import { useEffect, useRef, useState } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Package,
  Edit,
  Save,
  X,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  ShieldCheck,
  Camera,
  ImagePlus,
} from "lucide-react";

import { API_BASE } from "../../services/api";

const API_URL = API_BASE;
const SERVER_URL = API_BASE.replace(/\/api$/, "");

const initialForm = {
  supplierName: "",
  contactNumber: "",
  address: "",
};

export default function SupplierProfile() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(initialForm);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [medicines, setMedicines] = useState([]);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [previewImage, setPreviewImage] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [imageError, setImageError] = useState(false);

  const fileInputRef = useRef(null);

  const getToken = () =>
    sessionStorage.getItem("medistock_token");

  // Convert backend image path into a complete URL.
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return "";

    // Already a complete URL
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
      return imageUrl;
    }

    // Add server URL and ensure path starts with /
    const path = imageUrl.startsWith("/")
      ? imageUrl
      : `/${imageUrl}`;

    return `${SERVER_URL}${path}`;
  };

  // Load supplier profile.
  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      if (!token) {
        throw new Error("Session expired. Please log in again.");
      }

      const response = await fetch(`${API_URL}/supplier/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(
          (await response.text()) ||
          "Unable to load supplier profile."
        );
      }

      const data = await response.json();
      setProfile(data);
      setProfile(data);
const medicineResponse = await fetch(
  `${API_URL}/supplier/me/medicines`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);
const medicineData = await medicineResponse.json();
setMedicines(
  Array.isArray(medicineData) ? medicineData : []
);


      setForm({
        supplierName: data.supplierName || "",
        contactNumber: data.contactNumber || "",
        address: data.address || "",
      });

      setImageError(false);
    } catch (err) {
      setError(err.message || "Unable to load profile.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch supplier profile only when the component loads
useEffect(() => {
  fetchProfile();
}, []);

// Debug profile state whenever it changes
useEffect(() => {
}, [profile]);

  // Handle form changes.
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // Select profile picture.
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setError("");
    setSuccess("");

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("Please select a JPG, PNG, or WEBP image.");
      e.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("Image size must not exceed 2 MB.");
      e.target.value = "";
      return;
    }

    setSelectedFile(file);

    const previewUrl = URL.createObjectURL(file);
    setPreviewImage(previewUrl);
    setImageError(false);
  };

  // Upload supplier profile picture.
  const handleImageUpload = async () => {
    if (!selectedFile) {
      setError("Please select a picture first.");
      return;
    }

    try {
      setUploading(true);
      setError("");
      setSuccess("");

      const token = getToken();

      if (!token) {
        throw new Error("Session expired. Please log in again.");
      }

      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch(
        `${API_URL}/supplier/me/profile-picture`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data.message || "Profile picture upload failed."
        );
      }

      if (!data.profileImageUrl) {
        throw new Error("Image URL is missing from backend response.");
      }

      setProfile((previous) => ({
        ...previous,
        ...data,
        profileImageUrl: data.profileImageUrl,
      }));

      setImageError(false);
      setPreviewImage("");
      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setSuccess("Profile picture uploaded successfully!");
    } catch (err) {
      setError(err.message || "Unable to upload profile picture.");
    } finally {
      setUploading(false);
    }
  };

  // Cancel profile editing.
  const handleCancel = () => {
    setForm({
      supplierName: profile?.supplierName || "",
      contactNumber: profile?.contactNumber || "",
      address: profile?.address || "",
    });

    setEditing(false);
    setError("");
    setSuccess("");
  };

  // Save profile details.
  const handleSave = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (!form.supplierName.trim()) {
        throw new Error("Supplier name is required.");
      }

      if (form.supplierName.trim().length > 150) {
        throw new Error("Supplier name cannot exceed 150 characters.");
      }

      const token = getToken();

      if (!token) {
        throw new Error("Session expired. Please log in again.");
      }

      const response = await fetch(`${API_URL}/supplier/me`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          supplierName: form.supplierName.trim(),
          contactNumber: form.contactNumber.trim(),
          address: form.address.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error(
          (await response.text()) || "Failed to update profile."
        );
      }

      const updatedProfile = await response.json();

      setProfile((previous) => ({
        ...previous,
        ...updatedProfile,
      }));

      setForm({
        supplierName: updatedProfile.supplierName || "",
        contactNumber: updatedProfile.contactNumber || "",
        address: updatedProfile.address || "",
      });

      setEditing(false);
      setSuccess("Your profile has been updated successfully.");
    } catch (err) {
      setError(err.message || "Unable to update profile.");
    } finally {
      setSaving(false);
    }
  };

  // Remove selected preview.
  const handleCancelImage = () => {
    setSelectedFile(null);
    setPreviewImage("");
    setImageError(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const inputClass =
    "mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-blue-500/20";

  const labelClass =
    "text-sm font-semibold text-slate-700 dark:text-slate-300";

  const savedImage = getImageUrl(profile?.profileImageUrl);
  const currentImage = previewImage || savedImage;

  // Loading state.
  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="text-center">
          <RefreshCw
            size={32}
            className="mx-auto animate-spin text-blue-600"
          />
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            Loading supplier profile...
          </p>
        </div>
      </div>
    );
  }

  // Error state.
  if (!profile && error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-500/30 dark:bg-red-500/10">
        <AlertCircle
          size={35}
          className="mx-auto text-red-600 dark:text-red-400"
        />

        <p className="mt-3 font-semibold text-red-700 dark:text-red-300">
          Unable to load profile
        </p>

        <p className="mt-2 text-sm text-red-600 dark:text-red-300">
          {error}
        </p>

        <button
          onClick={fetchProfile}
          className="mt-4 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">

      {/* Profile Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-800 shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:text-white">

        <div className="flex flex-wrap items-center gap-5">

          {/* Profile Picture */}
          <div className="relative h-24 w-24 shrink-0">

            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">

              {currentImage && !imageError ? (
                <img
                  key={currentImage}
                  src={currentImage}
                  alt="Supplier profile"
                  className="h-full w-full object-cover"
                  onLoad={() => {
                  }}
                  onError={() => {
                    console.error(
                      "Supplier profile image failed:",
                      currentImage
                    );
                    setImageError(true);
                  }}
                />
              ) : (
                <User
                  size={48}
                  className="text-slate-400"
                />
              )}

            </div>

            {/* Camera Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              title="Change profile picture"
              className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-white shadow-md transition hover:bg-blue-700 disabled:opacity-50 dark:border-slate-900"
            >
              <Camera size={17} />
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleImageSelect}
            />

          </div>

          {/* Supplier Name and Status */}
          <div className="min-w-0 flex-1">

            <h2 className="text-2xl font-bold">
              {profile?.supplierName || "Supplier"}
            </h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Supplier Account Profile
            </p>

            <div className="mt-3 flex items-center gap-2 text-sm">
              <ShieldCheck
                size={17}
                className={
                  profile?.active
                    ? "text-green-500"
                    : "text-red-500"
                }
              />

              <span>
                {profile?.active ? "Active Account" : "Inactive Account"}
              </span>
            </div>

          </div>

          {!editing && (
            <button
              onClick={() => {
                setEditing(true);
                setError("");
                setSuccess("");
              }}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <Edit size={16} />
              Edit Profile
            </button>
          )}

        </div>

        {/* Image Preview and Upload Actions */}
        {selectedFile && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-500/30 dark:bg-blue-500/10">

            <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200">
              <ImagePlus size={20} />

              <div>
                <p className="font-semibold">
                  New picture selected
                </p>
                <p className="text-xs opacity-80">
                  {selectedFile.name}
                </p>
              </div>
            </div>

            <div className="flex gap-2">

              <button
                type="button"
                onClick={handleCancelImage}
                disabled={uploading}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleImageUpload}
                disabled={uploading}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Save Picture
                  </>
                )}
              </button>

            </div>
          </div>
        )}

        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          JPG, PNG or WEBP. Maximum file size: 2 MB.
        </p>

      </div>

      {/* Messages */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          <AlertCircle size={20} />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-green-700 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-300">
          <CheckCircle size={20} />
          <p className="text-sm">{success}</p>
        </div>
      )}

      {/* Profile Form */}
      <form
        onSubmit={handleSave}
        className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="border-b border-slate-200 p-5 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">
            Supplier Information
          </h3>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            View your account details and update permitted information.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2">

          {/* Supplier ID */}
          <div>
            <label className={labelClass}>Supplier ID</label>
            <div className="mt-2 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <Package size={18} />
              <span>{profile?.supplierId ?? "N/A"}</span>
            </div>
          </div>

          {/* Supplier Name */}
          <div>
            <label className={labelClass}>
              Supplier Name <span className="text-red-500">*</span>
            </label>

            <div className="relative">
              <User
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                name="supplierName"
                value={form.supplierName}
                onChange={handleChange}
                disabled={!editing || saving}
                maxLength={150}
                required
                className={`${inputClass} pl-10 disabled:cursor-not-allowed disabled:opacity-70`}
                placeholder="Enter supplier name"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className={labelClass}>Email Address</label>

            <div className="relative">
              <Mail
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="email"
                value={profile?.email || ""}
                disabled
                className={`${inputClass} pl-10 cursor-not-allowed opacity-70`}
              />
            </div>

            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Email cannot be changed from this page.
            </p>
          </div>

          {/* Contact Number */}
          <div>
            <label className={labelClass}>Contact Number</label>

            <div className="relative">
              <Phone
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="tel"
                name="contactNumber"
                value={form.contactNumber}
                onChange={handleChange}
                disabled={!editing || saving}
                maxLength={20}
                className={`${inputClass} pl-10 disabled:cursor-not-allowed disabled:opacity-70`}
                placeholder="Enter contact number"
              />
            </div>
          </div>

          {/* Address */}
          <div className="md:col-span-2">
            <label className={labelClass}>Address</label>

            <div className="relative">
              <MapPin
                size={18}
                className="absolute left-3 top-4 text-slate-400"
              />

              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
                disabled={!editing || saving}
                rows={3}
                maxLength={255}
                className={`${inputClass} resize-none pl-10 disabled:cursor-not-allowed disabled:opacity-70`}
                placeholder="Enter your business address"
              />
            </div>
          </div>

          {/* Medicines */}
          <div className="md:col-span-2">
            <label className={labelClass}>Medicines Supplied</label>

            <div className="mt-2 flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
              <Package
                size={20}
                className="mt-0.5 text-slate-500 dark:text-slate-400"
              />

              {medicines.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {medicines.map((medicine, index) => (
                    <span
                      key={`${medicine}-${index}`}
                      className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
                    >
                      {medicine}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  No medicines supplied yet.
                </p>
              )}
            </div>

            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Medicines are automatically displayed based on your inventory records.
            </p>
          </div>

        </div>

        {/* Form Actions */}
        {editing && (
          <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-800/50">

            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <X size={17} />
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
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
  );
}
