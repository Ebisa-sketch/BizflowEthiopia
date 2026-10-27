"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  Lock,
  Mail,
  User,
  Phone,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  BarChart3,
  Package,
  ShoppingCart,
  TrendingUp,
  Check,
  X,
  Sparkles,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-context";
import { LanguageSwitcher } from "@/components/layout/language-switcher";

/* ─────────────────────── Brand / Left Panel ─────────────────────── */

function RegisterBrandPanel() {
  const { t } = useLanguage();

  return (
    <div
      className="hidden lg:flex lg:w-[48%] xl:w-[50%] relative overflow-hidden flex-col justify-between self-stretch"
      style={{
        background: "linear-gradient(145deg, #101827 0%, #0f172a 50%, #0c1425 100%)",
      }}
    >
      {/* Subtle ambient lighting */}
      <div
        className="absolute -top-36 -left-36 w-[480px] h-[480px] rounded-full opacity-[0.06] pointer-events-none"
        style={{ background: "radial-gradient(circle, #0D9668 0%, transparent 70%)" }}
      />
      <div
        className="absolute -bottom-32 -right-32 w-[420px] h-[420px] rounded-full opacity-[0.04] pointer-events-none"
        style={{ background: "radial-gradient(circle, #3b82f6 0%, transparent 70%)" }}
      />

      <div className="relative z-10 flex flex-col h-full px-8 sm:px-12 xl:px-16 py-8 xl:py-12 justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center shadow-md shadow-emerald-900/30 shrink-0"
            style={{ background: "linear-gradient(135deg, #0D9668, #059669)" }}
          >
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-white tracking-tight">
            BizFlow<span className="text-emerald-400 ml-0.5">Ethiopia</span>
          </span>
        </div>

        {/* Headline & Value Proposition */}
        <div className="my-auto py-6 xl:py-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Retail & Wholesale Operating System</span>
          </div>

          <h1 className="text-2xl sm:text-3xl xl:text-4xl font-extrabold text-white leading-tight tracking-tight">
            {t("auth.brandHeadline", "Start managing your business with confidence.")}
          </h1>
          <p className="mt-3 text-xs sm:text-sm text-slate-400 leading-relaxed max-w-md">
            {t("auth.brandSubtitle", "Bring your products, inventory, sales, and business operations together in one workspace.")}
          </p>

          {/* Dashboard Preview Card — Illustrative Demo Data */}
          <div className="mt-6 rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md p-4 sm:p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-semibold text-slate-300 tracking-wide">
                  {t("auth.previewTitle", "Store Workspace Preview")}
                </span>
              </div>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 font-medium border border-slate-700/60">
                {t("auth.previewBadge", "Illustrative demo data")}
              </span>
            </div>

            {/* Live KPI Metric Cards */}
            <div className="grid grid-cols-3 gap-2 sm:gap-2.5 mb-3.5">
              {[
                { label: t("dash.todaySales", "Daily Sales"), val: "ETB 24,500", icon: ShoppingCart, color: "#0D9668" },
                { label: t("dash.products", "Products"), val: "185 items", icon: Package, color: "#3b82f6" },
                { label: t("dash.growth", "Growth"), val: "+14.2%", icon: TrendingUp, color: "#10b981" },
              ].map((kpi) => (
                <div
                  key={kpi.label}
                  className="rounded-lg bg-white/[0.04] border border-white/[0.06] p-2.5"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <kpi.icon className="h-3 w-3 shrink-0" style={{ color: kpi.color }} />
                    <span className="text-[10px] text-slate-400 font-medium truncate">{kpi.label}</span>
                  </div>
                  <span className="text-xs font-bold text-white tracking-tight">{kpi.val}</span>
                </div>
              ))}
            </div>

            {/* Sales Momentum Graph Visualizer */}
            <div className="flex items-end gap-1.5 h-10 pt-1">
              {[35, 50, 45, 75, 60, 85, 65, 90, 70, 80, 95, 88].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm"
                  style={{
                    height: `${h}%`,
                    background:
                      i >= 8
                        ? "linear-gradient(to top, #0D9668, #10b981)"
                        : "rgba(255,255,255,0.08)",
                  }}
                />
              ))}
            </div>

            <p className="text-[10px] text-slate-500 mt-2 text-right">
              Sample retail figures · Live metrics available upon registration
            </p>
          </div>
        </div>

        {/* 3 Core Benefits */}
        <div className="grid grid-cols-1 gap-2.5 pt-4 border-t border-white/[0.06]">
          {[
            {
              icon: Sparkles,
              title: t("auth.benefit1Title", "Simple setup"),
              desc: t("auth.benefit1Desc", "Get your store running in minutes without complicated hardware."),
            },
            {
              icon: Package,
              title: t("auth.benefit2Title", "Organized operations"),
              desc: t("auth.benefit2Desc", "Coordinate stock, track receipts, and manage sales in one place."),
            },
            {
              icon: BarChart3,
              title: t("auth.benefit3Title", "Visibility into business performance"),
              desc: t("auth.benefit3Desc", "See daily profit, fast-selling goods, and cash flows in real time."),
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3">
              <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg flex items-center justify-center bg-emerald-500/10 border border-emerald-500/15 shrink-0 mt-0.5">
                <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-200">{title}</p>
                <p className="text-[11px] text-slate-400 leading-snug">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────── Password Helpers ─────────────────────── */

// Server-configured policy: min 8 chars, at least 1 number, at least 1 letter
interface PasswordRequirements {
  minLength: boolean;
  hasNumber: boolean;
  hasLetter: boolean;
}

function checkRequirements(pwd: string): PasswordRequirements {
  return {
    minLength: pwd.length >= 8,
    hasNumber: /[0-9]/.test(pwd),
    hasLetter: /[a-zA-Z]/.test(pwd),
  };
}

function calculateStrength(reqs: PasswordRequirements, pwd: string): {
  score: number;
  labelKey: string;
  fallback: string;
  color: string;
} {
  if (!pwd) return { score: 0, labelKey: "auth.weak", fallback: "Not entered", color: "#E2E8F0" };

  let score = 0;
  if (reqs.minLength) score += 1;
  if (reqs.hasNumber) score += 1;
  if (reqs.hasLetter) score += 1;
  if (/[^A-Za-z0-9]/.test(pwd) || pwd.length >= 12) score += 1;

  if (score <= 1) return { score: 1, labelKey: "auth.weak", fallback: "Weak", color: "#ef4444" };
  if (score === 2) return { score: 2, labelKey: "auth.fair", fallback: "Fair", color: "#f59e0b" };
  if (score === 3) return { score: 3, labelKey: "auth.good", fallback: "Good", color: "#3b82f6" };
  return { score: 4, labelKey: "auth.strong", fallback: "Strong", color: "#0D9668" };
}

/* ─────────────────────── Registration Form (Right Panel) ─────────────────────── */

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useLanguage();

  // Form State
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    termsAccepted: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState("");
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const isSubmitting = useRef(false);

  // Ensure the page starts at the correct scroll position when opened
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, []);

  // Dynamic Password Evaluation matching server policy
  const requirements = checkRequirements(formData.password);
  const strength = calculateStrength(requirements, formData.password);

  // Field change handler
  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    if (generalError) setGeneralError("");
  };

  // Client-side Validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    const cleanFirst = formData.firstName.trim();
    if (!cleanFirst) {
      errors.firstName = "First name is required";
    } else if (cleanFirst.length < 2) {
      errors.firstName = "First name must be at least 2 characters";
    } else if (cleanFirst.length > 50) {
      errors.firstName = "First name cannot exceed 50 characters";
    } else if (/[\x00-\x1F\x7F]/.test(cleanFirst)) {
      errors.firstName = "First name contains invalid characters";
    }

    const cleanLast = formData.lastName.trim();
    if (!cleanLast) {
      errors.lastName = "Last name is required";
    } else if (cleanLast.length < 2) {
      errors.lastName = "Last name must be at least 2 characters";
    } else if (cleanLast.length > 50) {
      errors.lastName = "Last name cannot exceed 50 characters";
    } else if (/[\x00-\x1F\x7F]/.test(cleanLast)) {
      errors.lastName = "Last name contains invalid characters";
    }

    const cleanEmail = formData.email.trim();
    if (!cleanEmail) {
      errors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      errors.email = "Please enter a valid email address";
    }

    // Phone is optional, but if provided validate Ethiopian formats
    if (formData.phone.trim()) {
      const cleaned = formData.phone.replace(/[\s\-\(\)]/g, "");
      const ethRegex = /^(?:\+251|251|0)?([79]\d{8})$/;
      if (!ethRegex.test(cleaned)) {
        errors.phone = "Enter a valid Ethiopian phone number (e.g. 0911234567 or +251 911 234 567)";
      }
    }

    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters long";
    } else if (!requirements.hasLetter || !requirements.hasNumber) {
      errors.password = "Password must contain both letters and numbers";
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    if (!formData.termsAccepted) {
      errors.termsAccepted = "You must agree to the Terms of Service and Privacy Policy";
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      if (errors.termsAccepted && Object.keys(errors).length === 1) {
        setGeneralError("Please agree to the Terms of Service and Privacy Policy to continue.");
      } else {
        setGeneralError("Please fix the highlighted fields below to create your account.");
      }
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent duplicate submissions
    if (isSubmitting.current || loading) return;

    if (!validateForm()) return;

    isSubmitting.current = true;
    setLoading(true);
    setGeneralError("");

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim() || undefined,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          termsAccepted: formData.termsAccepted,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setGeneralError(data.error || "Failed to create account. Please check your information.");
        setLoading(false);
        isSubmitting.current = false;
        return;
      }

      // Success - immediate transition to workspace dashboard
      setSuccess(true);
      window.location.href = "/dashboard";
    } catch {
      setGeneralError("Unable to reach the server. Please check your connection and try again.");
      setLoading(false);
      isSubmitting.current = false;
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row overflow-x-hidden" style={{ background: "#F7F9FC" }}>
      {/* Left Brand Panel — stretches alongside form on desktop, hidden on mobile/tablet */}
      <RegisterBrandPanel />

      {/* Right Form Panel — Natural document flow, no inner scrollbar container */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-8 md:px-12 lg:px-10 xl:px-16 py-8 sm:py-12">
        <div className="w-full max-w-[440px] sm:max-w-[460px] mx-auto">
          {/* Top Bar with Mobile Brand Header and Language Switcher */}
          <div className="flex items-center justify-between mb-6">
            <div className="lg:hidden flex items-center gap-2">
              <div
                className="h-8 w-8 rounded-xl flex items-center justify-center text-white"
                style={{ background: "linear-gradient(135deg, #0D9668, #059669)" }}
              >
                <Building2 className="h-4.5 w-4.5" />
              </div>
              <span className="text-sm font-bold tracking-tight" style={{ color: "#101827" }}>
                BizFlow<span style={{ color: "#0D9668" }}>Ethiopia</span>
              </span>
            </div>
            <div className="ml-auto">
              <LanguageSwitcher />
            </div>
          </div>

          {/* Form Heading & Description */}
          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: "#101827" }}>
              {t("auth.createYourAccount", "Create your account")}
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm" style={{ color: "#64748B" }}>
              {t("auth.registerSubtitle", "Get started with a simpler way to manage your business.")}
            </p>
          </div>

          {/* Success Notification */}
          {success && (
            <div
              className="mb-5 p-4 rounded-xl text-sm flex items-start gap-3 animate-fade-in"
              style={{
                background: "rgba(13, 150, 104, 0.08)",
                border: "1px solid rgba(13, 150, 104, 0.25)",
                color: "#065f46",
              }}
            >
              <Check className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-800">
                  {t("auth.accountCreated", "Account successfully created!")}
                </p>
                <p className="text-xs text-emerald-700 mt-0.5">
                  {t("auth.preparingWorkspace", "Preparing your store workspace. Redirecting you to the dashboard…")}
                </p>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {generalError && (
            <div
              className="mb-5 p-3.5 rounded-xl text-sm flex items-start gap-2.5"
              style={{
                background: "rgba(239, 68, 68, 0.06)",
                border: "1px solid rgba(239, 68, 68, 0.15)",
                color: "#dc2626",
              }}
              role="alert"
            >
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{generalError}</span>
            </div>
          )}

          {/* Registration Form in Exact Specified Hierarchy */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* 1. Name Fields: First name and last name (stacked on small mobile, side-by-side on sm:) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label
                  htmlFor="reg-first-name"
                  className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                  style={{ color: "#334155" }}
                >
                  {t("auth.firstName", "First Name")} <span className="text-emerald-600">*</span>
                </label>
                <div className="relative">
                  <User
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
                    style={{ color: "#94a3b8" }}
                  />
                  <input
                    id="reg-first-name"
                    type="text"
                    autoComplete="given-name"
                    required
                    maxLength={50}
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    placeholder="e.g. Almaz"
                    aria-invalid={!!fieldErrors.firstName}
                    aria-describedby={fieldErrors.firstName ? "first-name-error" : undefined}
                    className="block w-full min-h-[44px] pl-10 pr-3.5 py-2.5 rounded-xl text-sm transition-all duration-150 outline-none"
                    style={{
                      background: "#FFFFFF",
                      border: fieldErrors.firstName
                        ? "1.5px solid #ef4444"
                        : "1.5px solid #E2E8F0",
                      color: "#101827",
                    }}
                    onFocus={(e) => {
                      if (!fieldErrors.firstName) e.currentTarget.style.border = "1.5px solid #0D9668";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(13, 150, 104, 0.08)";
                    }}
                    onBlur={(e) => {
                      if (!fieldErrors.firstName) e.currentTarget.style.border = "1.5px solid #E2E8F0";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                </div>
                {fieldErrors.firstName && (
                  <p id="first-name-error" className="mt-1 text-xs text-rose-500">
                    {fieldErrors.firstName}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="reg-last-name"
                  className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                  style={{ color: "#334155" }}
                >
                  {t("auth.lastName", "Last Name")} <span className="text-emerald-600">*</span>
                </label>
                <div className="relative">
                  <User
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
                    style={{ color: "#94a3b8" }}
                  />
                  <input
                    id="reg-last-name"
                    type="text"
                    autoComplete="family-name"
                    required
                    maxLength={50}
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    placeholder="e.g. Tadesse"
                    aria-invalid={!!fieldErrors.lastName}
                    aria-describedby={fieldErrors.lastName ? "last-name-error" : undefined}
                    className="block w-full min-h-[44px] pl-10 pr-3.5 py-2.5 rounded-xl text-sm transition-all duration-150 outline-none"
                    style={{
                      background: "#FFFFFF",
                      border: fieldErrors.lastName
                        ? "1.5px solid #ef4444"
                        : "1.5px solid #E2E8F0",
                      color: "#101827",
                    }}
                    onFocus={(e) => {
                      if (!fieldErrors.lastName) e.currentTarget.style.border = "1.5px solid #0D9668";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(13, 150, 104, 0.08)";
                    }}
                    onBlur={(e) => {
                      if (!fieldErrors.lastName) e.currentTarget.style.border = "1.5px solid #E2E8F0";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                </div>
                {fieldErrors.lastName && (
                  <p id="last-name-error" className="mt-1 text-xs text-rose-500">
                    {fieldErrors.lastName}
                  </p>
                )}
              </div>
            </div>

            {/* 2. Email Address */}
            <div>
              <label
                htmlFor="reg-email"
                className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                style={{ color: "#334155" }}
              >
                {t("auth.email", "Email Address")} <span className="text-emerald-600">*</span>
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
                  style={{ color: "#94a3b8" }}
                />
                <input
                  id="reg-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="almaz@yourbusiness.et"
                  aria-invalid={!!fieldErrors.email}
                  aria-describedby={fieldErrors.email ? "email-error" : undefined}
                  className="block w-full min-h-[44px] pl-10 pr-3.5 py-2.5 rounded-xl text-sm transition-all duration-150 outline-none"
                  style={{
                    background: "#FFFFFF",
                    border: fieldErrors.email
                      ? "1.5px solid #ef4444"
                      : "1.5px solid #E2E8F0",
                    color: "#101827",
                  }}
                  onFocus={(e) => {
                    if (!fieldErrors.email) e.currentTarget.style.border = "1.5px solid #0D9668";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(13, 150, 104, 0.08)";
                  }}
                  onBlur={(e) => {
                    if (!fieldErrors.email) e.currentTarget.style.border = "1.5px solid #E2E8F0";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>
              {fieldErrors.email && (
                <p id="email-error" className="mt-1 text-xs text-rose-500">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* 3. Optional Phone Number */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="reg-phone"
                  className="block text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "#334155" }}
                >
                  {t("auth.phone", "Phone Number")}
                </label>
                <span className="text-[11px] text-slate-400 font-medium">
                  {t("auth.optional", "Optional")}
                </span>
              </div>
              <div className="relative">
                <Phone
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
                  style={{ color: "#94a3b8" }}
                />
                <input
                  id="reg-phone"
                  type="tel"
                  autoComplete="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="+251 911 234 567 or 0911234567"
                  aria-invalid={!!fieldErrors.phone}
                  aria-describedby={fieldErrors.phone ? "phone-error" : undefined}
                  className="block w-full min-h-[44px] pl-10 pr-3.5 py-2.5 rounded-xl text-sm transition-all duration-150 outline-none"
                  style={{
                    background: "#FFFFFF",
                    border: fieldErrors.phone
                      ? "1.5px solid #ef4444"
                      : "1.5px solid #E2E8F0",
                    color: "#101827",
                  }}
                  onFocus={(e) => {
                    if (!fieldErrors.phone) e.currentTarget.style.border = "1.5px solid #0D9668";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(13, 150, 104, 0.08)";
                  }}
                  onBlur={(e) => {
                    if (!fieldErrors.phone) e.currentTarget.style.border = "1.5px solid #E2E8F0";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>
              {fieldErrors.phone ? (
                <p id="phone-error" className="mt-1 text-xs text-rose-500">
                  {fieldErrors.phone}
                </p>
              ) : (
                <p className="mt-1 text-[11px] text-slate-400">
                  {t("auth.ethiopianPhoneHint", "Ethio Telecom (09...) or Safaricom (07...) supported")}
                </p>
              )}
            </div>

            {/* 4. Password */}
            <div>
              <label
                htmlFor="reg-password"
                className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                style={{ color: "#334155" }}
              >
                {t("auth.password", "Password")} <span className="text-emerald-600">*</span>
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
                  style={{ color: "#94a3b8" }}
                />
                <input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  placeholder="Create a secure password"
                  aria-invalid={!!fieldErrors.password}
                  aria-describedby={fieldErrors.password ? "password-error" : undefined}
                  className="block w-full min-h-[44px] pl-10 pr-11 py-2.5 rounded-xl text-sm transition-all duration-150 outline-none"
                  style={{
                    background: "#FFFFFF",
                    border: fieldErrors.password
                      ? "1.5px solid #ef4444"
                      : "1.5px solid #E2E8F0",
                    color: "#101827",
                  }}
                  onFocus={(e) => {
                    if (!fieldErrors.password) e.currentTarget.style.border = "1.5px solid #0D9668";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(13, 150, 104, 0.08)";
                  }}
                  onBlur={(e) => {
                    if (!fieldErrors.password) e.currentTarget.style.border = "1.5px solid #E2E8F0";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-controls="reg-password"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" style={{ color: "#64748B" }} aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" style={{ color: "#94a3b8" }} aria-hidden="true" />
                  )}
                </button>
              </div>

              {/* Password Strength Meter */}
              {formData.password.length > 0 && (
                <div
                  className="mt-2"
                  role="meter"
                  aria-valuenow={strength.score}
                  aria-valuemin={0}
                  aria-valuemax={4}
                  aria-label={t("auth.strength", "Password strength")}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-slate-500 font-medium">
                      {t("auth.strength", "Strength")}:
                    </span>
                    <span
                      className="text-[11px] font-bold"
                      style={{ color: strength.color }}
                    >
                      {t(strength.labelKey, strength.fallback)}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden flex gap-1">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className="flex-1 h-full rounded-full transition-all duration-300"
                        style={{
                          background:
                            strength.score >= step ? strength.color : "#E2E8F0",
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Password Requirements Checklist (matching server policy: 8+ chars, number, letter) */}
              <div className="mt-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200/80" aria-live="polite">
                <p className="text-[11px] font-semibold text-slate-600 mb-1">
                  {t("auth.passwordRequirements", "Password requirements:")}
                </p>
                <div className="grid grid-cols-3 gap-1 text-[11px]">
                  <span
                    className={`flex items-center gap-1.5 ${
                      requirements.minLength ? "text-emerald-700 font-medium" : "text-slate-500"
                    }`}
                  >
                    {requirements.minLength ? (
                      <Check className="h-3 w-3 text-emerald-600 shrink-0" />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-300 ml-1 shrink-0" />
                    )}
                    {t("auth.characters8", "8+ characters")}
                  </span>
                  <span
                    className={`flex items-center gap-1.5 ${
                      requirements.hasNumber ? "text-emerald-700 font-medium" : "text-slate-500"
                    }`}
                  >
                    {requirements.hasNumber ? (
                      <Check className="h-3 w-3 text-emerald-600 shrink-0" />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-300 ml-1 shrink-0" />
                    )}
                    {t("auth.number1", "1+ number")}
                  </span>
                  <span
                    className={`flex items-center gap-1.5 ${
                      requirements.hasLetter ? "text-emerald-700 font-medium" : "text-slate-500"
                    }`}
                  >
                    {requirements.hasLetter ? (
                      <Check className="h-3 w-3 text-emerald-600 shrink-0" />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-300 ml-1 shrink-0" />
                    )}
                    {t("auth.letters", "Letters (a-z, A-Z)")}
                  </span>
                </div>
              </div>

              {fieldErrors.password && (
                <p id="password-error" className="mt-1 text-xs text-rose-500">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {/* 5. Password Confirmation */}
            <div>
              <label
                htmlFor="reg-confirm-password"
                className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                style={{ color: "#334155" }}
              >
                {t("auth.confirmPassword", "Confirm Password")} <span className="text-emerald-600">*</span>
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
                  style={{ color: "#94a3b8" }}
                />
                <input
                  id="reg-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  placeholder="Repeat your password"
                  aria-invalid={!!fieldErrors.confirmPassword}
                  aria-describedby={fieldErrors.confirmPassword ? "confirm-password-error" : undefined}
                  className="block w-full min-h-[44px] pl-10 pr-11 py-2.5 rounded-xl text-sm transition-all duration-150 outline-none"
                  style={{
                    background: "#FFFFFF",
                    border: fieldErrors.confirmPassword
                      ? "1.5px solid #ef4444"
                      : "1.5px solid #E2E8F0",
                    color: "#101827",
                  }}
                  onFocus={(e) => {
                    if (!fieldErrors.confirmPassword) e.currentTarget.style.border = "1.5px solid #0D9668";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(13, 150, 104, 0.08)";
                  }}
                  onBlur={(e) => {
                    if (!fieldErrors.confirmPassword) e.currentTarget.style.border = "1.5px solid #E2E8F0";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  aria-controls="reg-confirm-password"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" style={{ color: "#64748B" }} aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" style={{ color: "#94a3b8" }} aria-hidden="true" />
                  )}
                </button>
              </div>

              {/* Non-intrusive live feedback */}
              {formData.confirmPassword.length > 0 && (
                <div className="mt-1 flex items-center gap-1.5 text-[11px]">
                  {formData.password === formData.confirmPassword ? (
                    <span className="text-emerald-700 flex items-center gap-1 font-medium">
                      <Check className="h-3 w-3 text-emerald-600" aria-hidden="true" /> {t("auth.passwordsMatch", "Passwords match")}
                    </span>
                  ) : (
                    <span className="text-amber-600 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden="true" /> {t("auth.passwordsDontMatch", "Passwords do not match yet")}
                    </span>
                  )}
                </div>
              )}

              {fieldErrors.confirmPassword && (
                <p id="confirm-password-error" className="mt-1 text-xs text-rose-500" role="alert">
                  {fieldErrors.confirmPassword}
                </p>
              )}
            </div>

            {/* 6. Terms and Privacy Acceptance */}
            <div className="pt-1">
              <label htmlFor="reg-terms-checkbox" className="flex items-start gap-2.5 text-xs select-none cursor-pointer">
                <input
                  id="reg-terms-checkbox"
                  type="checkbox"
                  checked={formData.termsAccepted}
                  onChange={(e) => handleInputChange("termsAccepted", e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-emerald-600 cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500"
                  aria-invalid={!!fieldErrors.termsAccepted}
                  aria-describedby={fieldErrors.termsAccepted ? "terms-error" : undefined}
                />
                <span className="text-slate-600 leading-normal">
                  {t("auth.termsAgreement", "I agree to the")}{" "}
                  <Link
                    href="/terms"
                    target="_blank"
                    className="font-semibold text-emerald-700 hover:underline outline-none focus-visible:underline"
                  >
                    {t("auth.termsOfService", "Terms of Service")}
                  </Link>{" "}
                  {t("auth.and", "and")}{" "}
                  <Link
                    href="/privacy"
                    target="_blank"
                    className="font-semibold text-emerald-700 hover:underline outline-none focus-visible:underline"
                  >
                    {t("auth.privacyPolicy", "Privacy Policy")}
                  </Link>
                  .
                </span>
              </label>
              {fieldErrors.termsAccepted && (
                <p id="terms-error" className="mt-1 text-xs text-rose-500" role="alert">
                  {fieldErrors.termsAccepted}
                </p>
              )}
            </div>

            {/* Error Banner directly above the action button for high visibility */}
            {generalError && (
              <div
                className="p-3.5 rounded-xl text-sm flex items-start gap-2.5"
                style={{
                  background: "rgba(239, 68, 68, 0.08)",
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                  color: "#dc2626",
                }}
                role="alert"
              >
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
                <span className="text-xs sm:text-sm font-medium">{generalError}</span>
              </div>
            )}

            {/* 7. Primary Create Account Button */}
            <button
              type="submit"
              id="register-submit-button"
              disabled={loading || success}
              className="w-full mt-2 flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-500 disabled:opacity-60 cursor-pointer min-h-[44px] active:scale-[0.99]"
              style={{
                background: loading
                  ? "#0D9668"
                  : "linear-gradient(135deg, #0D9668 0%, #059669 100%)",
                boxShadow: loading
                  ? "none"
                  : "0 4px 14px rgba(13, 150, 104, 0.25)",
              }}
              onMouseOver={(e) => {
                if (!loading && !success) e.currentTarget.style.boxShadow = "0 6px 20px rgba(13, 150, 104, 0.35)";
              }}
              onMouseOut={(e) => {
                if (!loading && !success) e.currentTarget.style.boxShadow = "0 4px 14px rgba(13, 150, 104, 0.25)";
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>{t("auth.creatingAccount", "Creating account...")}</span>
                </>
              ) : success ? (
                <>
                  <Check className="h-4 w-4" aria-hidden="true" />
                  <span>{t("auth.accountCreated", "Account Created!")}</span>
                </>
              ) : (
                <>
                  <span>{t("auth.createAccount", "Create Account")}</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          {/* 8. Existing-user Sign In link */}
          <p className="mt-7 text-center text-sm" style={{ color: "#64748B" }}>
            {t("auth.alreadyHaveAccount", "Already have an account?")}{" "}
            <Link
              href="/login"
              className="font-semibold outline-none focus-visible:underline hover:underline transition-colors"
              style={{ color: "#0D9668" }}
            >
              {t("auth.signIn", "Sign in")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
