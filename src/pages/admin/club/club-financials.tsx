import { Fragment, useContext, useEffect, useRef, useState } from "react";
import { ClubContext, ClubContextType } from "@/context/ClubContext";
import { useGeneralReportingQuery } from "@/queries/admin/useReporting";
import { useFetchClubTransactions } from "@/queries/admin/transactions";
import { OverallReport } from "@/components/admin/reporting/general-reporting/overall-report";
import { RegistrationReport } from "@/components/admin/reporting/general-reporting/registration-report";
import {
  OrdersReport,
  RevenueBreakdownReport,
} from "@/components/admin/reporting/general-reporting/orders-report";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  Download,
  Bell,
  X,
  CheckCircle2,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Copy,
  AlertCircle,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatAmount } from "@/data/currencies";
import { api } from "@/services/admin/api";
import { toast } from "sonner";
import { isStorageFeatureEnabled } from "@/lib/feature-flags";
import { useSearchParams } from "react-router-dom";
import {
  ExpenseTypeDataRow,
  OrderReportDataRow,
  RegistrationReportDataRow,
  ReportDataRow,
} from "@/interfaces/report";

type LifecycleEntry = {
  type: string;
  description: string;
  amount: number;
  payment_type?: string;
  payment_reference?: string;
  refund_completed?: boolean;
};

type TransactionRecord = {
  transaction_id: string;
  name?: string;
  type?: string | null;
  order_id?: string;
  registration_id?: string;
  event_registration_id?: string;
  user_id?: string;
  club_income?: boolean | string | null;
  status?: string;
  amount?: number | null;
  amount_paid?: number | null;
  lifecycle: Record<string, LifecycleEntry>;
};

type TransactionDisplayPaymentStatus =
  | "AWAITING_PAYMENT"
  | "PARTIALLY_PAID"
  | "PAID"
  | "CANCELLED"
  | "REFUNDED";

type RefundRow = LifecycleEntry & {
  timestamp: number;
  transaction_id: string;
  name?: string;
  type: string;
  order_id?: string;
};

type RefundConfirmationResponse = {
  message?: string;
};

type IncomeGraphKey = "overall" | "registration" | "shop" | "events" | "storage";

function getTransactionRefundedAmount(tx: TransactionRecord) {
  const lifecycleRefundAmount = Object.values(tx.lifecycle || {}).reduce(
    (sum, entry) => {
      if (entry.type !== "REFUND") {
        return sum;
      }

      return sum + Math.max(entry.amount || 0, 0);
    },
    0,
  );

  if (lifecycleRefundAmount > 0) {
    return lifecycleRefundAmount;
  }

  const normalizedStatus = tx.status?.trim().toUpperCase().replace(/\s+/g, "_") || "";

  if (normalizedStatus === "REFUND" || normalizedStatus === "REFUNDED") {
    return tx.amount || 0;
  }

  if (
    normalizedStatus === "PAID_PARTIAL_REFUND" ||
    (normalizedStatus.includes("PARTIAL") &&
      normalizedStatus.includes("REFUND"))
  ) {
    return Math.max((tx.amount || 0) - (tx.amount_paid || 0), 0);
  }

  return 0;
}

function getTransactionEffectiveAmount(tx: TransactionRecord) {
  return Math.max((tx.amount || 0) - getTransactionRefundedAmount(tx), 0);
}

function getTransactionOutstandingAmount(tx: TransactionRecord) {
  return Math.max(getTransactionEffectiveAmount(tx) - (tx.amount_paid || 0), 0);
}

function getTransactionDisplayPaymentStatus(
  tx: TransactionRecord,
): TransactionDisplayPaymentStatus {
  const normalizedStatus = tx.status?.trim().toUpperCase().replace(/\s+/g, "_") || "";
  const refundedAmount = getTransactionRefundedAmount(tx);
  const totalAmount = tx.amount || 0;
  const amountPaid = tx.amount_paid || 0;
  const effectiveAmount = getTransactionEffectiveAmount(tx);
  const outstandingAmount = getTransactionOutstandingAmount(tx);

  if (normalizedStatus === "CANCELLED") {
    return "CANCELLED";
  }

  if (
    normalizedStatus === "REFUND" ||
    normalizedStatus === "REFUNDED" ||
    (totalAmount > 0 && refundedAmount >= totalAmount)
  ) {
    return "REFUNDED";
  }

  if (amountPaid <= 0) {
    return "AWAITING_PAYMENT";
  }

  if (effectiveAmount > 0 && outstandingAmount <= 0) {
    return "PAID";
  }

  return "PARTIALLY_PAID";
}

function getTransactionPaymentLabel(tx: TransactionRecord) {
  switch (getTransactionDisplayPaymentStatus(tx)) {
    case "PAID":
      return "Paid";
    case "PARTIALLY_PAID":
      return "Partially paid";
    case "CANCELLED":
      return "Cancelled";
    case "REFUNDED":
      return "Refunded";
    default:
      return "Awaiting payment";
  }
}

function getTransactionFlowLabel(tx: {
  club_income?: boolean | string | null;
  type?: string | null;
  status?: string | null;
}) {
  const normalizedStatus = tx.status?.trim().toUpperCase().replace(/\s+/g, "_");

  if (
    normalizedStatus === "REFUND" ||
    normalizedStatus === "REFUNDED" ||
    normalizedStatus === "CANCELLED"
  ) {
    return "N/A";
  }

  if (tx.club_income === true || tx.club_income === "true") {
    return "Club Income";
  }

  if (tx.club_income === false || tx.club_income === "false") {
    return "Club Expense";
  }

  return tx.type || "-";
}

function getTransactionTypeBadgeClassName() {
  return "border-slate-200/80 bg-slate-100 text-slate-700";
}

