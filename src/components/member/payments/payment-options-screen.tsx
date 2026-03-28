import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PayFastPayment } from "@/components/payments/payfast-payment";
import { cn } from "@/lib/utils";
import { formatAmount } from "@/data/currencies";
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

type PaymentMethod = "eft" | "payfast" | null;

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
  selectedPaymentOption,
  selectedPaymentMethod,
  onSelectedPaymentMethodChange,
  customPaymentMethods,
  copiedField,
  onCopyToClipboard,
  onBack,
}: PaymentOptionsScreenProps) {
  const outstandingAmount = selectedPaymentOption?.outstanding_amount ?? bankDetails?.outstanding_amount ?? 0;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    if (!payfastEnabled && selectedPaymentMethod === "payfast") {
      onSelectedPaymentMethodChange(null);
    }
  }, [onSelectedPaymentMethodChange, payfastEnabled, selectedPaymentMethod]);

  return (
    <div className="min-h-screen bg-background px-3 py-4 sm:px-4 sm:py-6 md:px-8 md:py-10">
      <div className="sticky top-0 z-20 -mx-3 mb-4 bg-background/95 px-3 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:-mx-4 sm:px-4 md:-mx-8 md:mb-6 md:px-8">
        <div className="mx-auto max-w-5xl">
          <Button variant="ghost" onClick={onBack} className="-ml-2 w-fit text-sm sm:text-base">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back to Club
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

                        {bankDetails?.registration_payment_reference && (
                          <div className="rounded-xl border border-slate-200 bg-white px-3 py-3 sm:px-4">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                              <div className="min-w-0">
                                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Payment Reference</p>
                                <p className="mt-1 break-all font-mono text-base font-semibold text-slate-950 sm:text-lg">
                                  {bankDetails.registration_payment_reference}
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
                                    bankDetails.registration_payment_reference || "",
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