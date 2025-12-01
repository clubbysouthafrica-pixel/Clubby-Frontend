import { ReportDataRow } from "@/interfaces/report"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatAmount } from "@/data/currencies"
import { RegistrationReportingSectionCards } from "./reporting-section-cards"
import { RegistrationComboChart } from "./charts"

import { GeneralReport } from "@/interfaces/report"

interface props {
    report: GeneralReport
    currency: string
}

export function RegistrationReport({ report, currency }: props) {
    return (
        <div className="space-y-6">
            <div className="text-center space-y-1">
                <h1 className="text-xl font-semibold tracking-tight">Registration Report</h1>
                <p className="text-sm text-muted-foreground">Registrations, deregistrations, and revenue over time.</p>
            </div>
            {report && (
                <div className="@container/main flex flex-1 flex-col gap-6">
                    <RegistrationReportingSectionCards report={report} currency={currency} />
                    {report.data?.length > 0 && (
                        <div className="rounded-lg border pt-8 px-4 shadow-sm">
                            <h2 className="text-sm font-medium mb-4 w-full text-center">Activity & Revenue</h2>
                            <RegistrationComboChart data={report.data} currency={currency} />
                        </div>
                    )}
                </div>
            )}
            {report?.data && report.data.length > 0 && (
                <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
                    <Table>
                        <TableHeader className="bg-muted/60 sticky top-0 z-10 backdrop-blur-sm">
                            <TableRow>
                                <TableHead className="text-center font-medium w-1/5">Month</TableHead>
                                <TableHead className="text-center font-medium w-1/5">Registration Revenue</TableHead>
                                <TableHead className="text-center font-medium w-1/5">Pending Registration Revenue</TableHead>
                                <TableHead className="text-center font-medium w-1/5">Fully Paid Registrations</TableHead>
                                <TableHead className="text-center font-medium w-1/5">De-registrations</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {report.data?.map((month: ReportDataRow) => (
                                <TableRow key={month.date} className="hover:bg-muted/40">
                                    <TableCell className="text-center font-medium w-1/5">{month.date}</TableCell>
                                    <TableCell className="text-center w-1/5">{formatAmount(month.total_revenue, currency)}</TableCell>
                                    <TableCell className="text-center w-1/5">{formatAmount(month.total_pending_revenue, currency)}</TableCell>
                                    <TableCell className="text-center w-1/5">{month.total_registered_members}</TableCell>
                                    <TableCell className="text-center w-1/5">{month.total_deregistered_members}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    )
}
