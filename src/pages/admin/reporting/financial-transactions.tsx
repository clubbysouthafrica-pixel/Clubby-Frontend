import { useContext, useState, useRef, useEffect } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, Copy, BarChart3 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { api } from "@/services/admin/api";
import { toast } from "sonner";

export default function FinancialTransactionsPage() {
  const { club, isLoading: clubLoading } = useContext(
    ClubContext,
  ) as ClubContextType;

  const [transactionLimit, setTransactionLimit] = useState(25);
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
  const [amountSortAsc, setAmountSortAsc] = useState<boolean | null>(null);
  const [amountPaidSortAsc, setAmountPaidSortAsc] = useState<boolean | null>(
    null,
  );
  const [refundNameSortAsc, setRefundNameSortAsc] = useState<boolean | null>(
    null,
  );
  const [refundTypeSortAsc, setRefundTypeSortAsc] = useState<boolean | null>(
    null,
  );
  const [refundAmountSortAsc, setRefundAmountSortAsc] = useState<
    boolean | null
  >(null);
  const [refundDateSortAsc, setRefundDateSortAsc] = useState<boolean | null>(
    null,
  );
  const [confirmRefundDialog, setConfirmRefundDialog] =
    useState<boolean>(false);
  const [selectedRefundTransaction, setSelectedRefundTransaction] =
    useState<any>(null);
  const [isConfirmingRefund, setIsConfirmingRefund] = useState<boolean>(false);

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

  const getRefundsFromLifecycle = (lifecycle: any) => {
    if (!lifecycle) return [];
    return Object.entries(lifecycle)
      .filter(([, entry]: any) => entry.type === "REFUND")
      .map(([timestamp, entry]: any) => ({
        timestamp: Number(timestamp),
        ...entry,
      }));
  };

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

  if (clubLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-5 min-h-screen flex justify-center items-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 shadow-sm backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-4">
            <span className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 shadow-inner">
              <BarChart3 className="h-7 w-7 text-primary" />
            </span>
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Financial Transactions
              </h1>
              <p className="text-base text-slate-500 dark:text-slate-400 mt-1">
                View, filter, and manage all club financial transactions and
                refunds.
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 md:px-10 py-10">
        <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-8 border border-slate-100 dark:border-slate-800">
          {/* Filters/Search Bar */}
          <Card className="p-4 mb-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex flex-wrap gap-4">
              <Input
                className="w-[220px]"
                placeholder="Search by Transaction ID"
                value={txIdSearch}
                onChange={(e) => setTxIdSearch(e.target.value)}
              />

              <Input
                className="w-[220px]"
                placeholder="Search by Member ID"
                value={memberIdSearch}
                onChange={(e) => setMemberIdSearch(e.target.value)}
              />

              <Select
                onValueChange={setTransactionType}
                value={transactionType}
              >
                <SelectTrigger className="flex items-center gap-2 w-[180px]">
                  <span className="text-muted-foreground whitespace-nowrap">
                    Tx. Type:
                  </span>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="REGISTRATION">Registration</SelectItem>
                  <SelectItem value="ORDER">Order</SelectItem>
                </SelectContent>
              </Select>

              <Select onValueChange={setStatusFilter} value={statusFilter}>
                <SelectTrigger className="flex items-center gap-2 w-[180px]">
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

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-4">
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  Configure your filters above, then click{" "}
                  <span className="font-semibold">Run</span> to apply.
                </span>
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
                  className="px-4 py-2 bg-primary/90 text-white rounded-lg font-semibold hover:bg-primary transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Run
                </button>
              </div>
              <div className="flex items-center gap-3">
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
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xl font-medium text-slate-700 dark:text-slate-200">
              Showing{" "}
              <span className="font-bold">{allTransactions.length}</span> items
            </h2>
          </div>

          {transactions?.pageToken && transactions.pageToken !== "" && (
            <div className="bg-orange-100 dark:bg-orange-900 border border-orange-600 p-4 rounded-md flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <p className="text-black dark:text-white font-medium">
                  More results available
                </p>
              </div>
              <button
                onClick={() => {
                  isLoadingMoreRef.current = true;
                  setPageToken(transactions.pageToken);
                  setTimeout(() => refetchTransactions(), 0);
                }}
                disabled={isLoading}
                className="px-4 py-2 bg-orange-100 dark:bg-orange-900 hover:bg-orange-200 dark:hover:bg-orange-800 cursor-pointer rounded-[20px] border border-black text-black dark:text-white font-semibold hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Load More"
                )}
              </button>
            </div>
          )}

          {/* Transactions Table */}
          <div
            className={`overflow-hidden rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 ${
              allTransactions.length > 10 ? "max-h-[600px] overflow-y-auto" : ""
            }`}
          >
            {/* ...Table code remains unchanged... */}
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
                        setNameSortAsc((prev) =>
                          prev === null ? true : !prev,
                        );
                        setStatusSortAsc(null);
                        setAmountSortAsc(null);
                        setAmountPaidSortAsc(null);
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
                        <span className="text-xs">
                          {nameSortAsc ? "▲" : "▼"}
                        </span>
                      )}
                    </button>
                  </TableHead>
                  <TableHead className="text-center flex-1">Type</TableHead>
                  <TableHead className="text-center flex-1">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 hover:underline w-full justify-center"
                      onClick={() => {
                        setAmountSortAsc((prev) =>
                          prev === null ? true : !prev,
                        );
                        setNameSortAsc(null);
                        setStatusSortAsc(null);
                        setAmountPaidSortAsc(null);
                      }}
                      title="Toggle sort by Amount"
                    >
                      Amount
                      {amountSortAsc === null ? (
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
                          {amountSortAsc ? "▲" : "▼"}
                        </span>
                      )}
                    </button>
                  </TableHead>
                  <TableHead className="text-center flex-1">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 hover:underline w-full justify-center"
                      onClick={() => {
                        setAmountPaidSortAsc((prev) =>
                          prev === null ? true : !prev,
                        );
                        setNameSortAsc(null);
                        setStatusSortAsc(null);
                        setAmountSortAsc(null);
                      }}
                      title="Toggle sort by Amount Paid"
                    >
                      Amount Paid
                      {amountPaidSortAsc === null ? (
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
                          {amountPaidSortAsc ? "▲" : "▼"}
                        </span>
                      )}
                    </button>
                  </TableHead>
                  <TableHead className="text-center flex-1">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 hover:underline w-full justify-center"
                      onClick={() => {
                        setStatusSortAsc((prev) =>
                          prev === null ? true : !prev,
                        );
                        setNameSortAsc(null);
                        setAmountSortAsc(null);
                        setAmountPaidSortAsc(null);
                      }}
                      title="Toggle sort by Status"
                    >
                      Status
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
                    if (amountSortAsc !== null) {
                      const aAmount = a.amount || 0;
                      const bAmount = b.amount || 0;
                      return amountSortAsc
                        ? aAmount - bAmount
                        : bAmount - aAmount;
                    }
                    if (amountPaidSortAsc !== null) {
                      const aAmountPaid = a.amount_paid || 0;
                      const bAmountPaid = b.amount_paid || 0;
                      return amountPaidSortAsc
                        ? aAmountPaid - bAmountPaid
                        : bAmountPaid - aAmountPaid;
                    }
                    return 0;
                  })
                  .map((tx: any) => (
                    <React.Fragment key={tx.transaction_id}>
                      <TableRow
                        className="cursor-pointer hover:bg-muted/50 transition"
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
                                navigator.clipboard.writeText(
                                  tx.transaction_id,
                                );
                              }}
                              title="Click to copy full Transaction ID"
                              className="hover:text-primary cursor-pointer"
                            >
                              <Copy className="h-4 w-4 text-muted-foreground hover:text-foreground transition" />
                            </button>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {tx.name || "N/A"}
                        </TableCell>
                        <TableCell className="text-center">{tx.type}</TableCell>
                        <TableCell className="text-center">
                          {tx.amount != null
                            ? formatAmount(tx.amount, club?.currency)
                            : "N/A"}
                        </TableCell>
                        <TableCell className="text-center">
                          {tx.amount_paid != null
                            ? formatAmount(tx.amount_paid, club?.currency)
                            : "N/A"}
                        </TableCell>
                        <TableCell
                          className={`text-center font-bold ${
                            tx.status === "PENDING"
                              ? "text-blue-700"
                              : tx.status === "PARTIALLY_PAID"
                                ? "text-orange-600"
                                : tx.status === "REFUND"
                                  ? "text-purple-700"
                                  : tx.status === "CANCELLED"
                                    ? "text-red-700"
                                    : "text-green-700"
                          }`}
                        >
                          {tx.status}
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
                                          {entry.type}
                                        </TableCell>
                                        <TableCell className="text-center">
                                          {entry.description}
                                        </TableCell>
                                        <TableCell
                                          className={`text-center ${
                                            entry.type === "SUBMISSION"
                                              ? "text-black-700"
                                              : entry.type === "CANCELLATION"
                                                ? "text-red-700"
                                                : entry.type === "REFUND"
                                                  ? "text-red-700"
                                                  : "text-green-700"
                                          }`}
                                        >
                                          {entry.type === "SUBMISSION"
                                            ? ""
                                            : entry.type === "REFUND"
                                              ? "-"
                                              : entry.type === "CANCELLATION"
                                                ? "N/A"
                                                : "+"}
                                          {entry.type !== "CANCELLATION" &&
                                            formatAmount(
                                              entry.type === "REFUND"
                                                ? Math.abs(entry.amount)
                                                : entry.amount,
                                              club?.currency || "",
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                          {entry.payment_type || "N/A"}
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

          {/* Unconfirmed Refunds Table */}
          {getUnconfirmedRefundRows().length > 0 && (
            <div className="mt-8">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-xl font-medium text-slate-700 dark:text-slate-200">
                  Showing{" "}
                  <span className="font-bold">
                    {getUnconfirmedRefundRows().length}
                  </span>{" "}
                  unconfirmed refunds
                </h2>
              </div>
              <div
                className={`overflow-hidden rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 ${
                  getUnconfirmedRefundRows().length > 10
                    ? "max-h-[600px] overflow-y-auto"
                    : ""
                }`}
              >
                <Table>
                  <TableHeader className="bg-muted sticky top-0 z-10">
                    <TableRow>
                      <TableHead className="text-center flex-1">
                        Transaction ID
                      </TableHead>
                      <TableHead className="text-center flex-1">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 hover:underline w-full justify-center"
                          onClick={() => {
                            setRefundNameSortAsc((prev) =>
                              prev === null ? true : !prev,
                            );
                            setRefundTypeSortAsc(null);
                            setRefundAmountSortAsc(null);
                            setRefundDateSortAsc(null);
                          }}
                          title="Toggle sort by Member Name"
                        >
                          Member Name
                          {refundNameSortAsc === null ? (
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
                              {refundNameSortAsc ? "▲" : "▼"}
                            </span>
                          )}
                        </button>
                      </TableHead>
                      <TableHead className="text-center flex-1">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 hover:underline w-full justify-center"
                          onClick={() => {
                            setRefundTypeSortAsc((prev) =>
                              prev === null ? true : !prev,
                            );
                            setRefundNameSortAsc(null);
                            setRefundAmountSortAsc(null);
                            setRefundDateSortAsc(null);
                          }}
                          title="Toggle sort by Type"
                        >
                          Type
                          {refundTypeSortAsc === null ? (
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
                              {refundTypeSortAsc ? "▲" : "▼"}
                            </span>
                          )}
                        </button>
                      </TableHead>
                      <TableHead className="text-center flex-1">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 hover:underline w-full justify-center"
                          onClick={() => {
                            setRefundAmountSortAsc((prev) =>
                              prev === null ? true : !prev,
                            );
                            setRefundNameSortAsc(null);
                            setRefundTypeSortAsc(null);
                            setRefundDateSortAsc(null);
                          }}
                          title="Toggle sort by Refund Amount"
                        >
                          Refund Amount
                          {refundAmountSortAsc === null ? (
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
                              {refundAmountSortAsc ? "▲" : "▼"}
                            </span>
                          )}
                        </button>
                      </TableHead>
                      <TableHead className="text-center flex-1">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 hover:underline w-full justify-center"
                          onClick={() => {
                            setRefundDateSortAsc((prev) =>
                              prev === null ? true : !prev,
                            );
                            setRefundNameSortAsc(null);
                            setRefundTypeSortAsc(null);
                            setRefundAmountSortAsc(null);
                          }}
                          title="Toggle sort by Refund Date"
                        >
                          Refund Date
                          {refundDateSortAsc === null ? (
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
                              {refundDateSortAsc ? "▲" : "▼"}
                            </span>
                          )}
                        </button>
                      </TableHead>
                      <TableHead className="text-center flex-1">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getUnconfirmedRefundRows()
                      .sort((a, b) => {
                        if (refundNameSortAsc !== null) {
                          const aName = a.name || "";
                          const bName = b.name || "";
                          return refundNameSortAsc
                            ? aName.localeCompare(bName)
                            : bName.localeCompare(aName);
                        }
                        if (refundTypeSortAsc !== null) {
                          const aType = a.type || "";
                          const bType = b.type || "";
                          return refundTypeSortAsc
                            ? aType.localeCompare(bType)
                            : bType.localeCompare(aType);
                        }
                        if (refundAmountSortAsc !== null) {
                          const aAmount = a.amount || 0;
                          const bAmount = b.amount || 0;
                          return refundAmountSortAsc
                            ? aAmount - bAmount
                            : bAmount - aAmount;
                        }
                        if (refundDateSortAsc !== null) {
                          const aTimestamp = a.timestamp || 0;
                          const bTimestamp = b.timestamp || 0;
                          return refundDateSortAsc
                            ? aTimestamp - bTimestamp
                            : bTimestamp - aTimestamp;
                        }
                        return 0;
                      })
                      .map((refundEntry: any) => (
                        <TableRow
                          key={`${refundEntry.transaction_id}-${refundEntry.timestamp}`}
                          className="hover:bg-muted/50 transition"
                        >
                          <TableCell className="text-center">
                            <div className="inline-flex items-center gap-2">
                              <span className="font-mono text-sm bg-muted/50 px-2 py-1 rounded">
                                {refundEntry.transaction_id?.slice(0, 8) ||
                                  "N/A"}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  navigator.clipboard.writeText(
                                    refundEntry.transaction_id,
                                  );
                                  toast.success("Transaction ID copied!");
                                }}
                                title="Copy full Transaction ID"
                                className="h-6 w-6 p-0"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {refundEntry.name || "N/A"}
                          </TableCell>
                          <TableCell className="text-center">
                            {refundEntry.type}
                          </TableCell>
                          <TableCell className="text-center">
                            {refundEntry.amount > 0
                              ? formatAmount(refundEntry.amount, club?.currency)
                              : "N/A"}
                          </TableCell>
                          <TableCell className="text-center">
                            {refundEntry.timestamp
                              ? new Date(refundEntry.timestamp).toLocaleString(
                                  "en-GB",
                                  {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true,
                                  },
                                )
                              : "N/A"}
                          </TableCell>
                          <TableCell className="text-center">
                            <button
                              onClick={() => {
                                const fullTransaction = allTransactions.find(
                                  (tx) =>
                                    tx.transaction_id ===
                                    refundEntry.transaction_id,
                                );
                                setSelectedRefundTransaction({
                                  ...refundEntry,
                                  fullTransaction: fullTransaction,
                                });
                                setConfirmRefundDialog(true);
                              }}
                              className="text-green-600 hover:text-green-700 cursor-pointer font-medium transition-colors"
                            >
                              Confirm Refund Completed
                            </button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Confirm Refund Dialog */}
          <Dialog
            open={confirmRefundDialog}
            onOpenChange={setConfirmRefundDialog}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Refund Completed</DialogTitle>
                <DialogDescription>
                  Are you sure you want to confirm this refund? This will remove
                  it from the refunds table as the refund is considered
                  complete.
                </DialogDescription>
              </DialogHeader>
              {selectedRefundTransaction && (
                <div className="py-4 space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">Member:</span>{" "}
                    {selectedRefundTransaction?.name || "N/A"}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Refund Description:</span>{" "}
                    {selectedRefundTransaction?.description || "N/A"}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Refund Amount:</span>{" "}
                    {selectedRefundTransaction?.amount > 0
                      ? formatAmount(
                          selectedRefundTransaction?.amount,
                          club?.currency,
                        )
                      : "N/A"}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Refund Date:</span>{" "}
                    {selectedRefundTransaction?.timestamp
                      ? new Date(
                          selectedRefundTransaction.timestamp,
                        ).toLocaleString("en-GB", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })
                      : "N/A"}
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setConfirmRefundDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    if (!selectedRefundTransaction) return;
                    setIsConfirmingRefund(true);
                    try {
                      const response = await api.post(
                        `/transactions/confirmRefund`,
                        {
                          club_account_id: club?.club_account_id,
                          transaction_id:
                            selectedRefundTransaction.transaction_id,
                          refund_timestamp: selectedRefundTransaction.timestamp,
                        },
                      );
                      toast.success(
                        response.data?.message ||
                          "Refund confirmed successfully",
                      );

                      setAllTransactions((prev) =>
                        prev.map((tx) =>
                          tx.transaction_id ===
                          selectedRefundTransaction.transaction_id
                            ? {
                                ...tx,
                                lifecycle: {
                                  ...tx.lifecycle,
                                  [selectedRefundTransaction.timestamp]: {
                                    ...tx.lifecycle[
                                      selectedRefundTransaction.timestamp
                                    ],
                                    refund_completed: true,
                                  },
                                },
                              }
                            : tx,
                        ),
                      );

                      setConfirmRefundDialog(false);
                      setSelectedRefundTransaction(null);
                    } catch (error: any) {
                      const errorMessage =
                        error.response?.data?.message ||
                        "Failed to confirm refund";
                      toast.error(errorMessage);
                      console.error("Error confirming refund:", error);
                    } finally {
                      setIsConfirmingRefund(false);
                    }
                  }}
                  disabled={isConfirmingRefund}
                >
                  {isConfirmingRefund ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Confirming...
                    </>
                  ) : (
                    "Confirm Refund"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </section>
      </main>
    </div>
  );
}
