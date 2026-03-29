import { useContext, useEffect, useState } from "react";
import { ClubContext, ClubContextType } from "@/context/ClubContext";
import { getVenues, createVenue } from "@/services/admin-features/venues";
import { updateClubDetails } from "@/services/admin/club";
import {
  Loader2,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  CreateVenueDialog,
  CreateVenueData,
} from "@/components/admin/venues-&-bookings/create-venue-dialog";

export default function VenuesPage() {
  const { club, setClub } = useContext(ClubContext) as ClubContextType;
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreatingVenue, setIsCreatingVenue] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [editingVenue, setEditingVenue] = useState<any | null>(null);
  const [isTogglingVenues, setIsTogglingVenues] = useState(false);
  const [showVenuesSettings, setShowVenuesSettings] = useState(false);
  const [search, setSearch] = useState("");
  const filteredVenues = venues.filter((venue: any) =>
    venue.venue_name.toLowerCase().includes(search.toLowerCase()),
  );

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
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create venue";
      setDialogError(errorMessage);
      console.error("Error creating venue:", err);
    } finally {
      setIsCreatingVenue(false);
    }
  };

  const handleToggleVenues = async (enabled: boolean) => {
    if (!club?.club_account_id) {
      setError("Club not found");
      return;
    }

    try {
      setError(null);
      setIsTogglingVenues(true);
      const response = await updateClubDetails({
        club_account_id: club.club_account_id,
        venues_enabled: enabled,
      });
      if (response?.message) {
        toast.success(
          enabled
            ? "Bookings enabled successfully"
            : "Bookings disabled successfully",
        );
        setClub({ ...club, venues_enabled: enabled });
      } else {
        toast.error("Failed to update bookings settings");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update venues setting";
      setError(errorMessage);
      toast.error(errorMessage);
      console.error("Error toggling venues:", err);
    } finally {
      setIsTogglingVenues(false);
    }
  };

  return (
    <div className="bg-gray-50 h-full">
      <div className="flex items-center justify-between bg-white border-b p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Venues Management
          </h1>
          <p className="text-muted-foreground">
            Manage your club's venues for bookings.
          </p>
        </div>
        <div className="flex gap-2">
          {club?.venues_enabled && (
            <Button
              onClick={() => setShowVenuesSettings(true)}
              variant="outline"
              size="sm"
              className="text-gray-600 hover:text-gray-900"
              title="Venues settings"
            >
              <Settings className="h-4 w-4" />
            </Button>
          )}
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
      </div>
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        {!club?.venues_enabled && (
          <Card className="mb-6 overflow-hidden border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 shadow-sm p-0">
            <CardContent className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-amber-300 bg-amber-100">
                  <AlertCircle className="h-4 w-4 text-amber-700" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-amber-950 sm:text-base">
                    Venues and Bookings are currently disabled
                  </p>
                  <p className="max-w-2xl text-sm leading-snug text-amber-800">
                    Enable your venues to make them visible to members and start
                    receiving bookings.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => handleToggleVenues(true)}
                className="w-full bg-amber-700 text-white hover:bg-amber-800 sm:w-auto"
                disabled={isTogglingVenues}
              >
                {isTogglingVenues ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enabling...
                  </>
                ) : (
                  "Enable Venues"
                )}
              </Button>
            </CardContent>
          </Card>
        )}

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
          <div className=" bg-white rounded-2xl border p-4">
            <div className="flex items-center mb-4 space-x-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search venues..."
                className="border rounded-lg px-4 py-2 w-full max-w-md text-sm bg-white"
              />
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredVenues.map((venue: any) => {
                const DAYS = [
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                  "Saturday",
                  "Sunday",
                ];
                const closedDays = venue.times
                  .filter((t: any) => t.is_closed)
                  .map((t: any) => DAYS[t.day_of_week]);
                const openDays = venue.times
                  .filter((t: any) => !t.is_closed)
                  .sort((a: any, b: any) => a.day_of_week - b.day_of_week);

                return (
                  <div
                    key={venue.venue_id}
                    className="rounded-lg border p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg">
                        {venue.venue_name}
                      </h3>
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
                        <span className="text-gray-600">
                          Minimum Booking Time:
                        </span>
                        <span className="font-medium">
                          {venue.smallest_booking_unit} min
                        </span>
                      </div>

                      {venue.max_daily_booking_time && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            Maximum Daily Booking Time:
                          </span>
                          <span className="font-medium">
                            {venue.max_daily_booking_time} min
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold">Operating Hours</h4>
                      {closedDays.length > 0 && (
                        <div className="text-xs">
                          <p className="text-gray-600">
                            Closed:{" "}
                            <span className="font-medium">
                              {closedDays.join(", ")}
                            </span>
                          </p>
                        </div>
                      )}
                      {openDays.length > 0 && (
                        <div className="text-xs space-y-1">
                          {openDays.map((time: any) => (
                            <p key={time.day_of_week} className="text-gray-600">
                              {DAYS[time.day_of_week]}:{" "}
                              <span className="font-medium">
                                {time.start_time} - {time.end_time}
                              </span>
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
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

        <Dialog open={showVenuesSettings} onOpenChange={setShowVenuesSettings}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Bookings Settings</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-semibold">
                    Enable Bookings
                  </Label>
                  <p className="text-sm text-gray-600 mt-1">
                    Toggle to enable or disable bookings for your venues
                  </p>
                </div>
                <Switch
                  checked={club?.venues_enabled || false}
                  onCheckedChange={handleToggleVenues}
                  disabled={isTogglingVenues}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => setShowVenuesSettings(false)}
                variant="outline"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
