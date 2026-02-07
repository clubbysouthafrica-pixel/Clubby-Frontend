import { OrderReportDataRow } from "@/interfaces/report"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatAmount } from "@/data/currencies"
import { OrdersReportingSectionCards } from "./reporting-section-cards"
import { OrdersComboChart } from "./charts"

import { GeneralReport } from "@/interfaces/report"

interface props {
    report: GeneralReport
    currency: string
}

export function OrdersReport({ report, currency }: props) {
    return (
        <div className="space-y-6">
            <div className="text-center space-y-1">
                <h1 className="text-xl font-semibold tracking-tight">Orders Report</h1>
                <p className="text-sm text-muted-foreground">Shop orders, items sold, and revenue over time.</p>
            </div>
            {report && (
                <div className="@container/main flex flex-1 flex-col gap-6">
                    <OrdersReportingSectionCards report={report} currency={currency} />
                    {report.order_data?.length > 0 && (
                        <div className="rounded-lg border pt-8 px-4 shadow-sm">
                            <h2 className="text-sm font-medium mb-4 w-full text-center">Sales & Items Sold</h2>
                            <OrdersComboChart data={report.order_data} currency={currency} />
                        </div>
                    )}
                </div>
            )}
            {report?.order_data && report.order_data.length > 0 && (
                <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
                    <Table>
                        <TableHeader className="bg-muted/60 sticky top-0 z-10 backdrop-blur-sm">
                            <TableRow>
                                <TableHead className="text-center font-medium w-1/5">Month</TableHead>
                                <TableHead className="text-center font-medium w-1/5">Order Revenue</TableHead>
                                <TableHead className="text-center font-medium w-1/5">Pending Order Revenue</TableHead>
                                <TableHead className="text-center font-medium w-1/5">Items Sold</TableHead>
                                <TableHead className="text-center font-medium w-1/5">Pending Items</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {report.order_data?.map((month: OrderReportDataRow) => (
                                <TableRow key={month.date} className="hover:bg-muted/40">
                                    <TableCell className="text-center font-medium w-1/5">{month.date}</TableCell>
                                    <TableCell className="text-center w-1/5">{formatAmount(month.total_shop_revenue, currency)}</TableCell>
                                    <TableCell className="text-center w-1/5">{formatAmount(month.total_shop_pending_revenue, currency)}</TableCell>
                                    <TableCell className="text-center w-1/5">{month.total_shop_sold_items}</TableCell>
                                    <TableCell className="text-center w-1/5">{month.total_shop_pending_sold_items}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    )
}
