import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { TabsContent } from "@/components/ui/tabs";
import { 
  CheckCircle, 
  CreditCard, 
  FileText, 
  Loader2,
  ArrowUp,
  ArrowDown,
  Search,
  Receipt,
  Wallet,
  ChevronRight,
  Clock3,
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
  amount_paid?: number;
  outstanding_amount?: number;
  registration_id?: string;
  order_id?: string;
  event_id?: string;
  event_registration_id?: string;
  storage_id?: string;
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
  onViewRegistrationTarget: () => void;
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
  toggleRow,
  handlePayHereClick,
  onViewPaymentTarget,
  onViewRegistrationTarget,
}: PaymentsTabContentProps) {
  const [sortColumn, setSortColumn] = useState<'type' | 'status' | 'amount' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [transactionSearch, setTransactionSearch] = useState("");
  const outstandingBalanceRef = useRef<HTMLDivElement | null>(null);
  const highlightedPaymentRef = useRef<HTMLDivElement | null>(null);
  const outstandingAmount = bankDetails?.outstanding_amount ?? 0;
  const {
    data: transactions,
    isLoading: isUserTransactionsLoading,
  } = useFetchUserTransactions(clubAccountId, userId, isActive);

  const transactionItems = useMemo(() => {
    return Array.isArray(transactions?.transactions) ? transactions.transactions : [];
  }, [transactions?.transactions]);

  const transactionOptions = useMemo(() => {
    if (Array.isArray(bankDetails?.transaction_options) && bankDetails.transaction_options.length > 0) {
      return bankDetails.transaction_options;
    }

    return transactionItems
      .map((transaction: Transaction): PaymentTransactionOption | null => {
        const totalAmount = Number(transaction.amount) || 0;
        const outstandingAmount =
          typeof transaction.outstanding_amount === "number"
            ? transaction.outstanding_amount
            : Math.max(totalAmount - (Number(transaction.amount_paid) || 0), 0);

        if (!transaction.transaction_id || outstandingAmount <= 0) {
          return null;
        }

        return {
          transaction_id: transaction.transaction_id,
          type: transaction.type,
          outstanding_amount: outstandingAmount,
          total_amount: totalAmount,
          order_id: transaction.order_id,
          event_id: transaction.event_id,
          event_registration_id: transaction.event_registration_id,
          registration_id: transaction.registration_id,
          storage_id: transaction.storage_id,
        };
      })
      .filter(
        (
          paymentOption: PaymentTransactionOption | null
        ): paymentOption is PaymentTransactionOption => paymentOption !== null
      );
  }, [bankDetails?.transaction_options, transactionItems]);

  const hasFallbackOutstandingPayment = useMemo(() => {
    return outstandingAmount > 0 && transactionOptions.length === 0;
  }, [outstandingAmount, transactionOptions.length]);

  const visiblePaymentItemCount = transactionOptions.length + (hasFallbackOutstandingPayment ? 1 : 0);

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
    <TabsContent value="bank" className="mt-3 sm:mt-6">
      <div className="grid gap-3 sm:gap-5 xl:grid-cols-[320px_minmax(0,1fr)] xl:items-stretch xl:gap-6">
        <Card className="h-full overflow-hidden border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] text-slate-900 shadow-[0_24px_70px_-34px_rgba(15,23,42,0.22)]">
          <CardContent className="flex h-full flex-col space-y-4 p-3 sm:space-y-6 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-1.5 sm:space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Member Payments
                  </p>
                  <h2 className="text-xl font-semibold sm:text-2xl">Billing overview</h2>
                  <p className="text-sm leading-5 text-slate-500 sm:leading-6">
                    Review outstanding charges, pick a payment target, and trace every transaction from one place.
                  </p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 sm:h-14 sm:w-14">
                  <Wallet className="h-5 w-5 text-slate-700 sm:h-7 sm:w-7" />
                </div>
              </div>

              <div ref={outstandingBalanceRef} className="scroll-mt-24 rounded-3xl border border-slate-200 bg-white p-3.5 sm:p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Outstanding balance</p>
                <p className="mt-1.5 text-3xl font-semibold tracking-tight sm:mt-2 sm:text-4xl">
                  {formatAmount(outstandingAmount, data.currency)}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-1.5 sm:mt-4 sm:gap-2">
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
                    className="mt-4 h-10 w-full bg-slate-900 text-sm text-white hover:bg-slate-800 sm:mt-5"
                  >
                    Pay outstanding balance
                  </Button>
                ) : null}
              </div>

              <div className="mt-auto grid grid-cols-2 gap-2 sm:gap-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Paid</p>
                  <p className="mt-1 text-xl font-semibold sm:mt-2 sm:text-2xl">{paidTransactionsCount}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Pending</p>
                  <p className="mt-1 text-xl font-semibold sm:mt-2 sm:text-2xl">{pendingTransactionsCount}</p>
                </div>
                <div className="col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Total transaction value</p>
                  <p className="mt-1 text-xl font-semibold sm:mt-2 sm:text-2xl">{formatAmount(totalTransactionAmount, data.currency)}</p>
                </div>
              </div>
          </CardContent>
        </Card>

        <Card className="h-full overflow-hidden border-0 bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.08),_transparent_32%),linear-gradient(180deg,#fff_0%,#f8fafc_100%)] shadow-[0_20px_60px_-34px_rgba(15,23,42,0.35)]">
              <CardHeader className="border-b border-slate-200 px-3 pb-3 pt-3 sm:px-6 sm:pb-5 sm:pt-6">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between lg:gap-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 shadow-sm sm:h-14 sm:w-14">
                      <CreditCard className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-slate-950 sm:text-2xl">Ready to pay</CardTitle>
                      <CardDescription className="mt-1 max-w-2xl text-sm leading-5 text-slate-500 sm:leading-6">
                        Choose a charge below to open payment options for orders, fees, and event registrations.
                      </CardDescription>
                    </div>
                  </div>
                    <Badge className="w-fit border-slate-200 bg-white text-slate-700">
                    {visiblePaymentItemCount} pending {visiblePaymentItemCount === 1 ? "payment" : "payments"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-6">
                {visiblePaymentItemCount === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-200 bg-white/70 px-5 py-8 text-center sm:px-6 sm:py-10">
                    <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 sm:h-14 sm:w-14">
                      <Receipt className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    <p className="mt-4 text-lg font-semibold text-slate-900">No payment items are waiting right now.</p>
                    <p className="mt-2 text-sm leading-5 text-slate-500 sm:leading-6">
                      New charges will appear here automatically when the club creates an order, fee, or event payment.
                    </p>
                  </div>
                ) : (
                  <div
                    className={cn(
                      "grid gap-3 sm:gap-4",
                      "xl:max-h-[25rem] xl:overflow-y-auto xl:pr-1",
                    )}
                  >
                    {hasFallbackOutstandingPayment ? (
                      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-3.5 shadow-[0_16px_40px_-30px_rgba(15,23,42,0.35)] transition-all sm:p-5">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-5">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge className="border-slate-200 bg-slate-50 text-slate-700">
                                Registration fee
                              </Badge>
                              <Badge className="border-amber-200 bg-amber-50 text-amber-700">Awaiting payment</Badge>
                            </div>
                            <div className="mt-3 flex flex-col gap-2.5 md:mt-4 md:flex-row md:items-end md:justify-between md:gap-3">
                              <div>
                                <h3 className="text-lg font-semibold text-slate-950 sm:text-xl">
                                  Registration payment
                                </h3>
                                <p className="mt-1 text-sm leading-5 text-slate-500 sm:leading-6">
                                  Your registration fee is still outstanding and ready to be paid here.
                                </p>
                              </div>
                              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 sm:px-4 sm:py-3">
                                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Amount due</p>
                                <p className="mt-1 text-xl font-semibold sm:text-2xl">
                                  {formatAmount(outstandingAmount, data.currency)}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 lg:w-[180px]">
                            <Button
                              variant="outline"
                              onClick={onViewRegistrationTarget}
                              className="h-9 justify-between border-slate-200 bg-white text-sm text-slate-700 hover:bg-slate-50"
                            >
                              View target
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => handlePayHereClick()}
                              disabled={outstandingAmount <= 0}
                              className="h-9 justify-between bg-slate-800 text-sm text-white hover:bg-slate-700"
                            >
                              {outstandingAmount > 0 ? "Pay now" : "Paid"}
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : null}

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
                      const storageId = paymentOption.storage_id;

                      return (
                        <div
                          key={paymentOption.transaction_id}
                          ref={isHighlighted ? highlightedPaymentRef : null}
                          className={cn(
                            "rounded-[1.75rem] border border-slate-200 bg-white p-3.5 shadow-[0_16px_40px_-30px_rgba(15,23,42,0.35)] transition-all sm:p-5",
                            isHighlighted && "border-amber-300 bg-amber-50/50 ring-2 ring-amber-100",
                          )}
                        >
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-5">
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
                              <div className="mt-3 flex flex-col gap-2.5 md:mt-4 md:flex-row md:items-end md:justify-between md:gap-3">
                                <div>
                                  <h3 className="text-lg font-semibold text-slate-950 sm:text-xl">
                                    {paymentTitle === "ORDER" ? "Shop Purchase" : paymentTitle === "STORAGE" ? "Storage Purchase" : paymentTitle === "REGISTRATION" ? "Registration Fee" : paymentTitle}
                                  </h3>
                                  <p className="mt-1 text-sm leading-5 text-slate-500 sm:leading-6">
                                    Transaction amount outstanding for this payment target.
                                  </p>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-900 sm:px-4 sm:py-3">
                                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Amount due</p>
                                  <p className="mt-1 text-xl font-semibold sm:text-2xl">
                                    {formatAmount(paymentOutstandingAmount, data.currency)}
                                  </p>
                                </div>
                              </div>

                            </div>

                            <div className="flex flex-col gap-2 lg:w-[180px]">
                              {(orderId || eventRegistrationId || storageId) ? (
                                <Button
                                  variant="outline"
                                  onClick={() => onViewPaymentTarget(paymentOption)}
                                  className="h-9 justify-between border-slate-200 bg-white text-sm text-slate-700 hover:bg-slate-50"
                                >
                                  View target
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                              ) : null}
                              <Button
                                onClick={() => handlePayHereClick(paymentOption)}
                                disabled={paymentOutstandingAmount <= 0}
                                className="h-9 justify-between bg-slate-800 text-sm text-white hover:bg-slate-700"
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

        <Card className="overflow-hidden border-0 bg-white shadow-[0_20px_60px_-34px_rgba(15,23,42,0.35)] xl:col-span-2">
            <CardHeader className="border-b border-slate-200 px-3 pb-3 pt-3 sm:px-6 sm:pb-5 sm:pt-6">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between lg:gap-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 sm:h-14 sm:w-14">
                    <FileText className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-slate-950 sm:text-2xl">Transaction history</CardTitle>
                    <CardDescription className="mt-1 text-sm leading-5 text-slate-500 sm:leading-6">
                      Search, sort, and inspect your billing timeline. Expand any card to review lifecycle entries in detail.
                    </CardDescription>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  {(["type", "status", "amount"] as const).map((column) => (
                    <Button
                      key={column}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleSort(column)}
                      className={cn(
                        "h-8 border-slate-200 bg-white px-3 text-xs text-slate-600 hover:bg-slate-50 sm:h-9 sm:text-sm",
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
            <CardContent className="space-y-3 p-3 sm:space-y-5 sm:p-6">
              {isUserTransactionsLoading ? (
                <div className="flex items-center justify-center py-16 text-slate-500">
                  <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                  Loading transactions...
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
                    <div className="relative max-w-xl flex-1">
                      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        value={transactionSearch}
                        onChange={(event) => setTransactionSearch(event.target.value)}
                        placeholder="Search type, status, amount, or lifecycle details"
                        className="h-10 rounded-2xl border-slate-200 bg-slate-50 pl-10 text-sm shadow-none sm:h-12 sm:pl-11"
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 text-sm text-slate-500 sm:gap-2">
                      <Badge className="border-slate-200 bg-slate-50 text-slate-700">
                        {transactionItems.length} total
                      </Badge>
                      <Badge className="border-slate-200 bg-slate-50 text-slate-700">
                        {sortedTransactions.length} shown
                      </Badge>
                    </div>
                  </div>

                  {transactionItems.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 px-5 py-8 text-center sm:px-6 sm:py-12">
                      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-600 shadow-sm sm:h-14 sm:w-14">
                        <Receipt className="h-5 w-5 sm:h-6 sm:w-6" />
                      </div>
                      <p className="mt-4 text-lg font-semibold text-slate-900">No transactions yet</p>
                      <p className="mt-2 text-sm leading-5 text-slate-500 sm:leading-6">
                        Once you start paying fees, orders, or registrations, the history will appear here.
                      </p>
                    </div>
                  ) : sortedTransactions.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 px-5 py-8 text-center sm:px-6 sm:py-12">
                      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-600 shadow-sm sm:h-14 sm:w-14">
                        <Search className="h-5 w-5 sm:h-6 sm:w-6" />
                      </div>
                      <p className="mt-4 text-lg font-semibold text-slate-900">No matching transactions</p>
                      <p className="mt-2 text-sm leading-5 text-slate-500 sm:leading-6">
                        Try a different search term or clear the filters to see the full transaction list.
                      </p>
                    </div>
                  ) : (
                    <div className={cn("space-y-3 sm:space-y-4", sortedTransactions.length > 6 && "max-h-[64rem] overflow-y-auto pr-1")}>
                      {sortedTransactions.map((tx: Transaction) => {
                        const lifecycleEntries = Object.entries(tx.lifecycle as Record<string, TransactionEntry>)
                          .sort(([a], [b]) => Number(b) - Number(a));

                        return (
                          <div
                            key={tx.transaction_id}
                            className="rounded-[1.75rem] border border-slate-200 bg-[linear-gradient(180deg,#fff_0%,#f8fafc_100%)] p-3.5 shadow-[0_16px_40px_-30px_rgba(15,23,42,0.22)] sm:p-5"
                          >
                            <button
                              type="button"
                              onClick={() => toggleRow(tx.transaction_id)}
                              className="flex w-full flex-col gap-3 text-left lg:flex-row lg:items-center lg:justify-between lg:gap-4"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge className="border-slate-200 bg-white text-slate-700">{tx.type}</Badge>
                                  <Badge className={cn("border", statusBadgeClassName(tx.status))}>{tx.status}</Badge>
                                </div>
                                <div className="mt-3 flex flex-col gap-2.5 md:mt-4 md:flex-row md:items-end md:justify-between md:gap-3">
                                  <div>
                                    <p className="text-sm font-medium text-slate-900">
                                      {tx.type} payment activity
                                    </p>
                                    <p className="mt-1.5 text-sm leading-5 text-slate-500 sm:mt-2 sm:leading-6">
                                      {lifecycleEntries.length} lifecycle {lifecycleEntries.length === 1 ? "entry" : "entries"} recorded for this transaction.
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <div className="text-left md:text-right">
                                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Amount</p>
                                      <p className="mt-1 text-xl font-semibold text-slate-950 sm:text-2xl">
                                        {formatAmount(tx.amount, data.currency)}
                                      </p>
                                    </div>
                                    <div className={cn("rounded-full border p-1.5 transition-transform sm:p-2", expandedRows[tx.transaction_id] ? "rotate-90 border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-500")}>
                                      <ChevronRight className="h-4 w-4" />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </button>

                            {expandedRows[tx.transaction_id] ? (
                              <div className="mt-3 border-t border-slate-200 pt-3 sm:mt-5 sm:pt-5">
                                <div className="grid gap-2.5 sm:gap-3">
                                  {lifecycleEntries.map(([timestamp, entry]: [string, TransactionEntry]) => (
                                    <div
                                      key={timestamp}
                                      className="grid gap-2.5 rounded-2xl border border-slate-200 bg-white px-3 py-3 sm:gap-3 sm:px-4 sm:py-4 lg:grid-cols-[170px_120px_minmax(0,1fr)_140px_140px]"
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
                                        <p className="mt-1 text-sm leading-5 text-slate-700 sm:leading-6">{entry.description}</p>
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
    </TabsContent>
  );
}