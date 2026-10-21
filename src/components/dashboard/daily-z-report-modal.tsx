"use client";

import React, { useRef } from "react";
import {
  Printer,
  X,
  Store,
  DollarSign,
  TrendingUp,
  Receipt,
  CheckCircle2,
  Calendar,
  Clock,
  Building,
  CreditCard,
  Smartphone,
  Banknote,
  BookOpen,
} from "lucide-react";
import { formatMoney } from "@/lib/money";
import { formatEatTime } from "@/lib/dashboard-metrics";

export interface ZReportData {
  businessName: string;
  tinNumber?: string;
  phone?: string;
  address?: string;
  currency: string;
  dateRange: string;
  operatorName: string;
  invoiced: number;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  cogs: number;
  grossProfit: number;
  grossMarginPercentage: number;
  expenses: number;
  netOperatingProfit: number;
  salesCount: number;
  avgOrderValue: number;
  cashCollected: number;
  cashSalesCount: number;
  digitalCollected: number;
  expectedCashInTill: number;
  paymentMethods: {
    method: string;
    amount: number;
    percentage: number;
    count?: number;
  }[];
  countedCash?: number;
}

interface DailyZReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ZReportData;
}

export function DailyZReportModal({ isOpen, onClose, data }: DailyZReportModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const formatStoreMoney = (val: number) => formatMoney(val, { currency: data.currency });

  const handlePrint = () => {
    window.print();
  };

  const now = new Date();
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Addis_Ababa",
    dateStyle: "full",
  }).format(now);
  const formattedTime = formatEatTime(now);

  const cashVariance =
    data.countedCash !== undefined ? data.countedCash - data.expectedCashInTill : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      {/* Modal Container */}
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-2xl my-8 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Action Bar (Hidden on print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80 print:hidden">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#0D9668]/10 text-[#0D9668]">
              <Printer className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                Daily Z-Report / የቀን የሽያጭ ማጠቃለያ
              </h3>
              <p className="text-xs text-slate-500">Official End-of-Day Store Audit Document</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#101827] hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs"
            >
              <Printer className="h-3.5 w-3.5 text-[#0D9668]" />
              Print / Save PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt/Report Canvas */}
        <div ref={printRef} className="p-6 sm:p-8 overflow-y-auto space-y-6 text-slate-800 print:p-0">
          {/* Header */}
          <div className="text-center space-y-1.5 pb-4 border-b-2 border-dashed border-slate-300">
            <div className="inline-flex items-center justify-center h-10 w-10 rounded-2xl bg-[#101827] text-white font-black text-sm mb-1">
              <span className="text-[#0D9668]">B</span>F
            </div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
              {data.businessName || "BizFlow Store"}
            </h1>
            <p className="text-xs font-bold text-[#0D9668] tracking-widest uppercase">
              End-of-Day Financial Z-Report
            </p>
            <div className="text-[11px] text-slate-500 space-y-0.5 font-mono">
              {data.tinNumber && <p>TIN: {data.tinNumber}</p>}
              {data.phone && <p>Tel: {data.phone}</p>}
              {data.address && <p>{data.address}</p>}
              <p className="font-sans text-slate-400 pt-1">
                {formattedDate} • {formattedTime} (EAT)
              </p>
              <p className="font-sans text-slate-600">
                Audited By: <strong className="text-slate-900">{data.operatorName}</strong> • Range:{" "}
                <span className="uppercase font-semibold">{data.dateRange}</span>
              </p>
            </div>
          </div>

          {/* Section 1: Sales & Revenue Breakdown */}
          <div className="space-y-2">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center justify-between border-b border-slate-200 pb-1">
              <span>1. Sales & Revenue Summary</span>
              <span>ጠቅላላ ሽያጭ</span>
            </h4>
            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-600 font-sans">Gross Sales Subtotal:</span>
                <span className="font-bold text-slate-900">{formatStoreMoney(data.subtotal || data.invoiced)}</span>
              </div>
              {data.discountTotal > 0 && (
                <div className="flex justify-between text-amber-700">
                  <span className="font-sans">Discounts Granted (-):</span>
                  <span className="font-bold">-{formatStoreMoney(data.discountTotal)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-700">
                <span className="font-sans">VAT / Tax Total (15% ተ.እ.ታ):</span>
                <span className="font-bold">{formatStoreMoney(data.taxTotal || 0)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200 text-sm font-black text-slate-900">
                <span className="font-sans">Total Invoiced (የተጣራ ገቢ):</span>
                <span className="text-[#0D9668]">{formatStoreMoney(data.invoiced)}</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 pt-0.5">
                <span className="font-sans">Completed POS Transactions:</span>
                <span className="font-bold text-slate-800">{data.salesCount} checkouts</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500">
                <span className="font-sans">Average Basket Size (AOV):</span>
                <span className="font-bold text-slate-800">{formatStoreMoney(data.avgOrderValue)}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Profitability & Operational Costs */}
          <div className="space-y-2">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center justify-between border-b border-slate-200 pb-1">
              <span>2. Profit & Cost Audit</span>
              <span>የትርፍና ወጪ ሂሳብ</span>
            </h4>
            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-600 font-sans">Product Cost (COGS / የግዢ ወጪ):</span>
                <span className="text-slate-800">{formatStoreMoney(data.cogs)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 font-sans">Gross Profit (ጥቅል ትርፍ):</span>
                <span className="font-bold text-[#0D9668]">
                  {formatStoreMoney(data.grossProfit)} ({data.grossMarginPercentage}%)
                </span>
              </div>
              <div className="flex justify-between text-red-700">
                <span className="font-sans">Operating Expenses (የሥራ ማስኬጃ):</span>
                <span>-{formatStoreMoney(data.expenses)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200 text-xs font-black">
                <span className="font-sans text-slate-900">Net Operating Profit (የተጣራ ትርፍ):</span>
                <span
                  className={data.netOperatingProfit >= 0 ? "text-[#0D9668]" : "text-red-600"}
                >
                  {formatStoreMoney(data.netOperatingProfit)}
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Collections by Payment Channel */}
          <div className="space-y-2">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center justify-between border-b border-slate-200 pb-1">
              <span>3. Payment Channel Breakdown</span>
              <span>የክፍያ ዓይነቶች</span>
            </h4>
            <div className="space-y-1.5 text-xs font-mono">
              {data.paymentMethods.map((pm) => (
                <div key={pm.method} className="flex justify-between items-center">
                  <span className="font-sans text-slate-700 flex items-center gap-1.5">
                    {pm.method === "TELEBIRR" && <Smartphone className="h-3.5 w-3.5 text-[#005BAC]" />}
                    {pm.method === "CBE_BIRR" && <CreditCard className="h-3.5 w-3.5 text-[#702382]" />}
                    {pm.method === "CASH" && <Banknote className="h-3.5 w-3.5 text-[#0D9668]" />}
                    {pm.method === "BANK_TRANSFER" && <Building className="h-3.5 w-3.5 text-slate-600]" />}
                    {pm.method === "OTHER" && <BookOpen className="h-3.5 w-3.5 text-orange-600" />}
                    <span>{pm.method}</span>
                    {pm.count !== undefined && (
                      <span className="text-[10px] text-slate-400 font-sans">
                        ({pm.count} txns)
                      </span>
                    )}
                  </span>
                  <span className="font-bold text-slate-900">
                    {formatStoreMoney(pm.amount)} ({pm.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Cash Drawer Balancing */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center justify-between">
              <span>4. Cash Drawer Reconciliation</span>
              <span>የካሳ ማጠቃለያ</span>
            </h4>
            <div className="space-y-1 text-xs font-mono">
              <div className="flex justify-between">
                <span className="font-sans text-slate-600">Cash Collections In Till:</span>
                <span className="font-bold text-slate-900">{formatStoreMoney(data.cashCollected)}</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span className="font-sans">Less Expenses Paid via Till (-):</span>
                <span>-{formatStoreMoney(data.expenses)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-slate-900">
                <span className="font-sans">Expected Closing Cash in Till:</span>
                <span className="text-[#0D9668]">{formatStoreMoney(data.expectedCashInTill)}</span>
              </div>
              {data.countedCash !== undefined && (
                <>
                  <div className="flex justify-between pt-1 border-t border-dashed border-slate-300">
                    <span className="font-sans text-slate-700">Physical Cash Counted:</span>
                    <span className="font-bold">{formatStoreMoney(data.countedCash)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs pt-0.5">
                    <span className="font-sans text-slate-700 font-bold">Drawer Variance (ልዩነት):</span>
                    <span
                      className={`font-black ${
                        cashVariance === 0
                          ? "text-emerald-600"
                          : cashVariance && cashVariance > 0
                          ? "text-blue-600"
                          : "text-red-600"
                      }`}
                    >
                      {cashVariance === 0
                        ? "Exact Match (Balanced)"
                        : cashVariance && cashVariance > 0
                        ? `+${formatStoreMoney(cashVariance)} (Over)`
                        : `${formatStoreMoney(cashVariance || 0)} (Short)`}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Section 5: Official Sign-Off Block */}
          <div className="pt-6 border-t border-slate-300 grid grid-cols-2 gap-8 text-xs font-mono">
            <div className="space-y-4">
              <p className="font-sans text-slate-600 font-medium">Prepared by (Cashier):</p>
              <div className="border-b border-dashed border-slate-400 h-8" />
              <p className="text-[10px] text-slate-400 font-sans">Signature / Date</p>
            </div>
            <div className="space-y-4">
              <p className="font-sans text-slate-600 font-medium">Verified by (Manager / Owner):</p>
              <div className="border-b border-dashed border-slate-400 h-8" />
              <p className="text-[10px] text-slate-400 font-sans">Signature / Date</p>
            </div>
          </div>

          {/* Footer Notice */}
          <div className="text-center text-[10px] text-slate-400 pt-2 border-t border-slate-200">
            Generated securely by BizFlow Ethiopia Cloud POS • EAT UTC+3 Timestamp
          </div>
        </div>
      </div>
    </div>
  );
}
