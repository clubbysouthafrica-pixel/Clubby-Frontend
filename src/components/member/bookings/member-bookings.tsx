import {
  useState,
  useEffect,
  useRef,
  useLayoutEffect,
  useCallback,
  useMemo,
} from "react";
import { ChevronLeft, ChevronRight, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { createBooking, getBookings } from "@/services/bookings";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

interface VenueSchedule {
  day_of_week: number;
  is_closed: boolean;
  start_time: string;
  end_time: string;
}

interface Venue {
  venue_id: string;
  venue_name: string;
  smallest_booking_unit?: number;
  max_daily_booking_time?: number;
  times: VenueSchedule[];
}

interface Booking {
  slot_time: number;
  name?: string;
}

interface MemberBookingsProps {
  venues: Venue[];
  loading: boolean;
  error: string | null;
  memberName?: string;
}

type BookingViewMode = "calendar" | "availability";

function formatWeekday(date: Date, weekday: "short" | "long" = "short") {
  return new Intl.DateTimeFormat("en-US", { weekday }).format(date);
}

function getVenueDayOfWeek(date: Date) {
  return (date.getDay() + 6) % 7;
}

function abbreviateBookingName(name: string) {
  const normalizedName = name.trim();

  if (!normalizedName) {
    return "Booked";
  }

  const nameParts = normalizedName.split(/\s+/).filter(Boolean);

  if (nameParts.length === 1) {
    return normalizedName.length > 12
      ? `${normalizedName.slice(0, 12)}...`
      : normalizedName;
  }

  const [firstName, ...rest] = nameParts;
  const surname = rest[rest.length - 1] || "";
  return `${firstName} ${surname.charAt(0)}.`.trim();
}

function normalizeBookingName(name: string) {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

function formatSlotRange(timeSlots: string[], timeIdx: number) {
  const startTime = timeSlots[timeIdx];
  const endTime =
    timeIdx + 1 < timeSlots.length ? timeSlots[timeIdx + 1] : "23:59";

  return `${startTime} - ${endTime}`;
}

export default function MemberBookings({
  venues,
  loading,
  error,
  memberName = "",
}: MemberBookingsProps) {
  const isMobile = useIsMobile();
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [hasInitialScrolled, setHasInitialScrolled] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{
    dayIdx: number;
    startTimeIdx: number;
    endTimeIdx: number;
  } | null>(null);
  const [selectionAnchor, setSelectionAnchor] = useState<{
    dayIdx: number;
    timeIdx: number;
  } | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [bookingDialogError, setBookingDialogError] = useState<string | null>(
    null,
  );
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);
  const [bookingName, setBookingName] = useState(memberName);
  const [bookingViewMode, setBookingViewMode] =
    useState<BookingViewMode>("availability");
  const timeSlotsRef = useRef<HTMLDivElement>(null);

  const getDaysInWeek = () => {
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const daysInWeek = getDaysInWeek();
  const visibleDayCount = bookingViewMode === "availability" ? 5 : 7;
  const visibleDays = daysInWeek.slice(0, visibleDayCount);

  useEffect(() => {
    if (venues.length > 0 && !selectedVenueId) {
      setSelectedVenueId(venues[0].venue_id);
    }
  }, [venues, selectedVenueId]);

  useEffect(() => {
    if (bookingsLoading) {
      setBookings([]);
    }
  }, [bookingsLoading]);

  useEffect(() => {
    // Reset initial scroll flag when venue changes
    setHasInitialScrolled(false);
  }, [selectedVenueId]);

  useEffect(() => {
    if (bookingViewMode === "calendar") {
      setHasInitialScrolled(false);
    }
  }, [bookingViewMode]);

  useLayoutEffect(() => {
    // Scroll to 8am when the calendar view becomes active, don't wait for bookings
    if (
      timeSlotsRef.current &&
      !hasInitialScrolled &&
      selectedVenueId &&
      bookingViewMode === "calendar"
    ) {
      const selectedVenue = venues.find(
        (venue) => venue.venue_id === selectedVenueId,
      );
      const bookingUnit = selectedVenue?.smallest_booking_unit || 60;
      let rowHeight: number;

      if (bookingUnit === 15) rowHeight = 12;
      else if (bookingUnit === 30) rowHeight = 24;
      else if (bookingUnit === 45) rowHeight = 36;
      else rowHeight = 48;

      const slotsPerHour = 60 / bookingUnit;
      const scrollPosition = 8 * slotsPerHour * rowHeight;
      timeSlotsRef.current.scrollTop = scrollPosition;
      setHasInitialScrolled(true);
    }
  }, [bookingViewMode, selectedVenueId, hasInitialScrolled, venues]);

  useEffect(() => {
    if (!selectedVenueId) return;

    const fetchBookingsForWeek = async () => {
      try {
        setBookingsLoading(true);
        const weekStart = new Date(currentWeekStart);
        weekStart.setHours(0, 0, 0, 0);
        const startSlotTime = Math.floor(weekStart.getTime() / 1000);

        const weekEnd = new Date(currentWeekStart);
        weekEnd.setDate(weekEnd.getDate() + visibleDayCount);
        weekEnd.setHours(0, 0, 0, 0);
        const endSlotTime = Math.floor(weekEnd.getTime() / 1000);

        const response = await getBookings(
          selectedVenueId,
          String(startSlotTime),
          String(endSlotTime),
        );
        if (response.bookings) {
          setBookings(response.bookings);
        }
      } catch (error) {
        console.error("Failed to fetch bookings:", error);
      } finally {
        setBookingsLoading(false);
      }
    };

    fetchBookingsForWeek();
  }, [selectedVenueId, currentWeekStart, visibleDayCount]);

  const getSelectedVenue = useCallback(() => {
    return venues.find((v) => v.venue_id === selectedVenueId);
  }, [venues, selectedVenueId]);

  const getBookingUnit = useCallback(() => {
    const venue = getSelectedVenue();
    return venue?.smallest_booking_unit || 60;
  }, [getSelectedVenue]);

  const getRowHeightClass = () => {
    const bookingUnit = getBookingUnit();
    if (bookingUnit === 15) return "min-h-3";
    if (bookingUnit === 30) return "min-h-6";
    if (bookingUnit === 45) return "min-h-9";
    return "min-h-12";
  };

  const validateSelectionDuration = useCallback(
    (
      dayIdx: number,
      startTimeIdx: number,
      endTimeIdx: number,
    ): { isValid: boolean; error?: string } => {
      const venue = getSelectedVenue();
      if (!venue?.max_daily_booking_time) {
        return { isValid: true };
      }

      const durationMinutes =
        (endTimeIdx - startTimeIdx + 1) * getBookingUnit();
      const maxDurationMinutes = venue.max_daily_booking_time;
      const currentMemberNormalizedName = normalizeBookingName(
        memberName || bookingName,
      );

      const existingBookedMinutes = currentMemberNormalizedName
        ? bookings.reduce((totalMinutes, booking) => {
            if (
              normalizeBookingName(booking.name || "") !==
              currentMemberNormalizedName
            ) {
              return totalMinutes;
            }

            const bookingDate = new Date(booking.slot_time * 1000);
            const selectedDate = new Date(daysInWeek[dayIdx]);

            if (
              bookingDate.getFullYear() !== selectedDate.getFullYear() ||
              bookingDate.getMonth() !== selectedDate.getMonth() ||
              bookingDate.getDate() !== selectedDate.getDate()
            ) {
              return totalMinutes;
            }

            return totalMinutes + getBookingUnit();
          }, 0)
        : 0;

      const totalDurationMinutes = existingBookedMinutes + durationMinutes;

      if (totalDurationMinutes > maxDurationMinutes) {
        const maxHours = Math.floor(maxDurationMinutes / 60);
        const maxMins = maxDurationMinutes % 60;
        const selectedHours = Math.floor(durationMinutes / 60);
        const selectedMins = durationMinutes % 60;
        const existingHours = Math.floor(existingBookedMinutes / 60);
        const existingMins = existingBookedMinutes % 60;
        const totalHours = Math.floor(totalDurationMinutes / 60);
        const totalMins = totalDurationMinutes % 60;

        return {
          isValid: false,
          error:
            existingBookedMinutes > 0
              ? `Daily maximum exceeded (${existingHours}h ${existingMins}m already booked + ${selectedHours}h ${selectedMins}m selected = ${totalHours}h ${totalMins}m; max ${maxHours}h ${maxMins}m)`
              : `Selection exceeds maximum (${selectedHours}h ${selectedMins}m > ${maxHours}h ${maxMins}m)`,
        };
      }

      return { isValid: true };
    },
    [
      bookingName,
      bookings,
      daysInWeek,
      getBookingUnit,
      getSelectedVenue,
      memberName,
    ],
  );

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

  const getDaySchedule = useCallback(
    (date: Date) => {
      const venue = getSelectedVenue();
      if (!venue) return null;
      const dayOfWeek = getVenueDayOfWeek(date);
      return venue.times.find((t) => t.day_of_week === dayOfWeek);
    },
    [getSelectedVenue],
  );

  const isTimeInOperatingHours = useCallback(
    (time: string, date: Date): boolean => {
      const schedule = getDaySchedule(date);
      if (!schedule || schedule.is_closed) return false;

      const [timeHour, timeMin] = time.split(":").map(Number);
      const timeInMinutes = timeHour * 60 + timeMin;

      const [startHour, startMin] = schedule.start_time.split(":").map(Number);
      const startInMinutes = startHour * 60 + startMin;

      const [endHour, endMin] = schedule.end_time.split(":").map(Number);
      const endInMinutes = endHour * 60 + endMin;

      return timeInMinutes >= startInMinutes && timeInMinutes < endInMinutes;
    },
    [getDaySchedule],
  );

  const isDayClosedForVenue = useCallback(
    (date: Date): boolean => {
      const schedule = getDaySchedule(date);
      return schedule ? schedule.is_closed : false;
    },
    [getDaySchedule],
  );

  const isPastDay = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isSlotBooked = useCallback(
    (dayIdx: number, timeIdx: number): boolean => {
      const slotDate = new Date(daysInWeek[dayIdx]);
      const [slotHour, slotMin] = timeSlots[timeIdx].split(":").map(Number);
      slotDate.setHours(slotHour, slotMin, 0, 0);
      const slotTime = Math.floor(slotDate.getTime() / 1000);

      const slotDurationSeconds = getBookingUnit() * 60;
      const slotEndTime = slotTime + slotDurationSeconds;

      return bookings.some((booking) => {
        const bookingStart = booking.slot_time;
        const bookingEnd = booking.slot_time + getBookingUnit() * 60;

        return slotTime < bookingEnd && slotEndTime > bookingStart;
      });
    },
    [bookings, daysInWeek, getBookingUnit, timeSlots],
  );

  const getBookingNameForSlot = (
    dayIdx: number,
    timeIdx: number,
  ): string | null => {
    const slotDate = new Date(daysInWeek[dayIdx]);
    const [slotHour, slotMin] = timeSlots[timeIdx].split(":").map(Number);
    slotDate.setHours(slotHour, slotMin, 0, 0);
    const slotTime = Math.floor(slotDate.getTime() / 1000);

    const slotDurationSeconds = getBookingUnit() * 60;
    const slotEndTime = slotTime + slotDurationSeconds;

    const booking = bookings.find((b) => {
      const bookingStart = b.slot_time;
      const bookingEnd = b.slot_time + getBookingUnit() * 60;

      return slotTime < bookingEnd && slotEndTime > bookingStart;
    });

    return booking?.name || null;
  };

  const isSlotDisabled = useCallback(
    (dayIdx: number, timeIdx: number): boolean => {
      const date = daysInWeek[dayIdx];
      const isPast = isPastDay(date);
      const isClosed = isDayClosedForVenue(date);
      const isAvailable = isTimeInOperatingHours(timeSlots[timeIdx], date);
      const isBooked = isSlotBooked(dayIdx, timeIdx);

      return isPast || isClosed || !isAvailable || isBooked;
    },
    [
      daysInWeek,
      isDayClosedForVenue,
      isSlotBooked,
      isTimeInOperatingHours,
      timeSlots,
    ],
  );

  const formatWeekRange = () => {
    const startDate = visibleDays[0];
    const endDate = visibleDays[visibleDays.length - 1];
    const startMonth = startDate.toLocaleDateString("en-US", {
      month: "short",
    });
    const endMonth = endDate.toLocaleDateString("en-US", { month: "short" });

    if (startMonth === endMonth) {
      return `${startMonth} ${startDate.getDate()} - ${endDate.getDate()}, ${endDate.getFullYear()}`;
    }
    return `${startMonth} ${startDate.getDate()} - ${endMonth} ${endDate.getDate()}, ${endDate.getFullYear()}`;
  };

  const goToPreviousWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() - visibleDayCount);
    setCurrentWeekStart(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + visibleDayCount);
    setCurrentWeekStart(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setCurrentWeekStart(today);
  };

  const canGoPrevious = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return currentWeekStart > today;
  };

  const isSlotSelected = (dayIdx: number, timeIdx: number): boolean => {
    if (selectedSlot) {
      if (selectedSlot.dayIdx !== dayIdx) return false;

      return (
        timeIdx >= selectedSlot.startTimeIdx &&
        timeIdx <= selectedSlot.endTimeIdx
      );
    }

    return false;
  };

  const createRangeSelection = useCallback(
    (dayIdx: number, startTimeIdx: number, endTimeIdx: number) => {
      const minTime = Math.min(startTimeIdx, endTimeIdx);
      const maxTime = Math.max(startTimeIdx, endTimeIdx);

      for (let timeIdx = minTime; timeIdx <= maxTime; timeIdx += 1) {
        if (isSlotDisabled(dayIdx, timeIdx)) {
          return {
            selection: null,
            error: "Selection can only include available, unbooked slots.",
          };
        }
      }

      const validation = validateSelectionDuration(dayIdx, minTime, maxTime);
      if (!validation.isValid) {
        return {
          selection: null,
          error: validation.error || "Invalid slot selection.",
        };
      }

      return {
        selection: {
          dayIdx,
          startTimeIdx: minTime,
          endTimeIdx: maxTime,
        },
        error: null,
      };
    },
    [isSlotDisabled, validateSelectionDuration],
  );

  const applySelection = useCallback(
    (dayIdx: number, startTimeIdx: number, endTimeIdx: number) => {
      const { selection, error } = createRangeSelection(
        dayIdx,
        startTimeIdx,
        endTimeIdx,
      );

      setSelectionError(error);

      if (selection) {
        setSelectedSlot(selection);
        return true;
      }

      return false;
    },
    [createRangeSelection],
  );

  const clearSelection = () => {
    setSelectedSlot(null);
    setSelectionAnchor(null);
    setSelectionError(null);
    setIsDialogOpen(false);
  };

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      clearSelection();
      setBookingDialogError(null);
      setBookingName(memberName);
    }
  };

  useEffect(() => {
    setBookingName(memberName);
  }, [memberName]);

  useEffect(() => {
    setSelectedSlot(null);
    setSelectionAnchor(null);
    setSelectionError(null);
    setIsDialogOpen(false);
    setBookingDialogError(null);
  }, [bookingViewMode, currentWeekStart, selectedVenueId]);

  const handleSelectableSlotClick = (dayIdx: number, timeIdx: number) => {
    const isDisabled = isSlotDisabled(dayIdx, timeIdx);

    if (isDisabled) {
      clearSelection();
      return;
    }

    if (!selectedSlot) {
      setSelectionAnchor({ dayIdx, timeIdx });
      applySelection(dayIdx, timeIdx, timeIdx);
      return;
    }

    if (selectedSlot.dayIdx !== dayIdx) {
      setSelectionAnchor({ dayIdx, timeIdx });
      applySelection(dayIdx, timeIdx, timeIdx);
      return;
    }

    const anchorTimeIdx = selectionAnchor?.timeIdx ?? selectedSlot.startTimeIdx;
    if (!selectionAnchor || selectionAnchor.dayIdx !== dayIdx) {
      setSelectionAnchor({ dayIdx, timeIdx });
      applySelection(dayIdx, timeIdx, timeIdx);
      return;
    }

    applySelection(dayIdx, anchorTimeIdx, timeIdx);
  };

  const selectedSlotSummary = selectedSlot
    ? `${formatWeekday(daysInWeek[selectedSlot.dayIdx])} ${daysInWeek[selectedSlot.dayIdx].getDate()} • ${timeSlots[selectedSlot.startTimeIdx]} - ${
        selectedSlot.endTimeIdx + 1 < timeSlots.length
          ? timeSlots[selectedSlot.endTimeIdx + 1]
          : "23:59"
      }`
    : null;

  const visibleSlotIndicesByDay = useMemo(
    () =>
      visibleDays.map((date) =>
        timeSlots.reduce<number[]>((indices, _time, timeIdx) => {
          const isPast = isPastDay(date);
          const isClosed = isDayClosedForVenue(date);
          const isAvailable = isTimeInOperatingHours(timeSlots[timeIdx], date);

          if (!isPast && !isClosed && isAvailable) {
            indices.push(timeIdx);
          }

          return indices;
        }, []),
      ),
    [
      isDayClosedForVenue,
      isTimeInOperatingHours,
      timeSlots,
      visibleDays,
    ],
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (venues.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="rounded-md bg-gray-50 p-4 text-center text-sm text-gray-700">
            No venues are currently available for booking.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {selectedSlot && (
        <div className="fixed top-4 left-1/2 z-50 w-[calc(100vw-1.5rem)] max-w-5xl -translate-x-1/2">
          <div className="relative flex flex-col gap-3 rounded-2xl border-[3px] border-blue-500 bg-white/95 px-4 py-3 shadow-xl ring-2 ring-blue-200/80 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={clearSelection}
              aria-label="Close booking selection"
              className="absolute right-3 top-3 rounded-full p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
                Booking Selection
              </p>
              <p className="truncate text-sm font-semibold text-gray-900 sm:text-base">
                {selectedSlotSummary}
              </p>
              {selectionError ? (
                <p className="mt-1 text-xs text-orange-700">{selectionError}</p>
              ) : (
                <p className="mt-1 text-xs text-gray-600">
                  Continue when you are happy with the selected booking range.
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 sm:flex-shrink-0 mr-10">
              <Button variant="outline" size="sm" onClick={clearSelection}>
                Clear
              </Button>
              <Button
                size="sm"
                onClick={() => setIsDialogOpen(true)}
                disabled={!!selectionError}
              >
                Create Booking
              </Button>
            </div>
          </div>
        </div>
      )}

      {selectedVenueId && (
        <div className="overflow-hidden rounded-lg border bg-white">
          <div className="flex overflow-x-auto border-b bg-white">
            {venues.map((venue) => (
              <button
                key={venue.venue_id}
                onClick={() => {
                  setSelectedVenueId(venue.venue_id);
                  setBookings([]);
                }}
                className={`whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors ${
                  selectedVenueId === venue.venue_id
                    ? "border-b-2 border-blue-500 bg-blue-50 text-blue-600"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                {venue.venue_name}
              </button>
            ))}
          </div>

          <div className="space-y-4 p-4">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">
                {getSelectedVenue()?.venue_name}
              </h3>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={
                  bookingViewMode === "availability" ? "default" : "outline"
                }
                onClick={() => setBookingViewMode("availability")}
                className={
                  bookingViewMode === "availability"
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : ""
                }
              >
                Available Blocks
              </Button>
              <Button
                type="button"
                variant={bookingViewMode === "calendar" ? "default" : "outline"}
                onClick={() => setBookingViewMode("calendar")}
                className={
                  bookingViewMode === "calendar"
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : ""
                }
              >
                Calendar View
              </Button>
            </div>

            <div className="flex flex-col gap-3 rounded-lg border bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousWeek}
                disabled={!canGoPrevious()}
                className="gap-1 w-full sm:w-auto"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="sm:inline">Previous</span>
              </Button>

              <div className="order-first text-center sm:order-none">
                <p className="break-words text-center text-sm font-semibold sm:text-lg">
                  {formatWeekRange()}
                </p>
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToToday}
                  className="flex-1 sm:flex-none"
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextWeek}
                  className="gap-1 flex-1 sm:flex-none"
                >
                  <span className="sm:inline">Next</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {bookingViewMode === "calendar" ? (
              <div className="overflow-hidden rounded-lg border bg-white">
                <div
                  className={`grid border-b bg-gray-50 ${getRowHeightClass()}`}
                  style={{
                    gridTemplateColumns: `80px repeat(${visibleDays.length}, minmax(0, 1fr))`,
                  }}
                >
                  <div className="flex items-center justify-center border-r p-2 text-xs font-semibold text-gray-600">
                    Time
                  </div>
                  {visibleDays.map((date, idx) => {
                    const isPast = isPastDay(date);
                    const isClosed = isDayClosedForVenue(date);

                    return (
                      <div
                        key={idx}
                        className={`flex flex-col items-center justify-center border-r border-gray-200 p-3 text-center ${
                          isPast || isClosed ? "bg-gray-100 opacity-50" : ""
                        }`}
                      >
                        <p className="text-xs font-semibold text-gray-600">
                          {formatWeekday(date)}
                        </p>
                        <p className="text-sm font-bold">{date.getDate()}</p>
                        {isClosed && (
                          <p className="text-xs text-gray-500">Closed</p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {isMobile && (
                  <Button
                    onClick={() => {
                      if (timeSlotsRef.current) {
                        timeSlotsRef.current.scrollBy({
                          top: -100,
                          behavior: "smooth",
                        });
                      }
                    }}
                    className="w-full rounded-none border-b bg-blue-100 py-2 font-semibold text-blue-700 hover:bg-blue-200"
                  >
                    <ChevronLeft className="h-5 w-5 rotate-90" />
                  </Button>
                )}

                <div
                  ref={timeSlotsRef}
                  className="max-h-[600px] overflow-y-auto"
                >
                  {timeSlots.map((time, timeIdx) => (
                    <div
                      key={time}
                      className={`grid border-b transition-all hover:border-t-2 hover:border-t-blue-300 hover:bg-gray-50 hover:shadow-sm ${getRowHeightClass()}`}
                      style={{
                        gridTemplateColumns: `80px repeat(${visibleDays.length}, minmax(0, 1fr))`,
                      }}
                    >
                      <div className="relative flex items-start border-r bg-gray-50 p-0 text-xs font-extrabold text-gray-600">
                        {shouldShowTimeLabel(time) ? (
                          <span
                            className="relative z-10 bg-white px-1"
                            style={{ marginTop: "-0.5rem" }}
                          >
                            {time}
                          </span>
                        ) : (
                          ""
                        )}
                      </div>
                      {visibleDays.map((date, dayIdx) => {
                        const isPast = isPastDay(date);
                        const isClosed = isDayClosedForVenue(date);
                        const isAvailable = isTimeInOperatingHours(time, date);
                        const isBooked = isSlotBooked(dayIdx, timeIdx);
                        const isDisabled =
                          isPast || isClosed || !isAvailable || isBooked;
                        const isDragging = isSlotSelected(dayIdx, timeIdx);
                        const bookingName = isBooked
                          ? getBookingNameForSlot(dayIdx, timeIdx)
                          : null;

                        return (
                          <div
                            key={`${dayIdx}-${timeIdx}`}
                            data-day-idx={dayIdx}
                            data-time-idx={timeIdx}
                            onClick={() =>
                              handleSelectableSlotClick(dayIdx, timeIdx)
                            }
                            className={`relative flex items-center justify-center border-r border-gray-200 p-2 transition-colors group select-none ${
                              isBooked
                                ? "cursor-default pointer-events-none bg-red-500"
                                : isDisabled
                                  ? "cursor-default pointer-events-none bg-gray-200 opacity-50"
                                  : "cursor-pointer"
                            } ${
                              isDragging
                                ? "bg-blue-600 hover:bg-blue-600"
                                : !isDisabled
                                  ? "hover:bg-blue-50"
                                  : ""
                            }`}
                          >
                            {isBooked && bookingName && (
                              <div className="truncate px-1 text-center text-xs font-semibold text-white">
                                <div>{bookingName}</div>
                              </div>
                            )}
                            {!isDisabled && !isDragging && (
                              <div className="absolute inset-0 bg-blue-100 opacity-0 transition-opacity group-hover:opacity-100" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>

                {isMobile && (
                  <Button
                    onClick={() => {
                      if (timeSlotsRef.current) {
                        timeSlotsRef.current.scrollBy({
                          top: 100,
                          behavior: "smooth",
                        });
                      }
                    }}
                    className="w-full rounded-none border-t bg-blue-100 py-2 font-semibold text-blue-700 hover:bg-blue-200"
                  >
                    <ChevronLeft className="h-5 w-5 -rotate-90" />
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid gap-3 lg:grid-cols-5 sm:grid-cols-2">
                {visibleDays.map((date, dayIdx) => {
                  const visibleSlotIndices =
                    visibleSlotIndicesByDay[dayIdx] || [];
                  const isClosed = isDayClosedForVenue(date);

                  return (
                    <div
                      key={date.toISOString()}
                      className="rounded-lg border bg-white p-3"
                    >
                      <div className="mb-3 border-b pb-3 text-center">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                          {formatWeekday(date)}
                        </p>
                        <p className="mt-1 text-lg font-semibold text-gray-900">
                          {date.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>

                      {isClosed ? (
                        <div className="rounded-md bg-gray-50 px-3 py-6 text-center text-sm text-gray-500">
                          Closed
                        </div>
                      ) : visibleSlotIndices.length === 0 ? (
                        <div className="rounded-md bg-gray-50 px-3 py-6 text-center text-sm text-gray-500">
                          No booking blocks available
                        </div>
                      ) : (
                        <TooltipProvider>
                          <div className="grid grid-cols-2 gap-2">
                            {visibleSlotIndices.map((timeIdx: number) => {
                              const isSelected = isSlotSelected(
                                dayIdx,
                                timeIdx,
                              );
                              const isBooked = isSlotBooked(dayIdx, timeIdx);
                              const bookingName = isBooked
                                ? getBookingNameForSlot(dayIdx, timeIdx)
                                : null;

                              const block = (
                                <button
                                  key={`${dayIdx}-${timeIdx}`}
                                  type="button"
                                  onClick={() =>
                                    handleSelectableSlotClick(dayIdx, timeIdx)
                                  }
                                  disabled={isBooked}
                                  className={`rounded-md border px-2 py-2 text-xs font-medium transition-colors ${
                                    isSelected
                                      ? "border-blue-600 bg-blue-600 text-white"
                                      : isBooked
                                        ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                                        : "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                                  }`}
                                >
                                  <div className="flex flex-col items-center gap-0.5 leading-tight">
                                    <span>
                                      {formatSlotRange(timeSlots, timeIdx)}
                                    </span>
                                    {isBooked && bookingName && (
                                      <span className="max-w-full truncate text-[10px] font-semibold text-gray-500">
                                        {abbreviateBookingName(bookingName)}
                                      </span>
                                    )}
                                  </div>
                                </button>
                              );

                              if (!isBooked || !bookingName) {
                                return block;
                              }

                              return (
                                <Tooltip key={`${dayIdx}-${timeIdx}`}>
                                  <TooltipTrigger asChild>
                                    {block}
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{bookingName}</p>
                                  </TooltipContent>
                                </Tooltip>
                              );
                            })}
                          </div>
                        </TooltipProvider>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="text-xs text-gray-600">
              {bookingViewMode === "availability" ? (
                <>
                  {isMobile
                    ? "Tap available blocks one by one to build your booking range"
                    : "Click available blocks one by one to build your booking range"}
                </>
              ) : (
                <>
                  {isMobile
                    ? "Tap available slots one by one to build your booking range"
                    : "Click available slots one by one to build your booking range"}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Booking Dialog */}
      {selectedSlot && (
        <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Booking</DialogTitle>
              <DialogDescription>
                {formatWeekday(daysInWeek[selectedSlot.dayIdx], "long")},{" "}
                {daysInWeek[selectedSlot.dayIdx].getDate()}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="booking-name" className="text-sm">
                  Booking name
                </Label>
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
                    <span className="font-semibold">Time:</span>{" "}
                    {timeSlots[selectedSlot.startTimeIdx]} -{" "}
                    {selectedSlot.endTimeIdx + 1 < timeSlots.length
                      ? timeSlots[selectedSlot.endTimeIdx + 1]
                      : "23:59"}
                  </p>
                  <p className="text-xs text-gray-600">
                    <span className="font-semibold">Duration:</span>{" "}
                    {(selectedSlot.endTimeIdx - selectedSlot.startTimeIdx + 1) *
                      getBookingUnit()}{" "}
                    minutes
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
                    const bookingDurationMinutes =
                      (selectedSlot.endTimeIdx -
                        selectedSlot.startTimeIdx +
                        1) *
                      getBookingUnit();
                    const currentMemberNormalizedName = normalizeBookingName(
                      memberName || bookingName,
                    );
                    const existingBookedMinutes = currentMemberNormalizedName
                      ? bookings.reduce((totalMinutes, booking) => {
                          if (
                            normalizeBookingName(booking.name || "") !==
                            currentMemberNormalizedName
                          ) {
                            return totalMinutes;
                          }

                          const bookingDate = new Date(
                            booking.slot_time * 1000,
                          );
                          const selectedDate = new Date(
                            daysInWeek[selectedSlot.dayIdx],
                          );

                          if (
                            bookingDate.getFullYear() !==
                              selectedDate.getFullYear() ||
                            bookingDate.getMonth() !==
                              selectedDate.getMonth() ||
                            bookingDate.getDate() !== selectedDate.getDate()
                          ) {
                            return totalMinutes;
                          }

                          return totalMinutes + getBookingUnit();
                        }, 0)
                      : 0;
                    const totalDurationMinutes =
                      existingBookedMinutes + bookingDurationMinutes;

                    if (
                      venue?.max_daily_booking_time &&
                      totalDurationMinutes > venue.max_daily_booking_time
                    ) {
                      const maxHours = Math.floor(
                        venue.max_daily_booking_time / 60,
                      );
                      const maxMinutes = venue.max_daily_booking_time % 60;
                      const existingHours = Math.floor(
                        existingBookedMinutes / 60,
                      );
                      const existingMinutes = existingBookedMinutes % 60;
                      setBookingDialogError(
                        existingBookedMinutes > 0
                          ? `Daily maximum exceeded (${existingHours}h ${existingMinutes}m already booked + ${Math.floor(bookingDurationMinutes / 60)}h ${bookingDurationMinutes % 60}m selected; max ${maxHours}h ${maxMinutes}m)`
                          : `Booking duration (${Math.floor(bookingDurationMinutes / 60)}h ${bookingDurationMinutes % 60}m) exceeds maximum daily booking time (${maxHours}h ${maxMinutes}m)`,
                      );
                      return;
                    }

                    // Calculate start time in epoch seconds
                    const bookingDate = new Date(
                      daysInWeek[selectedSlot.dayIdx],
                    );
                    const [startHour, startMinute] = timeSlots[
                      selectedSlot.startTimeIdx
                    ]
                      .split(":")
                      .map(Number);
                    bookingDate.setHours(startHour, startMinute, 0, 0);

                    if (!bookingName.trim()) {
                      setBookingDialogError("Please enter a booking name");
                      return;
                    }

                    try {
                      setIsCreatingBooking(true);

                      await createBooking({
                        venue_id: selectedVenueId!,
                        smallest_booking_unit: getBookingUnit(),
                        start_time: Math.floor(bookingDate.getTime() / 1000),
                        name: bookingName.trim(),
                        duration: bookingDurationMinutes,
                      });

                      const weekStart = new Date(currentWeekStart);
                      weekStart.setHours(0, 0, 0, 0);
                      const startSlotTime = Math.floor(
                        weekStart.getTime() / 1000,
                      );

                      const weekEnd = new Date(currentWeekStart);
                      weekEnd.setDate(weekEnd.getDate() + 7);
                      weekEnd.setHours(0, 0, 0, 0);
                      const endSlotTime = Math.floor(weekEnd.getTime() / 1000);

                      const bookingsResponse = await getBookings(
                        selectedVenueId!,
                        String(startSlotTime),
                        String(endSlotTime),
                      );
                      if (bookingsResponse.bookings) {
                        setBookings(bookingsResponse.bookings);
                      }

                      handleDialogClose(false);
                      toast.success("Booking created successfully!");
                    } catch (error) {
                      console.error("Failed to create booking:", error);
                      let errorMessage =
                        "Failed to create booking. Please try again.";

                      if (error instanceof Error) {
                        if (
                          "response" in error &&
                          error.response &&
                          typeof error.response === "object" &&
                          "data" in error.response
                        ) {
                          const data = error.response.data as
                            | { message?: string }
                            | undefined;
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
                      toast.error(errorMessage);
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
    </div>
  );
}
