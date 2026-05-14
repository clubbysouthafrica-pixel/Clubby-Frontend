import {
  ReportDataRow,
  RegistrationReportDataRow,
} from "@/interfaces/report";
import { formatAmount } from "@/data/currencies";
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ComposedChart,
  Bar,
} from "recharts";

// Neutral chart palette with restrained highlights.
const CHART_COLORS = {
  revenue: {
    stroke: "#57534e",
    gradientFrom: "#78716c",
    gradientTo: "#f5f5f4",
    fill: "#78716c",
  },
  pendingRevenue: {
    stroke: "#a8a29e",
    gradientFrom: "#d6d3d1",
    gradientTo: "#fafaf9",
    fill: "#d6d3d1",
  },
  expense: {
    stroke: "#b91c1c",
    gradientFrom: "#fecaca",
    gradientTo: "#fff1f2",
    fill: "#f87171",
  },
  registered: { fill: "#78716c", stroke: "#57534e" },
  deregistered: { fill: "#d6d3d1", stroke: "#a8a29e" },
  total: { fill: "#a8a29e", stroke: "#78716c" },
  pending: { fill: "#e7e5e4", stroke: "#a8a29e" },
  paid: { stroke: "#44403c" },
  due: { stroke: "#a8a29e" },
};

function InsightRail({
  items,
}: {
  items: Array<{ label: string; value: string | number; note?: string }>;
}) {
  return (
    <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-1">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-[14px] border border-stone-200 bg-stone-50/90 p-2"
        >
          <p className="text-[10px] uppercase tracking-[0.18em] text-stone-500">
            {item.label}
          </p>
          <p className="mt-1 text-sm font-semibold text-stone-900 md:text-[15px]">
            {item.value}
          </p>
          {item.note && (
            <p className="mt-0.5 text-[11px] text-stone-500">{item.note}</p>
          )}
        </div>
      ))}
    </div>
  );
}

function getChartMinHeight() {
  return 196;
}

function ChartShell({
  title,
  subtitle,
  insights,
  children,
}: {
  title: string;
  subtitle: string;
  insights: Array<{ label: string; value: string | number; note?: string }>;
  children: React.ReactNode;
}) {
  const chartMinHeight = getChartMinHeight();

  return (
    <div className="rounded-[18px] border border-stone-200 bg-gradient-to-br from-white via-stone-50 to-white p-3 shadow-sm md:p-3.5">
      <div className="mb-2.5 flex flex-col gap-0.5">
        <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-600">
          {title}
        </h3>
        <p className="text-[11px] text-stone-500">{subtitle}</p>
      </div>
      <div className="grid gap-2.5 lg:grid-cols-[minmax(0,1fr)_176px] lg:items-stretch">
        <div className="rounded-[16px] border border-stone-200 bg-white p-2 md:p-2.5 lg:h-full">
          <div
            className="h-full w-full"
            style={{ minHeight: `${chartMinHeight}px` }}
          >
            {children}
          </div>
        </div>
        <InsightRail items={insights} />
      </div>
    </div>
  );
}

function EmptyChartState() {
  return (
    <div className="flex h-full min-h-[168px] items-center justify-center rounded-[14px] border border-dashed border-stone-200 bg-stone-50/60 text-center text-sm text-stone-500">
      No data for now
    </div>
  );
}

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

function getMonthSortValue(date: string) {
  const normalizedDate = /^\d{4}-\d{2}$/.test(date) ? `${date}-01` : date;
  const parsedTime = new Date(normalizedDate).getTime();

  if (!Number.isNaN(parsedTime)) {
    return parsedTime;
  }

  return Number.MAX_SAFE_INTEGER;
}

