import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useFetchClub } from "@/queries/clubs";
import { CollectUserDetails } from "@/components/public/registration/collect-user-details";
import { PublicRegistrationForm } from "@/components/public/registration/registration-form";

export default function PublicJoinRegisterPage() {
  const navigate = useNavigate();
  const { clubId } = useParams();
  const { data } = useFetchClub(clubId as string);

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [showSummary, setShowSummary] = useState(false);

  const handleUserDetailsContinue = (
    email: string,
    firstName: string,
    surname: string,
  ) => {
    setEmail(email);
    setFirstName(firstName);
    setSurname(surname);
    setShowSummary(true);
  };

  return (
    <div className="flex flex-col items-center justify-center gap-6 px-4 py-6 md:p-10">
      <div className="w-full max-w-2xl">
        {!showSummary && (
          <CollectUserDetails
            clubName={data?.club_name}
            clubProfileUrl={data?.club_cover_url}
            onContinue={handleUserDetailsContinue}
          />
        )}
        {showSummary && (
          <PublicRegistrationForm
            clubName={data?.club_name as string}
            clubProfileUrl={data?.club_cover_url}
            email={email}
            firstName={firstName}
            surname={surname}
            clubAccountId={data?.club_account_id as string}
            clubCurrency={data?.currency}
            onEditDetails={() => setShowSummary(false)}
          />
        )}
        <div className="flex items-center justify-center gap-3 pt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/clubs/${clubId}`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Club
          </Button>
        </div>
      </div>
    </div>
  );
}
