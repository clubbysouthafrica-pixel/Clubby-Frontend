import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

interface CollectUserDetailsProps {
  clubName?: string;
  clubProfileUrl?: string;
  onContinue: (email: string, firstName: string, surname: string) => void;
}

export function CollectUserDetails({ clubName, clubProfileUrl, onContinue }: CollectUserDetailsProps) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);

  const handleContinue = () => {
    if (!email || !email.includes("@") || !email.includes(".")) {
      setError("Invalid email provided.");
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
    <div className="space-y-3">
      {clubProfileUrl && (
        <div className="flex flex-col items-center pb-2 gap-2">
          <img
            src={clubProfileUrl}
            alt="Club Profile"
            className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-muted"
          />
          {clubName && (
            <h2 className="text-lg md:text-xl font-semibold text-center">{clubName}</h2>
          )}
        </div>
      )}
      <div className="flex flex-col gap-1.5 p-3 bg-muted/20 rounded-lg">
        <Label htmlFor="public_email" className="text-xs font-semibold text-muted-foreground">
          Email Address
        </Label>
        <Input
          id="public_email"
          type="email"
          placeholder="Enter your email address"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError(undefined);
          }}
          className="text-sm"
          required
        />
      </div>
      <div className="flex flex-col gap-1.5 p-3 bg-muted/20 rounded-lg">
        <Label htmlFor="public_firstname" className="text-xs font-semibold text-muted-foreground">
          First Name
        </Label>
        <Input
          id="public_firstname"
          type="text"
          placeholder="Enter your first name"
          value={firstName}
          onChange={(e) => {
            setFirstName(e.target.value);
            setError(undefined);
          }}
          className="text-sm"
          required
        />
      </div>
      <div className="flex flex-col gap-1.5 p-3 bg-muted/20 rounded-lg">
        <Label htmlFor="public_surname" className="text-xs font-semibold text-muted-foreground">
          Surname
        </Label>
        <Input
          id="public_surname"
          type="text"
          placeholder="Enter your surname"
          value={surname}
          onChange={(e) => {
            setSurname(e.target.value);
            setError(undefined);
          }}
          className="text-sm"
          required
        />
      </div>
      {error && (
        <Alert variant="destructive" className="flex flex-row">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}
      <Button size="sm" className="w-full" onClick={handleContinue}>
        Continue
      </Button>
      <div className="text-center text-xs">
        Already a member?{" "}
        <Link to="/login" className="underline underline-offset-4">
          Log in
        </Link>
      </div>
    </div>
  );
}
