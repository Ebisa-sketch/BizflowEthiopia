import React from "react";
import Link from "next/link";
import { Building2, ArrowLeft, ShieldCheck, Lock, Eye } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | BizFlow Ethiopia",
  description: "Privacy policy and merchant data protection commitments for BizFlow Ethiopia.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen" style={{ background: "#F7F9FC", color: "#101827" }}>
      {/* Header */}
      <header className="border-b bg-white" style={{ borderColor: "#E2E8F0" }}>
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div
              className="h-9 w-9 rounded-xl flex items-center justify-center text-white"
              style={{ background: "linear-gradient(135deg, #0D9668, #059669)" }}
            >
              <Building2 className="h-5 w-5" />
            </div>
            <span className="text-base font-bold tracking-tight">
              BizFlow<span style={{ color: "#0D9668" }}>Ethiopia</span>
            </span>
          </Link>
          <Link
            href="/register"
            className="text-xs font-semibold flex items-center gap-1.5 transition-colors"
            style={{ color: "#0D9668" }}
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Registration
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl border p-8 sm:p-12 shadow-sm" style={{ borderColor: "#E2E8F0" }}>
          <div className="flex items-center gap-3 mb-6">
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(13, 150, 104, 0.1)", color: "#0D9668" }}
            >
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Privacy Policy</h1>
              <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>
                Effective Date: January 1, 2026 · Version 1.0
              </p>
            </div>
          </div>

          <div className="space-y-6 text-sm leading-relaxed" style={{ color: "#334155" }}>
            <section>
              <h2 className="text-base font-semibold mb-2" style={{ color: "#101827" }}>
                1. Information We Collect
              </h2>
              <p>
                When you create an account on BizFlow Ethiopia, we collect your name, email address, optional phone number, and encrypted credentials. When utilizing our point-of-sale and inventory modules, we store business operational data including sales volume, product catalogs, and inventory levels strictly under your tenant partition.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold mb-2" style={{ color: "#101827" }}>
                2. How We Use Your Information
              </h2>
              <p>
                Your information is used solely to provide, secure, and maintain your store management workspace:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Authenticating user sessions and enforcing role-based permissions.</li>
                <li>Processing transactions, generating daily sales reports, and stock alerts.</li>
                <li>Sending critical account notices and verification communications.</li>
                <li>Preventing unauthorized access and fraudulent transactions.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-semibold mb-2" style={{ color: "#101827" }}>
                3. Data Security & Storage
              </h2>
              <p>
                All passwords are cryptographically hashed using industry-standard bcrypt algorithms. We employ strict tenant isolation in PostgreSQL databases, secure HTTP-only cookies, and encrypted transport layers (TLS/HTTPS). We never sell or rent your business or customer records to third parties.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold mb-2" style={{ color: "#101827" }}>
                4. Your Rights & Data Export
              </h2>
              <p>
                As an account owner, you have full rights to export your sales history, inventory records, and customer lists at any time, or request permanent deletion of your account and related data upon terminating your subscription.
              </p>
            </section>
          </div>

          <div className="mt-10 pt-6 border-t flex items-center justify-between" style={{ borderColor: "#E2E8F0" }}>
            <Link
              href="/terms"
              className="text-xs font-medium hover:underline"
              style={{ color: "#0D9668" }}
            >
              Read our Terms of Service &rarr;
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: "#0D9668" }}
            >
              Back to Registration
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
