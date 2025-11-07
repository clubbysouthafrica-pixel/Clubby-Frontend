import { Button } from "@/components/ui/button";
import { CardDescription } from "@/components/ui/card";
import { Loader2, CreditCard } from "lucide-react";
import { useState } from "react";
import { useFetchPayFastCheckoutUrlQuery } from "@/queries/payfast";
import { toast } from "sonner";

type PayfastResponse = {
  payment_url?: string;
};

interface PayFastPaymentProps {
  clubAccountId: string;
  outstandingAmount: number;
}

export function PayFastPayment({ clubAccountId, outstandingAmount }: PayFastPaymentProps) {
  const [isPayfastLoading, setIsPayfastLoading] = useState(false);
  
  const { data: payfastData, refetch: refetchPayfast } =
    useFetchPayFastCheckoutUrlQuery(clubAccountId);

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

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Pay Online with PayFast</h3>
        <CardDescription>
          Securely pay your outstanding amount using credit card, debit card, or instant EFT
        </CardDescription>
      </div>
      <Button
        onClick={handlePayfastClick}
        disabled={outstandingAmount === 0 || isPayfastLoading}
        size="lg"
        className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold px-8 py-6 text-base shadow-lg hover:shadow-xl transition-all duration-200"
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
      <p className="text-xs text-muted-foreground">
        You will be redirected to PayFast's secure payment gateway
      </p>
    </div>
  );
}
