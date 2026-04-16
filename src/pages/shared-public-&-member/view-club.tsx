// fixed erroneous import from prior patch
import Pager from "@/components/pager.tsx";
import { Tabs, TabsContent } from "@/components/ui/tabs.tsx";
import { Dialog, DialogContent } from "@/components/ui/dialog.tsx";
import {
  Calendar,
  CalendarDays,
  Loader2,
  CreditCard,
  FileText,
  Home,
  ShoppingBag,
  ArrowLeft,
  ArrowRight,
  BoxIcon,
} from "lucide-react";
import { useFetchClub, useFetchClubBankDetails } from "@/queries/clubs";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useCallback, useEffect, useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { getMemberOrders } from "@/services/orders";
import { getEventsIncludingAll } from "@/services/events";
import { getVenues } from "@/services/venues";
import { getBookings } from "@/services/bookings";
import { useQuery } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";

import PaymentOptionsScreen from "@/components/member/payments/payment-options-screen";
import type { PaymentTransactionOption } from "@/components/member/payments/payment-types.ts";
import {
  formatDateKey,
  formatLongDate,
  parseDateKey,
  sanitizeEvents,
  type MemberEvent,
} from "@/components/member/events/event-utils";
import { AuthContext } from "@/context/AuthContext";
import { useContext } from "react";
import { updatePaymentReferenceService } from "@/services/profile";
import { toast } from "sonner";
import { ClubRegistrationTab } from "@/components/member/view-club-tabs/club-registration-tab";
import { ClubBookingsTab } from "@/components/member/view-club-tabs/club-bookings-tab";
import { ClubEventsTab } from "@/components/member/view-club-tabs/club-events-tab";
import {
  ClubHomeTab,
  type HomeBookingItem,
} from "@/components/member/view-club-tabs/club-home-tab";
import { ClubPaymentsTab } from "@/components/member/view-club-tabs/club-payments-tab";
import { ClubShopTab } from "@/components/member/view-club-tabs/club-shop-tab";
import MemberStorage from "@/components/member/storage/storage";
import StorageRequestDialog from "@/components/storage-request-dialog/StorageRequestDialog";

function epochToJoinedString(epoch: number): string {
  const date = new Date(epoch); // if epoch is in seconds, use new Date(epoch * 1000)
  const options: Intl.DateTimeFormatOptions = {
    month: "long",
    year: "numeric",
  };
  const formatted = date.toLocaleDateString("en-US", options);
  return `Joined ${formatted}`;
}

const countryMap: Record<string, string> = {
  ZA: "South Africa",
  US: "United States",
  GB: "United Kingdom",
  DE: "Germany",
  FR: "France",
};

type MemberOrderItem = {
  product_id?: string;
  name?: string;
  quantity?: number;
  refund_quantity?: number;
  fulfillment_quantity?: number;
  price?: number;
  subtotal?: number;
};

type MemberOrder = {
  order_id?: string;
  transaction_id?: string;
  created_date?: number;
  payment_status?: string;
  fulfillment_status?: string;
  total_amount?: number;
  amount_paid?: number;
  items?: MemberOrderItem[];
};

type VenueSchedule = {
  day_of_week: number;
  is_closed: boolean;
  start_time: string;
  end_time: string;
};

type Venue = {
  venue_id: string;
  venue_name: string;
  smallest_booking_unit?: number;
  max_daily_booking_time?: number;
  times: VenueSchedule[];
};

type VenueBooking = {
  slot_time: number;
  name?: string;
};

type ClubOpeningTime = {
  open?: string;
  close?: string;
  closed?: boolean;
};

type ClubGalleryImage = {
  key: string;
  url: string;
};

type ClubSection =
  | "home"
  | "bank"
  | "member-registration"
  | "bookings"
  | "events"
  | "shop"
  | "storage";

type ClubNavItem = {
  key: ClubSection;
  label: string;
  icon: typeof Home;
};

const CLUB_SECTION_ROUTE_SEGMENTS: Record<ClubSection, string> = {
  home: "",
  bank: "payments",
  "member-registration": "registration",
  bookings: "bookings",
  events: "events",
  shop: "shop",
  storage: "storage",
};

const CLUB_ROUTE_SEGMENT_TO_SECTION: Record<string, ClubSection> = {
  payments: "bank",
  registration: "member-registration",
  bookings: "bookings",
  events: "events",
  shop: "shop",
  storage: "storage",
};

function normalizeClubSection(value: string | null) {
  if (!value) {
    return "home" as ClubSection;
  }

  if (value === "member-registration") {
    return value;
  }

  if (value === "payments") {
    return "bank" as ClubSection;
  }

  if (value in CLUB_SECTION_ROUTE_SEGMENTS) {
    return value as ClubSection;
  }

  return "home" as ClubSection;
}

function getClubSectionPath(clubId: string, section: ClubSection) {
  const routeSegment = CLUB_SECTION_ROUTE_SEGMENTS[section];

  return routeSegment
    ? `/myclubs/${clubId}/${routeSegment}`
    : `/myclubs/${clubId}`;
}

function getClubSectionFromPath(pathname: string, clubId: string) {
  const segments = pathname.split("/").filter(Boolean);
  const clubIndex = segments.findIndex(
    (segment, index) =>
      segment === clubId &&
      (segments[index - 1] === "myclubs" || segments[index - 1] === "clubs"),
  );

  if (clubIndex === -1) {
    return "home" as ClubSection;
  }

  const routeSegment = segments[clubIndex + 1];

  return routeSegment && routeSegment in CLUB_ROUTE_SEGMENT_TO_SECTION
    ? CLUB_ROUTE_SEGMENT_TO_SECTION[routeSegment]
    : "home";
}

function scrollClubPageToTop() {
  if (typeof window === "undefined") {
    return;
  }

  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  document.scrollingElement?.scrollTo({ top: 0, left: 0, behavior: "auto" });
}

