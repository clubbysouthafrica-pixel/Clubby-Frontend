import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  Loader2,
  MapPin,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { createBooking, deleteBooking, getBookings } from "@/services/bookings";
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

interface BookingPendingDelete extends Booking {
  venue_id: string;
}

interface MemberBookingsProps {
  venues: Venue[];
  loading: boolean;
  error: string | null;
  memberName?: string;
}

function getBookingKey(booking: Booking) {
  return `${booking.slot_time}-${booking.name || "member"}`;
}

const BLOCKED_RANGE_SELECTION_ERROR =
  "Selection can only include available, unbooked slots.";

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

function formatBookingSlotDetails(slotTime: number, bookingUnit: number) {
  const start = new Date(slotTime * 1000);
  const end = new Date(start.getTime() + bookingUnit * 60 * 1000);

  const dayLabel = start.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const timeLabel = `${start.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })} - ${end.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })}`;

  return { dayLabel, timeLabel };
}

export default function MemberBookings({
  venues,
  loading,
  error,
  memberName = "",
}: MemberBookingsProps) {
  const isMobile = useIsMobile();
  const selectedBookingsSectionRef = useRef<HTMLDivElement | null>(null);
  const selectedBookingRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [isSelectedBookingsOpen, setIsSelectedBookingsOpen] = useState(false);
  const [highlightedBookingKey, setHighlightedBookingKey] = useState<string | null>(null);
  const [mobileDailyLimitError, setMobileDailyLimitError] = useState<string | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
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
  const [bookingPendingDelete, setBookingPendingDelete] = useState<BookingPendingDelete | null>(null);
  const [bookingDialogError, setBookingDialogError] = useState<string | null>(
    null,
  );
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);
  const [isDeletingBooking, setIsDeletingBooking] = useState(false);
  const [bookingName, setBookingName] = useState(memberName);

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
  const visibleDayCount = 5;
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

  const getExistingBookedMinutesForDay = useCallback(
    (dayIdx: number) => {
      const currentMemberNormalizedName = normalizeBookingName(
        memberName || bookingName,
      );

      if (!currentMemberNormalizedName) {
        return 0;
      }

      return bookings.reduce((totalMinutes, booking) => {
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
      }, 0);
    },
    [bookingName, bookings, daysInWeek, getBookingUnit, memberName],
  );

  const hasReachedDailyBookingLimit = useCallback(
    (dayIdx: number) => {
      const venue = getSelectedVenue();

      if (!venue?.max_daily_booking_time) {
        return false;
      }

      return (
        getExistingBookedMinutesForDay(dayIdx) >= venue.max_daily_booking_time
      );
    },
    [getExistingBookedMinutesForDay, getSelectedVenue],
  );

  const getDailyBookingLimitMessage = useCallback(
    () => {
      const venue = getSelectedVenue();

      if (!venue?.max_daily_booking_time) {
        return null;
      }

      const maxHours = Math.floor(venue.max_daily_booking_time / 60);
      const maxMinutes = venue.max_daily_booking_time % 60;

      return `You have already reached the daily booking limit for this day (${maxHours}h ${maxMinutes}m).`;
    },
    [getSelectedVenue],
  );

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
      const existingBookedMinutes = getExistingBookedMinutesForDay(dayIdx);

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
              ? `You already have ${existingHours}h ${existingMins}m booked for this day. Adding ${selectedHours}h ${selectedMins}m would bring the total to ${totalHours}h ${totalMins}m, which is over the daily limit of ${maxHours}h ${maxMins}m.`
              : `This selection is ${selectedHours}h ${selectedMins}m long, but the daily booking limit is ${maxHours}h ${maxMins}m. Please choose a shorter time range.`,
        };
      }

      return { isValid: true };
    },
    [
      getExistingBookedMinutesForDay,
      getBookingUnit,
      getSelectedVenue,
    ],
  );

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

  const getBookingForSlot = (
    dayIdx: number,
    timeIdx: number,
  ): Booking | null => {
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

    return booking || null;
  };

  const isMemberBooking = useCallback(
    (name?: string | null) => {
      if (!memberName.trim() || !name) {
        return false;
      }

      return normalizeBookingName(name) === normalizeBookingName(memberName);
    },
    [memberName],
  );

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
            error: BLOCKED_RANGE_SELECTION_ERROR,
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
    setBookingPendingDelete(null);
    setBookingDialogError(null);
  }, [currentWeekStart, selectedVenueId]);

  useEffect(() => {
    setIsSelectedBookingsOpen(false);
  }, [currentWeekStart, selectedVenueId]);

  useEffect(() => {
    if (!highlightedBookingKey) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setHighlightedBookingKey(null);
    }, 5000);

    return () => window.clearTimeout(timeoutId);
  }, [highlightedBookingKey]);

  useEffect(() => {
    if (!isSelectedBookingsOpen || !highlightedBookingKey) {
      return;
    }

    if (isMobile) {
      selectedBookingsSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }

    const highlightedBookingElement =
      selectedBookingRefs.current[highlightedBookingKey];

    const animationFrameId = window.requestAnimationFrame(() => {
      highlightedBookingElement?.scrollIntoView({
        behavior: "smooth",
        block: isMobile ? "center" : "nearest",
      });
    });

    return () => window.cancelAnimationFrame(animationFrameId);
  }, [highlightedBookingKey, isMobile, isSelectedBookingsOpen]);

  useEffect(() => {
    if (!mobileDailyLimitError) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setMobileDailyLimitError(null);
    }, 5000);

    return () => window.clearTimeout(timeoutId);
  }, [mobileDailyLimitError]);

  const handleSelectableSlotClick = (dayIdx: number, timeIdx: number) => {
    const isDisabled = isSlotDisabled(dayIdx, timeIdx);
    const clickedSameSlotTwice =
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

    const nextSelection = createRangeSelection(dayIdx, anchorTimeIdx, timeIdx);

    if (
      !nextSelection.selection &&
      nextSelection.error === BLOCKED_RANGE_SELECTION_ERROR
    ) {
      setSelectionAnchor({ dayIdx, timeIdx });
      applySelection(dayIdx, timeIdx, timeIdx);
      return;
    }

    setSelectionError(nextSelection.error);

    if (nextSelection.selection) {
      setSelectedSlot(nextSelection.selection);
    }
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
  const bookingUnit = getBookingUnit();
  const memberBookings = useMemo(
    () =>
      memberName.trim()
        ? bookings
            .filter(
              (booking) =>
                normalizeBookingName(booking.name || "") ===
                normalizeBookingName(memberName),
            )
            .sort((left, right) => left.slot_time - right.slot_time)
        : [],
    [bookings, memberName],
  );

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

      {isMobile && mobileDailyLimitError ? (
        <div className="fixed left-1/2 top-2 z-50 w-[calc(100vw-1rem)] max-w-md -translate-x-1/2 sm:hidden">
          <div className="relative rounded-[1rem] border border-rose-200 bg-rose-600 px-3 py-2 pr-10 text-[11px] font-medium text-white shadow-[0_22px_60px_-28px_rgba(190,24,93,0.55)]">
            <button
              type="button"
              onClick={() => setMobileDailyLimitError(null)}
              aria-label="Close booking limit error"
              className="absolute right-2 top-2 rounded-full border border-rose-200/80 bg-rose-700 p-1 text-white transition-colors hover:bg-rose-800"
            >
              <X className="h-3 w-3" />
            </button>
            {mobileDailyLimitError}
          </div>
        </div>
      ) : null}

      {selectedVenueId && (
        <div className="space-y-2.5 sm:space-y-4 xl:space-y-5">
          <div className="flex items-start justify-between gap-2 rounded-[0.9rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-2 py-2 shadow-[0_24px_70px_-34px_rgba(15,23,42,0.22)] sm:gap-3 sm:rounded-[1.5rem] sm:px-4 sm:py-4">
            <div className="space-y-1 sm:space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 sm:text-xs sm:tracking-[0.22em]">
                Member Bookings
              </p>
              <h2 className="text-[15px] font-semibold leading-5 text-slate-950 sm:text-2xl">Booking overview</h2>
              <p className="text-[11px] leading-4 text-slate-500 sm:text-sm sm:leading-6">
                Pick a venue, review your bookings, and book from the same availability view without leaving this page.
              </p>
            </div>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 sm:h-11 sm:w-11 sm:rounded-2xl">
              <CalendarDays className="h-4 w-4 text-slate-700 sm:h-6 sm:w-6" />
            </div>
          </div>

          <Card className="overflow-hidden border-0 py-0">
            <CardContent className="space-y-2 p-2 sm:space-y-4 sm:p-4">
              <div className="rounded-[0.75rem] border border-slate-200 bg-white p-1.5 sm:rounded-[1.25rem] sm:p-3">
                <div className="flex items-start gap-1.5 sm:items-center sm:gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 sm:h-10 sm:w-10 sm:rounded-2xl">
                    <MapPin className="h-3 w-3 sm:h-[18px] sm:w-[18px]" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-slate-950 sm:text-sm">Venue selection</p>
                    <p className="text-[10px] leading-3.5 text-slate-500 sm:text-sm sm:leading-5">
                      Pick from the available booking blocks without leaving this view.
                    </p>
                  </div>
                </div>
                <div className="mt-1.5 grid grid-cols-2 gap-1 sm:mt-3 sm:grid-cols-2 sm:gap-1.5 lg:grid-cols-3">
                  {venues.map((venue) => {
                    const isActive = selectedVenueId === venue.venue_id;

                    return (
                      <button
                        key={venue.venue_id}
                        type="button"
                        onClick={() => {
                          if (selectedVenueId === venue.venue_id) {
                            return;
                          }

                          setSelectedVenueId(venue.venue_id);
                          setBookings([]);
                        }}
                        className={cn(
                          "flex w-full items-center justify-between rounded-lg border px-1.5 py-1.5 text-left transition-colors sm:rounded-2xl sm:px-3 sm:py-2.5",
                          isActive
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100",
                        )}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-[11px] font-semibold leading-4 sm:text-sm">{venue.venue_name}</p>
                          <p className={cn("mt-0.5 text-[9px] leading-3.5 sm:text-xs", isActive ? "text-slate-300" : "text-slate-500")}>
                            {venue.smallest_booking_unit || 60} minute booking unit
                          </p>
                        </div>
                        <ChevronRight className="h-3 w-3 shrink-0 sm:h-4 sm:w-4" />
                      </button>
                    );
                  })}
                </div>

                <div
                  ref={selectedBookingsSectionRef}
                  className="mt-1.5 rounded-xl border border-slate-200 bg-slate-50 sm:mt-3 sm:rounded-2xl"
                >
                  <button
                    type="button"
                    onClick={() => setIsSelectedBookingsOpen((open) => !open)}
                    className="flex w-full items-center justify-between gap-2 px-1.75 py-1.5 text-left sm:gap-3 sm:px-3 sm:py-3"
                  >
                    <div className="flex items-center gap-2 sm:gap-2.5">
                      <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-white text-slate-700 sm:h-8 sm:w-8 sm:rounded-xl">
                        <Grid3X3 className="h-3 w-3 sm:h-4 sm:w-4" />
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold text-slate-950 sm:text-sm">Your selected bookings</p>
                        <p className="text-[9px] leading-3.5 text-slate-500 sm:text-sm">
                          Bookings for the selected venue and visible range.
                        </p>
                      </div>
                    </div>
                    <ChevronRight
                      className={cn(
                        "h-3.5 w-3.5 shrink-0 text-slate-500 transition-transform sm:h-4 sm:w-4",
                        isSelectedBookingsOpen && "rotate-90",
                      )}
                    />
                  </button>

                  {isSelectedBookingsOpen ? (
                    <div className="border-t border-slate-200 px-1.5 py-1.5 sm:px-3 sm:py-3">
                      {!memberName.trim() ? (
                        <div className="rounded-xl border border-dashed border-slate-200 bg-white px-2.5 py-2 text-[11px] text-slate-500 sm:rounded-2xl sm:px-3 sm:py-3 sm:text-sm">
                          Add your name to see your bookings here.
                        </div>
                      ) : memberBookings.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-200 bg-white px-2.5 py-2 text-[11px] text-slate-500 sm:rounded-2xl sm:px-3 sm:py-3 sm:text-sm">
                          No bookings found for this venue in the current range.
                        </div>
                      ) : (
                        <div
                          className={cn(
                            "space-y-1.5 sm:space-y-2",
                            memberBookings.length > 3 && "max-h-52 overflow-y-auto pr-1",
                          )}
                        >
                          {memberBookings.map((booking) => {
                            const { dayLabel, timeLabel } = formatBookingSlotDetails(
                              booking.slot_time,
                              bookingUnit,
                            );
                            const bookingKey = getBookingKey(booking);
                            const isHighlighted = highlightedBookingKey === bookingKey;

                            return (
                              <div
                                key={bookingKey}
                                ref={(element) => {
                                  selectedBookingRefs.current[bookingKey] = element;
                                }}
                                className={cn(
                                  "rounded-xl border px-2 py-1.5 transition-colors duration-300 sm:rounded-2xl sm:px-3 sm:py-3",
                                  isHighlighted
                                    ? "border-amber-300 bg-amber-50 shadow-[0_0_0_1px_rgba(252,211,77,0.55)]"
                                    : "border-slate-200 bg-white",
                                )}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <p className="truncate text-[11px] font-semibold leading-4 text-slate-900 sm:text-sm">
                                      {dayLabel}
                                    </p>
                                    <p className="mt-0.5 text-[9px] leading-3.5 text-slate-500 sm:mt-1 sm:text-xs">
                                      {timeLabel}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Badge className="border-slate-200 bg-slate-50 px-1.5 py-0 text-[9px] text-slate-700 sm:text-xs">
                                      {bookingUnit}m
                                    </Badge>
                                    <button
                                      type="button"
                                      aria-label="Remove booking"
                                      onClick={() => {
                                        if (!selectedVenueId) {
                                          return;
                                        }

                                        setBookingPendingDelete({
                                          ...booking,
                                          venue_id: selectedVenueId,
                                        });
                                      }}
                                      className="rounded-full border border-slate-200 bg-white p-1 text-slate-500 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-col gap-1.5 rounded-[0.9rem] border border-slate-200 bg-white p-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-2.5 sm:rounded-[1.25rem] sm:p-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousWeek}
                  disabled={!canGoPrevious()}
                  className="h-7 w-full gap-1 border-slate-200 px-2 text-[10px] text-slate-700 sm:h-8 sm:w-auto sm:px-2.5 sm:text-sm"
                >
                  <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>{isMobile ? "Prev" : "Previous"}</span>
                </Button>

                <div className="order-first text-center sm:order-none">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-500 sm:text-xs sm:tracking-[0.16em]">
                    {isMobile ? "Range" : "Visible range"}
                  </p>
                  <p className="mt-0.5 break-words text-[12px] font-semibold leading-4 text-slate-950 sm:text-base sm:leading-normal">
                    {formatWeekRange()}
                  </p>
                </div>

                <div className="flex w-full gap-1.5 sm:w-auto sm:gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToToday}
                    className="h-7 flex-1 border-slate-200 px-2 text-[10px] text-slate-700 sm:h-8 sm:flex-none sm:px-2.5 sm:text-sm"
                  >
                    Today
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNextWeek}
                    className="h-7 flex-1 gap-1 border-slate-200 px-2 text-[10px] text-slate-700 sm:h-8 sm:flex-none sm:px-2.5 sm:text-sm"
                  >
                    <span>{isMobile ? "Next" : "Next"}</span>
                    <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid gap-1 sm:grid-cols-2 sm:gap-2 lg:grid-cols-5">
                {visibleDays.map((date, dayIdx) => {
                  const visibleSlotIndices = visibleSlotIndicesByDay[dayIdx] || [];
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
                              const isSelected = isSlotSelected(dayIdx, timeIdx);
                              const isBooked = isSlotBooked(dayIdx, timeIdx);
                              const hasReachedDailyLimit =
                                !isBooked && hasReachedDailyBookingLimit(dayIdx);
                              const dailyLimitTooltip = hasReachedDailyLimit
                                ? getDailyBookingLimitMessage()
                                : null;
                              const slotBooking = isBooked
                                ? getBookingForSlot(dayIdx, timeIdx)
                                : null;
                              const bookingName = slotBooking?.name || null;
                              const isMembersBookedSlot = isMemberBooking(bookingName);

                              const block = (
                                <button
                                  key={`${dayIdx}-${timeIdx}`}
                                  type="button"
                                  onClick={() => {
                                    if (isMembersBookedSlot && slotBooking) {
                                      setIsSelectedBookingsOpen(true);
                                      setHighlightedBookingKey(getBookingKey(slotBooking));
                                      return;
                                    }

                                    if (isMobile && hasReachedDailyLimit && dailyLimitTooltip) {
                                      setMobileDailyLimitError(dailyLimitTooltip);
                                      return;
                                    }

                                    handleSelectableSlotClick(dayIdx, timeIdx);
                                  }}
                                  disabled={isBooked && !isMembersBookedSlot}
                                  title={isBooked && bookingName ? bookingName : undefined}
                                  className={`h-9 rounded-[0.45rem] border px-0.5 py-0.5 text-[8px] font-medium transition-colors sm:h-12 sm:rounded-lg sm:px-1.5 sm:py-1 sm:text-[11px] ${
                                    isSelected
                                      ? "border-slate-900 bg-slate-900 text-white"
                                      : isMembersBookedSlot
                                        ? "cursor-pointer border-sky-200 bg-sky-50 text-sky-900 shadow-inner hover:bg-sky-100"
                                        : isBooked
                                          ? "cursor-not-allowed border-rose-200 bg-rose-50 text-rose-900 shadow-inner"
                                          : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                                  }`}
                                >
                                  <div className="flex h-full flex-col items-center justify-center gap-0.5 overflow-hidden leading-none">
                                    <span className="text-center text-[7px] font-semibold leading-3 whitespace-normal sm:truncate sm:text-[11px] sm:leading-none">
                                      {formatSlotRange(timeSlots, timeIdx)}
                                    </span>
                                    {isBooked && bookingName && (
                                      <span
                                        className={cn(
                                          "max-w-full truncate rounded-full px-0.5 py-0.5 text-[7px] font-semibold uppercase tracking-[0.04em] sm:px-1 sm:text-[9px] sm:tracking-[0.08em]",
                                          isMembersBookedSlot
                                            ? "border border-sky-300/70 bg-sky-100 text-sky-800"
                                            : "border border-rose-300/70 bg-rose-100 text-rose-800",
                                        )}
                                      >
                                        {abbreviateBookingName(bookingName)}
                                      </span>
                                    )}
                                  </div>
                                </button>
                              );

                              if (!isMobile && hasReachedDailyLimit && dailyLimitTooltip) {
                                return (
                                  <Tooltip key={`${dayIdx}-${timeIdx}`}>
                                    <TooltipTrigger asChild>
                                      {block}
                                    </TooltipTrigger>
                                    <TooltipContent className="border-rose-200 bg-rose-600 text-white">
                                      <p>{dailyLimitTooltip}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                );
                              }

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

              <div className="rounded-[0.85rem] border border-slate-200 bg-slate-50 px-1.5 py-1 text-[9px] text-slate-600 sm:rounded-[1.1rem] sm:px-3 sm:py-2 sm:text-xs">
                {isMobile
                  ? "Tap blocks to build your range"
                  : "Click available blocks one by one to build your booking range"}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
                      (selectedSlot.endTimeIdx - selectedSlot.startTimeIdx + 1) *
                      getBookingUnit();
                    const existingBookedMinutes = getExistingBookedMinutesForDay(
                      selectedSlot.dayIdx,
                    );
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

                    const bookingDate = new Date(daysInWeek[selectedSlot.dayIdx]);
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
                      const startSlotTime = Math.floor(weekStart.getTime() / 1000);

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

      <Dialog
        open={Boolean(bookingPendingDelete)}
        onOpenChange={(open) => {
          if (!open && !isDeletingBooking) {
            setBookingPendingDelete(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Booking</DialogTitle>
            <DialogDescription>
              {bookingPendingDelete
                ? `Remove your booking for ${formatBookingSlotDetails(bookingPendingDelete.slot_time, bookingUnit).dayLabel} at ${formatBookingSlotDetails(bookingPendingDelete.slot_time, bookingUnit).timeLabel}?`
                : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={isDeletingBooking}
              onClick={() => setBookingPendingDelete(null)}
              className="h-9 border-slate-200 text-sm text-slate-700"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!bookingPendingDelete || isDeletingBooking}
              className="h-9 bg-rose-600 text-sm text-white hover:bg-rose-700"
              onClick={async () => {
                if (!bookingPendingDelete) {
                  return;
                }

                try {
                  setIsDeletingBooking(true);

                  await deleteBooking({
                    venue_id: bookingPendingDelete.venue_id,
                    slot_time: bookingPendingDelete.slot_time,
                  });

                  setBookings((currentBookings) =>
                    currentBookings.filter(
                      (booking) => booking.slot_time !== bookingPendingDelete.slot_time,
                    ),
                  );
                  setHighlightedBookingKey((currentKey) =>
                    currentKey === getBookingKey(bookingPendingDelete) ? null : currentKey,
                  );
                  setBookingPendingDelete(null);
                  toast.success("Booking removed successfully.");
                } catch (error) {
                  console.error("Failed to remove booking:", error);
                  let errorMessage = "Failed to remove booking. Please try again.";

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

                  toast.error(errorMessage);
                } finally {
                  setIsDeletingBooking(false);
                }
              }}
            >
              {isDeletingBooking ? "Removing..." : "Remove booking"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
