"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Globe,
  Clock,
  Shield,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Camera,
  Trash2,
  Lock,
  Eye,
  EyeOff,
  Save,
  RotateCcw,
  Store,
  Calendar,
  Loader2,
  Check,
  Building2,
  Laptop,
  Smartphone,
  LogOut,
  BellRing,
} from "lucide-react";

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  emailVerified: boolean;
  phone: string;
  jobTitle: string;
  photoUrl: string;
  language: string;
  timezone: string;
  accountStatus: string;
  globalRole: string;
  createdAt: string;
  activeBusiness?: {
    id: string;
    name: string;
    role: string;
  } | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<
    "personal" | "security" | "preferences" | "sessions"
  >("personal");

  // Loading & Action States
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [initialProfile, setInitialProfile] = useState<UserProfile | null>(null);

  // Photo Upload State
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [isRemovingPhoto, setIsRemovingPhoto] = useState(false);

  // Security Form State
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<{
    loading: boolean;
    error: string | null;
    success: boolean;
  }>({ loading: false, error: null, success: false });

  // Preferences State
  const [soundEffects, setSoundEffects] = useState(true);
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");

  // Load User Profile on Mount
  useEffect(() => {
    async function loadProfile() {
      try {
        setIsLoading(true);
        const res = await fetch("/api/user/profile");
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.profile) {
            setProfile(data.profile);
            setInitialProfile(data.profile);
            setPhotoPreview(data.profile.photoUrl || "");
          }
        }
      } catch (err) {
        console.error("Failed to load user profile:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, []);

  // Check if form has unsaved modifications
  const isDirty = Boolean(
    profile &&
      initialProfile &&
      (profile.firstName !== initialProfile.firstName ||
        profile.lastName !== initialProfile.lastName ||
        profile.displayName !== initialProfile.displayName ||
        profile.email !== initialProfile.email ||
        profile.phone !== initialProfile.phone ||
        profile.jobTitle !== initialProfile.jobTitle ||
        profile.language !== initialProfile.language ||
        profile.timezone !== initialProfile.timezone ||
        photoPreview !== (initialProfile.photoUrl || ""))
  );

  // Handle Photo Selection & Preview
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file (PNG, JPG, or WebP).");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("Profile photo size must be less than 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setPhotoPreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Remove Photo & Reset to Default Initials
  const handleRemovePhoto = async () => {
    if (!confirm("Are you sure you want to remove your profile photo?")) return;

    try {
      setIsRemovingPhoto(true);
      const res = await fetch("/api/user/profile/photo", { method: "DELETE" });
      const data = await res.json();

      if (res.ok && data.success) {
        setPhotoPreview("");
        if (profile) {
          setProfile({ ...profile, photoUrl: "" });
        }
        if (initialProfile) {
          setInitialProfile({ ...initialProfile, photoUrl: "" });
        }
      }
    } catch (err) {
      alert("Failed to remove avatar photo.");
    } finally {
      setIsRemovingPhoto(false);
    }
  };

  // Save Changes
  const handleSave = async () => {
    if (!profile || isSaving) return;

    try {
      setIsSaving(true);
      setErrorMessage(null);

      const payload = {
        firstName: profile.firstName,
        lastName: profile.lastName,
        displayName: profile.displayName,
        email: profile.email,
        phone: profile.phone,
        jobTitle: profile.jobTitle,
        language: profile.language,
        timezone: profile.timezone,
        photoUrl: photoPreview,
      };

      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update profile.");
      }

      setProfile(data.profile);
      setInitialProfile(data.profile);
      setPhotoPreview(data.profile.photoUrl || "");

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  // Cancel & Discard Unsaved Changes
  const handleCancel = () => {
    if (isDirty) {
      if (!confirm("Discard unsaved changes and restore previous profile values?")) {
        return;
      }
    }

    if (initialProfile) {
      setProfile({ ...initialProfile });
      setPhotoPreview(initialProfile.photoUrl || "");
      setErrorMessage(null);
    }
  };

  // Change Password Submission
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || newPassword !== confirmPassword) return;

    try {
      setPasswordStatus({ loading: true, error: null, success: false });

      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to change password.");
      }

      setPasswordStatus({ loading: false, error: null, success: true });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordStatus({ loading: false, error: err.message, success: false });
    }
  };

  // Helper for Initials
  const getInitials = (fName?: string, lName?: string, dName?: string) => {
    if (fName && lName) return `${fName[0]}${lName[0]}`.toUpperCase();
    if (dName) {
      const parts = dName.trim().split(" ");
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return dName.slice(0, 2).toUpperCase();
    }
    return "BF";
  };

  const tabs = [
    { id: "personal" as const, label: "Personal Information", icon: User },
    { id: "security" as const, label: "Security", icon: Shield },
    { id: "preferences" as const, label: "Preferences", icon: Globe },
    { id: "sessions" as const, label: "Active Sessions", icon: Laptop },
  ];

  if (isLoading) {
    return (
      <div className="py-24 text-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#0D9668]" />
        <p className="text-sm font-semibold text-slate-600">Loading your profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="py-20 text-center space-y-3 bg-white rounded-2xl border border-slate-200 p-8 max-w-md mx-auto">
        <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto" />
        <h3 className="text-base font-bold text-slate-900">Profile Unavailable</h3>
        <p className="text-xs text-slate-500">
          Unable to resolve authenticated user details. Please try signing in again.
        </p>
        <Link
          href="/login"
          className="inline-block px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hidden file input for Avatar selection */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handlePhotoSelect}
        className="hidden"
      />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <User className="h-6 w-6 text-slate-400" />
            My Profile
          </h1>
          <p className="text-sm text-slate-500">
            Manage your personal information, account security, and preferences.
          </p>
        </div>

        {/* Global Save / Cancel actions */}
        <div className="flex items-center gap-2">
          {isDirty && (
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 transition"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Cancel</span>
            </button>
          )}

          <button
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0D9668] hover:bg-[#097852] px-5 py-2.5 text-xs font-bold text-white shadow-xs shadow-[#0D9668]/30 transition disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : savedSuccess ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {savedSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-3 text-xs text-emerald-800 animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>
            <strong>Profile updated successfully.</strong> Your changes have been persisted.
          </span>
        </div>
      )}

      {/* Error Notification Banner */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-3 text-xs text-red-800 animate-in fade-in slide-in-from-top-2 duration-200">
          <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Profile Overview Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          {/* Avatar Container */}
          <div className="relative group shrink-0">
            <div className="h-20 w-20 rounded-2xl bg-[#101827] border-2 border-slate-200 overflow-hidden flex items-center justify-center text-white font-extrabold text-2xl shadow-sm">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt={profile.displayName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>{getInitials(profile.firstName, profile.lastName, profile.displayName)}</span>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 p-1.5 rounded-lg bg-white border border-slate-200 shadow-xs text-slate-600 hover:text-[#0D9668] hover:border-[#0D9668] transition"
              title="Change Profile Photo"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* User Identity Details */}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-slate-900">{profile.displayName}</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {profile.accountStatus}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {profile.jobTitle}
              </span>
            </div>

            <p className="text-xs text-slate-500 font-mono mt-0.5 flex items-center gap-1.5">
              <span>{profile.email}</span>
              {profile.emailVerified && (
                <span className="inline-flex items-center text-[10px] font-bold text-[#0D9668]">
                  <Check className="h-3 w-3" /> Verified
                </span>
              )}
            </p>

            {/* Current Business Context */}
            {profile.activeBusiness && (
              <p className="text-xs text-slate-600 mt-1 flex items-center gap-1.5">
                <Store className="h-3.5 w-3.5 text-[#0D9668]" />
                <span className="font-semibold">{profile.activeBusiness.name}</span>
                <span className="text-slate-400">•</span>
                <span className="font-bold text-[#0D9668]">{profile.activeBusiness.role}</span>
              </p>
            )}
          </div>
        </div>

        {/* Member Since Metadata */}
        <div className="flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" /> Member Since
          </span>
          <span className="font-semibold text-slate-700">
            {new Date(profile.createdAt).toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition shrink-0 ${
                activeTab === tab.id
                  ? "bg-[#101827] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${activeTab === tab.id ? "text-[#0D9668]" : ""}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ─── TAB 1: Personal Information ─── */}
      {activeTab === "personal" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-6">
            <div className="pb-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <User className="h-4 w-4 text-[#0D9668]" /> Basic Details & Avatar
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Your personal identity details displayed on sales transactions and audit history
              </p>
            </div>

            {/* Photo Management Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/60">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-[#101827] overflow-hidden flex items-center justify-center text-white font-bold text-sm">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
                  ) : (
                    <span>{getInitials(profile.firstName, profile.lastName, profile.displayName)}</span>
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Profile Photo</h4>
                  <p className="text-[11px] text-slate-400">
                    PNG, JPG, or WebP up to 2MB. Square 1:1 ratio recommended.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition"
                >
                  Upload New Photo
                </button>
                {photoPreview && (
                  <button
                    type="button"
                    disabled={isRemovingPhoto}
                    onClick={handleRemovePhoto}
                    className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition"
                    title="Remove Photo"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={profile.firstName}
                  onChange={(e) => {
                    const f = e.target.value;
                    setProfile({
                      ...profile,
                      firstName: f,
                      displayName: `${f} ${profile.lastName}`.trim(),
                    });
                  }}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0D9668] focus:border-[#0D9668] transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={profile.lastName}
                  onChange={(e) => {
                    const l = e.target.value;
                    setProfile({
                      ...profile,
                      lastName: l,
                      displayName: `${profile.firstName} ${l}`.trim(),
                    });
                  }}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0D9668] focus:border-[#0D9668] transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Display / Receipt Name
                </label>
                <input
                  type="text"
                  value={profile.displayName}
                  onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0D9668] focus:border-[#0D9668] transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 pl-9 pr-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0D9668] focus:border-[#0D9668] transition font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="+251 911 234567"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 pl-9 pr-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0D9668] focus:border-[#0D9668] transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Position / Job Title
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={profile.jobTitle}
                    onChange={(e) => setProfile({ ...profile, jobTitle: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 pl-9 pr-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0D9668] focus:border-[#0D9668] transition"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: Security ─── */}
      {activeTab === "security" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-6">
            <div className="pb-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Lock className="h-4 w-4 text-[#0D9668]" /> Password & Security
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Update password using secure cryptographic hash checks
              </p>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
              {passwordStatus.success && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Your password was changed successfully!</span>
                </div>
              )}

              {passwordStatus.error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span>{passwordStatus.error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Current Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full rounded-xl border border-slate-300 pl-9 pr-10 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0D9668]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  New Password (min. 8 characters)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full rounded-xl border border-slate-300 pl-9 pr-10 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0D9668]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full rounded-xl border border-slate-300 pl-9 pr-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0D9668]"
                  />
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-[11px] text-red-500 mt-1 font-semibold">
                    Passwords do not match
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={
                  passwordStatus.loading ||
                  !currentPassword ||
                  !newPassword ||
                  newPassword.length < 8 ||
                  newPassword !== confirmPassword
                }
                className="inline-flex items-center gap-2 rounded-xl bg-[#101827] hover:bg-slate-800 px-5 py-2.5 text-xs font-bold text-white shadow-xs transition disabled:opacity-40"
              >
                {passwordStatus.loading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-3.5 w-3.5" />
                    <span>Update Password</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── TAB 3: Preferences ─── */}
      {activeTab === "preferences" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-6">
            <div className="pb-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Globe className="h-4 w-4 text-[#0D9668]" /> Interface & Regional Preferences
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Language, date presentation, and notification sounds
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Preferred Language
                </label>
                <select
                  value={profile.language}
                  onChange={(e) => setProfile({ ...profile, language: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 bg-white"
                >
                  <option value="en">English (Default)</option>
                  <option value="am">አማርኛ (Amharic)</option>
                  <option value="om">Afaan Oromoo (Oromo)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Timezone
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <select
                    value={profile.timezone}
                    onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 pl-9 pr-3.5 py-2.5 text-sm text-slate-900 bg-white"
                  >
                    <option value="Africa/Addis_Ababa">East Africa Time (UTC+3, Addis Ababa)</option>
                    <option value="UTC">Coordinated Universal Time (UTC)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Date Format
                </label>
                <select
                  value={dateFormat}
                  onChange={(e) => setDateFormat(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 bg-white"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 10/10/2026)</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 10/10/2026)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (ISO 8601)</option>
                </select>
              </div>

              <div className="flex items-center gap-3 self-end pb-2">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={soundEffects}
                    onChange={(e) => setSoundEffects(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0D9668]" />
                </label>
                <div>
                  <span className="text-xs font-semibold text-slate-700 block">
                    Audio Feedback & POS Chimes
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Play confirmation sounds when barcode scanned or sale finalized
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 4: Active Sessions ─── */}
      {activeTab === "sessions" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-6">
            <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Laptop className="h-4 w-4 text-[#0D9668]" /> Active Sessions
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Devices with active login sessions to your BizFlow Ethiopia account
                </p>
              </div>

              <button
                onClick={async () => {
                  if (confirm("Sign out of this device?")) {
                    await fetch("/api/auth/logout", { method: "POST" });
                    router.push("/login");
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Log Out</span>
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
                    <Laptop className="h-5 w-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <span>Chrome / Edge Browser on Windows</span>
                      <span className="text-[10px] font-bold text-[#0D9668] bg-[#DCEFE7] px-1.5 py-0.2 rounded border border-[#0D9668]/20">
                        Current Session
                      </span>
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      Addis Ababa, Ethiopia • Active Now
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
