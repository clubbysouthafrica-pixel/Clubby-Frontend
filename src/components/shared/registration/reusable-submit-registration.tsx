import { Button } from "@/components/ui/button";
import { ReactNode, useState } from "react";

export interface BillingFieldItem {
  field_id: string;
  value: string | number;
  label?: string;
}

export interface ReusableSubmitRegistrationProps {
  firstName?: string;
  surname?: string;
  email?: string;
  publicEmailOptIn?: boolean;
  showMemberInfo?: boolean;
  clubName: string;
  clubProfileUrl?: string;
  clubCurrency: string;
  totalRegistrationFee: number;
  billingFields: BillingFieldItem[];
  getFieldName: (fieldId: string) => string;
  onBack: () => void;
  onSubmit: (emailOptIn: boolean) => void;
  isSubmitting: boolean;
  headerDescription?: string;
  submitButtonText?: string;
  backButtonText?: string;
  bottomContent?: ReactNode;
  showPaymentWarning?: boolean;
  className?: string;
}

export function ReusableSubmitRegistration({
  firstName,
  surname,
  email,
  publicEmailOptIn = false,
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
  className = "",
}: ReusableSubmitRegistrationProps) {
  const [agreed, setAgreed] = useState(false);
  const [emailOptIn, setEmailOptIn] = useState(publicEmailOptIn);

  return (
    <div className={`flex flex-col gap-4 justify-center items-center px-4 lg:px-0 py-6 lg:py-12 ${className}`}>
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-md overflow-hidden">
        {clubProfileUrl && (
          <div className="w-full overflow-hidden">
            <img
              src={clubProfileUrl}
              alt="Club cover"
              className="w-full h-32 lg:h-44 object-cover"
            />
          </div>
        )}
        <div className="py-4 lg:py-6 px-6 lg:px-10 flex flex-col items-center gap-1">
          <h2 className="text-2xl lg:text-4xl font-bold text-center text-gray-900">
            {clubName}
          </h2>
          <p className="text-center text-sm lg:text-base text-gray-600 mt-2">
            {headerDescription}
          </p>
        </div>
      </div>

      {showMemberInfo && firstName && surname && email && (
        <div className="w-full max-w-2xl bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 lg:px-10 py-4 lg:py-5 space-y-1">
            <h1 className="text-sm lg:text-base font-semibold text-gray-900">
              Name: <strong>{firstName} {surname}</strong>
            </h1>
            <h1 className="text-sm lg:text-base font-semibold text-gray-900">
              Email: <strong>{email}</strong>
            </h1>
          </div>
        </div>
      )}

      <div className="w-full max-w-2xl bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 lg:px-10 py-6 space-y-4">
          <div className="flex items-start gap-2">
            <input
              id="terms"
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              required
              className="mt-1.5 flex-shrink-0"
            />
            <p className="text-[16px]">
              I agree to the{" "}
              <a
                target="_blank"
                href="/terms"
                className="underline underline-offset-4 text-primary hover:text-primary/80"
              >
                Terms of service
              </a>{" "}
              and the{" "}
              <a
                target="_blank"
                href="/legal"
                className="underline underline-offset-4 text-primary hover:text-primary/80"
              >
                Privacy Policy
              </a>
            </p>
          </div>

          <label className="flex items-start gap-3 py-1 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={emailOptIn}
              onChange={(e) => setEmailOptIn(e.target.checked)}
              className="mt-1 flex-shrink-0"
            />
            <span>Opt me in to receive emails from the organization.</span>
          </label>

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
              onClick={() => onSubmit(emailOptIn)}
              disabled={(isSubmitting && !agreed) || !agreed}
            >
              {isSubmitting ? "Submitting..." : submitButtonText}
            </Button>
          </div>

          {bottomContent}
        </div>
      </div>
    </div>
  );
}
