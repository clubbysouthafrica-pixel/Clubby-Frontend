import { ReportDataRow } from "@/interfaces/report"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatAmount } from "@/data/currencies"
import { OverallReportingSectionCards } from "./reporting-section-cards"
import { OverallComboChart } from "./charts"

import { GeneralReport } from "@/interfaces/report"

interface props {
    report: GeneralReport
    currency: string
}

export function OverallReport({ report, currency }: props) {
    return (
        <div className="space-y-6">
            <div className="text-center space-y-1">
                <h1 className="text-xl font-semibold tracking-tight">Overall Report</h1>
                <p className="text-sm text-muted-foreground">Revenue performance and pending amounts over recent months.</p>
            </div>
            <div className="@container/main flex flex-1 flex-col gap-6">
                <OverallReportingSectionCards report={report} currency={currency} />
                {report?.data?.length > 0 && (
                    <div className="rounded-lg border pt-8 px-4 shadow-sm">
                        <h2 className="text-sm font-medium mb-4 w-full text-center">Members & Revenue</h2>
                        <OverallComboChart data={report.data} currency={currency} />
                    </div>
                )}
                {report?.data && report.data.length > 0 && (
                    <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
                        <Table>
                            <TableHeader className="bg-muted/60 sticky top-0 z-10 backdrop-blur-sm">
                                <TableRow>
                                    <TableHead className="text-center font-medium w-1/3">Month</TableHead>
                                    <TableHead className="text-center font-medium w-1/3">Revenue</TableHead>
                                    <TableHead className="text-center font-medium w-1/3">Pending revenue</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {report.data.map((month: ReportDataRow) => (
                                    <TableRow key={month.date} className="hover:bg-muted/40">
                                        <TableCell className="text-center font-medium w-1/3">{month.date}</TableCell>
                                        <TableCell className="text-center w-1/3">{formatAmount(month.total_revenue, currency)}</TableCell>
                                        <TableCell className="text-center w-1/3">{formatAmount(month.total_pending_revenue, currency)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>
        </div>
    )
}
