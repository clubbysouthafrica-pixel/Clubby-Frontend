import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { TabsContent } from "@/components/ui/tabs";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { 
  CheckCircle, 
  CreditCard, 
  FileText, 
  Copy,
  Loader2,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatAmount } from "@/data/currencies";

interface Transaction {
  transaction_id: string;
  type: string;
  status: string;
  amount: number;
  lifecycle: Record<string, TransactionEntry>;
}

interface TransactionEntry {
  type: string;
  description: string;
  amount: number;
  payment_type?: string;
}

interface PaymentsTabContentProps {
  data: any;
  bankDetails: any;
  transactions: any;
  isUserTransactionsLoading: boolean;
  expandedRows: Record<string, boolean>;
  editingReference: boolean;
  newReference: string;
  savingReference: boolean;
  toggleRow: (transactionId: string) => void;
  setEditingReference: (editing: boolean) => void;
  setNewReference: (reference: string) => void;
  handleSaveReference: () => void;
  handleCancelEdit: () => void;
  handlePayHereClick: () => void;
}

export default function PaymentsTabContent({
  data,
  bankDetails,
  transactions,
  isUserTransactionsLoading,
  expandedRows,
  editingReference,
  newReference,
  savingReference,
  toggleRow,
  setEditingReference,
  setNewReference,
  handleSaveReference,
  handleCancelEdit,
  handlePayHereClick
}: PaymentsTabContentProps) {
  const [sortColumn, setSortColumn] = useState<'type' | 'status' | 'amount' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (column: 'type' | 'status' | 'amount') => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedTransactions = useMemo(() => {
    if (!transactions?.transactions) return [];
    
    const sorted = [...transactions.transactions];
    
    if (!sortColumn) return sorted;

    sorted.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (sortColumn === 'type') {
        aValue = a.type;
        bValue = b.type;
      } else if (sortColumn === 'status') {
        aValue = a.status;
        bValue = b.status;
      } else if (sortColumn === 'amount') {
        aValue = a.amount;
        bValue = b.amount;
      }

      if (typeof aValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return sortDirection === 'asc'
          ? aValue - bValue
          : bValue - aValue;
      }
    });

    return sorted;
  }, [transactions, sortColumn, sortDirection]);

  return (
    <TabsContent value="bank" className="mt-6">
      {!data?.resubmission_required && (
        <Card className="border-primary/20 shadow-lg mb-6">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-2xl">
                  Outstanding Balance
                </CardTitle>
                <CardDescription className="text-lg">
                  {formatAmount(
                    bankDetails?.outstanding_amount,
                    data.currency
                  )}
                </CardDescription>
              </div>
              {bankDetails?.outstanding_amount === 0 && (
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Paid in Full
                </Badge>
              )}
              {bankDetails?.outstanding_amount > 0 && (
                <Button
                  onClick={handlePayHereClick}
                  className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Pay Now
                </Button>
              )}
            </div>
            {bankDetails?.registration_payment_reference && (
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">
                    Payment Reference Number
                  </p>
                  {!editingReference && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingReference(true)}
                      className="h-6 px-2 text-xs"
                    >
                      Edit
                    </Button>
                  )}
                </div>

                {!editingReference ? (
                  <>
                    <p className="font-mono font-semibold">
                      {bankDetails.registration_payment_reference}
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-2">
                      This reference number is displayed on the
                      admin side. When you make a payment (e.g.,
                      via EFT), include this number as your proof
                      of reference so the admin can verify and
                      match your payment to your account.
                    </p>
                  </>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label
                        htmlFor="reference-input"
                        className="text-xs"
                      >
                        New Reference Number
                      </Label>
                      <Input
                        id="reference-input"
                        value={newReference}
                        onChange={(e) =>
                          setNewReference(e.target.value)
                        }
                        placeholder="Enter new reference number"
                        className="font-mono"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleSaveReference}
                        disabled={
                          savingReference || !newReference.trim()
                        }
                        className="flex-1"
                      >
                        {savingReference && (
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        )}
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancelEdit}
                        disabled={savingReference}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardHeader>
        </Card>
      )}
      <div className="flex flex-col w-full gap-6">
        {!isUserTransactionsLoading && transactions && (
          <Card className="border-primary/20 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">
                    Transaction History
                  </CardTitle>
                  <CardDescription className="text-base">
                    View your payment transactions and membership
                    activity
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className={`${transactions?.transactions && transactions.transactions.length > 5 ? 'max-h-96 overflow-y-auto' : 'overflow-hidden'}`}>
                <Table className="border-0">
                  <TableHeader className="bg-gradient-to-r from-muted/50 to-muted/30 sticky top-0 z-10">
                    <TableRow className="border-primary/10 hover:bg-transparent">
                      <TableHead className="text-center w-1/5 font-semibold">
                        Transaction ID
                      </TableHead>
                      <TableHead 
                        className="text-center w-1/5 font-semibold cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleSort('type')}
                      >
                        <div className="flex items-center justify-center gap-2">
                          Type
                          {sortColumn === 'type' && (
                            sortDirection === 'asc' ? 
                              <ArrowUp className="h-4 w-4" /> : 
                              <ArrowDown className="h-4 w-4" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="text-center w-1/5 font-semibold cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleSort('status')}
                      >
                        <div className="flex items-center justify-center gap-2">
                          Status
                          {sortColumn === 'status' && (
                            sortDirection === 'asc' ? 
                              <ArrowUp className="h-4 w-4" /> : 
                              <ArrowDown className="h-4 w-4" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="text-center w-1/5 font-semibold cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleSort('amount')}
                      >
                        <div className="flex items-center justify-center gap-2">
                          Amount
                          {sortColumn === 'amount' && (
                            sortDirection === 'asc' ? 
                              <ArrowUp className="h-4 w-4" /> : 
                              <ArrowDown className="h-4 w-4" />
                          )}
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {transactions.transactions.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center py-8 text-muted-foreground"
                        >
                          No transactions yet.
                        </TableCell>
                      </TableRow>
                    )}
                    {sortedTransactions.map(
                      (tx: Transaction) => (
                        <React.Fragment key={tx.transaction_id}>
                          {/* Main Transaction Row */}
                          <TableRow
                            className="cursor-pointer hover:bg-primary/5 transition-colors border-primary/10 group"
                            onClick={() =>
                              toggleRow(tx.transaction_id)
                            }
                          >
                            <TableCell className="text-center w-1/5 py-4">
                              <div className="inline-flex items-center gap-3 justify-center">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-primary/50" />
                                  <span className="font-mono text-sm bg-muted/50 px-2 py-1 rounded">
                                    {tx.transaction_id.slice(
                                      0,
                                      8
                                    )}
                                    ...
                                  </span>
                                </div>

                                {/* Copy button */}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(
                                      tx.transaction_id
                                    );
                                  }}
                                  title="Copy full Transaction ID"
                                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>

                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className={`h-4 w-4 transition-transform text-muted-foreground ${
                                    expandedRows[
                                      tx.transaction_id
                                    ]
                                      ? "rotate-90"
                                      : ""
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
                              </div>
                            </TableCell>
                            <TableCell className="text-center w-1/5 py-4">
                              <Badge
                                variant="outline"
                                className="font-medium"
                              >
                                {tx.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center w-1/5 py-4">
                              <Badge
                                className={cn(
                                  "font-medium",
                                  tx.status === "PENDING"
                                    ? "bg-blue-100 text-blue-800 border-blue-200"
                                    : tx.status ===
                                      "PARTIALLY_PAID"
                                    ? "bg-orange-100 text-orange-800 border-orange-200"
                                    : tx.status === "REFUND"
                                    ? "bg-red-100 text-red-800 border-red-200"
                                    : tx.status === "CANCELLED"
                                    ? "bg-red-100 text-red-800 border-red-200"
                                    : "bg-green-100 text-green-800 border-green-200"
                                )}
                              >
                                {tx.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center w-1/5 py-4 font-semibold">
                              {formatAmount(tx.amount, data.currency)}
                            </TableCell>
                          </TableRow>

                          {expandedRows[tx.transaction_id] && (
                            <TableRow className="bg-muted/10">
                              <TableCell
                                colSpan={8}
                                className="p-4"
                              >
                                <div className="overflow-hidden rounded-lg">
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
                                      {Object.entries(
                                        tx.lifecycle as Record<
                                          string,
                                          TransactionEntry
                                        >
                                      )
                                        // Sort by timestamp descending (latest first)
                                        .sort(
                                          ([a], [b]) =>
                                            Number(b) - Number(a)
                                        )
                                        .map(
                                          ([timestamp, entry]: [
                                            string,
                                            TransactionEntry
                                          ]) => (
                                            <TableRow
                                              key={timestamp}
                                            >
                                              <TableCell className="text-center">
                                                {new Date(
                                                  Number(
                                                    timestamp
                                                  )
                                                ).toLocaleString(
                                                  "en-GB",
                                                  {
                                                    day: "2-digit",
                                                    month:
                                                      "2-digit",
                                                    year: "numeric",
                                                    hour: "2-digit",
                                                    minute:
                                                      "2-digit",
                                                    hour12: true,
                                                  }
                                                )}
                                              </TableCell>
                                              <TableCell className="text-center">
                                                {entry.type}
                                              </TableCell>
                                              <TableCell className="text-center">
                                                {
                                                  entry.description
                                                }
                                              </TableCell>
                                              <TableCell
                                                className={`text-center ${
                                                  entry.type ===
                                                  "SUBMISSION"
                                                    ? "text-black-700"
                                                    : entry.type ===
                                                      "REFUND"
                                                    ? "text-red-700"
                                                    : entry.type ===
                                                      "CANCELLATION"
                                                    ? "text-red-700"
                                                    : "text-green-700"
                                                }`}
                                              >
                                                {entry.type ===
                                                "SUBMISSION"
                                                  ? ""
                                                  : entry.type === "REFUND"
                                                  ? "-"
                                                  : entry.type === "CANCELLATION"
                                                  ? "N/A"
                                                  : "+"}
                                                {entry.type !== "CANCELLATION" && formatAmount(
                                                  entry.type === "REFUND" ? Math.abs(entry.amount) : entry.amount,
                                                  data.currency
                                                )}
                                              </TableCell>
                                              <TableCell className="text-center">
                                                {entry.payment_type ??
                                                  "N/A"}
                                              </TableCell>
                                            </TableRow>
                                          )
                                        )}
                                    </TableBody>
                                  </Table>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      )
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </TabsContent>
  );
}