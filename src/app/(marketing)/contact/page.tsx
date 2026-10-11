"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  MessageSquare,
  Headphones,
  ArrowRight,
  CheckCircle2,
  Building2,
  Globe,
} from "lucide-react";

const SUPPORT_CHANNELS = [
  {
    icon: Phone,
    title: "Phone Support",
    detail: "+251 911 234567",
    subdetail: "Mon–Sat, 8:00 AM – 6:00 PM (EAT)",
    color: "bg-blue-50 text-blue-600 border-blue-100",
    action: "tel:+251911234567",
    actionLabel: "Call Now",
  },
  {
    icon: MessageSquare,
    title: "Telegram",
    detail: "@BizFlowSupport",
    subdetail: "Fastest response channel for merchants",
    color: "bg-sky-50 text-sky-600 border-sky-100",
    action: "https://t.me/BizFlowSupport",
    actionLabel: "Open Telegram",
  },
  {
    icon: Mail,
    title: "Email Support",
    detail: "support@bizflow.et",
    subdetail: "Response within 24 hours",
    color: "bg-purple-50 text-purple-600 border-purple-100",
    action: "mailto:support@bizflow.et",
    actionLabel: "Send Email",
  },
  {
    icon: Headphones,
    title: "Live Chat",
    detail: "In-app support",
    subdetail: "Available on Business & Pro plans",
    color: "bg-emerald-50 text-emerald-600 border-emerald-100",
    action: "#",
    actionLabel: "Start Chat",
  },
];

