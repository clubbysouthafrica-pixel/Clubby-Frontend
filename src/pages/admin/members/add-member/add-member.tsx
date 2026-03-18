import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { AlertCircle, Mail, User } from "lucide-react";
import { ClubRegisterForm } from "@/components/admin/members/add-member/club-registration-form";
import { Label } from "@/components/ui/label";

export default function AddMemberPage() {
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [memberEmail, setMemberEmail] = useState("");
  const [memberFirstName, setMemberFirstName] = useState("");
  const [memberSurname, setMemberSurname] = useState("");
  const [isError, setIsError] = useState<undefined | string>(undefined);

  const handleEmailSubmission = () => {
    if (
      memberEmail === "" ||
      !memberEmail.includes("@") ||
      !memberEmail.includes(".")
    ) {
      setIsError("Invalid email provided.");
      return;
    }
    if (!memberFirstName || memberFirstName === "") {
      setIsError("Member firstname is required.");
      return;
    }
    if (!memberSurname || memberSurname === "") {
      setIsError("Member surname is required.");
      return;
    }
    setShowRegistrationForm(true);
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50 py-10">
      <Card className="w-full max-w-lg shadow-lg border-0">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <User className="h-6 w-6 text-primary" />
            Add Member
          </CardTitle>
          <CardDescription>
            Register a new member and initiate their onboarding process.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 space-y-2">
            <p className="text-sm text-muted-foreground">
              Fill in the member’s details below. After submission, the member
              will receive an email with a temporary password and instructions
              to complete their registration.
            </p>
            <Alert
              variant="warning"
              className="text-xs bg-yellow-50 border-yellow-200 text-yellow-800"
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              <AlertDescription>
                <strong>Important:</strong> Please ensure a valid email address
                is provided for successful communication and account
                registration.
              </AlertDescription>
            </Alert>
          </div>
          {!showRegistrationForm && (
            <form
              className="flex flex-col gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                handleEmailSubmission();
              }}
            >
              <div>
                <Label
                  htmlFor="email"
                  className="text-xs font-semibold text-muted-foreground"
                >
                  Member Email
                </Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter member email address"
                    className="pl-10"
                    value={memberEmail}
                    onChange={(e) => {
                      setMemberEmail(e.target.value);
                      setIsError(undefined);
                    }}
                    required
                  />
                </div>
              </div>
              <div>
                <Label
                  htmlFor="firstname"
                  className="text-xs font-semibold text-muted-foreground"
                >
                  Member First Name
                </Label>
                <Input
                  id="firstname"
                  type="text"
                  placeholder="Enter member first name"
                  value={memberFirstName}
                  onChange={(e) => {
                    setMemberFirstName(e.target.value);
                    setIsError(undefined);
                  }}
                  required
                />
              </div>
              <div>
                <Label
                  htmlFor="surname"
                  className="text-xs font-semibold text-muted-foreground"
                >
                  Member Surname
                </Label>
                <Input
                  id="surname"
                  type="text"
                  placeholder="Enter member surname"
                  value={memberSurname}
                  onChange={(e) => {
                    setMemberSurname(e.target.value);
                    setIsError(undefined);
                  }}
                  required
                />
              </div>
              {isError && (
                <Alert
                  variant="destructive"
                  className="flex flex-row items-center gap-2"
                >
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    {isError}
                  </AlertDescription>
                </Alert>
              )}
              <Button className="mt-2 w-full" size="lg" type="submit">
                Continue
              </Button>
            </form>
          )}
          {showRegistrationForm && (
            <div className="mt-6">
              <ClubRegisterForm
                setShowRegistrationForm={setShowRegistrationForm}
                memberEmail={memberEmail}
                memberFirstName={memberFirstName}
                memberSurname={memberSurname}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
