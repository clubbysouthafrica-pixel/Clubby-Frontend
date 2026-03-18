import { useState, useEffect, useContext, useRef } from "react";
import { ChevronLeft, ChevronRight, AlertCircle, Loader2, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ClubContext, ClubContextType } from "@/context/ClubContext";
import { getVenues } from "@/services/admin-features/venues";
import { getBookings, removeBooking } from "@/services/admin-features/bookings";
import { updateClubDetails } from "@/services/admin/club";

export default function BookingsPage() {
  const { club, setClub } = useContext(ClubContext) as ClubContextType;
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(today.setDate(diff));
  });
  const [venues, setVenues] = useState<any[]>([]);
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);
  const timeSlotsRef = useRef<HTMLDivElement>(null);
  const [dragStart, setDragStart] = useState<{
    dayIdx: number;
    timeIdx: number;
  } | null>(null);
  const [dragEnd, setDragEnd] = useState<{
    dayIdx: number;
    timeIdx: number;
  } | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{
    dayIdx: number;
    startTimeIdx: number;
    endTimeIdx: number;
  } | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [bookingDialogError, setBookingDialogError] = useState<string | null>(null);
  const [bookingName, setBookingName] = useState("");
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<{
    isOpen: boolean;
    slotTime: number | null;
    bookingName: string | null;
  }>({ isOpen: false, slotTime: null, bookingName: null });
  const [isDeletingBooking, setIsDeletingBooking] = useState(false);
  const [isTogglingVenues, setIsTogglingVenues] = useState(false);
  const [showVenuesSettings, setShowVenuesSettings] = useState(false);

  const handleToggleVenues = async (enabled: boolean) => {
    if (!club?.club_account_id) return;

    try {
      setIsTogglingVenues(true);
      const response = await updateClubDetails({
        club_account_id: club.club_account_id,
        venues_enabled: enabled,
      });
      if (response?.message) {
        toast.success(
          enabled ? "Bookings enabled successfully" : "Bookings disabled successfully"
        );
        setClub({ ...club, venues_enabled: enabled });
      } else {
        toast.error("Failed to update bookings settings");
      }
    } catch (err: any) {
      toast.error(err.message || "Error updating bookings settings");
      console.error("Error toggling venues:", err);
    } finally {
      setIsTogglingVenues(false);
    }
  };

  useEffect(() => {
    if (!club?.club_account_id) return;

    const fetchVenues = async () => {
      try {
        setLoading(true);
        const response = await getVenues(club?.club_account_id);
        if (response.venues && response.venues.length > 0) {
          setVenues(response.venues);
          setSelectedVenueId(response.venues[0].venue_id);
        }
      } catch (error) {
        console.error("Failed to fetch venues:", error);
      } finally {
        setLoading(false);
      }
    };

    if (club?.club_account_id) {
      fetchVenues();
    }
  }, [club?.club_account_id]);

  useEffect(() => {
    if (!selectedVenueId) return;

    const fetchBookingsForWeek = async () => {
      try {
        // Calculate start time (beginning of current week)
        const weekStart = new Date(currentWeekStart);
        weekStart.setHours(0, 0, 0, 0);
        const startSlotTime = Math.floor(weekStart.getTime() / 1000);

        // Calculate end time (end of current week)
        const weekEnd = new Date(currentWeekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);
        weekEnd.setHours(0, 0, 0, 0);
        const endSlotTime = Math.floor(weekEnd.getTime() / 1000);

        const response = await getBookings(selectedVenueId, String(startSlotTime), String(endSlotTime));
        if (response.bookings) {
          setBookings(response.bookings);
        }
      } catch (error) {
        console.error("Failed to fetch bookings:", error);
      }
    };

    fetchBookingsForWeek();
  }, [selectedVenueId, currentWeekStart]);

  useEffect(() => {
    // Clear selected slot when switching venues
    setSelectedSlot(null);
    setIsDialogOpen(false);

    if (timeSlotsRef.current) {
      setTimeout(() => {
        if (timeSlotsRef.current) {
          // Calculate dynamic row height based on booking unit
          const bookingUnit = getBookingUnit();
          let rowHeight: number;

          if (bookingUnit === 15) rowHeight = 12;
          else if (bookingUnit === 30) rowHeight = 24;
          else if (bookingUnit === 45) rowHeight = 36;
          else rowHeight = 48;

          // Scroll to 8am position (8 hours * slots per hour * row height)
          const slotsPerHour = 60 / bookingUnit;
          const scrollPosition = 8 * slotsPerHour * rowHeight;
          timeSlotsRef.current.scrollTop = scrollPosition;
        }
      }, 0);
    }
  }, [selectedVenueId]);

  const getDaysInWeek = (startDate: Date): Date[] => {
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const getTodayWeekStart = (): Date => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(today.setDate(diff));
  };

  const canGoPrevious = (): boolean => {
    const todayWeekStart = getTodayWeekStart();
    return currentWeekStart.getTime() > todayWeekStart.getTime();
  };

  const isPastDay = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
  };

  const goToPreviousWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeekStart(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeekStart(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    setCurrentWeekStart(new Date(today.setDate(diff)));
  };

  const daysInWeek = getDaysInWeek(currentWeekStart);
  const dayNames = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  const formatWeekRange = (): string => {
    const endDate = new Date(daysInWeek[6]);
    return `${formatDate(currentWeekStart)} - ${formatDate(endDate)}`;
  };

  const getSelectedVenue = () => {
    return venues.find((v) => v.venue_id === selectedVenueId);
  };

  const getBookingUnit = () => {
    const venue = getSelectedVenue();
    return venue?.smallest_booking_unit || 60;
  };

  const getRowHeightClass = () => {
    const bookingUnit = getBookingUnit();
    if (bookingUnit === 15) return "min-h-3";
    if (bookingUnit === 30) return "min-h-6";
    if (bookingUnit === 45) return "min-h-9";
    return "min-h-12";
  };

  const shouldShowTimeLabel = (timeSlot: string) => {
    return timeSlot.endsWith(":00");
  };

  const generateTimeSlots = () => {
    const bookingUnit = getBookingUnit();
    const slots: string[] = [];
    const totalMinutes = 24 * 60;

    for (let minutes = 0; minutes < totalMinutes; minutes += bookingUnit) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      slots.push(
        `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`,
      );
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const getDaySchedule = (dayOfWeek: number) => {
    const venue = getSelectedVenue();
    if (!venue) return null;
    return venue.times.find((t: any) => t.day_of_week === dayOfWeek);
  };

  const isTimeInOperatingHours = (time: string, dayOfWeek: number): boolean => {
    const schedule = getDaySchedule(dayOfWeek);
    if (!schedule || schedule.is_closed) return false;

    const [timeHour, timeMin] = time.split(":").map(Number);
    const timeInMinutes = timeHour * 60 + timeMin;

    const [startHour, startMin] = schedule.start_time.split(":").map(Number);
    const startInMinutes = startHour * 60 + startMin;

    const [endHour, endMin] = schedule.end_time.split(":").map(Number);
    const endInMinutes = endHour * 60 + endMin;

    return timeInMinutes >= startInMinutes && timeInMinutes < endInMinutes;
  };

  const isDayClosedForVenue = (dayOfWeek: number): boolean => {
    const schedule = getDaySchedule(dayOfWeek);
    return schedule ? schedule.is_closed : false;
  };

  const isSlotBooked = (dayIdx: number, timeIdx: number): boolean => {
    const slotDate = new Date(daysInWeek[dayIdx]);
    const [slotHour, slotMin] = timeSlots[timeIdx].split(":").map(Number);
    slotDate.setHours(slotHour, slotMin, 0, 0);
    const slotTime = Math.floor(slotDate.getTime() / 1000);
    
    const slotDurationSeconds = getBookingUnit() * 60;
    const slotEndTime = slotTime + slotDurationSeconds;

    return bookings.some((booking) => {
      const bookingStart = booking.slot_time;
      const bookingEnd = booking.slot_time + (getBookingUnit() * 60);
      
      return slotTime < bookingEnd && slotEndTime > bookingStart;
    });
  };

  const getBookingNameForSlot = (dayIdx: number, timeIdx: number): string | null => {
    // Calculate the start time of this slot in epoch seconds
    const slotDate = new Date(daysInWeek[dayIdx]);
    const [slotHour, slotMin] = timeSlots[timeIdx].split(":").map(Number);
    slotDate.setHours(slotHour, slotMin, 0, 0);
    const slotTime = Math.floor(slotDate.getTime() / 1000);
    
    // Calculate the end time of this slot
    const slotDurationSeconds = getBookingUnit() * 60;
    const slotEndTime = slotTime + slotDurationSeconds;

    // Find booking that overlaps with this slot
    const booking = bookings.find((b) => {
      const bookingStart = b.slot_time;
      const bookingEnd = b.slot_time + (getBookingUnit() * 60);
      
      return slotTime < bookingEnd && slotEndTime > bookingStart;
    });

    return booking?.name || null;
  };

  const isSlotSelected = (dayIdx: number, timeIdx: number): boolean => {
    if (dragStart && dragEnd) {
      if (dragStart.dayIdx !== dayIdx) return false;

      const minTime = Math.min(dragStart.timeIdx, dragEnd.timeIdx);
      const maxTime = Math.max(dragStart.timeIdx, dragEnd.timeIdx);

      if (timeIdx >= minTime && timeIdx <= maxTime) return true;
    }

    if (selectedSlot) {
      if (selectedSlot.dayIdx !== dayIdx) return false;

      return (
        timeIdx >= selectedSlot.startTimeIdx &&
        timeIdx <= selectedSlot.endTimeIdx
      );
    }

    return false;
  };

  const handleSlotMouseDown = (dayIdx: number, timeIdx: number) => {
    const isPast = isPastDay(daysInWeek[dayIdx]);
    const isClosed = isDayClosedForVenue(dayIdx);
    const isAvailable = isTimeInOperatingHours(timeSlots[timeIdx], dayIdx);
    const isDisabled = isPast || isClosed || !isAvailable;

    if (!isDisabled) {
      setDragStart({ dayIdx, timeIdx });
      setDragEnd({ dayIdx, timeIdx });
    }
  };

  const handleSlotMouseEnter = (dayIdx: number, timeIdx: number) => {
    if (dragStart) {
      setDragEnd({ dayIdx, timeIdx });
    }
  };

  const handleSlotMouseUp = () => {
    if (dragStart && dragEnd) {
      const minTime = Math.min(dragStart.timeIdx, dragEnd.timeIdx);
      const maxTime = Math.max(dragStart.timeIdx, dragEnd.timeIdx);

      setSelectedSlot({
        dayIdx: dragStart.dayIdx,
        startTimeIdx: minTime,
        endTimeIdx: maxTime,
      });
      setIsDialogOpen(true);
    }
    setDragStart(null);
    setDragEnd(null);
  };

  useEffect(() => {
    if (dragStart || dragEnd || selectedSlot) {
      window.addEventListener("mouseup", handleSlotMouseUp);
      return () => window.removeEventListener("mouseup", handleSlotMouseUp);
    }
  }, [dragStart, dragEnd, selectedSlot]);

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      // Dialog is closing, clear the selection
      setSelectedSlot(null);
      setBookingDialogError(null);
      setBookingName("");
    }
  };

  const handleDeleteBooking = async () => {
    if (!deleteConfirmDialog.slotTime || !selectedVenueId) return;

    try {
      setIsDeletingBooking(true);
      await removeBooking({
        venue_id: selectedVenueId,
        slot_time: deleteConfirmDialog.slotTime,
      });

      // Refresh bookings after deletion
      const weekStart = new Date(currentWeekStart);
      weekStart.setHours(0, 0, 0, 0);
      const startSlotTime = Math.floor(weekStart.getTime() / 1000);

      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      weekEnd.setHours(0, 0, 0, 0);
      const endSlotTime = Math.floor(weekEnd.getTime() / 1000);

      const bookingsResponse = await getBookings(
        selectedVenueId,
        String(startSlotTime),
        String(endSlotTime)
      );
      if (bookingsResponse.bookings) {
        setBookings(bookingsResponse.bookings);
      }

      setDeleteConfirmDialog({ isOpen: false, slotTime: null, bookingName: null });
      toast.success("Booking deleted successfully!");
    } catch (error) {
      console.error("Failed to delete booking:", error);
      let errorMessage = "Failed to delete booking. Please try again.";

      if (error instanceof Error) {
        if (
          "response" in error &&
          error.response &&
          typeof error.response === "object" &&
          "data" in error.response
        ) {
          const data = error.response.data as any;
          if (data?.message) {
            errorMessage = data.message;
          } else {
            errorMessage = error.message;
          }
        } else {
          errorMessage = error.message;
        }
      }

      toast.error(errorMessage);
    } finally {
      setIsDeletingBooking(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bookings</h1>
          <p className="text-muted-foreground">
            Manage your club's bookings for venues.
          </p>
        </div>
        <Button
          onClick={() => setShowVenuesSettings(true)}
          variant="outline"
          size="sm"
          className="text-gray-600 hover:text-gray-900"
          title="Bookings settings"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      {!club?.venues_enabled && (
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardContent className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-semibold text-orange-900">
                  Bookings are currently disabled
                </p>
                <p className="text-sm text-orange-700">
                  Enable bookings to allow members to book your venues
                </p>
              </div>
            </div>
            <Button
              onClick={() => handleToggleVenues(true)}
              disabled={isTogglingVenues}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {isTogglingVenues ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enabling...
                </>
              ) : (
                "Enable Bookings"
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Venue Tabs */}
      {!loading && venues.length > 0 && (
        <div className="border rounded-lg bg-white overflow-hidden">
          <div className="flex border-b overflow-x-auto">
            {venues.map((venue) => (
              <button
                key={venue.venue_id}
                onClick={() => setSelectedVenueId(venue.venue_id)}
                className={`px-4 py-3 font-medium text-sm whitespace-nowrap transition-colors ${
                  selectedVenueId === venue.venue_id
                    ? "border-b-2 border-blue-500 text-blue-600 bg-blue-50"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {venue.venue_name}
              </button>
            ))}
          </div>

          {selectedVenueId && (
            <div className="p-4 space-y-4">
              {/* Week Navigation */}
              <div className="flex items-center justify-between bg-white border rounded-lg p-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousWeek}
                  disabled={!canGoPrevious()}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                <div className="text-center">
                  <p className="font-semibold text-lg">{formatWeekRange()}</p>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={goToToday}>
                    Today
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNextWeek}
                    className="gap-1"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden bg-white">
                <div className={`grid grid-cols-8 border-b bg-gray-50 ${getRowHeightClass()}`}>
                  <div className="border-r p-2 text-xs font-semibold text-gray-600 flex items-center justify-center">
                    Time
                  </div>
                  {daysInWeek.map((date, idx) => {
                    const isPast = isPastDay(date);
                    const isClosed = isDayClosedForVenue(idx);
                    return (
                      <div
                        key={idx}
                        className={`border-r p-3 text-center border-gray-200 flex items-center justify-center flex-col ${
                          isPast || isClosed ? "bg-gray-100 opacity-50" : ""
                        }`}
                      >
                        <p className="text-xs font-semibold text-gray-600">
                          {dayNames[idx]}
                        </p>
                        <p className="text-sm font-bold">{date.getDate()}</p>
                        {isClosed && (
                          <p className="text-xs text-gray-500">Closed</p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Time Slots */}
                <div
                  ref={timeSlotsRef}
                  className="max-h-[600px] overflow-y-auto"
                  onMouseLeave={() => setDragEnd(dragStart || dragEnd)}
                >
                  {timeSlots.map((time, timeIdx) => (
                    <div
                      key={time}
                      className={`grid grid-cols-8 border-b hover:bg-gray-50 transition-colors ${getRowHeightClass()}`}
                    >
                      <div className="border-r p-0 text-xs font-extrabold text-gray-600 bg-gray-50 relative flex items-start">
                        {shouldShowTimeLabel(time) ? (
                          <span className="bg-white px-1 relative z-10" style={{ marginTop: "-0.5rem" }}>
                            {time}
                          </span>
                        ) : (
                          ""
                        )}
                      </div>
                      {daysInWeek.map((date, dayIdx) => {
                        const isPast = isPastDay(date);
                        const isClosed = isDayClosedForVenue(dayIdx);
                        const isAvailable = isTimeInOperatingHours(
                          time,
                          dayIdx,
                        );
                        const isBooked = isSlotBooked(dayIdx, timeIdx);
                        const isDisabled = isPast || isClosed || !isAvailable || isBooked;
                        const isDragging = isSlotSelected(dayIdx, timeIdx);
                        const bookingName = isBooked ? getBookingNameForSlot(dayIdx, timeIdx) : null;

                        return (
                          <div
                            key={`${date}-${time}`}
                            onMouseDown={() => {
                              if (!isBooked) {
                                handleSlotMouseDown(dayIdx, timeIdx);
                              }
                            }}
                            onMouseEnter={() => {
                              if (!isBooked) {
                                handleSlotMouseEnter(dayIdx, timeIdx);
                              }
                            }}
                            onClick={() => {
                              if (isBooked && bookingName) {
                                // Open booking details dialog for booked slots
                                const slotDate = new Date(daysInWeek[dayIdx]);
                                const [slotHour, slotMin] = time.split(":").map(Number);
                                slotDate.setHours(slotHour, slotMin, 0, 0);
                                const slotTime = Math.floor(slotDate.getTime() / 1000);
                                
                                setDeleteConfirmDialog({
                                  isOpen: true,
                                  slotTime,
                                  bookingName,
                                });
                              } else if (isDisabled || !selectedSlot) {
                                setSelectedSlot(null);
                                setIsDialogOpen(false);
                              }
                            }}
                            className={`border-r border-gray-200 p-2 transition-colors relative group select-none flex items-center justify-center ${
                              isBooked
                                ? "bg-red-400 cursor-pointer hover:bg-red-500"
                                : isDisabled
                                  ? "bg-gray-200 opacity-50 cursor-default pointer-events-none"
                                  : dragStart
                                    ? "cursor-grabbing"
                                    : "cursor-pointer"
                            } ${isDragging ? "bg-blue-600 hover:bg-blue-600" : !isDisabled && !isBooked ? "hover:bg-blue-50" : ""}`}
                          >
                            {isBooked && bookingName && (
                              <div className="text-xs font-semibold text-white text-center truncate px-1 w-full h-full flex flex-col items-center justify-center">
                                <div>{time} - {timeIdx + 1 < timeSlots.length ? timeSlots[timeIdx + 1] : "23:59"}</div>
                                <div>{bookingName}</div>
                              </div>
                            )}
                            {!isDisabled && !isDragging && (
                              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-blue-100 transition-opacity" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-xs text-gray-600">
                Drag across time slots to create a booking
              </div>
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="text-center py-8 text-gray-500">Loading venues...</div>
      )}

      {!loading && venues.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No venues found.{" "}
          <a href="/venues" className="text-blue-600 hover:underline">
            Create a venue
          </a>{" "}
          to get started.
        </div>
      )}

      {/* Create Booking Dialog */}
      {selectedSlot && (
        <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Booking</DialogTitle>
              <DialogDescription>
                {dayNames[selectedSlot.dayIdx]}, {daysInWeek[selectedSlot.dayIdx].getDate()}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="booking-name" className="text-sm">Booking Name</Label>
                <Input
                  id="booking-name"
                  placeholder="Enter booking name"
                  value={bookingName}
                  onChange={(e) => setBookingName(e.target.value)}
                  className="mt-1 h-8"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="space-y-2">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Time:</span> {timeSlots[selectedSlot.startTimeIdx]} - {selectedSlot.endTimeIdx + 1 < timeSlots.length ? timeSlots[selectedSlot.endTimeIdx + 1] : "23:59"}
                  </p>
                  <p className="text-xs text-gray-600">
                    <span className="font-semibold">Duration:</span> {((selectedSlot.endTimeIdx - selectedSlot.startTimeIdx + 1) * getBookingUnit())} minutes
                  </p>
                </div>
              </div>

              {bookingDialogError && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">
                  {bookingDialogError}
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDialogClose(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={isCreatingBooking}
                  onClick={async () => {
                    const venue = getSelectedVenue();
                    const bookingDurationMinutes = (selectedSlot.endTimeIdx - selectedSlot.startTimeIdx + 1) * getBookingUnit();

                    if (venue?.max_daily_booking_time && bookingDurationMinutes > venue.max_daily_booking_time) {
                      const maxHours = Math.floor(venue.max_daily_booking_time / 60);
                      const maxMinutes = venue.max_daily_booking_time % 60;
                      setBookingDialogError(
                        `Booking duration (${Math.floor(bookingDurationMinutes / 60)}h ${bookingDurationMinutes % 60}m) exceeds maximum daily booking time (${maxHours}h ${maxMinutes}m)`
                      );
                      return;
                    }

                    // Calculate start time in epoch seconds
                    const bookingDate = new Date(daysInWeek[selectedSlot.dayIdx]);
                    const [startHour, startMinute] = timeSlots[selectedSlot.startTimeIdx].split(":").map(Number);
                    bookingDate.setHours(startHour, startMinute, 0, 0);

                    try {
                      setIsCreatingBooking(true);
                      
                      // Refresh bookings for the week
                      const weekStart = new Date(currentWeekStart);
                      weekStart.setHours(0, 0, 0, 0);
                      const startSlotTime = Math.floor(weekStart.getTime() / 1000);

                      const weekEnd = new Date(currentWeekStart);
                      weekEnd.setDate(weekEnd.getDate() + 7);
                      weekEnd.setHours(0, 0, 0, 0);
                      const endSlotTime = Math.floor(weekEnd.getTime() / 1000);

                      const bookingsResponse = await getBookings(selectedVenueId!, String(startSlotTime), String(endSlotTime));
                      if (bookingsResponse.bookings) {
                        setBookings(bookingsResponse.bookings);
                      }
                      
                      handleDialogClose(false);
                    } catch (error) {
                      console.error("Failed to create booking:", error);
                      let errorMessage = "Failed to create booking. Please try again.";
                      
                      if (error instanceof Error) {
                        // Check if it's an axios error with response data
                        if ("response" in error && error.response && typeof error.response === "object" && "data" in error.response) {
                          const data = error.response.data as any;
                          if (data?.message) {
                            errorMessage = data.message;
                          } else {
                            errorMessage = error.message;
                          }
                        } else {
                          errorMessage = error.message;
                        }
                      }
                      
                      setBookingDialogError(errorMessage);
                    } finally {
                      setIsCreatingBooking(false);
                    }
                  }}
                >
                  {isCreatingBooking ? "Creating..." : "Create Booking"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Booking Confirmation Dialog */}
      <Dialog open={deleteConfirmDialog.isOpen} onOpenChange={(open) => {
        if (!open) {
          setDeleteConfirmDialog({ isOpen: false, slotTime: null, bookingName: null });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
          </DialogHeader>
          {deleteConfirmDialog.bookingName && deleteConfirmDialog.slotTime && (
            <>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Booking Name</label>
                  <p className="mt-1 text-sm text-gray-900">{deleteConfirmDialog.bookingName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Time Slot</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(deleteConfirmDialog.slotTime * 1000).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 justify-end mt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDeleteConfirmDialog({ isOpen: false, slotTime: null, bookingName: null });
                  }}
                  disabled={isDeletingBooking}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteBooking}
                  disabled={isDeletingBooking}
                >
                  {isDeletingBooking ? "Deleting..." : "Delete Booking"}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showVenuesSettings} onOpenChange={setShowVenuesSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bookings Settings</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-semibold">Enable Bookings</Label>
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
  );
}
