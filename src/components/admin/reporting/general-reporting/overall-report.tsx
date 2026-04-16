import { OverallComboChart } from "./charts";
import { GeneralReport } from "@/interfaces/report";

interface props {
  report: GeneralReport;
  currency: string;
}

export function OverallReport({ report, currency }: props) {
  return (
    <div className="space-y-3">
      <div className="text-center space-y-1">
        <h1 className="text-lg md:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Overall Report
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Revenue performance and pending amounts over recent months.
        </p>
      </div>

      {report?.data?.length > 0 && (
        <div>
          <OverallComboChart data={report.data} currency={currency} />
        </div>
      )}
    </div>
  );
}
