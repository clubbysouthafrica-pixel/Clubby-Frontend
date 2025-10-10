import { ReportDataRow } from "@/interfaces/report"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatAmount } from "@/data/currencies"
import { RegistrationReportingSectionCards } from "./reporting-section-cards"

interface props {
    report: any
    currency: string
}

export function RegistrationReport({ report, currency }: props) {
    console.log(report)
    return (
        <div>
            <h1 className="text-base font-bold">Registration Report</h1>
            {report && report.data &&
                <div className="@container/main flex flex-1 flex-col gap-2">
                    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-2">
                        <RegistrationReportingSectionCards report={report} currency={currency as string} />
                    </div>
                </div>
            }
            {report && report.data.length > 0 &&
                <div className="overflow-hidden rounded-lg border">
                    <Table>
                        <TableHeader className="bg-muted sticky top-0 z-10">
                            <TableRow>
                                <TableHead className="text-center font-bold w-1/5">Month</TableHead>
                                <TableHead className="text-center font-bold w-1/5">Registration Revenue</TableHead>
                                <TableHead className="text-center font-bold w-1/5">Pending Registration Revenue</TableHead>
                                <TableHead className="text-center font-bold w-1/5">Completed Registrations</TableHead>
                                <TableHead className="text-center font-bold w-1/5">Members deregistered</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {report.data?.map((month: ReportDataRow) => (
                                <TableRow key={month.date}>
                                    <TableCell className="text-center font-bold w-1/5">{month.date}</TableCell>
                                    <TableCell className="text-center w-1/5">{formatAmount(month.total_revenue, currency)}</TableCell>
                                    <TableCell className="text-center w-1/5">{formatAmount(month.total_pending_revenue, currency)}</TableCell>
                                    <TableCell className="text-center w-1/5">{month.total_registered_members}</TableCell>
                                    <TableCell className="text-center w-1/5">{month.total_deregistered_members}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            }
        </div>
    )
}
