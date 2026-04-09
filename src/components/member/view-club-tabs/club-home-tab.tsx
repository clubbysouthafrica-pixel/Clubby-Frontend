import InfoRow from "@/components/info-row";
import SocialLink from "@/components/social-links";
import { formatAmount } from "@/data/currencies";
import {
  formatDateKey,
  formatLongDate,
  formatRangeLabel,
  getPricingSummary,
  getRegistrationStatus,
  type MemberEvent,
} from "@/components/member/events/event-utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  CalendarDays,
  CheckCircle,
  Clock,
  Globe,
  Mail,
  MapPin,
  Users,
} from "lucide-react";
import { FaFacebook, FaInstagram, FaTwitter } from "react-icons/fa";

type OpeningTimeEntry = {
  day: string;
  label: string;
};

type GalleryImage = {
  key: string;
  url: string;
};

const HOME_CALENDAR_WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type ClubHomeTabProps = {
  clubName: string;
  clubType?: string;
  description?: string;
  aboutClub?: string;
  supportEmail?: string;
  countryName: string;
  joinedLabel: string;
  isMember?: boolean;
  isRegistered?: boolean;
  resubmissionRequired?: boolean;
  primaryActionLabel?: string;
  primaryActionVariant?: "default" | "destructive";
  onPrimaryAction?: () => void;
  outstandingBalanceAmount?: number;
  coverImage?: string;
  profileImage?: string;
  clubUrl?: string;
  facebook?: string;
  instagram?: string;
  twitter?: string;
  openingTimeEntries: OpeningTimeEntry[];
  galleryImages: GalleryImage[];
  selectedGalleryImageIndex: number | null;
  setSelectedGalleryImageIndex: (index: number | null) => void;
  enableEvents?: boolean;
  isHomeEventsLoading: boolean;
  isHomeEventsError: boolean;
  homeEventsThisMonthCount: number;
  selectedHomeDateEvents: MemberEvent[];
  selectedHomeDateLabel: string;
  nextHomeEvent: MemberEvent | null;
  canViewEvents: boolean;
  currency?: string;
  visibleCalendarMonth: Date;
  homeCalendarDays: Date[];
  eventsByDate: Map<string, MemberEvent[]>;
  selectedHomeDateKey: string;
  todayKey: string;
  onPreviousMonth: () => void;
  onToday: () => void;
  onNextMonth: () => void;
  onSelectDate: (dateKey: string) => void;
  onOpenEvents: () => void;
  onOpenOutstandingBalance?: () => void;
};

