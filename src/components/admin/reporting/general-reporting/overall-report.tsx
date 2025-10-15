import { ReportDataRow } from "@/interfaces/report"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatAmount } from "@/data/currencies"
import { OverallReportingSectionCards } from "./reporting-section-cards"

interface props {
    report: any
    currency: string
}

export function OverallReport({ report, currency }: props) {
    return (
        <div>
            <h1 className="text-base font-bold">Overall Report</h1>
            {
                <div className="@container/main flex flex-1 flex-col gap-2">
                    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-2">
                        <OverallReportingSectionCards report={report} currency={currency} />
                    </div>
                </div>
            }
            {report?.data && report.data.length > 0 &&
                <div className="overflow-hidden rounded-lg border">
                    <Table>
                        <TableHeader className="bg-muted sticky top-0 z-10">
                            <TableRow>
                                <TableHead className="text-center font-bold w-1/3">Month</TableHead>
                                <TableHead className="text-center font-bold w-1/3">Revenue</TableHead>
                                <TableHead className="text-center font-bold w-1/3">Pending revenue</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {report?.data?.map((month: ReportDataRow) => (
                                <TableRow key={month.date}>
                                    <TableCell className="text-center font-bold w-1/3">{month.date}</TableCell>
                                    <TableCell className="text-center w-1/3">{formatAmount(month.total_revenue, currency)}</TableCell>
                                    <TableCell className="text-center w-1/3">{formatAmount(month.total_pending_revenue, currency)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            }
        </div>
    )
}
