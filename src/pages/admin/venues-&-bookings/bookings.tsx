import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Grid3X3,
  List,
  Loader2,
  MapPin,
  Plus,
  Settings,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import {
  CreateVenueData,
} from "@/components/admin/venues-&-bookings/create-venue-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { ClubContext, ClubContextType } from "@/context/ClubContext";
import { cn } from "@/lib/utils";
import { updateClubDetails } from "@/services/admin/club";
import { createBooking, getBookings, removeBooking } from "@/services/admin-features/bookings";
import { createVenue, getVenues } from "@/services/admin-features/venues";

type Venue = {
  venue_id: string;
  venue_name: string;
  smallest_booking_unit?: number;
  max_daily_booking_time?: number | null;
  times: Array<{
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_closed?: boolean;
  }>;
};

type Booking = {
  slot_time: number;
  name?: string | null;
};

type BookingViewMode = "calendar" | "availability";

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function getWeekStart(date = new Date()) {
  const next = new Date(date);
  const day = next.getDay();
  const diff = next.getDate() - day + (day === 0 ? -6 : 1);
  next.setDate(diff);
  next.setHours(0, 0, 0, 0);
  return next;
}

function getDayStart(date = new Date()) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function getDaysInWeek(start: Date) {
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(start);
    day.setDate(day.getDate() + index);
    return day;
  });
}

function getDaysFrom(start: Date, count: number) {
  return Array.from({ length: count }, (_, index) => {
    const day = new Date(start);
    day.setDate(day.getDate() + index);
    return day;
  });
}

function getVenueDayIndex(date: Date) {
  const day = date.getDay();
  return day === 0 ? 6 : day - 1;
}

function formatWeekRange(days: Date[]) {
  if (days.length === 0) {
    return "No dates selected";
  }

  const format = (date: Date) =>
    date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return `${format(days[0])} - ${format(days[days.length - 1])}`;
}

function formatWeekday(date: Date, weekday: "short" | "long" = "short") {
  return new Intl.DateTimeFormat("en-US", { weekday }).format(date);
}

function formatSlotRange(timeSlots: string[], timeIdx: number) {
  const startTime = timeSlots[timeIdx];
  const endTime = timeIdx + 1 < timeSlots.length ? timeSlots[timeIdx + 1] : "23:59";
  return `${startTime} - ${endTime}`;
}

function abbreviateBookingName(name: string) {
  const normalized = name.trim();
  if (!normalized) return "Booked";
  if (normalized.length <= 12) return normalized;
  const parts = normalized.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return `${normalized.slice(0, 8)}...`;
  const first = parts[0].slice(0, 8);
  const lastInitial = parts[parts.length - 1].charAt(0);
  return `${first} ${lastInitial}.`;
}

function formatDuration(minutes?: number | null) {
  if (!minutes) return "Flexible";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours && mins) return `${hours}h ${mins}m`;
  if (hours) return `${hours}h`;
  return `${mins}m`;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    if ("response" in error && error.response && typeof error.response === "object" && "data" in error.response) {
      const data = (error.response as { data?: { message?: string } }).data;
      if (data?.message) return data.message;
    }
    return error.message;
  }
  return fallback;
}

type VenueEditorProps = {
  initialData?: CreateVenueData & { venue_id?: string };
  isLoading: boolean;
  error: string | null;
  onCancel: () => void;
  onSubmit: (data: CreateVenueData) => void;
};

