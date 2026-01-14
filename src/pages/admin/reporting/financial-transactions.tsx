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
import * as React from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function FinancialTransactionsPage() {
  const { club, isLoading: clubLoading } = useContext(
    ClubContext
  ) as ClubContextType;
  
  const [transactionLimit, setTransactionLimit] = useState(25);
  const [pageToken, setPageToken] = useState<string | undefined>(undefined);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const isLoadingMoreRef = useRef(false);
  
  const [memberIdSearch, setMemberIdSearch] = useState("");
  const [txIdSearch, setTxIdSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [transactionType, setTransactionType] = useState("all");

  const [appliedFilters, setAppliedFilters] = useState<{ transaction_id?: string; member_id?: string; transaction_type?: string; status?: string }>({});

  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  
  const { data: transactions, isLoading, refetch: refetchTransactions } = useFetchClubTransactions(
    club?.club_account_id as string,
    transactionLimit,
    pageToken,
    appliedFilters
  );

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  React.useEffect(() => {
    if (transactions?.transactions) {
      if (isLoadingMoreRef.current) {
        // Append new data when loading more
        setAllTransactions((prev) => [...prev, ...transactions.transactions]);
        isLoadingMoreRef.current = false;
      } else {
        // Replace all data when initial load or filter change
        setAllTransactions(transactions.transactions);
      }
    }
  }, [transactions]);

  if (clubLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-5 min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  return (
    <div className="p-5">
      <h1 className="text-base font-bold mb-4">Revenue Transactions</h1>

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
              <SelectItem value="REGISTRATION">Registration</SelectItem>
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
            </SelectContent>
          </Select>
        </div>

        <p className="text-sm text-gray-600 my-1">
          Configure your filters above, then click the <span className="font-semibold">Run</span> button to apply your selections and display the results.
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
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-xl font-medium text-gray-700">
          Showing <span className="font-bold">{allTransactions.length}</span> items
        </h2>
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
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Load More"
            )}
          </button>
        </div>
      )}

      <div
        className={`overflow-hidden rounded-lg border ${
          allTransactions.length > 10
            ? "max-h-[600px] overflow-y-auto"
            : ""
        }`}
      >
        <Table>
          <TableHeader className="bg-muted sticky top-0 z-10">
            <TableRow>
              <TableHead className="text-center"></TableHead>
              <TableHead className="text-center w-1/4">
                Transaction ID
              </TableHead>
              <TableHead className="text-center w-1/4">Member ID</TableHead>
              <TableHead className="text-center w-1/4">Type</TableHead>
              <TableHead className="text-center w-1/4">Status</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {allTransactions.map((tx: any) => (
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
                    <span className="font-mono">
                      {tx.user_id.slice(0, 8)}...
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(tx.user_id);
                      }}
                      title="Click to copy full Member ID"
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
                  </TableCell>
                  <TableCell className="text-center">{tx.type}</TableCell>
                  <TableCell
                    className={`text-center font-bold ${
                      tx.status === "PENDING"
                        ? "text-blue-700"
                        : tx.status === "PARTIALLY_PAID"
                        ? "text-orange-700"
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
                              // Sort by timestamp descending (latest first)
                              .sort(([a], [b]) => Number(b) - Number(a))
                              .map(([timestamp, entry]: any) => (
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
                                      }
                                    )}
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
                                        : "text-green-700"
                                    }`}
                                  >
                                    {
                                        entry.type === "SUBMISSION" ? "" 
                                        : entry.type === "CANCELLATION" ? "N/A"
                                        : "+"
                                    }
                                    {entry.type !== "CANCELLATION" &&
                                      formatAmount(
                                        entry.amount,
                                        club?.currency || ""
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
    </div>
  );
}
