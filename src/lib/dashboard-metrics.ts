import { roundMoney } from "@/lib/money";

const EAT_OFFSET_MS = 3 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export type DashboardRange = "today" | "7d" | "30d" | "month";

export interface DashboardSale {
  createdAt: Date;
  grandTotal: number | string | { toNumber(): number; toString(): string };
}

export function getEatDateBoundaries(range: DashboardRange, now = new Date()) {
  const eatNow = new Date(now.getTime() + EAT_OFFSET_MS);
  const currentDay = Date.UTC(
    eatNow.getUTCFullYear(),
    eatNow.getUTCMonth(),
    eatNow.getUTCDate()
  );
  const startDay =
    range === "month"
      ? Date.UTC(eatNow.getUTCFullYear(), eatNow.getUTCMonth(), 1)
      : currentDay - (range === "today" ? 0 : range === "7d" ? 6 : 29) * DAY_MS;

  return {
    startDate: new Date(startDay - EAT_OFFSET_MS),
    eatNow,
  };
}

function eatDayNumber(date: Date) {
  const eatDate = new Date(date.getTime() + EAT_OFFSET_MS);
  return Math.floor(
    Date.UTC(eatDate.getUTCFullYear(), eatDate.getUTCMonth(), eatDate.getUTCDate()) /
      DAY_MS
  );
}

function sumSales(sales: DashboardSale[]) {
  return {
    amount: roundMoney(sales.reduce((sum, sale) => sum + Number(sale.grandTotal), 0)),
    sales: sales.length,
  };
}

export function buildSalesChartData(
  range: DashboardRange,
  sales: DashboardSale[],
  now = new Date()
) {
  const { eatNow } = getEatDateBoundaries(range, now);
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const currentDayNumber = eatDayNumber(now);

  if (range === "today") {
    return Array.from({ length: 6 }, (_, index) => {
      const startHour = index * 4;
      const matchingSales = sales.filter((sale) => {
        const eatDate = new Date(sale.createdAt.getTime() + EAT_OFFSET_MS);
        return eatDate.getUTCHours() >= startHour && eatDate.getUTCHours() < startHour + 4;
      });

      return {
        day: `${String(startHour).padStart(2, "0")}:00`,
        ...sumSales(matchingSales),
      };
    });
  }

  if (range === "7d") {
    return Array.from({ length: 7 }, (_, index) => {
      const dayNumber = currentDayNumber - (6 - index);
      const date = new Date(dayNumber * DAY_MS);
      const matchingSales = sales.filter((sale) => eatDayNumber(sale.createdAt) === dayNumber);

      return {
        day: `${dayNames[date.getUTCDay()]} ${date.getUTCDate()}`,
        ...sumSales(matchingSales),
      };
    });
  }

  if (range === "30d") {
    return Array.from({ length: 6 }, (_, index) => {
      const oldestDaysAgo = (5 - index) * 5 + 4;
      const newestDaysAgo = (5 - index) * 5;
      const matchingSales = sales.filter((sale) => {
        const daysAgo = currentDayNumber - eatDayNumber(sale.createdAt);
        return daysAgo >= newestDaysAgo && daysAgo <= oldestDaysAgo;
      });
      const label =
        newestDaysAgo === 0
          ? "4d ago–Today"
          : `${oldestDaysAgo}–${newestDaysAgo}d ago`;

      return { day: label, ...sumSales(matchingSales) };
    });
  }

  const daysInMonth = new Date(
    Date.UTC(eatNow.getUTCFullYear(), eatNow.getUTCMonth() + 1, 0)
  ).getUTCDate();
  const weekCount = Math.ceil(daysInMonth / 7);

  return Array.from({ length: weekCount }, (_, index) => {
    const matchingSales = sales.filter((sale) => {
      const eatDate = new Date(sale.createdAt.getTime() + EAT_OFFSET_MS);
      return (
        eatDate.getUTCFullYear() === eatNow.getUTCFullYear() &&
        eatDate.getUTCMonth() === eatNow.getUTCMonth() &&
        Math.floor((eatDate.getUTCDate() - 1) / 7) === index
      );
    });

    return { day: `Wk ${index + 1}`, ...sumSales(matchingSales) };
  });
}

export function buildPaymentMethodBreakdown(amounts: Record<string, number>) {
  const entries = Object.entries(amounts).filter(([, amount]) => amount > 0);
  const total = entries.reduce((sum, [, amount]) => sum + amount, 0);
  if (total <= 0) return [];

  const shares = entries.map(([method, amount], index) => {
    const exactPercentage = (amount / total) * 100;
    return {
      method,
      amount: roundMoney(amount),
      percentage: Math.floor(exactPercentage),
      remainder: exactPercentage % 1,
      index,
    };
  });

  const remainingPercentage = 100 - shares.reduce((sum, share) => sum + share.percentage, 0);
  const remainderOrder = [...shares].sort(
    (a, b) => b.remainder - a.remainder || a.index - b.index
  );
  for (let index = 0; index < remainingPercentage; index += 1) {
    remainderOrder[index].percentage += 1;
  }
  return shares.map(({ method, amount, percentage }) => ({
    method,
    amount,
    percentage,
  }));
}
