import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { ClubRegisterForm } from "@/components/admin/registrations/add-member/club-registration-form";
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
    <div className="p-5">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add Members</h1>
          <p className="text-muted-foreground">
            Submit registrations on behalf of members.
          </p>
        </div>
      </div>
      <CardDescription className="mb-4">
        <>
          <p className="text-sm leading-relaxed">
            This page allows you to manually create a member profile and
            initiate the registration process. Once the registration form has
            been completed and submitted by the member, their application will
            be recorded as pending. You will then need to formally approve and
            register the member via the Members page.
          </p>
          <p className="text-sm leading-relaxed mt-3">
            An email containing a temporary password will be sent to the member,
            granting them access to the Member Portal, where they can manage
            their membership details.
          </p>
          <p className="text-xs mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
            ⚠️ <strong>Important:</strong> Please ensure that a valid email
            address is provided to ensure successful communication and account
            registration.
          </p>
        </>
      </CardDescription>
      {!showRegistrationForm && (
        <div className="flex flex-col gap-3 mt-6 max-w-md">
          <div className="flex flex-col gap-1.5 p-3 bg-muted/20 rounded-lg">
            <Label
              htmlFor="email"
              className="text-xs font-semibold text-muted-foreground"
            >
              Member Email
            </Label>
            <Input
              id="email"
              type="text"
              placeholder="Enter member email address"
              className="text-sm"
              onChange={(e) => {
                setMemberEmail(e.target.value);
                setIsError(undefined);
              }}
              required={true}
            />
          </div>
          <div className="flex flex-col gap-1.5 p-3 bg-muted/20 rounded-lg">
            <Label
              htmlFor="firstname"
              className="text-xs font-semibold text-muted-foreground"
            >
              Member Firstname
            </Label>
            <Input
              id="firstname"
              type="text"
              placeholder="Enter member firstname"
              className="text-sm"
              onChange={(e) => {
                setMemberFirstName(e.target.value);
                setIsError(undefined);
              }}
              required={true}
            />
          </div>
          <div className="flex flex-col gap-1.5 p-3 bg-muted/20 rounded-lg">
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
              className="text-sm"
              onChange={(e) => {
                setMemberSurname(e.target.value);
                setIsError(undefined);
              }}
              required={true}
            />
          </div>
          {isError && (
            <Alert variant="destructive" className="flex flex-row">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">{isError}</AlertDescription>
            </Alert>
          )}
          <Button className="mt-2" size="sm" onClick={handleEmailSubmission}>
            Continue
          </Button>
        </div>
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
    </div>
  );
}
