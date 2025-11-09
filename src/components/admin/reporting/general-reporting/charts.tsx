import { ReportDataRow } from "@/interfaces/report";
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

// Unified chart color palette for consistent theming across all graphs.
// Chosen soft brand-like colors with adequate contrast in light/dark modes.
const CHART_COLORS = {
  revenue: { stroke: "#4f46e5", gradientFrom: "#6366f1", gradientTo: "#eef2ff", fill: "#6366f1" },
  pendingRevenue: { stroke: "#818cf8", gradientFrom: "#a5b4fc", gradientTo: "#f1f5f9", fill: "#818cf8" },
  registered: { fill: "#10b981", stroke: "#059669" },
  deregistered: { fill: "#f43f5e", stroke: "#e11d48" },
  total: { fill: "#2dd4bf", stroke: "#0d9488" },
  pending: { fill: "#fbbf24", stroke: "#d97706" },
  paid: { stroke: "#7c3aed" },
  due: { stroke: "#a78bfa" },
};

type RevenueAreaChartProps = {
  data: ReportDataRow[];
  currency: string;
};

function formatMonthLabel(date: string) {
  // Expecting YYYY-MM or similar, fallback to original
  try {
    const d = new Date(date);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
    }
  } catch {
    // ignore invalid date formats; fall back to raw string
  }
  return date;
}

// Custom Tooltip for Revenue Area Chart
type TooltipPayload = {
  color?: string;
  name?: string;
  value?: number;
};

function RevenueCustomTooltip({ active, payload, label, currency }: { active?: boolean; payload?: TooltipPayload[]; label?: string; currency: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background/95 p-3 shadow-lg">
        <p className="text-xs font-semibold mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center gap-2 text-xs">
            <span
              className="inline-block h-3 w-3 rounded-sm"
              style={{ backgroundColor: entry.color }}
            />
            <span className="font-medium">{entry.name}:</span>
            <span className="text-foreground">{formatAmount(Number(entry.value), currency)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export function RevenueAreaChart({ data, currency }: RevenueAreaChartProps) {
  const chartData = data.map((d) => ({
    name: formatMonthLabel(d.date),
    revenue: d.total_revenue,
    pending: d.total_pending_revenue,
  }));

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 48, left: 56, bottom: 48 }}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={CHART_COLORS.revenue.gradientFrom} stopOpacity={0.7} />
              <stop offset="95%" stopColor={CHART_COLORS.revenue.gradientTo} stopOpacity={0.15} />
            </linearGradient>
            <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={CHART_COLORS.pendingRevenue.gradientFrom} stopOpacity={0.65} />
              <stop offset="95%" stopColor={CHART_COLORS.pendingRevenue.gradientTo} stopOpacity={0.12} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="4 4" className="stroke-muted" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12 }}
            label={{ value: "Month", position: "bottom", offset: 0 }}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            tickFormatter={(v) => formatAmount(Number(v), currency)}
            label={{ value: `Revenue (${currency})`, angle: -90, position: "insideLeft", offset: 10 }}
          />
          <Tooltip content={<RevenueCustomTooltip currency={currency} />} />
          <Legend />
          <Area type="monotone" dataKey="revenue" name="Revenue" stroke={CHART_COLORS.revenue.stroke} fill="url(#colorRevenue)" strokeWidth={2} />
          <Area type="monotone" dataKey="pending" name="Pending Revenue" stroke={CHART_COLORS.pendingRevenue.stroke} fill="url(#colorPending)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

type RegistrationComboChartProps = {
  data: ReportDataRow[];
  currency: string;
};

// Custom Tooltip for Registration Combo Chart
function RegistrationCustomTooltip({ active, payload, label, currency }: { active?: boolean; payload?: TooltipPayload[]; label?: string; currency: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background/95 p-3 shadow-lg">
        <p className="text-xs font-semibold mb-2">{label}</p>
        {payload.map((entry, index) => {
          const isMoney = entry.name === "Revenue" || entry.name === "Pending Revenue";
          const displayValue = isMoney ? formatAmount(Number(entry.value), currency) : entry.value;
          return (
            <div key={`item-${index}`} className="flex items-center gap-2 text-xs p-1">
              <span
                className="inline-block h-4 w-4"
                style={{ backgroundColor: entry.color }}
              />
              <span className="font-medium">{entry.name}:</span>
              <span className="text-foreground">{displayValue}</span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
}

export function RegistrationComboChart({ data, currency }: RegistrationComboChartProps) {
  const chartData = data.map((d) => ({
    name: formatMonthLabel(d.date),
    registered: d.total_registered_members,
    deregistered: d.total_deregistered_members,
    revenue: d.total_revenue,
    pending: d.total_pending_revenue,
  }));

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 10, right: 56, left: 56, bottom: 56 }}>
          <CartesianGrid strokeDasharray="4 4" className="stroke-muted" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12 }}
          />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 12 }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 12 }}
            tickFormatter={(v) => formatAmount(Number(v), currency)}
          />
          <Tooltip content={<RegistrationCustomTooltip currency={currency} />} />
          <Legend />
          <Bar yAxisId="left" dataKey="registered" name="Completed Registrations" fill={CHART_COLORS.registered.fill} stroke={CHART_COLORS.registered.stroke} strokeWidth={1} radius={[4, 4, 0, 0]} label={{ position: "top", fill: CHART_COLORS.registered.stroke, fontSize: 11 }} />
          <Bar yAxisId="left" dataKey="deregistered" name="Members Deregistered" fill={CHART_COLORS.deregistered.fill} stroke={CHART_COLORS.deregistered.stroke} strokeWidth={1} radius={[4, 4, 0, 0]} label={{ position: "top", fill: CHART_COLORS.deregistered.stroke, fontSize: 11 }} />
          <Line yAxisId="right" type="monotone" dataKey="revenue" name="Revenue" stroke={CHART_COLORS.revenue.stroke} strokeWidth={2} dot={false} />
          <Line yAxisId="right" type="monotone" dataKey="pending" name="Pending Revenue" stroke={CHART_COLORS.pendingRevenue.stroke} strokeWidth={2} dot={false} strokeDasharray="5 5" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

