import {
  ReportDataRow,
  RegistrationReportDataRow,
  OrderReportDataRow,
} from "@/interfaces/report";
import { formatAmount } from "@/data/currencies";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ComposedChart,
  Bar,
  Line,
} from "recharts";

// Modern, soft color palette for charts
const CHART_COLORS = {
  revenue: {
    stroke: "#6366f1",
    gradientFrom: "#818cf8",
    gradientTo: "#e0e7ff",
    fill: "#6366f1",
  },
  pendingRevenue: {
    stroke: "#a5b4fc",
    gradientFrom: "#c7d2fe",
    gradientTo: "#f1f5f9",
    fill: "#a5b4fc",
  },
  registered: { fill: "#10b981", stroke: "#059669" },
  deregistered: { fill: "#f43f5e", stroke: "#e11d48" },
  total: { fill: "#2dd4bf", stroke: "#0d9488" },
  pending: { fill: "#fbbf24", stroke: "#d97706" },
  paid: { stroke: "#7c3aed" },
  due: { stroke: "#a78bfa" },
};

function formatMonthLabel(date: string) {
  try {
    const d = new Date(date);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString(undefined, {
        month: "short",
        year: "2-digit",
      });
    }
  } catch {}
  return date;
}

// --- Modern Tooltip ---
function ModernTooltip({
  active,
  payload,
  label,
  currency,
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
  currency: string;
}) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 shadow-xl px-4 py-3 min-w-[180px]">
        <div className="font-semibold text-xs text-slate-700 dark:text-slate-200 mb-2">
          {label}
        </div>
        <div className="space-y-1">
          {payload.map((entry, idx) => {
            const isMoney =
              typeof entry.value === "number" &&
              entry.dataKey?.toLowerCase().includes("revenue");
            const displayValue = isMoney
              ? formatAmount(Number(entry.value), currency)
              : entry.value;
            return (
              <div key={idx} className="flex items-center gap-2 text-xs">
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="font-medium">{entry.name}:</span>
                <span className="ml-auto">{displayValue}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
}

// --- Modern Legend Formatter ---
function legendFormatter(value: string) {
  return (
    <span className="px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200">
      {value}
    </span>
  );
}

// --- Revenue Area Chart ---
export function RevenueAreaChart({
  data,
  currency,
}: {
  data: ReportDataRow[];
  currency: string;
}) {
  const chartData = data.map((d) => ({
    name: formatMonthLabel(d.date),
    revenue: d.total_revenue,
    pending: d.total_pending_revenue,
  }));

  return (
    <div className="w-full h-80 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 16, right: 48, left: 24, bottom: 32 }}
        >
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor={CHART_COLORS.revenue.gradientFrom}
                stopOpacity={0.7}
              />
              <stop
                offset="95%"
                stopColor={CHART_COLORS.revenue.gradientTo}
                stopOpacity={0.1}
              />
            </linearGradient>
            <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor={CHART_COLORS.pendingRevenue.gradientFrom}
                stopOpacity={0.6}
              />
              <stop
                offset="95%"
                stopColor={CHART_COLORS.pendingRevenue.gradientTo}
                stopOpacity={0.08}
              />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 13, fill: "#64748b" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 13, fill: "#64748b" }}
            tickFormatter={(v) => formatAmount(Number(v), currency)}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<ModernTooltip currency={currency} />} />
          <Legend formatter={legendFormatter} iconType="circle" />
          <Area
            type="monotone"
            dataKey="revenue"
            name="Revenue"
            stroke={CHART_COLORS.revenue.stroke}
            fill="url(#colorRevenue)"
            strokeWidth={3}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Area
            type="monotone"
            dataKey="pending"
            name="Pending Revenue"
            stroke={CHART_COLORS.pendingRevenue.stroke}
            fill="url(#colorPending)"
            strokeWidth={3}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// --- Registration Combo Chart ---
export function RegistrationComboChart({
  data,
  currency,
}: {
  data: RegistrationReportDataRow[];
  currency: string;
}) {
  const chartData = data.map((d) => ({
    name: formatMonthLabel(d.date),
    registered: d.total_registered_members,
    pendingMembers: d.total_pending_members,
    revenue: d.total_revenue,
    pending: d.total_pending_revenue,
  }));

  return (
    <div className="w-full h-80 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-4">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{ top: 16, right: 48, left: 24, bottom: 32 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 13, fill: "#64748b" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 13, fill: "#64748b" }}
            tickFormatter={(v) => formatAmount(Number(v), currency)}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 13, fill: "#64748b" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<ModernTooltip currency={currency} />} />
          <Legend formatter={legendFormatter} iconType="circle" />
          <Bar
            yAxisId="left"
            dataKey="revenue"
            name="Revenue"
            fill={CHART_COLORS.registered.fill}
            stroke={CHART_COLORS.registered.stroke}
            strokeWidth={1.5}
            radius={[8, 8, 0, 0]}
            barSize={24}
          />
          <Bar
            yAxisId="left"
            dataKey="pending"
            name="Pending Revenue"
            fill={CHART_COLORS.deregistered.fill}
            stroke={CHART_COLORS.deregistered.stroke}
            strokeWidth={1.5}
            radius={[8, 8, 0, 0]}
            barSize={24}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="registered"
            name="Completed Registrations"
            stroke={CHART_COLORS.revenue.stroke}
            strokeWidth={3}
            dot={false}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="pendingMembers"
            name="Pending Members"
            stroke={CHART_COLORS.pendingRevenue.stroke}
            strokeWidth={3}
            dot={false}
            strokeDasharray="6 4"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// --- Overall Combo Chart ---
export function OverallComboChart({
  data,
  currency,
}: {
  data: ReportDataRow[];
  currency: string;
}) {
  const chartData = data.map((d) => ({
    name: formatMonthLabel(d.date),
    revenue: d.total_revenue,
    pending: d.total_pending_revenue,
  }));

  return (
    <div className="w-full h-80 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-4">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{ top: 16, right: 48, left: 24, bottom: 32 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 13, fill: "#64748b" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 13, fill: "#64748b" }}
            tickFormatter={(v) => formatAmount(Number(v), currency)}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<ModernTooltip currency={currency} />} />
          <Legend formatter={legendFormatter} iconType="circle" />
          <Bar
            dataKey="revenue"
            name="Revenue"
            fill={CHART_COLORS.revenue.fill}
            stroke={CHART_COLORS.revenue.stroke}
            strokeWidth={1.5}
            radius={[8, 8, 0, 0]}
            barSize={24}
          />
          <Bar
            dataKey="pending"
            name="Pending Revenue"
            fill={CHART_COLORS.pendingRevenue.fill}
            stroke={CHART_COLORS.pendingRevenue.stroke}
            strokeWidth={1.5}
            radius={[8, 8, 0, 0]}
            barSize={24}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// --- Orders Combo Chart ---
export function OrdersComboChart({
  data,
  currency,
}: {
  data: OrderReportDataRow[];
  currency: string;
}) {
  const chartData = data.map((d) => ({
    name: formatMonthLabel(d.date),
    revenue: d.total_revenue,
    pending: d.total_pending_revenue,
    itemsSold: d.total_shop_sold_items,
    pendingItems: d.total_shop_pending_sold_items,
  }));

  return (
    <div className="w-full h-80 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-4">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{ top: 16, right: 48, left: 24, bottom: 32 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 13, fill: "#64748b" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 13, fill: "#64748b" }}
            tickFormatter={(v) => formatAmount(Number(v), currency)}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 13, fill: "#64748b" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<ModernTooltip currency={currency} />} />
          <Legend formatter={legendFormatter} iconType="circle" />
          <Bar
            yAxisId="left"
            dataKey="revenue"
            name="Revenue"
            fill={CHART_COLORS.registered.fill}
            stroke={CHART_COLORS.registered.stroke}
            strokeWidth={1.5}
            radius={[8, 8, 0, 0]}
            barSize={24}
          />
          <Bar
            yAxisId="left"
            dataKey="pending"
            name="Pending Revenue"
            fill={CHART_COLORS.deregistered.fill}
            stroke={CHART_COLORS.deregistered.stroke}
            strokeWidth={1.5}
            radius={[8, 8, 0, 0]}
            barSize={24}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="itemsSold"
            name="Items Sold"
            stroke={CHART_COLORS.revenue.stroke}
            strokeWidth={3}
            dot={false}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="pendingItems"
            name="Pending Items"
            stroke={CHART_COLORS.pendingRevenue.stroke}
            strokeWidth={3}
            dot={false}
            strokeDasharray="6 4"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
// --- Registration Billing Chart ---
type RegistrationBillingItem = {
  date: string;
  total: number;
  paid_to_club: number;
  pending: number;
  due_to_club: number;
};

type RegistrationBillingChartProps = {
  data: RegistrationBillingItem[];
  currency: string;
};

function RegistrationBillingTooltip({
  active,
  payload,
  label,
  currency,
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
  currency: string;
}) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 shadow-xl px-4 py-3 min-w-[180px]">
        <div className="font-semibold text-xs text-slate-700 dark:text-slate-200 mb-2">
          {label}
        </div>
        <div className="space-y-1">
          {payload.map((entry, idx) => {
            const isMoney = ["Paid", "Due", "Total", "Pending"].includes(
              entry.name,
            );
            const displayValue = isMoney
              ? formatAmount(Number(entry.value), currency)
              : entry.value;
            return (
              <div key={idx} className="flex items-center gap-2 text-xs">
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="font-medium">{entry.name}:</span>
                <span className="ml-auto">{displayValue}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
}

export function RegistrationBillingChart({
  data,
  currency,
}: RegistrationBillingChartProps) {
  const chartData = data.map((d) => ({
    name: formatMonthLabel(d.date),
    total: d.total,
    paid: d.paid_to_club,
    pending: d.pending,
    due: d.due_to_club,
  }));

  return (
    <div className="w-full h-64 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-4">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{ top: 16, right: 48, left: 24, bottom: 32 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 13, fill: "#64748b" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 13, fill: "#64748b" }}
            tickFormatter={(v) => formatAmount(Number(v), currency)}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 13, fill: "#64748b" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={<RegistrationBillingTooltip currency={currency} />}
          />
          <Legend formatter={legendFormatter} iconType="circle" />
          <Bar
            yAxisId="left"
            dataKey="paid"
            name="Paid"
            fill="#10b981"
            stroke="#059669"
            strokeWidth={1.5}
            radius={[8, 8, 0, 0]}
            barSize={24}
          />
          <Bar
            yAxisId="left"
            dataKey="due"
            name="Due"
            fill="#f43f5e"
            stroke="#e11d48"
            strokeWidth={1.5}
            radius={[8, 8, 0, 0]}
            barSize={24}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="total"
            name="Total"
            stroke="#7c3aed"
            strokeWidth={3}
            dot={false}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="pending"
            name="Pending"
            stroke="#a78bfa"
            strokeWidth={3}
            dot={false}
            strokeDasharray="6 4"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
