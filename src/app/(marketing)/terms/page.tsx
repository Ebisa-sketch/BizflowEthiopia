import React from "react";
import Link from "next/link";
import { Building2, ArrowLeft, ShieldCheck, Scale, FileText } from "lucide-react";

export const metadata = {
  title: "Terms of Service | BizFlow Ethiopia",
  description: "Terms of Service and legal agreement for BizFlow Ethiopia SaaS platform.",
};

export default function TermsPage() {
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
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Terms of Service</h1>
              <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>
                Effective Date: January 1, 2026 · Version 1.0
              </p>
            </div>
          </div>

          <div className="space-y-6 text-sm leading-relaxed" style={{ color: "#334155" }}>
            <section>
              <h2 className="text-base font-semibold mb-2" style={{ color: "#101827" }}>
                1. Agreement to Terms
              </h2>
              <p>
                By creating an account, accessing, or using BizFlow Ethiopia, you agree to be bound by these Terms of Service. If you are registering on behalf of a store, retailer, or business entity in the Federal Democratic Republic of Ethiopia, you represent that you have authority to bind that business.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold mb-2" style={{ color: "#101827" }}>
                2. Use of Services & Merchant Responsibilities
              </h2>
              <p>
                BizFlow Ethiopia provides point-of-sale, inventory control, expense tracking, and reporting tools. You agree to:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Provide accurate store and identity information during registration.</li>
                <li>Maintain the confidentiality of your account credentials.</li>
                <li>Comply with applicable Ethiopian commercial laws, tax regulations, and accounting standards.</li>
                <li>Not use the service for fraudulent or unauthorized transactions.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-semibold mb-2" style={{ color: "#101827" }}>
                3. Subscriptions & Billing
              </h2>
              <p>
                BizFlow provides trial periods and paid subscription plans. Subscription fees are billed in Ethiopian Birr (ETB) and support approved payment methods including Telebirr, CBE Birr, and bank transfers. Failure to maintain an active subscription may result in limited access to advanced features.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold mb-2" style={{ color: "#101827" }}>
                4. Data Ownership & Protection
              </h2>
              <p>
                You retain ownership of all product lists, customer records, and transaction logs entered into BizFlow. BizFlow maintains automated daily backups, multi-tenant database isolation, and security standards to safeguard your commercial data.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold mb-2" style={{ color: "#101827" }}>
                5. Limitation of Liability & Governing Law
              </h2>
              <p>
                BizFlow is provided &ldquo;as is&rdquo;. To the maximum extent permitted under Ethiopian law, BizFlow shall not be liable for indirect or consequential damages resulting from downtime or power outages. These terms are governed by the laws of Ethiopia.
              </p>
            </section>
          </div>

          <div className="mt-10 pt-6 border-t flex items-center justify-between" style={{ borderColor: "#E2E8F0" }}>
            <Link
              href="/privacy"
              className="text-xs font-medium hover:underline"
              style={{ color: "#0D9668" }}
            >
              Read our Privacy Policy &rarr;
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
