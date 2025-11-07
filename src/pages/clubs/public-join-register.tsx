import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useFetchClub } from "@/queries/clubs";
import { CollectUserDetails } from "@/components/public/registration/collect-user-details";
import { RegistrationForm } from "@/components/public/registration/registration-form";

export default function PublicJoinRegisterPage() {
  const navigate = useNavigate();
  const { clubId } = useParams();
  const { data } = useFetchClub(clubId as string);

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [showSummary, setShowSummary] = useState(false);

  const handleUserDetailsContinue = (email: string, firstName: string, surname: string) => {
    setEmail(email);
    setFirstName(firstName);
    setSurname(surname);
    setShowSummary(true);
  };

  return (
    <div className="flex flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className={`w-full ${showSummary ? 'max-w-3xl' : 'max-w-md'}`}>
        <Card className="border shadow-sm pt-0">
          <CardHeader className="border-b bg-muted/30 py-3">
            <CardTitle className="text-lg text-center">Join {data?.club_name || "Club"}</CardTitle>
            <CardDescription className="text-center text-xs">
              {showSummary ? "Complete your registration form below." : "Provide your details to begin registration."}
            </CardDescription>
          </CardHeader>
          <CardContent className="py-4 px-6 space-y-4">
            {!showSummary && (
              <CollectUserDetails onContinue={handleUserDetailsContinue} />
            )}
            {showSummary && (
              <RegistrationForm 
                email={email}
                firstName={firstName}
                surname={surname}
                clubAccountId={data?.club_account_id as string}
                clubCurrency={data?.currency}
                onEditDetails={() => setShowSummary(false)} 
              />
            )}
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button variant="ghost" size="sm" onClick={() => navigate(`/clubs/${clubId}`)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Club
              </Button>
            </div>
          </CardContent>
        </Card>
        <div className="mt-4 text-center text-xs text-muted-foreground">
          Public registration placeholder. Backend integration pending.
        </div>
      </div>
    </div>
  );
}
