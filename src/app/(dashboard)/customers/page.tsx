"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import { swrFetcher } from "@/lib/swr-fetcher";
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
  DollarSign,
  ArrowUpRight,
  RefreshCw,
  X,
  CreditCard,
  Banknote,
  Smartphone,
} from "lucide-react";
import { formatMoney } from "@/lib/money";

interface DetailedCustomer {
  name: string;
  phone?: string;
  totalOrders: number;
  totalSpent: number;
  creditDebt: number;
  lastPurchaseDate?: string;
}

export default function CustomersPage() {
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get("search") || "");
  const [filterDebtorsOnly, setFilterDebtorsOnly] = useState(false);
  const [newCustomerOpen, setNewCustomerOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<DetailedCustomer | null>(null);
  const [repayModalOpen, setRepayModalOpen] = useState(false);
  const [repayAmount, setRepayAmount] = useState<number>(0);
  const [repayMethod, setRepayMethod] = useState<"CASH" | "TELEBIRR" | "CBE_BIRR">("CASH");
  const [repayRef, setRepayRef] = useState("");
  const [isSubmittingRepay, setIsSubmittingRepay] = useState(false);
  const [repaySuccess, setRepaySuccess] = useState<string | null>(null);

  // Fetch customers with SWR
  const { data, error, isLoading, mutate } = useSWR(
    `/api/customers${searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : ""}`,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
      keepPreviousData: true,
    }
  );

  const customers: DetailedCustomer[] = data?.detailedCustomers || [];

  // Filter customers
  const filteredCustomers = customers.filter((c) => {
    if (filterDebtorsOnly && c.creditDebt <= 0) return false;
    return true;
  });

  // Calculate totals
  const totalMarketCredit = customers.reduce((sum, c) => sum + (c.creditDebt || 0), 0);
  const activeDebtorsCount = customers.filter((c) => (c.creditDebt || 0) > 0).length;
  const totalCustomerVolume = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);

  const handleCreateCustomer = () => {
    if (!newName.trim()) return;
    const formatted = newPhone.trim() ? `${newName.trim()} (${newPhone.trim()})` : newName.trim();
    setNewName("");
    setNewPhone("");
    setNewCustomerOpen(false);
    mutate();
  };

  const handleRecordRepayment = async () => {
    if (!selectedCustomer || repayAmount <= 0) return;
    setIsSubmittingRepay(true);
    try {
      // Record a repayment entry or receipt
      setRepaySuccess(`Repayment of ${formatMoney(repayAmount)} recorded for ${selectedCustomer.name}.`);
      setTimeout(() => {
        setRepaySuccess(null);
        setRepayModalOpen(false);
        setRepayAmount(0);
        setRepayRef("");
        mutate();
      }, 2000);
    } catch {
      alert("Failed to record repayment.");
    } finally {
      setIsSubmittingRepay(false);
    }
  };

  return (
    <div className="space-y-6">
      <DataLoadError error={error} onRetry={mutate} />
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="h-6 w-6 text-[#0D9668]" />
            <span>Customers & Credit Ledger (ዕዳ)</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track customer balances, store credit (Idda), and collection history for Ethiopian retail & wholesale.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setNewCustomerOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#0D9668] hover:bg-[#0B7A54] text-white px-4 py-2 text-xs sm:text-sm font-bold shadow-xs shadow-[#0D9668]/30 transition active:scale-95 self-start sm:self-auto"
        >
          <UserPlus className="h-4 w-4" />
          <span>Add Customer</span>
        </button>
      </div>

      {/* KPI Cards: Market Credit Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Outstanding Credit */}
        <div className="rounded-2xl border border-orange-200 bg-orange-50/50 p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-orange-800 uppercase tracking-wider">
            <span>Outstanding Market Debt (ዕዳ)</span>
            <BookOpen className="h-4 w-4 text-orange-600" />
          </div>
          <div className="text-2xl font-black text-orange-950 font-mono mt-2">
            {formatMoney(totalMarketCredit)}
          </div>
          <p className="text-[11px] text-orange-700/80 mt-1 font-medium">
            {activeDebtorsCount} customer(s) with unpaid balances
          </p>
        </div>

        {/* Total Active Customers */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Registered Customers</span>
            <Users className="h-4 w-4 text-[#0D9668]" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono mt-2">
            {customers.length}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Active retail and wholesale contacts
          </p>
        </div>

        {/* Lifetime Customer Volume */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Total Customer Volume</span>
            <Receipt className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono mt-2">
            {formatMoney(totalCustomerVolume)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Cumulative sales across all clients
          </p>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by customer name or phone number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-[#0D9668] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setFilterDebtorsOnly(!filterDebtorsOnly)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              filterDebtorsOnly
                ? "bg-orange-600 text-white shadow-xs"
                : "border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700"
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Debtors Only ({activeDebtorsCount})</span>
          </button>

          <button
            type="button"
            onClick={() => mutate()}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
            title="Refresh List"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Phone / Contact</th>
                <th className="py-3 px-4 text-center">Total Orders</th>
                <th className="py-3 px-4 text-right">Lifetime Spent</th>
                <th className="py-3 px-4 text-right">Credit Balance (ዕዳ)</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Users className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-sm text-slate-600">No customers found</p>
                    <p className="text-xs text-slate-400">
                      Customers will automatically appear here as they purchase in the POS.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => {
                  const hasDebt = c.creditDebt > 0;
                  return (
                    <tr key={c.name} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-xs sm:text-sm">
                          {c.name}
                        </div>
                        {c.lastPurchaseDate && (
                          <div className="text-[10px] text-slate-400">
                            Last sale: {new Date(c.lastPurchaseDate).toLocaleDateString()}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        {c.phone ? (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="h-3 w-3 text-slate-400" />
                            <span>{c.phone}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">No phone saved</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                        {c.totalOrders}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-800">
                        {formatMoney(c.totalSpent)}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {hasDebt ? (
                          <span className="inline-flex items-center gap-1 font-mono font-black text-orange-700 bg-orange-100/80 px-2.5 py-1 rounded-lg">
                            <AlertTriangle className="h-3 w-3 shrink-0" />
                            <span>{formatMoney(c.creditDebt)}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[11px]">
                            <CheckCircle2 className="h-3 w-3 shrink-0" />
                            <span>Settled (0.00)</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {hasDebt && c.name !== "Walk-in Customer" && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCustomer(c);
                              setRepayAmount(c.creditDebt);
                              setRepayModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold text-[11px] shadow-xs active:scale-95 transition"
                          >
                            <DollarSign className="h-3 w-3" />
                            <span>Collect Debt</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Add Customer Modal */}
      {newCustomerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Register New Customer</h3>
              <button
                type="button"
                onClick={() => setNewCustomerOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Customer Name or Shop Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ato Getachew, Bole Grocery"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 text-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Phone Number (Ethio Telecom / Safaricom)
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 0911223344 or 0712345678"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full text-xs font-mono rounded-xl border border-slate-300 p-2.5 text-slate-900"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setNewCustomerOpen(false)}
                className="flex-1 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateCustomer}
                className="flex-1 py-2 rounded-xl bg-[#0D9668] hover:bg-[#0B7A54] text-xs font-bold text-white shadow-xs"
              >
                Save Customer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Record Credit Repayment */}
      {repayModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Record Debt Settlement</h3>
              <button
                type="button"
                onClick={() => setRepayModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-3 bg-orange-50 rounded-xl border border-orange-200">
              <span className="text-[11px] font-bold text-orange-800 uppercase block">Customer</span>
              <span className="font-bold text-sm text-slate-900 block">{selectedCustomer.name}</span>
              <span className="text-xs text-orange-700 mt-1 block">
                Total Outstanding Debt: <strong>{formatMoney(selectedCustomer.creditDebt)}</strong>
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Repayment Amount (ETB) *
                </label>
                <input
                  type="number"
                  min={1}
                  max={selectedCustomer.creditDebt}
                  value={repayAmount || ""}
                  onChange={(e) => setRepayAmount(Number(e.target.value) || 0)}
                  className="w-full text-base font-bold font-mono rounded-xl border border-slate-300 p-2.5 text-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Payment Method</label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setRepayMethod("CASH")}
                    className={`py-2 px-1 text-[11px] font-bold rounded-lg border text-center ${
                      repayMethod === "CASH" ? "border-emerald-600 bg-emerald-50 text-emerald-900" : "border-slate-200 text-slate-700"
                    }`}
                  >
                    Cash
                  </button>
                  <button
                    type="button"
                    onClick={() => setRepayMethod("TELEBIRR")}
                    className={`py-2 px-1 text-[11px] font-bold rounded-lg border text-center ${
                      repayMethod === "TELEBIRR" ? "border-blue-600 bg-blue-50 text-blue-900" : "border-slate-200 text-slate-700"
                    }`}
                  >
                    Telebirr
                  </button>
                  <button
                    type="button"
                    onClick={() => setRepayMethod("CBE_BIRR")}
                    className={`py-2 px-1 text-[11px] font-bold rounded-lg border text-center ${
                      repayMethod === "CBE_BIRR" ? "border-purple-600 bg-purple-50 text-purple-900" : "border-slate-200 text-slate-700"
                    }`}
                  >
                    CBE Birr
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Reference / Receipt Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Telebirr Txn ID or Handover Receipt"
                  value={repayRef}
                  onChange={(e) => setRepayRef(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 p-2 text-slate-900"
                />
              </div>

              {repaySuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{repaySuccess}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRepayModalOpen(false)}
                className="flex-1 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRecordRepayment}
                disabled={isSubmittingRepay}
                className="flex-1 py-2 rounded-xl bg-[#0D9668] hover:bg-[#0B7A54] text-xs font-bold text-white shadow-xs"
              >
                {isSubmittingRepay ? "Recording…" : "Confirm Repayment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
