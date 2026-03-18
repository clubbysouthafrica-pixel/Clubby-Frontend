import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { X } from "lucide-react";

interface CreateVenueDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateVenueData) => void;
  isLoading?: boolean;
  error?: string | null;
  initialData?: CreateVenueData & { venue_id?: string };
}

export interface CreateVenueData {
  venue_id?: string;
  venue_name: string;
  smallest_booking_unit: number;
  max_daily_booking_time: number | null;
  times: Array<{
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_closed?: boolean;
  }>;
}

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export function CreateVenueDialog({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  error = null,
  initialData,
}: CreateVenueDialogProps) {
  const isEditing = !!initialData;
  const [venueId, setVenueId] = useState<string | undefined>(undefined);
  const [venueName, setVenueName] = useState("");
  const [smallestBookingUnit, setSmallestBookingUnit] = useState<number | "">("");
  const [maxDailyBookingTime, setMaxDailyBookingTime] = useState<number | "">("");
  const [openingTimes, setOpeningTimes] = useState<Record<string, string>>(
    DAYS_OF_WEEK.reduce((acc, day) => ({ ...acc, [day]: "08:00" }), {})
  );
  const [closingTimes, setClosingTimes] = useState<Record<string, string>>(
    DAYS_OF_WEEK.reduce((acc, day) => ({ ...acc, [day]: "18:00" }), {})
  );
  const [closedDays, setClosedDays] = useState<Record<string, boolean>>(
    DAYS_OF_WEEK.reduce((acc, day) => ({ ...acc, [day]: false }), {})
  );
  const [dialogError, setDialogError] = useState<string | null>(null);

  useEffect(() => {
    if (isEditing && initialData) {
      setVenueId(initialData.venue_id);
      setVenueName(initialData.venue_name);
      setSmallestBookingUnit(initialData.smallest_booking_unit);
      setMaxDailyBookingTime(initialData.max_daily_booking_time || "");
      
      const newOpeningTimes: Record<string, string> = {};
      const newClosingTimes: Record<string, string> = {};
      const newClosedDays: Record<string, boolean> = {};
      
      initialData.times.forEach((time) => {
        const dayName = DAYS_OF_WEEK[time.day_of_week];
        newOpeningTimes[dayName] = time.start_time;
        newClosingTimes[dayName] = time.end_time;
        newClosedDays[dayName] = time.is_closed || false;
      });
      
      setOpeningTimes(newOpeningTimes);
      setClosingTimes(newClosingTimes);
      setClosedDays(newClosedDays);
    }
  }, [isOpen, initialData, isEditing]);

  const handleSubmit = () => {
    if (!venueName.trim()) {
      setDialogError("Please enter a venue name");
      return;
    }
    if (!smallestBookingUnit || smallestBookingUnit < 15) {
      setDialogError("Booking unit must be at least 15 minutes");
      return;
    }
    if (smallestBookingUnit % 15 !== 0) {
      setDialogError("Booking unit must be a multiple of 15 minutes");
      return;
    }
    if (maxDailyBookingTime && typeof maxDailyBookingTime === "number" && maxDailyBookingTime % 15 !== 0) {
      setDialogError("Maximum daily booking time must be a multiple of 15 minutes");
      return;
    }

    setDialogError(null);

    // Transform opening_times and closing_times into times array format
    const times = DAYS_OF_WEEK.map((day, index) => ({
      day_of_week: index,
      start_time: openingTimes[day],
      end_time: closingTimes[day],
      is_closed: closedDays[day],
    }));

    const venueData: CreateVenueData = {
      ...(venueId && { venue_id: venueId }),
      venue_name: venueName,
      smallest_booking_unit: typeof smallestBookingUnit === "number" ? smallestBookingUnit : 0,
      max_daily_booking_time: typeof maxDailyBookingTime === "number" ? maxDailyBookingTime : null,
      times,
    };

    onSubmit(venueData);

    resetForm();
  };

  const resetForm = () => {
    setVenueId(undefined);
    setVenueName("");
    setSmallestBookingUnit("");
    setMaxDailyBookingTime("");
    setOpeningTimes(
      DAYS_OF_WEEK.reduce((acc, day) => ({ ...acc, [day]: "08:00" }), {})
    );
    setClosingTimes(
      DAYS_OF_WEEK.reduce((acc, day) => ({ ...acc, [day]: "18:00" }), {})
    );
    setClosedDays(
      DAYS_OF_WEEK.reduce((acc, day) => ({ ...acc, [day]: false }), {})
    );
    setDialogError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl max-h-[90%]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Venue" : "Create New Venue"}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Update the venue with its booking settings and operating hours."
              : "Add a new venue with its booking settings and operating hours."
            }
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">
            {error}
          </div>
        )}

        <ScrollArea className=" p-2">
          <div className="space-y-4">
            {/* Basic Information Section */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Basic Information</h3>

              <div>
                <Label htmlFor="venue-name" className="text-xs">Venue Name</Label>
                <Input
                  id="venue-name"
                  placeholder="e.g., Main Hall"
                  value={venueName}
                  onChange={(e) => {
                    setVenueName(e.target.value);
                    setDialogError(null);
                  }}
                  disabled={isLoading}
                  className="mt-1 h-8"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="booking-unit" className="text-xs">
                    Minimum Booking Unit (15 min increments)
                  </Label>
                  <Input
                    id="booking-unit"
                    type="number"
                    placeholder="30"
                    min="15"
                    step="15"
                    value={smallestBookingUnit}
                    onChange={(e) => {
                      setSmallestBookingUnit(
                        e.target.value ? parseInt(e.target.value) : ""
                      );
                      setDialogError(null);
                    }}
                    disabled={isLoading}
                    className="mt-1 h-8"
                  />
                  {smallestBookingUnit && typeof smallestBookingUnit === "number" && (
                    <p className="text-xs text-gray-600 mt-1 ">
                      {Math.floor(smallestBookingUnit / 60)}h {smallestBookingUnit % 60}m
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="daily-time" className="text-xs">
                    Maximum Daily Booking Time (15 min increments)
                  </Label>
                  <Input
                    id="daily-time"
                    type="number"
                    placeholder=""
                    min="15"
                    step="15"
                    value={maxDailyBookingTime}
                    onChange={(e) => {
                      setMaxDailyBookingTime(
                        e.target.value ? parseInt(e.target.value) : ""
                      );
                      setDialogError(null);
                    }}
                    disabled={isLoading}
                    className="mt-1 h-8"
                  />
                  {maxDailyBookingTime && typeof maxDailyBookingTime === "number" && (
                    <p className="text-xs text-gray-600 mt-1">
                      {Math.floor(maxDailyBookingTime / 60)}h {maxDailyBookingTime % 60}m
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Operating Hours Section */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Operating Hours</h3>

              <div className="space-y-2 overflow-y-auto max-h-100 pr-2">
                {DAYS_OF_WEEK.map((day, index) => (
                  <div key={day}>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-medium text-gray-700 flex-1">{day}</p>
                        <div className="flex items-center gap-1">
                          <Checkbox
                            id={`closed-${day}`}
                            checked={closedDays[day]}
                            onCheckedChange={(checked) => {
                              setClosedDays({ ...closedDays, [day]: checked as boolean });
                              setDialogError(null);
                            }}
                            disabled={isLoading}
                          />
                          <label htmlFor={`closed-${day}`} className="text-xs text-gray-600 cursor-pointer">
                            Closed
                          </label>
                        </div>
                      </div>
                      {!closedDays[day] && (
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <label htmlFor={`open-${day}`} className="text-xs text-gray-600">Opens</label>
                            <Input
                              id={`open-${day}`}
                              type="time"
                              value={openingTimes[day]}
                              onChange={(e) => {
                                setOpeningTimes({ ...openingTimes, [day]: e.target.value });
                                setDialogError(null);
                              }}
                              disabled={isLoading}
                              className="h-7 text-xs mt-0.5"
                            />
                          </div>
                          <div className="flex-1">
                            <label htmlFor={`close-${day}`} className="text-xs text-gray-600">Closes</label>
                            <Input
                              id={`close-${day}`}
                              type="time"
                              value={closingTimes[day]}
                              onChange={(e) => {
                                setClosingTimes({ ...closingTimes, [day]: e.target.value });
                                setDialogError(null);
                              }}
                              disabled={isLoading}
                              className="h-7 text-xs mt-0.5"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    {index < DAYS_OF_WEEK.length - 1 && <Separator className="mt-2" />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isLoading} size="sm">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading} size="sm">
            {isLoading ? (isEditing ? "Updating..." : "Creating...") : (isEditing ? "Update Venue" : "Create Venue")}
          </Button>
        </div>

        {dialogError && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200 flex justify-between items-center">
            <span>{dialogError}</span>
            <button
              onClick={() => setDialogError(null)}
              className="ml-2 text-red-700 hover:text-red-900"
              type="button"
            >
              <X size={16} />
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
