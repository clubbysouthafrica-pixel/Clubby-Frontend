import { RegistrationReportDataRow } from "@/interfaces/report";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatAmount } from "@/data/currencies";
import { RegistrationReportingSectionCards } from "./reporting-section-cards";
import { RegistrationComboChart } from "./charts";
import { GeneralReport } from "@/interfaces/report";

interface props {
  report: GeneralReport;
  currency: string;
}

export function RegistrationReport({ report, currency }: props) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Registration Report
        </h1>
        <p className="text-base text-slate-500 dark:text-slate-400">
          Registrations, deregistrations, and revenue over time.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6">
        <RegistrationReportingSectionCards
          report={report}
          currency={currency}
        />
      </div>

      {/* Chart Section */}
      {report?.registration_data?.length > 0 && (
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 shadow-lg p-6 md:p-10">
          <h2 className="text-lg font-semibold mb-6 text-center text-slate-800 dark:text-slate-200">
            Activity & Revenue Trend
          </h2>
          <RegistrationComboChart
            data={report.registration_data}
            currency={currency}
          />
        </div>
      )}

      {/* Data Table */}
      {report?.registration_data && report.registration_data.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-800 sticky top-0 z-10 backdrop-blur">
              <TableRow>
                <TableHead className="text-center font-semibold text-base text-slate-700 dark:text-slate-200 w-1/5">
                  Month
                </TableHead>
                <TableHead className="text-center font-semibold text-base text-slate-700 dark:text-slate-200 w-1/5">
                  Registration Revenue
                </TableHead>
                <TableHead className="text-center font-semibold text-base text-slate-700 dark:text-slate-200 w-1/5">
                  Pending Registration Revenue
                </TableHead>
                <TableHead className="text-center font-semibold text-base text-slate-700 dark:text-slate-200 w-1/5">
                  Fully Paid Registrations
                </TableHead>
                <TableHead className="text-center font-semibold text-base text-slate-700 dark:text-slate-200 w-1/5">
                  De-registrations
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.registration_data.map(
                (month: RegistrationReportDataRow, idx: number) => (
                  <TableRow
                    key={month.date}
                    className={`transition-colors ${
                      idx % 2 === 0
                        ? "bg-slate-50 dark:bg-slate-900"
                        : "bg-white dark:bg-slate-800"
                    } hover:bg-primary/10 dark:hover:bg-primary/20`}
                  >
                    <TableCell className="text-center font-medium w-1/5">
                      {month.date}
                    </TableCell>
                    <TableCell className="text-center w-1/5">
                      {formatAmount(month.total_revenue, currency)}
                    </TableCell>
                    <TableCell className="text-center w-1/5">
                      {formatAmount(month.total_pending_revenue, currency)}
                    </TableCell>
                    <TableCell className="text-center w-1/5">
                      {month.total_registered_members}
                    </TableCell>
                    <TableCell className="text-center w-1/5">
                      {month.total_deregistered_members}
                    </TableCell>
                  </TableRow>
                ),
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