function sortMonthlyRows<T extends { date: string }>(rows: T[]) {
  return [...rows].sort(
    (left, right) => getMonthSortValue(left.date) - getMonthSortValue(right.date),
  );
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
              (entry.dataKey?.toLowerCase().includes("revenue") ||
                entry.dataKey?.toLowerCase().includes("pending") ||
                entry.dataKey?.toLowerCase().includes("expense"));
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

// --- Registration Combo Chart ---
export function RegistrationComboChart({
  data,
  currency,
}: {
  data: RegistrationReportDataRow[];
  currency: string;
}) {
  const orderedData = sortMonthlyRows(data);
  const hasData = orderedData.length > 0;

  const chartData = orderedData.map((d) => ({
    name: formatMonthLabel(d.date),
    revenue: d.total_revenue,
    pending: d.total_pending_revenue,
  }));

  const totalRevenue = orderedData.reduce((sum, row) => sum + row.total_revenue, 0);
  const totalPendingRevenue = orderedData.reduce(
    (sum, row) => sum + row.total_pending_revenue,
    0,
  );
  const strongestMonth = orderedData.reduce<RegistrationReportDataRow | null>(
    (best, current) => {
      if (!best) {
        return current;
      }

      return current.total_revenue > best.total_revenue ? current : best;
    },
    null,
  );

  return (
    <ChartShell
      title="Registration Revenue Trend"
      subtitle="A simple monthly view of collected and pending registration revenue."
      insights={[
        {
          label: "Revenue",
          value: formatAmount(totalRevenue, currency),
          note: "Collected across the selected season",
        },
        {
          label: "Pending revenue",
          value: formatAmount(totalPendingRevenue, currency),
          note: "Outstanding registration balance",
        },
        {
          label: "Best month",
          value: strongestMonth ? strongestMonth.date : "-",
          note: strongestMonth
            ? formatAmount(strongestMonth.total_revenue, currency)
            : "No data",
        },
      ]}
    >
      {hasData ? (
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 8, right: 12, left: 0, bottom: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "#78716c" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 11, fill: "#78716c" }}
              tickFormatter={(v) => formatAmount(Number(v), currency)}
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
          </ComposedChart>
        </ResponsiveContainer>
      ) : (
        <EmptyChartState />
      )}
    </ChartShell>
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
  const orderedData = sortMonthlyRows(data);
  const hasData = orderedData.length > 0;

  const chartData = orderedData.map((d) => ({
    name: formatMonthLabel(d.date),
    revenue: d.total_revenue || 0,
    pending: d.total_pending_revenue || 0,
  }));

  const totalRevenue = orderedData.reduce(
    (sum, row) => sum + (row.total_revenue || 0),
    0,
  );
  const totalPendingRevenue = orderedData.reduce(
    (sum, row) => sum + (row.total_pending_revenue || 0),
    0,
  );
  const strongestMonth = orderedData.reduce<ReportDataRow | null>((best, current) => {
    if (!best) {
      return current;
    }

    return (current.total_revenue || 0) > (best.total_revenue || 0)
      ? current
      : best;
  }, null);

  return (
    <ChartShell
      title="Revenue Trend"
      subtitle="Compact monthly revenue view with pending income alongside collected totals."
      insights={[
        {
          label: "Total revenue",
          value: formatAmount(totalRevenue, currency),
          note: "All months combined",
        },
        {
          label: "Pending",
          value: formatAmount(totalPendingRevenue, currency),
          note: "Awaiting settlement",
        },
        {
          label: "Best month",
          value: strongestMonth ? strongestMonth.date : "-",
          note: strongestMonth
            ? formatAmount(strongestMonth.total_revenue, currency)
            : "No data",
        },
      ]}
    >
      {hasData ? (
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 8, right: 12, left: 0, bottom: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "#78716c" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#78716c" }}
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
              barSize={18}
            />
            <Bar
              dataKey="pending"
              name="Pending Revenue"
              fill={CHART_COLORS.pendingRevenue.fill}
              stroke={CHART_COLORS.pendingRevenue.stroke}
              strokeWidth={1.5}
              radius={[8, 8, 0, 0]}
              barSize={18}
            />
          </ComposedChart>
        </ResponsiveContainer>
      ) : (
        <EmptyChartState />
      )}
    </ChartShell>
  );
}

// --- Orders Combo Chart ---
export function OrdersComboChart({
  data,
  currency,
}: {
  data: ReportDataRow[];
  currency: string;
}) {
  const orderedData = sortMonthlyRows(data);
  const hasData = orderedData.length > 0;

  const chartData = orderedData.map((d) => ({
    name: formatMonthLabel(d.date),
    revenue: d.total_revenue || 0,
    pending: d.total_pending_revenue || 0,
  }));

  const totalRevenue = orderedData.reduce(
    (sum, row) => sum + (row.total_revenue || 0),
    0,
  );
  const totalPendingRevenue = orderedData.reduce(
    (sum, row) => sum + (row.total_pending_revenue || 0),
    0,
  );
  const strongestMonth = orderedData.reduce<ReportDataRow | null>((best, current) => {
    if (!best) {
      return current;
    }

    return (current.total_revenue || 0) > (best.total_revenue || 0)
      ? current
      : best;
  }, null);

  return (
    <ChartShell
      title="Sales Revenue Trend"
      subtitle="A simple monthly view of collected and pending shop revenue."
      insights={[
        {
          label: "Sales revenue",
          value: formatAmount(totalRevenue, currency),
          note: "Completed order value",
        },
        {
          label: "Pending revenue",
          value: formatAmount(totalPendingRevenue, currency),
          note: "Orders still awaiting payment",
        },
        {
          label: "Best month",
          value: strongestMonth ? strongestMonth.date : "-",
          note: strongestMonth
            ? formatAmount(strongestMonth.total_revenue, currency)
            : "No data",
        },
      ]}
    >
      {hasData ? (
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 8, right: 12, left: 0, bottom: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "#78716c" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 11, fill: "#78716c" }}
              tickFormatter={(v) => formatAmount(Number(v), currency)}
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
              barSize={18}
            />
            <Bar
              yAxisId="left"
              dataKey="pending"
              name="Pending Revenue"
              fill={CHART_COLORS.deregistered.fill}
              stroke={CHART_COLORS.deregistered.stroke}
              strokeWidth={1.5}
              radius={[8, 8, 0, 0]}
              barSize={18}
            />
          </ComposedChart>
        </ResponsiveContainer>
      ) : (
        <EmptyChartState />
      )}
    </ChartShell>
  );
}

