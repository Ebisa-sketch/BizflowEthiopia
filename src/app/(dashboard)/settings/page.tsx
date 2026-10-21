"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Settings,
  Building2,
  Store,
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  Shield,
  Bell,
  Palette,
  Save,
  CheckCircle2,
  Camera,
  CreditCard,
  FileText,
  Lock,
  Eye,
  EyeOff,
  Printer,
  Smartphone,
  AlertTriangle,
  RotateCcw,
  LogOut,
  Trash2,
  Loader2,
  X,
  Upload,
} from "lucide-react";

interface BusinessProfile {
  businessName: string;
  tradeName: string;
  tin: string;
  vatRegistered: boolean;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  subcity: string;
  timezone: string;
  currency: string;
  locale: string;
  logoUrl?: string;
}

interface StoreSettings {
  defaultPaymentMethod: string;
  receiptFooterMessage: string;
  autoReceiptPrint: boolean;
  lowStockAlertEnabled: boolean;
  lowStockThresholdDefault: number;
  requireReasonForAdjustment: boolean;
  allowNegativeStock: boolean;
  showCostPriceToStaff: boolean;
}

interface NotificationPrefs {
  lowStockAlerts: boolean;
  dailySalesSummary: boolean;
  newStaffJoined: boolean;
  expenseRecorded: boolean;
  subscriptionReminder: boolean;
  emailNotifications: boolean;
  browserNotifications: boolean;
}

