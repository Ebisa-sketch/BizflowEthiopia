"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import {
  Plus,
  Search,
  Receipt,
  Printer,
  RefreshCw,
  AlertCircle,
  X,
  CreditCard,
  User,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { formatMoney } from "@/lib/money";
import { TableSkeleton } from "@/components/ui/skeleton";
import { DataLoadError } from "@/components/ui/data-load-error";

interface SaleItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

interface Payment {
  id: string;
  amount: number;
  method: string;
  reference?: string | null;
  status: string;
  createdAt: string;
}

interface Sale {
  id: string;
  saleNumber: string;
  createdAt: string;
  customerName: string;
  cashier?: { id: string; name: string; email: string };
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  status: "COMPLETED" | "VOIDED" | "PENDING";
  itemCount: number;
  items: SaleItem[];
  payments: Payment[];
}

export default function SalesHistoryPage() {
  const searchParams = useSearchParams();
  // Pagination & Search
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get("search") || "");
  const [page, setPage] = useState(1);
  const limit = 20;

  const params = new URLSearchParams();
  if (searchTerm.trim()) params.set("search", searchTerm.trim());
  params.set("page", page.toString());
  params.set("limit", limit.toString());

  const swrKey = `/api/sales?${params.toString()}`;
  const { data, error: swrError, isLoading, mutate } = useSWR(swrKey, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
    keepPreviousData: true,
  });

  const sales: Sale[] = data?.sales || [];
  const totalCount = data?.totalCount || 0;
  const loading = isLoading && !data;
  const [error, setError] = useState<string | null>(null);

  const fetchSales = async () => {
    await mutate();
  };

  // Selected Sale for Receipt Modal
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <DataLoadError error={swrError} onRetry={mutate} />
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Sales Transactions</h1>
          <p className="text-sm text-slate-500">
            View transaction history, payment verification, and generate itemized customer receipts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchSales()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            title="Refresh Transactions"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-blue-600" : ""}`} />
            <span>Refresh</span>
          </button>
          <Link
            href="/sales/new"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/30 hover:bg-blue-700 transition"
          >
            <Plus className="h-4 w-4" />
            <span>New Sale (POS)</span>
          </Link>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by invoice number (e.g. BF-...) or customer name..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border-0 bg-transparent pl-9 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-0"
          />
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {loading && sales.length === 0 ? (
          <div className="p-4">
            <TableSkeleton rows={6} cols={7} hasFilters={false} />
          </div>
        ) : sales.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <Receipt className="h-10 w-10 mx-auto text-slate-300" />
            <h3 className="font-semibold text-slate-700">No transactions recorded yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Sales made through the POS checkout terminal will automatically show up here with full invoice breakdowns.
            </p>
            <Link
              href="/sales/new"
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700"
            >
              <Plus className="h-3.5 w-3.5" />
              Launch POS Terminal
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Date / Time</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Cashier</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4 text-center">Items</th>
                  <th className="py-3 px-4 text-right">Total (ETB)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {sales.map((s) => {
                  const paymentMethod =
                    s.payments.length > 0 ? s.payments.map((p) => p.method).join(", ") : "CASH";

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-bold text-slate-900">{s.saleNumber}</td>
                      <td className="py-3 px-4 text-slate-500 font-sans">{formatDate(s.createdAt)}</td>
                      <td className="py-3 px-4 font-sans text-slate-700 font-medium">
                        {s.customerName}
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-600">
                        {s.cashier?.name || "System"}
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-800">
                          {paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-slate-600 font-medium">{s.itemCount}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 text-sm">
                        {formatMoney(s.grandTotal)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider font-sans ${
                            s.status === "COMPLETED"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-red-50 text-red-700 border border-red-200"
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-sans">
                        <button
                          onClick={() => setSelectedSale(s)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition font-medium"
                        >
                          <Receipt className="h-3.5 w-3.5" />
                          <span>Receipt</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination controls */}
        {totalCount > limit && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 bg-slate-50/50">
            <span className="text-xs text-slate-500">
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, totalCount)} of {totalCount}{" "}
              invoices
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5 inline mr-1" />
                Previous
              </button>
              <span className="text-xs font-mono font-semibold text-slate-700">
                {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5 inline ml-1" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Customer Receipt Modal */}
      {selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto">
            {/* Modal Header & Close */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Official Transaction Receipt
              </span>
              <button
                onClick={() => setSelectedSale(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Printable Receipt Area */}
            <div id="receipt-print-area" className="py-4 space-y-4 font-mono text-xs">
              {/* Receipt Brand Banner */}
              <div className="text-center space-y-1">
                <h3 className="text-lg font-bold font-sans tracking-tight text-slate-900">
                  BizFlow Ethiopia
                </h3>
                <p className="text-[11px] text-slate-500 font-sans">
                  Retail & Wholesale Business Management
                </p>
                <p className="text-[10px] text-slate-400 font-sans">Addis Ababa, Ethiopia</p>
                <div className="border-b border-dashed border-slate-300 pt-2" />
              </div>

              {/* Invoice Meta */}
              <div className="space-y-1 text-slate-600">
                <div className="flex justify-between">
                  <span>Invoice Number:</span>
                  <span className="font-bold text-slate-900">{selectedSale.saleNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date & Time:</span>
                  <span>{formatDate(selectedSale.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cashier:</span>
                  <span>{selectedSale.cashier?.name || "Terminal Cashier"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Customer:</span>
                  <span className="font-medium text-slate-900">{selectedSale.customerName}</span>
                </div>
              </div>

              <div className="border-b border-dashed border-slate-300" />

              {/* Items List */}
              <div className="space-y-2">
                <div className="flex justify-between font-bold text-slate-700">
                  <span>Item / Qty</span>
                  <span>Amount (ETB)</span>
                </div>
                {selectedSale.items.map((item) => (
                  <div key={item.id} className="space-y-0.5">
                    <div className="flex justify-between font-medium text-slate-900">
                      <span>{item.name}</span>
                      <span>{formatMoney(item.lineTotal)}</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {item.quantity} × {formatMoney(item.unitPrice)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-b border-dashed border-slate-300" />

              {/* Financial Totals */}
              <div className="space-y-1.5 text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatMoney(selectedSale.subtotal)}</span>
                </div>
                {selectedSale.discountTotal > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount:</span>
                    <span>-{formatMoney(selectedSale.discountTotal)}</span>
                  </div>
                )}
                {selectedSale.taxTotal > 0 && (
                  <div className="flex justify-between">
                    <span>VAT (15%):</span>
                    <span>{formatMoney(selectedSale.taxTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-200">
                  <span>GRAND TOTAL:</span>
                  <span>{formatMoney(selectedSale.grandTotal)}</span>
                </div>
              </div>

              <div className="border-b border-dashed border-slate-300" />

              {/* Payment Details */}
              <div className="space-y-1 text-slate-600">
                <div className="font-semibold text-slate-800">Payment Breakdown:</div>
                {selectedSale.payments.map((p) => (
                  <div key={p.id} className="flex justify-between text-[11px]">
                    <span>
                      {p.method}
                      {p.reference && <span className="text-slate-400"> ({p.reference})</span>}
                    </span>
                    <span className="font-bold">{formatMoney(p.amount)}</span>
                  </div>
                ))}
              </div>

              {/* Footer Note */}
              <div className="text-center pt-2 text-[10px] text-slate-400 font-sans space-y-1">
                <p>Thank you for your business!</p>
                <p>እናመሰግናለን / Galatoomaa</p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedSale(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-sm"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
