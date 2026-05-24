import { useContext, useState, useRef } from "react";
import { ClubContext, ClubContextType } from "@/context/ClubContext";
import { useFetchClubTransactions } from "@/queries/admin/transactions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatAmount } from "@/data/currencies";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import * as React from "react";
import {
  Loader2,
  AlertCircle,
  Copy,
  Bell,
  X,
  CheckCircle2,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { api } from "@/services/admin/api";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";

function getTransactionPaymentLabel(status: string) {
  const normalizedStatus = status.trim().toUpperCase();

  switch (status) {
    case "PENDING":
      return "Awaiting payment";
    case "PARTIALLY_PAID":
      return "Partially paid";
    case "PAID":
      return "Paid";
    case "REFUND":
      return "Refund";
    case "CANCELLED":
      return "Cancelled";
    default:
      if (
        normalizedStatus === "PAID_PARTIAL_REFUND" ||
        normalizedStatus === "PAID (PARTIAL REFUND)"
      ) {
        return "Paid (partial refund)";
      }

      return status
        .toLowerCase()
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
  }
}

function getTransactionFlowLabel(tx: {
  club_income?: boolean | string | null;
  type?: string | null;
}) {
  if (tx.club_income === true || tx.club_income === "true") {
    return "Club Income";
  }

  if (tx.club_income === false || tx.club_income === "false") {
    return "Club Expense";
  }

  return tx.type || "-";
}

function getTransactionTypeBadgeClassName() {
  return "border-slate-200 bg-slate-100 text-slate-700";
}

function getTransactionFlowBadgeClassName(tx: {
  club_income?: boolean | string | null;
}) {
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
}) {
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
    return "text-black-700";
  }

  return "text-green-700";
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

function getTransactionPaymentClassName(status: string) {
  const normalizedStatus = status.trim().toUpperCase();

  if (normalizedStatus === "PENDING") {
    return "text-blue-700";
  }

  if (normalizedStatus === "PARTIALLY_PAID") {
    return "text-orange-600";
  }

  if (normalizedStatus === "REFUND" || normalizedStatus === "CANCELLED") {
    return "text-red-700";
  }

  return "text-green-700";
}

function shouldShowTransactionPaymentProgress(tx: {
  status?: string;
  amount?: number | null;
}) {
  const normalizedStatus = tx.status?.trim().toUpperCase();

  return (
    (normalizedStatus === "PENDING" ||
      normalizedStatus === "PARTIALLY_PAID") &&
    typeof tx.amount === "number" &&
    tx.amount > 0
  );
}

function shouldShowSingleTransactionAmount(tx: {
  status?: string;
  amount?: number | null;
}) {
  const normalizedStatus = tx.status?.trim().toUpperCase();

  return (
    normalizedStatus !== "PENDING" &&
    normalizedStatus !== "PARTIALLY_PAID" &&
    typeof tx.amount === "number" &&
    tx.amount > 0
  );
}

