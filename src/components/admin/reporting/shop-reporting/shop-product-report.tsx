import { ShopReport } from "@/interfaces/report";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatAmount } from "@/data/currencies";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ShopProductReportProps {
  report: ShopReport;
  currency: string;
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

function formatRevenueAxisLabel(value: number, currency: string): string {
  return `${currency} ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export function ShopProductReport({
  report,
  currency,
}: ShopProductReportProps) {
  // If there is no report or the report array is empty, show a message
  if (!report?.report || report.report.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <span className="text-lg font-semibold text-slate-500 dark:text-slate-400">
          No shop product data available.
        </span>
      </div>
    );
  }

  return (
    <Tabs
      defaultValue={report.report[0]?.product_id.toString()}
      className="w-full"
    >
      {/* Tab Navigation */}
      <div className="sticky top-0 p-4 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur">
        <div className="px-2 md:px-4">
          <TabsList className="flex flex-row gap-2 bg-transparent p-0 h-auto overflow-x-auto">
            {report.report.map((product) => (
              <TabsTrigger
                key={product.product_id}
                value={product.product_id.toString()}
                className="px-6 py-3 rounded-lg font-semibold text-base transition-all duration-300 data-[state=active]:bg-primary/10 dark:data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=inactive]:text-slate-600 dark:data-[state=inactive]:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 whitespace-nowrap"
              >
                {product.product_name}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </div>

      {/* Tab Content */}
      {report.report.map((product) => (
        <TabsContent
          key={product.product_id}
          value={product.product_id.toString()}
          className="space-y-8 p-4 md:p-8"
        >
          {/* Product Header Card Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="rounded-2xl shadow-md border-0 bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-950/30 dark:to-rose-950/10">
              <div className="p-4">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                  Price per Item
                </p>
                <p className="text-2xl font-extrabold mt-1 text-slate-900 dark:text-white tracking-tight truncate">
                  {formatAmount(product.price, currency)}
                </p>
              </div>
            </Card>
            <Card className="rounded-2xl shadow-md border-0 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-950/10">
              <div className="p-4">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                  Total Revenue
                </p>
                <p className="text-2xl font-extrabold mt-1 text-slate-900 dark:text-white tracking-tight truncate">
                  {formatAmount(product.total_revenue, currency)}
                </p>
              </div>
            </Card>
            <Card className="rounded-2xl shadow-md border-0 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-950/10">
              <div className="p-4">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                  Pending Revenue
                </p>
                <p className="text-2xl font-extrabold mt-1 text-slate-900 dark:text-white tracking-tight truncate">
                  {formatAmount(product.total_pending_revenue, currency)}
                </p>
              </div>
            </Card>
            <Card className="rounded-2xl shadow-md border-0 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-950/10">
              <div className="p-4">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                  Units Sold / Pending
                </p>
                <p className="text-2xl font-extrabold mt-1 text-slate-900 dark:text-white tracking-tight">
                  {product.total_sold_units} / {product.total_pending_units}
                </p>
              </div>
            </Card>
          </div>

          {/* Chart or No Data */}
          {product.data && product.data.length > 0 ? (
            <Card className="rounded-2xl shadow-md border-0 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Sales Trend
              </h3>
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={product.data.map((d) => ({
                      name: formatMonthLabel(d.date),
                      revenue: d.revenue,
                      sold_units: d.sold_units,
                      pending_revenue: d.pending_revenue,
                      pending_units: d.pending_units,
                    }))}
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
                      tickFormatter={(value) =>
                        formatRevenueAxisLabel(value, currency)
                      }
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
                      contentStyle={{
                        background: "rgba(30,41,59,0.95)",
                        border: "1px solid #6366f1",
                        borderRadius: "10px",
                        color: "#fff",
                        fontWeight: 500,
                        fontSize: 14,
                      }}
                      labelStyle={{ color: "#fff" }}
                      formatter={(value: any, name: string) => {
                        if (name === "Revenue" || name === "Pending Revenue") {
                          return [
                            `${currency} ${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
                            name,
                          ];
                        }
                        return [value, name];
                      }}
                    />
                    <Legend />
                    <Bar
                      yAxisId="left"
                      dataKey="revenue"
                      name="Revenue"
                      fill="#10b981"
                      radius={[8, 8, 0, 0]}
                      barSize={24}
                      opacity={0.85}
                    />
                    <Bar
                      yAxisId="left"
                      dataKey="pending_revenue"
                      name="Pending Revenue"
                      fill="#fbbf24"
                      radius={[8, 8, 0, 0]}
                      barSize={24}
                      opacity={0.7}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="sold_units"
                      name="Units Sold"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={false}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="pending_units"
                      name="Pending Units"
                      stroke="#a78bfa"
                      strokeWidth={3}
                      dot={false}
                      strokeDasharray="6 4"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </Card>
          ) : (
            <Card className="rounded-2xl shadow-md border-0 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 p-8 flex items-center justify-center">
              <span className="text-base font-medium text-slate-500 dark:text-slate-400">
                No data available for this product.
              </span>
            </Card>
          )}

          {/* Historical Data Table or No Data */}
          {product.data && product.data.length > 0 ? (
            <Card className="rounded-2xl shadow-md border-0 bg-white dark:bg-slate-900 overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-800 sticky top-0 z-10 backdrop-blur">
                  <TableRow>
                    <TableHead className="text-center font-semibold text-base text-slate-700 dark:text-slate-200 w-1/5">
                      Date
                    </TableHead>
                    <TableHead className="text-center font-semibold text-base text-slate-700 dark:text-slate-200 w-1/5">
                      Revenue
                    </TableHead>
                    <TableHead className="text-center font-semibold text-base text-slate-700 dark:text-slate-200 w-1/5">
                      Pending
                    </TableHead>
                    <TableHead className="text-center font-semibold text-base text-slate-700 dark:text-slate-200 w-1/5">
                      Units Sold
                    </TableHead>
                    <TableHead className="text-center font-semibold text-base text-slate-700 dark:text-slate-200 w-1/5">
                      Pending Units
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {product.data.map((row, idx) => (
                    <TableRow
                      key={idx}
                      className={`transition-colors ${
                        idx % 2 === 0
                          ? "bg-slate-50 dark:bg-slate-900"
                          : "bg-white dark:bg-slate-800"
                      } hover:bg-primary/10 dark:hover:bg-primary/20`}
                    >
                      <TableCell className="text-center font-medium w-1/5">
                        {row.date}
                      </TableCell>
                      <TableCell className="text-center w-1/5">
                        {formatAmount(row.revenue, currency)}
                      </TableCell>
                      <TableCell className="text-center w-1/5">
                        {formatAmount(row.pending_revenue, currency)}
                      </TableCell>
                      <TableCell className="text-center w-1/5">
                        {row.sold_units}
                      </TableCell>
                      <TableCell className="text-center w-1/5">
                        {row.pending_units}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          ) : (
            <Card className="rounded-2xl shadow-md border-0 bg-white dark:bg-slate-900 p-8 flex items-center justify-center">
              <span className="text-base font-medium text-slate-500 dark:text-slate-400">
                No historical data for this product.
              </span>
            </Card>
          )}
        </TabsContent>
      ))}
    </Tabs>
  );
}
