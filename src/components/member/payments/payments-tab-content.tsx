import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { TabsContent } from "@/components/ui/tabs";
import { 
  CheckCircle, 
  CreditCard, 
  FileText, 
  Copy,
  Loader2,
  ArrowUp,
  ArrowDown,
  Search,
  Receipt,
  Wallet,
  ChevronRight,
  Clock3,
  Landmark,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatAmount } from "@/data/currencies";
import { useFetchUserTransactions } from "@/queries/transactions";
import {
  BankDetails,
  PaymentTransactionOption,
} from "./payment-types.ts";

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

interface PaymentsData {
  currency?: string;
  resubmission_required?: boolean;
}

interface PaymentsTabContentProps {
  data: PaymentsData;
  bankDetails: BankDetails | null | undefined;
  clubAccountId: string;
  userId: string;
  isActive: boolean;
  scrollToOutstandingTrigger?: number;
  highlightedOrderId?: string | null;
  highlightedTransactionId?: string | null;
  highlightedEventRegistrationId?: string | null;
  expandedRows: Record<string, boolean>;
  editingReference: boolean;
  newReference: string;
  savingReference: boolean;
  toggleRow: (transactionId: string) => void;
  setEditingReference: (editing: boolean) => void;
  setNewReference: (reference: string) => void;
  handleSaveReference: () => void;
  handleCancelEdit: () => void;
  handlePayHereClick: (paymentOption?: PaymentTransactionOption) => void;
  onViewPaymentTarget: (paymentOption: PaymentTransactionOption) => void;
}

