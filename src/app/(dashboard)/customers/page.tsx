"use client";

import React, { useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import { DataLoadError } from "@/components/ui/data-load-error";
import {
  Users,
  Search,
  UserPlus,
  Phone,
  Receipt,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  RefreshCw,
  X,
  CreditCard,
  Banknote,
  Smartphone,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  Clock,
  ChevronRight,
  Building,
  FileText,
  Edit2,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  Filter,
  Loader2,
} from "lucide-react";
import { formatMoney } from "@/lib/money";

interface Customer {
  id: string;
  name: string;
  phone?: string;
  tinNumber?: string;
  notes?: string;
  creditLimit: number;
  currentDebt: number;
  isActive: boolean;
  totalOrders: number;
  totalSpent: number;
  lastPurchaseDate?: string;
  createdAt: string;
}

interface LedgerEntry {
  id: string;
  type: "INITIAL_BALANCE" | "SALE_CREDIT" | "REPAYMENT" | "ADJUSTMENT";
  amount: number;
  balanceAfter: number;
  saleId?: string;
  paymentMethod?: string;
  reference?: string;
  notes?: string;
  recordedBy: string;
  transactionDate: string;
}

interface CustomerDetail extends Customer {
  debtAging: { current: number; days30: number; days60: number; days90plus: number };
  sales: {
    id: string;
    saleNumber: string;
    grandTotal: number;
    discountTotal: number;
    status: string;
    createdAt: string;
    paymentMethod: string;
  }[];
  ledger: LedgerEntry[];
}

interface ApiSummary {
  totalCustomers: number;
  totalOutstandingDebt: number;
  activeDebtors: number;
}

type RepayMethod = "CASH" | "TELEBIRR" | "CBE_BIRR" | "BANK_TRANSFER";

function DebtAgeBadge({ days, amount }: { days: "current" | "30" | "60" | "90plus"; amount: number }) {
  if (amount <= 0) return null;
  const configs = {
    current: { label: "0–30 days", cls: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800" },
    "30": { label: "31–60 days", cls: "bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800" },
    "60": { label: "61–90 days", cls: "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800" },
    "90plus": { label: "90+ days", cls: "bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700 font-black" },
  };
  const cfg = configs[days];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${cfg.cls}`}>
      <Clock className="h-2.5 w-2.5" />
      {cfg.label}: {formatMoney(amount)}
    </span>
  );
}

function LedgerTypeBadge({ type }: { type: LedgerEntry["type"] }) {
  const configs: Record<LedgerEntry["type"], { label: string; icon: React.ReactNode; cls: string }> = {
    INITIAL_BALANCE: { label: "Opening", icon: <Info className="h-3 w-3" />, cls: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400" },
    SALE_CREDIT: { label: "Sale Credit", icon: <ArrowDownRight className="h-3 w-3" />, cls: "bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-400" },
    REPAYMENT: { label: "Repayment", icon: <ArrowUpRight className="h-3 w-3" />, cls: "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400" },
    ADJUSTMENT: { label: "Adjustment", icon: <Edit2 className="h-3 w-3" />, cls: "bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400" },
  };
  const cfg = configs[type];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold ${cfg.cls}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

export default function CustomersPage() {
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get("search") || "");
  const [filterDebtorsOnly, setFilterDebtorsOnly] = useState(false);

  // Modals
  const [newCustomerOpen, setNewCustomerOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newInitialDebt, setNewInitialDebt] = useState("");
  const [newCreditLimit, setNewCreditLimit] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [isSubmittingCustomer, setIsSubmittingCustomer] = useState(false);
  const [customerError, setCustomerError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Repayment modal
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [repayModalOpen, setRepayModalOpen] = useState(false);
  const [repayAmount, setRepayAmount] = useState<number>(0);
  const [repayMethod, setRepayMethod] = useState<RepayMethod>("CASH");
  const [repayRef, setRepayRef] = useState("");
  const [repayNotes, setRepayNotes] = useState("");
  const [isSubmittingRepay, setIsSubmittingRepay] = useState(false);
  const [repaySuccess, setRepaySuccess] = useState<string | null>(null);
  const [repayError, setRepayError] = useState<string | null>(null);

  // Profile drawer
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);
  const [profileCustomerId, setProfileCustomerId] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4000);
  }, []);

  // Fetch customers list
  const listUrl =
    `/api/customers?` +
    (searchTerm ? `search=${encodeURIComponent(searchTerm)}&` : "") +
    (filterDebtorsOnly ? "debtors=1&" : "") +
    "limit=100";

  const { data, error, isLoading, mutate } = useSWR(listUrl, {
    revalidateOnFocus: false,
    dedupingInterval: 20000,
    keepPreviousData: true,
  });

  const customers: Customer[] = data?.detailedCustomers || [];
  const summary: ApiSummary = data?.summary || { totalCustomers: 0, totalOutstandingDebt: 0, activeDebtors: 0 };
  const totalVolume = customers.reduce((s, c) => s + c.totalSpent, 0);

  // Fetch selected customer profile
  const { data: profileData, isLoading: profileLoading, mutate: profileMutate } = useSWR(
    profileCustomerId ? `/api/customers/${profileCustomerId}` : null,
    { revalidateOnFocus: false }
  );
  const profileCustomer: CustomerDetail | null = profileData?.customer ?? null;

  const handleCreateCustomer = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newName.trim()) {
      setCustomerError("Customer or shop name is required.");
      return;
    }

    const parsedDebt = newInitialDebt ? parseFloat(newInitialDebt) : 0;
    if (newInitialDebt && (isNaN(parsedDebt) || parsedDebt < 0)) {
      setCustomerError("Initial debt must be a valid non-negative number.");
      return;
    }
    const parsedLimit = newCreditLimit ? parseFloat(newCreditLimit) : 0;

    try {
      setIsSubmittingCustomer(true);
      setCustomerError(null);

      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          phone: newPhone.trim() || undefined,
          initialDebt: parsedDebt,
          creditLimit: parsedLimit,
          notes: newNotes.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create customer.");

      const addedName = newName.trim();
      setNewName("");
      setNewPhone("");
      setNewInitialDebt("");
      setNewCreditLimit("");
      setNewNotes("");
      setNewCustomerOpen(false);
      showToast(`Customer "${addedName}" registered successfully.`);
      await mutate();
    } catch (err: unknown) {
      setCustomerError(err instanceof Error ? err.message : "Failed to create customer.");
    } finally {
      setIsSubmittingCustomer(false);
    }
  };

  const handleRecordRepayment = async () => {
    if (!selectedCustomer || repayAmount <= 0) return;
    setIsSubmittingRepay(true);
    setRepayError(null);
    try {
      const res = await fetch("/api/customers/repay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          amount: repayAmount,
          paymentMethod: repayMethod,
          reference: repayRef.trim() || undefined,
          notes: repayNotes.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to record repayment.");

      setRepaySuccess(json.message);
      await mutate();
      if (profileCustomerId === selectedCustomer.id) await profileMutate();

      setTimeout(() => {
        setRepaySuccess(null);
        setRepayModalOpen(false);
        setRepayAmount(0);
        setRepayRef("");
        setRepayNotes("");
        setSelectedCustomer(null);
      }, 1800);
    } catch (err: unknown) {
      setRepayError(err instanceof Error ? err.message : "Failed to record repayment.");
    } finally {
      setIsSubmittingRepay(false);
    }
  };

  const openProfile = (c: Customer) => {
    setProfileCustomerId(c.id);
    setProfileDrawerOpen(true);
  };

  const openRepay = (c: Customer) => {
    setSelectedCustomer(c);
    setRepayAmount(c.currentDebt);
    setRepayError(null);
    setRepaySuccess(null);
    setRepayModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <DataLoadError error={error} onRetry={() => mutate()} />

      {/* Success Toast */}
      {successToast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white shadow-lg animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
            <Users className="h-6 w-6 text-[#0D9668]" />
            <span>Customers &amp; Credit Ledger (ዕዳ)</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Dedicated customer profiles, full debt ledger history, and aging analysis for Ethiopian retail &amp; wholesale.
          </p>
        </div>

        <button
          type="button"
          onClick={() => { setCustomerError(null); setNewCustomerOpen(true); }}
          className="inline-flex items-center gap-2 rounded-xl bg-[#0D9668] hover:bg-[#0B7A54] text-white px-4 py-2.5 text-xs sm:text-sm font-bold shadow-xs shadow-[#0D9668]/30 transition active:scale-95 self-start sm:self-auto cursor-pointer"
        >
          <UserPlus className="h-4 w-4" />
          <span>Add Customer</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-orange-200 dark:border-orange-900/40 bg-orange-50/50 dark:bg-orange-950/20 p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-orange-800 dark:text-orange-400 uppercase tracking-wider">
            <span>Outstanding Debt (ዕዳ)</span>
            <BookOpen className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="text-2xl font-black text-orange-950 dark:text-orange-200 font-mono mt-2">
            {formatMoney(summary.totalOutstandingDebt)}
          </div>
          <p className="text-[11px] text-orange-700/80 dark:text-orange-400/80 mt-1 font-medium">
            {summary.activeDebtors} customer(s) with unpaid balances
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <span>Registered Customers</span>
            <Users className="h-4 w-4 text-[#0D9668]" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono mt-2">
            {summary.totalCustomers}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Unique retail and wholesale contacts
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <span>Total Customer Volume</span>
            <Receipt className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono mt-2">
            {formatMoney(totalVolume)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Cumulative sales across all clients
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search by name or phone number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-700 focus:border-[#0D9668] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setFilterDebtorsOnly(!filterDebtorsOnly)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              filterDebtorsOnly
                ? "bg-orange-600 text-white shadow-xs"
                : "border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Debtors Only ({summary.activeDebtors})</span>
          </button>

          <button
            type="button"
            onClick={() => mutate()}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Customer Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4 text-center">Orders</th>
                <th className="py-3 px-4 text-right">Lifetime Spent</th>
                <th className="py-3 px-4 text-right">Credit Balance (ዕዳ)</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {isLoading && customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    <Loader2 className="h-6 w-6 mx-auto mb-2 animate-spin text-slate-300 dark:text-slate-600" />
                    <p className="text-xs">Loading customers…</p>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    <Users className="h-8 w-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    <p className="font-semibold text-sm text-slate-600 dark:text-slate-300">No customers found</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      Use &quot;Add Customer&quot; above or record named transactions in POS.
                    </p>
                  </td>
                </tr>
              ) : (
                customers.map((c) => {
                  const hasDebt = c.currentDebt > 0;
                  const overLimit = c.creditLimit > 0 && c.currentDebt > c.creditLimit;
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                          {c.name}
                        </div>
                        {c.tinNumber && (
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                            TIN: {c.tinNumber}
                          </div>
                        )}
                        {c.lastPurchaseDate && (
                          <div className="text-[10px] text-slate-400 dark:text-slate-500">
                            Last sale: {new Date(c.lastPurchaseDate).toLocaleDateString()}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        {c.phone ? (
                          <span className="inline-flex items-center gap-1 font-mono text-xs">
                            <Phone className="h-3 w-3 text-slate-400" />
                            <span>{c.phone}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 italic text-[11px]">No phone</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center font-bold text-slate-700 dark:text-slate-300">
                        {c.totalOrders}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                        {formatMoney(c.totalSpent)}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {hasDebt ? (
                          <div className="flex flex-col items-end gap-0.5">
                            <span className={`inline-flex items-center gap-1 font-mono font-black px-2.5 py-1 rounded-lg text-xs ${
                              overLimit
                                ? "text-red-800 dark:text-red-300 bg-red-100/80 dark:bg-red-950/40"
                                : "text-orange-700 dark:text-orange-400 bg-orange-100/80 dark:bg-orange-950/40"
                            }`}>
                              <AlertTriangle className="h-3 w-3 shrink-0" />
                              <span>{formatMoney(c.currentDebt)}</span>
                            </span>
                            {overLimit && (
                              <span className="text-[10px] text-red-500 dark:text-red-400 font-bold">Over limit!</span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full text-[11px]">
                            <CheckCircle2 className="h-3 w-3 shrink-0" />
                            <span>Settled</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openProfile(c)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[11px] shadow-xs active:scale-95 transition cursor-pointer"
                          >
                            <Eye className="h-3 w-3" />
                            <span>View</span>
                          </button>
                          {hasDebt && (
                            <button
                              type="button"
                              onClick={() => openRepay(c)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold text-[11px] shadow-xs active:scale-95 transition cursor-pointer"
                            >
                              <CreditCard className="h-3 w-3" />
                              <span>Collect</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── DRAWER: Customer Profile & Ledger ─────────────────────────── */}
      {profileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="flex-1 bg-slate-950/50 backdrop-blur-xs"
            onClick={() => setProfileDrawerOpen(false)}
          />
          {/* Panel */}
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right-5">
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-[#0D9668]/10">
                  <BookOpen className="h-4 w-4 text-[#0D9668]" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">Customer Profile</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Ledger &amp; transaction history</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setProfileDrawerOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {profileLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <p className="text-xs">Loading profile…</p>
                </div>
              ) : profileCustomer ? (
                <>
                  {/* Identity Card */}
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="font-black text-base text-slate-900 dark:text-slate-100">{profileCustomer.name}</h4>
                        {profileCustomer.phone && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                            <Phone className="h-3 w-3" /> {profileCustomer.phone}
                          </p>
                        )}
                        {profileCustomer.tinNumber && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                            <Building className="h-3 w-3" /> TIN: {profileCustomer.tinNumber}
                          </p>
                        )}
                        {profileCustomer.notes && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5 italic">
                            <FileText className="h-3 w-3" /> {profileCustomer.notes}
                          </p>
                        )}
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                          Registered {new Date(profileCustomer.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Balance</p>
                        <p className={`text-lg font-black font-mono ${profileCustomer.currentDebt > 0 ? "text-orange-600 dark:text-orange-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                          {formatMoney(profileCustomer.currentDebt)}
                        </p>
                        {profileCustomer.creditLimit > 0 && (
                          <p className="text-[10px] text-slate-400 dark:text-slate-500">
                            Limit: {formatMoney(profileCustomer.creditLimit)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 text-center">
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Orders</p>
                      <p className="text-lg font-black text-slate-900 dark:text-slate-100 font-mono">{profileCustomer.totalOrders}</p>
                    </div>
                    <div className="rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 text-center">
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Spent</p>
                      <p className="text-sm font-black text-slate-900 dark:text-slate-100 font-mono">{formatMoney(profileCustomer.totalSpent)}</p>
                    </div>
                    <div className={`rounded-xl border p-3 text-center ${profileCustomer.currentDebt > 0 ? "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800" : "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"}`}>
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Debt</p>
                      <p className={`text-sm font-black font-mono ${profileCustomer.currentDebt > 0 ? "text-orange-700 dark:text-orange-400" : "text-emerald-700 dark:text-emerald-400"}`}>
                        {formatMoney(profileCustomer.currentDebt)}
                      </p>
                    </div>
                  </div>

                  {/* Debt Aging */}
                  {profileCustomer.currentDebt > 0 && (
                    <div className="rounded-xl border border-orange-200 dark:border-orange-900/40 bg-orange-50/50 dark:bg-orange-950/20 p-3">
                      <p className="text-[10px] font-black text-orange-800 dark:text-orange-400 uppercase mb-2 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Debt Aging
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        <DebtAgeBadge days="current" amount={profileCustomer.debtAging.current} />
                        <DebtAgeBadge days="30" amount={profileCustomer.debtAging.days30} />
                        <DebtAgeBadge days="60" amount={profileCustomer.debtAging.days60} />
                        <DebtAgeBadge days="90plus" amount={profileCustomer.debtAging.days90plus} />
                        {Object.values(profileCustomer.debtAging).every((v) => v === 0) && (
                          <span className="text-xs text-slate-400 dark:text-slate-500 italic">No aging data yet</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Collect Debt Button */}
                  {profileCustomer.currentDebt > 0 && (
                    <button
                      type="button"
                      onClick={() => { openRepay(profileCustomer); }}
                      className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xs active:scale-95 transition cursor-pointer"
                    >
                      <CreditCard className="h-4 w-4" />
                      Collect Debt — {formatMoney(profileCustomer.currentDebt)}
                    </button>
                  )}

                  {/* Ledger History */}
                  <div>
                    <h5 className="font-black text-xs uppercase text-slate-500 dark:text-slate-400 tracking-wider mb-2 flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5" /> Debt Ledger History
                    </h5>
                    {profileCustomer.ledger.length === 0 ? (
                      <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-center text-xs text-slate-400 dark:text-slate-500">
                        No ledger entries yet. Transactions appear here automatically.
                      </div>
                    ) : (
                      <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                        {profileCustomer.ledger.map((tx) => (
                          <div key={tx.id} className="flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                            <div className="flex flex-col gap-0.5 min-w-0">
                              <LedgerTypeBadge type={tx.type} />
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                                {new Date(tx.transactionDate).toLocaleString()} · {tx.recordedBy}
                              </p>
                              {tx.reference && (
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">Ref: {tx.reference}</p>
                              )}
                              {tx.notes && (
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 italic truncate">{tx.notes}</p>
                              )}
                            </div>
                            <div className="text-right shrink-0">
                              <p className={`text-sm font-black font-mono ${tx.amount > 0 ? "text-orange-600 dark:text-orange-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                                {tx.amount > 0 ? "+" : ""}{formatMoney(tx.amount)}
                              </p>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                                Bal: {formatMoney(tx.balanceAfter)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Recent Sales */}
                  {profileCustomer.sales.length > 0 && (
                    <div>
                      <h5 className="font-black text-xs uppercase text-slate-500 dark:text-slate-400 tracking-wider mb-2 flex items-center gap-1.5">
                        <Receipt className="h-3.5 w-3.5" /> Recent Purchases
                      </h5>
                      <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                        {profileCustomer.sales.slice(0, 10).map((s) => (
                          <div key={s.id} className="flex items-center justify-between gap-2 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                            <div>
                              <p className="font-bold text-xs text-slate-800 dark:text-slate-200 font-mono">{s.saleNumber}</p>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500">
                                {new Date(s.createdAt).toLocaleDateString()} · {s.paymentMethod.replace("_", " ")}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-black text-xs font-mono text-slate-900 dark:text-slate-100">{formatMoney(s.grandTotal)}</p>
                              <span className={`text-[10px] font-bold ${s.status === "COMPLETED" ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`}>
                                {s.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                  <AlertCircle className="h-6 w-6" />
                  <p className="text-xs">Could not load customer profile.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: Register Customer ─────────────────────────────────── */}
      {newCustomerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Register New Customer</h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">Create a dedicated account profile</p>
              </div>
              <button
                type="button"
                onClick={() => setNewCustomerOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {customerError && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{customerError}</span>
              </div>
            )}

            <form onSubmit={handleCreateCustomer} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Customer Name or Shop Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ato Getachew, Bole Grocery"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-[#0D9668] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Phone Number (Ethio Telecom)
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 0911223344"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-[#0D9668] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Opening Debt (ዕዳ)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0.00"
                    value={newInitialDebt}
                    onChange={(e) => setNewInitialDebt(e.target.value)}
                    className="w-full text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-[#0D9668] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Credit Limit
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0.00 = unlimited"
                    value={newCreditLimit}
                    onChange={(e) => setNewCreditLimit(e.target.value)}
                    className="w-full text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-[#0D9668] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Wholesale client, Piassa area"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-[#0D9668] focus:outline-none resize-none"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setNewCustomerOpen(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCustomer}
                  className="flex-1 py-2 rounded-xl bg-[#0D9668] hover:bg-[#0B7A54] text-xs font-bold text-white shadow-xs disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isSubmittingCustomer ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</> : "Register Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: Record Repayment ─────────────────────────────────── */}
      {repayModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-[60] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Record Debt Settlement</h3>
              <button
                type="button"
                onClick={() => setRepayModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-3 bg-orange-50 dark:bg-orange-950/30 rounded-xl border border-orange-200 dark:border-orange-900/50">
              <span className="text-[11px] font-bold text-orange-800 dark:text-orange-400 uppercase block">Customer</span>
              <span className="font-bold text-sm text-slate-900 dark:text-slate-100 block">{selectedCustomer.name}</span>
              <span className="text-xs text-orange-700 dark:text-orange-300 mt-0.5 block">
                Outstanding Debt: <strong>{formatMoney(selectedCustomer.currentDebt)}</strong>
              </span>
            </div>

            {repayError && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{repayError}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Amount (ETB) *
                </label>
                <input
                  type="number"
                  min={1}
                  max={selectedCustomer.currentDebt}
                  value={repayAmount || ""}
                  onChange={(e) => setRepayAmount(Number(e.target.value) || 0)}
                  className="w-full text-base font-bold font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-slate-100 focus:border-[#0D9668] focus:outline-none"
                />
                <div className="flex gap-1.5 mt-1.5">
                  {[selectedCustomer.currentDebt, selectedCustomer.currentDebt / 2, 500, 200].filter((v, i, a) => v > 0 && a.indexOf(v) === i).slice(0, 4).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setRepayAmount(v)}
                      className="px-2 py-0.5 text-[10px] font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                    >
                      {v === selectedCustomer.currentDebt ? "Full" : formatMoney(v)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Payment Method</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(["CASH", "TELEBIRR", "CBE_BIRR", "BANK_TRANSFER"] as RepayMethod[]).map((m) => {
                    const labels = { CASH: "Cash", TELEBIRR: "Telebirr", CBE_BIRR: "CBE Birr", BANK_TRANSFER: "Bank" };
                    const active = repayMethod === m;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setRepayMethod(m)}
                        className={`py-2 text-[11px] font-bold rounded-lg border text-center cursor-pointer transition ${
                          active
                            ? "border-[#0D9668] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300"
                            : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                        }`}
                      >
                        {labels[m]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {repayMethod !== "CASH" && (
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Transaction Reference
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Telebirr TXN ID"
                    value={repayRef}
                    onChange={(e) => setRepayRef(e.target.value)}
                    className="w-full text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-[#0D9668] focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Partial settlement agreed"
                  value={repayNotes}
                  onChange={(e) => setRepayNotes(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-[#0D9668] focus:outline-none"
                />
              </div>

              {repaySuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{repaySuccess}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRepayModalOpen(false)}
                className="flex-1 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRecordRepayment}
                disabled={isSubmittingRepay || repayAmount <= 0}
                className="flex-1 py-2 rounded-xl bg-[#0D9668] hover:bg-[#0B7A54] text-xs font-bold text-white shadow-xs disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isSubmittingRepay ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Recording…</> : "Confirm Settlement"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
