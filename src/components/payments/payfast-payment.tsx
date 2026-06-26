import { Button } from "@/components/ui/button";
import { CardDescription } from "@/components/ui/card";
import { Loader2, CreditCard, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useFetchPayFastCheckoutUrlQuery } from "@/queries/payfast";
import { toast } from "sonner";

type PayfastResponse = {
  payment_url?: string;
};

interface PayFastPaymentProps {
  clubAccountId: string;
  outstandingAmount: number;
  userId?: string;
  transactionId?: string;
  orderId?: string;
  eventId?: string;
  eventRegistrationId?: string;
  showHeader?: boolean;
  buttonVariant?: "default" | "logo";
  isSelected?: boolean;
  onSelectedChange?: (isSelected: boolean) => void;
}

export function PayFastPayment({
  clubAccountId,
  outstandingAmount,
  userId,
  transactionId,
  orderId,
  eventId,
  eventRegistrationId,
  showHeader = true,
  buttonVariant = "default",
}: PayFastPaymentProps) {
  const [isPayfastLoading, setIsPayfastLoading] = useState(false);

  const { data: payfastData, refetch: refetchPayfast } =
    useFetchPayFastCheckoutUrlQuery(clubAccountId, {
      userId,
      transactionId,
      orderId,
      eventId,
      eventRegistrationId,
    });

  const handlePayfastClick = async () => {
    setIsPayfastLoading(true);
    try {
      let url: string | undefined = payfastData?.payment_url;
      if (!url) {
        const result = await refetchPayfast();
        const refreshed = (result as { data?: PayfastResponse }).data;
        url = refreshed?.payment_url;
      }

      if (url) {
        window.location.href = url;
      } else {
        toast.error("Failed to redirect to payment page. Please try again later.");
        setIsPayfastLoading(false);
      }
    } catch {
      toast.error("Failed to start online payment. Please try again.");
      setIsPayfastLoading(false);
    }
  };

  const isLogoButton = buttonVariant === "logo";

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      {showHeader && (
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold">Pay Online with PayFast</h3>
          <CardDescription>
            Securely pay your outstanding amount using credit card, debit card, or instant EFT
          </CardDescription>
        </div>
      )}
      {isLogoButton ? (
        <button
          type="button"
          onClick={() => void handlePayfastClick()}
          disabled={outstandingAmount === 0 || isPayfastLoading}
          className={`flex w-full items-center justify-between rounded-2xl border bg-white px-5 py-4 text-left shadow-md transition-all duration-200 border-gray-200 hover:border-[#59b9e6] hover:shadow-lg ${
            outstandingAmount === 0 ? "cursor-not-allowed opacity-60" : "cursor-pointer"
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-slate-300 bg-white transition-colors">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-black text-white">
                {isPayfastLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
              </div>
            </div>

            <div>
              <p className="text-xl font-semibold text-gray-950 sm:text-2xl">
                {isPayfastLoading ? "Redirecting..." : "Pay with PayFast"}
              </p>
              <p className="text-sm text-muted-foreground">
                Secure online payment via card, instant EFT, or wallet.
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
            <ChevronRight className="h-9 w-9 text-[#ef476f] sm:h-12 sm:w-12" strokeWidth={2.5} />
          </div>
        </button>
      ) : (
        <Button
          onClick={() => void handlePayfastClick()}
          disabled={outstandingAmount === 0 || isPayfastLoading}
          size="lg"
          className="bg-gradient-to-r from-slate-700 to-slate-900 hover:from-slate-800 hover:to-black text-white font-semibold px-8 py-6 text-base shadow-lg hover:shadow-xl transition-all duration-200"
        >
          {isPayfastLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Redirecting...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-5 w-5" />
              Pay with PayFast
            </>
          )}
        </Button>
      )}
    </div>
  );
}
