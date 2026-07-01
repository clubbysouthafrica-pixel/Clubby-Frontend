import { useState } from "react";
import { ShopReport } from "@/interfaces/report";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatAmount } from "@/data/currencies";
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

const STACK_PALETTE = ["#4ade80", "#fb923c", "#f472b6", "#60a5fa", "#a78bfa"];

interface ShopProductReportProps {
  report: ShopReport;
  currency: string;
  onInteract?: () => void;
}

function EmptyChartState() {
  return (
    <div className="flex h-full min-h-[208px] items-center justify-center text-sm text-slate-400">
      No data available
    </div>
  );
}

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
    <div className="min-w-[180px] rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-xl">
      <p className="mb-2 text-xs font-semibold text-slate-700">{label}</p>
      <div className="space-y-1">
        {payload.map((entry, idx) => (
          <div key={idx} className="flex items-center gap-2 text-xs">
            <span
              className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-sm"
              style={{ backgroundColor: entry.color }}
            />
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

function ShopGraphShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-100 p-4">
      <div className="mb-3 flex flex-col gap-0.5">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {title}
        </h3>
        <p className="text-[11px] text-slate-400">{subtitle}</p>
      </div>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_200px] lg:items-stretch">
        {children}
      </div>
    </div>
  );
}

function getProductTabValue(
  product: ShopReport["report"][number],
  index: number,
): string {
  if (product.product_id !== undefined && product.product_id !== null) {
    return String(product.product_id);
  }
  if (product.product_name?.trim()) {
    return `product-${product.product_name.trim().toLowerCase().replace(/\s+/g, "-")}-${index}`;
  }
  return `product-${index}`;
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

function getPeakRevenueMonth(productData: ShopReport["report"][number]["data"]) {
  return [...productData].reduce<ShopReport["report"][number]["data"][number] | null>(
    (best, current) =>
      !best || (current.revenue || 0) > (best.revenue || 0) ? current : best,
    null,
  );
}

export function ShopProductReport({
  report,
  currency,
  onInteract,
}: ShopProductReportProps) {
  const products = report?.report ?? [];

  const [selectedId, setSelectedId] = useState<string>(() =>
    products.length > 0 ? getProductTabValue(products[0], 0) : "",
  );

  const selectedIndex = products.findIndex(
    (p, i) => getProductTabValue(p, i) === selectedId,
  );
  const product = products[selectedIndex] ?? products[0];

  if (!products.length) {
    return (
      <div className="space-y-4">
        <div className="space-y-1 text-center">
          <h3 className="text-lg font-extrabold tracking-tight text-slate-900">Shop Report</h3>
          <p className="text-xs text-slate-500">Revenue and unit trends across your shop catalog.</p>
        </div>
        <ShopGraphShell
          title="Sales Revenue Trend"
          subtitle="A monthly view of collected and pending revenue for your shop products."
        >
          <div className="rounded-sm border border-slate-200 p-4 lg:h-full">
            <EmptyChartState />
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            {["Sales revenue", "Pending revenue", "Best month", "Units sold / pending"].map((label) => (
              <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 p-2.5">
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
                <p className="mt-1.5 text-base font-bold text-slate-900">-</p>
                <p className="mt-0.5 text-[11px] text-slate-400">No data for now</p>
              </div>
            ))}
          </div>
        </ShopGraphShell>
      </div>
    );
  }

  const orderedProductData = [...(product?.data ?? [])].sort(
    (a, b) => getMonthSortValue(a.date) - getMonthSortValue(b.date),
  );
  const strongestMonth = getPeakRevenueMonth(orderedProductData);

  return (
    <div className="space-y-4">
      <div className="space-y-1 text-center">
        <h3 className="text-lg font-extrabold tracking-tight text-slate-900">Shop Report</h3>
        <p className="text-xs text-slate-500">Revenue and unit trends across your shop catalog.</p>
      </div>

      {/* Selector row — matches registration-report-data-table layout */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500">Product</label>
          <Select
            value={selectedId}
            onValueChange={(v) => {
              setSelectedId(v);
              onInteract?.();
            }}
          >
            <SelectTrigger className="h-9 w-[220px] border-slate-200 bg-white text-sm text-slate-700 shadow-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {products.map((p, i) => (
                <SelectItem key={getProductTabValue(p, i)} value={getProductTabValue(p, i)}>
                  {p.product_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="ml-auto text-right">
          <p className="text-sm font-semibold text-slate-900">{product?.product_name}</p>
          <p className="text-xs text-slate-400">Monthly shop revenue</p>
        </div>
      </div>

      {/* Per-product stat cards */}
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Price per Item", value: formatAmount(product?.price || 0, currency) },
          { label: "Total Revenue", value: formatAmount(product?.total_revenue, currency) },
          { label: "Pending Revenue", value: formatAmount(product?.total_pending_revenue, currency) },
          { label: "Units Sold / Pending", value: `${product?.total_sold_units || 0} / ${product?.total_pending_units || 0}` },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
            <p className="mt-1 truncate text-lg font-bold text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      <ShopGraphShell
        title="Sales Revenue Trend"
        subtitle={`A monthly view of collected and pending revenue for ${product?.product_name}.`}
      >
        <div className="rounded-sm border border-slate-200 p-4 lg:h-full">
          <div className="h-full min-h-[208px] w-full">
            {orderedProductData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={orderedProductData.map((d) => ({
                    name: formatMonthLabel(d.date),
                    revenue: d.revenue || 0,
                    pending_revenue: d.pending_revenue || 0,
                  }))}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                  barCategoryGap="30%"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    tickFormatter={(value) =>
                      `${currency} ${Number(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                    }
                    axisLine={false}
                    tickLine={false}
                    width={72}
                  />
                  <Tooltip
                    content={<ModernTooltip currency={currency} />}
                    cursor={{ fill: "rgba(0,0,0,0.04)" }}
                  />
                  <Legend
                    iconType="square"
                    iconSize={10}
                    formatter={(value) => (
                      <span className="text-xs text-slate-600">{value}</span>
                    )}
                  />
                  <Bar dataKey="revenue" name="Revenue" stackId="a" fill={STACK_PALETTE[0]} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="pending_revenue" name="Pending Revenue" stackId="a" fill={STACK_PALETTE[1]} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChartState />
            )}
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
          {[
            { label: "Sales revenue", value: formatAmount(product?.total_revenue || 0, currency), note: "Completed order value" },
            { label: "Pending revenue", value: formatAmount(product?.total_pending_revenue || 0, currency), note: "Orders still awaiting payment" },
            { label: "Best month", value: strongestMonth ? formatMonthLabel(strongestMonth.date) : "-", note: strongestMonth ? formatAmount(strongestMonth.revenue || 0, currency) : "No data for now" },
            { label: "Units sold / pending", value: `${product?.total_sold_units || 0} / ${product?.total_pending_units || 0}`, note: "Fulfilled versus outstanding items" },
          ].map(({ label, value, note }) => (
            <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 p-2.5">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
              <p className="mt-1.5 text-base font-bold text-slate-900">{value}</p>
              <p className="mt-0.5 text-[11px] text-slate-400">{note}</p>
            </div>
          ))}
        </div>
      </ShopGraphShell>
    </div>
  );
}