export function ExpenseComboChart({
  data,
  currency,
  title = "Expense Trend",
  subtitle = "Monthly settled expense movement across the selected period.",
}: {
  data: ReportDataRow[];
  currency: string;
  title?: string;
  subtitle?: string;
}) {
  const orderedData = sortMonthlyRows(data);
  const hasData = orderedData.length > 0;

  const chartData = orderedData.map((d) => ({
    name: formatMonthLabel(d.date),
    expense: d.total_expense || 0,
  }));

  const totalExpense = orderedData.reduce(
    (sum, row) => sum + (row.total_expense || 0),
    0,
  );
  const strongestMonth = orderedData.reduce<ReportDataRow | null>((best, current) => {
    if (!best) {
      return current;
    }

    return (current.total_expense || 0) > (best.total_expense || 0)
      ? current
      : best;
  }, null);

  return (
    <ChartShell
      title={title}
      subtitle={subtitle}
      insights={[
        {
          label: "Total expense",
          value: formatAmount(totalExpense, currency),
          note: "Settled spend across the selected period",
        },
        {
          label: "Highest month",
          value: strongestMonth ? strongestMonth.date : "-",
          note: strongestMonth
            ? formatAmount(strongestMonth.total_expense || 0, currency)
            : "No data",
        },
      ]}
    >
      {hasData ? (
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 8, right: 12, left: 0, bottom: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#fee2e2" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "#7f1d1d" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#7f1d1d" }}
              tickFormatter={(v) => formatAmount(Number(v), currency)}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<ModernTooltip currency={currency} />} />
            <Legend formatter={legendFormatter} iconType="circle" />
            <Bar
              dataKey="expense"
              name="Expense"
              fill={CHART_COLORS.expense.fill}
              stroke={CHART_COLORS.expense.stroke}
              strokeWidth={1.5}
              radius={[8, 8, 0, 0]}
              barSize={18}
            />
          </ComposedChart>
        </ResponsiveContainer>
      ) : (
        <EmptyChartState />
      )}
    </ChartShell>
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
            const isMoney = ["Paid", "Due"].includes(entry.name);
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
  const orderedData = sortMonthlyRows(data);
  const hasData = orderedData.length > 0;

  const chartData = orderedData.map((d) => ({
    name: formatMonthLabel(d.date),
    paid: d.paid_to_club,
    due: d.due_to_club,
  }));

  const totalPaid = orderedData.reduce((sum, row) => sum + row.paid_to_club, 0);
  const totalDue = orderedData.reduce((sum, row) => sum + row.due_to_club, 0);
  const totalRegistrations = orderedData.reduce((sum, row) => sum + row.total, 0);
  const totalPending = orderedData.reduce((sum, row) => sum + row.pending, 0);
  const strongestMonth = orderedData.reduce<RegistrationBillingItem | null>(
    (best, current) => {
      if (!best) {
        return current;
      }

      return current.paid_to_club > best.paid_to_club ? current : best;
    },
    null,
  );

  return (
    <ChartShell
      title="Registration Billing Trend"
      subtitle="Collected amounts, balances due, and monthly registration volume in one compact view."
      insights={[
        {
          label: "Collected",
          value: formatAmount(totalPaid, currency),
          note: "Paid to club across the visible period",
        },
        {
          label: "Outstanding",
          value: formatAmount(totalDue, currency),
          note: `${totalPending} registrations still pending`,
        },
        {
          label: "Total",
          value: totalRegistrations,
          note: "Registrations captured across the visible period",
        },
        {
          label: "Pending",
          value: totalPending,
          note: "Registrations still awaiting completion",
        },
        {
          label: "Best month",
          value: strongestMonth ? strongestMonth.date : "-",
          note: strongestMonth
            ? formatAmount(strongestMonth.paid_to_club, currency)
            : "No data",
        },
      ]}
    >
      {hasData ? (
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 8, right: 12, left: 0, bottom: 8 }}
          >
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "#78716c" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 11, fill: "#78716c" }}
              tickFormatter={(v) => formatAmount(Number(v), currency)}
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
              fill={CHART_COLORS.registered.fill}
              stroke={CHART_COLORS.registered.stroke}
              strokeWidth={1.5}
              radius={[8, 8, 0, 0]}
              barSize={18}
            />
            <Bar
              yAxisId="left"
              dataKey="due"
              name="Due"
              fill={CHART_COLORS.pendingRevenue.fill}
              stroke={CHART_COLORS.pendingRevenue.stroke}
              strokeWidth={1.5}
              radius={[8, 8, 0, 0]}
              barSize={18}
            />
          </ComposedChart>
        </ResponsiveContainer>
      ) : (
        <EmptyChartState />
      )}
    </ChartShell>
  );
}