export default function SettingsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<
    "business" | "store" | "notifications" | "security"
  >("business");

  // Loading & Action States
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // User & Permissions
  const [userRole, setUserRole] = useState<string>("CASHIER");
  const [canManage, setCanManage] = useState(false);

  // Initial State Backup for Cancel / Reset
  const [initialData, setInitialData] = useState<{
    business: BusinessProfile;
    store: StoreSettings;
    notifications: NotificationPrefs;
  } | null>(null);

  // Business Profile State
  const [business, setBusiness] = useState<BusinessProfile>({
    businessName: "Addis Mini Mart",
    tradeName: "Addis Mini Mart (Bole Branch)",
    tin: "TIN-001928374",
    vatRegistered: false,
    ownerName: "Abebe Kebede",
    email: "owner@addismart.et",
    phone: "+251 911 234567",
    address: "Bole Atlas, Next to Edna Mall",
    city: "Addis Ababa",
    subcity: "Bole",
    timezone: "Africa/Addis_Ababa",
    currency: "ETB",
    locale: "en",
    logoUrl: "",
  });

  // Store Operations State
  const [store, setStore] = useState<StoreSettings>({
    defaultPaymentMethod: "TELEBIRR",
    receiptFooterMessage: "Thank you for shopping with us!",
    autoReceiptPrint: true,
    lowStockAlertEnabled: true,
    lowStockThresholdDefault: 10,
    requireReasonForAdjustment: true,
    allowNegativeStock: false,
    showCostPriceToStaff: false,
  });

  // Notifications State
  const [notifications, setNotifications] = useState<NotificationPrefs>({
    lowStockAlerts: true,
    dailySalesSummary: true,
    newStaffJoined: true,
    expenseRecorded: false,
    subscriptionReminder: true,
    emailNotifications: true,
    browserNotifications: false,
  });

  // Security & Password State
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

  // Delete Business Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Fetch Live Settings on Mount
  useEffect(() => {
    async function loadSettings() {
      try {
        setIsLoading(true);
        const [settingsRes, meRes] = await Promise.all([
          fetch("/api/businesses/current"),
          fetch("/api/auth/me"),
        ]);

        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData.authenticated && meData.user) {
            setUserRole(meData.user.role || "CASHIER");
          }
        }

        if (settingsRes.ok) {
          const data = await settingsRes.json();
          if (data.success && data.settings) {
            const s = data.settings;
            setCanManage(s.canManageBusiness);

            const loadedBusiness: BusinessProfile = {
              businessName: s.businessName || "My Store",
              tradeName: s.tradeName || s.businessName || "My Store",
              tin: s.tin || "",
              vatRegistered: Boolean(s.vatRegistered),
              ownerName: business.ownerName,
              email: s.contactEmail || "",
              phone: s.phone || "",
              address: s.address || "",
              city: s.city || "Addis Ababa",
              subcity: s.subcity || "Bole",
              timezone: s.timezone || "Africa/Addis_Ababa",
              currency: s.currency || "ETB",
              locale: s.locale || "en",
              logoUrl: s.logoUrl || "",
            };

            const loadedStore: StoreSettings = {
              defaultPaymentMethod: s.defaultPaymentMethod || "CASH",
              receiptFooterMessage: s.receiptFooterMessage || "",
              autoReceiptPrint: Boolean(s.autoReceiptPrint),
              lowStockAlertEnabled: Boolean(s.lowStockAlertEnabled),
              lowStockThresholdDefault: Number(s.lowStockThresholdDefault) || 5,
              requireReasonForAdjustment: Boolean(s.requireReasonForAdjustment),
              allowNegativeStock: Boolean(s.allowNegativeStock),
              showCostPriceToStaff: Boolean(s.showCostPriceToStaff),
            };

            const loadedNotifications: NotificationPrefs = s.notificationPrefs || notifications;

            setBusiness(loadedBusiness);
            setStore(loadedStore);
            setNotifications(loadedNotifications);

            setInitialData({
              business: loadedBusiness,
              store: loadedStore,
              notifications: loadedNotifications,
            });
          }
        }
      } catch (err) {
        console.error("Failed to load business settings:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadSettings();
  }, []);

  // Handle Logo Upload File Selection
  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file (PNG, JPG, or WebP).");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("Logo image size must be under 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setBusiness((prev) => ({ ...prev, logoUrl: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Save Changes
  const handleSave = async () => {
    try {
      setIsSaving(true);
      setErrorMessage(null);

      const payload = {
        businessName: business.businessName,
        tradeName: business.tradeName,
        tin: business.tin,
        vatRegistered: business.vatRegistered,
        contactEmail: business.email,
        phone: business.phone,
        address: business.address,
        city: business.city,
        subcity: business.subcity,
        timezone: business.timezone,
        currency: business.currency,
        locale: business.locale,
        logoUrl: business.logoUrl,
        defaultPaymentMethod: store.defaultPaymentMethod,
        receiptFooterMessage: store.receiptFooterMessage,
        autoReceiptPrint: store.autoReceiptPrint,
        lowStockAlertEnabled: store.lowStockAlertEnabled,
        lowStockThresholdDefault: store.lowStockThresholdDefault,
        requireReasonForAdjustment: store.requireReasonForAdjustment,
        allowNegativeStock: store.allowNegativeStock,
        showCostPriceToStaff: store.showCostPriceToStaff,
        notificationPrefs: notifications,
      };

      const res = await fetch("/api/businesses/current", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update business settings.");
      }

      setInitialData({
        business: { ...business },
        store: { ...store },
        notifications: { ...notifications },
      });

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  // Cancel / Discard Changes
  const handleCancel = () => {
    if (initialData) {
      setBusiness({ ...initialData.business });
      setStore({ ...initialData.store });
      setNotifications({ ...initialData.notifications });
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

  // Sign Out
  const handleLogout = async () => {
    if (!confirm("Are you sure you want to log out of BizFlow?")) return;
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    }
  };

  // Safe Business Deletion
  const handleDeleteBusiness = async () => {
    try {
      setDeleteLoading(true);
      setDeleteError(null);

      const res = await fetch("/api/businesses/current", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmationName: deleteConfirmText,
          reason: deleteReason,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to deactivate business.");
      }

      alert("Business successfully deactivated. Redirecting to login...");
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (err: any) {
      setDeleteError(err.message || "Failed to deactivate business.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const tabs = [
    { id: "business" as const, label: "Business Profile", icon: Building2 },
    { id: "store" as const, label: "Store Operations", icon: Store },
    { id: "notifications" as const, label: "Notifications", icon: Bell },
    { id: "security" as const, label: "Security & Account", icon: Shield },
  ];

  if (isLoading) {
    return (
      <div className="py-24 text-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#0D9668]" />
        <p className="text-sm font-semibold text-slate-600">Loading business settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hidden File Input for Logo Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleLogoFileChange}
        className="hidden"
      />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Settings className="h-6 w-6 text-slate-400" />
            Business Settings
            {!canManage && (
              <span className="text-xs bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full border border-slate-300">
                View Only ({userRole})
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-500">
            Manage your store identity, regional Ethiopian settings, inventory thresholds, and security
          </p>
        </div>

        {canManage && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 transition"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Cancel</span>
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving}
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
        )}
      </div>

      {/* Success Notification Banner */}
      {savedSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-3 text-xs text-emerald-800 animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>
            <strong>Settings persisted successfully.</strong> All changes are applied to your active business configuration.
          </span>
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-3 text-xs text-red-800 animate-in fade-in slide-in-from-top-2 duration-200">
          <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

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

      {/* ─── TAB 1: Business Profile & Regional Settings ─── */}
      {activeTab === "business" && (
        <div className="space-y-6">
          {/* Business Identity Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-6">
            <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-[#0D9668]" /> Business Identity & Branding
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Legal store information printed on customer receipts and tax reports
                </p>
              </div>
            </div>

            {/* Logo Preview and Upload */}
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-[#101827] border border-slate-300 overflow-hidden flex items-center justify-center text-white font-black text-xl shadow-xs">
                {business.logoUrl ? (
                  <img
                    src={business.logoUrl}
                    alt="Business Logo"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex items-center">
                    <span className="text-[#0D9668]">B</span>
                    <span>F</span>
                  </div>
                )}
              </div>
              <div>
                <button
                  type="button"
                  disabled={!canManage}
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0D9668] hover:text-[#097852] disabled:opacity-50 transition"
                >
                  <Camera className="h-3.5 w-3.5" />
                  <span>Upload Store Logo</span>
                </button>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Recommended: Square PNG/JPEG, maximum 2MB
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Legal Business Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  disabled={!canManage}
                  value={business.businessName}
                  onChange={(e) => setBusiness({ ...business, businessName: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0D9668] focus:border-[#0D9668] transition disabled:bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Trade / Display Branch Name
                </label>
                <input
                  type="text"
                  disabled={!canManage}
                  value={business.tradeName}
                  onChange={(e) => setBusiness({ ...business, tradeName: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0D9668] focus:border-[#0D9668] transition disabled:bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Tax Identification Number (TIN)
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    disabled={!canManage}
                    placeholder="e.g. TIN-001928374"
                    value={business.tin}
                    onChange={(e) => setBusiness({ ...business, tin: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 pl-9 pr-3.5 py-2.5 text-sm text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-[#0D9668] focus:border-[#0D9668] transition disabled:bg-slate-50"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 self-end pb-2">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={!canManage}
                    checked={business.vatRegistered}
                    onChange={(e) => setBusiness({ ...business, vatRegistered: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0D9668]" />
                </label>
                <span className="text-xs font-semibold text-slate-700">
                  Registered for 15% Ethiopian VAT
                </span>
              </div>
            </div>
          </div>

          {/* Contact & Physical Address */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-6">
            <div className="pb-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Phone className="h-4 w-4 text-[#0D9668]" /> Contact Channels & Address
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Physical shop location and telephone contact printed on receipts
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Business Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    disabled={!canManage}
                    placeholder="+251 911 234567"
                    value={business.phone}
                    onChange={(e) => setBusiness({ ...business, phone: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 pl-9 pr-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0D9668] focus:border-[#0D9668] transition disabled:bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Contact / Notification Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    disabled={!canManage}
                    value={business.email}
                    onChange={(e) => setBusiness({ ...business, email: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 pl-9 pr-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0D9668] focus:border-[#0D9668] transition disabled:bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  City / Region
                </label>
                <input
                  type="text"
                  disabled={!canManage}
                  value={business.city}
                  onChange={(e) => setBusiness({ ...business, city: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0D9668] focus:border-[#0D9668] transition disabled:bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Subcity / Woreda
                </label>
                <input
                  type="text"
                  disabled={!canManage}
                  value={business.subcity}
                  onChange={(e) => setBusiness({ ...business, subcity: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0D9668] focus:border-[#0D9668] transition disabled:bg-slate-50"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Street Address & Landmark
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    disabled={!canManage}
                    placeholder="e.g. Bole Atlas, Next to Edna Mall"
                    value={business.address}
                    onChange={(e) => setBusiness({ ...business, address: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 pl-9 pr-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0D9668] focus:border-[#0D9668] transition disabled:bg-slate-50"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Regional Settings Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-6">
            <div className="pb-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Globe className="h-4 w-4 text-[#0D9668]" /> Regional & Localization Preferences
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Currency, timezone, and multilingual interface options
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Operating Currency
                </label>
                <select
                  disabled={!canManage}
                  value={business.currency}
                  onChange={(e) => setBusiness({ ...business, currency: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 bg-white font-mono"
                >
                  <option value="ETB">ETB — Ethiopian Birr (Default)</option>
                  <option value="USD">USD — US Dollar</option>
                  <option value="EUR">EUR — Euro</option>
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Existing financial ledgers remain stable when display currency is set.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Timezone
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <select
                    disabled={!canManage}
                    value={business.timezone}
                    onChange={(e) => setBusiness({ ...business, timezone: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 pl-9 pr-3.5 py-2.5 text-sm text-slate-900 bg-white"
                  >
                    <option value="Africa/Addis_Ababa">East Africa Time (UTC+3, Addis Ababa)</option>
                    <option value="UTC">UTC (Coordinated Universal Time)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Default Language
                </label>
                <select
                  disabled={!canManage}
                  value={business.locale}
                  onChange={(e) => setBusiness({ ...business, locale: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 bg-white"
                >
                  <option value="en">English (US/UK)</option>
                  <option value="am">አማርኛ (Amharic)</option>
                  <option value="om">Afaan Oromoo (Oromo)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: Store Operations & Inventory Thresholds ─── */}
      {activeTab === "store" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-6">
            <div className="pb-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Store className="h-4 w-4 text-[#0D9668]" /> Inventory & Reorder Configuration
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Low stock triggers, reorder rules, and staff permissions
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Default Reorder Threshold (Units)
                </label>
                <input
                  type="number"
                  min="1"
                  disabled={!canManage}
                  value={store.lowStockThresholdDefault}
                  onChange={(e) =>
                    setStore({
                      ...store,
                      lowStockThresholdDefault: Number(e.target.value) || 5,
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Products with quantity below this value are flagged as low stock on the dashboard.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Default Payment Method for POS
                </label>
                <select
                  disabled={!canManage}
                  value={store.defaultPaymentMethod}
                  onChange={(e) => setStore({ ...store, defaultPaymentMethod: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 bg-white"
                >
                  <option value="CASH">Cash Payment</option>
                  <option value="TELEBIRR">Telebirr (Mobile)</option>
                  <option value="CBE_BIRR">CBE Birr</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={!canManage}
                    checked={store.lowStockAlertEnabled}
                    onChange={(e) =>
                      setStore({ ...store, lowStockAlertEnabled: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0D9668]" />
                </label>
                <div>
                  <span className="text-xs font-semibold text-slate-800 block">
                    Automatic Low Stock Notifications
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Send in-app alerts when items reach critical threshold
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={!canManage}
                    checked={store.requireReasonForAdjustment}
                    onChange={(e) =>
                      setStore({ ...store, requireReasonForAdjustment: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0D9668]" />
                </label>
                <div>
                  <span className="text-xs font-semibold text-slate-800 block">
                    Mandatory Adjustment Reason
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Require staff to state reason for manual stock updates
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Receipt Customization Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-6">
            <div className="pb-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Printer className="h-4 w-4 text-[#0D9668]" /> Receipt Customization & Layout
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Branding messages printed at the bottom of thermal paper receipts
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Receipt Footer Message
                </label>
                <input
                  type="text"
                  disabled={!canManage}
                  value={store.receiptFooterMessage}
                  onChange={(e) => setStore({ ...store, receiptFooterMessage: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900"
                  placeholder="e.g. Thank you for shopping with us! No refunds after 3 days."
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={!canManage}
                    checked={store.autoReceiptPrint}
                    onChange={(e) => setStore({ ...store, autoReceiptPrint: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0D9668]" />
                </label>
                <div>
                  <span className="text-xs font-semibold text-slate-800 block">
                    Auto-prompt Print Dialog on Sale Completion
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Immediately launch browser print dialog when cashier confirms sale
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: Notifications ─── */}
      {activeTab === "notifications" && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-6">
          <div className="pb-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Bell className="h-4 w-4 text-[#0D9668]" /> Operational Notification Preferences
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure event notifications delivered via email or in-app bell panel
            </p>
          </div>

          <div className="space-y-4 divide-y divide-slate-100">
            {[
              {
                id: "lowStockAlerts",
                title: "Low Inventory Alerts",
                desc: "Notify when products fall below their configured reorder threshold",
                checked: notifications.lowStockAlerts,
              },
              {
                id: "dailySalesSummary",
                title: "Daily Sales & Revenue Digest",
                desc: "Receive daily gross sales, transaction volume, and cash breakdown",
                checked: notifications.dailySalesSummary,
              },
              {
                id: "newStaffJoined",
                title: "Team & Role Updates",
                desc: "Alert when a new cashier or manager accepts a store invitation",
                checked: notifications.newStaffJoined,
              },
              {
                id: "expenseRecorded",
                title: "Expense Notifications",
                desc: "Notify when operational expenses over 1,000 ETB are logged",
                checked: notifications.expenseRecorded,
              },
              {
                id: "emailNotifications",
                title: "Email Dispatch",
                desc: "Forward high-priority operational summaries to your business email",
                checked: notifications.emailNotifications,
              },
            ].map((item) => (
              <div key={item.id} className="pt-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold text-slate-900">{item.title}</p>
                  <p className="text-[11px] text-slate-400">{item.desc}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={!canManage}
                    checked={item.checked}
                    onChange={(e) =>
                      setNotifications({
                        ...notifications,
                        [item.id]: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0D9668]" />
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── TAB 4: Security, Change Password, and Danger Zone ─── */}
      {activeTab === "security" && (
        <div className="space-y-6">
          {/* Change Password Form */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-6">
            <div className="pb-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Lock className="h-4 w-4 text-[#0D9668]" /> Change Password
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Update your account password with standard cryptographic security
              </p>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
              {passwordStatus.success && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Password updated successfully!</span>
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

          {/* Session Management */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-4">
            <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Shield className="h-4 w-4 text-[#0D9668]" /> Session & Authentication
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Terminate your active login session or sign out of this device
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-red-50 hover:text-red-700 hover:border-red-200 text-xs font-bold text-slate-700 transition"
              >
                <LogOut className="h-3.5 w-3.5 text-slate-500" />
                <span>Log Out</span>
              </button>
            </div>
          </div>

          {/* Danger Zone: Business Deactivation */}
          <div className="bg-white rounded-2xl border border-red-200 shadow-2xs p-6 space-y-4">
            <div className="pb-4 border-b border-red-100">
              <h2 className="font-bold text-red-800 text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" /> Danger Zone
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Irreversible actions that require Owner authorization and data retention verification
              </p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-red-200 bg-red-50/40">
              <div>
                <p className="text-xs font-bold text-red-900">
                  Deactivate / Delete Business Account
                </p>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Suspends the business, revokes staff memberships, and archives financial records.
                  Requires verified store name confirmation.
                </p>
              </div>

              {userRole === "OWNER" ? (
                <button
                  onClick={() => setDeleteModalOpen(true)}
                  className="shrink-0 text-xs font-bold text-red-700 border border-red-300 px-4 py-2 rounded-xl hover:bg-red-100 transition shadow-2xs"
                >
                  Deactivate Business
                </button>
              ) : (
                <span className="shrink-0 text-[11px] font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                  Owner Role Required
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Destructive Business Deletion Safeguard */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                <h3 className="font-bold text-slate-900 text-base">Deactivate Business</h3>
              </div>
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-2">
              <p>
                You are about to deactivate <strong>{business.businessName}</strong>.
              </p>
              <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-red-800 space-y-1">
                <p className="font-bold">What happens next:</p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                  <li>All store staff will immediately lose access.</li>
                  <li>Point-of-sale checkout will be suspended.</li>
                  <li>Historical tax ledgers are archived for mandatory legal retention.</li>
                </ul>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Type <strong>{business.businessName}</strong> to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder={business.businessName}
                  className="w-full text-xs font-mono font-bold rounded-xl border border-slate-300 p-2.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for deactivation (Optional):
                </label>
                <input
                  type="text"
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="e.g. Closing branch, moving to new entity"
                  className="w-full text-xs rounded-xl border border-slate-300 p-2 text-slate-900"
                />
              </div>

              {deleteError && (
                <p className="text-xs text-red-600 font-semibold">{deleteError}</p>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleteLoading}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteBusiness}
                disabled={
                  deleteLoading ||
                  deleteConfirmText.trim().toLowerCase() !== business.businessName.trim().toLowerCase()
                }
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white shadow-xs transition disabled:opacity-40"
              >
                {deleteLoading ? "Deactivating..." : "Confirm Deactivation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
