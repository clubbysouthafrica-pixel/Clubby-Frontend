import { useContext, useEffect, useMemo, useState } from "react";
import { ClubContext, ClubContextType } from "@/context/ClubContext";
import { useMcsBillingReportingQuery } from "@/queries/admin/useReporting";
import { useGetClubbyCheckoutUrlQuery } from "@/queries/admin/payfast";
import ClubUsageAndCharges from "@/components/admin/billing-and-usage/club-usage-and-charges-report";
import { formatAmount } from "@/data/currencies";
import { ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MonthlyPaymentOption {
  month: string;
  amount: number;
  isPaid: boolean;
  isPayable: boolean;
}

interface BillingPaymentChoice {
  value: string;
  label: string;
  amount: number;
  month?: string;
  isPaid: boolean;
  isPayable: boolean;
  isAllOutstanding?: boolean;
}

const ALL_OUTSTANDING_VALUE = "__all_outstanding__";

function getCurrentYearMonth() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
}

export default function BillingPage() {
  const { club } = useContext(ClubContext) as ClubContextType;
  const [selectedSeason, setSelectedSeason] = useState<string>("current");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const currentYearMonth = getCurrentYearMonth();

  const seasonToFetch =
    selectedSeason === "current" ? undefined : parseInt(selectedSeason);

  const { data, isLoading } = useMcsBillingReportingQuery(
    club?.club_account_id as string,
    seasonToFetch,
  );
  const [isPayfastLoading, setIsPayfastLoading] = useState(false);

  const availableSeasons = club?.season_cycle
    ? Array.from({ length: club.season_cycle - 1 }, (_, i) => ({
        value: (club.season_cycle - i - 1).toString(),
        label: `Season ${club.season_cycle - i - 1}`,
      }))
    : [];

  const hasPreviousSeasons = availableSeasons.length > 0;
  const monthlyPaymentOptions = useMemo<MonthlyPaymentOption[]>(() => {
    const overallMonthData = data?.report?.overall_month_data ?? {};
    const paymentStatuses: Array<{ month: string; month_paid: boolean }> =
      data?.report?.Payments ?? [];
    const paymentStatusByMonth = new Map<string, boolean>(
      paymentStatuses.map((payment) => [payment.month, Boolean(payment.month_paid)]),
    );
    const monthKeys = Array.from(
      new Set([
        ...Object.keys(overallMonthData),
        ...paymentStatuses.map((payment) => payment.month),
      ]),
    ).sort((left, right) => right.localeCompare(left));

    return monthKeys.map<MonthlyPaymentOption>((month) => {
      const monthTotals = overallMonthData[month] as { total_amount?: number } | undefined;

      return {
        month,
        amount: monthTotals?.total_amount ?? 0,
        isPaid: paymentStatusByMonth.get(month) ?? false,
        isPayable: month < currentYearMonth,
      };
    });
  }, [currentYearMonth, data]);
  const payableMonthlyPaymentOptions = useMemo(
    () => monthlyPaymentOptions.filter(({ isPaid, isPayable }) => !isPaid && isPayable),
    [monthlyPaymentOptions],
  );
  const payableOutstandingAmount = useMemo(
    () => payableMonthlyPaymentOptions.reduce((sum, option) => sum + option.amount, 0),
    [payableMonthlyPaymentOptions],
  );
  const hasCurrentMonthOutstanding = useMemo(
    () =>
      monthlyPaymentOptions.some(
        ({ month, isPaid }) => month === currentYearMonth && !isPaid,
      ),
    [currentYearMonth, monthlyPaymentOptions],
  );
  const hasAllOutstandingOption =
    payableOutstandingAmount > 0 &&
    payableMonthlyPaymentOptions.length > 1;
  const paymentChoices = useMemo<BillingPaymentChoice[]>(() => {
    const monthChoices = payableMonthlyPaymentOptions.map((option) => ({
      value: option.month,
      label: `${option.month} - ${formatAmount(option.amount, club?.currency)} ${option.isPaid ? "(Paid)" : "(Unpaid)"}`,
      amount: option.amount,
      month: option.month,
      isPaid: option.isPaid,
      isPayable: option.isPayable,
      isAllOutstanding: false,
    }));

    if (!hasAllOutstandingOption) {
      return monthChoices;
    }

    return [
      {
        value: ALL_OUTSTANDING_VALUE,
        label: `All outstanding previous months - ${formatAmount(payableOutstandingAmount, club?.currency)}`,
        amount: payableOutstandingAmount,
        isPaid: false,
        isPayable: true,
        isAllOutstanding: true,
      },
      ...monthChoices,
    ];
  }, [club?.currency, hasAllOutstandingOption, payableMonthlyPaymentOptions, payableOutstandingAmount]);
  const selectedPaymentChoice = useMemo(
    () =>
      paymentChoices.find(({ value }) => value === selectedMonth) ??
      paymentChoices.find(({ isAllOutstanding }) => isAllOutstanding) ??
      paymentChoices.find(({ isPaid, isPayable }) => !isPaid && isPayable),
    [paymentChoices, selectedMonth],
  );
  const { refetch: refetchClubbyCheckoutUrl } = useGetClubbyCheckoutUrlQuery(
    club?.club_account_id,
    selectedPaymentChoice?.isAllOutstanding
      ? undefined
      : selectedPaymentChoice?.month,
    selectedPaymentChoice?.isAllOutstanding,
  );
  const showPayNow = payableMonthlyPaymentOptions.length > 0;

  useEffect(() => {
    if (!paymentChoices.length) {
      setSelectedMonth("");
      return;
    }

    if (!paymentChoices.some(({ value }) => value === selectedMonth)) {
      setSelectedMonth(
        paymentChoices.find(({ isAllOutstanding }) => isAllOutstanding)?.value ??
          payableMonthlyPaymentOptions[0]?.month ??
          "",
      );
    }
  }, [payableMonthlyPaymentOptions, paymentChoices, selectedMonth]);

  const handlePayNowClick = async () => {
    if (!club?.club_account_id || !selectedPaymentChoice) {
      return;
    }

    if (selectedPaymentChoice.isPaid) {
      toast.info("This month is already paid and cannot be paid with PayFast again.");
      return;
    }

    if (!selectedPaymentChoice.isPayable) {
      toast.info("Only previous months can be paid. The current month becomes payable next month.");
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
      <div className="p-5 min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  return (
    <div className="p-5">
      <div className="mb-4">
        {selectedSeason === "current" ? (
          <h1 className="text-3xl font-bold tracking-tight">
            You Owe Clubby:{" "}
            {formatAmount(payableOutstandingAmount, club?.currency)}
          </h1>
        ) : (
          <h1 className="text-3xl font-bold tracking-tight">
            Season: {selectedSeason}
          </h1>
        )}
        <p className="text-muted-foreground">
          Manage your club's billing and usage
        </p>
      </div>
      {showPayNow && (
        <div className="mb-5 space-y-3">
          {paymentChoices.length > 0 && (
            <div className="max-w-xs">
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-full bg-white">
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
          {selectedSeason === "current" && hasCurrentMonthOutstanding && (
            <p className="text-sm text-muted-foreground">
              The current month is visible in the usage report but can only be paid from next month onward.
            </p>
          )}
          <button
            type="button"
            onClick={handlePayNowClick}
            disabled={!selectedPaymentChoice || isPayfastLoading}
            className="flex w-full items-center justify-between rounded-2xl border border-gray-200 bg-white px-5 py-4 text-left shadow-md transition-all duration-200 hover:border-[#59b9e6] hover:shadow-lg cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-slate-300 bg-white transition-colors">
                <div className="h-6 w-6 rounded-full bg-black" />
              </div>

              <div>
                <p className="text-xl font-semibold text-gray-950 sm:text-2xl">
                  {isPayfastLoading
                    ? "Redirecting..."
                    : `Pay Now (${formatAmount(selectedPaymentChoice?.amount ?? 0, club?.currency)})`}
                </p>
                <p className="text-sm text-muted-foreground">
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
                <span className="text-[2rem] font-light tracking-[-0.08em] text-[#0072bc] sm:text-[2.6rem]">
                  payfast
                </span>
                <span className="pl-1 text-[0.85rem] font-normal tracking-[-0.04em] text-[#0072bc] sm:text-[1.1rem]">
                  by network
                </span>
              </div>
              <ChevronRight
                className="h-9 w-9 text-[#ef476f] sm:h-12 sm:w-12"
                strokeWidth={2.5}
              />
            </div>
          </button>
        </div>
      )}
      {!showPayNow && selectedSeason === "current" && hasCurrentMonthOutstanding && (
        <p className="mb-5 text-sm text-muted-foreground">
          Only previous unpaid months can be paid. The current month will become payable next month.
        </p>
      )}
      {!showPayNow && monthlyPaymentOptions.length > 0 && !hasCurrentMonthOutstanding && (
        <p className="mb-5 text-sm text-muted-foreground">
          All listed months are already marked as paid. PayFast is only available for unpaid months.
        </p>
      )}
      {hasPreviousSeasons && (
        <div className="flex justify-center mb-2 pb-2">
          <div className="w-full max-w-xs">
            <Select value={selectedSeason} onValueChange={setSelectedSeason}>
              <SelectTrigger className="w-full">
                <div className="flex-1 text-center">
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent className="text-center">
                <SelectItem value="current" className="text-center">
                  Current Season
                </SelectItem>
                {availableSeasons.map((season) => (
                  <SelectItem
                    key={season.value}
                    value={season.value}
                    className="text-center"
                  >
                    {season.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
      {isLoading || !data ? (
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="@container/main flex flex-1 flex-col gap-1">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-2">
            <ClubUsageAndCharges
              data={data.report ?? {}}
              currency={club?.currency ?? "ZAR"}
              selectedMonth={selectedMonth}
              onMonthSelect={setSelectedMonth}
              clubName={club?.club_name}
            />
          </div>
        </div>
      )}
    </div>
  );
}
