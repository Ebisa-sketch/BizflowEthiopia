"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Building2,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  KeyRound,
  Check,
  X,
} from "lucide-react";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  // Token validation state
  const [validatingToken, setValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState("");
  const [userInfo, setUserInfo] = useState<{ maskedEmail?: string; userName?: string }>({});

  // Form states
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const isSubmitting = useRef(false);

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setValidatingToken(false);
      setTokenValid(false);
      setTokenError("Missing password recovery token in the URL.");
      return;
    }

    const verifyToken = async () => {
      try {
        setValidatingToken(true);
        const res = await fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`);
        const data = await res.json();

        if (res.ok && data.valid) {
          setTokenValid(true);
          setUserInfo({ maskedEmail: data.maskedEmail, userName: data.userName });
        } else {
          setTokenValid(false);
          setTokenError(data.error || "This recovery link is invalid or has expired.");
        }
      } catch {
        setTokenValid(false);
        setTokenError("Unable to verify reset token. Please check your network connection.");
      } finally {
        setValidatingToken(false);
      }
    };

    verifyToken();
  }, [token]);

  // Real-time password criteria
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const strengthScore = [hasMinLength, hasUpper, hasLower, hasNumber].filter(Boolean).length;
  const strengthLabels = ["Weak", "Fair", "Good", "Strong"];
  const strengthColors = ["#ef4444", "#f59e0b", "#10b981", "#059669"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting.current || loading) return;

    if (!hasMinLength || !hasUpper || !hasLower || !hasNumber) {
      setErrorMessage("Please ensure your password meets all complexity requirements.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    try {
      isSubmitting.current = true;
      setLoading(true);
      setErrorMessage("");

      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update password");
      }

      setSuccess(true);
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
      isSubmitting.current = false;
    }
  };

  return (
    <div className="flex min-h-screen" style={{ background: "#F7F9FC" }}>
      {/* Brand Panel */}
      <div
        className="hidden lg:flex lg:w-[48%] xl:w-[50%] relative overflow-hidden flex-col justify-between px-10 xl:px-16 py-10"
        style={{
          background: "linear-gradient(145deg, #101827 0%, #0f172a 50%, #0c1425 100%)",
        }}
      >
        <div
          className="absolute -top-36 -left-36 w-[450px] h-[450px] rounded-full opacity-[0.06] pointer-events-none"
          style={{ background: "radial-gradient(circle, #0D9668 0%, transparent 70%)" }}
        />

        <div className="relative z-10 flex flex-col h-full justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center shadow-md shadow-emerald-900/30"
              style={{ background: "linear-gradient(135deg, #0D9668, #059669)" }}
            >
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">
              BizFlow<span className="text-emerald-400 ml-0.5">Ethiopia</span>
            </span>
          </div>

          {/* Value Prop */}
          <div className="my-auto py-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-4">
              <KeyRound className="h-3.5 w-3.5" />
              <span>Credential Security</span>
            </div>
            <h1 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight tracking-tight">
              Create a new, strong{" "}
              <span className="text-emerald-400">master password.</span>
            </h1>
            <p className="mt-4 text-sm text-slate-400 leading-relaxed max-w-md">
              Protect your business metrics, sales registers, and inventory records with enterprise-grade encryption. Choose a password you have not used on other platforms.
            </p>
          </div>

          {/* Footer note */}
          <div className="pt-4 border-t border-white/[0.06] text-xs text-slate-400">
            Having trouble resetting your password? Contact your business administrator or reach BizFlow Ethiopia Support at{" "}
            <span className="text-slate-300 font-medium">support@bizflow.et</span>
          </div>
        </div>
      </div>

      {/* Form Panel */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-14 xl:px-20 py-10 overflow-y-auto">
        <div className="w-full max-w-[420px] mx-auto">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div
              className="h-9 w-9 rounded-xl flex items-center justify-center text-white"
              style={{ background: "linear-gradient(135deg, #0D9668, #059669)" }}
            >
              <Building2 className="h-5 w-5" />
            </div>
            <span className="text-base font-bold tracking-tight" style={{ color: "#101827" }}>
              BizFlow<span style={{ color: "#0D9668" }}>Ethiopia</span>
            </span>
          </div>

          {/* Validating Spinner */}
          {validatingToken ? (
            <div className="bg-white rounded-2xl border p-8 shadow-sm text-center space-y-4" style={{ borderColor: "#E2E8F0" }}>
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">Verifying your recovery link…</p>
              <p className="text-xs text-slate-400">Please wait while we confirm your security token.</p>
            </div>
          ) : !tokenValid ? (
            /* Invalid or Expired Token State */
            <div className="bg-white rounded-2xl border p-6 sm:p-7 shadow-sm space-y-4" style={{ borderColor: "#E2E8F0" }}>
              <div
                className="h-11 w-11 rounded-xl flex items-center justify-center text-rose-600 mb-2"
                style={{ background: "rgba(239, 68, 68, 0.1)" }}
              >
                <AlertCircle className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Recovery Link Expired or Invalid</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {tokenError || "This password recovery link has either expired or already been used for a previous reset."}
              </p>
              <div className="pt-2 space-y-2.5">
                <Link
                  href="/forgot-password"
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 cursor-pointer"
                  style={{ background: "#0D9668" }}
                >
                  Request a New Link
                </Link>
                <Link
                  href="/login"
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" /> Back to Sign In
                </Link>
              </div>
            </div>
          ) : success ? (
            /* Success State */
            <div className="bg-white rounded-2xl border p-6 sm:p-7 shadow-sm space-y-4" style={{ borderColor: "#E2E8F0" }}>
              <div
                className="h-12 w-12 rounded-xl flex items-center justify-center text-emerald-600 mb-2"
                style={{ background: "rgba(13, 150, 104, 0.1)" }}
              >
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Password Reset Complete!</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Your password has been securely updated. You can now log into your store dashboard using your new credentials.
              </p>
              <div className="pt-3">
                <Link
                  href="/login"
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white transition-all shadow-md shadow-emerald-700/20 hover:opacity-90 cursor-pointer"
                  style={{ background: "#0D9668" }}
                >
                  <span>Sign In to Your Workspace</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ) : (
            /* Reset Form */
            <div>
              <div className="mb-6">
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: "#101827" }}>
                  Set new password
                </h2>
                {userInfo.maskedEmail && (
                  <p className="mt-1.5 text-sm" style={{ color: "#64748B" }}>
                    Resetting password for{" "}
                    <strong className="text-slate-800">{userInfo.userName || userInfo.maskedEmail}</strong>
                  </p>
                )}
              </div>

              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                {errorMessage && (
                  <div
                    className="p-3.5 rounded-xl text-sm flex items-start gap-2.5"
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

                {/* New Password */}
                <div>
                  <label
                    htmlFor="new-password"
                    className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                    style={{ color: "#334155" }}
                  >
                    New Password <span className="text-emerald-600">*</span>
                  </label>
                  <div className="relative">
                    <Lock
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
                      style={{ color: "#94a3b8" }}
                    />
                    <input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errorMessage) setErrorMessage("");
                      }}
                      placeholder="Minimum 8 characters"
                      className="block w-full pl-10 pr-10 py-2.5 rounded-xl text-sm transition-all duration-150 outline-none"
                      style={{
                        background: "#FFFFFF",
                        border: "1.5px solid #E2E8F0",
                        color: "#101827",
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.border = "1.5px solid #0D9668";
                        e.currentTarget.style.boxShadow = "0 0 0 3px rgba(13, 150, 104, 0.08)";
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.border = "1.5px solid #E2E8F0";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Password Strength Meter */}
                  {password.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span className="text-slate-500">Strength:</span>
                        <span style={{ color: strengthColors[Math.max(0, strengthScore - 1)] }}>
                          {strengthLabels[Math.max(0, strengthScore - 1)]}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex gap-1">
                        {[1, 2, 3, 4].map((step) => (
                          <div
                            key={step}
                            className="h-full flex-1 transition-all duration-300 rounded-full"
                            style={{
                              background:
                                step <= strengthScore
                                  ? strengthColors[Math.max(0, strengthScore - 1)]
                                  : "#e2e8f0",
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label
                    htmlFor="confirm-password"
                    className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                    style={{ color: "#334155" }}
                  >
                    Confirm New Password <span className="text-emerald-600">*</span>
                  </label>
                  <div className="relative">
                    <Lock
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
                      style={{ color: "#94a3b8" }}
                    />
                    <input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (errorMessage) setErrorMessage("");
                      }}
                      placeholder="Repeat new password"
                      className="block w-full pl-10 pr-10 py-2.5 rounded-xl text-sm transition-all duration-150 outline-none"
                      style={{
                        background: "#FFFFFF",
                        border: "1.5px solid #E2E8F0",
                        color: "#101827",
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.border = "1.5px solid #0D9668";
                        e.currentTarget.style.boxShadow = "0 0 0 3px rgba(13, 150, 104, 0.08)";
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.border = "1.5px solid #E2E8F0";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Password Criteria Checklist */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    {hasMinLength ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <X className="h-3.5 w-3.5 text-slate-400" />}
                    <span className={hasMinLength ? "text-emerald-700 font-medium" : ""}>At least 8 characters</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasUpper && hasLower ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <X className="h-3.5 w-3.5 text-slate-400" />}
                    <span className={hasUpper && hasLower ? "text-emerald-700 font-medium" : ""}>Uppercase and lowercase letters</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasNumber ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <X className="h-3.5 w-3.5 text-slate-400" />}
                    <span className={hasNumber ? "text-emerald-700 font-medium" : ""}>At least one number</span>
                  </div>
                  {confirmPassword.length > 0 && (
                    <div className="flex items-center gap-2">
                      {passwordsMatch ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <X className="h-3.5 w-3.5 text-rose-500" />}
                      <span className={passwordsMatch ? "text-emerald-700 font-medium" : "text-rose-600"}>Passwords match</span>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || !hasMinLength || !hasUpper || !hasLower || !hasNumber || !passwordsMatch}
                  className="w-full mt-2 flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  style={{
                    background: loading
                      ? "#0D9668"
                      : "linear-gradient(135deg, #0D9668 0%, #059669 100%)",
                    boxShadow: "0 4px 14px rgba(13, 150, 104, 0.25)",
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Updating password…</span>
                    </>
                  ) : (
                    <>
                      <span>Update Password</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                <div className="pt-3 text-center">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 outline-none focus-visible:underline"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Return to Sign In
                  </Link>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
