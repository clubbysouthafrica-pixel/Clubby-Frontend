import { ExpenseComboChart, OrdersComboChart } from "./charts";
import {
  ExpenseTypeDataRow,
  GeneralReport,
  ReportDataRow,
} from "@/interfaces/report";
import { formatAmount } from "@/data/currencies";

interface props {
  report: GeneralReport;
  currency: string;
}

interface RevenueBreakdownReportProps {
  title: string;
  description: string;
  data?: ReportDataRow[];
  currency: string;
  totalRevenue?: number;
  totalPendingRevenue?: number;
  valueLabel?: string;
  pendingValueLabel?: string;
  emptyStateLabel?: string;
  chartMode?: "revenue" | "expense";
}

export function RevenueBreakdownReport({
  title,
  description,
  data = [],
  currency,
  totalRevenue,
  totalPendingRevenue,
  valueLabel = "Revenue",
  pendingValueLabel = "Pending",
  emptyStateLabel,
  chartMode = "revenue",
}: RevenueBreakdownReportProps) {
  return (
    <div className="space-y-3">
      <div className="text-center space-y-1">
        <h1 className="text-lg md:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {title}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {description}
        </p>
      </div>

      <div>
        {chartMode === "expense" ? (
          <ExpenseComboChart data={data} currency={currency} title={title} subtitle={description} />
        ) : (
          <OrdersComboChart data={data} currency={currency} />
        )}
      </div>
      {!data.length &&
        (typeof totalRevenue === "number" ||
          typeof totalPendingRevenue === "number") && (
          <p className="text-center text-xs text-slate-500">
            {chartMode === "expense"
              ? `${emptyStateLabel || valueLabel} ${formatAmount(totalRevenue || 0, currency)}.`
              : `${emptyStateLabel || valueLabel} ${formatAmount(totalRevenue || 0, currency)}. ${pendingValueLabel} ${formatAmount(totalPendingRevenue || 0, currency)}.`}
          </p>
        )}
    </div>
  );
}

export function ExpenseReport({ report, currency }: props) {
  const expenseTypeData = report.expense_type_data ?? [];

  return (
    <div className="space-y-4">
      <RevenueBreakdownReport
        title="Expense Report"
        description="Club expenses over time."
        data={report.expense_data ?? []}
        currency={currency}
        totalRevenue={report.total_expense}
        valueLabel="Expense"
        emptyStateLabel="Expense"
        chartMode="expense"
      />

      {expenseTypeData.length > 0 && (
        <div className="space-y-3">
          <div className="text-center space-y-1">
            <h2 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white md:text-lg">
              Expense Type Breakdown
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Monthly expense trends grouped by expense type.
            </p>
          </div>

          <div className="space-y-3">
            {expenseTypeData.map((expenseType: ExpenseTypeDataRow) => (
              <div
                key={expenseType.type}
                className="rounded-[20px] border border-slate-200/70 bg-white p-3 shadow-sm md:p-4"
              >
                <ExpenseComboChart
                  data={expenseType.data ?? []}
                  currency={currency}
                  title={`${expenseType.type} Expense Trend`}
                  subtitle={`${expenseType.type} expense over time.`}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function OrdersReport({ report, currency }: props) {
  return (
    <RevenueBreakdownReport
      title="Shop Report"
      description="Shop orders and revenue over time."
      data={report.shop_data ?? report.order_data ?? []}
      currency={currency}
      totalRevenue={report.total_shop_revenue}
      totalPendingRevenue={report.total_shop_pending_revenue}
    />
  );
}
