import { useEffect, useState, type ReactElement } from "react";
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
import { useIsMobile } from "@/hooks/use-mobile";
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

type SocialActionLink = {
  key: string;
  icon: ReactElement;
  label: string;
  onClick: () => void;
};

export type HomeBookingItem = {
  venueId: string;
  venueName: string;
  slotTime: number;
  endTime: number;
  dateKey: string;
  timeLabel: string;
};

const HOME_CALENDAR_WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function abbreviateCalendarLabel(value: string, maxLength = 18) {
  const normalizedValue = value.trim().replace(/\s+/g, " ");

  if (normalizedValue.length <= maxLength) {
    return normalizedValue;
  }

  return `${normalizedValue.slice(0, maxLength - 1).trimEnd()}...`;
}

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
  homeBookingsNextSevenDaysCount: number;
  selectedHomeDateEvents: MemberEvent[];
  selectedHomeDateBookings: HomeBookingItem[];
  selectedHomeDateLabel: string;
  nextHomeEvent: MemberEvent | null;
  canViewEvents: boolean;
  canViewBookings: boolean;
  currency?: string;
  visibleCalendarMonth: Date;
  homeCalendarDays: Date[];
  eventsByDate: Map<string, MemberEvent[]>;
  bookingsByDate: Map<string, HomeBookingItem[]>;
  selectedHomeDateKey: string;
  todayKey: string;
  onPreviousMonth: () => void;
  onToday: () => void;
  onNextMonth: () => void;
  onSelectDate: (dateKey: string) => void;
  onOpenEvents: () => void;
  onOpenBookings: () => void;
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
  homeBookingsNextSevenDaysCount,
  selectedHomeDateEvents,
  selectedHomeDateBookings,
  selectedHomeDateLabel,
  nextHomeEvent,
  canViewEvents,
  canViewBookings,
  currency,
  visibleCalendarMonth,
  homeCalendarDays,
  eventsByDate,
  bookingsByDate,
  selectedHomeDateKey,
  todayKey,
  onPreviousMonth,
  onToday,
  onNextMonth,
  onSelectDate,
  onOpenEvents,
  onOpenBookings,
  onOpenOutstandingBalance,
}: ClubHomeTabProps) {
  const isMobile = useIsMobile();
  const [isDayCalendarOpen, setIsDayCalendarOpen] = useState(false);
  const [canShowSideAgenda, setCanShowSideAgenda] = useState(false);
  const primarySocialLinks: SocialActionLink[] = [];

  if (clubUrl) {
    primarySocialLinks.push({
      key: "website",
      icon: <Globe />,
      label: "Website",
      onClick: () => {
        window.open(clubUrl, "_blank");
      },
    });
  }

  if (facebook) {
    primarySocialLinks.push({
      key: "facebook",
      icon: <FaFacebook />,
      label: "Facebook",
      onClick: () => {
        window.open(facebook, "_blank");
      },
    });
  }

  if (instagram) {
    primarySocialLinks.push({
      key: "instagram",
      icon: <FaInstagram />,
      label: "Instagram",
      onClick: () => {
        window.open(instagram, "_blank");
      },
    });
  }

  const secondarySocialLinks: SocialActionLink[] = [];

  if (twitter) {
    secondarySocialLinks.push({
      key: "twitter",
      icon: <FaTwitter />,
      label: "Twitter",
      onClick: () => {
        window.open(twitter, "_blank");
      },
    });
  }

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

  const selectedHomeDateItemCount =
    selectedHomeDateEvents.length + selectedHomeDateBookings.length;
  const dayAgendaCardClassName =
    "rounded-[1rem] border border-slate-200 bg-white p-2.5 shadow-[0_16px_48px_-32px_rgba(15,23,42,0.08)] sm:p-3";

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const updateLayoutMode = () => {
      setCanShowSideAgenda(mediaQuery.matches);
    };

    updateLayoutMode();
    mediaQuery.addEventListener("change", updateLayoutMode);

    return () => mediaQuery.removeEventListener("change", updateLayoutMode);
  }, []);

  useEffect(() => {
    if (canShowSideAgenda) {
      setIsDayCalendarOpen(false);
    }
  }, [canShowSideAgenda]);

  const handleCalendarDateClick = (dateKey: string) => {
    onSelectDate(dateKey);
    setIsDayCalendarOpen(!canShowSideAgenda && !isMobile ? false : !canShowSideAgenda);
  };

  return (
    <TabsContent value="home" className="mt-3 sm:mt-6">
      <div className="relative">
        <div className="relative h-28 overflow-hidden sm:h-36 md:h-56">
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

        <div className="container relative mx-auto -mt-7 px-4 sm:-mt-10 md:-mt-14">
          <Card className="py-2 gap-0 overflow-hidden rounded-[1.9rem] border-slate-200 bg-white shadow-[0_30px_90px_-42px_rgba(15,23,42,0.16)] backdrop-blur-sm">
            <CardContent className="p-3 sm:p-6 lg:p-8">
              <div className="flex flex-col items-start gap-3 sm:gap-5 lg:flex-row lg:items-center lg:gap-6">
                <div className="relative">
                  <Avatar className="h-16 w-16 border-4 border-white shadow-[0_18px_36px_-20px_rgba(14,116,144,0.45)] sm:h-24 sm:w-24">
                    {profileImage ? (
                      <AvatarImage className="object-cover object-center" src={profileImage} />
                    ) : (
                      <AvatarFallback className="bg-slate-100 text-xl font-bold text-slate-700">
                        {clubName.split(" ").map((word) => word[0])}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 shadow-[0_10px_24px_-12px_rgba(15,23,42,0.45)] sm:h-8 sm:w-8">
                    <Users className="h-3 w-3 text-white sm:h-4 sm:w-4" />
                  </div>
                </div>

                <div className="flex-1 space-y-2 sm:space-y-3">
                  <div className="space-y-1 sm:space-y-2">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <h1 className="text-xl font-bold text-slate-950 sm:text-3xl md:text-4xl">
                        {clubName}
                      </h1>
                      {clubType && (
                        <Badge className="border-slate-200 bg-slate-100 text-xs text-slate-700">
                          {clubType}
                        </Badge>
                      )}
                    </div>
                    {description && (
                      <p className="text-sm leading-5 text-slate-600 sm:text-base sm:leading-relaxed lg:text-lg">{description}</p>
                    )}
                  </div>

                  {membershipState && (
                    <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50 px-3 py-2 sm:px-4 sm:py-3">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <Badge className={cn("rounded-full border px-3 py-1 text-xs font-semibold", membershipState.badgeClassName)}>
                          <membershipState.icon className="mr-1.5 h-3.5 w-3.5" />
                          {membershipState.label}
                        </Badge>
                        <p className="text-sm text-slate-600">{membershipState.description}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-slate-500 sm:text-sm">
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

                  {(primarySocialLinks.length > 0 || secondarySocialLinks.length > 0) && (
                    <section>
                      <div className="space-y-1.5 sm:space-y-2">
                        {primarySocialLinks.length > 0 ? (
                          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                            {primarySocialLinks.map((link) => (
                              <SocialLink
                                key={link.key}
                                icon={link.icon}
                                label={link.label}
                                onClick={link.onClick}
                                className="w-full px-2 py-2 text-xs sm:px-3"
                              />
                            ))}
                          </div>
                        ) : null}
                        {secondarySocialLinks.length > 0 ? (
                          <div className="grid grid-cols-1 gap-1.5 sm:gap-2">
                            {secondarySocialLinks.map((link) => (
                              <SocialLink
                                key={link.key}
                                icon={link.icon}
                                label={link.label}
                                onClick={link.onClick}
                                className="w-full px-3 py-2 text-xs"
                              />
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </section>
                  )}

                  {typeof outstandingBalanceAmount === "number" && outstandingBalanceAmount > 0 && (
                    <button
                      type="button"
                      onClick={onOpenOutstandingBalance}
                      className="w-full rounded-[1.2rem] border border-orange-200 bg-orange-50 px-3 py-2 text-left transition-colors hover:bg-orange-100 sm:px-4 sm:py-3"
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
                        "w-full rounded-full px-4 py-4 text-sm font-semibold lg:w-auto lg:px-5 lg:py-6",
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

      <div className="container mx-auto mb-4 mt-4 px-4 sm:mb-6 sm:mt-8">
        <div className="grid grid-cols-1 gap-3 sm:gap-4 xl:grid-cols-2 xl:gap-5">
          <aside className="order-2 space-y-3 sm:space-y-4 xl:row-start-2 xl:self-start xl:space-y-5">
            <Card className="overflow-hidden rounded-[1.5rem] border-slate-200 bg-white shadow-[0_20px_60px_-36px_rgba(15,23,42,0.12)]">
              <div className="border-b border-slate-200 bg-white px-3 py-3 text-slate-900 sm:px-4 sm:py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-600/80">
                  Club Snapshot
                </p>
                <h3 className="mt-1.5 text-lg font-semibold sm:text-xl">
                  {clubName || "Club information"}
                </h3>
                <p className="mt-1.5 text-sm leading-5 text-slate-600">
                  The essentials members and visitors need at a glance.
                </p>
              </div>

              <CardContent className="space-y-2.5 p-3 sm:space-y-4 sm:p-4">
                <InfoRow icon={<Mail />} label="Support Email" value={supportEmail || "Not provided"} />
                <InfoRow icon={<MapPin />} label="Location" value={countryName || "Not provided"} />
                <InfoRow icon={<Calendar />} label="Established" value={joinedLabel || "Not provided"} />
              </CardContent>
            </Card>

            {openingTimeEntries.length > 0 && (
              <Card className="rounded-[1.5rem] border-slate-200 bg-white shadow-[0_20px_60px_-36px_rgba(15,23,42,0.1)]">
                <CardHeader className="px-3 pb-2 pt-3 sm:px-4 sm:pb-2 sm:pt-4">
                  <CardTitle className="text-lg text-slate-900">Opening Times</CardTitle>
                  <CardDescription>Published club availability by day.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-1.5 px-3 pb-3 pt-0 sm:px-4 sm:pb-4">
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
                          "flex items-center justify-between rounded-[1rem] border px-3 py-2 text-sm sm:px-3.5 sm:py-2.5",
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

          <section className="order-1 space-y-3 sm:space-y-4 xl:col-span-2 xl:row-start-1 xl:space-y-5">
            <Card className="overflow-hidden rounded-[1.6rem] border-slate-200 bg-white shadow-[0_24px_70px_-38px_rgba(15,23,42,0.12)]">
              <div className="border-b border-slate-200 bg-white px-3 py-3 sm:px-4 sm:py-4 lg:px-5 lg:py-5">
                <div className="flex flex-col gap-2.5 lg:flex-row lg:items-end lg:justify-between lg:gap-4">
                  <div className="max-w-2xl space-y-1.5 sm:space-y-2.5">
                    <Badge className="w-fit rounded-full border-slate-200 bg-slate-100 px-2.5 py-1 text-slate-700">
                      Club Calendar
                    </Badge>
                    <div>
                      <h2 className="text-lg font-semibold tracking-tight text-slate-950 sm:text-xl lg:text-2xl">
                        What&apos;s happening at {clubName || "the club"}
                      </h2>
                      <p className="mt-1 max-w-2xl text-sm leading-5 text-slate-600 sm:mt-1.5 sm:text-sm sm:leading-5">
                        A focused monthly view of published club events, with the selected day agenda kept front and center.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 lg:min-w-[22rem]">
                    <div className="rounded-[1rem] border border-slate-200 bg-white/75 px-2.5 py-2 backdrop-blur sm:px-3 sm:py-2.5">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">This Month</p>
                      <p className="mt-1 text-base font-semibold text-slate-950 sm:text-xl">{homeEventsThisMonthCount}</p>
                      <p className="text-[11px] text-slate-500 sm:text-xs">events</p>
                    </div>
                    <div className="rounded-[1rem] border border-slate-200 bg-white/75 px-2.5 py-2 backdrop-blur sm:px-3 sm:py-2.5">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Selected Day</p>
                      <p className="mt-1 text-base font-semibold text-slate-950 sm:text-xl">{selectedHomeDateItemCount}</p>
                      <p className="text-[11px] text-slate-500 sm:text-xs">agenda items</p>
                    </div>
                    <div className="rounded-[1rem] border border-slate-200 bg-white/75 px-2.5 py-2 backdrop-blur sm:px-3 sm:py-2.5">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Bookings</p>
                      <p className="mt-1 text-sm font-semibold text-slate-950">
                        {homeBookingsNextSevenDaysCount > 0 ? `${homeBookingsNextSevenDaysCount} upcoming` : "No upcoming bookings"}
                      </p>
                      <p className="text-[11px] leading-4 text-slate-500 sm:text-xs">
                        {homeBookingsNextSevenDaysCount > 0
                          ? "Next 7 days"
                          : "Next 7 days clear"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <CardContent className="space-y-2.5 p-2 sm:space-y-4 sm:p-3 lg:space-y-5 lg:p-4">
                {!enableEvents && homeBookingsNextSevenDaysCount === 0 ? (
                  <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center sm:px-6 sm:py-12">
                    <CalendarDays className="mx-auto h-10 w-10 text-slate-400" />
                    <h3 className="mt-4 text-lg font-semibold text-slate-900">Calendar coming soon</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      This club has not enabled events yet. The surrounding club information is still available below.
                    </p>
                  </div>
                ) : isHomeEventsLoading ? (
                  <div className="space-y-2.5 sm:space-y-4">
                    <div className="h-12 animate-pulse rounded-3xl bg-slate-100 sm:h-16" />
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
                    <div className="flex flex-col gap-1.5 rounded-[1.1rem] border border-slate-200 bg-white p-2 sm:flex-row sm:items-center sm:justify-between sm:p-2.5">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 sm:text-xs sm:tracking-[0.22em]">
                          {isDayCalendarOpen ? "Day Calendar" : "Browse Month"}
                        </p>
                        <h3 className="mt-0.5 text-[15px] font-semibold text-slate-950 sm:mt-1 sm:text-lg">
                          {isDayCalendarOpen
                            ? selectedHomeDateLabel
                            : visibleCalendarMonth.toLocaleDateString("en-US", {
                                month: "long",
                                year: "numeric",
                              })}
                        </h3>
                      </div>
                      {isDayCalendarOpen ? (
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7.5 rounded-full border-slate-300 bg-white/80 px-2.5 text-[11px] text-slate-900 hover:bg-slate-50 sm:h-8 sm:px-3 sm:text-xs"
                            onClick={() => setIsDayCalendarOpen(false)}
                          >
                            Month View
                          </Button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-1.5 sm:flex sm:flex-wrap sm:items-center">
                          <Button variant="outline" size="sm" className="h-7.5 rounded-full border-slate-300 bg-white/80 px-2 text-[11px] text-slate-900 hover:bg-slate-50 sm:h-8 sm:px-2.5 sm:text-xs" onClick={onPreviousMonth}>
                            <ArrowLeft className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">Previous</span>
                          </Button>
                          <Button variant="outline" size="sm" className="h-7.5 rounded-full border-slate-300 bg-white/80 px-2 text-[11px] text-slate-900 hover:bg-slate-50 sm:h-8 sm:px-2.5 sm:text-xs" onClick={onToday}>
                            Today
                          </Button>
                          <Button variant="outline" size="sm" className="h-7.5 rounded-full border-slate-300 bg-white/80 px-2 text-[11px] text-slate-900 hover:bg-slate-50 sm:h-8 sm:px-2.5 sm:text-xs" onClick={onNextMonth}>
                            <span className="hidden sm:inline">Next</span>
                            <ArrowRight className="h-4 w-4 sm:ml-2" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {isDayCalendarOpen ? (
                      <div className="rounded-[1.3rem] border border-slate-200 bg-white p-2 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.12)] sm:p-3">
                        {selectedHomeDateItemCount > 0 ? (
                          <div className="space-y-2 sm:space-y-2.5">
                            {selectedHomeDateBookings.map((booking) => (
                              <div
                                key={`day-calendar-${selectedHomeDateKey}-${booking.venueId}-${booking.slotTime}`}
                                className="rounded-[1rem] border border-sky-200 bg-sky-50/70 px-2.5 py-2 shadow-[0_12px_28px_-24px_rgba(2,132,199,0.18)] sm:px-3 sm:py-2.5"
                              >
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                  <div>
                                    <p className="text-sm font-semibold text-slate-950 sm:text-base">{booking.venueName}</p>
                                    <p className="mt-0.5 text-xs text-slate-600 sm:text-sm">{booking.timeLabel}</p>
                                  </div>
                                  <Badge className="w-fit rounded-full border border-sky-200 bg-white px-2.5 py-1 text-[11px] text-sky-700">
                                    Booking
                                  </Badge>
                                </div>
                              </div>
                            ))}

                            {selectedHomeDateEvents.map((event) => {
                              const registrationStatus = getRegistrationStatus(event, todayKey);

                              return (
                                <div
                                  key={`day-calendar-${selectedHomeDateKey}-${event.eventId ?? event.id}`}
                                  className="rounded-[1rem] border border-slate-200 bg-white px-2.5 py-2 shadow-[0_12px_28px_-24px_rgba(15,23,42,0.12)] sm:px-3 sm:py-2.5"
                                >
                                  <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                      <p className="text-sm font-semibold text-slate-950 sm:text-base">{event.title}</p>
                                      <p className="mt-0.5 text-xs text-slate-600 sm:text-sm">{formatRangeLabel(event)}</p>
                                      {event.description ? (
                                        <p className="mt-1.5 text-xs leading-5 text-slate-500 sm:text-sm">{event.description}</p>
                                      ) : null}
                                    </div>
                                    <Badge className={cn("w-fit rounded-full border px-2.5 py-1 text-[11px]", registrationStatus.className)}>
                                      {registrationStatus.label}
                                    </Badge>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="rounded-[1.3rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center sm:px-5 sm:py-8">
                              <p className="text-base font-semibold text-slate-900 sm:text-lg">Nothing scheduled for this day</p>
                              <p className="mt-1.5 text-sm leading-5 text-slate-600">
                              Pick another date in month view to inspect that day&apos;s bookings and events.
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className={cn("grid gap-2", canShowSideAgenda && "lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start") }>
                        <div className="rounded-[1.3rem] border border-slate-200 bg-white p-1.5 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.12)] sm:p-2.5">
                          <div className="grid grid-cols-7 gap-1 pb-0.5 text-center text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-500/80 sm:gap-1 sm:pb-1 sm:text-[10px] sm:tracking-[0.16em]">
                            {HOME_CALENDAR_WEEKDAYS.map((day) => (
                              <div key={day} className="py-1 sm:py-1.5">
                                <span className="sm:hidden">{day.charAt(0)}</span>
                                <span className="hidden sm:inline">{day}</span>
                              </div>
                            ))}
                          </div>

                          <div className="grid grid-cols-7 gap-1 sm:gap-1">
                            {homeCalendarDays.map((day) => {
                              const dateKey = formatDateKey(day);
                              const dayEvents = eventsByDate.get(dateKey) ?? [];
                              const dayBookings = bookingsByDate.get(dateKey) ?? [];
                              const dayItemCount = dayEvents.length + dayBookings.length;
                              const primaryDayLabel = dayEvents[0]?.title ?? dayBookings[0]?.venueName ?? null;
                              const primaryDayItemType = dayEvents[0]
                                ? "event"
                                : dayBookings[0]
                                  ? "booking"
                                  : null;
                              const isCurrentMonth = day.getMonth() === visibleCalendarMonth.getMonth();
                              const isSelected = dateKey === selectedHomeDateKey;
                              const isToday = dateKey === todayKey;

                              return (
                                <button
                                  key={dateKey}
                                  type="button"
                                  onClick={() => handleCalendarDateClick(dateKey)}
                                  className={cn(
                                    "group relative min-h-[3.35rem] rounded-[0.9rem] border p-1 pt-6.5 text-left transition-all sm:min-h-[5.4rem] sm:rounded-[1rem] sm:p-2 sm:pt-8.5",
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
                                  <div className="absolute left-1 right-1 top-1 flex items-start justify-between gap-0.5 sm:left-2 sm:right-2 sm:top-2 sm:gap-1.5">
                                    <span
                                      className={cn(
                                        "inline-flex h-4.5 w-4.5 items-center justify-center rounded-full text-[9px] font-semibold sm:h-6 sm:w-6 sm:text-[11px]",
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
                                    {dayItemCount > 0 && (
                                      <span
                                        className={cn(
                                          "hidden rounded-full px-1 py-0.5 text-[9px] font-semibold sm:inline-flex sm:px-1.5 sm:py-0.5 sm:text-[9px]",
                                          isSelected ? "bg-white/90 text-slate-700" : "bg-slate-200 text-slate-700",
                                        )}
                                      >
                                        {dayItemCount}
                                      </span>
                                    )}
                                  </div>

                                  <div className="mt-1 flex flex-wrap gap-0.5 sm:hidden">
                                    {dayEvents.map((event) => (
                                      <span
                                        key={`${dateKey}-${event.eventId ?? event.id}-mobile`}
                                        className={cn(
                                          "h-1.5 w-1.5 rounded-full",
                                          isSelected || isToday ? "bg-red-600" : "bg-red-500",
                                        )}
                                      />
                                    ))}
                                    {dayBookings.map((booking) => (
                                      <span
                                        key={`${dateKey}-${booking.venueId}-${booking.slotTime}-booking-mobile`}
                                        className={cn(
                                          "h-1.5 w-1.5 rounded-full",
                                          isSelected || isToday ? "bg-sky-700" : "bg-sky-500",
                                        )}
                                      />
                                    ))}
                                  </div>

                                  <div className="mt-1.5 hidden sm:block">
                                    {primaryDayLabel ? (
                                      <>
                                        <div
                                          className={cn(
                                            "rounded-md border px-1.5 py-0.5 text-[10px] font-medium leading-3.5",
                                            primaryDayItemType === "booking"
                                              ? "border-sky-200 bg-sky-50 text-sky-900"
                                              : "border-slate-200 bg-white text-slate-700",
                                            isSelected && primaryDayItemType !== "booking" && "border-slate-300 bg-slate-50",
                                            isSelected && primaryDayItemType === "booking" && "border-sky-300 bg-sky-100",
                                          )}
                                        >
                                          <p className="overflow-hidden [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
                                            {abbreviateCalendarLabel(primaryDayLabel)}
                                          </p>
                                        </div>
                                        {dayItemCount > 1 ? (
                                          <p className={cn("mt-0.5 text-[9px] font-medium", isSelected ? "text-slate-700" : "text-slate-500")}>
                                            +{dayItemCount - 1} more
                                          </p>
                                        ) : null}
                                      </>
                                    ) : null}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {canShowSideAgenda && (
                          <div className="rounded-[1.3rem] border border-slate-200 bg-white p-2.5 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.1)] sm:p-3 lg:sticky lg:top-24">
                            <div className="flex flex-col gap-1.5 border-b border-slate-200 pb-2.5 sm:pb-3">
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Day Agenda</p>
                                <h3 className="mt-0.5 text-[15px] font-semibold text-slate-950 sm:text-lg">{selectedHomeDateLabel}</h3>
                              </div>
                              {canViewEvents && (
                                <Button variant="outline" className="h-7.5 w-fit rounded-full border-slate-300 bg-white/80 px-2.5 text-[11px] text-slate-900 hover:bg-slate-50 sm:h-8 sm:px-3 sm:text-xs" onClick={onOpenEvents}>
                                  Open Full Events View
                                </Button>
                              )}
                            </div>

                            {selectedHomeDateItemCount > 0 ? (
                              <div className="mt-2.5 space-y-2">
                                {selectedHomeDateBookings.map((booking) => (
                                  <div
                                    key={`${selectedHomeDateKey}-${booking.venueId}-${booking.slotTime}-side`}
                                    className={dayAgendaCardClassName}
                                  >
                                    <div className="flex flex-col gap-2">
                                      <div className="space-y-1.5">
                                        <Badge className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] text-slate-700">
                                          {booking.timeLabel}
                                        </Badge>
                                        <div>
                                          <h4 className="text-sm font-semibold text-slate-950">{booking.venueName}</h4>
                                        </div>
                                      </div>

                                      {canViewBookings && (
                                        <Button
                                          className="h-7.5 w-fit rounded-full bg-slate-900 px-2.5 text-[11px] text-white shadow-[0_14px_30px_-18px_rgba(15,23,42,0.24)] hover:bg-slate-800 sm:h-8 sm:px-3 sm:text-xs"
                                          onClick={onOpenBookings}
                                        >
                                          Go to Bookings
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                ))}

                                {selectedHomeDateEvents.map((event) => {
                                  const registrationStatus = getRegistrationStatus(event, todayKey);

                                  return (
                                    <div
                                      key={`${selectedHomeDateKey}-${event.eventId ?? event.id}-side`}
                                      className={dayAgendaCardClassName}
                                    >
                                      <div className="flex flex-col gap-2">
                                        <div className="space-y-2">
                                          <div className="flex flex-wrap items-center gap-1.5">
                                            <Badge className={cn("rounded-full border px-2.5 py-1 text-[11px]", registrationStatus.className)}>
                                              {registrationStatus.label}
                                            </Badge>
                                            <Badge className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] text-slate-700">
                                              {getPricingSummary(event.pricing, currency || "ZAR")}
                                            </Badge>
                                          </div>
                                          <div>
                                            <h4 className="text-sm font-semibold text-slate-950">{event.title}</h4>
                                            <p className="mt-0.5 text-xs font-medium text-slate-500">{formatRangeLabel(event)}</p>
                                          </div>
                                        </div>

                                        {canViewEvents && (
                                          <Button className="h-7.5 w-fit rounded-full bg-slate-900 px-2.5 text-[11px] text-white shadow-[0_14px_30px_-18px_rgba(15,23,42,0.24)] hover:bg-slate-800 sm:h-8 sm:px-3 sm:text-xs" onClick={onOpenEvents}>
                                            Go to Events
                                          </Button>
                                        )}
                                      </div>

                                      <p className="mt-2 text-xs leading-5 text-slate-600 sm:text-sm">
                                        {event.description || "No event description has been published yet."}
                                      </p>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="mt-2.5 rounded-[1rem] border border-dashed border-slate-300 bg-white/80 px-3 py-5 text-center">
                                <p className="text-base font-semibold text-slate-900">No items scheduled for this day</p>
                                <p className="mt-1.5 text-sm leading-5 text-slate-600">
                                  {nextHomeEvent
                                    ? `The next published event is ${nextHomeEvent.title} on ${formatRangeLabel(nextHomeEvent)}.`
                                    : "There are no upcoming club events or bookings scheduled for this day."}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {!isDayCalendarOpen && !canShowSideAgenda && (
                      <div className="rounded-[1.3rem] border border-slate-200 bg-white p-2.5 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.1)] sm:p-3">
                      <div className="flex flex-col gap-1.5 border-b border-slate-200 pb-2.5 sm:flex-row sm:items-end sm:justify-between sm:pb-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Day Agenda</p>
                          <h3 className="mt-0.5 text-[15px] font-semibold text-slate-950 sm:text-lg">{selectedHomeDateLabel}</h3>
                        </div>
                        {canViewEvents && (
                          <Button variant="outline" className="h-7.5 rounded-full border-slate-300 bg-white/80 px-2.5 text-[11px] text-slate-900 hover:bg-slate-50 sm:h-8 sm:px-3 sm:text-xs" onClick={onOpenEvents}>
                            Open Full Events View
                          </Button>
                        )}
                      </div>

                      {selectedHomeDateItemCount > 0 ? (
                        <div className="mt-2.5 space-y-2">
                          {selectedHomeDateBookings.map((booking) => (
                            <div
                              key={`${selectedHomeDateKey}-${booking.venueId}-${booking.slotTime}`}
                              className={dayAgendaCardClassName}
                            >
                              <div className="flex flex-col gap-2 sm:gap-2.5">
                                <div className="space-y-1.5">
                                  <Badge className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] text-slate-700">
                                    {booking.timeLabel}
                                  </Badge>
                                  <div>
                                    <h4 className="text-sm font-semibold text-slate-950 sm:text-base">{booking.venueName}</h4>
                                  </div>
                                </div>

                                {canViewBookings && (
                                  <Button
                                    className="h-8 w-fit rounded-full bg-slate-900 px-3 text-xs text-white shadow-[0_14px_30px_-18px_rgba(15,23,42,0.3)] hover:bg-slate-800 sm:h-9 sm:px-3.5 sm:text-sm"
                                    onClick={onOpenBookings}
                                  >
                                    Go to Bookings
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}

                          {selectedHomeDateEvents.map((event) => {
                            const registrationStatus = getRegistrationStatus(event, todayKey);

                            return (
                              <div
                                key={`${selectedHomeDateKey}-${event.eventId ?? event.id}`}
                                className="rounded-[1.2rem] border border-slate-200 bg-white p-3 shadow-[0_16px_48px_-32px_rgba(15,23,42,0.1)] sm:p-4"
                              >
                                <div className="flex flex-col gap-2.5 lg:flex-row lg:items-start lg:justify-between">
                                  <div className="space-y-2.5">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <Badge className={cn("rounded-full border px-3 py-1", registrationStatus.className)}>
                                        {registrationStatus.label}
                                      </Badge>
                                      <Badge className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-slate-700">
                                        {getPricingSummary(event.pricing, currency || "ZAR")}
                                      </Badge>
                                    </div>
                                    <div>
                                      <h4 className="text-base font-semibold text-slate-950 sm:text-lg">{event.title}</h4>
                                      <p className="mt-1 text-sm font-medium text-slate-500">{formatRangeLabel(event)}</p>
                                    </div>
                                  </div>

                                  {canViewEvents && (
                                    <Button className="h-8 rounded-full bg-slate-900 px-3 text-xs text-white shadow-[0_14px_30px_-18px_rgba(15,23,42,0.3)] hover:bg-slate-800 sm:h-9 sm:px-3.5 sm:text-sm" onClick={onOpenEvents}>
                                      Go to Events
                                    </Button>
                                  )}
                                </div>

                                <p className="mt-2.5 text-sm leading-5 text-slate-600 sm:mt-4 sm:leading-6">
                                  {event.description || "No event description has been published yet."}
                                </p>

                                <div className="mt-2.5 flex flex-wrap gap-1.5 text-xs font-medium text-slate-500 sm:mt-4 sm:gap-2">
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
                        <div className="mt-3 rounded-[1.2rem] border border-dashed border-slate-300 bg-white/80 px-4 py-6 text-center sm:px-5 sm:py-8">
                          <p className="text-lg font-semibold text-slate-900">No items scheduled for this day</p>
                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            {nextHomeEvent
                              ? `The next published event is ${nextHomeEvent.title} on ${formatRangeLabel(nextHomeEvent)}.`
                              : "There are no upcoming club events or bookings scheduled for this day."}
                          </p>
                        </div>
                      )}
                    </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </section>

          <aside className="order-3 space-y-3 sm:space-y-4 xl:row-start-2 xl:w-full xl:self-start xl:space-y-5">
            {aboutClub && (
              <Card className="rounded-[1.5rem] border-slate-200 bg-white shadow-[0_20px_60px_-36px_rgba(15,23,42,0.1)]">
                <CardHeader className="px-3 pb-2 pt-3 sm:px-4 sm:pb-2 sm:pt-4">
                  <CardTitle className="text-lg text-slate-900">Club Description</CardTitle>
                  <CardDescription>A quick overview of what makes this club distinct.</CardDescription>
                </CardHeader>
                <CardContent className="px-3 pb-3 pt-0 sm:px-4 sm:pb-4">
                  <p className="whitespace-pre-wrap text-sm leading-5 text-slate-600 sm:leading-6">{aboutClub}</p>
                </CardContent>
              </Card>
            )}

            <Card className="overflow-hidden rounded-[1.5rem] border-slate-200 bg-white shadow-[0_20px_60px_-36px_rgba(15,23,42,0.1)]">
              <CardHeader className="px-3 pb-2 pt-3 sm:px-4 sm:pb-2 sm:pt-4">
                <CardTitle className="text-lg text-slate-900">Gallery</CardTitle>
                <CardDescription>Recent visuals from the club community.</CardDescription>
              </CardHeader>
              <CardContent className="px-3 pb-3 pt-0 sm:px-4 sm:pb-4">
                {galleryImages.length > 0 ? (
                  <div className="grid auto-rows-[4.5rem] grid-cols-2 gap-1.5 sm:auto-rows-[6.75rem] sm:gap-2.5">
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
                  <div className="rounded-[1.4rem] border border-dashed border-slate-300 bg-slate-50/80 px-4 py-8 text-center text-sm text-slate-500">
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