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
  CartesianGrid,
  ComposedChart,
  Bar,
  BarChart,
  Legend,
} from "recharts";

const CHART_COLORS = {
  revenue: { stroke: "#16a34a", fill: "#4ade80" },
  pendingRevenue: { stroke: "#d97706", fill: "#fbbf24" },
  expense: { stroke: "#b91c1c", fill: "#f87171" },
  registered: { fill: "#4ade80", stroke: "#16a34a" },
  deregistered: { fill: "#bbf7d0", stroke: "#4ade80" },
};

const STACK_PALETTE = [
  "#4ade80",
  "#fb923c",
  "#f472b6",
  "#60a5fa",
  "#a78bfa",
  "#34d399",
  "#fbbf24",
  "#f87171",
  "#38bdf8",
  "#e879f9",
];

function getChartMinHeight() {
  return 196;
}

function formatMonthLabel(date: string) {
  try {
    const d = new Date(date);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
    }
  } catch {}
  return date;
}

function getMonthSortValue(date: string) {
  const normalizedDate = /^\d{4}-\d{2}$/.test(date) ? `${date}-01` : date;
  const parsedTime = new Date(normalizedDate).getTime();
  return !Number.isNaN(parsedTime) ? parsedTime : Number.MAX_SAFE_INTEGER;
}

function sortMonthlyRows<T extends { date: string }>(rows: T[]) {
  return [...rows].sort(
    (l, r) => getMonthSortValue(l.date) - getMonthSortValue(r.date),
  );
}

function EmptyChartState() {
  return (
    <div className="flex h-full min-h-[168px] items-center justify-center text-sm text-slate-400">
      No data available
    </div>
  );
}