function normalizeBookingName(name: string) {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

function formatBookingTimeLabel(startTime: number, endTime: number) {
  return `${new Date(startTime * 1000).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })} - ${new Date(endTime * 1000).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })}`;
}

function mergeAdjacentBookings(bookings: HomeBookingItem[]) {
  if (bookings.length <= 1) {
    return bookings;
  }

  const sortedBookings = [...bookings].sort((left, right) => {
    if (left.dateKey !== right.dateKey) {
      return left.dateKey.localeCompare(right.dateKey);
    }

    if (left.venueId !== right.venueId) {
      return left.venueId.localeCompare(right.venueId);
    }

    return left.slotTime - right.slotTime;
  });

  const mergedBookings: HomeBookingItem[] = [];

  sortedBookings.forEach((booking) => {
    const lastBooking = mergedBookings[mergedBookings.length - 1];

    if (
      lastBooking &&
      lastBooking.dateKey === booking.dateKey &&
      lastBooking.venueId === booking.venueId &&
      lastBooking.endTime === booking.slotTime
    ) {
      lastBooking.endTime = booking.endTime;
      lastBooking.timeLabel = formatBookingTimeLabel(
        lastBooking.slotTime,
        lastBooking.endTime,
      );
      return;
    }

    mergedBookings.push({ ...booking });
  });

  return mergedBookings;
}

function getMonthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function shiftMonth(date: Date, offset: number) {
  return new Date(date.getFullYear(), date.getMonth() + offset, 1);
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function getCalendarGridStart(date: Date) {
  const monthStart = getMonthStart(date);
  const mondayIndex = (monthStart.getDay() + 6) % 7;
  monthStart.setDate(monthStart.getDate() - mondayIndex);
  return monthStart;
}

function getDateKeysInRange(startDateKey: string, endDateKey?: string) {
  if (!startDateKey) {
    return [];
  }

  const startDate = parseDateKey(startDateKey);
  const endDate = endDateKey ? parseDateKey(endDateKey) : startDate;
  const safeEndDate = endDate < startDate ? startDate : endDate;
  const dateKeys: string[] = [];
  const currentDate = new Date(startDate);
  let guard = 0;

  while (currentDate <= safeEndDate && guard < 366) {
    dateKeys.push(formatDateKey(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
    guard += 1;
  }

  return dateKeys;
}

function getOpeningTimeEntries(value: unknown) {
  const dayNames = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  if (Array.isArray(value)) {
    return value
      .map((entry, index) => {
        const times =
          typeof entry === "object" && entry !== null
            ? (entry as ClubOpeningTime)
            : {};
        const hasRange = Boolean(times.open && times.close);

        return {
          day: dayNames[index] ?? `Day ${index + 1}`,
          label: times.closed
            ? "Closed"
            : hasRange
              ? `${times.open} - ${times.close}`
              : "Hours unavailable",
        };
      })
      .filter((entry) => Boolean(entry.day));
  }

  if (typeof value === "object" && value !== null) {
    return Object.entries(value as Record<string, unknown>).map(
      ([day, entry]) => {
        const times =
          typeof entry === "object" && entry !== null
            ? (entry as ClubOpeningTime)
            : {};
        const hasRange = Boolean(times.open && times.close);

        return {
          day,
          label: times.closed
            ? "Closed"
            : hasRange
              ? `${times.open} - ${times.close}`
              : "Hours unavailable",
        };
      },
    );
  }

  return [];
}

function getGalleryImages(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as ClubGalleryImage[];
  }

  return value
    .map((entry, index) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }

      const image = entry as Record<string, unknown>;
      const url = typeof image.url === "string" ? image.url : "";

      if (!url) {
        return null;
      }

      return {
        key:
          typeof image.key === "string" && image.key.trim()
            ? image.key
            : `gallery-image-${index}`,
        url,
      } satisfies ClubGalleryImage;
    })
    .filter((image): image is ClubGalleryImage => Boolean(image));
}

const getOrderPaymentBadgeClassName = (status?: string) => {
  if (status === "PAID" || status === "PAID (Partial Refund)") {
    return "bg-green-100 text-green-800 border-green-200";
  }

  if (status === "PENDING") {
    return "bg-orange-100 text-orange-800 border-orange-200";
  }

  if (status === "PARTIALLY_PAID") {
    return "bg-purple-100 text-purple-800 border-purple-200";
  }

  if (status === "CANCELLED" || status === "REFUND" || status === "REFUNDED") {
    return "bg-red-100 text-red-800 border-red-200";
  }

  return "bg-gray-100 text-gray-800 border-gray-200";
};

const getOrderFulfillmentBadgeClassName = (status?: string) => {
  if (status === "DELIVERED") {
    return "bg-green-100 text-green-800 border-green-200";
  }

  if (status === "NOT_PROCESSED") {
    return "bg-orange-100 text-orange-800 border-orange-200";
  }

  if (status === "PROCESSING" || status === "PARTIALLY_DELIVERED") {
    return "bg-purple-100 text-purple-800 border-purple-200";
  }

  if (status === "CANCELLED" || status === "REFUND" || status === "REFUNDED") {
    return "bg-red-100 text-red-800 border-red-200";
  }

  return "bg-gray-100 text-gray-800 border-gray-200";
};

const getRefundedAmount = (order: MemberOrder) => {
  if (
    order.payment_status !== "PAID (Partial Refund)" &&
    order.payment_status !== "REFUND" &&
    order.payment_status !== "REFUNDED"
  ) {
    return 0;
  }

  return Math.max((order.total_amount || 0) - (order.amount_paid || 0), 0);
};

export default function ViewClubPage() {
  const auth = useContext(AuthContext);
  const isLoggedIn = !!auth?.user;

  const navigate = useNavigate();
  const { clubId } = useParams();
  const [countryName, setCountryName] = useState("");
  const { data, isLoading, isError } = useFetchClub(clubId as string);

  const { data: bankDetails, isLoading: bankDetailsLoading } =
    useFetchClubBankDetails(clubId as string, !!data?.club_member_exists);

  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState("home");
  const [selectedStorageItem, setSelectedStorageItem] = useState<any>(null);
  const { pathname, search } = useLocation();

  const routeSection = useMemo(
    () => getClubSectionFromPath(pathname, clubId as string),
    [clubId, pathname],
  );

  const todayKey = useMemo(() => formatDateKey(new Date()), []);
  const [visibleCalendarMonth, setVisibleCalendarMonth] = useState(() =>
    getMonthStart(new Date()),
  );
  const [selectedHomeDateKey, setSelectedHomeDateKey] = useState(todayKey);

  // Handle query params on component mount and when search changes
  useEffect(() => {
    const queryParams = new URLSearchParams(search);
    const tabParam = queryParams.get("tab");
    const orderIdParam = queryParams.get("orderId");
    const transactionIdParam = queryParams.get("transactionId");
    const eventRegistrationIdParam = queryParams.get("eventRegistrationId");
    const shouldOpenPaymentScreen = queryParams.get("paymentScreen") === "true";

    if (tabParam && clubId) {
      queryParams.delete("tab");
      const nextSearch = queryParams.toString();

      navigate(
        {
          pathname: getClubSectionPath(clubId, normalizeClubSection(tabParam)),
          search: nextSearch ? `?${nextSearch}` : "",
        },
        { replace: true },
      );
      return;
    }

    setActiveTab(routeSection);

    // Auto-select payment if orderId is in query params and bankDetails are loaded
    if (
      orderIdParam &&
      bankDetails?.transaction_options &&
      !bankDetailsLoading
    ) {
      const matchedPayment = bankDetails.transaction_options.find(
        (payment: PaymentTransactionOption) =>
          payment.order_id === orderIdParam,
      );

      if (matchedPayment) {
        setPaymentReturnTab("bank");
        if (clubId && routeSection !== "bank") {
          navigate(
            {
              pathname: getClubSectionPath(clubId, "bank"),
              search: search ? search : "",
            },
            { replace: true },
          );
        }
        setNewOrderId(orderIdParam);
        setSelectedPaymentOption(matchedPayment);
        if (shouldOpenPaymentScreen) {
          setIsPaymentScreenOpen(true);
        }
      }
    }

    if (
      transactionIdParam &&
      bankDetails?.transaction_options &&
      !bankDetailsLoading
    ) {
      const matchedPayment = bankDetails.transaction_options.find(
        (payment: PaymentTransactionOption) =>
          payment.transaction_id === transactionIdParam,
      );

      if (matchedPayment) {
        setPaymentReturnTab("bank");
        if (clubId && routeSection !== "bank") {
          navigate(
            {
              pathname: getClubSectionPath(clubId, "bank"),
              search: search ? search : "",
            },
            { replace: true },
          );
        }
        setHighlightedTransactionId(transactionIdParam);
        setSelectedPaymentOption(matchedPayment);
        if (shouldOpenPaymentScreen) {
          setIsPaymentScreenOpen(true);
        }
      }
    }

    if (
      eventRegistrationIdParam &&
      bankDetails?.transaction_options &&
      !bankDetailsLoading
    ) {
      const matchedPayment = bankDetails.transaction_options.find(
        (payment: PaymentTransactionOption) =>
          payment.event_registration_id === eventRegistrationIdParam,
      );

      if (matchedPayment) {
        setPaymentReturnTab("bank");
        if (clubId && routeSection !== "bank") {
          navigate(
            {
              pathname: getClubSectionPath(clubId, "bank"),
              search: search ? search : "",
            },
            { replace: true },
          );
        }
        setHighlightedEventRegistrationId(eventRegistrationIdParam);
        setSelectedPaymentOption(matchedPayment);
        if (shouldOpenPaymentScreen) {
          setIsPaymentScreenOpen(true);
        }
      }
    }
  }, [
    search,
    bankDetails?.transaction_options,
    bankDetailsLoading,
    clubId,
    navigate,
    routeSection,
  ]);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [editingReference, setEditingReference] = useState(false);
  const [scrollToOutstandingTrigger, setScrollToOutstandingTrigger] =
    useState(0);
  const [newReference, setNewReference] = useState(
    bankDetails?.registration_payment_reference || "",
  );
  const [savingReference, setSavingReference] = useState(false);
  const [isPaymentScreenOpen, setIsPaymentScreenOpen] = useState(false);
  const [selectedPaymentOption, setSelectedPaymentOption] =
    useState<PaymentTransactionOption | null>(null);
  const [paymentReturnTab, setPaymentReturnTab] = useState("bank");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    "eft" | "payfast" | null
  >(null);
  const [newOrderId, setNewOrderId] = useState<string | null>(null);
  const [highlightedTransactionId, setHighlightedTransactionId] = useState<
    string | null
  >(null);
  const [highlightedEventRegistrationId, setHighlightedEventRegistrationId] =
    useState<string | null>(null);
  const [orderSortColumn, setOrderSortColumn] = useState<
    "date" | "payment_status" | "fulfillment_status" | "total" | null
  >(null);
  const [orderSortDirection, setOrderSortDirection] = useState<"asc" | "desc">(
    "asc",
  );
  const [orderSearch, setOrderSearch] = useState("");
  const [eventRegistrationSearch, setEventRegistrationSearch] = useState("");
  const [venues, setVenues] = useState<Venue[]>([]);
  const [venuesLoading, setVenuesLoading] = useState(false);
  const [venuesError, setVenuesError] = useState<string | null>(null);
  const [selectedGalleryImageIndex, setSelectedGalleryImageIndex] = useState<
    number | null
  >(null);

  const canViewBookings =
    isLoggedIn &&
    !!data?.club_member_exists &&
    !!data?.registered &&
    !!data?.venues_enabled;

  const canViewEvents =
    isLoggedIn &&
    !!data?.club_member_exists &&
    !!data?.registered &&
    !!data?.enable_events;

  const {
    data: memberOrders,
    isLoading: isOrdersLoading,
    error: ordersError,
  } = useQuery({
    queryKey: ["member-orders", data?.club_account_id],
    queryFn: () => getMemberOrders(data?.club_account_id || ""),
    enabled:
      !!data?.club_account_id &&
      !!data?.club_member_exists &&
      activeTab === "shop",
  });

  const {
    data: homeEventsData,
    isLoading: isHomeEventsLoading,
    isError: isHomeEventsError,
  } = useQuery({
    queryKey: ["club-home-events", data?.club_account_id],
    queryFn: () => getEventsIncludingAll(data?.club_account_id || ""),
    enabled:
      activeTab === "home" && !!data?.club_account_id && !!data?.enable_events,
  });

  const { data: upcomingMemberBookings = [] } = useQuery<HomeBookingItem[]>({
    queryKey: [
      "club-home-bookings",
      data?.member_name,
      venues.map((venue) => venue.venue_id).join(","),
    ],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const rangeStart = Math.floor(today.getTime() / 1000);
      const rangeEndDate = new Date(today);
      rangeEndDate.setDate(rangeEndDate.getDate() + 7);
      const rangeEnd = Math.floor(rangeEndDate.getTime() / 1000);
      const normalizedMemberName = normalizeBookingName(
        data?.member_name || "",
      );

      const bookingResponses = await Promise.all(
        venues.map(async (venue) => {
          const response = await getBookings(
            venue.venue_id,
            String(rangeStart),
            String(rangeEnd),
          );

          const venueBookings = Array.isArray(response?.bookings)
            ? (response.bookings as VenueBooking[])
            : [];

          return venueBookings
            .filter(
              (booking) =>
                normalizeBookingName(booking.name || "") ===
                normalizedMemberName,
            )
            .map((booking) => {
              const slotTime = Number(booking.slot_time) || 0;
              const bookingDurationSeconds =
                (venue.smallest_booking_unit || 60) * 60;
              const endTime = slotTime + bookingDurationSeconds;

              return {
                venueId: venue.venue_id,
                venueName: venue.venue_name,
                slotTime,
                endTime,
                dateKey: formatDateKey(new Date(slotTime * 1000)),
                timeLabel: formatBookingTimeLabel(slotTime, endTime),
              } satisfies HomeBookingItem;
            });
        }),
      );

      return mergeAdjacentBookings(bookingResponses.flat());
    },
    enabled:
      activeTab === "home" &&
      canViewBookings &&
      venues.length > 0 &&
      !!data?.member_name,
  });

  const memberOrderList = useMemo(() => {
    return Array.isArray(memberOrders?.orders)
      ? (memberOrders.orders as MemberOrder[])
      : [];
  }, [memberOrders?.orders]);

  const homeEvents = useMemo(() => {
    return sanitizeEvents(
      Array.isArray(homeEventsData?.events) ? homeEventsData.events : [],
    );
  }, [homeEventsData?.events]);

  const upcomingHomeEvents = useMemo(() => {
    return homeEvents.filter(
      (event) => !event.endDate || event.endDate >= todayKey,
    );
  }, [homeEvents, todayKey]);

  const eventsByDate = useMemo(() => {
    const nextMap = new Map<string, MemberEvent[]>();

    upcomingHomeEvents.forEach((event) => {
      getDateKeysInRange(event.startDate, event.endDate).forEach((dateKey) => {
        const existingEvents = nextMap.get(dateKey);

        if (existingEvents) {
          existingEvents.push(event);
          return;
        }

        nextMap.set(dateKey, [event]);
      });
    });

    nextMap.forEach((events) => {
      events.sort((left, right) => {
        if (left.startDate !== right.startDate) {
          return left.startDate.localeCompare(right.startDate);
        }

        return left.title.localeCompare(right.title);
      });
    });

    return nextMap;
  }, [upcomingHomeEvents]);

  const nextHomeEvent = useMemo(() => {
    return upcomingHomeEvents[0] ?? null;
  }, [upcomingHomeEvents]);

  const homeCalendarDays = useMemo(() => {
    const calendarGridStart = getCalendarGridStart(visibleCalendarMonth);

    return Array.from({ length: 42 }, (_, index) =>
      addDays(calendarGridStart, index),
    );
  }, [visibleCalendarMonth]);

  const selectedHomeDateEvents = useMemo(() => {
    return eventsByDate.get(selectedHomeDateKey) ?? [];
  }, [eventsByDate, selectedHomeDateKey]);

  const bookingsByDate = useMemo(() => {
    const nextMap = new Map<string, HomeBookingItem[]>();

    upcomingMemberBookings.forEach((booking) => {
      const existingBookings = nextMap.get(booking.dateKey);

      if (existingBookings) {
        existingBookings.push(booking);
        return;
      }

      nextMap.set(booking.dateKey, [booking]);
    });

    nextMap.forEach((bookings) => {
      bookings.sort((left, right) => left.slotTime - right.slotTime);
    });

    return nextMap;
  }, [upcomingMemberBookings]);

  const selectedHomeDateBookings = useMemo(() => {
    return bookingsByDate.get(selectedHomeDateKey) ?? [];
  }, [bookingsByDate, selectedHomeDateKey]);

  const selectedHomeDateLabel = useMemo(() => {
    return formatLongDate(selectedHomeDateKey);
  }, [selectedHomeDateKey]);

  const homeEventsThisMonthCount = useMemo(() => {
    const eventIds = new Set<string>();

    homeCalendarDays.forEach((day) => {
      if (day.getMonth() !== visibleCalendarMonth.getMonth()) {
        return;
      }

      const dateKey = formatDateKey(day);

      (eventsByDate.get(dateKey) ?? []).forEach((event) => {
        eventIds.add(event.eventId ?? event.id);
      });
    });

    return eventIds.size;
  }, [eventsByDate, homeCalendarDays, visibleCalendarMonth]);

  const openingTimeEntries = useMemo(() => {
    return getOpeningTimeEntries(data?.opening_times);
  }, [data?.opening_times]);

  const galleryImages = useMemo(() => {
    return getGalleryImages(data?.gallery_images);
  }, [data?.gallery_images]);

  const handleOrderSort = (
    column: "date" | "payment_status" | "fulfillment_status" | "total",
  ) => {
    if (orderSortColumn === column) {
      setOrderSortDirection(orderSortDirection === "asc" ? "desc" : "asc");
    } else {
      setOrderSortColumn(column);
      setOrderSortDirection("asc");
    }
  };

  const filteredOrders = useMemo(() => {
    const query = orderSearch.trim().toLowerCase();

    if (!query) {
      return memberOrderList;
    }

    return memberOrderList.filter((order) => {
      const itemsText = Array.isArray(order.items)
        ? order.items
            .map((item) => {
              return `${String(item.name ?? "")} ${String(item.quantity ?? "")}`;
            })
            .join(" ")
            .toLowerCase()
        : "";

      return [
        order.order_id,
        order.payment_status,
        order.fulfillment_status,
        String(order.total_amount ?? ""),
        String(order.amount_paid ?? ""),
        itemsText,
      ].some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(query),
      );
    });
  }, [memberOrderList, orderSearch]);

  const sortedOrders = useMemo(() => {
    const sorted = [...filteredOrders];

    if (!orderSortColumn) return sorted;

    sorted.sort((a, b) => {
      let aValue: string | number = "";
      let bValue: string | number = "";

      if (orderSortColumn === "date") {
        aValue = a.created_date || 0;
        bValue = b.created_date || 0;
      } else if (orderSortColumn === "payment_status") {
        aValue = a.payment_status || "";
        bValue = b.payment_status || "";
      } else if (orderSortColumn === "fulfillment_status") {
        aValue = a.fulfillment_status || "";
        bValue = b.fulfillment_status || "";
      } else if (orderSortColumn === "total") {
        aValue = a.total_amount || 0;
        bValue = b.total_amount || 0;
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return orderSortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        const leftValue = typeof aValue === "number" ? aValue : 0;
        const rightValue = typeof bValue === "number" ? bValue : 0;

        return orderSortDirection === "asc"
          ? leftValue - rightValue
          : rightValue - leftValue;
      }
    });

    return sorted;
  }, [filteredOrders, orderSortColumn, orderSortDirection]);

  useEffect(() => {
    const fallbackDateKey = nextHomeEvent?.startDate || todayKey;

    setSelectedHomeDateKey((currentValue) => {
      if (currentValue) {
        return currentValue;
      }

      return fallbackDateKey;
    });
  }, [nextHomeEvent?.startDate, todayKey]);

  useEffect(() => {
    if (!selectedHomeDateKey) {
      return;
    }

    const selectedDate = parseDateKey(selectedHomeDateKey);

    setVisibleCalendarMonth((currentMonth) => {
      if (
        currentMonth.getFullYear() === selectedDate.getFullYear() &&
        currentMonth.getMonth() === selectedDate.getMonth()
      ) {
        return currentMonth;
      }

      return getMonthStart(selectedDate);
    });
  }, [selectedHomeDateKey]);

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handlePayHereClick = (paymentOption?: PaymentTransactionOption) => {
    if (paymentOption) {
      setSelectedPaymentOption(paymentOption);
      setPaymentReturnTab(activeTab);
      if (!bankDetailsLoading && bankDetails) {
        setIsPaymentScreenOpen(true);
      } else {
        toast.error("Payment details are still loading. Please wait...");
      }
    } else {
      setPaymentReturnTab(activeTab);
      if (
        bankDetails?.transaction_options &&
        bankDetails.transaction_options.length > 0
      ) {
        if (clubId) {
          navigate(getClubSectionPath(clubId, "bank"));
        }
        return;
      }

      if (!bankDetailsLoading && bankDetails) {
        setIsPaymentScreenOpen(true);
      } else {
        toast.error("Payment details are still loading. Please wait...");
      }
    }
  };

  const handleSectionChange = useCallback(
    (
      value: ClubSection,
      options?: { replace?: boolean; searchParams?: URLSearchParams },
    ) => {
      setActiveTab(value);
      setNewOrderId(null);
      setHighlightedTransactionId(null);
      setHighlightedEventRegistrationId(null);

      if (!clubId) {
        return;
      }

      const nextSearch = options?.searchParams?.toString();

      navigate(
        {
          pathname: getClubSectionPath(clubId, value),
          search: nextSearch ? `?${nextSearch}` : "",
        },
        { replace: options?.replace },
      );

      requestAnimationFrame(() => {
        scrollClubPageToTop();
      });
    },
    [clubId, navigate],
  );

  const handleOrderPayNowClick = (orderId?: string) => {
    if (!orderId) {
      toast.error("This order is missing its payment reference.");
      return;
    }

    if (bankDetailsLoading) {
      toast.error("Payment details are still loading. Please wait...");
      return;
    }

    const matchedPayment = bankDetails?.transaction_options?.find(
      (payment: PaymentTransactionOption) => payment.order_id === orderId,
    );

    if (!matchedPayment) {
      toast.error("No payment option was found for this order.");
      return;
    }

    handlePayHereClick(matchedPayment);
  };

  const handleEventRegistrationPayNowClick = (eventRegistrationId?: string) => {
    if (!eventRegistrationId) {
      toast.error("This registration is missing its payment reference.");
      return;
    }

    if (bankDetailsLoading) {
      toast.error("Payment details are still loading. Please wait...");
      return;
    }

    const matchedPayment = bankDetails?.transaction_options?.find(
      (payment: PaymentTransactionOption) =>
        payment.event_registration_id === eventRegistrationId,
    );

    if (!matchedPayment) {
      toast.error("No payment option was found for this registration.");
      return;
    }

    handlePayHereClick(matchedPayment);
  };

  const handleViewPaymentTarget = (paymentOption: PaymentTransactionOption) => {
    if (paymentOption.order_id) {
      setEventRegistrationSearch("");
      setOrderSearch(paymentOption.order_id);
      handleSectionChange("shop");
      return;
    }

    if (paymentOption.event_registration_id) {
      setOrderSearch("");
      setEventRegistrationSearch(paymentOption.event_registration_id);
      handleSectionChange("events");
    }
  };

  const handleOpenOutstandingBalance = () => {
    handleSectionChange("bank");
    setScrollToOutstandingTrigger((current) => current + 1);
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSaveReference = async () => {
    setSavingReference(true);
    try {
      await updatePaymentReferenceService(
        data?.club_account_id ?? "",
        newReference,
      );
      // Update the local bankDetails state
      if (bankDetails) {
        bankDetails.registration_payment_reference = newReference;
      }
      setEditingReference(false);
      toast.success("Payment reference updated successfully");
    } catch (error) {
      console.error("Failed to update payment reference:", error);
      toast.error("Failed to update payment reference");
      // Reset to original value on error
      setNewReference(bankDetails?.registration_payment_reference || "");
    } finally {
      setSavingReference(false);
    }
  };

  const handleCancelEdit = () => {
    setNewReference(bankDetails?.registration_payment_reference || "");
    setEditingReference(false);
  };

  const [coverImage, setCoverImage] = useState("");
  const [profileImage, setProfileImage] = useState("");

  useEffect(() => {
    const getImg = async () => {
      try {
        setCoverImage(data?.club_cover_url ?? "");
        setProfileImage(data?.club_profile_url ?? "");
      } catch (error) {
        console.error("Failed to fetch images", error);
      }
    };

    if (data?.country_of_operation) {
      const upperCountryCode = data.country_of_operation.toUpperCase();
      setCountryName(countryMap[upperCountryCode] ?? upperCountryCode);
    }

    if (data) {
      getImg();
    }
  }, [data]);

  useEffect(() => {
    setNewReference(bankDetails?.registration_payment_reference || "");
  }, [bankDetails?.registration_payment_reference]);

  useEffect(() => {
    if (!isPaymentScreenOpen) {
      setSelectedPaymentMethod(null);
    }
  }, [isPaymentScreenOpen]);

  useEffect(() => {
    if (
      !data?.club_account_id ||
      !canViewBookings ||
      (activeTab !== "bookings" && activeTab !== "home")
    ) {
      return;
    }

    const fetchVenues = async () => {
      try {
        setVenuesLoading(true);
        setVenuesError(null);
        const venuesData = (await getVenues(data.club_account_id)) as {
          venues?: Venue[];
        };
        setVenues(Array.isArray(venuesData.venues) ? venuesData.venues : []);
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to load venues";
        setVenuesError(errorMsg);
        console.error("Error fetching venues:", err, errorMsg);
      } finally {
        setVenuesLoading(false);
      }
    };

    fetchVenues();
  }, [activeTab, canViewBookings, data?.club_account_id]);

  useEffect(() => {
    if (activeTab === "bookings" && !canViewBookings) {
      handleSectionChange("home", { replace: true });
    }
  }, [activeTab, canViewBookings, handleSectionChange]);

  const clubNavItems = useMemo<ClubNavItem[]>(() => {
    const items: ClubNavItem[] = [
      {
        key: "home",
        label: "Home",
        icon: Home,
      },
    ];

    if (data?.club_member_exists || data?.resubmission_required) {
      items.push(
        {
          key: "bank",
          label: "Payments",
          icon: CreditCard,
        },
        {
          key: "member-registration",
          label: "Registration",
          icon: FileText,
        },
      );
    }

    if (canViewBookings) {
      items.push({
        key: "bookings",
        label: "Bookings",
        icon: Calendar,
      });
    }

    if (canViewEvents) {
      items.push({
        key: "events",
        label: "Events",
        icon: CalendarDays,
      });
    }

    if (
      !data?.resubmission_required &&
      data?.enable_shop &&
      (data?.club_member_exists || data?.resubmission_required) &&
      data?.registered
    ) {
      items.push({
        key: "shop",
        label: "Shop",
        icon: ShoppingBag,
      });
    }

    items.push({
      key: "storage",
      label: "Storage",
      icon: BoxIcon,
    });

    return items;
  }, [
    canViewBookings,
    canViewEvents,
    data?.club_member_exists,
    data?.enable_shop,
    data?.registered,
    data?.resubmission_required,
  ]);

  const showSidebarNavigation = Boolean(data?.club_member_exists);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (
    isPaymentScreenOpen &&
    !isError &&
    data?.onboarded &&
    data?.deregistration_in_progress !== true
  ) {
    return (
      <Pager>
        <PaymentOptionsScreen
          bankDetails={bankDetails}
          bankDetailsLoading={bankDetailsLoading}
          clubAccountId={data?.club_account_id ?? ""}
          currency={data?.currency}
          supportEmail={data?.support_email}
          payfastEnabled={data?.payfast_enabled}
          selectedPaymentOption={selectedPaymentOption}
          selectedPaymentMethod={selectedPaymentMethod}
          onSelectedPaymentMethodChange={setSelectedPaymentMethod}
          customPaymentMethods={data?.custom_payment_methods}
          copiedField={copiedField}
          onCopyToClipboard={copyToClipboard}
          onBack={() => {
            setIsPaymentScreenOpen(false);
            handleSectionChange(paymentReturnTab as ClubSection);
          }}
        />
      </Pager>
    );
  }

  return (
    <Pager>
      {isError && <p> Something went wrong... </p>}
      {!isLoading && data && !data?.onboarded && (
        <div className="mt-10 flex items-start justify-center min-h-screen">
          <div className="text-center px-4">
            <Label className="w-[700px]">
              The club administrator has not yet completed setting up the club
              account for member registration. For urgent enquiries, please
              contact: {data?.support_email}.
            </Label>
          </div>
        </div>
      )}
      {!isLoading && data && data?.deregistration_in_progress === true && (
        <div className="mt-10 flex items-start justify-center min-h-screen">
          <div className="text-center px-4">
            <div className="text-center space-y-4">
              <Label className="w-[700px]">
                This club is currently undergoing deregistration and cannot
                accept new members or process member interactions at this time.
                Please check back once the deregistration process is complete.
              </Label>
            </div>
          </div>
        </div>
      )}
      {!isLoading &&
        !isError &&
        data?.onboarded &&
        data?.deregistration_in_progress !== true && (
          <div
            className={cn(
              "min-h-screen bg-background",
              showSidebarNavigation && "lg:pl-72",
            )}
          >
            {showSidebarNavigation && (
              <aside className="hidden lg:fixed lg:inset-y-auto lg:left-0 lg:top-16 lg:z-20 lg:block lg:h-[calc(100vh-4rem)] lg:w-72">
                <div className="flex h-full flex-col border-r border-slate-200/80 bg-white shadow-[18px_0_70px_-42px_rgba(15,23,42,0.22)] backdrop-blur-xl">
                  <div className="border-b border-slate-200/80 bg-white px-6 py-6 text-slate-900">
                    <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-600/80">
                      Club Navigation
                    </p>
                    <h2 className="mt-2 text-xl font-semibold">Sections</h2>
                  </div>

                  <div className="flex-1 space-y-2 overflow-y-auto px-3 py-4">
                    {clubNavItems.map((item) => {
                      const Icon = item.icon;
                      const isActiveSection = activeTab === item.key;

                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => handleSectionChange(item.key)}
                          className={cn(
                            "group relative flex w-full items-center gap-3 overflow-hidden rounded-[1.35rem] border px-4 py-3 text-left transition-all duration-200",
                            isActiveSection
                              ? "border-slate-300/90 bg-white text-slate-950 shadow-[0_18px_40px_-26px_rgba(15,23,42,0.24)]"
                              : "border-transparent bg-white/65 text-slate-700 hover:border-slate-200 hover:bg-white/92 hover:shadow-[0_14px_30px_-26px_rgba(15,23,42,0.24)]",
                          )}
                        >
                          <span
                            className={cn(
                              "absolute inset-y-3 left-0 w-1 rounded-r-full transition-colors duration-200",
                              isActiveSection
                                ? "bg-slate-800"
                                : "bg-transparent group-hover:bg-slate-300",
                            )}
                          />
                          <div
                            className={cn(
                              "rounded-[1rem] p-2.5 transition-colors duration-200",
                              isActiveSection
                                ? "bg-white text-slate-800 ring-1 ring-slate-200 shadow-[0_12px_24px_-18px_rgba(15,23,42,0.35)]"
                                : "bg-slate-100/90 text-slate-700 group-hover:bg-slate-100",
                            )}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold tracking-[0.01em]">
                              {item.label}
                            </p>
                          </div>
                          <div
                            className={cn(
                              "h-2.5 w-2.5 rounded-full transition-all duration-200",
                              isActiveSection
                                ? "bg-slate-900 shadow-[0_0_0_5px_rgba(15,23,42,0.08)]"
                                : "bg-slate-200 group-hover:bg-slate-400",
                            )}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </aside>
            )}

            {/* Section Navigation */}
            <div className="container mx-auto mb-6 px-4">
              {showSidebarNavigation && (
                <div className="sticky top-16 z-20 -mx-4 mb-4 border-y border-slate-200 bg-white/95 px-4 py-2 shadow-[0_18px_45px_-30px_rgba(15,23,42,0.18)] backdrop-blur sm:mb-6 sm:py-3 lg:hidden">
                  <div className="scrollbar-none -mb-1 flex gap-1.5 overflow-x-auto pb-1 sm:gap-2">
                    {clubNavItems.map((item) => {
                      const Icon = item.icon;
                      const isActiveSection = activeTab === item.key;

                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => handleSectionChange(item.key)}
                          className={cn(
                            "group relative flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all duration-200 sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm",
                            isActiveSection
                              ? "border-slate-900 bg-slate-900 text-white shadow-[0_16px_30px_-20px_rgba(15,23,42,0.35)]"
                              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
                          )}
                        >
                          <div
                            className={cn(
                              "rounded-full p-1 transition-colors duration-200 sm:p-1.5",
                              isActiveSection
                                ? "bg-white/15 text-white"
                                : "bg-slate-100 text-slate-700 group-hover:bg-slate-200",
                            )}
                          >
                            <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </div>
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <Tabs value={activeTab}>
                  <ClubRegistrationTab
                    membershipStatus={
                      data.resubmission_required
                        ? "Resubmission required"
                        : data.registered
                          ? "Registered"
                          : "Pending"
                    }
                    clubName={data.club_name}
                    currency={data.currency}
                    clubAccountId={data.club_account_id}
                  />
                  <ClubShopTab
                    enabled={Boolean(data?.enable_shop)}
                    currency={data.currency}
                    orderSearch={orderSearch}
                    setOrderSearch={setOrderSearch}
                    orderSortColumn={orderSortColumn}
                    orderSortDirection={orderSortDirection}
                    onOrderSort={handleOrderSort}
                    isOrdersLoading={isOrdersLoading}
                    ordersError={ordersError}
                    memberOrderList={memberOrderList}
                    sortedOrders={sortedOrders}
                    expandedRows={expandedRows}
                    onToggleRow={toggleRow}
                    onOpenStore={() => navigate(`/myclubs/${clubId}/store`)}
                    onOrderPayNow={handleOrderPayNowClick}
                    getOrderPaymentBadgeClassName={
                      getOrderPaymentBadgeClassName
                    }
                    getOrderFulfillmentBadgeClassName={
                      getOrderFulfillmentBadgeClassName
                    }
                    getRefundedAmount={getRefundedAmount}
                  />
                  <ClubBookingsTab
                    canViewBookings={canViewBookings}
                    venues={venues}
                    loading={venuesLoading}
                    error={venuesError}
                    memberName={data?.member_name || ""}
                  />
                  <ClubEventsTab
                    canViewEvents={canViewEvents}
                    clubId={clubId || ""}
                    clubAccountId={data?.club_account_id || ""}
                    currency={data?.currency}
                    registrationSearchQuery={eventRegistrationSearch}
                    onPayRegistration={handleEventRegistrationPayNowClick}
                  />
                  <ClubHomeTab
                    clubName={data?.club_name || "Club"}
                    clubType={data?.club_type}
                    description={data?.description}
                    aboutClub={data?.about_club}
                    supportEmail={data?.support_email}
                    countryName={countryName}
                    joinedLabel={
                      data?.joined
                        ? epochToJoinedString(data.joined)
                        : "Not provided"
                    }
                    isMember={data?.club_member_exists}
                    isRegistered={data?.registered}
                    resubmissionRequired={data?.resubmission_required}
                    primaryActionLabel={
                      data?.resubmission_required
                        ? "Re-registration Required"
                        : !data?.club_member_exists
                          ? "Join Club"
                          : undefined
                    }
                    primaryActionVariant={
                      data?.resubmission_required ? "destructive" : "default"
                    }
                    onPrimaryAction={
                      data?.resubmission_required
                        ? () => navigate(`/clubs/${clubId}/register`)
                        : !data?.club_member_exists
                          ? () =>
                              navigate(
                                isLoggedIn
                                  ? `/clubs/${clubId}/register`
                                  : `/clubs/${clubId}/public/register`,
                              )
                          : undefined
                    }
                    outstandingBalanceAmount={bankDetails?.outstanding_amount}
                    coverImage={coverImage}
                    profileImage={profileImage}
                    clubUrl={data?.club_url}
                    facebook={data?.facebook}
                    instagram={data?.instagram}
                    twitter={data?.twitter}
                    openingTimeEntries={openingTimeEntries}
                    galleryImages={galleryImages}
                    selectedGalleryImageIndex={selectedGalleryImageIndex}
                    setSelectedGalleryImageIndex={setSelectedGalleryImageIndex}
                    enableEvents={data?.enable_events}
                    isHomeEventsLoading={isHomeEventsLoading}
                    isHomeEventsError={isHomeEventsError}
                    homeEventsThisMonthCount={homeEventsThisMonthCount}
                    homeBookingsNextSevenDaysCount={
                      upcomingMemberBookings.length
                    }
                    selectedHomeDateEvents={selectedHomeDateEvents}
                    selectedHomeDateBookings={selectedHomeDateBookings}
                    selectedHomeDateLabel={selectedHomeDateLabel}
                    nextHomeEvent={nextHomeEvent}
                    canViewEvents={canViewEvents}
                    canViewBookings={canViewBookings}
                    currency={data?.currency}
                    visibleCalendarMonth={visibleCalendarMonth}
                    homeCalendarDays={homeCalendarDays}
                    eventsByDate={eventsByDate}
                    bookingsByDate={bookingsByDate}
                    selectedHomeDateKey={selectedHomeDateKey}
                    todayKey={todayKey}
                    onPreviousMonth={() =>
                      setVisibleCalendarMonth((currentMonth) =>
                        shiftMonth(currentMonth, -1),
                      )
                    }
                    onToday={() => {
                      setSelectedHomeDateKey(todayKey);
                      setVisibleCalendarMonth(
                        getMonthStart(parseDateKey(todayKey)),
                      );
                    }}
                    onNextMonth={() =>
                      setVisibleCalendarMonth((currentMonth) =>
                        shiftMonth(currentMonth, 1),
                      )
                    }
                    onSelectDate={setSelectedHomeDateKey}
                    onOpenEvents={() => handleSectionChange("events")}
                    onOpenBookings={() => handleSectionChange("bookings")}
                    onOpenOutstandingBalance={handleOpenOutstandingBalance}
                  />
                  <TabsContent value="storage" className="mt-3 sm:mt-6">
                    <MemberStorage
                      clubId={data?.club_account_id as string}
                      currency={data?.currency}
                      onSelectUnit={setSelectedStorageItem}
                    />
                  </TabsContent>
                  {data?.club_member_exists && (
                    <ClubPaymentsTab
                      data={data}
                      bankDetails={bankDetails}
                      clubAccountId={data?.club_account_id ?? ""}
                      userId={data?.user_id ?? ""}
                      isActive={activeTab === "bank"}
                      scrollToOutstandingTrigger={scrollToOutstandingTrigger}
                      highlightedOrderId={newOrderId}
                      highlightedTransactionId={highlightedTransactionId}
                      highlightedEventRegistrationId={
                        highlightedEventRegistrationId
                      }
                      expandedRows={expandedRows}
                      editingReference={editingReference}
                      newReference={newReference}
                      savingReference={savingReference}
                      toggleRow={toggleRow}
                      setEditingReference={setEditingReference}
                      setNewReference={setNewReference}
                      handleSaveReference={handleSaveReference}
                      handleCancelEdit={handleCancelEdit}
                      handlePayHereClick={handlePayHereClick}
                      onViewPaymentTarget={handleViewPaymentTarget}
                    />
                  )}
                </Tabs>
              </div>
            </div>
          </div>
        )}

      {/* Gallery Image Dialog */}
      <Dialog
        open={selectedGalleryImageIndex !== null}
        onOpenChange={(open) => !open && setSelectedGalleryImageIndex(null)}
      >
        <DialogContent className="max-w-4xl max-h-screen flex items-center justify-center p-0 bg-black/90 border-0">
          {selectedGalleryImageIndex !== null &&
            galleryImages[selectedGalleryImageIndex] && (
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  src={galleryImages[selectedGalleryImageIndex].url}
                  alt="Gallery"
                  className="w-full h-full object-contain"
                />

                {galleryImages.length > 1 && (
                  <>
                    <button
                      onClick={() =>
                        setSelectedGalleryImageIndex(
                          selectedGalleryImageIndex === 0
                            ? galleryImages.length - 1
                            : selectedGalleryImageIndex - 1,
                        )
                      }
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 hover:bg-white/40 transition-colors"
                      aria-label="Previous image"
                    >
                      <ArrowLeft className="w-6 h-6 text-white" />
                    </button>

                    <button
                      onClick={() =>
                        setSelectedGalleryImageIndex(
                          selectedGalleryImageIndex === galleryImages.length - 1
                            ? 0
                            : selectedGalleryImageIndex + 1,
                        )
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 hover:bg-white/40 transition-colors"
                      aria-label="Next image"
                    >
                      <ArrowRight className="w-6 h-6 text-white" />
                    </button>

                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 px-3 py-1 rounded-full">
                      <p className="text-white text-sm">
                        {selectedGalleryImageIndex + 1} / {galleryImages.length}
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
        </DialogContent>
      </Dialog>

      <StorageRequestDialog
        clubAccountId={data?.club_account_id ?? ""}
        selectedStorageItem={selectedStorageItem}
        setSelectedStorageItem={setSelectedStorageItem}
      />
    </Pager>
  );
}
