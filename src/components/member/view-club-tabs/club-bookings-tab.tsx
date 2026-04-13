import MemberBookings from "@/components/member/bookings/member-bookings";
import { TabsContent } from "@/components/ui/tabs";

type VenueSchedule = {
  day_of_week: number;
  is_closed: boolean;
  start_time: string;
  end_time: string;
};

type Venue = {
  venue_id: string;
  venue_name: string;
  smallest_booking_unit?: number;
  max_daily_booking_time?: number;
  times: VenueSchedule[];
};

type ClubBookingsTabProps = {
  canViewBookings: boolean;
  venues: Venue[];
  loading: boolean;
  error: string | null;
  memberName: string;
};

export function ClubBookingsTab({
  canViewBookings,
  venues,
  loading,
  error,
  memberName,
}: ClubBookingsTabProps) {
  if (!canViewBookings) {
    return null;
  }

  return (
    <TabsContent value="bookings" className="mt-3 sm:mt-6">
      <MemberBookings
        venues={venues}
        loading={loading}
        error={error}
        memberName={memberName}
      />
    </TabsContent>
  );
}