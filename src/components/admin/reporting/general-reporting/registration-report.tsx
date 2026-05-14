import { RegistrationComboChart } from "./charts";
import { GeneralReport } from "@/interfaces/report";

interface props {
  report: GeneralReport;
  currency: string;
}

export function RegistrationReport({ report, currency }: props) {
  return (
    <div className="space-y-3">
      <div className="text-center space-y-1">
        <h1 className="text-lg md:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Registration Report
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Registrations, deregistrations, and revenue over time.
        </p>
      </div>

      <div>
        <RegistrationComboChart
          data={report?.registration_data ?? []}
          currency={currency}
        />
      </div>
    </div>
  );
}
