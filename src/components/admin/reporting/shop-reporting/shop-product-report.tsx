import { ShopReport } from "@/interfaces/report";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatAmount } from "@/data/currencies";
import { ShoppingBag, TrendingUp } from "lucide-react";
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
      return d.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
    }
  } catch {
    // ignore invalid date formats
  }
  return date;
}

function formatRevenueAxisLabel(value: number, currency: string): string {
  return `${currency} ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export function ShopProductReport({ report, currency }: ShopProductReportProps) {
  return (
    <Tabs defaultValue={report.report[0]?.product_id.toString()} className="w-full">
      {/* Tab Navigation */}
      <div className="border-b border-slate-200/50 dark:border-slate-800/50 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md sticky top-0 z-30">
        <div className="px-6 md:px-8">
          <TabsList className="flex flex-row gap-2 bg-transparent p-0 h-auto overflow-x-auto">
            {report.report.map((product) => (
              <TabsTrigger 
                key={product.product_id}
                value={product.product_id.toString()}
                className="px-4 py-3 rounded-lg font-medium text-sm transition-all duration-300 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm data-[state=active]:text-primary data-[state=inactive]:text-slate-600 dark:data-[state=inactive]:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 whitespace-nowrap"
              >
                {product.product_name}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </div>

      {/* Tab Content */}
      {report.report.map((product) => (
        <TabsContent key={product.product_id} value={product.product_id.toString()} className="space-y-4 p-6 md:p-8">

          {/* Product Header Card */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="relative overflow-hidden border bg-gradient-to-br from-rose-50 to-rose-50/50 dark:from-rose-950/30 dark:to-rose-950/10 border-rose-200/50 dark:border-rose-800/30 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
              <div className="p-2">
                <div className="flex items-start justify-between gap-1.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                      Price per Item
                    </p>
                    <p className="text-lg md:text-xl font-bold mt-0.5 text-slate-900 dark:text-white tracking-tight truncate">
                      {formatAmount(product.total_sold_units > 0 ? product.total_revenue / product.total_sold_units : 0, currency)}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="relative overflow-hidden border bg-gradient-to-br from-emerald-50 to-emerald-50/50 dark:from-emerald-950/30 dark:to-emerald-950/10 border-emerald-200/50 dark:border-emerald-800/30 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
              <div className="p-2">
                <div className="flex items-start justify-between gap-1.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                      Total Revenue
                    </p>
                    <p className="text-lg md:text-xl font-bold mt-0.5 text-slate-900 dark:text-white tracking-tight truncate">
                      {formatAmount(product.total_revenue, currency)}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="relative overflow-hidden border bg-gradient-to-br from-amber-50 to-amber-50/50 dark:from-amber-950/30 dark:to-amber-950/10 border-amber-200/50 dark:border-amber-800/30 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
              <div className="p-2">
                <div className="flex items-start justify-between gap-1.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                      Pending Revenue
                    </p>
                    <p className="text-lg md:text-xl font-bold mt-0.5 text-slate-900 dark:text-white tracking-tight truncate">
                      {formatAmount(product.total_pending_revenue, currency)}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="relative overflow-hidden border bg-gradient-to-br from-purple-50 to-purple-50/50 dark:from-purple-950/30 dark:to-purple-950/10 border-purple-200/50 dark:border-purple-800/30 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
              <div className="p-2">
                <div className="flex items-start justify-between gap-1.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                      Units Sold / Pending
                    </p>
                    <p className="text-lg md:text-xl font-bold mt-0.5 text-slate-900 dark:text-white tracking-tight">
                      {product.total_sold_units} / {product.total_pending_units}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Chart */}
          {product.data && product.data.length > 0 && (
            <Card className="border border-slate-200/50 dark:border-slate-800/50 p-6 backdrop-blur-sm">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
                Sales Trend
              </h3>
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={product.data.map((d) => ({
                    name: formatMonthLabel(d.date),
                    revenue: d.revenue / 100,
                    sold_units: d.sold_units,
                    pending_revenue: d.pending_revenue / 100,
                    pending_units: d.pending_units,
                  }))}>
                    <CartesianGrid strokeDasharray="4 4" className="stroke-muted" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 12 }} tickFormatter={(value) => formatRevenueAxisLabel(value, currency)} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(0, 0, 0, 0.8)",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        borderRadius: "8px",
                        color: "#fff",
                      }}
                      formatter={(value: any, name: string) => {
                        if (name === "Revenue") {
                          return [`${currency} ${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`, name];
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
                      opacity={0.8}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="sold_units"
                      name="Units Sold"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          {/* Historical Data Table */}
          {product.data && product.data.length > 0 && (
            <Card className="border border-slate-200/50 dark:border-slate-800/50 overflow-hidden backdrop-blur-sm">
              <Table>
                <TableHeader className="bg-muted/60 sticky top-0 z-10 backdrop-blur-sm">
                  <TableRow>
                    <TableHead className="text-center font-medium w-1/5">Date</TableHead>
                    <TableHead className="text-center font-medium w-1/5">Revenue</TableHead>
                    <TableHead className="text-center font-medium w-1/5">Pending</TableHead>
                    <TableHead className="text-center font-medium w-1/5">Units Sold</TableHead>
                    <TableHead className="text-center font-medium w-1/5">Pending Units</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {product.data.map((row, idx) => (
                    <TableRow key={idx} className="hover:bg-muted/40">
                      <TableCell className="text-center font-medium w-1/5">{row.date}</TableCell>
                      <TableCell className="text-center w-1/5">
                        {formatAmount(row.revenue / 100, currency)}
                      </TableCell>
                      <TableCell className="text-center w-1/5">
                        {formatAmount(row.pending_revenue / 100, currency)}
                      </TableCell>
                      <TableCell className="text-center w-1/5">{row.sold_units}</TableCell>
                      <TableCell className="text-center w-1/5">{row.pending_units}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      ))}
    </Tabs>
  );
}
