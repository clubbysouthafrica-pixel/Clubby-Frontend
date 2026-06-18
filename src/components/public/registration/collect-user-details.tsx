import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Check, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

interface CollectUserDetailsProps {
  clubName?: string;
  clubProfileUrl?: string;
  onContinue: (email: string, firstName: string, surname: string) => void;
}

export function CollectUserDetails({
  clubName,
  clubProfileUrl,
  onContinue,
}: CollectUserDetailsProps) {
  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);

  const isEmailValid = email && email.includes("@") && email.includes(".");
  const emailsMatch = email === confirmEmail && isEmailValid;
  const isFormValid = emailsMatch && firstName.trim() && surname.trim();

  const formatName = (name: string): string => {
    return name
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  };

  const handleContinue = () => {
    if (!isEmailValid) {
      setError("Invalid email provided.");
      return;
    }
    if (!emailsMatch) {
      setError("Email addresses do not match.");
      return;
    }
    if (!firstName.trim()) {
      setError("First name is required.");
      return;
    }
    if (!surname.trim()) {
      setError("Surname is required.");
      return;
    }
    setError(undefined);
    onContinue(email, firstName, surname);
  };

  return (
    <div className="space-y-4">
      {(clubProfileUrl || clubName) && (
        <div className="w-full bg-white rounded-lg shadow-md overflow-hidden">
          {clubProfileUrl && (
            <div className="w-full overflow-hidden">
              <img
                src={clubProfileUrl}
                alt="Club cover"
                className="w-full h-32 lg:h-44 object-cover"
              />
            </div>
          )}
          <div className="py-4 md:py-6 px-6 md:px-10 flex flex-col items-center gap-1">
            {clubName && (
              <h2 className="text-2xl md:text-4xl font-bold text-center text-gray-900">
                {clubName}
              </h2>
            )}
            <p className="text-center text-sm md:text-base text-gray-600 mt-2">
              Please complete all required fields to proceed with your registration.
            </p>
          </div>
        </div>
      )}

      <div className="w-full bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-4 md:px-6 py-5 space-y-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="public_email" className="text-xs font-semibold text-muted-foreground">
              Email Address
            </Label>
            <div className="relative">
              <Input
                id="public_email"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(undefined);
                }}
                className="pr-10 text-base md:text-sm"
                required
              />
              {email && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isEmailValid ? (
                    <Check className="h-5 w-5 text-green-600" />
                  ) : (
                    <X className="h-5 w-5 text-red-600" />
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="public_confirm_email" className="text-xs font-semibold text-muted-foreground">
              Confirm Email Address
            </Label>
            <div className="relative">
              <Input
                id="public_confirm_email"
                type="email"
                placeholder="Re-enter your email address"
                value={confirmEmail}
                onChange={(e) => {
                  setConfirmEmail(e.target.value);
                  setError(undefined);
                }}
                className="pr-10 text-base md:text-sm"
                required
              />
              {confirmEmail && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {emailsMatch ? (
                    <Check className="h-5 w-5 text-green-600" />
                  ) : (
                    <X className="h-5 w-5 text-red-600" />
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="public_firstname" className="text-xs font-semibold text-muted-foreground">
              First Name
            </Label>
            <Input
              id="public_firstname"
              type="text"
              placeholder="Enter your first name"
              value={firstName}
              onChange={(e) => {
                setFirstName(formatName(e.target.value));
                setError(undefined);
              }}
              className="text-base md:text-sm"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="public_surname" className="text-xs font-semibold text-muted-foreground">
              Surname
            </Label>
            <Input
              id="public_surname"
              type="text"
              placeholder="Enter your surname"
              value={surname}
              onChange={(e) => {
                setSurname(formatName(e.target.value));
                setError(undefined);
              }}
              className="text-base md:text-sm"
              required
            />
          </div>

          {error && (
            <Alert variant="destructive" className="flex flex-row">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          )}

          <Button size="sm" className="w-full" onClick={handleContinue} disabled={!isFormValid}>
            Continue
          </Button>
        </div>
      </div>

      <div className="text-center text-xs">
        Already a member?{" "}
        <Link to="/login" className="underline underline-offset-4">
          Log in
        </Link>
      </div>
    </div>
  );
}