function getTransactionFlowBadgeClassName(tx: {
  club_income?: boolean | string | null;
  status?: string | null;
}) {
  const normalizedStatus = tx.status?.trim().toUpperCase().replace(/\s+/g, "_");

  if (
    normalizedStatus === "REFUND" ||
    normalizedStatus === "REFUNDED" ||
    normalizedStatus === "CANCELLED"
  ) {
    return "border-slate-200 bg-slate-100 text-slate-700";
  }

  if (tx.club_income === true || tx.club_income === "true") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (tx.club_income === false || tx.club_income === "false") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-slate-200 bg-slate-100 text-slate-700";
}

function getTransactionTypeIcon(tx: {
  club_income?: boolean | string | null;
  status?: string | null;
}) {
  const normalizedStatus = tx.status?.trim().toUpperCase().replace(/\s+/g, "_");

  if (
    normalizedStatus === "REFUND" ||
    normalizedStatus === "REFUNDED" ||
    normalizedStatus === "CANCELLED"
  ) {
    return null;
  }

  if (tx.club_income === true || tx.club_income === "true") {
    return ArrowUpRight;
  }

  if (tx.club_income === false || tx.club_income === "false") {
    return ArrowDownRight;
  }

  return null;
}

function isExpenseTransaction(tx: {
  club_income?: boolean | string | null;
}) {
  return tx.club_income === false || tx.club_income === "false";
}

function getLifecycleAmountClassName(
  tx: { club_income?: boolean | string | null },
  entryType: string,
) {
  if (
    entryType === "CANCELLATION" ||
    entryType === "REFUND" ||
    isExpenseTransaction(tx)
  ) {
    return "text-red-700";
  }

  if (entryType === "SUBMISSION") {
    return "text-slate-700";
  }

  return "text-emerald-700";
}

function getLifecycleAmountPrefix(
  tx: { club_income?: boolean | string | null },
  entryType: string,
) {
  if (entryType === "SUBMISSION") {
    return "";
  }

  if (entryType === "CANCELLATION") {
    return "N/A";
  }

  if (entryType === "REFUND" || isExpenseTransaction(tx)) {
    return "-";
  }

  return "+";
}

function getTransactionPaymentClassName(tx: TransactionRecord) {
  const displayStatus = getTransactionDisplayPaymentStatus(tx);

  if (displayStatus === "AWAITING_PAYMENT") {
    return "text-blue-700";
  }

  if (displayStatus === "PARTIALLY_PAID") {
    return "text-orange-600";
  }

  if (displayStatus === "REFUNDED" || displayStatus === "CANCELLED") {
    return "text-red-700";
  }

  return "text-emerald-700";
}

function shouldShowTransactionPaymentProgress(tx: TransactionRecord) {
  const displayStatus = getTransactionDisplayPaymentStatus(tx);

  return (
    (displayStatus === "AWAITING_PAYMENT" ||
      displayStatus === "PARTIALLY_PAID") &&
    getTransactionEffectiveAmount(tx) > 0
  );
}

function shouldShowSingleTransactionAmount(tx: TransactionRecord) {
  const displayStatus = getTransactionDisplayPaymentStatus(tx);

  return (
    displayStatus !== "AWAITING_PAYMENT" &&
    displayStatus !== "PARTIALLY_PAID" &&
    getTransactionEffectiveAmount(tx) > 0
  );
}

