import { useContext, useEffect, useMemo, useState } from "react";
import { ClubContext, ClubContextType } from "@/context/ClubContext";
import { useMcsBillingReportingQuery } from "@/queries/admin/useReporting";
import { useGetClubbyCheckoutUrlQuery } from "@/queries/admin/payfast";
import ClubUsageAndCharges from "@/components/admin/billing-and-usage/club-usage-and-charges-report";
import { formatAmount } from "@/data/currencies";
import {
  BarChart3,
  ChevronRight,
  CreditCard,
  Loader2,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSaveCardUrl } from "@/services/payfast-api/save-card";
import { removeCard } from "@/services/payfast-api/remove-card";

const PAYNOW_ENABLED = false;

interface MonthlyPaymentOption {
  month: string;
  amount: number;
  isPaid: boolean;
}

interface PaymentStatusRecord {
  month: string;
  month_paid: boolean;
  outstanding_amount?: number;
}

interface BillingPaymentChoice {
  value: string;
  label: string;
  amount: number;
  month?: string;
  isPaid: boolean;
  isAllOutstanding?: boolean;
}

const ALL_OUTSTANDING_VALUE = "__all_outstanding__";

export default function BillingPage() {
  const { club } = useContext(ClubContext) as ClubContextType;
  const [selectedSeason, setSelectedSeason] = useState<string>("current");
  const [selectedMonth, setSelectedMonth] = useState<string>("");

  const seasonToFetch =
    selectedSeason === "current" ? undefined : parseInt(selectedSeason);

  const { data, isLoading } = useMcsBillingReportingQuery(
    club?.club_account_id as string,
    seasonToFetch,
  );
  const [isPayfastLoading, setIsPayfastLoading] = useState(false);
  const [showSaveCardDialog, setShowSaveCardDialog] = useState(false);
  const [saveCardFirstName, setSaveCardFirstName] = useState("");
  const [saveCardSurname, setSaveCardSurname] = useState("");
  const [saveCardEmail, setSaveCardEmail] = useState("");
  const [isSaveCardLoading, setIsSaveCardLoading] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isCancelLoading, setIsCancelLoading] = useState(false);

  const handleRemoveCard = async () => {
    if (!club?.club_account_id) return;
    setIsCancelLoading(true);
    try {
      await removeCard({ club_account_id: club.club_account_id });
      toast.success("Subscription cancelled and card removed.");
      setShowCancelDialog(false);
      window.location.reload();
    } catch {
      toast.error("Failed to remove card. Please try again.");
    } finally {
      setIsCancelLoading(false);
    }
  };

  const handleSaveCard = async () => {
    if (!saveCardFirstName.trim() || !saveCardSurname.trim() || !saveCardEmail.includes("@")) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setIsSaveCardLoading(true);
    try {
      const result = await getSaveCardUrl({
        club_account_id: club?.club_account_id ?? "",
        first_name: saveCardFirstName.trim(),
        surname: saveCardSurname.trim(),
        email: saveCardEmail.trim(),
      });
      if (result?.redirectUrl) {
        window.location.href = result.redirectUrl;
      } else {
        toast.error("An error occurred. Please try again.");
        setIsSaveCardLoading(false);
      }
    } catch {
      toast.error("An error occurred. Please try again.");
      setIsSaveCardLoading(false);
    }
  };

  const availableSeasons = club?.season_cycle
    ? Array.from({ length: club.season_cycle - 1 }, (_, i) => ({
        value: (club.season_cycle - i - 1).toString(),
        label: `Season ${club.season_cycle - i - 1}`,
      }))
    : [];

  const hasPreviousSeasons = availableSeasons.length > 0;
  const monthlyPaymentOptions = useMemo<MonthlyPaymentOption[]>(() => {
    const overallMonthData = data?.report?.overall_month_data ?? {};
    const paymentStatuses: PaymentStatusRecord[] =
      data?.report?.Payments ?? [];
    const paymentStatusByMonth = new Map<string, PaymentStatusRecord>(
      paymentStatuses.map((payment) => [payment.month, payment]),
    );
    const monthKeys = Array.from(
      new Set([
        ...Object.keys(overallMonthData),
        ...paymentStatuses.map((payment) => payment.month),
      ]),
    ).sort((left, right) => right.localeCompare(left));

    return monthKeys.map<MonthlyPaymentOption>((month) => {
      const monthTotals = overallMonthData[month] as
        | { total_amount?: number; outstanding_amount?: number }
        | undefined;
      const paymentStatus = paymentStatusByMonth.get(month);

      return {
        month,
        amount:
          paymentStatus?.outstanding_amount ??
          monthTotals?.outstanding_amount ??
          monthTotals?.total_amount ??
          0,
        isPaid: Boolean(paymentStatus?.month_paid),
      };
    });
  }, [data]);
  const payableMonthlyPaymentOptions = useMemo(
    () => monthlyPaymentOptions.filter(({ isPaid }) => !isPaid),
    [monthlyPaymentOptions],
  );
  const totalOutstandingAmount = data?.report?.total_outstanding_amount ?? 0;
  const hasAllOutstandingOption =
    totalOutstandingAmount > 0 &&
    payableMonthlyPaymentOptions.length > 1;
  const paymentChoices = useMemo<BillingPaymentChoice[]>(() => {
    const monthChoices = payableMonthlyPaymentOptions.map((option) => ({
      value: option.month,
      label: `${option.month} - ${formatAmount(option.amount, club?.currency)} ${option.isPaid ? "(Paid)" : "(Unpaid)"}`,
      amount: option.amount,
      month: option.month,
      isPaid: option.isPaid,
      isAllOutstanding: false,
    }));

    if (!hasAllOutstandingOption) {
      return monthChoices;
    }

    return [
      {
        value: ALL_OUTSTANDING_VALUE,
        label: `All outstanding months - ${formatAmount(totalOutstandingAmount, club?.currency)}`,
        amount: totalOutstandingAmount,
        isPaid: false,
        isAllOutstanding: true,
      },
      ...monthChoices,
    ];
  }, [club?.currency, hasAllOutstandingOption, payableMonthlyPaymentOptions, totalOutstandingAmount]);
  const oldestOutstandingPaymentChoice = useMemo(
    () => [...paymentChoices].reverse().find(({ isPaid, isAllOutstanding }) => !isPaid && !isAllOutstanding),
    [paymentChoices],
  );
  const selectedPaymentChoice = useMemo(
    () =>
      paymentChoices.find(({ value }) => value === selectedMonth) ??
      oldestOutstandingPaymentChoice ??
      paymentChoices.find(({ isAllOutstanding }) => isAllOutstanding),
    [oldestOutstandingPaymentChoice, paymentChoices, selectedMonth],
  );
  const { refetch: refetchClubbyCheckoutUrl } = useGetClubbyCheckoutUrlQuery(
    club?.club_account_id,
    undefined,
    selectedPaymentChoice?.isAllOutstanding
      ? undefined
      : selectedPaymentChoice?.month,
    selectedPaymentChoice?.isAllOutstanding,
  );
  const showPayNow = payableMonthlyPaymentOptions.length > 0;
  const summaryCards = [
    {
      label: "Total owed to Clubby",
      value: formatAmount(totalOutstandingAmount, club?.currency),
      icon: Wallet,
      tone: "from-amber-400/20 via-amber-300/10 to-transparent",
    },
    {
      label: "Unpaid months",
      value: String(payableMonthlyPaymentOptions.length),
      icon: CreditCard,
      tone: "from-sky-400/20 via-sky-300/10 to-transparent",
    }
  ];

  useEffect(() => {
    if (!paymentChoices.length) {
      setSelectedMonth("");
      return;
    }

    if (!paymentChoices.some(({ value }) => value === selectedMonth)) {
      setSelectedMonth(
        oldestOutstandingPaymentChoice?.value ??
          paymentChoices.find(({ isAllOutstanding }) => isAllOutstanding)?.value ??
          payableMonthlyPaymentOptions[payableMonthlyPaymentOptions.length - 1]?.month ??
          "",
      );
    }
  }, [oldestOutstandingPaymentChoice, payableMonthlyPaymentOptions, paymentChoices, selectedMonth]);

  const handlePayNowClick = async () => {
    if (!club?.club_account_id || !selectedPaymentChoice) {
      return;
    }

    if (selectedPaymentChoice.isPaid) {
      toast.info("This month is already paid and cannot be paid with PayFast again.");
      return;
    }

    setIsPayfastLoading(true);

    try {
      const result = await refetchClubbyCheckoutUrl();
      const paymentUrl = (result.data as { payment_url?: string } | undefined)
        ?.payment_url;

      if (paymentUrl) {
        window.location.href = paymentUrl;
        return;
      }

      toast.error("Failed to redirect to payment page. Please try again later.");
    } catch {
      toast.error("Failed to start online payment. Please try again.");
    } finally {
      setIsPayfastLoading(false);
    }
  };

  if (isLoading || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(214,211,209,0.55),_transparent_32%),linear-gradient(180deg,_#e7e5e4_0%,_#f5f5f4_40%,_#fafaf9_100%)] px-6">
        <div className="flex flex-col items-center gap-4 rounded-[24px] border border-stone-300/70 bg-white/90 px-8 py-10 text-zinc-900 shadow-xl backdrop-blur">
          <Loader2 className="h-10 w-10 animate-spin text-zinc-500" />
          <p className="text-lg font-medium text-zinc-700">
            Loading billing dashboard...
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {club?.payfast_token === false && (
        <div className="px-2 pt-2.5 sm:px-3 md:px-4 xl:px-5 2xl:px-6">
          <div className="flex items-center gap-4 rounded-[18px] border border-orange-300 bg-orange-50 px-4 py-3.5 shadow-sm">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 border border-orange-200">
              <CreditCard className="h-4 w-4 text-orange-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-orange-900">Action required: Set up your card</p>
              <p className="text-xs text-orange-700">
                Save your card details to enable automatic subscription billing.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowSaveCardDialog(true)}
              className="ml-auto shrink-0 rounded-full bg-orange-500 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-orange-600 transition-colors"
            >
              Setup card
            </button>
          </div>
        </div>
      )}
      <div className="flex w-full max-w-none flex-col gap-2.5 px-2 py-2.5 sm:px-3 md:px-4 md:py-3 xl:px-5 2xl:px-6">
        <section className="relative overflow-hidden rounded-[22px] border border-slate-200 bg-white px-4 py-3.5 text-zinc-900 shadow-sm md:px-5 md:py-3.5">
          <div className="hidden" />
          <div className="relative flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white/70 px-2.5 py-1 text-[11px] text-zinc-600 backdrop-blur">
                <BarChart3 className="h-3.5 w-3.5 text-zinc-500" />
                Billing overview
              </div>
              <h1 className="text-xl font-semibold tracking-tight md:text-3xl">
                {selectedSeason === "current"
                  ? "Clubby billing and monthly charges"
                  : `Billing history for Season ${selectedSeason}`}
              </h1>
              <p className="mt-2 max-w-2xl text-[11px] leading-4 text-zinc-600 md:text-xs">
                Review monthly charges, track outstanding balances, and launch Clubby payments without leaving the reporting workflow.
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
              {club?.payfast_token && (
                <Button
                  type="button"
                  onClick={() => setShowCancelDialog(true)}
                  className="h-8 rounded-full border border-red-300 bg-white px-3.5 text-xs text-red-600 hover:bg-red-50"
                >
                  <CreditCard className="mr-1.5 h-3.5 w-3.5" />
                  Cancel subscription
                </Button>
              )}
              {PAYNOW_ENABLED && (
                <Button
                  type="button"
                  onClick={handlePayNowClick}
                  disabled={!showPayNow || !selectedPaymentChoice || isPayfastLoading}
                  className="h-8 rounded-full border border-stone-300 bg-white px-3.5 text-xs text-zinc-800 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPayfastLoading ? "Redirecting..." : "Open PayFast"}
                </Button>
              )}
            </div>
          </div>

          <div className="relative mt-2.5 grid gap-2 md:grid-cols-2">
            {summaryCards.map(({ label, value, icon: Icon, tone }) => (
              <div
                key={label}
                className="rounded-[18px] border border-stone-300/70 bg-white/75 p-2.5 backdrop-blur"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-400">
                      {label}
                    </p>
                    <p className="mt-1 text-lg font-semibold text-zinc-900">{value}</p>
                  </div>
                  <div className={`inline-flex shrink-0 rounded-2xl bg-gradient-to-br p-2 ${tone}`}>
                    <Icon className="h-3.5 w-3.5 text-zinc-700" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {PAYNOW_ENABLED && (
          <section className="order-2 rounded-[22px] border border-slate-200/70 bg-white/90 p-2 shadow-[0_16px_36px_rgba(15,23,42,0.07)] backdrop-blur md:p-2.5">
            <div className="rounded-[18px] border border-slate-200/70 bg-slate-50/90 p-1.5 backdrop-blur">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap gap-2">
                  {paymentChoices.length > 0 && (
                    <div className="space-y-1">
                      <div className="pl-1">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                          Choose a month to pay
                        </p>
                        <p className="text-xs text-slate-500">
                          Use this selector to switch between outstanding months or pay all outstanding months.
                        </p>
                      </div>
                      <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                        <SelectTrigger className="h-8 min-w-[260px] rounded-full bg-white text-xs">
                          <SelectValue placeholder="Select payment option" />
                        </SelectTrigger>
                        <SelectContent>
                          {paymentChoices.map(({ value, label, isPaid, isAllOutstanding }) => (
                            <SelectItem
                              key={value}
                              value={value}
                              disabled={isPaid && !isAllOutstanding}
                            >
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500">
                  {selectedPaymentChoice ? (
                    <span>
                      {selectedPaymentChoice.isAllOutstanding
                        ? `Pay all outstanding months for ${formatAmount(selectedPaymentChoice.amount, club?.currency)}`
                        : `Pay ${selectedPaymentChoice.month} for ${formatAmount(selectedPaymentChoice.amount, club?.currency)}`}
                    </span>
                  ) : (
                    <span>No unpaid months available</span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2.5 px-1 pb-1 pt-2 md:px-1.5 md:pb-1.5">
              {showPayNow ? (
                <button
                  type="button"
                  onClick={handlePayNowClick}
                  disabled={!selectedPaymentChoice || isPayfastLoading}
                  className="flex w-full items-center justify-between rounded-[18px] border border-slate-200/70 bg-white px-4 py-3 text-left shadow-sm transition-all duration-200 hover:border-[#59b9e6] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-slate-300 bg-white transition-colors">
                      <div className="h-6 w-6 rounded-full bg-black" />
                    </div>

                    <div>
                      <p className="text-lg font-semibold text-gray-950 sm:text-xl">
                        {isPayfastLoading
                          ? "Redirecting..."
                          : `Pay Now (${formatAmount(selectedPaymentChoice?.amount ?? 0, club?.currency)})`}
                      </p>
                      <p className="text-xs text-muted-foreground sm:text-sm">
                        {selectedPaymentChoice
                          ? selectedPaymentChoice.isAllOutstanding
                            ? `Pay all outstanding months with PayFast for ${formatAmount(selectedPaymentChoice.amount, club?.currency)}.`
                            : `Pay ${selectedPaymentChoice.month} with PayFast for ${formatAmount(selectedPaymentChoice.amount, club?.currency)}.`
                          : "Pay your outstanding Clubby balance with PayFast."}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pl-4">
                    <div className="flex flex-col items-start leading-none">
                      <span className="text-[1.7rem] font-light tracking-[-0.08em] text-[#0072bc] sm:text-[2.2rem]">
                        payfast
                      </span>
                      <span className="pl-1 text-[0.75rem] font-normal tracking-[-0.04em] text-[#0072bc] sm:text-[0.95rem]">
                        by network
                      </span>
                    </div>
                    <ChevronRight
                      className="h-8 w-8 text-[#ef476f] sm:h-10 sm:w-10"
                      strokeWidth={2.5}
                    />
                  </div>
                </button>
              ) : monthlyPaymentOptions.length > 0 ? (
                <div className="rounded-[20px] border border-slate-200/70 bg-white p-4 text-sm text-slate-500 shadow-sm">
                  All listed months are already marked as paid. PayFast is only available for unpaid months.
                </div>
              ) : null}
            </div>
          </section>
        )}

        <section className="order-2">
          <ClubUsageAndCharges
            data={data.report ?? {}}
            currency={club?.currency ?? "ZAR"}
            selectedMonth={selectedMonth}
            onMonthSelect={setSelectedMonth}
            clubName={club?.club_name}
          />
        </section>
      </div>

      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel subscription</DialogTitle>
            <DialogDescription>
              This will remove your saved card and cancel your Clubby subscription. You will no longer be billed automatically. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)} disabled={isCancelLoading}>
              Keep subscription
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleRemoveCard()}
              disabled={isCancelLoading}
            >
              {isCancelLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Cancel subscription"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSaveCardDialog} onOpenChange={setShowSaveCardDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save card</DialogTitle>
            <DialogDescription>
              Enter your details to securely save a card via PayFast.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="save-card-first-name">First name</Label>
              <Input
                id="save-card-first-name"
                value={saveCardFirstName}
                onChange={(e) => setSaveCardFirstName(e.target.value)}
                placeholder="First name"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="save-card-surname">Surname</Label>
              <Input
                id="save-card-surname"
                value={saveCardSurname}
                onChange={(e) => setSaveCardSurname(e.target.value)}
                placeholder="Surname"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="save-card-email">Email</Label>
              <Input
                id="save-card-email"
                type="email"
                value={saveCardEmail}
                onChange={(e) => setSaveCardEmail(e.target.value)}
                placeholder="email@example.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveCardDialog(false)} disabled={isSaveCardLoading}>
              Cancel
            </Button>
            <Button onClick={handleSaveCard} disabled={isSaveCardLoading}>
              {isSaveCardLoading ? "Redirecting..." : "Continue"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
