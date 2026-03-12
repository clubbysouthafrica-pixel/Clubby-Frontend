import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
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
import { createBooking, getBookings } from "@/services/bookings";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

interface MemberBookingsProps {
  venues: any[];
  loading: boolean;
  error: string | null;
  memberName?: string;
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
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(today.setDate(diff));
  });
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [hasInitialScrolled, setHasInitialScrolled] = useState(false);
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
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);
  const [bookingName, setBookingName] = useState(memberName);
  const timeSlotsRef = useRef<HTMLDivElement>(null);

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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

  useEffect(() => {
    if (venues.length > 0 && !selectedVenueId) {
      setSelectedVenueId(venues[0].venue_id);
    }
  }, [venues, selectedVenueId]);

  useEffect(() => {
    // Clear bookings when loading starts
    if (bookingsLoading) {
      setBookings([]);
    }
  }, [bookingsLoading]);

  useEffect(() => {
    // Reset initial scroll flag when venue changes
    setHasInitialScrolled(false);
  }, [selectedVenueId]);

  useLayoutEffect(() => {
    // Scroll to 8am when venue is selected, don't wait for bookings
    if (timeSlotsRef.current && !hasInitialScrolled && selectedVenueId) {
      const bookingUnit = getBookingUnit();
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
  }, [selectedVenueId, hasInitialScrolled]);

  useEffect(() => {
    if (!selectedVenueId) return;

    const fetchBookingsForWeek = async () => {
      try {
        setBookingsLoading(true);
        const weekStart = new Date(currentWeekStart);
        weekStart.setHours(0, 0, 0, 0);
        const startSlotTime = Math.floor(weekStart.getTime() / 1000);

        const weekEnd = new Date(currentWeekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);
        weekEnd.setHours(0, 0, 0, 0);
        const endSlotTime = Math.floor(weekEnd.getTime() / 1000);

        const response = await getBookings(
          selectedVenueId,
          String(startSlotTime),
          String(endSlotTime)
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
  }, [selectedVenueId, currentWeekStart]);

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

  const validateSelectionDuration = (
    startTimeIdx: number,
    endTimeIdx: number
  ): { isValid: boolean; error?: string } => {
    const venue = getSelectedVenue();
    if (!venue?.max_daily_booking_time) {
      return { isValid: true };
    }

    const durationMinutes = (endTimeIdx - startTimeIdx + 1) * getBookingUnit();
    const maxDurationMinutes = venue.max_daily_booking_time;

    if (durationMinutes > maxDurationMinutes) {
      const maxHours = Math.floor(maxDurationMinutes / 60);
      const maxMins = maxDurationMinutes % 60;
      const selectedHours = Math.floor(durationMinutes / 60);
      const selectedMins = durationMinutes % 60;

      return {
        isValid: false,
        error: `Selection exceeds maximum (${selectedHours}h ${selectedMins}m > ${maxHours}h ${maxMins}m)`,
      };
    }

    return { isValid: true };
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
        `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`
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

  const isPastDay = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
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
      const bookingEnd = booking.slot_time + getBookingUnit() * 60;

      return slotTime < bookingEnd && slotEndTime > bookingStart;
    });
  };

  const getBookingNameForSlot = (dayIdx: number, timeIdx: number): string | null => {
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

  const formatWeekRange = () => {
    const startDate = daysInWeek[0];
    const endDate = daysInWeek[6];
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

  const canGoPrevious = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return currentWeekStart > today;
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
    const isBooked = isSlotBooked(dayIdx, timeIdx);
    const isDisabled = isPast || isClosed || !isAvailable || isBooked;

    if (!isDisabled && !isMobile) {
      setDragStart({ dayIdx, timeIdx });
      setDragEnd({ dayIdx, timeIdx });
    }
  };

  const handleSlotMouseEnter = (dayIdx: number, timeIdx: number) => {
    if (dragStart && !isMobile) {
      setDragEnd({ dayIdx, timeIdx });
    }
  };

  const handleSlotMouseUp = () => {
    if (dragStart && dragEnd) {
      const minTime = Math.min(dragStart.timeIdx, dragEnd.timeIdx);
      const maxTime = Math.max(dragStart.timeIdx, dragEnd.timeIdx);

      const validation = validateSelectionDuration(minTime, maxTime);
      setSelectionError(validation.error || null);

      setSelectedSlot({
        dayIdx: dragStart.dayIdx,
        startTimeIdx: minTime,
        endTimeIdx: maxTime,
      });
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
      setSelectedSlot(null);
      setBookingDialogError(null);
      setBookingName(memberName);
    }
  };

  useEffect(() => {
    setBookingName(memberName);
  }, [memberName]);

  const handleSlotTouchStart = (dayIdx: number, timeIdx: number) => {
    const isPast = isPastDay(daysInWeek[dayIdx]);
    const isClosed = isDayClosedForVenue(dayIdx);
    const isAvailable = isTimeInOperatingHours(timeSlots[timeIdx], dayIdx);
    const isBooked = isSlotBooked(dayIdx, timeIdx);
    const isDisabled = isPast || isClosed || !isAvailable || isBooked;

    if (!isDisabled) {
      if (isMobile) {
        // On mobile, handle tap-to-select for multiple slots
        if (!selectedSlot) {
          // No selection yet - start new selection
          setSelectedSlot({
            dayIdx,
            startTimeIdx: timeIdx,
            endTimeIdx: timeIdx,
          });
          setSelectionError(null);
        } else if (selectedSlot.dayIdx !== dayIdx) {
          // Different day - reset selection
          setSelectedSlot(null);
          setSelectionError(null);
        } else {
          // Same day - check if clicked slot is within current selection
          const isWithinSelection =
            timeIdx >= selectedSlot.startTimeIdx &&
            timeIdx <= selectedSlot.endTimeIdx;

          if (isWithinSelection) {
            // Clicking within current selection - deselect it
            setSelectedSlot(null);
            setSelectionError(null);
          } else {
            // Clicking outside current selection - expand the range
            const minTime = Math.min(selectedSlot.startTimeIdx, timeIdx);
            const maxTime = Math.max(selectedSlot.endTimeIdx, timeIdx);
            
            const validation = validateSelectionDuration(minTime, maxTime);
            setSelectionError(validation.error || null);
            
            setSelectedSlot({
              dayIdx,
              startTimeIdx: minTime,
              endTimeIdx: maxTime,
            });
          }
        }
      } else {
        // Desktop: start drag selection
        setDragStart({ dayIdx, timeIdx });
        setDragEnd({ dayIdx, timeIdx });
      }
    }
  };

  const handleSlotTouchMove = (e: React.TouchEvent) => {
    if (isMobile) {
      // Mobile: expand selection when dragging
      if (!selectedSlot) return;
      
      const touch = e.touches[0];
      const element = document.elementFromPoint(touch.clientX, touch.clientY);
      
      if (element) {
        const dayIdxAttr = element.getAttribute("data-day-idx");
        const timeIdxAttr = element.getAttribute("data-time-idx");
        
        if (dayIdxAttr !== null && timeIdxAttr !== null) {
          const dayIdx = parseInt(dayIdxAttr);
          const timeIdx = parseInt(timeIdxAttr);
          
          // Only allow dragging on the same day
          if (dayIdx === selectedSlot.dayIdx) {
            const minTime = Math.min(selectedSlot.startTimeIdx, timeIdx);
            const maxTime = Math.max(selectedSlot.startTimeIdx, timeIdx);
            
            const validation = validateSelectionDuration(minTime, maxTime);
            setSelectionError(validation.error || null);
            
            setSelectedSlot({
              dayIdx,
              startTimeIdx: minTime,
              endTimeIdx: maxTime,
            });
          }
        }
      }
    } else {
      // Desktop: drag to select
      if (!dragStart) return;
      
      const touch = e.touches[0];
      const element = document.elementFromPoint(touch.clientX, touch.clientY);
      
      if (element) {
        const dayIdxAttr = element.getAttribute("data-day-idx");
        const timeIdxAttr = element.getAttribute("data-time-idx");
        
        if (dayIdxAttr !== null && timeIdxAttr !== null) {
          const dayIdx = parseInt(dayIdxAttr);
          const timeIdx = parseInt(timeIdxAttr);
          
          // Only allow dragging on the same day
          if (dayIdx === dragStart.dayIdx) {
            setDragEnd({ dayIdx, timeIdx });
          }
        }
      }
    }
  };

  useEffect(() => {
    if (dragStart || dragEnd || selectedSlot) {
      window.addEventListener("touchend", handleSlotMouseUp);
      return () => window.removeEventListener("touchend", handleSlotMouseUp);
    }
  }, [dragStart, dragEnd, selectedSlot]);

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
      {/* Venue Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {venues.map((venue) => (
          <button
            key={venue.venue_id}
            onClick={() => {
              setSelectedVenueId(venue.venue_id);
              setBookings([]);
            }}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              selectedVenueId === venue.venue_id
                ? "bg-primary text-primary-foreground"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {venue.venue_name}
          </button>
        ))}
      </div>

      {selectedVenueId && (
        <div className="p-4 space-y-4 border-3 rounded-lg">
          {/* Venue Info */}
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">
              {getSelectedVenue()?.venue_name}
            </h3>
          </div>

          {/* Week Navigation */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white border rounded-lg p-4">
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

            <div className="text-center order-first sm:order-none">
              <p className="font-semibold text-sm sm:text-lg text-center break-words">{formatWeekRange()}</p>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="outline" size="sm" onClick={goToToday} className="flex-1 sm:flex-none">
                Today
              </Button>
              <Button variant="outline" size="sm" onClick={goToNextWeek} className="gap-1 flex-1 sm:flex-none">
                <span className="sm:inline">Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {selectionError && (
              <div className="rounded-md bg-orange-50 p-3 text-sm text-orange-700 border border-orange-200">
                {selectionError}
              </div>
            )}
            <Button
              onClick={() => setIsDialogOpen(true)}
              disabled={!selectedSlot || !!selectionError}
              className="w-full"
            >
              Create Booking
            </Button>
          </div>


          <div className="border rounded-lg overflow-hidden bg-white">
            <div
              className={`grid grid-cols-8 border-b bg-gray-50 ${getRowHeightClass()}`}
            >
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

            {/* Scroll Up Button - Mobile Only */}
            {isMobile && (
              <Button
                onClick={() => {
                  if (timeSlotsRef.current) {
                    timeSlotsRef.current.scrollBy({ top: -100, behavior: "smooth" });
                  }
                }}
                className="w-full rounded-none border-b bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold py-2"
              >
                <ChevronLeft className="h-5 w-5 rotate-90" />
              </Button>
            )}

            {/* Time Slots */}
            <div
              ref={timeSlotsRef}
              className="max-h-[600px] overflow-y-auto"
            >
              {timeSlots.map((time, timeIdx) => (
                <div
                  key={time}
                  className={`grid grid-cols-8 border-b hover:border-t-2 hover:border-t-blue-300 hover:bg-gray-50 hover:shadow-sm transition-all ${getRowHeightClass()}`}
                >
                    <div className="border-r p-0 text-xs font-extrabold text-gray-600 bg-gray-50 relative flex items-start">
                      {shouldShowTimeLabel(time) ? (
                        <span
                          className="bg-white px-1 relative z-10"
                          style={{ marginTop: "-0.5rem" }}
                        >
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
                        dayIdx
                      );
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
                          onMouseDown={() =>
                            handleSlotMouseDown(dayIdx, timeIdx)
                          }
                          onMouseEnter={() =>
                            handleSlotMouseEnter(dayIdx, timeIdx)
                          }
                          onTouchStart={(e) => {
                            e.preventDefault();
                            handleSlotTouchStart(dayIdx, timeIdx);
                          }}
                          onTouchMove={(e) => {
                            e.preventDefault();
                            handleSlotTouchMove(e);
                          }}
                          onClick={() => {
                            if (isDisabled || !selectedSlot) {
                              setSelectedSlot(null);
                              setIsDialogOpen(false);
                            }
                          }}
                          style={{ touchAction: "manipulation" }}
                          className={`border-r border-gray-200 p-2 transition-colors relative group select-none flex items-center justify-center ${
                            isBooked
                              ? "bg-red-500 cursor-default pointer-events-none"
                              : isDisabled
                                ? "bg-gray-200 opacity-50 cursor-default pointer-events-none"
                                : dragStart
                                  ? "cursor-grabbing"
                                  : "cursor-pointer"
                          } ${isDragging ? "bg-blue-600 hover:bg-blue-600" : !isDisabled ? "hover:bg-blue-50" : ""}`}
                        >
                          {isBooked && bookingName && (
                            <div className="text-xs font-semibold text-white text-center truncate px-1">
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

            {/* Scroll Down Button - Mobile Only */}
            {isMobile && (
              <Button
                onClick={() => {
                  if (timeSlotsRef.current) {
                    timeSlotsRef.current.scrollBy({ top: 100, behavior: "smooth" });
                  }
                }}
                className="w-full rounded-none border-t bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold py-2"
              >
                <ChevronLeft className="h-5 w-5 -rotate-90" />
              </Button>
            )}
          </div>
          
          <div className="text-xs text-gray-600">
            {isMobile ? (
              <>Tap slots to select them and build your booking time range</>
            ) : (
              <>Drag across time slots to create a booking</>
            )}
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
                {dayNames[selectedSlot.dayIdx]},{" "}
                {daysInWeek[selectedSlot.dayIdx].getDate()}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="booking-name" className="text-sm">
                  Booking Name
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
                      (selectedSlot.endTimeIdx - selectedSlot.startTimeIdx + 1) *
                      getBookingUnit();

                    if (
                      venue?.max_daily_booking_time &&
                      bookingDurationMinutes > venue.max_daily_booking_time
                    ) {
                      const maxHours = Math.floor(
                        venue.max_daily_booking_time / 60
                      );
                      const maxMinutes = venue.max_daily_booking_time % 60;
                      setBookingDialogError(
                        `Booking duration (${Math.floor(bookingDurationMinutes / 60)}h ${bookingDurationMinutes % 60}m) exceeds maximum daily booking time (${maxHours}h ${maxMinutes}m)`
                      );
                      return;
                    }

                    // Calculate start time in epoch seconds
                    const bookingDate = new Date(
                      daysInWeek[selectedSlot.dayIdx]
                    );
                    const [startHour, startMinute] = timeSlots[
                      selectedSlot.startTimeIdx
                    ]
                      .split(":")
                      .map(Number);
                    bookingDate.setHours(startHour, startMinute, 0, 0);
                    const startTimeEpoch = Math.floor(
                      bookingDate.getTime() / 1000
                    );

                    if (!bookingName.trim()) {
                      setBookingDialogError("Please enter a booking name");
                      return;
                    }

                    const bookingRequest = {
                      venue_id: selectedVenueId!,
                      name: bookingName.trim(),
                      start_time: startTimeEpoch,
                      duration: bookingDurationMinutes,
                      smallest_booking_unit: getBookingUnit(),
                    };

                    try {
                      setIsCreatingBooking(true);

                      const response = await createBooking(bookingRequest);
                      console.log("Booking created successfully:", response);

                      const weekStart = new Date(currentWeekStart);
                      weekStart.setHours(0, 0, 0, 0);
                      const startSlotTime = Math.floor(
                        weekStart.getTime() / 1000
                      );

                      const weekEnd = new Date(currentWeekStart);
                      weekEnd.setDate(weekEnd.getDate() + 7);
                      weekEnd.setHours(0, 0, 0, 0);
                      const endSlotTime = Math.floor(weekEnd.getTime() / 1000);

                      const bookingsResponse = await getBookings(
                        selectedVenueId!,
                        String(startSlotTime),
                        String(endSlotTime)
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
