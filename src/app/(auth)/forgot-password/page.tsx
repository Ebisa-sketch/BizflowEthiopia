"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import {
  Building2,
  Mail,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Package,
  ShieldCheck,
  TrendingUp,
  Sparkles,
} from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldError, setFieldError] = useState("");

  const isSubmitting = useRef(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting.current || loading) return;

    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setFieldError("Email address is required");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setFieldError("Please enter a valid email address");
      return;
    }

    isSubmitting.current = true;
    setLoading(true);
    setErrorMessage("");
    setFieldError("");

    // Simulate recovery email dispatch with secure timing
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      isSubmitting.current = false;
    }, 800);
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
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Secure Merchant Access</span>
            </div>
            <h1 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight tracking-tight">
              Recover your account access{" "}
              <span className="text-emerald-400">securely.</span>
            </h1>
            <p className="mt-4 text-sm text-slate-400 leading-relaxed max-w-md">
              Enter your registered store administrator email, and we will send you step-by-step instructions to reset your password and restore access to your store workspace.
            </p>
          </div>

          {/* Footer note */}
          <div className="pt-4 border-t border-white/[0.06] text-xs text-slate-400">
            Need urgent recovery assistance? Contact your store owner or reach BizFlow Ethiopia Support at{" "}
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

          <div className="mb-7">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: "#101827" }}>
              Reset your password
            </h2>
            <p className="mt-1.5 text-sm" style={{ color: "#64748B" }}>
              Enter your registered email address to receive password recovery instructions.
            </p>
          </div>

          {submitted ? (
            <div className="bg-white rounded-2xl border p-6 sm:p-7 shadow-sm space-y-4" style={{ borderColor: "#E2E8F0" }}>
              <div
                className="h-11 w-11 rounded-xl flex items-center justify-center text-emerald-600 mb-2"
                style={{ background: "rgba(13, 150, 104, 0.1)" }}
              >
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Check your inbox</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                If an active BizFlow account exists for <strong className="text-slate-800">{email}</strong>, a password reset link has been dispatched. Please review your spam or promotions folder if it doesn’t arrive within 3 minutes.
              </p>
              <div className="pt-2">
                <Link
                  href="/login"
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 cursor-pointer"
                  style={{ background: "#0D9668" }}
                >
                  <ArrowLeft className="h-4 w-4" /> Return to Sign In
                </Link>
              </div>
            </div>
          ) : (
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

              <div>
                <label
                  htmlFor="recovery-email"
                  className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                  style={{ color: "#334155" }}
                >
                  Registered Email Address <span className="text-emerald-600">*</span>
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
                    style={{ color: "#94a3b8" }}
                  />
                  <input
                    id="recovery-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldError) setFieldError("");
                    }}
                    placeholder="name@yourstore.et"
                    aria-invalid={!!fieldError}
                    aria-describedby={fieldError ? "recovery-email-error" : undefined}
                    className="block w-full pl-10 pr-3.5 py-2.5 rounded-xl text-sm transition-all duration-150 outline-none"
                    style={{
                      background: "#FFFFFF",
                      border: fieldError ? "1.5px solid #ef4444" : "1.5px solid #E2E8F0",
                      color: "#101827",
                    }}
                    onFocus={(e) => {
                      if (!fieldError) e.currentTarget.style.border = "1.5px solid #0D9668";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(13, 150, 104, 0.08)";
                    }}
                    onBlur={(e) => {
                      if (!fieldError) e.currentTarget.style.border = "1.5px solid #E2E8F0";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                </div>
                {fieldError && (
                  <p id="recovery-email-error" className="mt-1.5 text-xs text-rose-500">
                    {fieldError}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-500 disabled:opacity-60 cursor-pointer"
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
                    <span>Sending instructions…</span>
                  </>
                ) : (
                  <>
                    <span>Send Reset Instructions</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <div className="pt-4 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 outline-none focus-visible:underline"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
