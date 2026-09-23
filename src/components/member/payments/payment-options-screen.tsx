import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PayFastPayment } from "@/components/payments/payfast-payment";
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatAmount } from "@/data/currencies";
import { useFetchSnapScanQRCodeQuery } from "@/queries/snapscan";
import { useFetchPaymentDetails } from "@/queries/clubs";
import { getTransactionStatus } from "@/services/transactions";
import type { FetchSnapScanQRCodeRequest } from "@/services/snapscan/details";
import type { BankDetails, PaymentTransactionOption } from "./payment-types.ts";
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
  X,
} from "lucide-react";

type PaymentMethod = "eft" | "payfast" | "snapscan" | null;

interface CustomPaymentMethod {
  name?: string;
  url?: string;
}

interface PaymentOptionsScreenProps {
  bankDetails: BankDetails | null | undefined;
  bankDetailsLoading: boolean;
  clubAccountId: string;
  currency?: string;
  supportEmail?: string;
  payfastEnabled?: boolean;
  snapscanEnabled?: boolean;
  userId?: string;
  orderId?: string;
  snapscanUserId?: string;
  snapscanTransactionId?: string;
  paymentReference?: string;
  backLabel?: string;
  selectedPaymentOption: PaymentTransactionOption | null;
  selectedPaymentMethod: PaymentMethod;
  onSelectedPaymentMethodChange: (method: PaymentMethod) => void;
  customPaymentMethods?: CustomPaymentMethod[];
  copiedField: string | null;
  onCopyToClipboard: (text: string, field: string) => void;
  onBack: () => void;
}

