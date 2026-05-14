import { ShopReport } from "@/interfaces/report";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatAmount } from "@/data/currencies";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

interface ShopProductReportProps {
  report: ShopReport;
  currency: string;
  onInteract?: () => void;
}

function EmptyGraphState() {
  return (
    <div className="flex h-full min-h-[208px] items-center justify-center rounded-[16px] border border-dashed border-stone-200 bg-stone-50/60 text-center text-sm text-stone-500">
      No data for now
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
    <Card className="rounded-[20px] border border-stone-200 bg-gradient-to-br from-white via-stone-50 to-white p-3.5 shadow-sm md:p-4">
      <div className="mb-3 flex flex-col gap-0.5">
        <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-600">
          {title}
        </h3>
        <p className="text-[11px] text-stone-500">{subtitle}</p>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_200px] lg:items-stretch">
        {children}
      </div>
    </Card>
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

function formatRevenueAxisLabel(value: number, currency: string): string {
  return `${currency} ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function getPeakRevenueMonth(productData: ShopReport["report"][number]["data"]) {
  return [...productData].reduce<ShopReport["report"][number]["data"][number] | null>(
    (best, current) => {
      if (!best) {
        return current;
      }

      return (current.revenue || 0) > (best.revenue || 0) ? current : best;
    },
    null,
  );
}

export function ShopProductReport({
  report,
  currency,
  onInteract,
}: ShopProductReportProps) {
  const reportTabsKey = (report?.report ?? [])
    .map((product, index) => getProductTabValue(product, index))
    .join("|");

  if (!report?.report || report.report.length === 0) {
    return (
      <div className="space-y-3">
        <div className="text-center space-y-1">
          <h3 className="text-lg font-extrabold tracking-tight text-slate-900">
            Shop Report
          </h3>
          <p className="text-xs text-slate-500">
            Revenue and unit trends across your shop catalog.
          </p>
        </div>

        <ShopGraphShell
          title="Sales Revenue Trend"
          subtitle="A monthly view of collected and pending revenue for your shop products."
        >
          <div className="rounded-[18px] border border-stone-200 bg-white p-2.5 md:p-3 lg:h-full">
            <EmptyGraphState />
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-[16px] border border-stone-200 bg-stone-50/90 p-2.5">
              <p className="text-[10px] uppercase tracking-[0.18em] text-stone-500">
                Sales revenue
              </p>
              <p className="mt-1.5 text-base font-semibold text-stone-900">
                {formatAmount(0, currency)}
              </p>
              <p className="mt-0.5 text-[11px] text-stone-500">No data for now</p>
            </div>
            <div className="rounded-[16px] border border-stone-200 bg-stone-50/90 p-2.5">
              <p className="text-[10px] uppercase tracking-[0.18em] text-stone-500">
                Pending revenue
              </p>
              <p className="mt-1.5 text-base font-semibold text-stone-900">
                {formatAmount(0, currency)}
              </p>
              <p className="mt-0.5 text-[11px] text-stone-500">No data for now</p>
            </div>
            <div className="rounded-[16px] border border-stone-200 bg-stone-50/90 p-2.5">
              <p className="text-[10px] uppercase tracking-[0.18em] text-stone-500">
                Best month
              </p>
              <p className="mt-1.5 text-base font-semibold text-stone-900">-</p>
              <p className="mt-0.5 text-[11px] text-stone-500">No data for now</p>
            </div>
            <div className="rounded-[16px] border border-stone-200 bg-stone-50/90 p-2.5">
              <p className="text-[10px] uppercase tracking-[0.18em] text-stone-500">
                Units sold / pending
              </p>
              <p className="mt-1.5 text-base font-semibold text-stone-900">0 / 0</p>
              <p className="mt-0.5 text-[11px] text-stone-500">No data for now</p>
            </div>
          </div>
        </ShopGraphShell>
      </div>
    );
  }

  return (
    <Tabs
      key={reportTabsKey}
      defaultValue={getProductTabValue(report.report[0], 0)}
      className="w-full"
    >
      <div className="space-y-3">
        <div className="text-center space-y-1">
          <h3 className="text-lg font-extrabold tracking-tight text-slate-900">
            Shop Report
          </h3>
          <p className="text-xs text-slate-500">
            Revenue and unit trends across your shop catalog.
          </p>
        </div>

        <div className="overflow-x-auto pb-1">
          <TabsList className="flex h-auto w-full min-w-max flex-row justify-start gap-2 rounded-[18px] border border-slate-200/70 bg-slate-50/90 p-1.5">
            {report.report.map((product, index) => (
              <TabsTrigger
                key={getProductTabValue(product, index)}
                value={getProductTabValue(product, index)}
                onClick={onInteract}
                className="h-8 rounded-full px-3.5 text-xs font-medium data-[state=active]:bg-zinc-700 data-[state=active]:text-white data-[state=inactive]:border data-[state=inactive]:border-slate-200 data-[state=inactive]:bg-white data-[state=inactive]:text-zinc-700 whitespace-nowrap"
              >
                {product.product_name}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </div>

      {report.report.map((product, index) => (
        (() => {
          const orderedProductData = [...(product.data ?? [])].sort(
            (left, right) => getMonthSortValue(left.date) - getMonthSortValue(right.date),
          );
          const strongestMonth = getPeakRevenueMonth(orderedProductData);

          return (
        <TabsContent
          key={getProductTabValue(product, index)}
          value={getProductTabValue(product, index)}
          className="space-y-3 pt-3"
        >
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
            <Card className="rounded-[18px] border border-stone-300/70 bg-white/85 p-0 shadow-sm">
              <div className="p-4">
                <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-400">
                  Price per Item
                </p>
                <p className="mt-1 text-lg font-semibold text-zinc-900 truncate">
                  {formatAmount(product.price || 0, currency)}
                </p>
              </div>
            </Card>
            <Card className="rounded-[18px] border border-stone-300/70 bg-white/85 p-0 shadow-sm">
              <div className="p-4">
                <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-400">
                  Total Revenue
                </p>
                <p className="mt-1 text-lg font-semibold text-zinc-900 truncate">
                  {formatAmount(product.total_revenue, currency)}
                </p>
              </div>
            </Card>
            <Card className="rounded-[18px] border border-stone-300/70 bg-white/85 p-0 shadow-sm">
              <div className="p-4">
                <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-400">
                  Pending Revenue
                </p>
                <p className="mt-1 text-lg font-semibold text-zinc-900 truncate">
                  {formatAmount(product.total_pending_revenue, currency)}
                </p>
              </div>
            </Card>
            <Card className="rounded-[18px] border border-stone-300/70 bg-white/85 p-0 shadow-sm">
              <div className="p-4">
                <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-400">
                  Units Sold / Pending
                </p>
                <p className="mt-1 text-lg font-semibold text-zinc-900">
                  {product.total_sold_units || 0} / {product.total_pending_units || 0}
                </p>
              </div>
            </Card>
          </div>

          <ShopGraphShell
            title="Sales Revenue Trend"
            subtitle={`A monthly view of collected and pending revenue for ${product.product_name}.`}
          >
            <div className="rounded-[18px] border border-stone-200 bg-white p-2.5 md:p-3 lg:h-full">
              <div className="h-full min-h-[208px] w-full">
                {orderedProductData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={orderedProductData.map((d) => ({
                        name: formatMonthLabel(d.date),
                        revenue: d.revenue || 0,
                        pending_revenue: d.pending_revenue || 0,
                      }))}
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
                        tickFormatter={(value) =>
                          formatRevenueAxisLabel(value, currency)
                        }
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "rgba(255,255,255,0.96)",
                          border: "1px solid #e7e5e4",
                          borderRadius: "12px",
                          color: "#1f2937",
                          boxShadow: "0 10px 30px rgba(15, 23, 42, 0.12)",
                          fontWeight: 500,
                          fontSize: 12,
                        }}
                        labelStyle={{ color: "#44403c", fontWeight: 600 }}
                        formatter={(value: number, name: string) => {
                          if (name === "Revenue" || name === "Pending Revenue") {
                            return [formatAmount(Number(value), currency), name];
                          }
                          return [value, name];
                        }}
                      />
                      <Legend iconType="circle" />
                      <Bar
                        yAxisId="left"
                        dataKey="revenue"
                        name="Revenue"
                        fill="#78716c"
                        stroke="#57534e"
                        strokeWidth={1.5}
                        radius={[8, 8, 0, 0]}
                        barSize={18}
                      />
                      <Bar
                        yAxisId="left"
                        dataKey="pending_revenue"
                        name="Pending Revenue"
                        fill="#d6d3d1"
                        stroke="#a8a29e"
                        strokeWidth={1.5}
                        radius={[8, 8, 0, 0]}
                        barSize={18}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyGraphState />
                )}
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                  <div className="rounded-[16px] border border-stone-200 bg-stone-50/90 p-2.5">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-stone-500">
                      Sales revenue
                    </p>
                    <p className="mt-1.5 text-base font-semibold text-stone-900">
                      {formatAmount(product.total_revenue || 0, currency)}
                    </p>
                    <p className="mt-0.5 text-[11px] text-stone-500">
                      Completed order value
                    </p>
                  </div>
                  <div className="rounded-[16px] border border-stone-200 bg-stone-50/90 p-2.5">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-stone-500">
                      Pending revenue
                    </p>
                    <p className="mt-1.5 text-base font-semibold text-stone-900">
                      {formatAmount(product.total_pending_revenue || 0, currency)}
                    </p>
                    <p className="mt-0.5 text-[11px] text-stone-500">
                      Orders still awaiting payment
                    </p>
                  </div>
                  <div className="rounded-[16px] border border-stone-200 bg-stone-50/90 p-2.5">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-stone-500">
                      Best month
                    </p>
                    <p className="mt-1.5 text-base font-semibold text-stone-900">
                      {strongestMonth ? formatMonthLabel(strongestMonth.date) : "-"}
                    </p>
                    <p className="mt-0.5 text-[11px] text-stone-500">
                      {strongestMonth
                        ? formatAmount(strongestMonth.revenue || 0, currency)
                        : "No data for now"}
                    </p>
                  </div>
                  <div className="rounded-[16px] border border-stone-200 bg-stone-50/90 p-2.5">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-stone-500">
                      Units sold / pending
                    </p>
                    <p className="mt-1.5 text-base font-semibold text-stone-900">
                      {product.total_sold_units || 0} / {product.total_pending_units || 0}
                    </p>
                    <p className="mt-0.5 text-[11px] text-stone-500">
                      Fulfilled versus outstanding items
                    </p>
                  </div>
            </div>
          </ShopGraphShell>
        </TabsContent>
          );
        })()
      ))}
    </Tabs>
  );
}
