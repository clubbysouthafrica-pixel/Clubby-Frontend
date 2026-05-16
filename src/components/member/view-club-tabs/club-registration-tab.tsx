import { RegistrationTabContent } from "@/components/member/registration/registration-tab-content";

type ClubRegistrationTabProps = {
  membershipStatus: "Resubmission required" | "Registered" | "Pending";
  clubName: string;
  currency: string;
  clubAccountId: string;
  userId: string;
};

export function ClubRegistrationTab(props: ClubRegistrationTabProps) {
  return <RegistrationTabContent {...props} />;
}