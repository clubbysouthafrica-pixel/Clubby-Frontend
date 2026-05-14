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
  BarChart3,
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
import { Card } from "@/components/ui/card";
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
  const expenseGraphOptions = [
    { value: "overall", label: "Overall Expense" },
    ...((report?.expense_type_data ?? []).map((expenseType: ExpenseTypeDataRow) => ({
      value: expenseType.type,
      label: expenseType.type,
    })) ?? []),
  ];

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
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(214,211,209,0.55),_transparent_32%),linear-gradient(180deg,_#e7e5e4_0%,_#f5f5f4_40%,_#fafaf9_100%)] px-6">
        <div className="flex flex-col items-center gap-4 rounded-[24px] border border-stone-300/70 bg-white/90 px-8 py-10 text-zinc-900 shadow-xl backdrop-blur">
          <Loader2 className="h-10 w-10 animate-spin text-zinc-500" />
          <p className="text-lg font-medium text-zinc-700">
            Loading analytics dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#e7e5e4_0%,_#f5f5f4_22%,_#fafaf9_22%,_#fafaf9_100%)] text-slate-900">
      <div className="flex w-full max-w-none flex-col gap-3 px-2 py-3 sm:px-3 md:px-4 md:py-4 xl:px-5 2xl:px-6">
        <section className="relative overflow-hidden rounded-[24px] border border-stone-300/70 bg-stone-200 px-4 py-4 text-zinc-900 shadow-[0_18px_40px_rgba(120,113,108,0.16)] md:px-5 md:py-4">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.72),_transparent_28%),radial-gradient(circle_at_right,_rgba(214,211,209,0.55),_transparent_24%)]" />
          <div className="relative flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white/70 px-2.5 py-1 text-[11px] text-zinc-600 backdrop-blur">
                <BarChart3 className="h-3.5 w-3.5 text-zinc-500" />
                Analytics overview
              </div>
              <h1 className="text-xl font-semibold tracking-tight md:text-3xl">
                Club reporting with live transaction visibility
              </h1>
              <p className="mt-2 max-w-2xl text-[11px] leading-4 text-zinc-600 md:text-xs">
                Review season performance, export report snapshots, and manage
                transaction activity without switching pages.
              </p>
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              {hasPreviousSeasons && (
                <Select value={selectedSeason} onValueChange={setSelectedSeason}>
                  <SelectTrigger className="h-8 w-full rounded-full border-stone-300 bg-white text-zinc-700 shadow-none sm:w-[180px]">
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
                className="h-8 rounded-full border border-stone-300 bg-white px-3.5 text-xs text-zinc-800 hover:bg-stone-100"
                title="Download report data as CSV"
              >
                <Download className="h-3.5 w-3.5" />
                Export active view
              </Button>
            </div>
          </div>

          <div className="relative mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map(({ label, value, icon: Icon, tone }) => (
              <div
                key={label}
                className="rounded-[18px] border border-stone-300/70 bg-white/75 p-3 backdrop-blur"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-400">
                      {label}
                    </p>
                    <p className="mt-1 text-lg font-semibold text-zinc-900">{value}</p>
                  </div>
                  <div
                    className={`inline-flex shrink-0 rounded-2xl bg-gradient-to-br p-2 ${tone}`}
                  >
                    <Icon className="h-3.5 w-3.5 text-zinc-700" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="order-1 rounded-[24px] border border-slate-200/70 bg-white/90 p-2.5 shadow-[0_16px_36px_rgba(15,23,42,0.07)] backdrop-blur md:p-3">
          <div className="rounded-[18px] border border-slate-200/70 bg-slate-50/90 p-1.5 backdrop-blur">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={() => setGraphView("income")}
                  className={`h-8 rounded-full px-3.5 text-xs font-medium ${
                    graphView === "income"
                      ? "bg-zinc-700 text-white hover:bg-zinc-800"
                      : "border border-slate-200 bg-white text-zinc-700 hover:bg-slate-100"
                  }`}
                >
                  Income Graphs
                </Button>
                <Button
                  type="button"
                  onClick={() => setGraphView("expense")}
                  className={`h-8 rounded-full px-3.5 text-xs font-medium ${
                    graphView === "expense"
                      ? "bg-zinc-700 text-white hover:bg-zinc-800"
                      : "border border-slate-200 bg-white text-zinc-700 hover:bg-slate-100"
                  }`}
                >
                  Expense Graphs
                </Button>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Select
                  value={graphView === "income" ? selectedIncomeGraph : selectedExpenseGraph}
                  onValueChange={(value) => {
                    if (graphView === "income") {
                      setSelectedIncomeGraph(value as IncomeGraphKey);
                      return;
                    }

                    setSelectedExpenseGraph(value);
                  }}
                >
                  <SelectTrigger className="h-8 min-w-[220px] rounded-full bg-white text-xs">
                    <SelectValue placeholder="Select graph" />
                  </SelectTrigger>
                  <SelectContent>
                    {graphView === "income" ? (
                      <>
                        <SelectItem value="overall">Overall Income</SelectItem>
                        <SelectItem value="registration">Registration</SelectItem>
                        <SelectItem value="shop">Shop</SelectItem>
                        <SelectItem value="events">Events</SelectItem>
                        {isStorageFeatureEnabled && (
                          <SelectItem value="storage">Storage</SelectItem>
                        )}
                      </>
                    ) : (
                      expenseGraphOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-3 px-1 pb-1 pt-2.5 md:px-2 md:pb-2">
            {graphView === "income" ? (
              <section className="rounded-[20px] border border-slate-200/70 bg-white p-3 shadow-sm md:p-4">
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
              <section className="rounded-[20px] border border-slate-200/70 bg-white p-3 shadow-sm md:p-4">
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
        <section className="order-2 rounded-[24px] border border-slate-200/70 bg-white/95 p-4 shadow-[0_16px_36px_rgba(15,23,42,0.07)] md:p-5">
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 lg:flex-row lg:items-end lg:justify-between">
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

          <Card className="mt-4 rounded-[20px] border-slate-200/70 bg-slate-50/80 p-3 shadow-none">
            <div className="flex flex-wrap gap-3">
              <Input
                className="h-8 min-w-[200px] flex-1 bg-white text-xs"
                placeholder="Search by Transaction ID"
                value={txIdSearch}
                onChange={(e) => setTxIdSearch(e.target.value)}
              />

              <Input
                className="h-8 min-w-[200px] flex-1 bg-white text-xs"
                placeholder="Search by Member ID"
                value={memberIdSearch}
                onChange={(e) => setMemberIdSearch(e.target.value)}
              />

              <Select onValueChange={setTransactionType} value={transactionType}>
                <SelectTrigger className="h-8 min-w-[190px] rounded-full bg-white text-xs">
                  <span className="text-muted-foreground whitespace-nowrap">
                    Tx. Type:
                  </span>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="REGISTRATION">
                    Club Registration Income
                  </SelectItem>
                  <SelectItem value="ORDER">Shop Income</SelectItem>
                  <SelectItem value="CLUBBY">Clubby Charges</SelectItem>
                  <SelectItem value="EVENT REGISTRATION">
                    Event Registration Income
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select onValueChange={setStatusFilter} value={statusFilter}>
                <SelectTrigger className="h-8 min-w-[170px] rounded-full bg-white text-xs">
                  <span className="text-muted-foreground whitespace-nowrap">
                    Status:
                  </span>
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
            </div>

            <div className="mt-3 flex flex-col gap-3 border-t border-slate-200 pt-3 md:flex-row md:items-center md:justify-between">
              <p className="text-xs text-slate-500">
                Apply filters to refresh the embedded ledger without leaving this
                dashboard.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-3">
                  <label className="text-xs font-medium text-slate-600">
                    Results per page:
                  </label>
                  <Select
                    value={transactionLimit.toString()}
                    onValueChange={(value) => {
                      setTransactionLimit(parseInt(value));
                      setPageToken(undefined);
                    }}
                  >
                    <SelectTrigger className="h-8 w-[96px] rounded-full bg-white text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={() => {
                    const nextFilters = {
                      transaction_id: txIdSearch,
                      member_id: memberIdSearch,
                      transaction_type: transactionType,
                      status: statusFilter,
                    };

                    setAppliedFilters({
                      ...nextFilters,
                    });
                    setPageToken(undefined);
                    isLoadingMoreRef.current = false;
                    setTimeout(() => refetchTransactions(), 0);
                  }}
                  className="h-8 rounded-full bg-zinc-700 px-4 text-xs text-white hover:bg-zinc-800"
                  title="Run database query to refresh transactions data"
                >
                  Run
                </Button>
              </div>
            </div>
          </Card>

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

          <div className="mt-4 h-[320px] overflow-y-auto rounded-[20px] border border-slate-200">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-zinc-700 [&_tr]:border-zinc-600">
                <TableRow>
                  <TableHead className="h-11 w-10 text-center text-slate-200" />
                  <TableHead className="h-11 text-center text-xs text-slate-200">
                    Transaction ID
                  </TableHead>
                  <TableHead className="h-11 text-center text-xs text-slate-200">
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
                  <TableHead className="h-11 text-center text-xs text-slate-200">
                    Transaction Type
                  </TableHead>
                  <TableHead className="h-11 text-center text-xs text-slate-200">
                    Flow
                  </TableHead>
                  <TableHead className="h-11 text-center text-xs text-slate-200">
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
                        className="cursor-pointer border-slate-200 bg-white text-sm hover:bg-slate-50"
                        onClick={() => toggleRow(tx.transaction_id)}
                      >
                        <TableCell className="text-center">
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
                        <TableCell className="text-center">
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
                        <TableCell className="text-center">
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
                        <TableCell className="text-center">
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
                        <TableCell className="text-center">
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
                        <TableCell className="text-center">
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
        </section>
        )}
      </div>
    </div>
  );
}
