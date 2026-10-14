"use client";

import React, { useState, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Building2,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  BarChart3,
  Package,
  Users,
  TrendingUp,
  ShoppingCart,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n/language-context";
import { LanguageSwitcher } from "@/components/layout/language-switcher";

/* ─────────────────────── Brand / Left Panel ─────────────────────── */

function BrandPanel() {
  const { t } = useLanguage();

  return (
    <div
      className="hidden lg:flex lg:w-[48%] xl:w-[50%] relative overflow-hidden flex-col justify-between min-h-screen h-full overflow-y-auto"
      style={{ background: "linear-gradient(145deg, #101827 0%, #0f172a 50%, #0c1425 100%)" }}
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

      {/* Content wrapper with responsive padding */}
      <div className="relative z-10 flex flex-col h-full justify-between px-8 sm:px-12 xl:px-16 py-8 xl:py-12">
        {/* Top: Logo & Wordmark */}
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

        {/* Middle: Headline + Illustrative Dashboard Preview */}
        <div className="my-auto py-6 xl:py-8">
          <div>
            <h1 className="text-2xl sm:text-3xl xl:text-4xl font-extrabold text-white leading-tight tracking-tight">
              {t("auth.brandHeadline", "Start managing your business with confidence.")}
            </h1>
            <p className="mt-3 text-xs sm:text-sm text-slate-400 leading-relaxed max-w-md">
              {t("auth.brandSubtitle", "Bring your products, inventory, sales, and business operations together in one workspace.")}
            </p>
          </div>

          {/* Polished Illustrative Dashboard Preview Card */}
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

            {/* Mini KPI Row */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-3.5">
              {[
                { label: "Today's Sales", value: "ETB 18,450", icon: ShoppingCart, color: "#0D9668" },
                { label: "Products", value: "148 items", icon: Package, color: "#3b82f6" },
                { label: "Growth", value: "+12.4%", icon: TrendingUp, color: "#10b981" },
              ].map((kpi) => (
                <div
                  key={kpi.label}
                  className="rounded-lg bg-white/[0.04] border border-white/[0.06] p-2.5"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <kpi.icon className="h-3 w-3 shrink-0" style={{ color: kpi.color }} />
                    <span className="text-[10px] text-slate-400 font-medium truncate">{kpi.label}</span>
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-white tracking-tight">{kpi.value}</span>
                </div>
              ))}
            </div>

            {/* Mini Activity Chart Bars */}
            <div className="flex items-end gap-1.5 h-10">
              {[40, 65, 45, 80, 55, 90, 70, 85, 60, 75, 95, 80].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm"
                  style={{
                    height: `${h}%`,
                    background:
                      i >= 9
                        ? "linear-gradient(to top, #0D9668, #10b981)"
                        : "rgba(255,255,255,0.08)",
                  }}
                />
              ))}
            </div>

            <p className="text-[10px] text-slate-500 mt-2 text-right">
              Sample retail metrics · Live data loads upon sign in
            </p>
          </div>
        </div>

        {/* Bottom: 3 Core Benefits */}
        <div className="grid grid-cols-1 gap-2.5 pt-4 border-t border-white/[0.06]">
          {[
            { icon: BarChart3, text: "Track sales and inventory in real time" },
            { icon: TrendingUp, text: "Understand business performance with reports" },
            { icon: Users, text: "Manage your team securely with role-based access" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg flex items-center justify-center bg-emerald-500/10 border border-emerald-500/15 shrink-0">
                <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-400" />
              </div>
              <span className="text-xs text-slate-300 leading-snug">{text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────── Login Form (Right Panel) ─────────────────────── */

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawCallback = searchParams.get("callbackUrl");
  const { t } = useLanguage();

  // Validate callback URL — only allow relative paths
  const callbackUrl =
    rawCallback && rawCallback.startsWith("/") && !rawCallback.startsWith("//")
      ? rawCallback
      : "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const isSubmitting = useRef(false);

  const validateFields = (): boolean => {
    const errors: { email?: string; password?: string } = {};
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      errors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = "Please enter a valid email address";
    }

    if (!password) {
      errors.password = "Password is required";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent duplicate submissions
    if (isSubmitting.current || loading) return;

    if (!validateFields()) return;

    isSubmitting.current = true;
    setLoading(true);
    setErrorMessage("");
    setFieldErrors({});

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          rememberMe,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setErrorMessage(
          data.error || "Invalid email or password. Please try again."
        );
        setLoading(false);
        isSubmitting.current = false;
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch {
      setErrorMessage(
        "Unable to reach the server. Please check your connection and try again."
      );
      setLoading(false);
      isSubmitting.current = false;
    }
  };

  return (
    <div
      className="flex-1 flex flex-col justify-center px-4 sm:px-8 md:px-12 lg:px-10 xl:px-16 py-8 sm:py-10 min-h-screen overflow-y-auto"
      style={{ background: "#F7F9FC" }}
    >
      <div className="w-full max-w-[400px] sm:max-w-[420px] mx-auto">
        {/* Top bar with mobile logo & language switcher */}
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

        {/* Heading */}
        <div className="mb-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: "#101827" }}>
            {t("auth.welcomeBack", "Welcome back")}
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm" style={{ color: "#64748B" }}>
            {t("auth.signInSubtitle", "Sign in to continue to your BizFlow workspace.")}
          </p>
        </div>

        {/* Error Banner */}
        {errorMessage && (
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
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Email */}
          <div>
            <label
              htmlFor="login-email"
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
                id="login-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined }));
                }}
                placeholder="name@yourstore.et"
                aria-invalid={!!fieldErrors.email}
                aria-describedby={fieldErrors.email ? "email-error" : undefined}
                className="block w-full pl-10 pr-3.5 py-2.5 rounded-xl text-sm transition-all duration-150 outline-none"
                style={{
                  background: "#FFFFFF",
                  border: fieldErrors.email
                    ? "1.5px solid #ef4444"
                    : "1.5px solid #E2E8F0",
                  color: "#101827",
                }}
                onFocus={(e) => {
                  if (!fieldErrors.email)
                    e.currentTarget.style.border = "1.5px solid #0D9668";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(13, 150, 104, 0.08)";
                }}
                onBlur={(e) => {
                  if (!fieldErrors.email)
                    e.currentTarget.style.border = "1.5px solid #E2E8F0";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>
            {fieldErrors.email && (
              <p id="email-error" className="mt-1.5 text-xs text-rose-500">
                {fieldErrors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="login-password"
                className="block text-xs font-semibold uppercase tracking-wider"
                style={{ color: "#334155" }}
              >
                {t("auth.password", "Password")} <span className="text-emerald-600">*</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium outline-none focus-visible:underline hover:underline transition-colors"
                style={{ color: "#0D9668" }}
              >
                {t("auth.forgotPassword", "Forgot password?")}
              </Link>
            </div>
            <div className="relative">
              <Lock
                className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
                style={{ color: "#94a3b8" }}
              />
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined }));
                }}
                placeholder="Enter your password"
                aria-invalid={!!fieldErrors.password}
                aria-describedby={fieldErrors.password ? "password-error" : undefined}
                className="block w-full pl-10 pr-11 py-2.5 rounded-xl text-sm transition-all duration-150 outline-none"
                style={{
                  background: "#FFFFFF",
                  border: fieldErrors.password
                    ? "1.5px solid #ef4444"
                    : "1.5px solid #E2E8F0",
                  color: "#101827",
                }}
                onFocus={(e) => {
                  if (!fieldErrors.password)
                    e.currentTarget.style.border = "1.5px solid #0D9668";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(13, 150, 104, 0.08)";
                }}
                onBlur={(e) => {
                  if (!fieldErrors.password)
                    e.currentTarget.style.border = "1.5px solid #E2E8F0";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={0}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" style={{ color: "#64748B" }} />
                ) : (
                  <Eye className="h-4 w-4" style={{ color: "#94a3b8" }} />
                )}
              </button>
            </div>
            {fieldErrors.password && (
              <p id="password-error" className="mt-1.5 text-xs text-rose-500">
                {fieldErrors.password}
              </p>
            )}
          </div>

          {/* Remember Me Checkbox */}
          <div className="flex items-center pt-0.5">
            <label
              htmlFor="remember-me"
              className="flex items-center gap-2 text-xs cursor-pointer select-none"
              style={{ color: "#64748B" }}
            >
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-slate-300 accent-emerald-600 cursor-pointer"
              />
              {t("auth.rememberMe", "Remember me on this device (30 days)")}
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-500 disabled:opacity-60 cursor-pointer min-h-[44px]"
            style={{
              background: loading
                ? "#0D9668"
                : "linear-gradient(135deg, #0D9668 0%, #059669 100%)",
              boxShadow: loading
                ? "none"
                : "0 4px 14px rgba(13, 150, 104, 0.25)",
            }}
            onMouseOver={(e) => {
              if (!loading) e.currentTarget.style.boxShadow = "0 6px 20px rgba(13, 150, 104, 0.35)";
            }}
            onMouseOut={(e) => {
              if (!loading) e.currentTarget.style.boxShadow = "0 4px 14px rgba(13, 150, 104, 0.25)";
            }}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{t("auth.signingIn", "Signing in…")}</span>
              </>
            ) : (
              <>
                <span>{t("auth.signIn", "Sign In")}</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Register link */}
        <p className="mt-7 text-center text-sm" style={{ color: "#64748B" }}>
          {t("auth.dontHaveAccount", "New to BizFlow?")}{" "}
          <Link
            href="/register"
            className="font-semibold outline-none focus-visible:underline hover:underline transition-colors"
            style={{ color: "#0D9668" }}
          >
            {t("auth.createAccount", "Create an account")}
          </Link>
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────── Page Export ─────────────────────── */

export default function LoginPage() {
  return (
    <div className="flex min-h-screen overflow-x-hidden" style={{ background: "#F7F9FC" }}>
      <BrandPanel />
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center min-h-screen" style={{ background: "#F7F9FC" }}>
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#0D9668" }} />
          </div>
        }
      >
        <LoginFormContent />
      </Suspense>
    </div>
  );
}
