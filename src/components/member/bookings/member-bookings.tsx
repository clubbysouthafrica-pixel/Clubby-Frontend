import {
  useState,
  useEffect,
  useRef,
  useLayoutEffect,
  useCallback,
  useMemo,
} from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Grid3X3,
  Loader2,
  MapPin,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { cn } from "@/lib/utils";

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
      ? `${normalizedName.slice(0, 8)}...`
      : normalizedName;
  }

  const [firstName, ...rest] = nameParts;
  const surname = rest[rest.length - 1] || "";
  const abbreviated = `${firstName.slice(0, 8)} ${surname.charAt(0)}.`.trim();
  return abbreviated.length > 12 ? `${abbreviated.slice(0, 12)}...` : abbreviated;
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

function formatDurationLabel(minutes?: number) {
  if (!minutes) {
    return "Flexible";
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours && remainingMinutes) {
    return `${hours}h ${remainingMinutes}m`;
  }

  if (hours) {
    return `${hours}h`;
  }

  return `${remainingMinutes}m`;
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
  const [lastClickedSlot, setLastClickedSlot] = useState<{
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
    if (bookingUnit === 15) return "h-3";
    if (bookingUnit === 30) return "h-5";
    if (bookingUnit === 45) return "h-7";
    return "h-9";
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
    setLastClickedSlot(null);
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
    setLastClickedSlot(null);
    setSelectionError(null);
    setIsDialogOpen(false);
    setBookingDialogError(null);
  }, [bookingViewMode, currentWeekStart, selectedVenueId]);

  const handleSelectableSlotClick = (dayIdx: number, timeIdx: number) => {
    const isDisabled = isSlotDisabled(dayIdx, timeIdx);
    const clickedSameSlotTwice =
      bookingViewMode === "availability" &&
      lastClickedSlot?.dayIdx === dayIdx &&
      lastClickedSlot?.timeIdx === timeIdx;

    if (isDisabled) {
      clearSelection();
      return;
    }

    setLastClickedSlot({ dayIdx, timeIdx });

    if (clickedSameSlotTwice) {
      setSelectionAnchor({ dayIdx, timeIdx });
      applySelection(dayIdx, timeIdx, timeIdx);
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

  const selectedVenue = getSelectedVenue();
  const bookingUnit = getBookingUnit();
  const timeColumnWidth = isMobile ? 60 : 80;
  const openDaysCount = visibleDays.reduce((total, date, dayIdx) => {
    const visibleSlotIndices = visibleSlotIndicesByDay[dayIdx] || [];

    if (isDayClosedForVenue(date) || visibleSlotIndices.length === 0) {
      return total;
    }

    return total + 1;
  }, 0);
  const currentMemberBookingCount = memberName.trim()
    ? bookings.filter(
        (booking) =>
          normalizeBookingName(booking.name || "") ===
          normalizeBookingName(memberName),
      ).length
    : 0;

  if (loading) {
    return (
      <Card className="border-slate-200 bg-white shadow-[0_20px_60px_-34px_rgba(15,23,42,0.2)]">
        <CardContent className="flex items-center justify-center gap-3 py-10 text-sm text-slate-500 sm:py-12">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading bookings...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-rose-200 bg-white shadow-[0_20px_60px_-34px_rgba(15,23,42,0.2)]">
        <CardContent className="p-4 sm:p-6">
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (venues.length === 0) {
    return (
      <Card className="border-slate-200 bg-white shadow-[0_20px_60px_-34px_rgba(15,23,42,0.2)]">
        <CardContent className="p-4 sm:p-6">
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center text-sm text-slate-600 sm:p-6">
            No venues are currently available for booking.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2.5 sm:space-y-4 xl:space-y-5">
      {selectedSlot && (
        <div className="fixed left-1/2 top-2 z-50 w-[calc(100vw-1rem)] max-w-5xl -translate-x-1/2 sm:top-4 sm:w-[calc(100vw-1.5rem)]">
          <div className="relative flex flex-col gap-2 overflow-hidden rounded-[1.25rem] border border-sky-800 bg-sky-700 px-3 py-2 shadow-[0_28px_80px_-32px_rgba(3,105,161,0.55)] ring-2 ring-sky-900/20 sm:flex-row sm:items-center sm:justify-between sm:gap-2.5 sm:rounded-[1.5rem] sm:px-4 sm:py-2.5">
            <div className="pointer-events-none absolute inset-y-0 left-0 w-1.5 bg-sky-950" />
            <button
              type="button"
              onClick={clearSelection}
              aria-label="Close booking selection"
              className="absolute right-3 top-3 rounded-full border border-sky-200 bg-white p-1 text-sky-800 transition-colors hover:bg-sky-100 hover:text-sky-950"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="min-w-0 pl-1 sm:pl-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-2 w-2 rounded-full bg-white shadow-[0_0_0_4px_rgba(224,242,254,0.2)]" />
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-100 sm:text-xs sm:tracking-[0.2em]">
                  Active Booking Selection
                </p>
              </div>
              <p className="mt-1 truncate text-[13px] font-semibold text-white sm:text-sm">
                {selectedSlotSummary}
              </p>
              {selectionError ? (
                <p className="mt-0.5 text-[11px] text-amber-100 sm:mt-1 sm:text-xs">{selectionError}</p>
              ) : (
                <p className="mt-0.5 text-[11px] text-sky-100 sm:mt-1 sm:text-xs">
                  Continue when you are happy with the selected booking range.
                </p>
              )}
            </div>

            <div className="mr-8 flex items-center gap-1.5 sm:mr-10 sm:gap-2 sm:flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={clearSelection}
                className="h-8 border-sky-200 bg-white px-2.5 text-[11px] text-sky-800 hover:bg-sky-100 sm:h-8.5 sm:px-3 sm:text-xs"
              >
                Clear
              </Button>
              <Button
                size="sm"
                onClick={() => setIsDialogOpen(true)}
                disabled={!!selectionError}
                className="h-8 bg-sky-950 px-2.5 text-[11px] text-white shadow-[0_12px_28px_-18px_rgba(12,74,110,0.85)] hover:bg-sky-900 sm:h-8.5 sm:px-3 sm:text-xs"
              >
                Create Booking
              </Button>
            </div>
          </div>
        </div>
      )}

      {selectedVenueId && (
        <div className="grid gap-2.5 sm:gap-4 xl:grid-cols-[280px_minmax(0,1fr)] xl:gap-5">
          <aside className="space-y-2 sm:space-y-4 xl:sticky xl:top-24 xl:self-start xl:space-y-5">
            <Card className="hidden overflow-hidden border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] text-slate-900 shadow-[0_24px_70px_-34px_rgba(15,23,42,0.22)] sm:block">
              <CardContent className="space-y-2.5 p-2 sm:space-y-4 sm:p-4">
                <div className="flex items-start justify-between gap-2.5 sm:items-center sm:gap-3">
                  <div className="space-y-1.5 sm:space-y-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 sm:text-xs sm:tracking-[0.22em]">
                      Member Bookings
                    </p>
                    <h2 className="text-base font-semibold sm:text-xl">Court schedule</h2>
                    <p className="hidden text-xs leading-5 text-slate-500 sm:block sm:text-sm sm:leading-5">
                      Pick a venue, scan availability, and reserve a compact booking range from one place.
                    </p>
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 sm:h-11 sm:w-11 sm:rounded-2xl">
                    <CalendarDays className="h-5 w-5 text-slate-700 sm:h-6 sm:w-6" />
                  </div>
                </div>

                <div className="rounded-[1rem] border border-slate-200 bg-white p-2.5 sm:rounded-[1.25rem] sm:p-4">
                  <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                    <Badge className="border-slate-200 bg-slate-50 text-slate-700">
                      {bookingViewMode === "availability" ? (isMobile ? "Blocks" : "Available blocks") : (isMobile ? "Calendar" : "Calendar view")}
                    </Badge>
                    {selectedVenue && !isMobile ? (
                      <Badge className="border-slate-200 bg-slate-50 text-slate-700">
                        {selectedVenue.venue_name}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-1.5 text-lg font-semibold tracking-tight text-slate-950 sm:mt-2 sm:text-2xl">
                    {bookingsLoading ? "Refreshing..." : formatWeekRange()}
                  </p>
                  <p className="mt-0.5 hidden text-xs leading-5 text-slate-500 sm:block sm:text-sm sm:leading-5">
                    {bookingViewMode === "availability"
                      ? "Choose adjacent blocks to grow or reset your selection quickly."
                      : "Review the full venue calendar and book directly from open slots."}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-1 sm:gap-2">
                    <Badge className="border-slate-200 bg-slate-50 text-slate-700">
                      {openDaysCount} open {openDaysCount === 1 ? "day" : "days"}
                    </Badge>
                    <Badge className="border-slate-200 bg-slate-50 text-slate-700">
                      {bookings.length} booked {bookings.length === 1 ? "slot" : "slots"}
                    </Badge>
                    {memberName.trim() && !isMobile ? (
                      <Badge className="border-slate-200 bg-slate-50 text-slate-700">
                        {currentMemberBookingCount} yours
                      </Badge>
                    ) : null}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1 sm:gap-2">
                  <div className="rounded-[0.9rem] border border-slate-200 bg-slate-50 p-2 sm:rounded-[1rem] sm:p-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Booking unit</p>
                    <p className="mt-0.5 text-base font-semibold sm:mt-1 sm:text-xl">{bookingUnit}m</p>
                  </div>
                  <div className="rounded-[0.9rem] border border-slate-200 bg-slate-50 p-2 sm:rounded-[1rem] sm:p-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Max daily</p>
                    <p className="mt-0.5 text-base font-semibold sm:mt-1 sm:text-xl">
                      {formatDurationLabel(selectedVenue?.max_daily_booking_time)}
                    </p>
                  </div>
                  <div className="col-span-2 hidden rounded-[1rem] border border-slate-200 bg-slate-50 p-2.5 sm:block sm:p-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Selection tip</p>
                    <p className="mt-1 text-xs leading-5 text-slate-700 sm:text-sm sm:leading-5">
                      {bookingViewMode === "availability"
                        ? "Tap the same block again to reset the range back to that starting point."
                        : "Use the calendar when you need a full-day view of booked and open time."}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white shadow-[0_16px_40px_-30px_rgba(15,23,42,0.28)]">
              <CardHeader className="px-1.5 pb-1 pt-1.5 sm:px-3 sm:pb-2 sm:pt-3">
                <div className="flex items-center gap-2 sm:gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-[0.8rem] bg-slate-100 sm:h-9 sm:w-9 sm:rounded-[1rem]">
                    <MapPin className="h-4 w-4 text-slate-700 sm:h-[18px] sm:w-[18px]" />
                  </div>
                  <div>
                    <CardTitle className="text-[13px] sm:text-sm">Venue selection</CardTitle>
                    <CardDescription className="hidden sm:block">Switch courts without leaving the booking flow.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-1 px-1.5 pb-1.5 pt-0 sm:space-y-1.5 sm:px-3 sm:pb-3">
                {venues.map((venue) => {
                  const isActive = selectedVenueId === venue.venue_id;

                  return (
                    <button
                      key={venue.venue_id}
                      type="button"
                      onClick={() => {
                        setSelectedVenueId(venue.venue_id);
                        setBookings([]);
                      }}
                      className={cn(
                        "flex w-full items-center justify-between rounded-[0.8rem] border px-2 py-1.5 text-left transition-colors sm:rounded-[0.95rem] sm:px-2.5 sm:py-2",
                        isActive
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100",
                      )}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[12px] font-semibold sm:text-[13px]">{venue.venue_name}</p>
                        <p
                          className={cn(
                            "mt-0.5 hidden text-[11px] sm:block",
                            isActive ? "text-slate-300" : "text-slate-500",
                          )}
                        >
                          {venue.smallest_booking_unit || 60} minute booking unit
                        </p>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          </aside>

          <div className="space-y-2.5 sm:space-y-4 xl:space-y-5">
            <Card className="overflow-hidden border-0 bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.08),_transparent_32%),linear-gradient(180deg,#fff_0%,#f8fafc_100%)] shadow-[0_20px_60px_-34px_rgba(15,23,42,0.35)]">
              <CardHeader className="border-b border-slate-200 px-2 pb-2 pt-2 sm:px-4 sm:pb-4 sm:pt-4">
                <div className="flex flex-col gap-2.5 lg:flex-row lg:items-end lg:justify-between lg:gap-3">
                  <div className="flex items-start gap-2.5 sm:gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 shadow-sm sm:h-11 sm:w-11 sm:rounded-2xl">
                      {bookingViewMode === "availability" ? (
                        <Grid3X3 className="h-5 w-5" />
                      ) : (
                        <Clock3 className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-base text-slate-950 sm:text-xl">
                        {selectedVenue?.venue_name || "Bookings"}
                      </CardTitle>
                      <CardDescription className="mt-0.5 hidden max-w-2xl text-xs leading-5 text-slate-500 sm:block sm:text-sm sm:leading-5">
                        Switch between fast block selection and the full venue timeline without losing your place.
                      </CardDescription>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 sm:flex sm:flex-wrap sm:items-center sm:gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setBookingViewMode("availability")}
                      className={cn(
                        "h-7.5 border-slate-200 bg-white px-2 text-[11px] text-slate-600 hover:bg-slate-50 sm:h-8 sm:px-2.5 sm:text-sm",
                        bookingViewMode === "availability" &&
                          "border-slate-900 bg-slate-900 text-white hover:bg-slate-900",
                      )}
                    >
                      Available Blocks
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setBookingViewMode("calendar")}
                      className={cn(
                        "h-7.5 border-slate-200 bg-white px-2 text-[11px] text-slate-600 hover:bg-slate-50 sm:h-8 sm:px-2.5 sm:text-sm",
                        bookingViewMode === "calendar" &&
                          "border-slate-900 bg-slate-900 text-white hover:bg-slate-900",
                      )}
                    >
                      Calendar View
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-2 p-2 sm:space-y-4 sm:p-4">
                <div className="flex flex-col gap-2 rounded-[1rem] border border-slate-200 bg-white p-2 sm:flex-row sm:items-center sm:justify-between sm:gap-2.5 sm:rounded-[1.25rem] sm:p-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPreviousWeek}
                    disabled={!canGoPrevious()}
                    className="h-7.5 w-full gap-1 border-slate-200 px-2 text-[11px] text-slate-700 sm:h-8 sm:w-auto sm:px-2.5 sm:text-sm"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>{isMobile ? "Prev" : "Previous"}</span>
                  </Button>

                  <div className="order-first text-center sm:order-none">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 sm:text-xs sm:tracking-[0.16em]">
                      {isMobile ? "Range" : "Visible range"}
                    </p>
                    <p className="mt-0.5 break-words text-[13px] font-semibold text-slate-950 sm:text-base">
                      {formatWeekRange()}
                    </p>
                  </div>

                  <div className="flex w-full gap-1.5 sm:w-auto sm:gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToToday}
                      className="h-7.5 flex-1 border-slate-200 px-2 text-[11px] text-slate-700 sm:h-8 sm:flex-none sm:px-2.5 sm:text-sm"
                    >
                      Today
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToNextWeek}
                      className="h-7.5 flex-1 gap-1 border-slate-200 px-2 text-[11px] text-slate-700 sm:h-8 sm:flex-none sm:px-2.5 sm:text-sm"
                    >
                      <span>{isMobile ? "Next" : "Next"}</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {bookingViewMode === "calendar" ? (
                  <div className="overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white shadow-[0_16px_40px_-30px_rgba(15,23,42,0.18)] sm:rounded-[1.5rem]">
                <div
                  className={`grid border-b border-slate-200 bg-slate-50 ${getRowHeightClass()}`}
                  style={{
                    gridTemplateColumns: `${timeColumnWidth}px repeat(${visibleDays.length}, minmax(0, 1fr))`,
                  }}
                >
                  <div className="flex items-center justify-center border-r border-slate-200 p-2 text-xs font-semibold text-slate-500">
                    Time
                  </div>
                  {visibleDays.map((date, idx) => {
                    const isPast = isPastDay(date);
                    const isClosed = isDayClosedForVenue(date);

                    return (
                      <div
                        key={idx}
                        className={`flex flex-col items-center justify-center border-r border-slate-200 p-1.5 text-center sm:p-3 ${
                          isPast || isClosed ? "bg-slate-100 opacity-50" : ""
                        }`}
                      >
                        <p className="text-[10px] font-semibold text-slate-500 sm:text-xs">
                          {formatWeekday(date)}
                        </p>
                        <p className="text-[13px] font-bold text-slate-950 sm:text-sm">{date.getDate()}</p>
                        {isClosed && (
                          <p className="text-xs text-slate-500">Closed</p>
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
                    className="h-8 w-full rounded-none border-b border-slate-200 bg-slate-100 py-1 font-semibold text-slate-700 hover:bg-slate-200"
                  >
                    <ChevronLeft className="h-5 w-5 rotate-90" />
                  </Button>
                )}

                <div
                  ref={timeSlotsRef}
                  className="max-h-[480px] overflow-y-auto sm:max-h-[560px]"
                >
                  {timeSlots.map((time, timeIdx) => (
                    <div
                      key={time}
                      className={`grid border-b border-slate-200 transition-all hover:bg-slate-50 ${getRowHeightClass()}`}
                      style={{
                        gridTemplateColumns: `${timeColumnWidth}px repeat(${visibleDays.length}, minmax(0, 1fr))`,
                      }}
                    >
                      <div className="relative flex items-start border-r border-slate-200 bg-slate-50 p-0 text-xs font-extrabold text-slate-500">
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
                            title={isBooked && bookingName ? bookingName : undefined}
                            className={`group relative flex items-center justify-center border-r border-slate-200 p-1 transition-colors select-none sm:p-2 ${
                              isBooked
                                ? "pointer-events-none cursor-default border-slate-300 bg-slate-200 shadow-inner"
                                : isDisabled
                                  ? "pointer-events-none cursor-default bg-slate-200 opacity-50"
                                  : "cursor-pointer"
                            } ${
                              isDragging
                                ? "bg-slate-900 hover:bg-slate-900"
                                : !isDisabled
                                  ? "hover:bg-slate-100"
                                  : ""
                            }`}
                          >
                            {isBooked && bookingName && (
                              <div className="pointer-events-none flex h-full w-full items-center justify-center overflow-hidden px-1">
                                <div className="max-w-full truncate rounded-full border border-slate-400/60 bg-slate-100 px-1 py-0.5 text-center text-[8px] font-semibold uppercase tracking-[0.06em] text-slate-700 sm:px-1.5 sm:text-[9px] sm:tracking-[0.08em]">
                                  {abbreviateBookingName(bookingName)}
                                </div>
                              </div>
                            )}
                            {!isDisabled && !isDragging && (
                              <div className="absolute inset-0 bg-slate-200/70 opacity-0 transition-opacity group-hover:opacity-100" />
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
                    className="h-8 w-full rounded-none border-t border-slate-200 bg-slate-100 py-1 font-semibold text-slate-700 hover:bg-slate-200"
                  >
                    <ChevronLeft className="h-5 w-5 -rotate-90" />
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid gap-1 sm:grid-cols-2 sm:gap-2 lg:grid-cols-5">
                {visibleDays.map((date, dayIdx) => {
                  const visibleSlotIndices =
                    visibleSlotIndicesByDay[dayIdx] || [];
                  const isClosed = isDayClosedForVenue(date);

                  return (
                    <div
                      key={date.toISOString()}
                      className="rounded-[0.85rem] border border-slate-200 bg-white p-1 shadow-[0_16px_40px_-30px_rgba(15,23,42,0.18)] sm:rounded-[1.1rem] sm:p-2"
                    >
                      <div className="mb-1 border-b border-slate-200 pb-1 text-center sm:mb-1.5 sm:pb-1.5">
                        <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-500 sm:text-xs sm:tracking-[0.16em]">
                          {formatWeekday(date)}
                        </p>
                        <p className="mt-0.5 text-[12px] font-semibold text-slate-950 sm:text-base">
                          {date.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>

                      {isClosed ? (
                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-1.5 py-2.5 text-center text-[10px] text-slate-500 sm:rounded-2xl sm:px-3 sm:py-5 sm:text-sm">
                          Closed
                        </div>
                      ) : visibleSlotIndices.length === 0 ? (
                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-1.5 py-2.5 text-center text-[10px] text-slate-500 sm:rounded-2xl sm:px-3 sm:py-5 sm:text-sm">
                          No booking blocks available
                        </div>
                      ) : (
                        <TooltipProvider>
                          <div className="grid grid-cols-4 gap-0.5 sm:grid-cols-2 sm:gap-1">
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
                                  title={isBooked && bookingName ? bookingName : undefined}
                                  className={`h-8 rounded-[0.45rem] border px-0.5 py-0.5 text-[8px] font-medium transition-colors sm:h-12 sm:rounded-lg sm:px-1.5 sm:py-1 sm:text-[11px] ${
                                    isSelected
                                      ? "border-slate-900 bg-slate-900 text-white"
                                      : isBooked
                                        ? "cursor-not-allowed border-slate-300 bg-slate-200 text-slate-700 shadow-inner"
                                        : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                                  }`}
                                >
                                  <div className="flex h-full flex-col items-center justify-center gap-0.5 overflow-hidden leading-none">
                                    <span className="truncate font-semibold">
                                      {isMobile
                                        ? timeSlots[timeIdx]
                                        : formatSlotRange(timeSlots, timeIdx)}
                                    </span>
                                    {isBooked && bookingName && (
                                      <span className="max-w-full truncate rounded-full border border-slate-400/60 bg-slate-100 px-0.5 py-0.5 text-[7px] font-semibold uppercase tracking-[0.04em] text-slate-700 sm:px-1 sm:text-[9px] sm:tracking-[0.08em]">
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

                <div className="rounded-[0.85rem] border border-slate-200 bg-slate-50 px-1.5 py-1 text-[9px] text-slate-600 sm:rounded-[1.1rem] sm:px-3 sm:py-2 sm:text-xs">
              {bookingViewMode === "availability" ? (
                <>
                  {isMobile
                    ? "Tap blocks to build your range"
                    : "Click available blocks one by one to build your booking range"}
                </>
              ) : (
                <>
                  {isMobile
                    ? "Tap slots to build your range"
                    : "Click available slots one by one to build your booking range"}
                </>
              )}
                </div>
              </CardContent>
            </Card>
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
                <Label htmlFor="booking-name" className="text-sm text-slate-700">
                  Booking name
                </Label>
                <Input
                  id="booking-name"
                  placeholder="Enter booking name"
                  value={bookingName}
                  onChange={(e) => setBookingName(e.target.value)}
                  className="mt-1 h-9 border-slate-200"
                />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="space-y-2">
                  <p className="text-sm text-slate-700">
                    <span className="font-semibold">Time:</span>{" "}
                    {timeSlots[selectedSlot.startTimeIdx]} -{" "}
                    {selectedSlot.endTimeIdx + 1 < timeSlots.length
                      ? timeSlots[selectedSlot.endTimeIdx + 1]
                      : "23:59"}
                  </p>
                  <p className="text-xs text-slate-500">
                    <span className="font-semibold">Duration:</span>{" "}
                    {(selectedSlot.endTimeIdx - selectedSlot.startTimeIdx + 1) *
                      getBookingUnit()}{" "}
                    minutes
                  </p>
                </div>
              </div>

              {bookingDialogError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {bookingDialogError}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDialogClose(false)}
                  className="h-9 border-slate-200 text-sm text-slate-700"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={isCreatingBooking}
                  className="h-9 bg-slate-900 text-sm text-white hover:bg-slate-800"
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
