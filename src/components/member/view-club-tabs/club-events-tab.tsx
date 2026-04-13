import MemberEvents from "@/components/member/events/member-events";
import { TabsContent } from "@/components/ui/tabs";

type ClubEventsTabProps = {
  canViewEvents: boolean;
  clubId: string;
  clubAccountId: string;
  currency?: string;
  registrationSearchQuery: string;
  onPayRegistration: (eventRegistrationId?: string) => void;
};

export function ClubEventsTab({
  canViewEvents,
  clubId,
  clubAccountId,
  currency,
  registrationSearchQuery,
  onPayRegistration,
}: ClubEventsTabProps) {
  if (!canViewEvents) {
    return null;
  }

  return (
    <TabsContent value="events" className="mt-6">
      <MemberEvents
        clubId={clubId}
        clubAccountId={clubAccountId}
        currency={currency}
        registrationSearchQuery={registrationSearchQuery}
        onPayRegistration={onPayRegistration}
      />
    </TabsContent>
  );
}