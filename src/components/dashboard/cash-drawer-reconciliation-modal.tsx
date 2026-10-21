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
  onGenerateZReport: (countedCash: number) => void;
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

  // Expected cash in drawer = Starting float + Cash Sales - Expenses paid from till
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

  const handleApplyToZReport = () => {
    onGenerateZReport(totalCounted);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-xl my-6 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#0D9668]/10 text-[#0D9668]">
              <Banknote className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                Cash Drawer Reconciliation / የካሳ ማጠቃለያ
              </h3>
              <p className="text-xs text-slate-500">Physical Birr Cash Count & Till Balancing</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* 1. Expected Cash Summary Strip */}
          <div className="grid grid-cols-3 gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Cash Sales</p>
              <p className="text-sm font-black font-mono text-slate-900 mt-0.5">
                {formatStoreMoney(cashCollected)}
              </p>
              <p className="text-[10px] text-slate-400 font-sans mt-0.5">
                {cashSalesCount} completed txns
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Till Expenses</p>
              <p className="text-sm font-black font-mono text-red-600 mt-0.5">
                -{formatStoreMoney(expenses)}
              </p>
              <p className="text-[10px] text-slate-400 font-sans mt-0.5">Paid from drawer</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-[#0D9668]">Expected in Till</p>
              <p className="text-sm font-black font-mono text-[#0D9668] mt-0.5">
                {formatStoreMoney(totalExpectedCash)}
              </p>
              <p className="text-[10px] text-slate-400 font-sans mt-0.5">
                Incl. float ({startingFloat || 0})
              </p>
            </div>
          </div>

          {/* 2. Starting Float Input */}
          <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <div>
              <label htmlFor="starting-float" className="block text-xs font-bold text-slate-800">
                Opening Float (የጠዋት መነሻ ካሽ)
              </label>
              <p className="text-[10px] text-slate-400">Petty cash in register at start of day</p>
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
                className="w-full text-right font-mono font-bold text-xs p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-[#0D9668]"
              />
            </div>
          </div>

          {/* 3. Physical Counting Tool (Denominations vs Manual) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                <Calculator className="h-3.5 w-3.5 text-[#0D9668]" />
                Physical Banknote Count (የጥሬ ገንዘብ ቆጠራ)
              </span>
              <div className="flex items-center rounded-lg bg-slate-100 p-0.5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setUseDenominations(true)}
                  className={`px-2 py-0.5 rounded-md text-[11px] transition ${
                    useDenominations ? "bg-white font-bold text-slate-900 shadow-2xs" : "text-slate-500"
                  }`}
                >
                  By Notes
                </button>
                <button
                  type="button"
                  onClick={() => setUseDenominations(false)}
                  className={`px-2 py-0.5 rounded-md text-[11px] transition ${
                    !useDenominations ? "bg-white font-bold text-slate-900 shadow-2xs" : "text-slate-500"
                  }`}
                >
                  Total Direct
                </button>
              </div>
            </div>

            {useDenominations ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                {/* 200 ETB */}
                <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-600 font-bold">
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
                    className="mt-1.5 w-full text-right font-mono font-bold text-xs p-1.5 rounded-lg border border-slate-200 bg-white"
                  />
                </div>

                {/* 100 ETB */}
                <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-600 font-bold">
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
                    className="mt-1.5 w-full text-right font-mono font-bold text-xs p-1.5 rounded-lg border border-slate-200 bg-white"
                  />
                </div>

                {/* 50 ETB */}
                <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-600 font-bold">
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
                    className="mt-1.5 w-full text-right font-mono font-bold text-xs p-1.5 rounded-lg border border-slate-200 bg-white"
                  />
                </div>

                {/* 10 ETB */}
                <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-600 font-bold">
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
                    className="mt-1.5 w-full text-right font-mono font-bold text-xs p-1.5 rounded-lg border border-slate-200 bg-white"
                  />
                </div>

                {/* 5 ETB */}
                <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-600 font-bold">
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
                    className="mt-1.5 w-full text-right font-mono font-bold text-xs p-1.5 rounded-lg border border-slate-200 bg-white"
                  />
                </div>

                {/* Coins & Other */}
                <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-slate-600 font-bold">
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
                    className="mt-1.5 w-full text-right font-mono font-bold text-xs p-1.5 rounded-lg border border-slate-200 bg-white"
                  />
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                <label htmlFor="manual-cash-count" className="block text-xs font-bold text-slate-700 mb-1">
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
                  className="w-full text-right font-mono font-bold text-sm p-2.5 rounded-xl border border-slate-300 bg-white"
                />
              </div>
            )}
          </div>

          {/* 4. Variance Result Indicator Box */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              totalCounted === 0 && totalExpectedCash === 0
                ? "bg-slate-50 border-slate-200"
                : variance === 0
                ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                : variance > 0
                ? "bg-blue-50/70 border-blue-200 text-blue-900"
                : "bg-red-50/70 border-red-200 text-red-900"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Total Cash Counted
                </p>
                <p className="text-xl font-black font-mono mt-0.5">
                  {formatStoreMoney(totalCounted)}
                </p>
              </div>

              <div className="text-right">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
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
        <div className="p-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100 transition"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset Count
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 text-xs font-bold transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApplyToZReport}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0D9668] hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
            >
              <Printer className="h-3.5 w-3.5" />
              Generate Daily Z-Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