function VenueEditorCard({ initialData, isLoading, error, onCancel, onSubmit }: VenueEditorProps) {
  const isEditing = !!initialData;
  const [venueId, setVenueId] = useState<string | undefined>(initialData?.venue_id);
  const [venueName, setVenueName] = useState(initialData?.venue_name ?? "");
  const [smallestBookingUnit, setSmallestBookingUnit] = useState<number | "">(initialData?.smallest_booking_unit ?? "");
  const [maxDailyBookingTime, setMaxDailyBookingTime] = useState<number | "">(initialData?.max_daily_booking_time ?? "");
  const [openingTimes, setOpeningTimes] = useState<Record<string, string>>(
    DAYS_OF_WEEK.reduce((acc, day) => ({ ...acc, [day]: "08:00" }), {}),
  );
  const [closingTimes, setClosingTimes] = useState<Record<string, string>>(
    DAYS_OF_WEEK.reduce((acc, day) => ({ ...acc, [day]: "18:00" }), {}),
  );
  const [closedDays, setClosedDays] = useState<Record<string, boolean>>(
    DAYS_OF_WEEK.reduce((acc, day) => ({ ...acc, [day]: false }), {}),
  );
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setVenueId(initialData?.venue_id);
    setVenueName(initialData?.venue_name ?? "");
    setSmallestBookingUnit(initialData?.smallest_booking_unit ?? "");
    setMaxDailyBookingTime(initialData?.max_daily_booking_time ?? "");

    const nextOpeningTimes = DAYS_OF_WEEK.reduce((acc, day) => ({ ...acc, [day]: "08:00" }), {} as Record<string, string>);
    const nextClosingTimes = DAYS_OF_WEEK.reduce((acc, day) => ({ ...acc, [day]: "18:00" }), {} as Record<string, string>);
    const nextClosedDays = DAYS_OF_WEEK.reduce((acc, day) => ({ ...acc, [day]: false }), {} as Record<string, boolean>);

    initialData?.times.forEach((time) => {
      const dayName = DAYS_OF_WEEK[time.day_of_week];
      nextOpeningTimes[dayName] = time.start_time;
      nextClosingTimes[dayName] = time.end_time;
      nextClosedDays[dayName] = time.is_closed || false;
    });

    setOpeningTimes(nextOpeningTimes);
    setClosingTimes(nextClosingTimes);
    setClosedDays(nextClosedDays);
    setFormError(null);
  }, [initialData]);

  const handleSubmit = () => {
    if (!venueName.trim()) {
      setFormError("Please enter a venue name");
      return;
    }
    if (!smallestBookingUnit || smallestBookingUnit < 15) {
      setFormError("Booking unit must be at least 15 minutes");
      return;
    }
    if (smallestBookingUnit % 15 !== 0) {
      setFormError("Booking unit must be a multiple of 15 minutes");
      return;
    }
    if (maxDailyBookingTime && typeof maxDailyBookingTime === "number" && maxDailyBookingTime % 15 !== 0) {
      setFormError("Maximum daily booking time must be a multiple of 15 minutes");
      return;
    }

    setFormError(null);
    onSubmit({
      ...(venueId ? { venue_id: venueId } : {}),
      venue_name: venueName.trim(),
      smallest_booking_unit: typeof smallestBookingUnit === "number" ? smallestBookingUnit : 0,
      max_daily_booking_time: typeof maxDailyBookingTime === "number" ? maxDailyBookingTime : null,
      times: DAYS_OF_WEEK.map((day, index) => ({
        day_of_week: index,
        start_time: openingTimes[day],
        end_time: closingTimes[day],
        is_closed: closedDays[day],
      })),
    });
  };

  return (
    <Card>
      <CardHeader className="border-b pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>{isEditing ? "Edit Venue" : "Create Venue"}</CardTitle>
            <CardDescription>
              {isEditing
                ? "Update the venue details, booking settings, and operating hours."
                : "Configure a new venue before returning to the booking workspace."}
            </CardDescription>
          </div>
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Back To Bookings
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 p-4 sm:p-6">
        {error ? <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div> : null}
        {formError ? <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{formError}</div> : null}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="venue-name">Venue Name</Label>
            <Input id="venue-name" value={venueName} onChange={(event) => { setVenueName(event.target.value); setFormError(null); }} placeholder="Main Hall" disabled={isLoading} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="booking-unit">Minimum Booking Unit</Label>
            <Input id="booking-unit" type="number" min="15" step="15" value={smallestBookingUnit} onChange={(event) => { setSmallestBookingUnit(event.target.value ? parseInt(event.target.value, 10) : ""); setFormError(null); }} placeholder="30" disabled={isLoading} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="daily-time">Maximum Daily Booking Time</Label>
            <Input id="daily-time" type="number" min="15" step="15" value={maxDailyBookingTime} onChange={(event) => { setMaxDailyBookingTime(event.target.value ? parseInt(event.target.value, 10) : ""); setFormError(null); }} placeholder="120" disabled={isLoading} />
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Operating Hours</h3>
            <p className="text-sm text-slate-500">Choose open and closed days for the venue.</p>
          </div>
          <div className="space-y-3">
            {DAYS_OF_WEEK.map((day, index) => (
              <div key={day} className="space-y-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-800">{day}</p>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`closed-${day}`}
                        checked={closedDays[day]}
                        onCheckedChange={(checked) => {
                          setClosedDays((current) => ({ ...current, [day]: checked === true }));
                          setFormError(null);
                        }}
                        disabled={isLoading}
                      />
                      <Label htmlFor={`closed-${day}`} className="text-xs text-slate-600">Closed</Label>
                    </div>
                  </div>
                  {!closedDays[day] ? (
                    <div className="grid flex-1 gap-3 sm:max-w-md sm:grid-cols-2">
                      <div className="grid gap-1.5">
                        <Label htmlFor={`open-${day}`} className="text-xs text-slate-500">Opens</Label>
                        <Input id={`open-${day}`} type="time" value={openingTimes[day]} onChange={(event) => { setOpeningTimes((current) => ({ ...current, [day]: event.target.value })); setFormError(null); }} disabled={isLoading} />
                      </div>
                      <div className="grid gap-1.5">
                        <Label htmlFor={`close-${day}`} className="text-xs text-slate-500">Closes</Label>
                        <Input id={`close-${day}`} type="time" value={closingTimes[day]} onChange={(event) => { setClosingTimes((current) => ({ ...current, [day]: event.target.value })); setFormError(null); }} disabled={isLoading} />
                      </div>
                    </div>
                  ) : null}
                </div>
                {index < DAYS_OF_WEEK.length - 1 ? <Separator /> : null}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t pt-4">
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (isEditing ? "Updating..." : "Creating...") : (isEditing ? "Update Venue" : "Create Venue")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function BookingsPage() {
  const { club, setClub } = useContext(ClubContext) as ClubContextType;

  const [venues, setVenues] = useState<Venue[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingVenues, setLoadingVenues] = useState(false);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [venuesEnabled, setVenuesEnabled] = useState<boolean>(Boolean(club?.venues_enabled));
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getDayStart());
  const [viewMode, setViewMode] = useState<BookingViewMode>("availability");
  const [showSettings, setShowSettings] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [isVenueEditorOpen, setIsVenueEditorOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [venueDialogError, setVenueDialogError] = useState<string | null>(null);
  const [isSavingVenue, setIsSavingVenue] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ dayIdx: number; startIdx: number; endIdx: number } | null>(null);
  const [dragStart, setDragStart] = useState<{ dayIdx: number; timeIdx: number } | null>(null);
  const [dragEnd, setDragEnd] = useState<{ dayIdx: number; timeIdx: number } | null>(null);
  const [selectionAnchor, setSelectionAnchor] = useState<{ dayIdx: number; timeIdx: number } | null>(null);
  const [lastClickedSlot, setLastClickedSlot] = useState<{ dayIdx: number; timeIdx: number } | null>(null);
  const [bookingName, setBookingName] = useState("");
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);
  const [deleteSlotTime, setDeleteSlotTime] = useState<number | null>(null);
  const [deleteBookingName, setDeleteBookingName] = useState<string | null>(null);
  const [isDeletingBooking, setIsDeletingBooking] = useState(false);
  const timeSlotsRef = useRef<HTMLDivElement>(null);

  const daysInWeek = useMemo(() => getDaysInWeek(getWeekStart(currentWeekStart)), [currentWeekStart]);
  const visibleDayCount = viewMode === "availability" ? 5 : 7;
  const visibleRangeStart = useMemo(
    () => (viewMode === "availability" ? currentWeekStart : getWeekStart(currentWeekStart)),
    [currentWeekStart, viewMode],
  );
  const visibleDays = useMemo(
    () => (viewMode === "availability" ? getDaysFrom(visibleRangeStart, visibleDayCount) : daysInWeek),
    [daysInWeek, visibleDayCount, viewMode, visibleRangeStart],
  );
  const selectedVenue = useMemo(
    () => venues.find((venue) => venue.venue_id === selectedVenueId) ?? null,
    [selectedVenueId, venues],
  );
  const bookingUnit = selectedVenue?.smallest_booking_unit || 60;
  const filteredVenues = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query ? venues.filter((venue) => venue.venue_name.toLowerCase().includes(query)) : venues;
  }, [search, venues]);

  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    for (let minutes = 0; minutes < 24 * 60; minutes += bookingUnit) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      slots.push(`${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`);
    }
    return slots;
  }, [bookingUnit]);

  const fetchVenues = useCallback(async () => {
    if (!club?.club_account_id) return;
    try {
      setLoadingVenues(true);
      setError(null);
      const response = await getVenues(club.club_account_id);
      const nextVenues = (response.venues || []) as Venue[];
      setVenuesEnabled(Boolean(response.venues_enabled));
      setVenues(nextVenues);
      setSelectedVenueId((current) => {
        if (current && nextVenues.some((venue) => venue.venue_id === current)) return current;
        return nextVenues[0]?.venue_id ?? null;
      });
    } catch (fetchError) {
      setError(getErrorMessage(fetchError, "Failed to fetch venues"));
    } finally {
      setLoadingVenues(false);
    }
  }, [club?.club_account_id]);

  const fetchBookings = useCallback(async () => {
    if (!selectedVenueId) {
      setBookings([]);
      return;
    }
    try {
      setLoadingBookings(true);
      const start = Math.floor(visibleRangeStart.getTime() / 1000);
      const endDate = new Date(visibleRangeStart);
      endDate.setDate(endDate.getDate() + visibleDayCount);
      const end = Math.floor(endDate.getTime() / 1000);
      const response = await getBookings(selectedVenueId, String(start), String(end));
      setBookings((response.bookings || []) as Booking[]);
    } catch (fetchError) {
      toast.error(getErrorMessage(fetchError, "Failed to fetch bookings"));
    } finally {
      setLoadingBookings(false);
    }
  }, [selectedVenueId, visibleDayCount, visibleRangeStart]);

  useEffect(() => {
    fetchVenues();
  }, [fetchVenues]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  useEffect(() => {
    if (!timeSlotsRef.current || viewMode !== "calendar") return;
    const rowHeight = bookingUnit === 15 ? 12 : bookingUnit === 30 ? 24 : bookingUnit === 45 ? 36 : 48;
    const slotsPerHour = 60 / bookingUnit;
    timeSlotsRef.current.scrollTop = 8 * slotsPerHour * rowHeight;
  }, [bookingUnit, selectedVenueId, viewMode]);

  const getSchedule = useCallback(
    (date: Date) => selectedVenue?.times.find((time) => time.day_of_week === getVenueDayIndex(date)) ?? null,
    [selectedVenue],
  );
  const isDayClosed = useCallback((date: Date) => !!getSchedule(date)?.is_closed, [getSchedule]);
  const isPastDay = (date: Date) => {
    return getDayStart(date) < getDayStart();
  };
  const isWithinHours = useCallback(
    (date: Date, time: string) => {
      const schedule = getSchedule(date);
      if (!schedule || schedule.is_closed) return false;
      const [hour, minute] = time.split(":").map(Number);
      const [startHour, startMinute] = schedule.start_time.split(":").map(Number);
      const [endHour, endMinute] = schedule.end_time.split(":").map(Number);
      const current = hour * 60 + minute;
      const start = startHour * 60 + startMinute;
      const end = endHour * 60 + endMinute;
      return current >= start && current < end;
    },
    [getSchedule],
  );
  const getBookingForSlot = (dayIdx: number, timeIdx: number) => {
    const slotDate = new Date(visibleDays[dayIdx]);
    const [hour, minute] = timeSlots[timeIdx].split(":").map(Number);
    slotDate.setHours(hour, minute, 0, 0);
    const slotTime = Math.floor(slotDate.getTime() / 1000);
    return bookings.find((booking) => booking.slot_time === slotTime) ?? null;
  };

  const isSlotBooked = (dayIdx: number, timeIdx: number) => !!getBookingForSlot(dayIdx, timeIdx);

  const isSlotDisabled = (dayIdx: number, timeIdx: number, date: Date) => {
    return isPastDay(date) || isDayClosed(date) || !isWithinHours(date, timeSlots[timeIdx]) || isSlotBooked(dayIdx, timeIdx);
  };

  const isSlotSelected = (dayIdx: number, timeIdx: number) => {
    if (!selectedSlot || selectedSlot.dayIdx !== dayIdx) return false;
    return timeIdx >= selectedSlot.startIdx && timeIdx <= selectedSlot.endIdx;
  };

  const clearSelectedBookingRange = useCallback(() => {
    setSelectedSlot(null);
    setSelectionAnchor(null);
    setLastClickedSlot(null);
    setBookingError(null);
    setIsBookingDialogOpen(false);
  }, []);

  const selectedSlotSummary = selectedSlot
    ? `${formatWeekday(visibleDays[selectedSlot.dayIdx], "long")} ${visibleDays[selectedSlot.dayIdx].getDate()} • ${timeSlots[selectedSlot.startIdx]} - ${
        selectedSlot.endIdx + 1 < timeSlots.length ? timeSlots[selectedSlot.endIdx + 1] : "23:59"
      }`
    : null;

  const visibleSlotIndicesByDay = useMemo(
    () =>
      visibleDays.map((date) =>
        timeSlots.reduce<number[]>((indices, _slot, timeIdx) => {
          if (!isPastDay(date) && !isDayClosed(date) && isWithinHours(date, timeSlots[timeIdx])) {
            indices.push(timeIdx);
          }
          return indices;
        }, []),
      ),
    [isDayClosed, isWithinHours, timeSlots, visibleDays],
  );

  useEffect(() => {
    if (!dragStart && !dragEnd) return;
    const handleMouseUp = () => {
      if (!dragStart || !dragEnd || dragStart.dayIdx !== dragEnd.dayIdx) {
        setDragStart(null);
        setDragEnd(null);
        return;
      }
      setSelectedSlot({
        dayIdx: dragStart.dayIdx,
        startIdx: Math.min(dragStart.timeIdx, dragEnd.timeIdx),
        endIdx: Math.max(dragStart.timeIdx, dragEnd.timeIdx),
      });
      setIsBookingDialogOpen(true);
      setDragStart(null);
      setDragEnd(null);
    };
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, [dragEnd, dragStart]);

  useEffect(() => {
    clearSelectedBookingRange();
  }, [clearSelectedBookingRange, currentWeekStart, selectedVenueId, viewMode]);

  const handleAvailabilitySlotClick = (dayIdx: number, timeIdx: number) => {
    const date = visibleDays[dayIdx];
    if (!date || isSlotDisabled(dayIdx, timeIdx, date)) {
      setSelectedSlot(null);
      setSelectionAnchor(null);
      setLastClickedSlot(null);
      return;
    }

    const clickedSameSlot = lastClickedSlot?.dayIdx === dayIdx && lastClickedSlot?.timeIdx === timeIdx;
    setLastClickedSlot({ dayIdx, timeIdx });

    if (!selectedSlot || selectedSlot.dayIdx !== dayIdx || !selectionAnchor || selectionAnchor.dayIdx !== dayIdx) {
      setSelectionAnchor({ dayIdx, timeIdx });
      setSelectedSlot({ dayIdx, startIdx: timeIdx, endIdx: timeIdx });
      return;
    }

    if (clickedSameSlot) {
      setSelectionAnchor({ dayIdx, timeIdx });
      setSelectedSlot({ dayIdx, startIdx: timeIdx, endIdx: timeIdx });
      return;
    }

    const startIdx = Math.min(selectionAnchor.timeIdx, timeIdx);
    const endIdx = Math.max(selectionAnchor.timeIdx, timeIdx);

    for (let idx = startIdx; idx <= endIdx; idx += 1) {
      if (isSlotDisabled(dayIdx, idx, date)) {
        toast.error("Selection can only include available, unbooked slots.");
        return;
      }
    }

    setSelectedSlot({ dayIdx, startIdx, endIdx });
  };

  const handleSaveVenue = async (data: CreateVenueData) => {
    if (!club?.club_account_id) return;
    try {
      setIsSavingVenue(true);
      setVenueDialogError(null);
      await createVenue({
        club_account_id: club.club_account_id,
        ...data,
      });
      toast.success(data.venue_id ? "Venue updated" : "Venue created");
      setIsVenueEditorOpen(false);
      setEditingVenue(null);
      await fetchVenues();
    } catch (saveError) {
      setVenueDialogError(getErrorMessage(saveError, "Failed to save venue"));
    } finally {
      setIsSavingVenue(false);
    }
  };

  const handleToggleVenues = async (enabled: boolean) => {
    if (!club?.club_account_id) return;
    try {
      setIsToggling(true);
      const response = await updateClubDetails({ club_account_id: club.club_account_id, venues_enabled: enabled });
      if (response?.message) {
        setVenuesEnabled(enabled);
        setClub({ ...club, venues_enabled: enabled });
        toast.success(enabled ? "Bookings enabled successfully" : "Bookings disabled successfully");
      }
    } catch (toggleError) {
      toast.error(getErrorMessage(toggleError, "Failed to update bookings settings"));
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div className="space-y-6 px-4 pb-6 pt-4 md:px-6 md:pb-8 md:pt-6">
      {selectedSlot && viewMode === "availability" && !isVenueEditorOpen ? (
        <div className="fixed left-1/2 top-2 z-50 w-[calc(100vw-1rem)] max-w-5xl -translate-x-1/2 sm:top-4 sm:w-[calc(100vw-1.5rem)]">
          <div className="relative flex flex-col gap-2 overflow-hidden rounded-[1.25rem] border border-sky-800 bg-sky-700 px-3 py-2 shadow-[0_28px_80px_-32px_rgba(3,105,161,0.55)] ring-2 ring-sky-900/20 sm:flex-row sm:items-center sm:justify-between sm:gap-2.5 sm:rounded-[1.5rem] sm:px-4 sm:py-2.5">
            <div className="pointer-events-none absolute inset-y-0 left-0 w-1.5 bg-sky-950" />
            <button
              type="button"
              onClick={clearSelectedBookingRange}
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
              <p className="mt-0.5 text-[11px] text-sky-100 sm:mt-1 sm:text-xs">
                Continue when you are happy with the selected booking range.
              </p>
            </div>

            <div className="mr-8 flex items-center gap-1.5 sm:mr-10 sm:gap-2 sm:flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={clearSelectedBookingRange}
                className="h-8 border-sky-200 bg-white px-2.5 text-[11px] text-sky-800 hover:bg-sky-100 sm:h-8.5 sm:px-3 sm:text-xs"
              >
                Clear
              </Button>
              <Button
                size="sm"
                onClick={() => setIsBookingDialogOpen(true)}
                className="h-8 bg-sky-950 px-2.5 text-[11px] text-white shadow-[0_12px_28px_-18px_rgba(12,74,110,0.85)] hover:bg-sky-900 sm:h-8.5 sm:px-3 sm:text-xs"
              >
                Create Booking
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <Card className="overflow-hidden border-slate-200/70 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] shadow-[0_28px_80px_-36px_rgba(15,23,42,0.28)]">
        <CardContent className="p-5 md:p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                <CalendarDays className="h-3.5 w-3.5" />
                Venues and Bookings
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl">Run venue operations from one workspace</h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 md:text-base">Manage venue setup, inspect weekly usage, and switch between a calendar and table view for bookings without jumping between separate admin pages.</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {venuesEnabled && (
                <Button variant="outline" className="rounded-full" onClick={() => setShowSettings(true)}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Button>
              )}
              <Button className="rounded-full bg-zinc-900 text-white hover:bg-zinc-800" onClick={() => { setEditingVenue(null); setVenueDialogError(null); setIsVenueEditorOpen(true); }}>
                <Plus className="mr-2 h-4 w-4" />
                Create Venue
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {!venuesEnabled && (
        <Card className="overflow-hidden border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 shadow-sm">
          <CardContent className="flex flex-col gap-4 px-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-amber-300 bg-amber-100"><AlertCircle className="h-4 w-4 text-amber-700" /></div>
              <div><p className="text-sm font-semibold text-amber-950 md:text-base">Venues and bookings are currently disabled</p><p className="mt-1 max-w-2xl text-sm leading-6 text-amber-800">Enable bookings to let members see venues and start receiving venue reservations.</p></div>
            </div>
            <Button className="rounded-full bg-amber-700 text-white hover:bg-amber-800" onClick={() => handleToggleVenues(true)} disabled={isToggling}>{isToggling ? "Enabling..." : "Enable Bookings"}</Button>
          </CardContent>
        </Card>
      )}

      {(loadingVenues || error || venues.length > 0) && (
        <div className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
          <Card className="xl:sticky xl:top-24 xl:self-start">
            <CardContent className="space-y-4 p-5">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Venue Selection</p>
                <h2 className="mt-1 text-xl font-semibold text-slate-950">{selectedVenue?.venue_name || "Choose a venue"}</h2>
                <p className="mt-1 text-sm text-slate-500">Select the venue to manage from this panel, then use the booking board to switch between availability and calendar views.</p>
              </div>
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search venues..." className="rounded-full" />
              {loadingVenues ? <div className="flex items-center justify-center gap-2 rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-8 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />Loading venues...</div> : error ? <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div> : filteredVenues.length === 0 ? <div className="rounded-[1.25rem] border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">{venues.length === 0 ? "No venues found. Create your first venue to get started." : "No venues match your current search."}</div> : <div className="space-y-2">{filteredVenues.map((venue) => <button key={venue.venue_id} type="button" onClick={() => setSelectedVenueId(venue.venue_id)} className={cn("w-full rounded-[1.25rem] border bg-white p-3 text-left text-slate-900 transition-all", selectedVenueId === venue.venue_id ? "border-slate-900 shadow-[0_0_0_1px_rgba(15,23,42,0.2)]" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50")}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex items-center gap-2"><MapPin className={cn("h-4 w-4 shrink-0", selectedVenueId === venue.venue_id ? "text-slate-900" : "text-slate-500")} /><p className="truncate text-sm font-semibold">{venue.venue_name}</p></div><p className="mt-1 text-xs text-slate-500">{venue.smallest_booking_unit || 60} minute booking unit</p></div><span onClick={(event) => { event.stopPropagation(); setEditingVenue(venue); setVenueDialogError(null); setIsVenueEditorOpen(true); }} className={cn("rounded-full border p-2", selectedVenueId === venue.venue_id ? "border-slate-300 text-slate-700" : "border-slate-200 text-slate-600")}><Edit2 className="h-3.5 w-3.5" /></span></div></button>)}</div>}
            </CardContent>
          </Card>

          <AnimatePresence mode="wait" initial={false}>
            {isVenueEditorOpen ? (
              <motion.div
                key="venue-editor-view"
                initial={{ opacity: 0, rotateY: 18, x: 20 }}
                animate={{ opacity: 1, rotateY: 0, x: 0 }}
                exit={{ opacity: 0, rotateY: -18, x: -20 }}
                transition={{ duration: 0.28, ease: "easeInOut" }}
                style={{ transformStyle: "preserve-3d" }}
              >
                <VenueEditorCard
                  initialData={editingVenue ? { venue_id: editingVenue.venue_id, venue_name: editingVenue.venue_name, smallest_booking_unit: editingVenue.smallest_booking_unit || 60, max_daily_booking_time: editingVenue.max_daily_booking_time ?? null, times: editingVenue.times } : undefined}
                  isLoading={isSavingVenue}
                  error={venueDialogError}
                  onCancel={() => { setIsVenueEditorOpen(false); setEditingVenue(null); setVenueDialogError(null); }}
                  onSubmit={handleSaveVenue}
                />
              </motion.div>
            ) : (
              <motion.div
                key="bookings-board-view"
                initial={{ opacity: 0, rotateY: -18, x: -20 }}
                animate={{ opacity: 1, rotateY: 0, x: 0 }}
                exit={{ opacity: 0, rotateY: 18, x: 20 }}
                transition={{ duration: 0.28, ease: "easeInOut" }}
                style={{ transformStyle: "preserve-3d" }}
              >
                <Card>
                  <CardHeader className="gap-4 border-b border-slate-200/80 pb-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <CardTitle>{selectedVenue ? "Available Blocks" : "Select a Venue"}</CardTitle>
                      <CardDescription>{selectedVenue ? (viewMode === "calendar" ? "Inspect booked and open slots across the week for the selected venue." : "Use the same block-based availability view members use when reserving a venue.") : "Choose a venue from the left-hand panel to start managing bookings."}</CardDescription>
                    </div>
                          <div className="flex flex-col items-stretch gap-3 md:min-w-[260px] md:max-w-[320px]">
                            {selectedVenue ? <div className="flex flex-wrap gap-2"><Badge variant="outline">{bookingUnit}m booking unit</Badge><Badge variant="outline">{bookings.length} booked slots</Badge></div> : null}
                            <div className="rounded-[1rem] border border-slate-200 bg-slate-50 p-3">
                              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Range in view</p>
                              <p className="mt-1.5 text-base font-semibold text-slate-950">{formatWeekRange(visibleDays)}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-2 rounded-[1rem] border border-slate-200 bg-white p-1">
                              <Button variant="ghost" size="sm" className={cn("rounded-[0.8rem] text-slate-600 hover:bg-slate-100", viewMode === "availability" && "border border-slate-900 bg-slate-50 font-medium text-slate-950")} onClick={() => setViewMode("availability")}><List className="mr-2 h-4 w-4" />Available Blocks</Button>
                              <Button variant="ghost" size="sm" className={cn("rounded-[0.8rem] text-slate-600 hover:bg-slate-100", viewMode === "calendar" && "border border-slate-900 bg-slate-50 font-medium text-slate-950")} onClick={() => setViewMode("calendar")}><Grid3X3 className="mr-2 h-4 w-4" />Calendar View</Button>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <Button variant="outline" size="sm" onClick={() => { const next = new Date(currentWeekStart); next.setDate(next.getDate() - visibleDayCount); setCurrentWeekStart(next); }} disabled={viewMode === "availability" ? currentWeekStart.getTime() <= getDayStart().getTime() : getWeekStart(currentWeekStart).getTime() <= getWeekStart().getTime()}><ChevronLeft className="mr-1 h-4 w-4" />Previous</Button>
                              <Button variant="outline" size="sm" onClick={() => setCurrentWeekStart(getDayStart())}>Today</Button>
                              <Button variant="outline" size="sm" onClick={() => { const next = new Date(currentWeekStart); next.setDate(next.getDate() + visibleDayCount); setCurrentWeekStart(next); }}>Next<ChevronRight className="ml-1 h-4 w-4" /></Button>
                            </div>
                          </div>
                  </CardHeader>
                  <CardContent className="p-4 md:p-5">
                    {!selectedVenue ? <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500">Choose a venue from the left-hand panel to inspect its availability and bookings.</div> : loadingBookings ? <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />Loading bookings...</div> : viewMode === "availability" ? <div className="space-y-4"><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{visibleDays.map((date, dayIdx) => { const visibleSlotIndices = visibleSlotIndicesByDay[dayIdx] || []; const isClosed = isDayClosed(date); return <div key={date.toISOString()} className="rounded-[1.25rem] border border-slate-200 bg-white p-3 shadow-[0_16px_40px_-30px_rgba(15,23,42,0.18)]"><div className="mb-3 border-b border-slate-200 pb-3 text-center"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{formatWeekday(date)}</p><p className="mt-1 text-base font-semibold text-slate-950">{date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p></div>{isClosed ? <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-5 text-center text-sm text-slate-500">Closed</div> : visibleSlotIndices.length === 0 ? <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-5 text-center text-sm text-slate-500">No booking blocks available</div> : <div className="grid grid-cols-2 gap-2">{visibleSlotIndices.map((timeIdx) => { const booking = getBookingForSlot(dayIdx, timeIdx); const isBooked = !!booking; const isSelected = isSlotSelected(dayIdx, timeIdx); return <button key={`${dayIdx}-${timeIdx}`} type="button" onClick={() => { if (isBooked && booking) { setDeleteSlotTime(booking.slot_time); setDeleteBookingName(booking.name || "Booked"); return; } handleAvailabilitySlotClick(dayIdx, timeIdx); }} className={cn("h-14 rounded-xl border px-2 py-1 text-[11px] transition-colors", isSelected ? "border-slate-900 bg-slate-900 text-white" : isBooked ? "cursor-pointer border-slate-300 bg-slate-200 text-slate-700 shadow-inner" : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100")}><div className="flex h-full flex-col items-center justify-center gap-1 overflow-hidden leading-none"><span className="truncate font-semibold">{formatSlotRange(timeSlots, timeIdx)}</span>{isBooked && booking?.name ? <span className="max-w-full truncate rounded-full border border-slate-400/60 bg-slate-100 px-1 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-700">{abbreviateBookingName(booking.name)}</span> : null}</div></button>; })}</div>}</div>; })}</div><div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">Click available blocks one by one to build your booking range. Click a booked block to inspect and delete that booking slot.</div></div> : <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white"><div className="grid grid-cols-8 border-b border-slate-200 bg-slate-50"><div className="border-r border-slate-200 p-3 text-center text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Time</div>{visibleDays.map((date) => <div key={date.toISOString()} className={cn("border-r border-slate-200 p-3 text-center last:border-r-0", (isDayClosed(date) || isPastDay(date)) && "bg-slate-100 opacity-60")}><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{formatWeekday(date, "long")}</p><p className="mt-1 text-lg font-semibold text-slate-900">{date.getDate()}</p></div>)}</div><div ref={timeSlotsRef} className="max-h-[620px] overflow-y-auto" onMouseLeave={() => setDragEnd(dragStart || dragEnd)}>{timeSlots.map((time, timeIdx) => <div key={time} className={cn("grid grid-cols-8 border-b border-slate-200", bookingUnit === 15 ? "min-h-3" : bookingUnit === 30 ? "min-h-6" : bookingUnit === 45 ? "min-h-9" : "min-h-12")}><div className="border-r border-slate-200 bg-slate-50 px-2 py-0 text-xs font-semibold text-slate-500">{time.endsWith(":00") ? <span className="relative -top-2 inline-block bg-white px-1">{time}</span> : null}</div>{visibleDays.map((date, dayIdx) => { const booking = getBookingForSlot(dayIdx, timeIdx); const booked = !!booking; const disabled = isPastDay(date) || isDayClosed(date) || !isWithinHours(date, time) || booked; const selected = dragStart && dragEnd && dragStart.dayIdx === dayIdx && dragEnd.dayIdx === dayIdx && timeIdx >= Math.min(dragStart.timeIdx, dragEnd.timeIdx) && timeIdx <= Math.max(dragStart.timeIdx, dragEnd.timeIdx); return <div key={`${date.toISOString()}-${time}`} className={cn("relative border-r border-slate-200 last:border-r-0", booked && "bg-rose-500 hover:bg-rose-600", !booked && !disabled && "cursor-pointer hover:bg-sky-50", disabled && !booked && "bg-slate-100/80", selected && "bg-sky-600 hover:bg-sky-600")} onMouseDown={() => { if (!disabled) { setDragStart({ dayIdx, timeIdx }); setDragEnd({ dayIdx, timeIdx }); } }} onMouseEnter={() => { if (dragStart && dragStart.dayIdx === dayIdx && !booked) setDragEnd({ dayIdx, timeIdx }); }} onClick={() => { if (booking) { setDeleteSlotTime(booking.slot_time); setDeleteBookingName(booking.name || "Booked"); } }}>{booking ? <div className="flex h-full min-h-full flex-col items-center justify-center px-1 py-2 text-center text-[11px] font-semibold text-white"><span>{time} - {timeSlots[timeIdx + 1] || "23:59"}</span><span className="truncate">{booking.name || "Booked"}</span></div> : null}</div>; })}</div>)}</div><div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500"><span>Drag across open slots to create a booking.</span><span>Click an existing booking to delete that slot.</span></div></div>}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {selectedSlot && <Dialog open={isBookingDialogOpen} onOpenChange={(open) => { setIsBookingDialogOpen(open); if (!open) { setSelectedSlot(null); setBookingError(null); setBookingName(""); } }}><DialogContent><DialogHeader><DialogTitle>Create Booking</DialogTitle><DialogDescription>{formatWeekday(visibleDays[selectedSlot.dayIdx], "long")}, {visibleDays[selectedSlot.dayIdx].getDate()}</DialogDescription></DialogHeader><div className="space-y-4"><div><Label htmlFor="booking-name">Booking Name</Label><Input id="booking-name" className="mt-1" value={bookingName} onChange={(event) => setBookingName(event.target.value)} /></div><div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-slate-700"><p><span className="font-semibold">Time:</span> {timeSlots[selectedSlot.startIdx]} - {timeSlots[selectedSlot.endIdx + 1] || "23:59"}</p><p className="mt-2 text-xs text-slate-500"><span className="font-semibold">Duration:</span> {(selectedSlot.endIdx - selectedSlot.startIdx + 1) * bookingUnit} minutes</p></div>{bookingError && <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{bookingError}</div>}</div><DialogFooter><Button variant="outline" onClick={() => { setIsBookingDialogOpen(false); setSelectedSlot(null); setBookingError(null); setBookingName(""); }}>Cancel</Button><Button disabled={isCreatingBooking} onClick={async () => { if (!selectedVenueId || !selectedVenue) { setBookingError("Please select a venue first."); return; } if (!bookingName.trim()) { setBookingError("Please enter a booking name."); return; } const duration = (selectedSlot.endIdx - selectedSlot.startIdx + 1) * bookingUnit; if (selectedVenue.max_daily_booking_time && duration > selectedVenue.max_daily_booking_time) { setBookingError(`Booking duration exceeds the venue's maximum daily booking time of ${formatDuration(selectedVenue.max_daily_booking_time)}.`); return; } const bookingDate = new Date(visibleDays[selectedSlot.dayIdx]); const [startHour, startMinute] = timeSlots[selectedSlot.startIdx].split(":").map(Number); bookingDate.setHours(startHour, startMinute, 0, 0); try { setIsCreatingBooking(true); setBookingError(null); await createBooking({ venue_id: selectedVenueId, smallest_booking_unit: bookingUnit, start_time: Math.floor(bookingDate.getTime() / 1000), name: bookingName.trim(), duration }); toast.success("Booking created successfully"); await fetchBookings(); setIsBookingDialogOpen(false); setSelectedSlot(null); setBookingName(""); } catch (createError) { setBookingError(getErrorMessage(createError, "Failed to create booking.")); } finally { setIsCreatingBooking(false); } }}>{isCreatingBooking ? "Creating..." : "Create Booking"}</Button></DialogFooter></DialogContent></Dialog>}

      <Dialog open={deleteSlotTime !== null} onOpenChange={(open) => { if (!open) { setDeleteSlotTime(null); setDeleteBookingName(null); } }}><DialogContent><DialogHeader><DialogTitle>Booking Details</DialogTitle><DialogDescription>Review the selected slot before deleting it.</DialogDescription></DialogHeader>{deleteSlotTime && <div className="space-y-4 text-sm text-slate-700"><div><p className="font-semibold text-slate-900">Booking name</p><p className="mt-1">{deleteBookingName}</p></div><div><p className="font-semibold text-slate-900">Slot time</p><p className="mt-1">{new Date(deleteSlotTime * 1000).toLocaleString()}</p></div></div>}<DialogFooter><Button variant="outline" onClick={() => { setDeleteSlotTime(null); setDeleteBookingName(null); }}>Close</Button><Button variant="destructive" disabled={isDeletingBooking || !deleteSlotTime || !selectedVenueId} onClick={async () => { if (!deleteSlotTime || !selectedVenueId) return; try { setIsDeletingBooking(true); await removeBooking({ venue_id: selectedVenueId, slot_time: deleteSlotTime }); toast.success("Booking deleted successfully"); await fetchBookings(); setDeleteSlotTime(null); setDeleteBookingName(null); } catch (deleteError) { toast.error(getErrorMessage(deleteError, "Failed to delete booking")); } finally { setIsDeletingBooking(false); } }}>{isDeletingBooking ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Deleting...</> : <><Trash2 className="mr-2 h-4 w-4" />Delete Slot</>}</Button></DialogFooter></DialogContent></Dialog>

      <Dialog open={showSettings} onOpenChange={setShowSettings}><DialogContent><DialogHeader><DialogTitle>Bookings Settings</DialogTitle><DialogDescription>Control whether venue bookings are visible and available for your club.</DialogDescription></DialogHeader><div className="py-4"><div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"><div><Label className="text-base font-semibold">Enable Bookings</Label><p className="mt-1 text-sm text-slate-500">Turn venue bookings on or off for this club.</p></div><Switch checked={venuesEnabled} onCheckedChange={handleToggleVenues} disabled={isToggling} /></div></div><DialogFooter><Button variant="outline" onClick={() => setShowSettings(false)}>Close</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
}