export default function FinancialTransactionsPage() {
  const { club, isLoading: clubLoading } = useContext(
    ClubContext,
  ) as ClubContextType;
  const [searchParams] = useSearchParams();

  const [transactionLimit, setTransactionLimit] = useState(100);
  const [pageToken, setPageToken] = useState<string | undefined>(undefined);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
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
  const [highlightedTransactionId, setHighlightedTransactionId] = useState<
    string | null
  >(null);
  const transactionsTableRef = useRef<HTMLDivElement | null>(null);
  const transactionRowRefs = useRef<Record<string, HTMLTableRowElement | null>>(
    {},
  );
  const handledOpenTransactionIdRef = useRef<string | null>(null);
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const {
    data: transactions,
    isLoading,
    refetch: refetchTransactions,
  } = useFetchClubTransactions(
    club?.club_account_id as string,
    transactionLimit,
    pageToken,
    appliedFilters,
  );

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Helper function to get all refunds from lifecycle
  const getRefundsFromLifecycle = (lifecycle: any) => {
    if (!lifecycle) return [];
    return Object.entries(lifecycle)
      .filter(([, entry]: any) => entry.type === "REFUND")
      .map(([timestamp, entry]: any) => ({
        timestamp: Number(timestamp),
        ...entry,
      }));
  };

  // Helper function to create a flattened list of individual refunds with transaction context
  const getUnconfirmedRefundRows = () => {
    const refundRows: any[] = [];
    allTransactions.forEach((tx) => {
      const refunds = getRefundsFromLifecycle(tx.lifecycle);
      refunds.forEach((refund: any) => {
        if (refund.refund_completed === false) {
          refundRows.push({
            ...refund,
            transaction_id: tx.transaction_id,
            name: tx.name,
            type: tx.type,
            order_id: tx.order_id,
          });
        }
      });
    });
    return refundRows;
  };

  // Calculate unconfirmed refunds
  const unconfirmedRefunds = getUnconfirmedRefundRows();

  const handleConfirmRefunds = async () => {
    if (selectedRefunds.size === 0) return;
    try {
      setIsConfirmingRefunds(true);

      // Build refund request array
      const refundRequest = Array.from(selectedRefunds).map((refundId) => {
        const idx = parseInt(refundId.split("-")[1]);
        const refund = unconfirmedRefunds[idx];
        return {
          transaction_id: refund?.transaction_id,
          refund_timestamp: refund?.timestamp,
        };
      });

      const requestBody = {
        club_account_id: club?.club_account_id,
        refunds: refundRequest,
      };

      const response = await api.post(
        "transactions/confirmRefund",
        requestBody,
      );

      toast.success(
        (response?.data as any)?.message ||
          `Confirmed ${selectedRefunds.size} refund(s)`,
      );
      setSelectedRefunds(new Set());
      refetchTransactions();
    } catch (err: any) {
      toast.error(err.message || "Error confirming refunds");
      console.error("Error confirming refunds:", err);
    } finally {
      setIsConfirmingRefunds(false);
    }
  };

  React.useEffect(() => {
    if (transactions?.transactions) {
      if (isLoadingMoreRef.current) {
        setAllTransactions((prev) => [...prev, ...transactions.transactions]);
        isLoadingMoreRef.current = false;
      } else {
        setAllTransactions(transactions.transactions);
      }
    }
  }, [transactions]);

  React.useEffect(() => {
    const memberIdFromQuery = searchParams.get("memberId")?.trim() ?? "";
    const transactionIdFromQuery = searchParams.get("transactionId")?.trim() ?? "";
    const statusFromQuery = searchParams.get("status")?.trim() ?? "";
    const transactionTypeFromQuery = searchParams.get("transactionType")?.trim() ?? "";

    if (
      !memberIdFromQuery &&
      !transactionIdFromQuery &&
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
    setPageToken(undefined);
    isLoadingMoreRef.current = false;
    setAllTransactions([]);
  }, [searchParams]);

  React.useEffect(() => {
    const openTransactionIdFromQuery =
      searchParams.get("openTransactionId")?.trim() ?? "";

    if (!openTransactionIdFromQuery) {
      handledOpenTransactionIdRef.current = null;
      setHighlightedTransactionId(null);
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
        highlightTimeoutRef.current = null;
      }
      return;
    }

    if (handledOpenTransactionIdRef.current === openTransactionIdFromQuery) {
      return;
    }

    const matchedTransaction = allTransactions.find(
      (tx) => tx.transaction_id === openTransactionIdFromQuery,
    );

    if (!matchedTransaction) {
      return;
    }

    handledOpenTransactionIdRef.current = openTransactionIdFromQuery;
    setHighlightedTransactionId(openTransactionIdFromQuery);

    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
    }

    window.requestAnimationFrame(() => {
      transactionsTableRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

      window.setTimeout(() => {
        transactionRowRefs.current[openTransactionIdFromQuery]?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 150);
    });

    highlightTimeoutRef.current = setTimeout(() => {
      setHighlightedTransactionId((current) =>
        current === openTransactionIdFromQuery ? null : current,
      );
      highlightTimeoutRef.current = null;
    }, 2600);
  }, [allTransactions, searchParams]);

  React.useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, []);

  if (clubLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <header className="z-40 bg-white/90 dark:bg-slate-900/90 shadow-sm backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-4">
            <span className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 shadow-inner">
              <DollarSign className="h-7 w-7 text-primary" />
            </span>
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Financial Transactions
              </h1>
              <p className="text-base text-slate-500 dark:text-slate-400 mt-1">
                Manage your club's income and expense transactions
              </p>
            </div>
          </div>
        </div>
      </header>
      <div className="max-w-7xl mx-auto w-full p-10">
        <Card className="p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <Input
              className="w-[20%]"
              placeholder="Search by Transaction ID"
              value={txIdSearch}
              onChange={(e) => setTxIdSearch(e.target.value)}
            />

            <Input
              className="w-[20%]"
              placeholder="Search by Member ID"
              value={memberIdSearch}
              onChange={(e) => setMemberIdSearch(e.target.value)}
            />

            <Select onValueChange={setTransactionType} value={transactionType}>
              <SelectTrigger className="flex items-center gap-2 w-[20%]">
                <span className="text-muted-foreground whitespace-nowrap">
                  Tx. Type:
                </span>
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
              <SelectTrigger className="flex items-center gap-2 w-[20%]">
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

          <p className="text-sm text-gray-600 my-1">
            Configure your filters above, then click the{" "}
            <span className="font-semibold">Run</span> button to apply your
            selections and display the results.
          </p>
          <button
            onClick={() => {
              setAppliedFilters({
                transaction_id: txIdSearch,
                member_id: memberIdSearch,
                transaction_type: transactionType,
                status: statusFilter,
              });
              setPageToken(undefined);
              setAllTransactions([]);
            }}
            title="Run database query to refresh transactions data"
            className="px-4 py-1 w-[100px] bg-orange-400 hover:bg-orange-500 rounded-[20px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center font-bold"
          >
            Run
          </button>

          <div className="flex items-center gap-3 pt-4 border-t">
            <label className="text-sm font-medium">Results per page:</label>
            <Select
              value={transactionLimit.toString()}
              onValueChange={(value) => {
                setTransactionLimit(parseInt(value));
                setPageToken(undefined);
                setAllTransactions([]);
              }}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="200">200</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        <div className="flex items-center gap-4 mb-4">
          <div className="relative">
            <button
              onClick={() => setShowRefundsDropdown(!showRefundsDropdown)}
              className="relative p-2 mr-5 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              title="Pending refunds"
            >
              <Bell className="h-6 w-6 text-gray-600" />
              {unconfirmedRefunds.length > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                  {unconfirmedRefunds.length}
                </span>
              )}
            </button>
            {showRefundsDropdown && (
              <div className="absolute top-full left-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
                <div className="sticky top-0 z-10 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">
                    Pending Refunds ({unconfirmedRefunds.length})
                  </h3>
                  <div className="flex items-center gap-2">
                    {unconfirmedRefunds.length > 0 && (
                      <Button
                        onClick={handleConfirmRefunds}
                        disabled={
                          selectedRefunds.size === 0 || isConfirmingRefunds
                        }
                        className="bg-green-600 hover:bg-green-700 text-white text-xs"
                        size="sm"
                      >
                        {isConfirmingRefunds ? (
                          <>
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            Confirming...
                          </>
                        ) : (
                          `Confirm (${selectedRefunds.size})`
                        )}
                      </Button>
                    )}
                    <button
                      onClick={() => setShowRefundsDropdown(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {unconfirmedRefunds.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500">
                    No pending refunds!
                  </div>
                ) : (
                  <>
                    <div className="divide-y">
                      {unconfirmedRefunds.map((refund, idx) => (
                        <div
                          key={`refund-${idx}`}
                          className="p-4 hover:bg-gray-50 transition-colors"
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
                              className="mt-1 rounded flex-shrink-0 cursor-pointer"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium text-sm text-gray-900">
                                  {refund.name}
                                </p>
                                <span
                                  className={`text-xs font-semibold px-2 py-1 rounded-full ${
                                    refund.refund_completed
                                      ? "bg-green-100 text-green-800"
                                      : "bg-yellow-100 text-yellow-800"
                                  }`}
                                >
                                  {refund.refund_completed
                                    ? "Confirmed"
                                    : "Pending"}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500">
                                Type: {refund.type}
                              </p>
                              <div className="flex items-center gap-1">
                                <p className="text-xs text-gray-500">
                                  Transaction:{" "}
                                  <span className="font-mono">
                                    {refund.transaction_id
                                      ?.substring(0, 8)
                                      .toUpperCase()}
                                  </span>
                                </p>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    navigator.clipboard.writeText(
                                      refund.transaction_id,
                                    );
                                    setCopiedTransactionId(
                                      refund.transaction_id,
                                    );
                                    setTimeout(
                                      () => setCopiedTransactionId(null),
                                      2000,
                                    );
                                  }}
                                  title="Copy full Transaction ID"
                                  className="h-4 w-4 p-0 opacity-75 hover:opacity-100 transition-opacity"
                                >
                                  {copiedTransactionId ===
                                  refund.transaction_id ? (
                                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                Amount:{" "}
                                {formatAmount(
                                  refund.amount || 0,
                                  club?.currency,
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          {!(isLoading || clubLoading) && (
            <h2 className="text-xl font-medium text-gray-700">
              Showing{" "}
              <span className="font-bold">{allTransactions.length}</span> items
            </h2>
          )}
          {(isLoading || clubLoading) && (
            <div className="flex items-center gap-2 mt-2">
              <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
              <span className="text-sm text-gray-600">
                Loading transactions...
              </span>
            </div>
          )}
        </div>

        {transactions?.pageToken && transactions.pageToken !== "" && (
          <div className="bg-orange-100 W-[100%] border border-orange-600 p-4 rounded-md flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <p className="text-black font-medium">More results available</p>
            </div>
            <button
              onClick={() => {
                isLoadingMoreRef.current = true;
                setPageToken(transactions.pageToken);
                setTimeout(() => refetchTransactions(), 0);
              }}
              disabled={isLoading}
              className="px-4 py-2 bg-orange-100 hover:bg-orange-200 cursor-pointer rounded-[20px] border border-black text-black font-semibold rounded-md hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                "Load More"
              )}
            </button>
          </div>
        )}

        <div
          ref={transactionsTableRef}
          className={`overflow-hidden rounded-lg border ${
            allTransactions.length > 10 ? "max-h-[600px] overflow-y-auto" : ""
          }`}
        >
          <Table>
            <TableHeader className="bg-muted sticky top-0 z-10">
              <TableRow>
                <TableHead className="text-center"></TableHead>
                <TableHead className="text-center flex-1">
                  Transaction ID
                </TableHead>
                <TableHead className="text-center flex-1">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 hover:underline w-full justify-center"
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
                <TableHead className="text-center flex-1">
                  Transaction Type
                </TableHead>
                <TableHead className="text-center flex-1">Flow</TableHead>
                <TableHead className="text-center flex-1">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 hover:underline w-full justify-center"
                    onClick={() => {
                      setStatusSortAsc((prev) =>
                        prev === null ? true : !prev,
                      );
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
                      <span className="text-xs">
                        {statusSortAsc ? "▲" : "▼"}
                      </span>
                    )}
                  </button>
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {allTransactions
                .slice()
                .sort((a: any, b: any) => {
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
                .map((tx: any) => (
                  <React.Fragment key={tx.transaction_id}>
                    <TableRow
                      ref={(element) => {
                        transactionRowRefs.current[tx.transaction_id] = element;
                      }}
                      className={`cursor-pointer transition-colors duration-500 hover:bg-muted/50 ${
                        highlightedTransactionId === tx.transaction_id
                          ? "bg-yellow-100 ring-1 ring-yellow-300"
                          : ""
                      }`}
                      onClick={() => toggleRow(tx.transaction_id)}
                    >
                      <TableCell className="text-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className={`h-4 w-4 transition-transform ${
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
                      <TableCell className="text-center w-1/6">
                        <div className="inline-flex items-center gap-2 justify-center">
                          <span className="font-mono">
                            {tx.transaction_id.slice(0, 8)}...
                          </span>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(tx.transaction_id);
                            }}
                            title="Click to copy full Transaction ID"
                            className="hover:text-primary cursor-pointer"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 text-muted-foreground hover:text-foreground transition"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 16h8m2 0a2 2 0 002-2V6a2 2 0 00-2-2H8a2 2 0 00-2 2v8a2 2 0 002 2zM8 16v2a2 2 0 002 2h8a2 2 0 002-2v-2"
                              />
                            </svg>
                          </button>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="space-y-1">
                          <p>{tx.name || "N/A"}</p>
                          {typeof tx.user_id === "string" && tx.user_id.trim() && (
                            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground font-mono">
                              <span title={tx.user_id}>
                                User ID: {tx.user_id.slice(0, 8)}...
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(tx.user_id);
                                }}
                                title="Copy full User ID"
                                className="hover:text-foreground transition cursor-pointer"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="space-y-1">
                          <Badge
                            variant="outline"
                            className={getTransactionTypeBadgeClassName()}
                          >
                            {tx.type || "-"}
                          </Badge>
                          {tx.type === "REGISTRATION" &&
                            typeof tx.registration_id === "string" &&
                            tx.registration_id.trim() && (
                              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground font-mono">
                                <span title={tx.registration_id}>
                                  Reg. ID: {tx.registration_id.slice(0, 8)}...
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(
                                      tx.registration_id,
                                    );
                                  }}
                                  title="Copy full Registration ID"
                                  className="hover:text-foreground transition cursor-pointer"
                                >
                                  <Copy className="h-3 w-3" />
                                </button>
                              </div>
                            )}
                          {tx.type === "EVENT REGISTRATION" &&
                            typeof tx.event_registration_id === "string" &&
                            tx.event_registration_id.trim() && (
                              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground font-mono">
                                <span title={tx.event_registration_id}>
                                  Event Reg. ID: {tx.event_registration_id.slice(0, 8)}...
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(
                                      tx.event_registration_id,
                                    );
                                  }}
                                  title="Copy full Event Registration ID"
                                  className="hover:text-foreground transition cursor-pointer"
                                >
                                  <Copy className="h-3 w-3" />
                                </button>
                              </div>
                            )}
                          {tx.type === "ORDER" &&
                            typeof tx.order_id === "string" &&
                            tx.order_id.trim() && (
                              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground font-mono">
                                <span title={tx.order_id}>
                                  Order ID: {tx.order_id.slice(0, 8)}...
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(tx.order_id);
                                  }}
                                  title="Copy full Order ID"
                                  className="hover:text-foreground transition cursor-pointer"
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
                        <div className="space-y-1">
                          <p
                            className={`font-bold ${getTransactionPaymentClassName(
                              tx.status || "",
                            )}`}
                          >
                            {getTransactionPaymentLabel(tx.status || "")}
                          </p>
                          {shouldShowTransactionPaymentProgress(tx) && (
                            <p className="text-xs text-muted-foreground">
                              {formatAmount(
                                tx.amount_paid || 0,
                                club?.currency || "ZAR",
                              )}{" "}
                              of{" "}
                              {formatAmount(
                                tx.amount || 0,
                                club?.currency || "ZAR",
                              )}
                            </p>
                          )}
                          {shouldShowSingleTransactionAmount(tx) && (
                            <p className="text-xs text-muted-foreground">
                              {formatAmount(
                                tx.amount || 0,
                                club?.currency || "ZAR",
                              )}
                            </p>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Lifecycle Row */}
                    {expandedRows[tx.transaction_id] && (
                      <TableRow className="bg-muted/10">
                        <TableCell colSpan={8} className="p-4">
                          <div className="overflow-hidden rounded-lg border">
                            <Table className="w-full">
                              <TableHeader className="bg-muted sticky top-0 z-10">
                                <TableRow>
                                  <TableHead className="text-center">
                                    Date
                                  </TableHead>
                                  <TableHead className="text-center">
                                    Type
                                  </TableHead>
                                  <TableHead className="text-center">
                                    Description
                                  </TableHead>
                                  <TableHead className="text-center">
                                    Amount
                                  </TableHead>
                                  <TableHead className="text-center">
                                    Payment type
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {Object.entries(tx.lifecycle)
                                  // Sort by timestamp descending (latest first)
                                  .sort(([a], [b]) => Number(b) - Number(a))
                                  .map(([timestamp, entry]: any) => (
                                    <TableRow key={timestamp}>
                                      <TableCell className="text-center">
                                        {new Date(
                                          Number(timestamp),
                                        ).toLocaleString("en-GB", {
                                          day: "2-digit",
                                          month: "2-digit",
                                          year: "numeric",
                                          hour: "2-digit",
                                          minute: "2-digit",
                                          hour12: true,
                                        })}
                                      </TableCell>
                                      <TableCell className="text-center">
                                        <div className="flex items-center justify-center gap-2">
                                          <span>{entry.type}</span>
                                          {entry.type === "REFUND" && (
                                            <span
                                              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
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
                                        {entry.description}
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
                  </React.Fragment>
                ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
