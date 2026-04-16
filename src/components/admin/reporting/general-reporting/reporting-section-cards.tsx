import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GeneralReport } from "@/interfaces/report";
import { formatAmount } from "@/data/currencies";

interface props {
  report: GeneralReport;
  currency: string;
}

// --- Utility: Card Item ---
function StatCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <Card
      className={`flex-1 min-w-[140px] rounded-[20px] shadow-sm border-0 bg-gradient-to-br ${
        highlight
          ? "from-primary/10 to-primary/5 dark:from-primary/20 dark:to-slate-900"
          : "from-slate-50 to-white dark:from-slate-900 dark:to-slate-950"
      } transition-all duration-200`}
      data-slot="card"
    >
      <CardHeader className="flex flex-col items-center justify-center text-center gap-1 py-4">
        <CardDescription className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
          {label}
        </CardDescription>
        <CardTitle className="text-xl md:text-2xl font-extrabold tabular-nums text-slate-900 dark:text-white">
          {value}
        </CardTitle>
      </CardHeader>
    </Card>
  );
}

// --- Registration Cards ---
export function RegistrationReportingSectionCards({ report, currency }: props) {
  return (
    <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 w-full">
      <StatCard
        label="Registration Revenue"
        value={formatAmount(report?.total_registration_revenue, currency)}
        highlight
      />
      <StatCard
        label="Pending Registration Revenue"
        value={formatAmount(
          report?.total_registration_pending_revenue,
          currency,
        )}
      />
      <StatCard label="Active Members" value={report.total_active_members} />
      <StatCard label="Pending Members" value={report.total_pending_members} />
      <StatCard
        label="Fully Paid Registrations"
        value={report.total_registered_members}
      />
      <StatCard
        label="De-registrations"
        value={report.total_deregistered_members}
      />
    </div>
  );
}

// --- Overall Cards ---
export function OverallReportingSectionCards({ report, currency }: props) {
  return (
    <div className="grid grid-cols-2 gap-3 w-full">
      <StatCard
        label="Total Revenue"
        value={formatAmount(report?.total_revenue, currency)}
        highlight
      />
      <StatCard
        label="Pending Revenue"
        value={formatAmount(report?.total_pending_revenue, currency)}
      />
    </div>
  );
}

// --- Orders Cards ---
export function OrdersReportingSectionCards({ report, currency }: props) {
  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 w-full">
      <StatCard
        label="Shop Revenue"
        value={formatAmount(report?.total_shop_revenue, currency)}
        highlight
      />
      <StatCard
        label="Pending Shop Revenue"
        value={formatAmount(report?.total_shop_pending_revenue, currency)}
      />
      <StatCard label="Items Sold" value={report.total_shop_sold_items} />
      <StatCard
        label="Pending Items"
        value={report.total_shop_pending_sold_items}
      />
    </div>
  );
}
