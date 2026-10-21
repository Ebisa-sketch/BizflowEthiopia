"use client";

import React, { useState, useId } from "react";
import { TrendingUp, Plus, BarChart3, LineChart } from "lucide-react";
import Link from "next/link";
import { formatMoney } from "@/lib/money";

export interface SalesChartDataPoint {
  day: string;
  amount: number;
  profit?: number;
  sales: number;
}

interface SalesTrendChartProps {
  data: SalesChartDataPoint[];
  dateRange: "today" | "7d" | "30d" | "month";
  onRangeChange?: (range: "today" | "7d" | "30d" | "month") => void;
  currency?: string;
  totalInvoiced: number;
  initialChartType?: "area" | "bar";
}

export function SalesTrendChart({
  data,
  dateRange,
  onRangeChange,
  currency = "ETB",
  totalInvoiced,
  initialChartType = "area",
}: SalesTrendChartProps) {
  const [chartType, setChartType] = useState<"area" | "bar">(initialChartType);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const gradientId = useId();

  const formatStoreMoney = (val: number) => formatMoney(val, { currency });

  // Map each data point with sales & profit (default to ~35% margin if profit not provided)
  const chartPoints = data.map((d) => ({
    ...d,
    amount: d.amount,
    profit: d.profit !== undefined ? d.profit : Math.round(d.amount * 0.35),
  }));

  const rawMax = Math.max(0, ...chartPoints.map((d) => d.amount));
  const maxVal = rawMax > 0 ? Math.ceil(rawMax * 1.15) : 1000;
  const hasData = chartPoints.length > 0 && chartPoints.some((d) => d.amount > 0);

  // SVG dimensions
  const svgWidth = 650;
  const svgHeight = 220;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 35;
  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  // Compute coordinates for Sales points
  const salesCoords = chartPoints.map((d, index) => {
    const x =
      paddingLeft +
      (chartPoints.length > 1 ? (index / (chartPoints.length - 1)) * chartWidth : chartWidth / 2);
    const y = paddingTop + chartHeight - (maxVal > 0 ? (d.amount / maxVal) * chartHeight : 0);
    return { x, y, data: d };
  });

  // Compute coordinates for Profit points
  const profitCoords = chartPoints.map((d, index) => {
    const x =
      paddingLeft +
      (chartPoints.length > 1 ? (index / (chartPoints.length - 1)) * chartWidth : chartWidth / 2);
    const y = paddingTop + chartHeight - (maxVal > 0 ? (d.profit / maxVal) * chartHeight : 0);
    return { x, y, data: d };
  });

  // Build cubic bezier curve path
  const buildCurve = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return "";
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;

    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? 0 : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2 < pts.length ? i + 2 : i + 1];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return path;
  };

  const salesLine = buildCurve(salesCoords);
  const profitLine = buildCurve(profitCoords);

  const salesArea =
    salesCoords.length > 0
      ? `${salesLine} L ${salesCoords[salesCoords.length - 1].x} ${paddingTop + chartHeight} L ${salesCoords[0].x} ${paddingTop + chartHeight} Z`
      : "";

  const activeSalesPoint = hoveredIndex !== null ? salesCoords[hoveredIndex] : null;
  const activeProfitPoint = hoveredIndex !== null ? profitCoords[hoveredIndex] : null;

  // Y-axis tick values formatted cleanly
  const formatTickLabel = (val: number) => {
    if (val === 0) return "0";
    if (val >= 1000) return `${Math.round(val / 1000)}k`;
    return `${Math.round(val)}`;
  };

  const yTicks = [
    { label: formatTickLabel(maxVal), value: maxVal },
    { label: formatTickLabel(maxVal * 0.75), value: maxVal * 0.75 },
    { label: formatTickLabel(maxVal * 0.5), value: maxVal * 0.5 },
    { label: formatTickLabel(maxVal * 0.25), value: maxVal * 0.25 },
    { label: "0", value: 0 },
  ];

  return (
    <div className="bg-white dark:bg-slate-850 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-750 shadow-2xs space-y-4">
      {/* Header with Title, Chart View Toggle, Range Filter & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-[#00A86B] dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/40">
            {chartType === "bar" ? <BarChart3 className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                Sales Trend
              </h2>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase tracking-wider">
                {chartType === "bar" ? "Bar View" : "Curve View"}
              </span>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              {dateRange === "7d"
                ? "Daily sales for the last 7 days"
                : dateRange === "30d"
                ? "Sales aggregated for the last 30 days"
                : dateRange === "month"
                ? "Daily sales for this calendar month"
                : "Periodic sales throughout today"}
            </p>
          </div>
        </div>

        {/* Right Header: Legend, Chart Type Toggle & Range Filter */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Legend */}
          <div className="flex items-center gap-3 text-xs font-semibold mr-1">
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <span className="h-2 w-2 rounded-full bg-[#00A86B]" />
              Sales
            </span>
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <span className="h-2 w-2 rounded-full bg-[#2563EB]" />
              Profit
            </span>
          </div>

          {/* Chart Type Toggle: Line vs Bar */}
          <div className="inline-flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 text-xs font-bold shadow-2xs">
            <button
              type="button"
              onClick={() => setChartType("area")}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                chartType === "area"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
              title="Smooth Line & Area Curve"
            >
              <LineChart className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Line</span>
            </button>
            <button
              type="button"
              onClick={() => setChartType("bar")}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                chartType === "bar"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
              title="Grouped Dual Bar Chart"
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Bar</span>
            </button>
          </div>

          {/* Range Buttons (Today, 7 Days, 30 Days, This Month) */}
          {onRangeChange && (
            <div className="inline-flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 text-xs font-bold shadow-2xs">
              <button
                type="button"
                onClick={() => onRangeChange("today")}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  dateRange === "today"
                    ? "bg-[#101827] dark:bg-emerald-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => onRangeChange("7d")}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  dateRange === "7d"
                    ? "bg-[#101827] dark:bg-emerald-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                }`}
              >
                7 Days
              </button>
              <button
                type="button"
                onClick={() => onRangeChange("30d")}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  dateRange === "30d"
                    ? "bg-[#101827] dark:bg-emerald-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                }`}
              >
                30 Days
              </button>
              <button
                type="button"
                onClick={() => onRangeChange("month")}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  dateRange === "month"
                    ? "bg-[#101827] dark:bg-emerald-600 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                }`}
              >
                Month
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Dual Chart Canvas (Line / Bar) */}
      {!hasData ? (
        <div className="h-52 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/30 flex flex-col items-center justify-center p-6 text-center">
          <p className="text-xs font-bold text-slate-700 dark:text-slate-200">No transactions recorded in this period</p>
          <p className="text-[11px] text-slate-400 max-w-sm mt-0.5">
            Complete sales in the POS Terminal to populate live trend charts.
          </p>
          <Link
            href="/sales/new"
            className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#00A86B] text-white text-xs font-bold hover:bg-emerald-700 transition shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            New Sale
          </Link>
        </div>
      ) : (
        <div className="relative pt-1">
          {/* Floating Hover Tooltip */}
          {hoveredIndex !== null && chartPoints[hoveredIndex] && (
            <div
              className="absolute z-30 pointer-events-none transition-all duration-150 transform -translate-x-1/2 -top-2"
              style={{
                left: `${(
                  (chartType === "bar"
                    ? (paddingLeft + (hoveredIndex + 0.5) * (chartWidth / chartPoints.length))
                    : (salesCoords[hoveredIndex]?.x ?? 0)) / svgWidth
                ) * 100}%`,
              }}
            >
              <div className="bg-slate-900/95 dark:bg-slate-950 text-white rounded-xl px-3.5 py-2.5 text-xs shadow-xl border border-slate-700 dark:border-slate-800 backdrop-blur-md min-w-[140px] whitespace-nowrap space-y-1.5">
                <div className="flex items-center justify-between gap-3 text-[10px] font-bold text-slate-400 border-b border-slate-800 pb-1">
                  <span>{chartPoints[hoveredIndex].day}</span>
                  {chartPoints[hoveredIndex].amount > 0 && (
                    <span className="text-emerald-400 font-mono">
                      {Math.round(((chartPoints[hoveredIndex].profit || 0) / chartPoints[hoveredIndex].amount) * 100)}% Margin
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#00A86B]" />
                    Sales:
                  </span>
                  <span className="font-mono font-bold text-white">
                    {formatStoreMoney(chartPoints[hoveredIndex].amount)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#2563EB]" />
                    Profit:
                  </span>
                  <span className="font-mono font-bold text-blue-300">
                    {formatStoreMoney(chartPoints[hoveredIndex].profit || 0)}
                  </span>
                </div>
                {chartPoints[hoveredIndex].sales > 0 && (
                  <div className="flex items-center justify-between gap-3 text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                    <span>Orders:</span>
                    <span className="font-mono font-semibold text-slate-200">
                      {chartPoints[hoveredIndex].sales}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SVG Chart Canvas */}
          <div className="h-56 relative w-full">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              preserveAspectRatio="none"
              className="w-full h-full overflow-visible"
            >
              <defs>
                {/* Emerald Gradient for Sales Line Area */}
                <linearGradient id={`${gradientId}-sales`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00A86B" stopOpacity="0.22" />
                  <stop offset="60%" stopColor="#00A86B" stopOpacity="0.05" />
                  <stop offset="100%" stopColor="#00A86B" stopOpacity="0" />
                </linearGradient>

                {/* Emerald Gradient for Sales Bar */}
                <linearGradient id={`${gradientId}-bar-sales`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00A86B" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>

                {/* Blue Gradient for Profit Bar */}
                <linearGradient id={`${gradientId}-bar-profit`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#2563EB" />
                </linearGradient>
              </defs>

              {/* Horizontal Y-Axis Gridlines & Labels */}
              {yTicks.map((tick) => {
                const yPos =
                  paddingTop + chartHeight - (maxVal > 0 ? (tick.value / maxVal) * chartHeight : 0);
                return (
                  <g key={tick.label}>
                    <text
                      x={paddingLeft - 8}
                      y={yPos + 3}
                      textAnchor="end"
                      className="text-[10px] fill-slate-400 dark:fill-slate-500 font-mono"
                    >
                      {tick.label}
                    </text>
                    <line
                      x1={paddingLeft}
                      y1={yPos}
                      x2={svgWidth - paddingRight}
                      y2={yPos}
                      className="stroke-slate-100 dark:stroke-slate-800"
                      strokeWidth="1"
                    />
                  </g>
                );
              })}

              {/* --- MODE 1: AREA & LINE CURVES --- */}
              {chartType === "area" && (
                <g>
                  {/* Sales Shaded Area Fill */}
                  {salesArea && (
                    <path d={salesArea} fill={`url(#${gradientId}-sales)`} className="transition-all" />
                  )}

                  {/* Profit Line (Blue) */}
                  {profitLine && (
                    <path
                      d={profitLine}
                      fill="none"
                      stroke="#2563EB"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="transition-all"
                    />
                  )}

                  {/* Sales Line (Emerald) */}
                  {salesLine && (
                    <path
                      d={salesLine}
                      fill="none"
                      stroke="#00A86B"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="transition-all"
                    />
                  )}

                  {/* Vertical Guide Line on Hover */}
                  {activeSalesPoint && (
                    <line
                      x1={activeSalesPoint.x}
                      y1={paddingTop}
                      x2={activeSalesPoint.x}
                      y2={paddingTop + chartHeight}
                      stroke="#94a3b8"
                      strokeWidth="1"
                      strokeDasharray="3 3"
                    />
                  )}

                  {/* Interactive Points on Sales & Profit */}
                  {chartPoints.map((_, idx) => {
                    const sPt = salesCoords[idx];
                    const pPt = profitCoords[idx];
                    const isHovered = hoveredIndex === idx;

                    return (
                      <g key={`point-${sPt.data.day}-${idx}`}>
                        {/* Profit Dot */}
                        <circle
                          cx={pPt.x}
                          cy={pPt.y}
                          r={isHovered ? 4.5 : 3.5}
                          fill="#2563EB"
                          stroke="#ffffff"
                          strokeWidth="1.5"
                          className="transition-all"
                        />

                        {/* Sales Dot */}
                        <circle
                          cx={sPt.x}
                          cy={sPt.y}
                          r={isHovered ? 5.5 : 4}
                          fill="#00A86B"
                          stroke="#ffffff"
                          strokeWidth="2"
                          className="transition-all"
                        />

                        {/* X-Axis Day Label */}
                        <text
                          x={sPt.x}
                          y={paddingTop + chartHeight + 18}
                          textAnchor="middle"
                          className={`text-[10px] font-mono transition-colors ${
                            isHovered ? "font-bold fill-slate-900 dark:fill-white" : "fill-slate-400 dark:fill-slate-500"
                          }`}
                        >
                          {sPt.data.day}
                        </text>

                        {/* Hitbox */}
                        <rect
                          x={sPt.x - chartWidth / (chartPoints.length * 2)}
                          y={0}
                          width={chartWidth / chartPoints.length}
                          height={svgHeight}
                          fill="transparent"
                          className="cursor-pointer"
                          onMouseEnter={() => setHoveredIndex(idx)}
                          onMouseLeave={() => setHoveredIndex(null)}
                          onTouchStart={() => setHoveredIndex(idx)}
                          tabIndex={0}
                          aria-label={`${sPt.data.day}: Sales ${formatStoreMoney(sPt.data.amount)}, Profit ${formatStoreMoney(sPt.data.profit)}`}
                        />
                      </g>
                    );
                  })}
                </g>
              )}

              {/* --- MODE 2: GROUPED BAR CHART --- */}
              {chartType === "bar" && (
                <g>
                  {chartPoints.map((d, idx) => {
                    const bandWidth = chartWidth / chartPoints.length;
                    const bandCenterX = paddingLeft + (idx + 0.5) * bandWidth;
                    const groupWidth = Math.min(Math.max(bandWidth * 0.56, 12), 44);
                    const barGap = 3;
                    const singleBarWidth = Math.max((groupWidth - barGap) / 2, 4);

                    const salesHeight = Math.max(0, maxVal > 0 ? (d.amount / maxVal) * chartHeight : 0);
                    const salesY = paddingTop + chartHeight - salesHeight;
                    const salesX = bandCenterX - groupWidth / 2;

                    const profitHeight = Math.max(0, maxVal > 0 ? ((d.profit || 0) / maxVal) * chartHeight : 0);
                    const profitY = paddingTop + chartHeight - profitHeight;
                    const profitX = salesX + singleBarWidth + barGap;

                    const isHovered = hoveredIndex === idx;

                    return (
                      <g key={`bar-${d.day}-${idx}`}>
                        {/* Column Hover Backdrop */}
                        {isHovered && (
                          <rect
                            x={paddingLeft + idx * bandWidth + 2}
                            y={paddingTop}
                            width={bandWidth - 4}
                            height={chartHeight}
                            className="fill-slate-500/10 dark:fill-slate-400/10 transition-colors"
                            rx={6}
                          />
                        )}

                        {/* Sales Bar (Emerald) */}
                        {salesHeight > 0 && (
                          <rect
                            x={salesX}
                            y={salesY}
                            width={singleBarWidth}
                            height={salesHeight}
                            fill={`url(#${gradientId}-bar-sales)`}
                            rx={3.5}
                            className={`transition-all duration-150 ${
                              isHovered ? "opacity-100" : "opacity-90"
                            }`}
                          />
                        )}

                        {/* Profit Bar (Blue) */}
                        {profitHeight > 0 && (
                          <rect
                            x={profitX}
                            y={profitY}
                            width={singleBarWidth}
                            height={profitHeight}
                            fill={`url(#${gradientId}-bar-profit)`}
                            rx={3.5}
                            className={`transition-all duration-150 ${
                              isHovered ? "opacity-100" : "opacity-90"
                            }`}
                          />
                        )}

                        {/* X-Axis Day Label */}
                        <text
                          x={bandCenterX}
                          y={paddingTop + chartHeight + 18}
                          textAnchor="middle"
                          className={`text-[10px] font-mono transition-colors ${
                            isHovered ? "font-bold fill-slate-900 dark:fill-white" : "fill-slate-400 dark:fill-slate-500"
                          }`}
                        >
                          {d.day}
                        </text>

                        {/* Interactive Hitbox */}
                        <rect
                          x={paddingLeft + idx * bandWidth}
                          y={0}
                          width={bandWidth}
                          height={svgHeight}
                          fill="transparent"
                          className="cursor-pointer"
                          onMouseEnter={() => setHoveredIndex(idx)}
                          onMouseLeave={() => setHoveredIndex(null)}
                          onTouchStart={() => setHoveredIndex(idx)}
                          tabIndex={0}
                          aria-label={`${d.day}: Sales ${formatStoreMoney(d.amount)}, Profit ${formatStoreMoney(d.profit)}`}
                        />
                      </g>
                    );
                  })}
                </g>
              )}
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