type OverallComboChartProps = {
  data: ReportDataRow[];
  currency: string;
};

// Custom Tooltip for Overall Combo Chart
function OverallCustomTooltip({ active, payload, label, currency }: { active?: boolean; payload?: TooltipPayload[]; label?: string; currency: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background/95 p-3 shadow-lg">
        <p className="text-xs font-semibold mb-2">{label}</p>
        {payload.map((entry, index) => {
          const isMoney = entry.name === "Revenue" || entry.name === "Pending Revenue";
          const displayValue = isMoney ? formatAmount(Number(entry.value), currency) : entry.value;
          return (
            <div key={`item-${index}`} className="flex items-center gap-2 text-xs p-1">
              <span
                className="inline-block h-4 w-4"
                style={{ backgroundColor: entry.color }}
              />
              <span className="font-medium">{entry.name}:</span>
              <span className="text-foreground">{displayValue}</span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
}

export function OverallComboChart({ data, currency }: OverallComboChartProps) {
  const chartData = data.map((d) => ({
    name: formatMonthLabel(d.date),
    revenue: d.total_revenue,
    pending: d.total_pending_revenue,
  }));

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 10, right: 56, left: 56, bottom: 56 }}>
          <CartesianGrid strokeDasharray="4 4" className="stroke-muted" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12 }}
          />
          <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatAmount(Number(v), currency)} />
          <Tooltip content={<OverallCustomTooltip currency={currency} />} />
          <Legend />
          <Bar dataKey="revenue" name="Revenue" fill={CHART_COLORS.revenue.fill} stroke={CHART_COLORS.revenue.stroke} strokeWidth={1} radius={[4, 4, 0, 0]} />
          <Bar dataKey="pending" name="Pending Revenue" fill={CHART_COLORS.pendingRevenue.fill} stroke={CHART_COLORS.pendingRevenue.stroke} strokeWidth={1} radius={[4, 4, 0, 0]} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// Registration Billing (per fee / row) chart
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

function RegistrationBillingTooltip({ active, payload, label, currency }: { active?: boolean; payload?: TooltipPayload[]; label?: string; currency: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background/95 p-3 shadow-lg">
        <p className="text-xs font-semibold mb-2">{label}</p>
        {payload.map((entry, index) => {
          const isMoney = entry.name === "Paid" || entry.name === "Due";
          const displayValue = isMoney ? formatAmount(Number(entry.value), currency) : entry.value;
          return (
            <div key={`rb-item-${index}`} className="flex items-center gap-2 text-xs p-1">
              <span className="inline-block h-4 w-4" style={{ backgroundColor: entry.color }} />
              <span className="font-medium">{entry.name}:</span>
              <span className="text-foreground">{displayValue}</span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
}

export function RegistrationBillingChart({ data, currency }: RegistrationBillingChartProps) {
  const chartData = data.map((d) => ({
    name: formatMonthLabel(d.date),
    total: d.total,
    pending: d.pending,
    paid: d.paid_to_club,
    due: d.due_to_club,
  }));

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 10, right: 56, left: 56, bottom: 40 }}>
          <CartesianGrid strokeDasharray="4 4" className="stroke-muted" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickFormatter={(v) => formatAmount(Number(v), currency)} />
          <Tooltip content={<RegistrationBillingTooltip currency={currency} />} />
          <Legend />
          {/* Use same bar colors as general reporting: green for primary metric, red for the adverse/pending metric */}
          <Bar yAxisId="left" dataKey="total" name="Total" fill={CHART_COLORS.registered.fill} stroke={CHART_COLORS.registered.stroke} strokeWidth={1} radius={[4,4,0,0]} />
          <Bar yAxisId="left" dataKey="pending" name="Pending" fill={CHART_COLORS.deregistered.fill} stroke={CHART_COLORS.deregistered.stroke} strokeWidth={1} radius={[4,4,0,0]} />
          <Line yAxisId="right" type="monotone" dataKey="paid" name="Paid" stroke={CHART_COLORS.paid.stroke} strokeWidth={2} dot={false} />
          <Line yAxisId="right" type="monotone" dataKey="due" name="Due" stroke={CHART_COLORS.due.stroke} strokeWidth={2} dot={false} strokeDasharray="5 5" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