export default function GeneralReportingPage() {
  const { club, isLoading: clubLoading } = useContext(
    ClubContext,
  ) as ClubContextType;
  const [searchParams] = useSearchParams();
  const [selectedSeason, setSelectedSeason] = useState<string>("current");
  const [graphView, setGraphView] = useState<"income" | "expense">("income");
  const [selectedIncomeGraph, setSelectedIncomeGraph] =
    useState<IncomeGraphKey>("overall");
  const [selectedExpenseGraph, setSelectedExpenseGraph] = useState("overall");

  const seasonToFetch =
    selectedSeason === "current" ? undefined : parseInt(selectedSeason);

  const { data: report, isLoading: reportLoading } = useGeneralReportingQuery(
    club?.club_account_id as string,
    seasonToFetch,
  );

  const [transactionLimit, setTransactionLimit] = useState(25);
  const [pageToken, setPageToken] = useState<string | undefined>(undefined);
  const [allTransactions, setAllTransactions] = useState<TransactionRecord[]>(
    [],
  );
  const isLoadingMoreRef = useRef(false);

  const [memberIdSearch, setMemberIdSearch] = useState("");
  const [txIdSearch, setTxIdSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [transactionType, setTransactionType] = useState("all");

  const [appliedFilters, setAppliedFilters] = useState<{
    transaction_id?: string;
    member_id?: string;
    transaction_type?: string;
    status?: string;
  }>({});

  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [nameSortAsc, setNameSortAsc] = useState<boolean | null>(null);
  const [statusSortAsc, setStatusSortAsc] = useState<boolean | null>(null);
  const [showRefundsDropdown, setShowRefundsDropdown] = useState(false);
  const [selectedRefunds, setSelectedRefunds] = useState<Set<string>>(
    new Set(),
  );
  const [isConfirmingRefunds, setIsConfirmingRefunds] = useState(false);
  const [copiedTransactionId, setCopiedTransactionId] = useState<string | null>(
    null,
  );

  const {
    data: transactions,
    isLoading: transactionsLoading,
    refetch: refetchTransactions,
  } = useFetchClubTransactions(
    club?.club_account_id as string,
    transactionLimit,
    pageToken,
    appliedFilters,
  );

  useEffect(() => {
    if (transactions?.transactions) {
      if (isLoadingMoreRef.current) {
        setAllTransactions((prev) => [...prev, ...transactions.transactions]);
        isLoadingMoreRef.current = false;
      } else {
        setAllTransactions(transactions.transactions);
      }
    }
  }, [transactions]);

  useEffect(() => {
    const memberIdFromQuery = searchParams.get("memberId")?.trim() ?? "";
    const transactionIdFromQuery = searchParams.get("transactionId")?.trim() ?? "";
    const openTransactionIdFromQuery =
      searchParams.get("openTransactionId")?.trim() ?? transactionIdFromQuery;
    const statusFromQuery = searchParams.get("status")?.trim() ?? "";
    const transactionTypeFromQuery = searchParams.get("transactionType")?.trim() ?? "";

    if (
      !memberIdFromQuery &&
      !transactionIdFromQuery &&
      !openTransactionIdFromQuery &&
      !statusFromQuery &&
      !transactionTypeFromQuery
    ) {
      return;
    }

    const nextStatus = statusFromQuery || "all";
    const nextTransactionType = transactionTypeFromQuery || "all";

    setMemberIdSearch(memberIdFromQuery);
    setTxIdSearch(transactionIdFromQuery);
    setStatusFilter(nextStatus);
    setTransactionType(nextTransactionType);
    setAppliedFilters({
      transaction_id: transactionIdFromQuery,
      member_id: memberIdFromQuery,
      transaction_type: nextTransactionType,
      status: nextStatus,
    });
    setExpandedRows(
      openTransactionIdFromQuery
        ? { [openTransactionIdFromQuery]: true }
        : {},
    );
    setPageToken(undefined);
    isLoadingMoreRef.current = false;
    setTimeout(() => refetchTransactions(), 0);
  }, [refetchTransactions, searchParams]);

  useEffect(() => {
    const openTransactionId = searchParams.get("openTransactionId")?.trim();

    if (!openTransactionId) {
      return;
    }

    const hasMatchingTransaction = allTransactions.some(
      (transaction) => transaction.transaction_id === openTransactionId,
    );

    if (!hasMatchingTransaction) {
      return;
    }

    setExpandedRows({ [openTransactionId]: true });
  }, [allTransactions, searchParams]);

  const availableSeasons = club?.season_cycle
    ? Array.from({ length: club.season_cycle - 1 }, (_, i) => ({
        value: (club.season_cycle - i - 1).toString(),
        label: `Season ${club.season_cycle - i - 1}`,
      }))
    : [];

  const hasPreviousSeasons = availableSeasons.length > 0;

  useEffect(() => {
    if (!isStorageFeatureEnabled && selectedIncomeGraph === "storage") {
      setSelectedIncomeGraph("overall");
    }
  }, [selectedIncomeGraph]);

  useEffect(() => {
    if (
      selectedExpenseGraph !== "overall" &&
      !(report?.expense_type_data ?? []).some(
        (expenseType: ExpenseTypeDataRow) =>
          expenseType.type === selectedExpenseGraph,
      )
    ) {
      setSelectedExpenseGraph("overall");
    }
  }, [report?.expense_type_data, selectedExpenseGraph]);

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const getRefundsFromLifecycle = (
    lifecycle?: Record<string, LifecycleEntry> | null,
  ): RefundRow[] => {
    if (!lifecycle) return [];

    return Object.entries(lifecycle)
      .filter(([, entry]) => entry.type === "REFUND")
      .map(([timestamp, entry]) => ({
        timestamp: Number(timestamp),
        ...entry,
        transaction_id: "",
      }));
  };

  const getUnconfirmedRefundRows = () => {
    const refundRows: RefundRow[] = [];

    allTransactions.forEach((tx) => {
      const refunds = getRefundsFromLifecycle(tx.lifecycle);

      refunds.forEach((refund) => {
        if (refund.refund_completed === false) {
          refundRows.push({
            ...refund,
            transaction_id: tx.transaction_id,
            name: tx.name,
            type: tx.type || "-",
            order_id: tx.order_id,
          });
        }
      });
    });

    return refundRows;
  };

  const unconfirmedRefunds = getUnconfirmedRefundRows();

  const handleConfirmRefunds = async () => {
    if (selectedRefunds.size === 0) return;

    try {
      setIsConfirmingRefunds(true);

      const refundRequest = Array.from(selectedRefunds).map((refundId) => {
        const idx = parseInt(refundId.split("-")[1]);
        const refund = unconfirmedRefunds[idx];
        return {
          transaction_id: refund?.transaction_id,
          refund_timestamp: refund?.timestamp,
        };
      });

      const response = await api.post("transactions/confirmRefund", {
        club_account_id: club?.club_account_id,
        refunds: refundRequest,
      });

      const responseData = response?.data as RefundConfirmationResponse;

      toast.success(
        responseData?.message || `Confirmed ${selectedRefunds.size} refund(s)`,
      );
      setSelectedRefunds(new Set());
      refetchTransactions();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error confirming refunds");
      console.error("Error confirming refunds:", err);
    } finally {
      setIsConfirmingRefunds(false);
    }
  };

  const handleDownloadExpenseReport = () => {
    const selectedExpenseType = (report?.expense_type_data ?? []).find(
      (expenseType: ExpenseTypeDataRow) => expenseType.type === selectedExpenseGraph,
    );

    const headers =
      selectedExpenseGraph === "overall"
        ? ["Month", "Expense"]
        : ["Expense Type", "Month", "Expense"];
    const rows =
      selectedExpenseGraph === "overall"
        ? (report?.expense_data ?? []).map(
            (month: ReportDataRow) =>
              `"${month.date}","${month.total_expense || 0}"`,
          )
        : (selectedExpenseType?.data ?? []).map(
            (month: ReportDataRow) =>
              `"${selectedExpenseType?.type}","${month.date}","${month.total_expense || 0}"`,
          );

    if (!rows.length) return;

    const csvSections = [
      `"${selectedExpenseGraph === "overall" ? "Overall Expense" : `${selectedExpenseType?.type} Expense`}"`,
      headers.map((h) => `"${h}"`).join(","),
      ...rows,
    ];

    const element = document.createElement("a");
    const file = new Blob([csvSections.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    element.href = URL.createObjectURL(file);
    const timestamp = new Date().toISOString().split("T")[0];
    element.download = `${selectedExpenseGraph === "overall" ? "Overall_Expense" : `${selectedExpenseType?.type}_Expense`}_${timestamp}.csv`;
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleDownloadIncomeReport = () => {
    const incomeGraphConfig: Partial<
      Record<
        IncomeGraphKey,
        {
          title: string;
          fileName: string;
          data: Array<
            ReportDataRow | OrderReportDataRow | RegistrationReportDataRow
          >;
        }
      >
    > = {
      overall: {
        title: "Overall Income",
        fileName: "Overall_Income",
        data: report?.data ?? [],
      },
      registration: {
        title: "Registration Income",
        fileName: "Registration_Income",
        data: report?.registration_data ?? [],
      },
      shop: {
        title: "Shop Income",
        fileName: "Shop_Income",
        data: report?.shop_data ?? report?.order_data ?? [],
      },
      events: {
        title: "Event Income",
        fileName: "Event_Income",
        data: report?.event_registration_data ?? [],
      },
    };

    if (isStorageFeatureEnabled) {
      incomeGraphConfig.storage = {
        title: "Storage Income",
        fileName: "Storage_Income",
        data: report?.storage_data ?? [],
      };
    }

    const selectedIncome = incomeGraphConfig[selectedIncomeGraph];
  if (!selectedIncome || !selectedIncome.data.length) return;

    const sections = [
      `"${selectedIncome.title}"`,
      '"Month","Revenue","Pending Revenue"',
      ...selectedIncome.data.map(
        (month: ReportDataRow | OrderReportDataRow | RegistrationReportDataRow) =>
          `"${month.date}","${month.total_revenue || 0}","${month.total_pending_revenue || 0}"`,
      ),
    ];

    const element = document.createElement("a");
    const file = new Blob([sections.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    element.href = URL.createObjectURL(file);
    const timestamp = new Date().toISOString().split("T")[0];
    element.download = `${selectedIncome.fileName}_${timestamp}.csv`;
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleDownloadCurrentGraphView = () => {
    if (graphView === "expense") {
      handleDownloadExpenseReport();
      return;
    }

    handleDownloadIncomeReport();
  };

  const summaryCards = [
    {
      label: "Net income",
      value: formatAmount(
        (report?.total_revenue || 0) - (report?.total_expense || 0),
        club?.currency ?? "ZAR",
      ),
      icon: ArrowUpRight,
      tone: "from-sky-400/20 via-sky-300/10 to-transparent",
    },
    {
      label: "Total revenue",
      value: formatAmount(report?.total_revenue, club?.currency ?? "ZAR"),
      icon: Wallet,
      tone: "from-emerald-400/20 via-emerald-300/10 to-transparent",
    },
    {
      label: "Total expenses",
      value: formatAmount(report?.total_expense || 0, club?.currency ?? "ZAR"),
      icon: ArrowDownRight,
      tone: "from-rose-400/20 via-rose-300/10 to-transparent",
    },
    {
      label: "Pending revenue",
      value: formatAmount(
        report?.total_pending_revenue,
        club?.currency ?? "ZAR",
      ),
      icon: AlertCircle,
      tone: "from-stone-400/20 via-stone-300/10 to-transparent",
    },
  ];

  if (clubLoading || reportLoading) {
    return (
      <div className="flex h-full items-center justify-center px-6">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          <p className="text-sm text-slate-500">Loading financial reporting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white text-slate-900">
      <div className="flex w-full flex-col gap-4 px-4 py-6 sm:px-6 md:px-8">
        <div className="mb-2 flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-slate-900">Financial Reporting</h1>
          <p className="text-sm text-slate-500">Track income, expenses and transaction activity across your club.</p>
        </div>
        <section className="py-2">
          <div className="mb-4 flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            {hasPreviousSeasons && (
              <Select value={selectedSeason} onValueChange={setSelectedSeason}>
                <SelectTrigger className="h-9 w-full rounded-full border-slate-200 bg-white text-sm text-zinc-700 shadow-none sm:w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Current Season</SelectItem>
                  {availableSeasons.map((season) => (
                    <SelectItem key={season.value} value={season.value}>
                      {season.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button
              onClick={handleDownloadCurrentGraphView}
              className="h-9 rounded-full border border-slate-200 bg-white px-3.5 text-sm text-zinc-800 hover:bg-slate-50"
              title="Download report data as CSV"
            >
              <Download className="h-3.5 w-3.5" />
              Export active view
            </Button>
          </div>

          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="rounded-lg border border-slate-200 bg-white p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-400">
                      {label}
                    </p>
                    <p className="mt-1 text-lg font-semibold text-zinc-900">{value}</p>
                  </div>
                  <div className="inline-flex shrink-0 rounded-full bg-slate-100 p-2">
                    <Icon className="h-3.5 w-3.5 text-zinc-600" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="py-2">
          <div className="flex items-center pb-3">
            <Select
              value={graphView === "income" ? `income:${selectedIncomeGraph}` : `expense:${selectedExpenseGraph}`}
              onValueChange={(value) => {
                const [view, key] = value.split(":");
                if (view === "income") {
                  setGraphView("income");
                  setSelectedIncomeGraph(key as IncomeGraphKey);
                } else {
                  setGraphView("expense");
                  setSelectedExpenseGraph(key);
                }
              }}
            >
              <SelectTrigger className="h-9 w-auto min-w-[220px] rounded-full border-slate-200 bg-white text-sm shadow-none">
                <SelectValue placeholder="Select graph" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income:overall">Overall Income</SelectItem>
                <SelectItem value="income:registration">Registration Income</SelectItem>
                <SelectItem value="income:shop">Shop Income</SelectItem>
                <SelectItem value="income:events">Events Income</SelectItem>
                {isStorageFeatureEnabled && (
                  <SelectItem value="income:storage">Storage Income</SelectItem>
                )}
                <SelectItem value="expense:overall">Overall Expense</SelectItem>
                {(report?.expense_type_data ?? []).map((expenseType: ExpenseTypeDataRow) => (
                  <SelectItem key={expenseType.type} value={`expense:${expenseType.type}`}>
                    {expenseType.type} Expense
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="pt-4">
            {graphView === "income" ? (
              <section>
                {report && selectedIncomeGraph === "overall" && (
                  <OverallReport
                    report={report}
                    currency={club?.currency ?? "ZAR"}
                  />
                )}
                {report && selectedIncomeGraph === "registration" && (
                  <RegistrationReport
                    report={report}
                    currency={club?.currency ?? "ZAR"}
                  />
                )}
                {report && selectedIncomeGraph === "shop" && (
                  <OrdersReport
                    report={report}
                    currency={club?.currency ?? "ZAR"}
                  />
                )}
                {report && selectedIncomeGraph === "events" && (
                  <RevenueBreakdownReport
                    title="Event Report"
                    description="Event registration revenue over time."
                    data={report.event_registration_data}
                    currency={club?.currency ?? "ZAR"}
                    totalRevenue={report.total_event_registration_revenue}
                    totalPendingRevenue={report.total_event_registration_pending_revenue}
                  />
                )}
                {report && isStorageFeatureEnabled && selectedIncomeGraph === "storage" && (
                  <RevenueBreakdownReport
                    title="Storage Report"
                    description="Storage revenue and pending storage income over time."
                    data={report.storage_data}
                    currency={club?.currency ?? "ZAR"}
                    totalRevenue={report.total_storage_revenue}
                    totalPendingRevenue={report.total_storage_pending_revenue}
                  />
                )}
              </section>
            ) : (
              <section>
                {report && selectedExpenseGraph === "overall" && (
                  <RevenueBreakdownReport
                    title="Expense Report"
                    description="Club expenses over time."
                    data={report.expense_data ?? []}
                    currency={club?.currency ?? "ZAR"}
                    totalRevenue={report.total_expense}
                    valueLabel="Expense"
                    emptyStateLabel="Expense"
                    chartMode="expense"
                  />
                )}
                {report &&
                  selectedExpenseGraph !== "overall" &&
                  (() => {
                    const selectedExpenseType = (report.expense_type_data ?? []).find(
                      (expenseType: ExpenseTypeDataRow) =>
                        expenseType.type === selectedExpenseGraph,
                    );

                    if (!selectedExpenseType) {
                      return null;
                    }

                    return (
                      <RevenueBreakdownReport
                        title={`${selectedExpenseType.type} Expense Trend`}
                        description={`${selectedExpenseType.type} expense over time.`}
                        data={selectedExpenseType.data ?? []}
                        currency={club?.currency ?? "ZAR"}
                        totalRevenue={selectedExpenseType.total_expense}
                        valueLabel="Expense"
                        emptyStateLabel="Expense"
                        chartMode="expense"
                      />
                    );
                  })()}
              </section>
            )}
          </div>
        </section>
        {selectedSeason === "current" && (
        <section className="py-2">
          <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-400">
                Transactions ledger
              </p>
              <h2 className="mt-1 text-xl font-semibold text-slate-950">
                Financial transactions
              </h2>
              <p className="mt-1.5 max-w-2xl text-xs leading-5 text-slate-500">
                This section shows the club's granular financial transactions,
                giving you a detailed view of activity so you can search, sort,
                expand lifecycle rows, load more results, and confirm refunds.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <div className="relative">
                <button
                  onClick={() => setShowRefundsDropdown(!showRefundsDropdown)}
                  className="relative rounded-full border border-slate-200 bg-slate-50 p-2.5 transition-colors hover:bg-slate-100"
                  title="Pending refunds"
                >
                  <Bell className="h-4 w-4 text-slate-700" />
                  {unconfirmedRefunds.length > 0 && (
                    <span className="absolute right-0 top-0 inline-flex -translate-y-1/3 translate-x-1/3 items-center justify-center rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-bold text-white">
                      {unconfirmedRefunds.length}
                    </span>
                  )}
                </button>

                {showRefundsDropdown && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-[22rem] overflow-y-auto rounded-[22px] border border-slate-200 bg-white shadow-2xl">
                    <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
                      <h3 className="font-semibold text-slate-900">
                        Pending Refunds ({unconfirmedRefunds.length})
                      </h3>
                      <div className="flex items-center gap-2">
                        {unconfirmedRefunds.length > 0 && (
                          <Button
                            onClick={handleConfirmRefunds}
                            disabled={
                              selectedRefunds.size === 0 || isConfirmingRefunds
                            }
                            className="h-7 rounded-full bg-zinc-700 px-3 text-[11px] text-white hover:bg-zinc-800"
                          >
                            {isConfirmingRefunds ? (
                              <>
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Confirming...
                              </>
                            ) : (
                              `Confirm (${selectedRefunds.size})`
                            )}
                          </Button>
                        )}
                        <button
                          onClick={() => setShowRefundsDropdown(false)}
                          className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {unconfirmedRefunds.length === 0 ? (
                      <div className="p-5 text-center text-sm text-slate-500">
                        No pending refunds.
                      </div>
                    ) : (
                      <div className="max-h-96 divide-y overflow-y-auto">
                        {unconfirmedRefunds.map((refund, idx) => (
                          <div
                            key={`refund-${idx}`}
                            className="p-4 transition-colors hover:bg-slate-50"
                          >
                            <div className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                checked={selectedRefunds.has(`refund-${idx}`)}
                                onChange={(e) => {
                                  const refundId = `refund-${idx}`;
                                  const newSelected = new Set(selectedRefunds);
                                  if (e.target.checked) {
                                    newSelected.add(refundId);
                                  } else {
                                    newSelected.delete(refundId);
                                  }
                                  setSelectedRefunds(newSelected);
                                }}
                                className="mt-1 rounded"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="mb-1 flex flex-wrap items-center gap-2">
                                  <p className="font-medium text-slate-900">
                                    {refund.name}
                                  </p>
                                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                                    Pending
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500">
                                  Type: {refund.type}
                                </p>
                                <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                                  <span className="font-mono">
                                    Tx: {refund.transaction_id?.substring(0, 8).toUpperCase()}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      navigator.clipboard.writeText(
                                        refund.transaction_id,
                                      );
                                      setCopiedTransactionId(refund.transaction_id);
                                      setTimeout(
                                        () => setCopiedTransactionId(null),
                                        2000,
                                      );
                                    }}
                                    className="h-4 w-4 p-0"
                                  >
                                    {copiedTransactionId === refund.transaction_id ? (
                                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                    ) : (
                                      <Copy className="h-3 w-3" />
                                    )}
                                  </Button>
                                </div>
                                <p className="mt-1 text-xs text-slate-500">
                                  Amount: {formatAmount(refund.amount || 0, club?.currency)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <span>
                {transactionsLoading
                  ? "Refreshing transactions..."
                  : `Showing ${allTransactions.length} items`}
              </span>
            </div>
          </div>

          <div className="mt-4 border border-slate-100 bg-slate-50/60 px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <Input
                className="h-9 min-w-[160px] flex-1 rounded-full border-slate-200 bg-white px-3.5 text-sm text-slate-700 shadow-none"
                placeholder="Search by Transaction ID"
                value={txIdSearch}
                onChange={(e) => setTxIdSearch(e.target.value)}
              />
              <Input
                className="h-9 min-w-[160px] flex-1 rounded-full border-slate-200 bg-white px-3.5 text-sm text-slate-700 shadow-none"
                placeholder="Search by Member ID"
                value={memberIdSearch}
                onChange={(e) => setMemberIdSearch(e.target.value)}
              />
              <Select onValueChange={setTransactionType} value={transactionType}>
                <SelectTrigger className="h-9 min-w-[155px] rounded-full border-slate-200 bg-white px-3.5 text-sm text-slate-700 shadow-none">
                  <span className="whitespace-nowrap text-xs text-muted-foreground">Tx. Type:</span>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="REGISTRATION">Club Registration Income</SelectItem>
                  <SelectItem value="ORDER">Shop Income</SelectItem>
                  <SelectItem value="CLUBBY">Clubby Charges</SelectItem>
                  <SelectItem value="EVENT REGISTRATION">Event Registration Income</SelectItem>
                </SelectContent>
              </Select>
              <Select onValueChange={setStatusFilter} value={statusFilter}>
                <SelectTrigger className="h-9 min-w-[130px] rounded-full border-slate-200 bg-white px-3.5 text-sm text-slate-700 shadow-none">
                  <span className="whitespace-nowrap text-xs text-muted-foreground">Status:</span>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="PARTIALLY_PAID">Partially paid</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  <SelectItem value="REFUND">Refund</SelectItem>
                </SelectContent>
              </Select>
              <div className="ml-auto flex items-center gap-2">
                <Select
                  value={transactionLimit.toString()}
                  onValueChange={(value) => {
                    setTransactionLimit(parseInt(value));
                    setPageToken(undefined);
                  }}
                >
                  <SelectTrigger className="h-9 w-[85px] rounded-full border-slate-200 bg-white px-2.5 text-sm text-slate-700 shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => {
                    setAppliedFilters({
                      transaction_id: txIdSearch,
                      member_id: memberIdSearch,
                      transaction_type: transactionType,
                      status: statusFilter,
                    });
                    setPageToken(undefined);
                    isLoadingMoreRef.current = false;
                    setTimeout(() => refetchTransactions(), 0);
                  }}
                  className="h-9 rounded-full bg-zinc-700 px-5 text-sm text-white hover:bg-zinc-800"
                  title="Run database query to refresh transactions data"
                >
                  Run
                </Button>
              </div>
            </div>
          </div>

          {transactions?.pageToken && transactions.pageToken !== "" && (
            <div className="mt-4 flex items-center justify-between rounded-[20px] border border-amber-300 bg-amber-50 px-4 py-3">
              <div className="flex items-center gap-2 text-amber-900">
                <AlertCircle className="h-4 w-4" />
                <p className="text-sm font-medium">More results available</p>
              </div>
              <Button
                onClick={() => {
                  isLoadingMoreRef.current = true;
                  setPageToken(transactions.pageToken);
                  setTimeout(() => refetchTransactions(), 0);
                }}
                disabled={transactionsLoading}
                variant="outline"
                className="h-8 rounded-full border-amber-400 bg-amber-100 px-3 text-xs text-amber-950 hover:bg-amber-200"
              >
                {transactionsLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Load More"
                )}
              </Button>
            </div>
          )}

          <div className="mt-4 overflow-hidden">
            <Table
              className="table-fixed"
              style={{
                width: "max-content",
                minWidth: "100%",
                maxWidth: "none",
              }}
            >
              <colgroup>
                <col style={{ width: "40px" }} />
                <col style={{ width: "180px" }} />
                <col style={{ width: "220px" }} />
                <col style={{ width: "180px" }} />
                <col style={{ width: "120px" }} />
                <col style={{ width: "160px" }} />
              </colgroup>
              <TableHeader className="bg-zinc-700 [&_tr]:border-b [&_tr]:border-zinc-600">
                <TableRow>
                  <TableHead className="h-14 w-10 px-0 text-center text-slate-200" />
                  <TableHead className="h-14 w-[180px] text-center text-sm text-slate-200">
                    Transaction ID
                  </TableHead>
                  <TableHead className="h-14 w-[220px] text-center text-sm text-slate-200">
                    <button
                      type="button"
                      className="inline-flex w-full items-center justify-center gap-1 hover:underline"
                      onClick={() => {
                        setNameSortAsc((prev) => (prev === null ? true : !prev));
                        setStatusSortAsc(null);
                      }}
                      title="Toggle sort by Member Name"
                    >
                      Member Name
                      {nameSortAsc === null ? (
                        <svg
                          className="h-3 w-3 opacity-60"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M12 5v14M19 12l-7 7-7-7" />
                        </svg>
                      ) : (
                        <span className="text-xs">{nameSortAsc ? "▲" : "▼"}</span>
                      )}
                    </button>
                  </TableHead>
                  <TableHead className="h-14 w-[180px] text-center text-sm text-slate-200">
                    Transaction Type
                  </TableHead>
                  <TableHead className="h-14 w-[120px] text-center text-sm text-slate-200">
                    Flow
                  </TableHead>
                  <TableHead className="h-14 w-[160px] text-center text-sm text-slate-200">
                    <button
                      type="button"
                      className="inline-flex w-full items-center justify-center gap-1 hover:underline"
                      onClick={() => {
                        setStatusSortAsc((prev) => (prev === null ? true : !prev));
                        setNameSortAsc(null);
                      }}
                      title="Toggle sort by payment status"
                    >
                      Payment
                      {statusSortAsc === null ? (
                        <svg
                          className="h-3 w-3 opacity-60"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M12 5v14M19 12l-7 7-7-7" />
                        </svg>
                      ) : (
                        <span className="text-xs">{statusSortAsc ? "▲" : "▼"}</span>
                      )}
                    </button>
                  </TableHead>
                </TableRow>
              </TableHeader>
            </Table>

            <div
              className="bg-slate-50/70"
              style={{ maxHeight: "480px", overflowY: "auto", overflowX: "auto", scrollbarGutter: "stable" }}
            >
              <Table
                className="table-fixed"
                style={{
                  width: "max-content",
                  minWidth: "100%",
                  maxWidth: "none",
                  borderCollapse: "separate",
                  borderSpacing: "0 6px",
                }}
              >
                <colgroup>
                  <col style={{ width: "40px" }} />
                  <col style={{ width: "180px" }} />
                  <col style={{ width: "220px" }} />
                  <col style={{ width: "180px" }} />
                  <col style={{ width: "120px" }} />
                  <col style={{ width: "160px" }} />
                </colgroup>

              <TableBody>
                {allTransactions
                  .slice()
                  .sort((a: TransactionRecord, b: TransactionRecord) => {
                    if (nameSortAsc !== null) {
                      const aName = (a.name || "").toLowerCase();
                      const bName = (b.name || "").toLowerCase();
                      return nameSortAsc
                        ? aName.localeCompare(bName)
                        : bName.localeCompare(aName);
                    }

                    if (statusSortAsc !== null) {
                      const aStatus = (a.status || "").toLowerCase();
                      const bStatus = (b.status || "").toLowerCase();
                      return statusSortAsc
                        ? aStatus.localeCompare(bStatus)
                        : bStatus.localeCompare(aStatus);
                    }

                    return 0;
                  })
                  .map((tx: TransactionRecord) => (
                    <Fragment key={tx.transaction_id}>
                      <TableRow
                        key={tx.transaction_id}
                        className="group h-14 cursor-pointer bg-white text-sm transition-colors hover:bg-slate-50 shadow-[0_0_0_1px_#e2e8f0,0_2px_8px_0_rgba(0,0,0,0.06)]"
                        onClick={() => toggleRow(tx.transaction_id)}
                      >
                        <TableCell className="w-10 px-0 text-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className={`mx-auto h-3.5 w-3.5 transition-transform ${
                              expandedRows[tx.transaction_id] ? "rotate-90" : ""
                            }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </TableCell>
                        <TableCell className="w-[180px] text-center">
                          <div className="inline-flex items-center justify-center gap-2">
                            <span className="font-mono text-[11px] md:text-xs">
                              {tx.transaction_id.slice(0, 8)}...
                            </span>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(tx.transaction_id);
                              }}
                              title="Copy full Transaction ID"
                              className="cursor-pointer text-slate-400 transition hover:text-slate-900"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </TableCell>
                        <TableCell className="w-[220px] text-center">
                          <div className="space-y-0.5">
                            <p>{tx.name || "N/A"}</p>
                            {typeof tx.user_id === "string" && tx.user_id.trim() && (
                              <div className="flex items-center justify-center gap-1 text-[11px] text-slate-500">
                                <span className="font-mono" title={tx.user_id}>
                                  User ID: {tx.user_id.slice(0, 8)}...
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(tx.user_id!);
                                  }}
                                  title="Copy full User ID"
                                  className="cursor-pointer transition hover:text-slate-900"
                                >
                                  <Copy className="h-3 w-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="w-[180px] text-center">
                          <div className="space-y-0.5">
                            <Badge
                              variant="outline"
                              className={getTransactionTypeBadgeClassName()}
                            >
                              {tx.type || "-"}
                            </Badge>
                            {tx.type === "REGISTRATION" &&
                              typeof tx.registration_id === "string" &&
                              tx.registration_id.trim() && (
                                <div className="flex items-center justify-center gap-1 text-[11px] text-slate-500">
                                  <span className="font-mono" title={tx.registration_id}>
                                    Reg. ID: {tx.registration_id.slice(0, 8)}...
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigator.clipboard.writeText(tx.registration_id!);
                                    }}
                                    title="Copy full Registration ID"
                                    className="cursor-pointer transition hover:text-slate-900"
                                  >
                                    <Copy className="h-3 w-3" />
                                  </button>
                                </div>
                              )}
                            {tx.type === "EVENT REGISTRATION" &&
                              typeof tx.event_registration_id === "string" &&
                              tx.event_registration_id.trim() && (
                                <div className="flex items-center justify-center gap-1 text-[11px] text-slate-500">
                                  <span
                                    className="font-mono"
                                    title={tx.event_registration_id}
                                  >
                                    Event Reg. ID: {tx.event_registration_id.slice(0, 8)}...
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigator.clipboard.writeText(
                                        tx.event_registration_id!,
                                      );
                                    }}
                                    title="Copy full Event Registration ID"
                                    className="cursor-pointer transition hover:text-slate-900"
                                  >
                                    <Copy className="h-3 w-3" />
                                  </button>
                                </div>
                              )}
                            {tx.type === "ORDER" &&
                              typeof tx.order_id === "string" &&
                              tx.order_id.trim() && (
                                <div className="flex items-center justify-center gap-1 text-[11px] text-slate-500">
                                  <span className="font-mono" title={tx.order_id}>
                                    Order ID: {tx.order_id.slice(0, 8)}...
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigator.clipboard.writeText(tx.order_id!);
                                    }}
                                    title="Copy full Order ID"
                                    className="cursor-pointer transition hover:text-slate-900"
                                  >
                                    <Copy className="h-3 w-3" />
                                  </button>
                                </div>
                              )}
                          </div>
                        </TableCell>
                        <TableCell className="w-[120px] text-center">
                          {(() => {
                            const TransactionTypeIcon = getTransactionTypeIcon(tx);

                            return (
                              <Badge
                                variant="outline"
                                className={getTransactionFlowBadgeClassName(tx)}
                              >
                                <span className="inline-flex items-center gap-1">
                                  {TransactionTypeIcon && (
                                    <TransactionTypeIcon className="h-3.5 w-3.5" />
                                  )}
                                  {getTransactionFlowLabel(tx)}
                                </span>
                              </Badge>
                            );
                          })()}
                        </TableCell>
                        <TableCell className="w-[160px] text-center">
                          <div className="space-y-0.5">
                            <p
                              className={`font-bold ${getTransactionPaymentClassName(tx)}`}
                            >
                              {getTransactionPaymentLabel(tx)}
                            </p>
                            {shouldShowTransactionPaymentProgress(tx) && (
                              <p className="text-[11px] text-slate-500">
                                {formatAmount(
                                  tx.amount_paid || 0,
                                  club?.currency || "ZAR",
                                )}{" "}
                                of{" "}
                                {formatAmount(
                                  getTransactionEffectiveAmount(tx),
                                  club?.currency || "ZAR",
                                )}
                              </p>
                            )}
                            {getTransactionRefundedAmount(tx) > 0 &&
                            getTransactionDisplayPaymentStatus(tx) !== "REFUNDED" ? (
                              <div className="space-y-0.5 text-[11px]">
                                <p className="text-slate-500">
                                  {formatAmount(
                                    getTransactionEffectiveAmount(tx),
                                    club?.currency || "ZAR",
                                  )}
                                </p>
                                <p className="text-red-800">
                                  Refund: {formatAmount(
                                    getTransactionRefundedAmount(tx),
                                    club?.currency || "ZAR",
                                  )}
                                </p>
                              </div>
                            ) : getTransactionDisplayPaymentStatus(tx) ===
                              "REFUNDED" ? (
                              <p className="text-[11px] text-red-800">
                                Refund: {formatAmount(
                                  getTransactionRefundedAmount(tx),
                                  club?.currency || "ZAR",
                                )}
                              </p>
                            ) : (
                              shouldShowSingleTransactionAmount(tx) && (
                              <p className="text-[11px] text-slate-500">
                                {formatAmount(
                                  getTransactionEffectiveAmount(tx),
                                  club?.currency || "ZAR",
                                )}
                              </p>
                              )
                            )}
                          </div>
                        </TableCell>
                      </TableRow>

                      {expandedRows[tx.transaction_id] && (
                        <TableRow key={`${tx.transaction_id}-expanded`} className="bg-slate-50">
                          <TableCell colSpan={8} className="p-3">
                            <div className="overflow-hidden rounded-[20px] border border-slate-200 bg-white">
                              <Table className="w-full">
                                <TableHeader className="bg-slate-100 [&_tr]:border-slate-200">
                                  <TableRow>
                                    <TableHead className="h-9 text-center text-xs">Date</TableHead>
                                    <TableHead className="h-9 text-center text-xs">Type</TableHead>
                                    <TableHead className="h-9 text-center text-xs">
                                      Description
                                    </TableHead>
                                    <TableHead className="h-9 text-center text-xs">Amount</TableHead>
                                    <TableHead className="h-9 text-center text-xs">
                                      Payment type
                                    </TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {Object.entries(tx.lifecycle)
                                    .sort(([a], [b]) => Number(b) - Number(a))
                                    .map(([timestamp, entry]) => (
                                      <TableRow key={timestamp}>
                                        <TableCell className="text-center">
                                          {new Date(Number(timestamp)).toLocaleString(
                                            "en-GB",
                                            {
                                              day: "2-digit",
                                              month: "2-digit",
                                              year: "numeric",
                                              hour: "2-digit",
                                              minute: "2-digit",
                                              hour12: true,
                                            },
                                          )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                          <div className="flex items-center justify-center gap-2">
                                            <span>{entry.type}</span>
                                            {entry.type === "REFUND" && (
                                              <span
                                                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                                  entry.refund_completed
                                                    ? "bg-green-100 text-green-800"
                                                    : "bg-yellow-100 text-yellow-800"
                                                }`}
                                              >
                                                {entry.refund_completed
                                                  ? "Confirmed"
                                                  : "Pending"}
                                              </span>
                                            )}
                                          </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                          <div className="space-y-1">
                                            <p>{entry.description}</p>
                                            {typeof entry.payment_reference === "string" &&
                                            entry.payment_reference.trim() ? (
                                              <p className="text-xs text-slate-500">
                                                Ref: {entry.payment_reference}
                                              </p>
                                            ) : null}
                                          </div>
                                        </TableCell>
                                        <TableCell
                                          className={`text-center ${getLifecycleAmountClassName(
                                            tx,
                                            entry.type,
                                          )}`}
                                        >
                                          {getLifecycleAmountPrefix(tx, entry.type)}
                                          {entry.type !== "CANCELLATION" &&
                                            formatAmount(
                                              entry.type === "REFUND" ||
                                                isExpenseTransaction(tx)
                                                ? Math.abs(entry.amount)
                                                : entry.amount,
                                              club?.currency || "",
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                          {typeof entry.payment_type === "string" &&
                                          entry.payment_type.trim() &&
                                          entry.payment_type.trim().toUpperCase() !==
                                            "N/A"
                                            ? entry.payment_type
                                            : "-"}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                </TableBody>
                              </Table>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  ))}
              </TableBody>
              </Table>
            </div>
          </div>
        </section>
        )}
      </div>
    </div>
  );
}
