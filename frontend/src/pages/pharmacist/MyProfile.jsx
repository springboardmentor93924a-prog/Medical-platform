
import { useEffect, useState } from "react";
import {
  getProfile,
  updateProfile,
} from "../../api/pharmacistApi.js";

export default function MyProfile() {
  const [profile, setProfile] = useState({
    fullName: "",
    email: "",
    phone: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load profile when the component mounts
  useEffect(() => {
    let active = true;

    async function loadProfile() {
      setLoading(true);
      setError("");

      try {
        const { data } = await getProfile();

        if (!active) return;

        setProfile({
          fullName: data?.fullName ?? "",
          email: data?.email ?? "",
          phone: data?.phone ?? "",
        });
      } catch (requestError) {
        if (!active) return;

        setError(
          requestError.response?.data?.message ||
            requestError.response?.data?.error ||
            requestError.response?.data?.detail ||
            requestError.message ||
            "Unable to load your profile."
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, []);

  // Handle input changes
  const handleChange = (event) => {
    const { name, value } = event.target;

    setProfile((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // Save profile
  const handleSubmit = async (event) => {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const { data } = await updateProfile(profile);

      // Update token only if the backend returns a new one.
      if (data?.token) {
        sessionStorage.setItem("medistock_token", data.token);
      }

      // Support APIs that return the updated profile directly.
      const updatedProfile = data?.profile ?? data ?? {};

      setProfile({
        fullName: updatedProfile.fullName ?? profile.fullName,
        email: updatedProfile.email ?? profile.email,
        phone: updatedProfile.phone ?? profile.phone,
      });

      setSuccess("Profile saved successfully.");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          requestError.response?.data?.error ||
          requestError.response?.data?.detail ||
          requestError.message ||
          "Unable to save your profile."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          My Profile
        </h2>

        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          View and update your personal profile details.
        </p>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
        >
          {error}
        </p>
      )}

      {success && (
        <p
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
        >
          {success}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Loading profile...
        </p>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <div>
            <label
              htmlFor="profile-full-name"
              className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              Full Name
            </label>

            <input
              id="profile-full-name"
              name="fullName"
              value={profile.fullName}
              onChange={handleChange}
              required
              autoComplete="name"
              className="w-full rounded-xl border border-slate-300 bg-transparent px-4 py-3 outline-none focus:border-blue-500 dark:border-slate-700 dark:text-white"
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label
              htmlFor="profile-email"
              className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              Email
            </label>

            <input
              id="profile-email"
              type="email"
              name="email"
              value={profile.email}
              onChange={handleChange}
              required
              autoComplete="email"
              className="w-full rounded-xl border border-slate-300 bg-transparent px-4 py-3 outline-none focus:border-blue-500 dark:border-slate-700 dark:text-white"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label
              htmlFor="profile-phone"
              className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              Phone
            </label>

            <input
              id="profile-phone"
              type="tel"
              name="phone"
              value={profile.phone}
              onChange={handleChange}
              autoComplete="tel"
              className="w-full rounded-xl border border-slate-300 bg-transparent px-4 py-3 outline-none focus:border-blue-500 dark:border-slate-700 dark:text-white"
              placeholder="Enter your phone number"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </form>
      )}
    </section>
  );
}
