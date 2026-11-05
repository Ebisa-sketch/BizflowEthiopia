"use client";

import React, { useState } from "react";
import {
  Banknote,
  X,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Printer,
  DollarSign,
  ArrowRight,
  Calculator,
  Loader2,
} from "lucide-react";
import { formatMoney } from "@/lib/money";

interface CashDrawerReconciliationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currency: string;
  cashCollected: number;
  cashSalesCount: number;
  expenses: number;
  expectedCashInTill: number;
  onGenerateZReport: (countedCash: number, startingFloat: number) => void;
}

export function CashDrawerReconciliationModal({
  isOpen,
  onClose,
  currency,
  cashCollected,
  cashSalesCount,
  expenses,
  expectedCashInTill,
  onGenerateZReport,
}: CashDrawerReconciliationModalProps) {
  const [startingFloat, setStartingFloat] = useState<string>("0");
  const [useDenominations, setUseDenominations] = useState<boolean>(true);
  const [isSavingShift, setIsSavingShift] = useState<boolean>(false);

  // Banknote counts
  const [n200, setN200] = useState<string>("");
  const [n100, setN100] = useState<string>("");
  const [n50, setN50] = useState<string>("");
  const [n10, setN10] = useState<string>("");
  const [n5, setN5] = useState<string>("");
  const [coins, setCoins] = useState<string>("");

  // Direct manual total
  const [manualCount, setManualCount] = useState<string>("");

  if (!isOpen) return null;

  const floatVal = Number(startingFloat) || 0;
  const countedFromNotes =
    (Number(n200) || 0) * 200 +
    (Number(n100) || 0) * 100 +
    (Number(n50) || 0) * 50 +
    (Number(n10) || 0) * 10 +
    (Number(n5) || 0) * 5 +
    (Number(coins) || 0);

  const totalCounted = useDenominations ? countedFromNotes : Number(manualCount) || 0;
  const totalExpectedCash = floatVal + expectedCashInTill;
  const variance = totalCounted - totalExpectedCash;

  const formatStoreMoney = (val: number) => formatMoney(val, { currency });

  const handleReset = () => {
    setN200("");
    setN100("");
    setN50("");
    setN10("");
    setN5("");
    setCoins("");
    setManualCount("");
    setStartingFloat("0");
  };

  const handleApplyToZReport = async () => {
    try {
      setIsSavingShift(true);
      // Persist the closed shift to DB if an open shift exists
      await fetch("/api/shifts/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actualCash: totalCounted,
          denominationCounts: useDenominations
            ? {
                n200: Number(n200) || 0,
                n100: Number(n100) || 0,
                n50: Number(n50) || 0,
                n10: Number(n10) || 0,
                n5: Number(n5) || 0,
                coins: Number(coins) || 0,
              }
            : null,
        }),
      }).catch(() => {
        // Continue to Z-report even if background persistence encounters error
      });
    } finally {
      setIsSavingShift(false);
      onGenerateZReport(totalCounted, floatVal);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 w-full max-w-xl my-6 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#0D9668]/10 text-[#0D9668]">
              <Banknote className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                Cash Drawer Reconciliation / የካሳ ማጠቃለያ
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Physical Birr Cash Count &amp; Till Balancing</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* 1. Expected Cash Summary Strip */}
          <div className="grid grid-cols-3 gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-750">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Cash Sales</p>
              <p className="text-sm font-black font-mono text-slate-900 dark:text-slate-100 mt-0.5">
                {formatStoreMoney(cashCollected)}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-sans mt-0.5">
                {cashSalesCount} completed txns
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Recorded Expenses</p>
              <p className="text-sm font-black font-mono text-slate-700 dark:text-slate-300 mt-0.5">
                {formatStoreMoney(expenses)}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-sans mt-0.5">All payment methods</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-[#0D9668]">Estimated in Till</p>
              <p className="text-sm font-black font-mono text-[#0D9668] mt-0.5">
                {formatStoreMoney(totalExpectedCash)}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-sans mt-0.5">
                Incl. float ({startingFloat || 0})
              </p>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Estimate includes cash sales and opening float. Physical count will be checked against this to identify any cash shortage or overage.
          </p>

          {/* 2. Starting Float Input */}
          <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-750 shadow-2xs">
            <div>
              <label htmlFor="starting-float" className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                Opening Float (የጠዋት መነሻ ካሽ)
              </label>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">Petty cash in register at start of day</p>
            </div>
            <div className="flex items-center gap-1.5 w-36">
              <span className="text-xs font-mono font-bold text-slate-400">{currency}</span>
              <input
                id="starting-float"
                type="number"
                min="0"
                step="50"
                value={startingFloat}
                onChange={(e) => setStartingFloat(e.target.value)}
                placeholder="0"
                className="w-full text-right font-mono font-bold text-xs p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#0D9668]"
              />
            </div>
          </div>

          {/* 3. Physical Counting Tool (Denominations vs Manual) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Calculator className="h-3.5 w-3.5 text-[#0D9668]" />
                Physical Banknote Count (የጥሬ ገንዘብ ቆጠራ)
              </span>
              <div className="flex items-center rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setUseDenominations(true)}
                  className={`px-2 py-0.5 rounded-md text-[11px] transition cursor-pointer ${
                    useDenominations
                      ? "bg-white dark:bg-slate-700 font-bold text-slate-900 dark:text-slate-100 shadow-2xs"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  By Notes
                </button>
                <button
                  type="button"
                  onClick={() => setUseDenominations(false)}
                  className={`px-2 py-0.5 rounded-md text-[11px] transition cursor-pointer ${
                    !useDenominations
                      ? "bg-white dark:bg-slate-700 font-bold text-slate-900 dark:text-slate-100 shadow-2xs"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  Total Direct
                </button>
              </div>
            </div>

            {useDenominations ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                {/* 200 ETB */}
                <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 font-bold">
                    <span>200 Birr</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      = {((Number(n200) || 0) * 200).toLocaleString()}
                    </span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    placeholder="0 pcs"
                    value={n200}
                    onChange={(e) => setN200(e.target.value)}
                    className="mt-1.5 w-full text-right font-mono font-bold text-xs p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                </div>

                {/* 100 ETB */}
                <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 font-bold">
                    <span>100 Birr</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      = {((Number(n100) || 0) * 100).toLocaleString()}
                    </span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    placeholder="0 pcs"
                    value={n100}
                    onChange={(e) => setN100(e.target.value)}
                    className="mt-1.5 w-full text-right font-mono font-bold text-xs p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                </div>

                {/* 50 ETB */}
                <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 font-bold">
                    <span>50 Birr</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      = {((Number(n50) || 0) * 50).toLocaleString()}
                    </span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    placeholder="0 pcs"
                    value={n50}
                    onChange={(e) => setN50(e.target.value)}
                    className="mt-1.5 w-full text-right font-mono font-bold text-xs p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                </div>

                {/* 10 ETB */}
                <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 font-bold">
                    <span>10 Birr</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      = {((Number(n10) || 0) * 10).toLocaleString()}
                    </span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    placeholder="0 pcs"
                    value={n10}
                    onChange={(e) => setN10(e.target.value)}
                    className="mt-1.5 w-full text-right font-mono font-bold text-xs p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                </div>

                {/* 5 ETB */}
                <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 font-bold">
                    <span>5 Birr</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      = {((Number(n5) || 0) * 5).toLocaleString()}
                    </span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    placeholder="0 pcs"
                    value={n5}
                    onChange={(e) => setN5(e.target.value)}
                    className="mt-1.5 w-full text-right font-mono font-bold text-xs p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                </div>

                {/* Coins & Other */}
                <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 font-bold">
                    <span>Coins / ሳንቲም</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      = {Number(coins) || 0}
                    </span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    placeholder="0 Birr"
                    value={coins}
                    onChange={(e) => setCoins(e.target.value)}
                    className="mt-1.5 w-full text-right font-mono font-bold text-xs p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-800/40">
                <label htmlFor="manual-cash-count" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Total Counted Cash in Drawer (ድምር የተቆጠረ ጥሬ ገንዘብ)
                </label>
                <input
                  id="manual-cash-count"
                  type="number"
                  min="0"
                  step="1"
                  value={manualCount}
                  onChange={(e) => setManualCount(e.target.value)}
                  placeholder="e.g. 4500"
                  className="w-full text-right font-mono font-bold text-sm p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                />
              </div>
            )}
          </div>

          {/* 4. Variance Result Indicator Box */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              totalCounted === 0 && totalExpectedCash === 0
                ? "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                : variance === 0
                ? "bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
                : variance > 0
                ? "bg-blue-50/70 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200"
                : "bg-red-50/70 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-900 dark:text-red-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Total Cash Counted
                </p>
                <p className="text-xl font-black font-mono mt-0.5 text-slate-900 dark:text-slate-100">
                  {formatStoreMoney(totalCounted)}
                </p>
              </div>

              <div className="text-right">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Variance (ልዩነት)
                </p>
                <div className="flex items-center justify-end gap-1.5 mt-0.5">
                  {variance === 0 && (totalCounted > 0 || totalExpectedCash > 0) && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-600 text-white">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Balanced (ትክክለኛ)
                    </span>
                  )}
                  {variance > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-600 text-white font-mono">
                      +{formatStoreMoney(variance)} Over (ትርፍ)
                    </span>
                  )}
                  {variance < 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-red-600 text-white font-mono">
                      {formatStoreMoney(variance)} Short (ጉድለት)
                    </span>
                  )}
                  {totalCounted === 0 && totalExpectedCash === 0 && (
                    <span className="text-xs font-mono font-bold text-slate-400">0.00 ETB</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset Count
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApplyToZReport}
              disabled={isSavingShift}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0D9668] hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isSavingShift ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Closing Shift...</span>
                </>
              ) : (
                <>
                  <Printer className="h-3.5 w-3.5" />
                  <span>Save &amp; Generate Z-Report</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