export default function PaymentOptionsScreen({
  bankDetails,
  bankDetailsLoading,
  clubAccountId,
  currency,
  supportEmail,
  payfastEnabled = false,
  snapscanEnabled = false,
  userId,
  orderId,
  snapscanUserId,
  snapscanTransactionId,
  paymentReference,
  selectedPaymentOption,
  selectedPaymentMethod,
  onSelectedPaymentMethodChange,
  customPaymentMethods,
  copiedField,
  onCopyToClipboard,
  onBack,
}: PaymentOptionsScreenProps) {
  const [eftDialogOpen, setEftDialogOpen] = useState(false);
  const [snapScanCountdown, setSnapScanCountdown] = useState(5);
  const [snapScanCycle, setSnapScanCycle] = useState(0);
  const [snapScanPaid, setSnapScanPaid] = useState(false);

  const { data: paymentDetails, isLoading: paymentDetailsLoading } = useFetchPaymentDetails(clubAccountId);

  const resolvedEftDetails = paymentDetails ? paymentDetails.eft_details : null;
  const resolvedPayfastEnabled = paymentDetails
    ? paymentDetails.payfast_enabled
    : payfastEnabled;
  const resolvedSnapscanEnabled = paymentDetails
    ? paymentDetails.snapscan_enabled
    : snapscanEnabled;
  // Wait for paymentDetails (the source of truth for eft_enabled) before deciding
  // whether to show the EFT option, otherwise it briefly shows using the stale
  // bankDetails fallback and then disappears once paymentDetails loads.
  const eftEnabled = !paymentDetailsLoading && resolvedEftDetails !== null;

  const getSnapScanApiMessage = (error: unknown) => {
    if (!axios.isAxiosError(error)) {
      return null;
    }

    const responseData = error.response?.data;

    if (typeof responseData === "string" && responseData.trim()) {
      return responseData;
    }

    if (typeof responseData === "object" && responseData !== null) {
      const message = "message" in responseData ? responseData.message : null;
      const errorMessage = "error" in responseData ? responseData.error : null;

      if (typeof message === "string" && message.trim()) {
        return message;
      }

      if (typeof errorMessage === "string" && errorMessage.trim()) {
        return errorMessage;
      }
    }

    return null;
  };

  const outstandingAmount =
    selectedPaymentOption?.outstanding_amount ??
    bankDetails?.outstanding_amount ??
    0;
  const resolvedTransactionId =
    selectedPaymentOption?.transaction_id ?? snapscanTransactionId;
  const snapscanRequest = useMemo<FetchSnapScanQRCodeRequest | null>(() => {
    const transactionId = resolvedTransactionId;

    if (
      !resolvedSnapscanEnabled ||
      !clubAccountId ||
      !snapscanUserId ||
      !transactionId
    ) {
      return null;
    }

    return {
      club_account_id: clubAccountId,
      user_id: snapscanUserId,
      transaction_id: transactionId,
    };
  }, [clubAccountId, resolvedTransactionId, resolvedSnapscanEnabled, snapscanUserId]);
  const {
    data: snapScanData,
    error: snapScanError,
    isFetching: isSnapScanFetching,
    refetch: refetchSnapScanQrCode,
  } = useFetchSnapScanQRCodeQuery(
    snapscanRequest,
    selectedPaymentMethod === "snapscan",
  );
  const snapScanUrls = useMemo(() => {
    if (snapScanError) {
      return {
        checkoutUrl: null,
        merchantReference: null,
      };
    }

    const merchantKey = snapScanData?.merchant_key?.trim();
    const merchantReference = snapScanData?.merchant_reference?.trim();

    if (!merchantKey || !merchantReference) {
      return {
        checkoutUrl: null,
        merchantReference: null,
      };
    }

    const checkoutParams = new URLSearchParams({
      id: merchantReference,
      amount: String(Math.max(Math.round(outstandingAmount), 0)),
      strict: "true",
    });

    const encodedMerchantKey = encodeURIComponent(merchantKey);

    return {
      checkoutUrl: `https://pos.snapscan.io/qr/${encodedMerchantKey}?${checkoutParams.toString()}`,
      merchantReference,
    };
  }, [outstandingAmount, snapScanData, snapScanError]);
  const snapScanErrorMessage = useMemo(() => {
    if (!resolvedSnapscanEnabled || selectedPaymentMethod !== "snapscan") {
      return null;
    }

    if (!snapscanRequest) {
      return "SnapScan is unavailable for this payment.";
    }

    if (!snapScanError) {
      return null;
    }

    if (
      axios.isAxiosError(snapScanError) &&
      snapScanError.response?.status === 400
    ) {
      return (
        getSnapScanApiMessage(snapScanError) ??
        "SnapScan payment details could not be returned at this time."
      );
    }

    return axios.isAxiosError(snapScanError)
      ? (getSnapScanApiMessage(snapScanError) ??
          "SnapScan payment details could not be returned at this time.")
      : snapScanError instanceof Error
        ? snapScanError.message
        : "SnapScan payment details could not be returned at this time.";
  }, [selectedPaymentMethod, snapScanError, resolvedSnapscanEnabled, snapscanRequest]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    if (!resolvedPayfastEnabled && selectedPaymentMethod === "payfast") {
      onSelectedPaymentMethodChange(null);
    }
    if (!resolvedSnapscanEnabled && selectedPaymentMethod === "snapscan") {
      onSelectedPaymentMethodChange(null);
    }
  }, [
    onSelectedPaymentMethodChange,
    resolvedPayfastEnabled,
    resolvedSnapscanEnabled,
    selectedPaymentMethod,
  ]);

  useEffect(() => {
    if (selectedPaymentMethod === "snapscan" && snapScanUrls.checkoutUrl) {
      window.open(snapScanUrls.checkoutUrl, "_blank", "noopener,noreferrer");
    }
  }, [selectedPaymentMethod, snapScanUrls.checkoutUrl]);

  const snapScanExpired = snapScanCycle >= 60;

  useEffect(() => {
    if (!resolvedSnapscanEnabled || snapScanExpired || !resolvedTransactionId) return;

    let count = 10;
    setSnapScanCountdown(10);

    const interval = setInterval(async () => {
      count -= 1;
      setSnapScanCountdown(count);

      if (count <= 0) {
        clearInterval(interval);
        try {
          const result = await getTransactionStatus(clubAccountId, resolvedTransactionId);
          if (result.is_paid) {
            setSnapScanPaid(true);
            return;
          }
        } catch {
          // Silently restart on error
        }
        setTimeout(() => setSnapScanCycle((c) => c + 1), 300);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [resolvedSnapscanEnabled, snapScanExpired, snapScanCycle, clubAccountId, resolvedTransactionId]);

  const isSnapscanLoading =
    selectedPaymentMethod === "snapscan" && isSnapScanFetching;
    
  if (snapScanPaid) {
    return (
      <div className="min-h-screen bg-background px-3 py-4 sm:px-4 sm:py-6 md:px-8 md:py-10">
        <div className="mx-auto max-w-lg pt-16 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Payment Complete</h1>
          <p className="mt-3 text-sm text-slate-500">
            Your payment of{" "}
            <span className="font-semibold text-slate-800">{formatAmount(outstandingAmount, currency ?? "ZAR")}</span>{" "}
            has been confirmed via SnapScan.
          </p>
          <p className="mt-1 text-xs text-slate-400">You can safely close this page.</p>
          <Button
            onClick={onBack}
            className="mt-8 rounded-full bg-zinc-900 px-6 text-sm text-white hover:bg-zinc-700"
          >
            Go back to club
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-3 py-4 sm:px-4 sm:py-6 md:px-8 md:py-10">
      <div className="mx-auto max-w-5xl space-y-4 sm:space-y-6">
        <Card className="border-none shadow-none gap-0">
          <CardHeader className="space-y-3 border-primary/10 px-1 sm:pb-6 px-0">
            <div className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-4 sm:px-5 sm:py-5">
              <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-orange-500">
                {selectedPaymentOption
                  ? selectedPaymentOption.type === "ORDER"
                    ? "Shop Order"
                    : selectedPaymentOption.type
                  : "Outstanding Balance"}
              </p>
              <p className="text-3xl font-bold tracking-tight text-orange-600 sm:text-4xl">
                {formatAmount(outstandingAmount, currency === undefined || currency === "" ? "ZAR" : currency)}
              </p>
              {!eftEnabled && (<div className="pt-3 flex items-start gap-2">
                <span className="text-amber-500 shrink-0 text-sm leading-none">⚠</span>
                <p className="text-xs text-amber-800">
                  <strong>Note:</strong> This transaction will be removed after <strong>1 hour</strong> if no payment is submitted.
                </p>
              </div>)}

              {resolvedSnapscanEnabled && (
                <div className="mt-3 flex items-center gap-3 rounded-xl border border-orange-200 bg-white/60 px-3 py-2.5">
                  {snapScanExpired ? (
                    <>
                      <div className="h-3.5 w-3.5 flex-shrink-0 rounded-full bg-red-400" />
                      <p className="flex-1 text-xs font-medium text-red-700">Session expired — please refresh the page.</p>
                    </>
                  ) : (
                    <>
                      <Loader2 className="h-3.5 w-3.5 flex-shrink-0 animate-spin text-orange-500" />
                      <div className="flex-1">
                        <p className="text-xs font-medium text-orange-800">Checking payment status...</p>
                        <p className="text-[11px] text-orange-400">Checking again in {snapScanCountdown}s</p>
                      </div>
                      <span className="text-sm font-bold tabular-nums text-orange-600">{snapScanCountdown}</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="px-0 space-y-5 pb-2 pt-2 sm:space-y-6">
            <div className="flex items-start gap-3 pb-3 border-b-2 border-gray-200 sm:items-center">
              <div className="min-w-0">
                <CardTitle className="text-xl sm:text-4xl">
                  Select a Payment Method
                </CardTitle>
              </div>
            </div>
            <div className="space-y-4">
              {eftEnabled && (
                <button
                  type="button"
                  onClick={() => {
                    onSelectedPaymentMethodChange(null);
                    setEftDialogOpen(true);
                  }}
                  className="flex w-full flex-col items-start gap-4 rounded-2xl border border-gray-200 bg-white px-4 py-4 text-left shadow-md transition-all duration-200 hover:border-slate-300 hover:shadow-lg sm:flex-row sm:items-center sm:justify-between sm:px-5"
                >
                  <div className="flex items-start gap-3 sm:items-center sm:gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-slate-300 bg-white transition-colors">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-black text-white" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-lg font-semibold text-gray-950 sm:text-2xl">
                        Pay via EFT
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Transfer directly into the club bank account.
                      </p>
                    </div>
                  </div>

                  <div className="w-full rounded-2xl bg-slate-100 px-4 py-3 text-left sm:w-auto sm:text-right">
                    <p className="text-sm font-semibold text-slate-800">
                      Bank Transfer
                    </p>
                    <p className="text-xs text-slate-600">
                      Manual payment with reference
                    </p>
                  </div>
                </button>
              )}
            </div>

            {resolvedPayfastEnabled && (
              <div className="space-y-4">
                <PayFastPayment
                  clubAccountId={clubAccountId}
                  outstandingAmount={outstandingAmount}
                  userId={userId}
                  transactionId={resolvedTransactionId}
                  orderId={selectedPaymentOption?.order_id ?? orderId}
                  eventId={selectedPaymentOption?.event_id}
                  eventRegistrationId={
                    selectedPaymentOption?.event_registration_id
                  }
                  showHeader={false}
                  buttonVariant="logo"
                  isSelected={selectedPaymentMethod === "payfast"}
                  onSelectedChange={(isSelected) =>
                    onSelectedPaymentMethodChange(isSelected ? "payfast" : null)
                  }
                />
              </div>
            )}

            {resolvedSnapscanEnabled && (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => onSelectedPaymentMethodChange("snapscan")}
                  disabled={isSnapscanLoading}
                  className={`flex w-full items-center justify-between rounded-2xl border border-gray-200 bg-white px-5 py-4 text-left shadow-md transition-all duration-200 hover:border-slate-300 hover:shadow-lg ${isSnapscanLoading ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-slate-300 bg-white">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-black text-white">
                        {isSnapScanFetching && <Loader2 className="h-4 w-4 animate-spin" />}
                      </div>
                    </div>

                    <div>
                      <p className="text-xl font-semibold text-gray-950 sm:text-2xl">
                        {isSnapscanLoading ? "Loading SnapScan..." : "Pay with SnapScan"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Use SnapScan to complete payment through a mobile-friendly checkout.
                      </p>
                    </div>
                  </div>

                  <div className="w-full max-w-[160px] rounded-2xl bg-slate-100 px-4 py-3 text-left sm:w-auto sm:text-right">
                    <p className="text-sm font-semibold text-slate-800">SnapScan</p>
                    <p className="text-xs text-slate-600">Scan to pay</p>
                  </div>
                </button>

                {snapScanErrorMessage && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    <p className="mb-2">{snapScanErrorMessage}</p>
                    {snapscanRequest && (
                      <Button
                        type="button"
                        size="sm"
                        className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => void refetchSnapScanQrCode()}
                        disabled={isSnapScanFetching}
                      >
                        Retry SnapScan
                      </Button>
                    )}
                  </div>
                )}

              </div>
            )}

            {customPaymentMethods && customPaymentMethods.length > 0 && (
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    More Payment Options
                  </p>
                </div>
                <div className="space-y-3">
                  {customPaymentMethods.map((method, index) => (
                    <Card
                      key={`${method.name ?? "payment-method"}-${index}`}
                      className="rounded-2xl border border-primary/20 bg-white/85 shadow-sm transition-shadow hover:shadow-md"
                    >
                      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary sm:h-11 sm:w-11">
                            <ExternalLink className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-base font-semibold text-slate-950">
                              {method.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Proceed to {method.name} to complete payment.
                            </p>
                          </div>
                        </div>
                        <Button
                          onClick={() =>
                            method.url && window.open(method.url, "_blank")
                          }
                          className="w-full rounded-full bg-primary px-5 hover:bg-primary/90 sm:w-auto"
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Continue
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* EFT full-page dialog */}
      <Dialog open={eftDialogOpen} onOpenChange={setEftDialogOpen}>
        <DialogContent
          showCloseButton={false}
          className="fixed inset-0 top-0 left-0 h-screen w-screen max-w-none translate-x-0 translate-y-0 rounded-none border-none p-0 flex flex-col gap-0 overflow-hidden"
        >
          <DialogTitle className="sr-only">EFT Bank Details</DialogTitle>
          <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-4 py-4 sm:px-6">
            <h2 className="text-xl font-semibold text-slate-950">EFT Bank Details</h2>
            <DialogClose asChild>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-950"
              >
                <X className="h-5 w-5" />
                <span className="sr-only">Close</span>
              </button>
            </DialogClose>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
            <div className="mx-auto max-w-xl space-y-4">
              {bankDetailsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
                </div>
              ) : (
                <>
                  <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
                    <div className="flex items-start justify-between gap-3 px-3 py-3 sm:px-4">
                      <div className="min-w-0">
                        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                          Bank Name
                        </p>
                        <p className="break-words text-sm font-semibold text-slate-950">
                          {bankDetails?.bank}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          onCopyToClipboard(bankDetails?.bank || "", "bank")
                        }
                        className="shrink-0"
                      >
                        {copiedField === "bank" ? (
                          <CheckCircle2 className="h-4 w-4 text-slate-700" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    <div className="flex items-start justify-between gap-3 px-3 py-3 sm:px-4">
                      <div className="min-w-0">
                        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                          Account Number
                        </p>
                        <p className="break-all font-mono text-sm font-semibold text-slate-950">
                          {bankDetails?.account_number}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          onCopyToClipboard(
                            bankDetails?.account_number || "",
                            "account",
                          )
                        }
                        className="shrink-0"
                      >
                        {copiedField === "account" ? (
                          <CheckCircle2 className="h-4 w-4 text-slate-700" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    <div className="flex items-start justify-between gap-3 px-3 py-3 sm:px-4">
                      <div className="min-w-0">
                        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                          Branch Code
                        </p>
                        <p className="break-all font-mono text-sm font-semibold text-slate-950">
                          {bankDetails?.branch_code}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          onCopyToClipboard(
                            bankDetails?.branch_code || "",
                            "branch",
                          )
                        }
                        className="shrink-0"
                      >
                        {copiedField === "branch" ? (
                          <CheckCircle2 className="h-4 w-4 text-slate-700" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    <div className="flex items-start justify-between gap-3 px-3 py-3 sm:px-4">
                      <div className="min-w-0">
                        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                          Account Type
                        </p>
                        <p className="break-words text-sm font-semibold text-slate-950">
                          {bankDetails?.account_type}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          onCopyToClipboard(
                            bankDetails?.account_type || "",
                            "type",
                          )
                        }
                        className="shrink-0"
                      >
                        {copiedField === "type" ? (
                          <CheckCircle2 className="h-4 w-4 text-slate-700" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {(paymentReference ||
                    bankDetails?.registration_payment_reference) && (
                    <div className="rounded-xl border border-slate-200 bg-white px-3 py-3 sm:px-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                        <div className="min-w-0">
                          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                            Payment Reference
                          </p>
                          <p className="mt-1 break-all font-mono text-base font-semibold text-slate-950 sm:text-lg">
                            {paymentReference ||
                              bankDetails?.registration_payment_reference}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Include this reference with your EFT payment.
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            onCopyToClipboard(
                              paymentReference ||
                                bankDetails?.registration_payment_reference ||
                                "",
                              "reference",
                            )
                          }
                          className="shrink-0"
                        >
                          {copiedField === "reference" ? (
                            <>
                              <CheckCircle2 className="mr-2 h-4 w-4 text-slate-700" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="mr-2 h-4 w-4" />
                              Copy
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>
                      <strong className="text-slate-950">Important:</strong>{" "}
                      Always include your payment reference number to ensure
                      proper allocation of your payment.
                    </p>
                    <p>
                      <strong className="text-slate-950">
                        Registration Status:
                      </strong>{" "}
                      Your registration will remain <strong>Pending</strong>{" "}
                      until the club administrator confirms receipt of your
                      payment.
                      {supportEmail && (
                        <>
                          {" "}
                          If you do not receive confirmation in a reasonable
                          timeframe, contact{" "}
                          <a
                            href={`mailto:${supportEmail}`}
                            className="font-semibold text-slate-700 underline"
                          >
                            {supportEmail}
                          </a>
                          .
                        </>
                      )}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
