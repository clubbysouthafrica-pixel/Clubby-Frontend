import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

interface RegistrationSuccessfulProps {
  title?: string;
  message?: string;
  onClose?: () => void;
  onView?: () => void;
  /** if true, align content to the left instead of centered */
  alignLeft?: boolean;
}

export default function RegistrationSuccessful({
  title = "Registration Successful",
  message = "Thank you! Your registration has been received. A confirmation email has been sent to the address you provided.",
  onClose,
  onView,
  alignLeft = false,
}: RegistrationSuccessfulProps) {
  const containerAlignment = alignLeft ? "items-start text-left mx-0" : "items-center text-center mx-auto";

  return (
    <div className={`max-w-2xl ${containerAlignment} bg-white rounded-lg shadow-md p-8 sm:p-10 flex flex-col`}>
      <div className="p-4 rounded-full bg-green-50 inline-flex items-center justify-center">
        <CheckCircle2 className="text-green-600 h-10 w-10" />
      </div>

      <h2 className="mt-4 text-2xl font-semibold text-gray-900">{title}</h2>

      <p className="mt-2 text-sm text-muted-foreground max-w-xl">{message}</p>

      <div className="mt-6 flex gap-3">
        <Button variant="default" onClick={onView} className="px-6">
          View registrations
        </Button>
        <Button variant="ghost" onClick={onClose} className="px-6">
          Close
        </Button>
      </div>

      <div className="mt-6 w-full">
        {/* subtle decorative divider */}
        <div className="h-0.5 bg-gradient-to-r from-transparent via-gray-200 to-transparent rounded-full" />
      </div>

      <p className="mt-4 text-xs text-muted-foreground">Need help? Contact support or your club admin.</p>
    </div>
  );
}
