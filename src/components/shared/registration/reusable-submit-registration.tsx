import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ReactNode, useState } from "react";

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
  clubProfileUrl?: string;
  clubCurrency: string;
  totalRegistrationFee: number;
  billingFields: BillingFieldItem[];
  getFieldName: (fieldId: string) => string;

  // Actions
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;

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
  clubProfileUrl,
  onBack,
  onSubmit,
  isSubmitting,
  headerDescription = "Submit your registration by reviewing and confirming the details below.",
  submitButtonText = "Submit registration",
  backButtonText = "Back to form",
  bottomContent,
  showPaymentWarning = true,
  className = "",
}: ReusableSubmitRegistrationProps) {
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="flex justify-center items-center px-4 lg:px-0">
      <Card className={`w-full lg:w-[800px] pt-0 gap-0 ${className}`}>
        <CardHeader className="border-b bg-muted/30 py-4 lg:py-6 pb-4 lg:pb-6 flex flex-col items-center gap-3">
          {clubProfileUrl && (
            <img
              src={clubProfileUrl}
              alt="Club Profile"
              className="w-24 h-24 rounded-full object-cover border-3 border-white shadow-md"
            />
          )}
          <div className="flex flex-col items-center gap-2">
            <CardTitle className="text-2xl lg:text-3xl text-center">{clubName}</CardTitle>
            <CardDescription className="text-center text-xs lg:text-xs">
              {headerDescription}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="py-4 lg:py-3 px-4 lg:px-4">
          <form>
            <div className="space-y-4">
              <div className="px-0 py-2 space-y-3 bg-muted/10 rounded p-3">
                {/* Member Information (optional) */}
                {showMemberInfo && firstName && surname && email && (
                  <div>
                    <h1 className="text-xs lg:text-sm font-semibold">
                      Name:{" "}
                      <strong>
                        {firstName} {surname}
                      </strong>
                    </h1>
                    <h1 className="text-xs lg:text-sm">
                      Email: <strong>{email}</strong>
                    </h1>
                  </div>
                )}

                {/* Payment Warning */}
                {showPaymentWarning && (
                  <div className="bg-muted/20 p-3 rounded border space-y-2">
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

              <div className="flex items-start gap-2">
                <input
                  id="terms"
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  required
                  className="mt-0.5 flex-shrink-0"
                />
                <p className="text-[11px] lg:text-sm">
                  I agree to the <a target="_blank" href="/terms" className="underline underline-offset-4 text-primary hover:text-primary/80">Terms of service</a> and the <a target="_blank" href="/legal" className="underline underline-offset-4 text-primary hover:text-primary/80">Privacy Policy</a>
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  type="button"
                  size="sm"
                  className="w-full"
                  disabled={isSubmitting}
                  onClick={onBack}
                >
                  {backButtonText}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="w-full"
                  onClick={onSubmit}
                  disabled={(isSubmitting && !agreed) || !agreed}
                >
                  {isSubmitting ? "Submitting..." : submitButtonText}
                </Button>
              </div>

              {bottomContent}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
