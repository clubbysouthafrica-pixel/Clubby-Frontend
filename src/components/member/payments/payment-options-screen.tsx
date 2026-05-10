import axios from "axios";
import { useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PayFastPayment } from "@/components/payments/payfast-payment";
import { cn } from "@/lib/utils";
import { formatAmount } from "@/data/currencies";
import { useFetchSnapScanQRCodeQuery } from "@/queries/snapscan";
import type {
  FetchSnapScanQRCodeRequest,
} from "@/services/snapscan/details";
import type {
  BankDetails,
  PaymentTransactionOption,
} from "./payment-types.ts";
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  CreditCard,
  ExternalLink,
  Loader2,
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
  snapscanUserId,
  snapscanTransactionId,
  paymentReference,
  backLabel = "Go Back to Club",
  selectedPaymentOption,
  selectedPaymentMethod,
  onSelectedPaymentMethodChange,
  customPaymentMethods,
  copiedField,
  onCopyToClipboard,
  onBack,
}: PaymentOptionsScreenProps) {
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

  const outstandingAmount = selectedPaymentOption?.outstanding_amount ?? bankDetails?.outstanding_amount ?? 0;
  const snapscanRequest = useMemo<FetchSnapScanQRCodeRequest | null>(() => {
    const transactionId = selectedPaymentOption?.transaction_id ?? snapscanTransactionId;

    if (!snapscanEnabled || !clubAccountId || !snapscanUserId || !transactionId) {
      return null;
    }

    return {
      club_account_id: clubAccountId,
      user_id: snapscanUserId,
      transaction_id: transactionId,
    };
  }, [
    clubAccountId,
    selectedPaymentOption?.transaction_id,
    snapscanEnabled,
    snapscanTransactionId,
    snapscanUserId,
  ]);
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
        qrCodeUrl: null,
        checkoutUrl: null,
        merchantReference: null,
      };
    }

    const merchantKey = snapScanData?.merchant_key?.trim();
    const merchantReference = snapScanData?.merchant_reference?.trim();

    if (!merchantKey || !merchantReference) {
      return {
        qrCodeUrl: null,
        checkoutUrl: null,
        merchantReference: null,
      };
    }

    const checkoutParams = new URLSearchParams({
      id: merchantReference,
      amount: String(Math.max(Math.round(outstandingAmount), 0)),
      strict: "true",
    });
    const qrParams = new URLSearchParams(checkoutParams);
    qrParams.set("snap_code_size", "220");

    const encodedMerchantKey = encodeURIComponent(merchantKey);

    return {
      qrCodeUrl: `https://pos.snapscan.io/qr/${encodedMerchantKey}.svg?${qrParams.toString()}`,
      checkoutUrl: `https://pos.snapscan.io/qr/${encodedMerchantKey}?${checkoutParams.toString()}`,
      merchantReference,
    };
  }, [outstandingAmount, snapScanData, snapScanError]);
  const snapScanErrorMessage = useMemo(() => {
    if (!snapscanEnabled || selectedPaymentMethod !== "snapscan") {
      return null;
    }

    if (!snapscanRequest) {
      return "SnapScan is unavailable for this payment.";
    }

    if (!snapScanError) {
      return null;
    }

    if (axios.isAxiosError(snapScanError) && snapScanError.response?.status === 400) {
      return getSnapScanApiMessage(snapScanError) ?? "SnapScan payment details could not be returned at this time.";
    }

    return axios.isAxiosError(snapScanError)
      ? getSnapScanApiMessage(snapScanError) ?? "SnapScan payment details could not be returned at this time."
      : snapScanError instanceof Error
        ? snapScanError.message
        : "SnapScan payment details could not be returned at this time.";
  }, [selectedPaymentMethod, snapScanError, snapscanEnabled, snapscanRequest]);

  useEffect(() => {
    if (selectedPaymentMethod !== "snapscan") {
      return;
    }
  }, [
    clubAccountId,
    outstandingAmount,
    selectedPaymentMethod,
    selectedPaymentOption,
    snapscanEnabled,
    snapscanRequest,
    snapscanTransactionId,
    snapscanUserId,
    userId,
  ]);

  useEffect(() => {
    if (selectedPaymentMethod !== "snapscan") {
      return;
    }
  }, [
    isSnapScanFetching,
    selectedPaymentMethod,
    snapScanData,
    snapScanError,
    snapScanErrorMessage,
    snapScanUrls,
  ]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    if (!payfastEnabled && selectedPaymentMethod === "payfast") {
      onSelectedPaymentMethodChange(null);
    }
    if (!snapscanEnabled && selectedPaymentMethod === "snapscan") {
      onSelectedPaymentMethodChange(null);
    }
  }, [
    onSelectedPaymentMethodChange,
    payfastEnabled,
    selectedPaymentMethod,
    snapscanEnabled,
  ]);

  return (
    <div className="min-h-screen bg-background px-3 py-4 sm:px-4 sm:py-6 md:px-8 md:py-10">
      <div className="sticky top-0 z-20 -mx-3 mb-4 bg-background/95 px-3 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:-mx-4 sm:px-4 md:-mx-8 md:mb-6 md:px-8">
        <div className="mx-auto max-w-5xl">
          <Button variant="ghost" onClick={onBack} className="-ml-2 w-fit text-sm sm:text-base">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {backLabel}
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-4 sm:space-y-6">

        <Card className="border-none shadow-none gap-0">
          <CardHeader className="space-y-3 border-primary/10 px-1 pb-4 sm:pb-6">
            <div className="flex items-start gap-3 sm:items-center">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10 sm:h-12 sm:w-12">
                <CreditCard className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-xl sm:text-2xl">Payment Options</CardTitle>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Complete your outstanding payment using one of the supported methods below.
                </p>
              </div>
            </div>

            <div className="space-y-1 text-sm leading-relaxed text-muted-foreground">
              {selectedPaymentOption ? (
                <>
                  <p>
                    Payment Type:{" "}
                    <span className="font-semibold text-foreground">
                      {selectedPaymentOption.type === "ORDER" ? "SHOP ORDER" : selectedPaymentOption.type}
                    </span>
                  </p>
                  <p>
                    Amount to pay:{" "}
                    <span className="font-semibold text-orange-600">
                      {formatAmount(outstandingAmount, currency)}
                    </span>
                  </p>
                </>
              ) : (
                <p>
                  Amount to pay:{" "}
                  <span className="font-semibold text-foreground">
                    {formatAmount(bankDetails?.outstanding_amount ?? 0, currency)}
                  </span>
                </p>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-5 px-1 pb-2 pt-2 sm:space-y-6 sm:p-6">
            <div className="space-y-4">
              <button
                type="button"
                onClick={() =>
                  onSelectedPaymentMethodChange(
                    selectedPaymentMethod === "eft" ? null : "eft",
                  )
                }
                className={cn(
                  "flex w-full flex-col items-start gap-4 rounded-2xl border bg-white px-4 py-4 text-left shadow-md transition-all duration-200 sm:flex-row sm:items-center sm:justify-between sm:px-5",
                  selectedPaymentMethod === "eft"
                    ? "border-slate-400 ring-2 ring-slate-200"
                    : "border-gray-200 hover:border-slate-300 hover:shadow-lg",
                )}
              >
                <div className="flex items-start gap-3 sm:items-center sm:gap-4">
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                      selectedPaymentMethod === "eft"
                        ? "border-slate-300 bg-slate-200"
                        : "border-slate-300 bg-white",
                    )}
                  >
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-black text-white">
                      {selectedPaymentMethod === "eft" ? <CheckCircle2 className="h-4 w-4" /> : null}
                    </div>
                  </div>

                  <div className="min-w-0">
                    <p className="text-lg font-semibold text-gray-950 sm:text-2xl">Pay via EFT</p>
                    <p className="text-sm text-muted-foreground">Transfer directly into the club bank account.</p>
                  </div>
                </div>

                <div className="w-full rounded-2xl bg-slate-100 px-4 py-3 text-left sm:w-auto sm:text-right">
                  <p className="text-sm font-semibold text-slate-800">Bank Transfer</p>
                  <p className="text-xs text-slate-600">Manual payment with reference</p>
                </div>
              </button>

              {selectedPaymentMethod === "eft" && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-3 py-3 sm:px-5 sm:py-4">
                  <div className="space-y-4">
                    {bankDetailsLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
                      </div>
                    ) : (
                      <>
                        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
                          <div className="flex items-start justify-between gap-3 px-3 py-3 sm:px-4">
                            <div className="min-w-0">
                              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Bank Name</p>
                              <p className="break-words text-sm font-semibold text-slate-950">{bankDetails?.bank}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onCopyToClipboard(bankDetails?.bank || "", "bank")}
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
                              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Account Number</p>
                              <p className="break-all font-mono text-sm font-semibold text-slate-950">{bankDetails?.account_number}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onCopyToClipboard(bankDetails?.account_number || "", "account")}
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
                              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Branch Code</p>
                              <p className="break-all font-mono text-sm font-semibold text-slate-950">{bankDetails?.branch_code}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onCopyToClipboard(bankDetails?.branch_code || "", "branch")}
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
                              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Account Type</p>
                              <p className="break-words text-sm font-semibold text-slate-950">{bankDetails?.account_type}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onCopyToClipboard(bankDetails?.account_type || "", "type")}
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

                        {(paymentReference || bankDetails?.registration_payment_reference) && (
                          <div className="rounded-xl border border-slate-200 bg-white px-3 py-3 sm:px-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                              <div className="min-w-0">
                                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Payment Reference</p>
                                <p className="mt-1 break-all font-mono text-base font-semibold text-slate-950 sm:text-lg">
                                  {paymentReference || bankDetails?.registration_payment_reference}
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
                                    paymentReference || bankDetails?.registration_payment_reference || "",
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
                            <strong className="text-slate-950">Important:</strong> Always include your payment reference number to ensure proper allocation of your payment.
                          </p>
                          <p>
                            <strong className="text-slate-950">Registration Status:</strong> Your registration will remain <strong>Pending</strong> until the club administrator confirms receipt of your payment.
                            {supportEmail && (
                              <>
                                {" "}If you do not receive confirmation in a reasonable timeframe, contact{" "}
                                <a href={`mailto:${supportEmail}`} className="font-semibold text-slate-700 underline">
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
              )}
            </div>

            {payfastEnabled && (
              <div className="space-y-4">
                <PayFastPayment
                  clubAccountId={clubAccountId}
                  outstandingAmount={outstandingAmount}
                  userId={userId}
                  transactionId={selectedPaymentOption?.transaction_id}
                  orderId={selectedPaymentOption?.order_id}
                  eventId={selectedPaymentOption?.event_id}
                  eventRegistrationId={selectedPaymentOption?.event_registration_id}
                  showHeader={false}
                  buttonVariant="logo"
                  isSelected={selectedPaymentMethod === "payfast"}
                  onSelectedChange={(isSelected) =>
                    onSelectedPaymentMethodChange(isSelected ? "payfast" : null)
                  }
                />
              </div>
            )}

            {snapscanEnabled && (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() =>
                    onSelectedPaymentMethodChange(
                      selectedPaymentMethod === "snapscan" ? null : "snapscan",
                    )
                  }
                  className={cn(
                    "flex w-full items-center justify-between rounded-2xl border bg-white px-5 py-4 text-left shadow-md transition-all duration-200",
                    selectedPaymentMethod === "snapscan"
                      ? "border-emerald-400 ring-2 ring-emerald-100"
                      : "border-gray-200 hover:border-emerald-300 hover:shadow-lg",
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                        selectedPaymentMethod === "snapscan"
                          ? "border-emerald-300 bg-emerald-100"
                          : "border-emerald-300 bg-white",
                      )}
                    >
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white">
                        {selectedPaymentMethod === "snapscan" ? <CheckCircle2 className="h-4 w-4" /> : null}
                      </div>
                    </div>

                    <div>
                      <p className="text-xl font-semibold text-gray-950 sm:text-2xl">
                        Pay with SnapScan
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Use SnapScan to complete payment through a mobile-friendly checkout.
                      </p>
                    </div>
                  </div>

                  <div className="w-full max-w-[160px] rounded-2xl bg-emerald-50 px-4 py-3 text-left sm:w-auto sm:text-right">
                    <p className="text-sm font-semibold text-emerald-800">SnapScan</p>
                    <p className="text-xs text-emerald-700">Scan to pay</p>
                  </div>
                </button>

                {selectedPaymentMethod === "snapscan" && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 px-3 py-3 sm:px-5 sm:py-4">
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-emerald-900">
                        SnapScan is selected.
                      </p>
                      <p className="text-sm text-emerald-800">
                        {isSnapScanFetching
                          ? `Preparing your SnapScan payment for ${formatAmount(outstandingAmount, currency)}.`
                          : snapScanErrorMessage
                            ? snapScanErrorMessage
                            : `Scan the SnapScan QR code for ${formatAmount(outstandingAmount, currency)} or open the payment link below.`}
                      </p>

                      {isSnapScanFetching && (
                        <div className="flex items-center gap-2 text-sm text-emerald-900">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading SnapScan payment option...
                        </div>
                      )}

                      {snapScanUrls.qrCodeUrl && (
                        <div className="rounded-2xl border border-emerald-200 bg-white p-4">
                          {snapScanUrls.checkoutUrl ? (
                            <a
                              href={snapScanUrls.checkoutUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block cursor-pointer"
                            >
                              <img
                                src={snapScanUrls.qrCodeUrl}
                                alt="SnapScan QR code"
                                className="mx-auto max-h-72 w-full max-w-72 rounded-xl object-contain transition-opacity hover:opacity-90"
                              />
                            </a>
                          ) : (
                            <img
                              src={snapScanUrls.qrCodeUrl}
                              alt="SnapScan QR code"
                              className="mx-auto max-h-72 w-full max-w-72 rounded-xl object-contain"
                            />
                          )}
                        </div>
                      )}

                      {snapScanUrls.merchantReference && (
                        <div className="rounded-xl border border-emerald-200 bg-white/80 px-4 py-3 text-sm text-emerald-900">
                          Reference: <span className="font-semibold">{snapScanUrls.merchantReference}</span>
                        </div>
                      )}

                      {snapScanUrls.checkoutUrl && (
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-full border-emerald-300 text-emerald-900 hover:bg-emerald-100"
                          onClick={() => {
                            window.open(
                              snapScanUrls.checkoutUrl ?? undefined,
                              "_blank",
                              "noopener,noreferrer",
                            );
                          }}
                        >
                          Open SnapScan Payment Link
                        </Button>
                      )}

                      {snapScanErrorMessage && snapscanRequest && (
                        <Button
                          type="button"
                          className="rounded-full bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => {
                            void refetchSnapScanQrCode();
                          }}
                          disabled={isSnapScanFetching}
                        >
                          Retry SnapScan
                        </Button>
                      )}
                    </div>
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
                            <p className="text-base font-semibold text-slate-950">{method.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Proceed to {method.name} to complete payment.
                            </p>
                          </div>
                        </div>
                        <Button
                          onClick={() => method.url && window.open(method.url, "_blank")}
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
    </div>
  );
}