export default function PaymentsTabContent({
  data,
  bankDetails,
  clubAccountId,
  userId,
  isActive,
  scrollToOutstandingTrigger = 0,
  highlightedOrderId,
  highlightedTransactionId,
  highlightedEventRegistrationId,
  expandedRows,
  editingReference,
  newReference,
  savingReference,
  toggleRow,
  setEditingReference,
  setNewReference,
  handleSaveReference,
  handleCancelEdit,
  handlePayHereClick,
  onViewPaymentTarget,
}: PaymentsTabContentProps) {
  const [sortColumn, setSortColumn] = useState<'type' | 'status' | 'amount' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [transactionSearch, setTransactionSearch] = useState("");
  const [copiedPaymentId, setCopiedPaymentId] = useState<string | null>(null);
  const outstandingBalanceRef = useRef<HTMLDivElement | null>(null);
  const highlightedPaymentRef = useRef<HTMLDivElement | null>(null);
  const outstandingAmount = bankDetails?.outstanding_amount ?? 0;
  const {
    data: transactions,
    isLoading: isUserTransactionsLoading,
  } = useFetchUserTransactions(clubAccountId, userId, isActive);

  const transactionOptions = useMemo(() => {
    return Array.isArray(bankDetails?.transaction_options)
      ? bankDetails.transaction_options
      : [];
  }, [bankDetails?.transaction_options]);

  useEffect(() => {
    if (!isActive || scrollToOutstandingTrigger === 0) {
      return;
    }

    const scrollTimeout = window.setTimeout(() => {
      outstandingBalanceRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 100);

    return () => window.clearTimeout(scrollTimeout);
  }, [isActive, scrollToOutstandingTrigger]);

  useEffect(() => {
    if (
      !isActive ||
      (!highlightedOrderId &&
        !highlightedTransactionId &&
        !highlightedEventRegistrationId)
    ) {
      return;
    }

    const scrollTimeout = window.setTimeout(() => {
      highlightedPaymentRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 100);

    return () => window.clearTimeout(scrollTimeout);
  }, [
    highlightedEventRegistrationId,
    highlightedOrderId,
    highlightedTransactionId,
    isActive,
    transactionOptions.length,
  ]);

  const transactionItems = useMemo(() => {
    return Array.isArray(transactions?.transactions) ? transactions.transactions : [];
  }, [transactions?.transactions]);

  const filteredTransactionItems = useMemo(() => {
    const query = transactionSearch.trim().toLowerCase();

    if (!query) {
      return transactionItems;
    }

    return transactionItems.filter((transaction: Transaction) => {
      const lifecycleText = Object.values(transaction.lifecycle || {})
        .map((entry: TransactionEntry) => `${entry.type} ${entry.description} ${entry.payment_type ?? ""}`)
        .join(" ")
        .toLowerCase();

      return [
        transaction.transaction_id,
        transaction.type,
        transaction.status,
        String(transaction.amount),
        lifecycleText,
      ].some((value) => value.toLowerCase().includes(query));
    });
  }, [transactionItems, transactionSearch]);

  const handleSort = (column: 'type' | 'status' | 'amount') => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleCopyPaymentValue = (value: string, fieldKey: string) => {
    navigator.clipboard.writeText(value);
    setCopiedPaymentId(fieldKey);
    setTimeout(() => setCopiedPaymentId((current) => (current === fieldKey ? null : current)), 2000);
  };

  const sortedTransactions = useMemo(() => {
    if (filteredTransactionItems.length === 0) return [];

    const sorted = [...filteredTransactionItems];
    
    if (!sortColumn) return sorted;

    sorted.sort((a, b) => {
      let aValue: string | number = "";
      let bValue: string | number = "";

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

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      const leftAmount = typeof aValue === 'number' ? aValue : 0;
      const rightAmount = typeof bValue === 'number' ? bValue : 0;

      return sortDirection === 'asc'
        ? leftAmount - rightAmount
        : rightAmount - leftAmount;
    });

    return sorted;
  }, [filteredTransactionItems, sortColumn, sortDirection]);

  const paidTransactionsCount = useMemo(() => {
    return transactionItems.filter((transaction: Transaction) => transaction.status === "PAID").length;
  }, [transactionItems]);

  const pendingTransactionsCount = useMemo(() => {
    return transactionItems.filter((transaction: Transaction) =>
      ["PENDING", "PARTIALLY_PAID"].includes(transaction.status),
    ).length;
  }, [transactionItems]);

  const totalTransactionAmount = useMemo(() => {
    return transactionItems.reduce((sum: number, transaction: Transaction) => {
      return sum + (Number(transaction.amount) || 0);
    }, 0);
  }, [transactionItems]);

  const statusBadgeClassName = (status: string) => {
    if (status === "PENDING") {
      return "border-sky-200 bg-sky-50 text-sky-700";
    }

    if (status === "PARTIALLY_PAID") {
      return "border-amber-200 bg-amber-50 text-amber-700";
    }

    if (status === "REFUND" || status === "CANCELLED") {
      return "border-rose-200 bg-rose-50 text-rose-700";
    }

    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  };

  return (
    <TabsContent value="bank" className="mt-6">
      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
          <Card className="overflow-hidden border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] text-slate-900 shadow-[0_24px_70px_-34px_rgba(15,23,42,0.22)]">
            <CardContent className="space-y-6 p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Member Payments
                  </p>
                  <h2 className="text-2xl font-semibold">Billing overview</h2>
                  <p className="text-sm leading-6 text-slate-500">
                    Review outstanding charges, pick a payment target, and trace every transaction from one place.
                  </p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                  <Wallet className="h-7 w-7 text-slate-700" />
                </div>
              </div>

              <div ref={outstandingBalanceRef} className="scroll-mt-24 rounded-3xl border border-slate-200 bg-white p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Outstanding balance</p>
                <p className="mt-2 text-4xl font-semibold tracking-tight">
                  {formatAmount(outstandingAmount, data.currency)}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {outstandingAmount === 0 ? (
                    <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">
                      <CheckCircle className="mr-1 h-3.5 w-3.5" />
                      Paid in full
                    </Badge>
                  ) : (
                    <Badge className="border-amber-200 bg-amber-50 text-amber-700">
                      Balance due
                    </Badge>
                  )}
                  <Badge className="border-slate-200 bg-slate-50 text-slate-700">
                    {transactionOptions.length} open {transactionOptions.length === 1 ? "item" : "items"}
                  </Badge>
                </div>
                {outstandingAmount > 0 && transactionOptions.length === 0 ? (
                  <Button
                    onClick={() => handlePayHereClick()}
                    className="mt-5 w-full bg-slate-900 text-white hover:bg-slate-800"
                  >
                    Pay outstanding balance
                  </Button>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Paid</p>
                  <p className="mt-2 text-2xl font-semibold">{paidTransactionsCount}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Pending</p>
                  <p className="mt-2 text-2xl font-semibold">{pendingTransactionsCount}</p>
                </div>
                <div className="col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Total transaction value</p>
                  <p className="mt-2 text-2xl font-semibold">{formatAmount(totalTransactionAmount, data.currency)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {bankDetails?.registration_payment_reference ? (
            <Card className="border-slate-200 bg-white shadow-[0_18px_50px_-32px_rgba(15,23,42,0.35)]">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100">
                    <Landmark className="h-5 w-5 text-slate-700" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Payment reference</CardTitle>
                    <CardDescription>Use this reference when paying by transfer.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {!editingReference ? (
                  <>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Reference number</p>
                      <p className="mt-2 break-all font-mono text-lg font-semibold text-slate-950">
                        {bankDetails.registration_payment_reference}
                      </p>
                    </div>
                    <p className="text-sm leading-6 text-slate-500">
                      Club staff uses this reference to reconcile manual payments like EFT deposits against your member account.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingReference(true)}
                      className="w-full border-slate-200"
                    >
                      Edit reference
                    </Button>
                  </>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="reference-input" className="text-xs uppercase tracking-[0.16em] text-slate-500">
                        New reference number
                      </Label>
                      <Input
                        id="reference-input"
                        value={newReference}
                        onChange={(e) => setNewReference(e.target.value)}
                        placeholder="Enter new reference number"
                        className="font-mono"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleSaveReference}
                        disabled={savingReference || !newReference.trim()}
                        className="flex-1"
                      >
                        {savingReference ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancelEdit}
                        disabled={savingReference}
                        className="flex-1 border-slate-200"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}
        </aside>

        <div className="space-y-6">
          {!data?.resubmission_required ? (
            <Card className="overflow-hidden border-0 bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.08),_transparent_32%),linear-gradient(180deg,#fff_0%,#f8fafc_100%)] shadow-[0_20px_60px_-34px_rgba(15,23,42,0.35)]">
              <CardHeader className="border-b border-slate-200 pb-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 shadow-sm">
                      <CreditCard className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl text-slate-950">Ready to pay</CardTitle>
                      <CardDescription className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                        Choose a charge below to open payment options. Each card keeps the related identifiers visible so you can reconcile orders and event registrations quickly.
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className="w-fit border-slate-200 bg-white text-slate-700">
                    {transactionOptions.length} pending {transactionOptions.length === 1 ? "payment" : "payments"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {transactionOptions.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-200 bg-white/70 px-6 py-10 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                      <Receipt className="h-6 w-6" />
                    </div>
                    <p className="mt-4 text-lg font-semibold text-slate-900">No payment items are waiting right now.</p>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      New charges will appear here automatically when the club creates an order, fee, or event payment.
                    </p>
                  </div>
                ) : (
                  <div className={cn("grid gap-4", transactionOptions.length > 3 && "xl:max-h-[44rem] xl:overflow-y-auto xl:pr-1")}>
                    {transactionOptions.map((paymentOption: PaymentTransactionOption, index: number) => {
                      const totalAmount = paymentOption.total_amount ?? 0;
                      const paymentOutstandingAmount = paymentOption.outstanding_amount ?? totalAmount;
                      const isHighlighted =
                        paymentOption.transaction_id === highlightedTransactionId ||
                        paymentOption.order_id === highlightedOrderId ||
                        paymentOption.event_registration_id === highlightedEventRegistrationId;
                      const paymentTitle = paymentOption.type || `Payment ${index + 1}`;
                      const orderId = paymentOption.order_id;
                      const eventRegistrationId = paymentOption.event_registration_id;

                      return (
                        <div
                          key={paymentOption.transaction_id}
                          ref={isHighlighted ? highlightedPaymentRef : null}
                          className={cn(
                            "rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_16px_40px_-30px_rgba(15,23,42,0.35)] transition-all",
                            isHighlighted && "border-amber-300 bg-amber-50/50 ring-2 ring-amber-100",
                          )}
                        >
                          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge className="border-slate-200 bg-slate-50 text-slate-700">
                                  {paymentOption.type}
                                </Badge>
                                {paymentOutstandingAmount > 0 ? (
                                  <Badge className="border-amber-200 bg-amber-50 text-amber-700">Awaiting payment</Badge>
                                ) : (
                                  <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">Settled</Badge>
                                )}
                              </div>
                              <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                                <div>
                                  <h3 className="text-xl font-semibold text-slate-950">
                                    {paymentTitle === "ORDER" ? "Shop order" : paymentTitle}
                                  </h3>
                                  <p className="mt-1 text-sm leading-6 text-slate-500">
                                    Transaction amount outstanding for this payment target.
                                  </p>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900">
                                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Amount due</p>
                                  <p className="mt-1 text-2xl font-semibold">
                                    {formatAmount(paymentOutstandingAmount, data.currency)}
                                  </p>
                                </div>
                              </div>

                              <div className="mt-5 grid gap-3 md:grid-cols-2">
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Transaction ID</p>
                                  <div className="mt-2 flex items-center gap-2">
                                    <span className="min-w-0 break-all font-mono text-sm font-medium text-slate-900">
                                      {paymentOption.transaction_id}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleCopyPaymentValue(paymentOption.transaction_id, `transaction-${paymentOption.transaction_id}`)}
                                      className="h-7 w-7 shrink-0 p-0"
                                      title="Copy Transaction ID"
                                    >
                                      <Copy className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                  {copiedPaymentId === `transaction-${paymentOption.transaction_id}` ? (
                                    <p className="mt-1 text-[11px] font-medium text-slate-500">Copied</p>
                                  ) : null}
                                </div>

                                {orderId || eventRegistrationId ? (
                                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                                      {orderId ? "Order ID" : "Event Registration ID"}
                                    </p>
                                    <div className="mt-2 flex items-center gap-2">
                                      <span className="min-w-0 break-all font-mono text-sm font-medium text-slate-900">
                                        {orderId || eventRegistrationId}
                                      </span>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          handleCopyPaymentValue(
                                            orderId || eventRegistrationId || "",
                                            orderId ? `order-${paymentOption.transaction_id}` : `event-${paymentOption.transaction_id}`,
                                          )
                                        }
                                        className="h-7 w-7 shrink-0 p-0"
                                        title={orderId ? "Copy Order ID" : "Copy Event Registration ID"}
                                      >
                                        <Copy className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                    {copiedPaymentId === (orderId ? `order-${paymentOption.transaction_id}` : `event-${paymentOption.transaction_id}`) ? (
                                      <p className="mt-1 text-[11px] font-medium text-slate-500">Copied</p>
                                    ) : null}
                                  </div>
                                ) : null}
                              </div>
                            </div>

                            <div className="flex flex-col gap-2 lg:w-[180px]">
                              {(orderId || eventRegistrationId) ? (
                                <Button
                                  variant="outline"
                                  onClick={() => onViewPaymentTarget(paymentOption)}
                                  className="justify-between border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                >
                                  View target
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                              ) : null}
                              <Button
                                onClick={() => handlePayHereClick(paymentOption)}
                                disabled={paymentOutstandingAmount <= 0}
                                className="justify-between bg-slate-800 text-white hover:bg-slate-700"
                              >
                                {paymentOutstandingAmount > 0 ? "Pay now" : "Paid"}
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}

          <Card className="overflow-hidden border-0 bg-white shadow-[0_20px_60px_-34px_rgba(15,23,42,0.35)]">
            <CardHeader className="border-b border-slate-200 pb-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl text-slate-950">Transaction history</CardTitle>
                    <CardDescription className="mt-1 text-sm leading-6 text-slate-500">
                      Search, sort, and inspect your billing timeline. Expand any card to review lifecycle entries in detail.
                    </CardDescription>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {(["type", "status", "amount"] as const).map((column) => (
                    <Button
                      key={column}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleSort(column)}
                      className={cn(
                        "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                        sortColumn === column && "border-slate-700 bg-slate-700 text-white hover:bg-slate-700",
                      )}
                    >
                      Sort by {column}
                      {sortColumn === column ? (
                        sortDirection === "asc" ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
                      ) : null}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 p-6">
              {isUserTransactionsLoading ? (
                <div className="flex items-center justify-center py-16 text-slate-500">
                  <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                  Loading transactions...
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="relative max-w-xl flex-1">
                      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        value={transactionSearch}
                        onChange={(event) => setTransactionSearch(event.target.value)}
                        placeholder="Search transaction ID, type, status, amount, or lifecycle details"
                        className="h-12 rounded-2xl border-slate-200 bg-slate-50 pl-11 shadow-none"
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                      <Badge className="border-slate-200 bg-slate-50 text-slate-700">
                        {transactionItems.length} total
                      </Badge>
                      <Badge className="border-slate-200 bg-slate-50 text-slate-700">
                        {sortedTransactions.length} shown
                      </Badge>
                    </div>
                  </div>

                  {transactionItems.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-12 text-center">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-600 shadow-sm">
                        <Receipt className="h-6 w-6" />
                      </div>
                      <p className="mt-4 text-lg font-semibold text-slate-900">No transactions yet</p>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        Once you start paying fees, orders, or registrations, the history will appear here.
                      </p>
                    </div>
                  ) : sortedTransactions.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-12 text-center">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-600 shadow-sm">
                        <Search className="h-6 w-6" />
                      </div>
                      <p className="mt-4 text-lg font-semibold text-slate-900">No matching transactions</p>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        Try a different search term or clear the filters to see the full transaction list.
                      </p>
                    </div>
                  ) : (
                    <div className={cn("space-y-4", sortedTransactions.length > 6 && "max-h-[64rem] overflow-y-auto pr-1")}>
                      {sortedTransactions.map((tx: Transaction) => {
                        const lifecycleEntries = Object.entries(tx.lifecycle as Record<string, TransactionEntry>)
                          .sort(([a], [b]) => Number(b) - Number(a));

                        return (
                          <div
                            key={tx.transaction_id}
                            className="rounded-[1.75rem] border border-slate-200 bg-[linear-gradient(180deg,#fff_0%,#f8fafc_100%)] p-5 shadow-[0_16px_40px_-30px_rgba(15,23,42,0.22)]"
                          >
                            <button
                              type="button"
                              onClick={() => toggleRow(tx.transaction_id)}
                              className="flex w-full flex-col gap-4 text-left lg:flex-row lg:items-center lg:justify-between"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge className="border-slate-200 bg-white text-slate-700">{tx.type}</Badge>
                                  <Badge className={cn("border", statusBadgeClassName(tx.status))}>{tx.status}</Badge>
                                </div>
                                <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono text-sm font-medium text-slate-900">
                                        {tx.transaction_id}
                                      </span>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          navigator.clipboard.writeText(tx.transaction_id);
                                        }}
                                        className="h-7 w-7 p-0 text-slate-500 hover:bg-slate-100"
                                        title="Copy full Transaction ID"
                                      >
                                        <Copy className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                    <p className="mt-2 text-sm leading-6 text-slate-500">
                                      {lifecycleEntries.length} lifecycle {lifecycleEntries.length === 1 ? "entry" : "entries"} recorded for this transaction.
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <div className="text-left md:text-right">
                                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Amount</p>
                                      <p className="mt-1 text-2xl font-semibold text-slate-950">
                                        {formatAmount(tx.amount, data.currency)}
                                      </p>
                                    </div>
                                    <div className={cn("rounded-full border p-2 transition-transform", expandedRows[tx.transaction_id] ? "rotate-90 border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-500")}>
                                      <ChevronRight className="h-4 w-4" />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </button>

                            {expandedRows[tx.transaction_id] ? (
                              <div className="mt-5 border-t border-slate-200 pt-5">
                                <div className="grid gap-3">
                                  {lifecycleEntries.map(([timestamp, entry]: [string, TransactionEntry]) => (
                                    <div
                                      key={timestamp}
                                      className="grid gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 lg:grid-cols-[170px_120px_minmax(0,1fr)_140px_140px]"
                                    >
                                      <div className="flex items-start gap-2 text-sm text-slate-500">
                                        <Clock3 className="mt-0.5 h-4 w-4 shrink-0" />
                                        <span>
                                          {new Date(Number(timestamp)).toLocaleString("en-GB", {
                                            day: "2-digit",
                                            month: "2-digit",
                                            year: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                            hour12: true,
                                          })}
                                        </span>
                                      </div>
                                      <div>
                                        <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Type</p>
                                        <p className="mt-1 text-sm font-medium text-slate-900">{entry.type}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Description</p>
                                        <p className="mt-1 text-sm leading-6 text-slate-700">{entry.description}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Amount</p>
                                        <p
                                          className={cn(
                                            "mt-1 text-sm font-semibold",
                                            entry.type === "REFUND" || entry.type === "CANCELLATION"
                                              ? "text-rose-700"
                                              : entry.type === "SUBMISSION"
                                                ? "text-slate-700"
                                                : "text-emerald-700",
                                          )}
                                        >
                                          {entry.type === "SUBMISSION"
                                            ? "Created"
                                            : entry.type === "REFUND"
                                              ? `-${formatAmount(Math.abs(entry.amount), data.currency)}`
                                              : entry.type === "CANCELLATION"
                                                ? "N/A"
                                                : `+${formatAmount(entry.amount, data.currency)}`}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Payment type</p>
                                        <p className="mt-1 text-sm font-medium text-slate-900">{entry.payment_type ?? "N/A"}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </TabsContent>
  );
}