import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { ReactNode } from "react";
import { formatAmount } from "@/data/currencies";

export interface BillingFieldItem {
  field_id: string;
  value: string | number;
  label?: string;
}

export interface ReusableSubmitRegistrationProps {
  // Member info (optional)
  firstName?: string;
  surname?: string;
  email?: string;
  showMemberInfo?: boolean;

  // Club and billing
  clubName: string;
  clubCurrency: string;
  totalRegistrationFee: number;
  billingFields: BillingFieldItem[];
  getFieldName: (fieldId: string) => string;

  // Actions
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;

  // Error handling
  errorMessage?: string;

  // Optional customization
  headerDescription?: string;
  submitButtonText?: string;
  backButtonText?: string;
  bottomContent?: ReactNode;
  showPaymentWarning?: boolean;

  // Styling
  className?: string;
}

export function ReusableSubmitRegistration({
  firstName,
  surname,
  email,
  showMemberInfo = false,
  clubName,
  clubCurrency,
  totalRegistrationFee,
  billingFields,
  getFieldName,
  onBack,
  onSubmit,
  isSubmitting,
  errorMessage,
  headerDescription = "Submit your registration by reviewing and confirming the details below.",
  submitButtonText = "Submit registration",
  backButtonText = "Back to form",
  bottomContent,
  showPaymentWarning = true,
  className = "",
}: ReusableSubmitRegistrationProps) {
  return (
    <Card className={`pt-0 gap-0 ${className}`}>
      <CardHeader className="border-b bg-muted/30 py-1 pb-1">
        <CardTitle className="text-l text-center pt-4">{clubName}</CardTitle>
        <CardDescription className="text-center text-xs">
          {headerDescription}
        </CardDescription>
      </CardHeader>

      <CardContent className="py-2 px-4">
        <form>
          <div className="space-y-2">
            <div className="grid gap-2">
              <div className="px-2 py-2 space-y-2 bg-muted/10">
                {/* Member Information (optional) */}
                {showMemberInfo && firstName && surname && email && (
                  <div className="p-3">
                    <h1 className="text-l pt-2">
                      Name:{" "}
                      <strong>
                        {firstName} {surname}
                      </strong>
                    </h1>
                    <h1 className="text-l">
                      Email: <strong>{email}</strong>
                    </h1>
                  </div>
                )}

                {/* Total Registration Fee */}
                <div className="p-3 bg-muted/20 rounded-lg">
                  <h2 className="text-base mb-2">
                    Total Registration Fee:{" "}
                    <strong>
                      {formatAmount(totalRegistrationFee, clubCurrency)}
                    </strong>
                  </h2>
                  <ul className="ml-6 list-disc space-y-1">
                    {billingFields.map((f) => (
                      <li key={f.field_id} className="text-m">
                        {getFieldName(f.field_id)}:{" "}
                        <strong>
                          {formatAmount(f.value as number, clubCurrency)}
                        </strong>
                        {f.label ? ` (${f.label})` : ""}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Payment Warning */}
                {showPaymentWarning && (
                  <div className="bg-muted/20 p-3 rounded-lg border space-y-2">
                    <p className="text-xs font-semibold text-yellow-700">
                      ⚠️ Please review your membership information carefully
                      before submitting.
                    </p>
                    <p className="text-xs">
                      Once your registration is submitted, you must visit the{" "}
                      <strong>Payments & Billing</strong> tab in your associated
                      club profile to view available payment methods and
                      instructions for paying any outstanding amounts.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Clubby is <strong>not responsible</strong> for any
                      incorrect payments, misdirected payments, or payment
                      errors. Please follow the instructions on the Payments tab
                      carefully.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Ensure all billing information is correct to avoid delays
                      in processing your membership.
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-3 border-t my-2">
                <Button
                  variant="outline"
                  type="button"
                  size="sm"
                  className="w-[110px]"
                  disabled={isSubmitting}
                  onClick={onBack}
                >
                  {backButtonText}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={onSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : submitButtonText}
                </Button>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <Alert variant="destructive" className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  {errorMessage}
                </AlertDescription>
              </Alert>
            )}

            {/* Bottom Content */}
            {bottomContent}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