const FAQ_ITEMS = [
  {
    question: "Do I need a credit card or foreign currency to use BizFlow?",
    answer: "No. BizFlow subscriptions are paid entirely in Ethiopian Birr (ETB) through Telebirr, CBE Birr, or bank transfer. No international payment methods required.",
  },
  {
    question: "Can I use BizFlow on my phone?",
    answer: "Yes. BizFlow is a Progressive Web App (PWA) — it works in your phone's browser with an app-like experience. No App Store download needed.",
  },
  {
    question: "How do I add my existing products?",
    answer: "You can manually add products one by one, or contact our support team to help bulk-import your catalog via CSV upload (available on Business and Pro plans).",
  },
  {
    question: "Is my data safe?",
    answer: "Yes. All data is encrypted at rest and in transit. Each business's data is isolated through multi-tenant architecture. We never share or sell your data.",
  },
  {
    question: "Can multiple cashiers use BizFlow at the same time?",
    answer: "Yes! Each staff member has their own account with role-based access. The Pro plan supports unlimited simultaneous POS terminals.",
  },
  {
    question: "What happens if I cancel my subscription?",
    answer: "Your data is preserved for 90 days after cancellation. You can export all records as CSV before or after cancelling. No data is deleted without explicit request.",
  },
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    businessName: "",
    subject: "General Inquiry",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setFormData({
        name: "",
        email: "",
        phone: "",
        businessName: "",
        subject: "General Inquiry",
        message: "",
      });
    }, 500);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-[#101827] flex items-center justify-center font-bold text-white shadow-xs">
              <span className="text-[#0D9668] font-black text-lg leading-none">B</span>
              <span className="text-white font-black text-lg leading-none">F</span>
            </div>
            <span className="font-extrabold text-lg tracking-tight text-slate-900">
              BizFlow <span className="text-[#0D9668]">Ethiopia</span>
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
            <Link href="/" className="hover:text-slate-900 transition">Home</Link>
            <Link href="/about" className="hover:text-slate-900 transition">About</Link>
            <Link href="/pricing" className="hover:text-slate-900 transition">Pricing</Link>
            <Link href="/contact" className="text-[#0D9668]">Contact</Link>
          </nav>
          <Link
            href="/login"
            className="rounded-xl bg-[#0D9668] hover:bg-[#097852] px-5 py-2 text-sm font-bold text-white shadow-sm transition"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#101827] via-[#1e293b] to-[#0f172a] py-16 sm:py-20">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 right-1/4 w-72 h-72 bg-[#0D9668]/10 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto text-center px-4">
          <span className="inline-block text-xs font-bold uppercase tracking-wider text-[#0D9668] bg-[#0D9668]/10 border border-[#0D9668]/20 px-4 py-1.5 rounded-full mb-6">
            Get in Touch
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
            We&apos;re here to{" "}
            <span className="bg-gradient-to-r from-[#0D9668] to-[#10b981] bg-clip-text text-transparent">
              help
            </span>
          </h1>
          <p className="mt-4 text-base text-slate-300 max-w-xl mx-auto">
            Questions about BizFlow? Need help setting up? Want a demo for your team?
            Reach us through any of the channels below.
          </p>
        </div>
      </section>

      {/* Support Channels Grid */}
      <section className="py-12 max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SUPPORT_CHANNELS.map((channel) => {
            const Icon = channel.icon;
            return (
              <a
                key={channel.title}
                href={channel.action}
                target="_blank"
                rel="noopener noreferrer"
                className="p-5 rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all duration-200 group text-center"
              >
                <div className={`inline-flex p-3 rounded-xl border ${channel.color} mb-3`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">{channel.title}</h3>
                <p className="text-sm font-semibold text-[#0D9668] mt-1">{channel.detail}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{channel.subdetail}</p>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 group-hover:text-[#0D9668] mt-3 transition">
                  {channel.actionLabel}
                  <ArrowRight className="h-3 w-3" />
                </span>
              </a>
            );
          })}
        </div>
      </section>

      {/* Contact Form + Location */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Contact Form (7 Cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <h2 className="text-xl font-black text-slate-900 mb-1">Send us a message</h2>
            <p className="text-xs text-slate-500 mb-6">
              Fill out the form below and our team will respond within 24 hours.
            </p>

            {submitted ? (
              <div className="text-center py-12 space-y-3">
                <div className="inline-flex p-3 bg-emerald-100 text-emerald-700 rounded-full">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="font-bold text-lg text-slate-900">Message Sent!</h3>
                <p className="text-sm text-slate-500 max-w-xs mx-auto">
                  Thank you for reaching out. Our team will get back to you within 24 hours.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="text-sm font-bold text-[#0D9668] hover:underline mt-2"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Abebe Kebede"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0D9668] focus:border-[#0D9668] transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="e.g. abebe@example.et"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0D9668] focus:border-[#0D9668] transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+251 9XX XXXXXX"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0D9668] focus:border-[#0D9668] transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Business Name
                    </label>
                    <input
                      type="text"
                      value={formData.businessName}
                      onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                      placeholder="e.g. Addis Mini Mart"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0D9668] focus:border-[#0D9668] transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Subject
                  </label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0D9668] focus:border-[#0D9668] transition appearance-none bg-white"
                  >
                    <option>General Inquiry</option>
                    <option>Demo Request</option>
                    <option>Technical Support</option>
                    <option>Subscription & Billing</option>
                    <option>Partnership</option>
                    <option>Feature Request</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Message *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Tell us how we can help..."
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0D9668] focus:border-[#0D9668] transition resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#0D9668] hover:bg-[#097852] px-6 py-3 text-sm font-bold text-white shadow-md shadow-[#0D9668]/30 transition w-full justify-center sm:w-auto"
                >
                  <Send className="h-4 w-4" />
                  Send Message
                </button>
              </form>
            )}
          </div>

          {/* Location & Office Info (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Office Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Building2 className="h-4 w-4 text-[#0D9668]" />
                Our Office
              </h3>

              <div className="space-y-3">
                <div className="flex items-start gap-3 text-xs">
                  <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-900">Bole Atlas</p>
                    <p className="text-slate-500">Near Edna Mall, 3rd Floor, Suite 312</p>
                    <p className="text-slate-500">Addis Ababa, Ethiopia</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-xs">
                  <Clock className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-900">Office Hours</p>
                    <p className="text-slate-500">Mon – Fri: 8:30 AM – 5:30 PM</p>
                    <p className="text-slate-500">Sat: 9:00 AM – 1:00 PM</p>
                    <p className="text-slate-400 text-[11px]">Timezone: Africa/Addis_Ababa (EAT)</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-xs">
                  <Globe className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-900">Languages</p>
                    <p className="text-slate-500">English, Amharic (አማርኛ), Afan Oromo</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Map Placeholder */}
            <div className="bg-slate-100 rounded-2xl border border-slate-200 h-48 flex items-center justify-center">
              <div className="text-center text-slate-400">
                <MapPin className="h-8 w-8 mx-auto mb-2" />
                <p className="text-xs font-semibold">Bole Atlas, Addis Ababa</p>
                <p className="text-[11px]">9.0054° N, 38.7636° E</p>
              </div>
            </div>

            {/* Emergency Support */}
            <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5 space-y-2">
              <h3 className="font-bold text-amber-900 text-sm flex items-center gap-2">
                <Phone className="h-4 w-4 text-amber-600" />
                Urgent Business Support
              </h3>
              <p className="text-xs text-amber-800">
                For critical issues affecting your live sales (POS down, data access problems),
                call our emergency line:
              </p>
              <a
                href="tel:+251911234567"
                className="inline-flex items-center gap-2 text-sm font-bold text-amber-900 hover:underline"
              >
                <Phone className="h-3.5 w-3.5" />
                +251 911 234567
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 max-w-3xl mx-auto px-4">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight text-center mb-10">
          Frequently Asked Questions
        </h2>

        <div className="space-y-3">
          {FAQ_ITEMS.map((faq, idx) => (
            <div
              key={idx}
              className="border border-slate-200 rounded-xl overflow-hidden hover:border-slate-300 transition"
            >
              <button
                onClick={() => setExpandedFAQ(expandedFAQ === idx ? null : idx)}
                className="w-full flex items-center justify-between p-4 text-left group"
              >
                <span className="text-sm font-bold text-slate-900 pr-4">{faq.question}</span>
                <span
                  className={`text-slate-400 group-hover:text-[#0D9668] transition-transform duration-200 shrink-0 text-lg font-bold ${
                    expandedFAQ === idx ? "rotate-45" : ""
                  }`}
                >
                  +
                </span>
              </button>
              {expandedFAQ === idx && (
                <div className="px-4 pb-4 -mt-1 animate-in fade-in slide-in-from-top-1 duration-150">
                  <p className="text-sm text-slate-600 leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#101827] py-8">
        <div className="max-w-5xl mx-auto px-4 text-center text-xs text-slate-400">
          <p>© 2026 BizFlow Ethiopia Ltd. All rights reserved.</p>
          <p className="mt-1">Bole Atlas, Addis Ababa, Ethiopia 🇪🇹</p>
        </div>
      </footer>
    </div>
  );
}