// Shared tooltip
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
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-xl px-4 py-3 min-w-[180px]">
      <p className="font-semibold text-xs text-slate-700 mb-2">{label}</p>
      <div className="space-y-1">
        {payload.map((entry, idx) => (
          <div key={idx} className="flex items-center gap-2 text-xs">
            <span className="inline-block h-2.5 w-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: entry.color }} />
            <span className="text-slate-600">{entry.name}:</span>
            <span className="ml-auto font-medium text-slate-900">
              {formatAmount(Number(entry.value), currency)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Stacked billing chart used in registration-report-data-table
type StackedSeries = {
  name: string;
  data: { date: string; paid_to_club: number; due_to_club: number }[];
};

export function StackedRegistrationBillingChart({
  series,
  currency,
}: {
  series: StackedSeries[];
  currency: string;
}) {
  // Merge all series into per-date rows
  const dateSet = new Set<string>();
  series.forEach((s) => s.data.forEach((d) => dateSet.add(d.date)));

  const sortedDates = [...dateSet].sort(
    (a, b) => getMonthSortValue(a) - getMonthSortValue(b),
  );

  // Use index-based keys to avoid collisions when two rows share the same name
  const seriesKeys = series.map((_, i) => `s_${i}`);

  const chartData = sortedDates.map((date) => {
    const row: Record<string, string | number> = { name: formatMonthLabel(date) };
    series.forEach((s, i) => {
      const found = s.data.find((d) => d.date === date);
      row[seriesKeys[i]] = found?.paid_to_club ?? 0;
    });
    return row;
  });

  const hasData = chartData.length > 0;

  return (
    <div style={{ height: 480 }} className="w-full rounded-sm border border-slate-200 p-4">
      {hasData ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              tickFormatter={(v) => formatAmount(Number(v), currency)}
              axisLine={false}
              tickLine={false}
              width={72}
            />
            <Tooltip content={<ModernTooltip currency={currency} />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
            <Legend
              iconType="square"
              iconSize={10}
              formatter={(value) => (
                <span className="text-xs text-slate-600">{value}</span>
              )}
            />
            {series.map((s, i) => (
              <Bar
                key={seriesKeys[i]}
                dataKey={seriesKeys[i]}
                name={s.name}
                stackId="a"
                fill={STACK_PALETTE[i % STACK_PALETTE.length]}
                radius={i === series.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <EmptyChartState />
      )}
    </div>
  );
}

// Simple paid/due chart for single-option fields
export function RegistrationBillingChart({
  data,
  currency,
}: {
  data: { date: string; total: number; paid_to_club: number; pending: number; due_to_club: number }[];
  currency: string;
}) {
  const orderedData = sortMonthlyRows(data);
  const hasData = orderedData.length > 0;

  const chartData = orderedData.map((d) => ({
    name: formatMonthLabel(d.date),
    Paid: d.paid_to_club,
    Due: d.due_to_club,
  }));

  return (
    <div style={{ height: 480 }} className="w-full rounded-sm border border-slate-200 p-4">
      {hasData ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              tickFormatter={(v) => formatAmount(Number(v), currency)}
              axisLine={false}
              tickLine={false}
              width={72}
            />
            <Tooltip content={<ModernTooltip currency={currency} />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
            <Legend
              iconType="square"
              iconSize={10}
              formatter={(value) => (
                <span className="text-xs text-slate-600">{value}</span>
              )}
            />
            <Bar dataKey="Paid" stackId="a" fill={STACK_PALETTE[0]} radius={[0, 0, 0, 0]} />
            <Bar dataKey="Due" stackId="a" fill={STACK_PALETTE[1]} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <EmptyChartState />
      )}
    </div>
  );
}

// --- Overall Combo Chart ---
function InsightRail({ items }: { items: Array<{ label: string; value: string | number; note?: string }> }) {
  return (
    <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-1">
      {items.map((item) => (
        <div key={item.label} className="rounded-lg border border-slate-100 bg-slate-50 p-2.5">
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
          <p className="mt-1 text-sm font-semibold text-slate-800 md:text-[15px]">{item.value}</p>
          {item.note && <p className="mt-0.5 text-[11px] text-slate-400">{item.note}</p>}
        </div>
      ))}
    </div>
  );
}

function ChartShell({ title, subtitle, insights, children }: {
  title: string;
  subtitle: string;
  insights: Array<{ label: string; value: string | number; note?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-3 flex flex-col gap-0.5">
        <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">{title}</h3>
        <p className="text-[11px] text-slate-400">{subtitle}</p>
      </div>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_176px] lg:items-stretch">
        <div className="h-full w-full" style={{ minHeight: `${getChartMinHeight()}px` }}>
          {children}
        </div>
        <InsightRail items={insights} />
      </div>
    </div>
  );
}

function legendFormatter(value: string) {
  return <span className="px-2 py-1 rounded-full bg-slate-100 text-xs font-medium text-slate-700">{value}</span>;
}

export function OverallComboChart({ data, currency }: { data: ReportDataRow[]; currency: string }) {
  const orderedData = sortMonthlyRows(data);
  const hasData = orderedData.length > 0;
  const chartData = orderedData.map((d) => ({ name: formatMonthLabel(d.date), revenue: d.total_revenue || 0, pending: d.total_pending_revenue || 0 }));
  const totalRevenue = orderedData.reduce((sum, row) => sum + (row.total_revenue || 0), 0);
  const totalPendingRevenue = orderedData.reduce((sum, row) => sum + (row.total_pending_revenue || 0), 0);
  const strongestMonth = orderedData.reduce<ReportDataRow | null>((best, cur) => !best || (cur.total_revenue || 0) > (best.total_revenue || 0) ? cur : best, null);

  return (
    <ChartShell
      title="Revenue Trend"
      subtitle="Compact monthly revenue view with pending income alongside collected totals."
      insights={[
        { label: "Total revenue", value: formatAmount(totalRevenue, currency), note: "All months combined" },
        { label: "Pending", value: formatAmount(totalPendingRevenue, currency), note: "Awaiting settlement" },
        { label: "Best month", value: strongestMonth ? strongestMonth.date : "-", note: strongestMonth ? formatAmount(strongestMonth.total_revenue, currency) : "No data" },
      ]}
    >
      {hasData ? (
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#78716c" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#78716c" }} tickFormatter={(v) => formatAmount(Number(v), currency)} axisLine={false} tickLine={false} />
            <Tooltip content={<ModernTooltip currency={currency} />} />
            <Legend formatter={legendFormatter} iconType="circle" />
            <Bar dataKey="revenue" name="Revenue" stackId="a" fill={CHART_COLORS.revenue.fill} stroke={CHART_COLORS.revenue.stroke} strokeWidth={1} radius={[0, 0, 0, 0]} barSize={56} />
            <Bar dataKey="pending" name="Pending Revenue" stackId="a" fill={CHART_COLORS.pendingRevenue.fill} stroke={CHART_COLORS.pendingRevenue.stroke} strokeWidth={1} radius={[4, 4, 0, 0]} barSize={56} />
          </ComposedChart>
        </ResponsiveContainer>
      ) : (
        <EmptyChartState />
      )}
    </ChartShell>
  );
}

export function OrdersComboChart({ data, currency }: { data: ReportDataRow[]; currency: string }) {
  const orderedData = sortMonthlyRows(data);
  const hasData = orderedData.length > 0;
  const chartData = orderedData.map((d) => ({ name: formatMonthLabel(d.date), revenue: d.total_revenue || 0, pending: d.total_pending_revenue || 0 }));
  const totalRevenue = orderedData.reduce((sum, row) => sum + (row.total_revenue || 0), 0);
  const totalPendingRevenue = orderedData.reduce((sum, row) => sum + (row.total_pending_revenue || 0), 0);
  const strongestMonth = orderedData.reduce<ReportDataRow | null>((best, cur) => !best || (cur.total_revenue || 0) > (best.total_revenue || 0) ? cur : best, null);

  return (
    <ChartShell
      title="Sales Revenue Trend"
      subtitle="A simple monthly view of collected and pending shop revenue."
      insights={[
        { label: "Sales revenue", value: formatAmount(totalRevenue, currency), note: "Completed order value" },
        { label: "Pending revenue", value: formatAmount(totalPendingRevenue, currency), note: "Orders still awaiting payment" },
        { label: "Best month", value: strongestMonth ? strongestMonth.date : "-", note: strongestMonth ? formatAmount(strongestMonth.total_revenue, currency) : "No data" },
      ]}
    >
      {hasData ? (
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#78716c" }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "#78716c" }} tickFormatter={(v) => formatAmount(Number(v), currency)} axisLine={false} tickLine={false} />
            <Tooltip content={<ModernTooltip currency={currency} />} />
            <Legend formatter={legendFormatter} iconType="circle" />
            <Bar yAxisId="left" dataKey="revenue" name="Revenue" stackId="a" fill={CHART_COLORS.revenue.fill} stroke={CHART_COLORS.revenue.stroke} strokeWidth={1} radius={[0, 0, 0, 0]} barSize={56} />
            <Bar yAxisId="left" dataKey="pending" name="Pending Revenue" stackId="a" fill={CHART_COLORS.pendingRevenue.fill} stroke={CHART_COLORS.pendingRevenue.stroke} strokeWidth={1} radius={[4, 4, 0, 0]} barSize={56} />
          </ComposedChart>
        </ResponsiveContainer>
      ) : (
        <EmptyChartState />
      )}
    </ChartShell>
  );
}

export function ExpenseComboChart({ data, currency, title = "Expense Trend", subtitle = "Monthly settled expense movement across the selected period." }: { data: ReportDataRow[]; currency: string; title?: string; subtitle?: string }) {
  const orderedData = sortMonthlyRows(data);
  const hasData = orderedData.length > 0;
  const chartData = orderedData.map((d) => ({ name: formatMonthLabel(d.date), expense: d.total_expense || 0 }));
  const totalExpense = orderedData.reduce((sum, row) => sum + (row.total_expense || 0), 0);
  const strongestMonth = orderedData.reduce<ReportDataRow | null>((best, cur) => !best || (cur.total_expense || 0) > (best.total_expense || 0) ? cur : best, null);

  return (
    <ChartShell
      title={title}
      subtitle={subtitle}
      insights={[
        { label: "Total expense", value: formatAmount(totalExpense, currency), note: "Settled spend across the selected period" },
        { label: "Highest month", value: strongestMonth ? strongestMonth.date : "-", note: strongestMonth ? formatAmount(strongestMonth.total_expense || 0, currency) : "No data" },
      ]}
    >
      {hasData ? (
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#78716c" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#78716c" }} tickFormatter={(v) => formatAmount(Number(v), currency)} axisLine={false} tickLine={false} />
            <Tooltip content={<ModernTooltip currency={currency} />} />
            <Legend formatter={legendFormatter} iconType="circle" />
            <Bar dataKey="expense" name="Expense" fill={CHART_COLORS.expense.fill} stroke={CHART_COLORS.expense.stroke} strokeWidth={1} radius={[4, 4, 0, 0]} barSize={56} />
          </ComposedChart>
        </ResponsiveContainer>
      ) : (
        <EmptyChartState />
      )}
    </ChartShell>
  );
}

export function RegistrationComboChart({ data, currency }: { data: RegistrationReportDataRow[]; currency: string }) {
  const orderedData = sortMonthlyRows(data);
  const hasData = orderedData.length > 0;
  const chartData = orderedData.map((d) => ({ name: formatMonthLabel(d.date), revenue: d.total_revenue, pending: d.total_pending_revenue }));
  const totalRevenue = orderedData.reduce((sum, row) => sum + row.total_revenue, 0);
  const totalPendingRevenue = orderedData.reduce((sum, row) => sum + row.total_pending_revenue, 0);
  const strongestMonth = orderedData.reduce<RegistrationReportDataRow | null>((best, cur) => !best || cur.total_revenue > best.total_revenue ? cur : best, null);

  return (
    <ChartShell
      title="Registration Revenue Trend"
      subtitle="A simple monthly view of collected and pending registration revenue."
      insights={[
        { label: "Revenue", value: formatAmount(totalRevenue, currency), note: "Collected across the selected season" },
        { label: "Pending revenue", value: formatAmount(totalPendingRevenue, currency), note: "Outstanding registration balance" },
        { label: "Best month", value: strongestMonth ? strongestMonth.date : "-", note: strongestMonth ? formatAmount(strongestMonth.total_revenue, currency) : "No data" },
      ]}
    >
      {hasData ? (
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#78716c" }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "#78716c" }} tickFormatter={(v) => formatAmount(Number(v), currency)} axisLine={false} tickLine={false} />
            <Tooltip content={<ModernTooltip currency={currency} />} />
            <Legend formatter={legendFormatter} iconType="circle" />
            <Bar yAxisId="left" dataKey="revenue" name="Revenue" stackId="a" fill={CHART_COLORS.revenue.fill} stroke={CHART_COLORS.revenue.stroke} strokeWidth={1} radius={[0, 0, 0, 0]} barSize={56} />
            <Bar yAxisId="left" dataKey="pending" name="Pending Revenue" stackId="a" fill={CHART_COLORS.pendingRevenue.fill} stroke={CHART_COLORS.pendingRevenue.stroke} strokeWidth={1} radius={[4, 4, 0, 0]} barSize={56} />
          </ComposedChart>
        </ResponsiveContainer>
      ) : (
        <EmptyChartState />
      )}
    </ChartShell>
  );
}
