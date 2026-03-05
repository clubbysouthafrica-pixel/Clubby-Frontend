import { ReportDataRow } from "@/interfaces/report";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatAmount } from "@/data/currencies";
import { OverallReportingSectionCards } from "./reporting-section-cards";
import { OverallComboChart } from "./charts";
import { GeneralReport } from "@/interfaces/report";

interface props {
  report: GeneralReport;
  currency: string;
}

export function OverallReport({ report, currency }: props) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Overall Report
        </h1>
        <p className="text-base text-slate-500 dark:text-slate-400">
          Revenue performance and pending amounts over recent months.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6">
        <OverallReportingSectionCards report={report} currency={currency} />
      </div>

      {/* Chart Section */}
      {report?.data?.length > 0 && (
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 shadow-lg p-6 md:p-10">
          <h2 className="text-lg font-semibold mb-6 text-center text-slate-800 dark:text-slate-200">
            Members & Revenue Trend
          </h2>
          <OverallComboChart data={report.data} currency={currency} />
        </div>
      )}

      {/* Data Table */}
      {report?.data && report.data.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-800 sticky top-0 z-10 backdrop-blur">
              <TableRow>
                <TableHead className="text-center font-semibold text-base text-slate-700 dark:text-slate-200 w-1/3">
                  Month
                </TableHead>
                <TableHead className="text-center font-semibold text-base text-slate-700 dark:text-slate-200 w-1/3">
                  Revenue
                </TableHead>
                <TableHead className="text-center font-semibold text-base text-slate-700 dark:text-slate-200 w-1/3">
                  Pending Revenue
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.data.map((month: ReportDataRow, idx: number) => (
                <TableRow
                  key={month.date}
                  className={`transition-colors ${
                    idx % 2 === 0
                      ? "bg-slate-50 dark:bg-slate-900"
                      : "bg-white dark:bg-slate-800"
                  } hover:bg-primary/10 dark:hover:bg-primary/20`}
                >
                  <TableCell className="text-center font-medium w-1/3">
                    {month.date}
                  </TableCell>
                  <TableCell className="text-center w-1/3">
                    {formatAmount(month.total_revenue, currency)}
                  </TableCell>
                  <TableCell className="text-center w-1/3">
                    {formatAmount(month.total_pending_revenue, currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