export function ClubHomeTab({
  clubName,
  clubType,
  description,
  aboutClub,
  supportEmail,
  countryName,
  joinedLabel,
  isMember,
  isRegistered,
  resubmissionRequired,
  primaryActionLabel,
  primaryActionVariant = "default",
  onPrimaryAction,
  outstandingBalanceAmount,
  coverImage,
  profileImage,
  clubUrl,
  facebook,
  instagram,
  twitter,
  openingTimeEntries,
  galleryImages,
  setSelectedGalleryImageIndex,
  enableEvents,
  isHomeEventsLoading,
  isHomeEventsError,
  homeEventsThisMonthCount,
  selectedHomeDateEvents,
  selectedHomeDateLabel,
  nextHomeEvent,
  canViewEvents,
  currency,
  visibleCalendarMonth,
  homeCalendarDays,
  eventsByDate,
  selectedHomeDateKey,
  todayKey,
  onPreviousMonth,
  onToday,
  onNextMonth,
  onSelectDate,
  onOpenEvents,
  onOpenOutstandingBalance,
}: ClubHomeTabProps) {
  const membershipState = resubmissionRequired
    ? {
        label: "Resubmission Required",
        description:
          "Your membership needs a fresh registration submission before the club can restore your active status.",
        badgeClassName: "border-red-200 bg-red-50 text-red-700",
        icon: AlertTriangle,
      }
    : isMember
      ? isRegistered
        ? {
            label: "Active Member",
            description: "Your membership is active and confirmed by the club.",
            badgeClassName: "border-green-200 bg-green-50 text-green-700",
            icon: CheckCircle,
          }
        : {
            label: "Pending Member",
            description: "Your registration is under review and waiting for final confirmation.",
            badgeClassName: "border-orange-200 bg-orange-50 text-orange-700",
            icon: Clock,
          }
      : null;

  return (
    <TabsContent value="home" className="mt-6">
      <div className="relative">
        <div className="relative h-64 overflow-hidden md:h-80">
          {coverImage ? (
            <div className="relative h-full w-full">
              <img
                src={coverImage}
                alt={`${clubName} cover`}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-slate-100">
              <div className="space-y-2 text-center">
                <Users className="mx-auto h-16 w-16 text-slate-500/60" />
                <p className="text-lg font-medium text-slate-600">{clubName}</p>
              </div>
            </div>
          )}
        </div>

        <div className="container relative mx-auto -mt-20 px-4">
          <Card className="gap-0 overflow-hidden rounded-[1.9rem] border-slate-200 bg-white shadow-[0_30px_90px_-42px_rgba(15,23,42,0.16)] backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="flex flex-col items-start gap-6 lg:flex-row lg:items-center">
                <div className="relative">
                  <Avatar className="h-24 w-24 border-4 border-white shadow-[0_18px_36px_-20px_rgba(14,116,144,0.45)]">
                    {profileImage ? (
                      <AvatarImage className="object-cover object-center" src={profileImage} />
                    ) : (
                      <AvatarFallback className="bg-slate-100 text-xl font-bold text-slate-700">
                        {clubName.split(" ").map((word) => word[0])}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 shadow-[0_10px_24px_-12px_rgba(15,23,42,0.45)]">
                    <Users className="h-4 w-4 text-white" />
                  </div>
                </div>

                <div className="flex-1 space-y-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <h1 className="text-3xl font-bold text-slate-950 md:text-4xl">
                        {clubName}
                      </h1>
                      {clubType && (
                        <Badge className="border-slate-200 bg-slate-100 text-xs text-slate-700">
                          {clubType}
                        </Badge>
                      )}
                    </div>
                    {description && (
                      <p className="text-lg leading-relaxed text-slate-600">{description}</p>
                    )}
                  </div>

                  {membershipState && (
                    <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <Badge className={cn("rounded-full border px-3 py-1 text-xs font-semibold", membershipState.badgeClassName)}>
                          <membershipState.icon className="mr-1.5 h-3.5 w-3.5" />
                          {membershipState.label}
                        </Badge>
                        <p className="text-sm text-slate-600">{membershipState.description}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{countryName}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{joinedLabel}</span>
                    </div>
                    {supportEmail && (
                      <div className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        <span>{supportEmail}</span>
                      </div>
                    )}
                  </div>

                  {(clubUrl || facebook || instagram || twitter) && (
                    <section>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {clubUrl && (
                          <SocialLink icon={<Globe />} label="Website" onClick={() => window.open(clubUrl, "_blank")} />
                        )}
                        {facebook && (
                          <SocialLink icon={<FaFacebook />} label="Facebook" onClick={() => window.open(facebook, "_blank")} />
                        )}
                        {instagram && (
                          <SocialLink icon={<FaInstagram />} label="Instagram" onClick={() => window.open(instagram, "_blank")} />
                        )}
                        {twitter && (
                          <SocialLink icon={<FaTwitter />} label="Twitter" onClick={() => window.open(twitter, "_blank")} />
                        )}
                      </div>
                    </section>
                  )}

                  {typeof outstandingBalanceAmount === "number" && outstandingBalanceAmount > 0 && (
                    <button
                      type="button"
                      onClick={onOpenOutstandingBalance}
                      className="w-full rounded-[1.2rem] border border-orange-200 bg-orange-50 px-4 py-3 text-left transition-colors hover:bg-orange-100"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-700">
                            Outstanding Balance
                          </p>
                          <p className="mt-1 text-lg font-semibold text-slate-950">
                            {formatAmount(outstandingBalanceAmount, currency || "ZAR")}
                          </p>
                        </div>
                        <span className="text-sm font-medium text-orange-700">
                          Open payments
                        </span>
                      </div>
                    </button>
                  )}
                </div>

                {(primaryActionLabel && onPrimaryAction) && (
                  <div className="w-full lg:w-auto lg:min-w-fit">
                    <Button
                      variant={primaryActionVariant}
                      className={cn(
                        "w-full rounded-full px-5 py-6 text-sm font-semibold lg:w-auto",
                        primaryActionVariant === "destructive"
                          ? "shadow-[0_18px_36px_-24px_rgba(220,38,38,0.45)]"
                          : "bg-slate-900 text-white shadow-[0_18px_36px_-24px_rgba(15,23,42,0.38)] hover:bg-slate-800",
                      )}
                      onClick={onPrimaryAction}
                    >
                      {resubmissionRequired ? (
                        <AlertTriangle className="mr-2 h-4 w-4" />
                      ) : (
                        <Users className="mr-2 h-4 w-4" />
                      )}
                      {primaryActionLabel}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="container mx-auto mb-6 mt-8 px-4">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[18rem_minmax(0,1fr)_20rem]">
          <aside className="order-2 space-y-6 xl:order-1 xl:self-start">
            <Card className="overflow-hidden rounded-[1.7rem] border-slate-200 bg-white shadow-[0_24px_80px_-40px_rgba(15,23,42,0.14)]">
              <div className="border-b border-slate-200 bg-white px-5 py-5 text-slate-900">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-600/80">
                  Club Snapshot
                </p>
                <h3 className="mt-2 text-xl font-semibold">
                  {clubName || "Club information"}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  The essentials members and visitors need at a glance.
                </p>
              </div>

              <CardContent className="space-y-5 p-5">
                <InfoRow icon={<Mail />} label="Support Email" value={supportEmail || "Not provided"} />
                <InfoRow icon={<MapPin />} label="Location" value={countryName || "Not provided"} />
                <InfoRow icon={<Calendar />} label="Established" value={joinedLabel || "Not provided"} />
              </CardContent>
            </Card>

            {openingTimeEntries.length > 0 && (
              <Card className="rounded-[1.7rem] border-slate-200 bg-white shadow-[0_24px_80px_-40px_rgba(15,23,42,0.12)]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-slate-900">Opening Times</CardTitle>
                  <CardDescription>Published club availability by day.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {openingTimeEntries.map((entry) => {
                    const isTodayEntry =
                      entry.day.slice(0, 3).toLowerCase() ===
                      new Intl.DateTimeFormat("en-US", { weekday: "short" })
                        .format(new Date())
                        .toLowerCase();

                    return (
                      <div
                        key={entry.day}
                        className={cn(
                          "flex items-center justify-between rounded-2xl border px-4 py-3 text-sm",
                          isTodayEntry
                            ? "border-slate-300 bg-white text-slate-950"
                            : "border-slate-200 bg-white/80 text-slate-700",
                        )}
                      >
                        <div>
                          <p className="font-medium capitalize">{entry.day}</p>
                          {isTodayEntry && (
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-600">Today</p>
                          )}
                        </div>
                        <span className="text-right text-sm font-medium">{entry.label}</span>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </aside>

          <section className="order-1 space-y-6 xl:order-2">
            <Card className="overflow-hidden rounded-[1.9rem] border-slate-200 bg-white shadow-[0_30px_100px_-40px_rgba(15,23,42,0.14)]">
              <div className="border-b border-slate-200 bg-white px-5 py-6 sm:px-8">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                  <div className="max-w-2xl space-y-3">
                    <Badge className="w-fit rounded-full border-slate-200 bg-slate-100 px-3 py-1 text-slate-700">
                      Club Calendar
                    </Badge>
                    <div>
                      <h2 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                        What&apos;s happening at {clubName || "the club"}
                      </h2>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                        A focused monthly view of published club events, with the selected day agenda kept front and center.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:min-w-[23rem]">
                    <div className="rounded-[1.4rem] border border-slate-200 bg-white/75 px-4 py-3 backdrop-blur">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">This Month</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-950">{homeEventsThisMonthCount}</p>
                      <p className="text-sm text-slate-500">scheduled events</p>
                    </div>
                    <div className="rounded-[1.4rem] border border-slate-200 bg-white/75 px-4 py-3 backdrop-blur">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Selected Day</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-950">{selectedHomeDateEvents.length}</p>
                      <p className="text-sm text-slate-500">events on agenda</p>
                    </div>
                    <div className="rounded-[1.4rem] border border-slate-200 bg-white/75 px-4 py-3 backdrop-blur">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Next Event</p>
                      <p className="mt-2 text-sm font-semibold text-slate-950">
                        {nextHomeEvent ? nextHomeEvent.title : "No upcoming events"}
                      </p>
                      <p className="text-sm text-slate-500">
                        {nextHomeEvent ? formatRangeLabel(nextHomeEvent) : "Publish an event to feature it here."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <CardContent className="space-y-6 p-4 sm:p-6">
                {!enableEvents ? (
                  <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
                    <CalendarDays className="mx-auto h-10 w-10 text-slate-400" />
                    <h3 className="mt-4 text-lg font-semibold text-slate-900">Calendar coming soon</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      This club has not enabled events yet. The surrounding club information is still available below.
                    </p>
                  </div>
                ) : isHomeEventsLoading ? (
                  <div className="space-y-4">
                    <div className="h-16 animate-pulse rounded-3xl bg-slate-100" />
                    <div className="grid grid-cols-7 gap-2 sm:gap-3">
                      {Array.from({ length: 35 }, (_, index) => (
                        <div key={`calendar-skeleton-${index}`} className="h-16 animate-pulse rounded-xl bg-slate-100 sm:h-24 sm:rounded-2xl" />
                      ))}
                    </div>
                  </div>
                ) : isHomeEventsError ? (
                  <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-6 py-8 text-center">
                    <p className="text-base font-semibold text-rose-900">The calendar could not be loaded right now.</p>
                    <p className="mt-2 text-sm text-rose-700">
                      Refresh the page and try again. The rest of the club profile is still available.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col gap-4 rounded-[1.6rem] border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Browse Month</p>
                        <h3 className="mt-1 text-2xl font-semibold text-slate-950">
                          {visibleCalendarMonth.toLocaleDateString("en-US", {
                            month: "long",
                            year: "numeric",
                          })}
                        </h3>
                      </div>
                      <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:items-center">
                        <Button variant="outline" size="sm" className="rounded-full border-slate-300 bg-white/80 px-3 text-slate-900 hover:bg-slate-50 sm:px-4" onClick={onPreviousMonth}>
                          <ArrowLeft className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">Previous</span>
                        </Button>
                        <Button variant="outline" size="sm" className="rounded-full border-slate-300 bg-white/80 px-3 text-slate-900 hover:bg-slate-50 sm:px-4" onClick={onToday}>
                          Today
                        </Button>
                        <Button variant="outline" size="sm" className="rounded-full border-slate-300 bg-white/80 px-3 text-slate-900 hover:bg-slate-50 sm:px-4" onClick={onNextMonth}>
                          <span className="hidden sm:inline">Next</span>
                          <ArrowRight className="h-4 w-4 sm:ml-2" />
                        </Button>
                      </div>
                    </div>

                    <div className="rounded-[1.9rem] border border-slate-200 bg-white p-3 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.14)] sm:p-4">
                      <div className="grid grid-cols-7 gap-1 pb-2 text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500/80 sm:gap-2 sm:text-xs sm:tracking-[0.22em]">
                        {HOME_CALENDAR_WEEKDAYS.map((day) => (
                          <div key={day} className="py-2">
                            <span className="sm:hidden">{day.charAt(0)}</span>
                            <span className="hidden sm:inline">{day}</span>
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-7 gap-1 sm:gap-2">
                        {homeCalendarDays.map((day) => {
                          const dateKey = formatDateKey(day);
                          const dayEvents = eventsByDate.get(dateKey) ?? [];
                          const isCurrentMonth = day.getMonth() === visibleCalendarMonth.getMonth();
                          const isSelected = dateKey === selectedHomeDateKey;
                          const isToday = dateKey === todayKey;

                          return (
                            <button
                              key={dateKey}
                              type="button"
                              onClick={() => onSelectDate(dateKey)}
                              className={cn(
                                "group relative min-h-[4.75rem] rounded-xl border p-2 pt-9 text-left transition-all sm:min-h-28 sm:rounded-2xl sm:p-3 sm:pt-12",
                                isSelected
                                  ? isToday
                                    ? "border-orange-300 bg-orange-50 text-slate-950 shadow-[0_14px_32px_-22px_rgba(234,88,12,0.22)]"
                                    : "border-slate-300 bg-white text-slate-950 shadow-[0_14px_32px_-22px_rgba(15,23,42,0.16)]"
                                  : isToday
                                    ? "border-orange-200 bg-orange-50 text-slate-900 shadow-[0_14px_30px_-24px_rgba(234,88,12,0.16)] hover:-translate-y-0.5 hover:border-orange-300 hover:bg-orange-100"
                                    : isCurrentMonth
                                      ? "border-slate-200 bg-white/82 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50/70"
                                      : "border-slate-200/70 bg-slate-50/40 text-slate-400 hover:border-slate-200",
                              )}
                            >
                              <div className="absolute left-2 right-2 top-2 flex items-start justify-between gap-1 sm:left-3 sm:right-3 sm:top-3 sm:gap-2">
                                <span
                                  className={cn(
                                    "inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold sm:h-8 sm:w-8 sm:text-sm",
                                    isToday && isSelected
                                      ? "bg-orange-500 text-white ring-2 ring-orange-200"
                                      : isToday
                                        ? "bg-orange-100 text-orange-700 ring-1 ring-orange-200"
                                        : isSelected
                                          ? "bg-white/90 text-slate-900 ring-1 ring-slate-200"
                                          : "bg-white text-slate-700 ring-1 ring-slate-200/80",
                                  )}
                                >
                                  {day.getDate()}
                                </span>
                                {dayEvents.length > 0 && (
                                  <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-semibold sm:px-2 sm:py-1 sm:text-[11px]", isSelected ? "bg-white/90 text-slate-700" : "bg-slate-200 text-slate-700")}>{dayEvents.length}</span>
                                )}
                              </div>

                              <div className="mt-2 flex flex-wrap gap-1 sm:hidden">
                                {dayEvents.slice(0, 3).map((event) => (
                                  <span
                                    key={`${dateKey}-${event.eventId ?? event.id}-mobile`}
                                    className={cn(
                                      "h-1.5 w-1.5 rounded-full",
                                      isSelected || isToday ? "bg-slate-800" : "bg-slate-400",
                                    )}
                                  />
                                ))}
                              </div>

                              <div className="mt-4 hidden space-y-2 sm:block">
                                {dayEvents.slice(0, 2).map((event) => (
                                  <div
                                    key={`${dateKey}-${event.eventId ?? event.id}`}
                                    className={cn(
                                      "max-w-full overflow-hidden break-words rounded-xl px-2 py-1.5 text-left text-xs font-medium leading-4 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]",
                                      isSelected
                                        ? "bg-white/90 text-slate-900 ring-1 ring-slate-200"
                                        : "bg-white text-slate-700 ring-1 ring-slate-200",
                                    )}
                                  >
                                    {event.title}
                                  </div>
                                ))}
                                {dayEvents.length > 2 && (
                                  <p className={cn("text-xs font-medium", isSelected ? "text-slate-700" : "text-slate-500")}>+{dayEvents.length - 2} more</p>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="rounded-[1.9rem] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.12)] sm:p-6">
                      <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Day Agenda</p>
                          <h3 className="mt-1 text-2xl font-semibold text-slate-950">{selectedHomeDateLabel}</h3>
                        </div>
                        {canViewEvents && (
                          <Button variant="outline" className="rounded-full border-slate-300 bg-white/80 text-slate-900 hover:bg-slate-50" onClick={onOpenEvents}>
                            Open Full Events View
                          </Button>
                        )}
                      </div>

                      {selectedHomeDateEvents.length > 0 ? (
                        <div className="mt-5 space-y-4">
                          {selectedHomeDateEvents.map((event) => {
                            const registrationStatus = getRegistrationStatus(event, todayKey);

                            return (
                              <div
                                key={`${selectedHomeDateKey}-${event.eventId ?? event.id}`}
                                className="rounded-[1.6rem] border border-slate-200 bg-white/92 p-5 shadow-[0_16px_48px_-32px_rgba(15,23,42,0.12)]"
                              >
                                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                  <div className="space-y-3">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <Badge className={cn("rounded-full border px-3 py-1", registrationStatus.className)}>
                                        {registrationStatus.label}
                                      </Badge>
                                      <Badge className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-slate-700">
                                        {getPricingSummary(event.pricing, currency || "ZAR")}
                                      </Badge>
                                    </div>
                                    <div>
                                      <h4 className="text-lg font-semibold text-slate-950">{event.title}</h4>
                                      <p className="mt-1 text-sm font-medium text-slate-500">{formatRangeLabel(event)}</p>
                                    </div>
                                  </div>

                                  {canViewEvents && (
                                    <Button className="rounded-full bg-slate-900 text-white shadow-[0_14px_30px_-18px_rgba(15,23,42,0.38)] hover:bg-slate-800" onClick={onOpenEvents}>
                                      {registrationStatus.label === "Registration open" ? "Register" : "View Event"}
                                    </Button>
                                  )}
                                </div>

                                <p className="mt-4 text-sm leading-6 text-slate-600">
                                  {event.description || "No event description has been published yet."}
                                </p>

                                <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-slate-500">
                                  <span className="rounded-full border border-slate-200 bg-white/75 px-3 py-1">
                                    Registration opens {event.registrationOpenDate ? formatLongDate(event.registrationOpenDate) : "to be confirmed"}
                                  </span>
                                  <span className="rounded-full border border-slate-200 bg-white/75 px-3 py-1">
                                    Registration closes {event.registrationCloseDate ? formatLongDate(event.registrationCloseDate) : "to be confirmed"}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="mt-5 rounded-[1.6rem] border border-dashed border-slate-300 bg-white/80 px-6 py-10 text-center">
                          <p className="text-lg font-semibold text-slate-900">No events scheduled for this day</p>
                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            {nextHomeEvent
                              ? `The next published event is ${nextHomeEvent.title} on ${formatRangeLabel(nextHomeEvent)}.`
                              : "There are no upcoming club events scheduled yet."}
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </section>

          <aside className="order-3 space-y-6 xl:self-start">
            {aboutClub && (
              <Card className="rounded-[1.7rem] border-slate-200 bg-white shadow-[0_24px_80px_-40px_rgba(15,23,42,0.1)]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-slate-900">Club Description</CardTitle>
                  <CardDescription>A quick overview of what makes this club distinct.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm leading-7 text-slate-600">{aboutClub}</p>
                </CardContent>
              </Card>
            )}

            <Card className="overflow-hidden rounded-[1.7rem] border-slate-200 bg-white shadow-[0_24px_80px_-40px_rgba(15,23,42,0.1)]">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-slate-900">Gallery</CardTitle>
                <CardDescription>Recent visuals from the club community.</CardDescription>
              </CardHeader>
              <CardContent>
                {galleryImages.length > 0 ? (
                  <div className="grid auto-rows-[7.5rem] grid-cols-2 gap-3">
                    {galleryImages.slice(0, 5).map((image, idx) => (
                      <button
                        key={image.key}
                        type="button"
                        onClick={() => setSelectedGalleryImageIndex(idx)}
                        className={cn(
                          "group relative overflow-hidden rounded-[1.35rem] bg-slate-100 text-left transition-transform hover:-translate-y-0.5",
                          idx === 0 && "col-span-2 row-span-2",
                        )}
                      >
                        <img src={image.url} alt="Gallery" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                        <div className="absolute inset-x-0 bottom-0 bg-slate-950/70 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/85 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                          Open Image
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[1.4rem] border border-dashed border-slate-300 bg-slate-50/80 px-4 py-10 text-center text-sm text-slate-500">
                    No gallery images have been published yet.
                  </div>
                )}
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </TabsContent>
  );
}