import { TabsContent } from "@/components/ui/tabs";
import { MemberRegistration } from "@/components/member/current_registration/current_member_registration";

interface RegistrationTabContentProps {
  membershipStatus: "Resubmission required" | "Registered" | "Pending";
  clubName: string;
  currency: string;
  clubAccountId: string;
}

export function RegistrationTabContent({
  membershipStatus,
  clubName,
  currency,
  clubAccountId,
}: RegistrationTabContentProps) {
  return (
    <TabsContent value="member-registration">
      <MemberRegistration
        membershipStatus={membershipStatus}
        clubName={clubName}
        currency={currency}
        clubAccountId={clubAccountId}
      />
    </TabsContent>
  );
}