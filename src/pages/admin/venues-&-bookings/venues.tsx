import { useContext, useEffect, useState } from "react";
import { ClubContext, ClubContextType } from "@/context/ClubContext";
import { getVenues, createVenue } from "@/services/admin-features/venues";
import { Loader2, Plus, Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CreateVenueDialog,
  CreateVenueData,
} from "@/components/admin/venues-&-bookings/create-venue-dialog";

export default function VenuesPage() {
  const { club } = useContext(ClubContext) as ClubContextType;
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreatingVenue, setIsCreatingVenue] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [editingVenue, setEditingVenue] = useState<any | null>(null);

  useEffect(() => {
    if (!club?.club_account_id) return;

    const fetchVenues = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getVenues(club.club_account_id);
        setVenues(data.venues || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch venues");
        console.error("Error fetching venues:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchVenues();
  }, [club?.club_account_id]);

  const handleCreateVenue = async (data: CreateVenueData) => {
    if (!club?.club_account_id) {
      setDialogError("Club not found");
      return;
    }

    try {
      setIsCreatingVenue(true);
      setDialogError(null);

      const venueData = {
        ...data,
        club_account_id: club.club_account_id,
      };

      await createVenue(venueData);

      setIsDialogOpen(false);
      setEditingVenue(null);
      const refreshData = await getVenues(club.club_account_id);
      setVenues(refreshData.venues || []);

      window.location.reload();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create venue";
      setDialogError(errorMessage);
      console.error("Error creating venue:", err);
    } finally {
      setIsCreatingVenue(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Venues Management</h1>
          <p className="text-muted-foreground">
            Manage your club's venues for bookings.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingVenue(null);
            setIsDialogOpen(true);
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Venue
        </Button>
      </div>

      {loading && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && venues.length === 0 && !error && (
        <div className="rounded-md bg-gray-50 p-4 text-center text-sm text-gray-700">
          No venues found. Create your first venue to get started.
        </div>
      )}

      {!loading && venues.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {venues.map((venue: any) => {
            const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
            const closedDays = venue.times
              .filter((t: any) => t.is_closed)
              .map((t: any) => DAYS[t.day_of_week]);
            const openDays = venue.times
              .filter((t: any) => !t.is_closed)
              .sort((a: any, b: any) => a.day_of_week - b.day_of_week);

            return (
              <div key={venue.venue_id} className="rounded-lg border-2 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">{venue.venue_name}</h3>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setEditingVenue(venue);
                        setIsDialogOpen(true);
                      }}
                      className="text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button className="text-gray-600 hover:text-red-600 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Minimum Booking Time:</span>
                    <span className="font-medium">{venue.smallest_booking_unit} min</span>
                  </div>

                  {venue.max_daily_booking_time && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Maximum Daily Booking Time:</span>
                      <span className="font-medium">{venue.max_daily_booking_time} min</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Operating Hours</h4>
                  {closedDays.length > 0 && (
                    <div className="text-xs">
                      <p className="text-gray-600">
                        Closed: <span className="font-medium">{closedDays.join(", ")}</span>
                      </p>
                    </div>
                  )}
                  {openDays.length > 0 && (
                    <div className="text-xs space-y-1">
                      {openDays.map((time: any) => (
                        <p key={time.day_of_week} className="text-gray-600">
                          {DAYS[time.day_of_week]}: <span className="font-medium">{time.start_time} - {time.end_time}</span>
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CreateVenueDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingVenue(null);
          setDialogError(null);
        }}
        onSubmit={handleCreateVenue}
        isLoading={isCreatingVenue}
        error={dialogError}
        initialData={editingVenue || undefined}
      />
    </div>
  );
}
