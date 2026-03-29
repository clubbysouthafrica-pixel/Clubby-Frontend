import { Fragment, useContext, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Copy,
  CreditCard,
  Filter,
  Loader2,
  Ticket,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ClubContext, ClubContextType } from "@/context/ClubContext";
import { formatAmount } from "@/data/currencies";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  confirmEventPayment,
  getEventRegistration,
  getEventRegistrations,
} from "@/services/admin-features/events";
import { toast } from "sonner";

type RegistrationStatus = "Submitted" | "Confirmed" | "Waitlisted";
type PaymentStatus = "Paid" | "Awaiting payment" | "Partially paid";

type RegistrationAnswer = {
  fieldId: string;
  label: string;
  value: string;
};

type RegistrationPricingOption = {
  id: string;
  label: string;
  amount: number | null;
};

type RegistrationPricingType =
  | "FREE"
  | "SINGLE"
  | "MULTIPLE"
  | "ADDITIONAL"
  | "UNKNOWN";

type EventRegistration = {
  id: string;
  userId: string;
  memberFirstName: string;
  memberSurname: string;
  memberName: string;
  memberDetail: string;
  eventId: string;
  eventTitle: string;
  eventDateLabel: string;
  submittedAt: string;
  amountDue: number;
  amountPaid: number;
  paymentStatus: PaymentStatus;
  registrationStatus: RegistrationStatus;
  ticketLabel: string;
  transactionId: string;
  selectedPricingOptionIds: string[];
  pricingType: RegistrationPricingType;
  pricingFieldName: string;
  pricingOptions: RegistrationPricingOption[];
  teamName?: string;
  notes?: string;
  answers: RegistrationAnswer[];
};

type ApiEventRegistrationField = {
  field_id?: string;
  field_label?: string;
  value?: unknown;
};

type ApiChosenEventPricingOption = {
  id?: string;
  label?: string;
  option_label?: string;
  name?: string;
  amount?: number | string;
};

type ApiChosenEventPricing = {
  type?: string;
  field_name?: string;
  fieldName?: string;
  options?: ApiChosenEventPricingOption[];
};

type ApiChosenEventFormField = {
  id?: string;
  label?: string;
  inputType?: string;
  options?: string[];
};

type ApiChosenEvent = {
  event_id?: string;
  title?: string;
  formFields?: ApiChosenEventFormField[];
  pricing?: ApiChosenEventPricing;
};

type ApiEventRegistration = {
  amount_paid?: number;
  entry_fee_amount?: number;
  submitted_on?: number;
  pricing_type?: string;
  user_id?: string;
  member_first_name?: string;
  member_surname?: string;
  selected_pricing_option_ids?: string[];
  event_id?: string;
  registration_fields?: ApiEventRegistrationField[];
  transaction_id?: string;
  event_registration_id?: string;
  payment_status?: string;
  status?: string;
  chosen_event?: ApiChosenEvent;
};

type ApiEventFilter = {
  event_id?: string;
  event_name?: string;
};

type EventRegistrationsPayload = {
  event_registrations?: ApiEventRegistration[];
  eventsFilters?: ApiEventFilter[];
  chosen_event?: ApiChosenEvent;
};

type EventRegistrationDetailPayload = {
  registration_fields?: ApiEventRegistrationField[];
  selected_pricing_option_ids?: string[];
};

type EventRegistrationFilterField = {
  id: string;
  label: string;
  inputType: "TEXT" | "DROPDOWN" | "CHECKBOX";
  options: string[];
};

function formatSubmittedDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getShortId(value: string) {
  return `${value.slice(0, 10)}...`;
}

function getShortUserId(value: string) {
  return value.length > 10 ? `${value.slice(0, 10)}...` : value;
}

function getPaymentBadgeClassName(status: PaymentStatus) {
  if (status === "Paid") {
    return "bg-green-100 text-green-800 border-green-200";
  }

  if (status === "Partially paid") {
    return "bg-amber-100 text-amber-800 border-amber-200";
  }

  return "bg-red-100 text-red-800 border-red-200";
}

function getRegistrationBadgeClassName(status: RegistrationStatus) {
  if (status === "Confirmed") {
    return "bg-green-100 text-green-800 border-green-200";
  }

  if (status === "Waitlisted") {
    return "bg-purple-100 text-purple-800 border-purple-200";
  }

  return "bg-slate-100 text-slate-700 border-slate-200";
}

function formatFieldValue(value: unknown) {
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (value === null || value === undefined || value === "") {
    return "No response";
  }

  return String(value);
}

function getPricingAmount(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const normalizedValue = Number(value);

    if (Number.isFinite(normalizedValue)) {
      return normalizedValue;
    }
  }

  return null;
}

function normalizePaymentStatus(
  registration: ApiEventRegistration,
): PaymentStatus {
  const rawStatus = String(registration.payment_status || "").toUpperCase();
  const pricingType = String(registration.pricing_type || "").toUpperCase();
  const amountPaid = Number(registration.amount_paid || 0);
  const amountDue = Number(registration.entry_fee_amount || 0);

  if (pricingType === "FREE" || amountDue <= 0) {
    return "Paid";
  }

  if (rawStatus === "PAID" || (amountDue > 0 && amountPaid >= amountDue)) {
    return "Paid";
  }

  if (amountPaid > 0) {
    return "Partially paid";
  }

  return "Awaiting payment";
}

function normalizeRegistrationStatus(
  registration: ApiEventRegistration,
  paymentStatus: PaymentStatus,
): RegistrationStatus {
  const rawStatus = String(registration.status || "").toUpperCase();

  if (rawStatus === "WAITLISTED" || rawStatus === "WAITLIST") {
    return "Waitlisted";
  }

  if (rawStatus === "CONFIRMED" || paymentStatus === "Paid") {
    return "Confirmed";
  }

  return "Submitted";
}

function buildTicketLabel(registration: ApiEventRegistration) {
  const pricingType = String(
    registration.pricing_type || "Entry",
  ).toLowerCase();
  const selectedOptions = Array.isArray(
    registration.selected_pricing_option_ids,
  )
    ? registration.selected_pricing_option_ids.length
    : 0;

  const typeLabel = pricingType
    ? `${pricingType.charAt(0).toUpperCase()}${pricingType.slice(1)}`
    : "Entry";

  return selectedOptions > 1
    ? `${typeLabel} (${selectedOptions} selections)`
    : typeLabel;
}

function normalizePricingType(value: unknown): RegistrationPricingType {
  const pricingType = String(value || "").toUpperCase();

  if (
    pricingType === "FREE" ||
    pricingType === "SINGLE" ||
    pricingType === "MULTIPLE" ||
    pricingType === "ADDITIONAL"
  ) {
    return pricingType;
  }

  return "UNKNOWN";
}

function getPricingMetadata(
  registration: ApiEventRegistration,
  chosenEvent?: ApiChosenEvent,
) {
  const chosenEventId = String(chosenEvent?.event_id || "").trim();
  const registrationEventId = String(registration.event_id || "").trim();
  const pricing =
    chosenEvent && (!chosenEventId || chosenEventId === registrationEventId)
      ? chosenEvent.pricing
      : registration.chosen_event?.pricing;

  return {
    pricingType: normalizePricingType(
      pricing?.type || registration.pricing_type,
    ),
    pricingFieldName:
      String(pricing?.field_name || pricing?.fieldName || "").trim() ||
      "Pricing selection",
    pricingOptions: Array.isArray(pricing?.options)
      ? pricing.options
          .map((option) => {
            const id = String(option.id || "").trim();

            if (!id) {
              return null;
            }

            return {
              id,
              label:
                String(
                  option.label || option.option_label || option.name || id,
                ).trim() || id,
              amount: getPricingAmount(option.amount),
            } satisfies RegistrationPricingOption;
          })
          .filter((option): option is RegistrationPricingOption =>
            Boolean(option),
          )
      : [],
  };
}

function getMemberName(fields: ApiEventRegistrationField[]) {
  const fullNameField = fields.find((field) =>
    String(field.field_label || "")
      .toLowerCase()
      .includes("full name"),
  );

  if (fullNameField?.value) {
    return formatFieldValue(fullNameField.value);
  }

  return "Unknown member";
}

function getDisplayName(
  registration: ApiEventRegistration,
  fields: ApiEventRegistrationField[],
) {
  const firstName = String(registration.member_first_name || "").trim();
  const surname = String(registration.member_surname || "").trim();
  const combinedName = `${firstName} ${surname}`.trim();

  if (combinedName) {
    return {
      memberFirstName: firstName || "Unknown",
      memberSurname: surname || "",
      memberName: combinedName,
    };
  }

  const fallbackName = getMemberName(fields);
  const [fallbackFirstName = "Unknown", ...fallbackSurnameParts] =
    fallbackName.split(" ");

  return {
    memberFirstName: fallbackFirstName,
    memberSurname: fallbackSurnameParts.join(" "),
    memberName: fallbackName,
  };
}

function normalizeRegistrations(
  payload?: EventRegistrationsPayload,
): EventRegistration[] {
  const eventNameMap = new Map<string, string>();
  const chosenEvent = payload?.chosen_event;

  (payload?.eventsFilters || []).forEach((eventFilter) => {
    if (eventFilter.event_id) {
      eventNameMap.set(
        eventFilter.event_id,
        eventFilter.event_name || "Event registration",
      );
    }
  });

  return (payload?.event_registrations || [])
    .map((registration) => {
      const fields = Array.isArray(registration.registration_fields)
        ? registration.registration_fields
        : [];
      const displayName = getDisplayName(registration, fields);
      const paymentStatus = normalizePaymentStatus(registration);
      const registrationStatus = normalizeRegistrationStatus(
        registration,
        paymentStatus,
      );
      const eventId = registration.event_id || "unknown-event";
      const submittedAt = Number(registration.submitted_on || 0);
      const eventRegistrationId =
        registration.event_registration_id || `${submittedAt}`;
      const userId = registration.user_id || "Unknown user";
      const pricingMetadata = getPricingMetadata(registration, chosenEvent);

      return {
        id: eventRegistrationId,
        userId,
        memberFirstName: displayName.memberFirstName,
        memberSurname: displayName.memberSurname,
        memberName: displayName.memberName,
        memberDetail: `User ID: ${userId}`,
        eventId,
        eventTitle: eventNameMap.get(eventId) || "Event registration",
        eventDateLabel: "Date unavailable",
        submittedAt: new Date(submittedAt || Date.now()).toISOString(),
        amountDue: Number(registration.entry_fee_amount || 0),
        amountPaid: Number(registration.amount_paid || 0),
        paymentStatus,
        registrationStatus,
        ticketLabel: buildTicketLabel(registration),
        transactionId: registration.transaction_id || "N/A",
        selectedPricingOptionIds: Array.isArray(
          registration.selected_pricing_option_ids,
        )
          ? registration.selected_pricing_option_ids.filter(
              (optionId): optionId is string =>
                typeof optionId === "string" && optionId.trim().length > 0,
            )
          : [],
        pricingType: pricingMetadata.pricingType,
        pricingFieldName: pricingMetadata.pricingFieldName,
        pricingOptions: pricingMetadata.pricingOptions,
        answers: fields.map((field) => ({
          fieldId: field.field_id || field.field_label || "",
          label: field.field_label || "Field",
          value: formatFieldValue(field.value),
        })),
      } satisfies EventRegistration;
    })
    .sort(
      (left, right) =>
        new Date(right.submittedAt).getTime() -
        new Date(left.submittedAt).getTime(),
    );
}

function getDetailPayload(response: unknown): EventRegistrationDetailPayload {
  if (!response || typeof response !== "object") {
    return {};
  }

  const record = response as Record<string, unknown>;

  if (Array.isArray(record.registration_fields)) {
    return {
      registration_fields:
        record.registration_fields as ApiEventRegistrationField[],
      selected_pricing_option_ids: Array.isArray(
        record.selected_pricing_option_ids,
      )
        ? (record.selected_pricing_option_ids as string[])
        : [],
    };
  }

  if (
    record.data &&
    typeof record.data === "object" &&
    !Array.isArray(record.data)
  ) {
    const nestedRecord = record.data as Record<string, unknown>;

    return {
      registration_fields: Array.isArray(nestedRecord.registration_fields)
        ? (nestedRecord.registration_fields as ApiEventRegistrationField[])
        : [],
      selected_pricing_option_ids: Array.isArray(
        nestedRecord.selected_pricing_option_ids,
      )
        ? (nestedRecord.selected_pricing_option_ids as string[])
        : [],
    };
  }

  return {};
}

function formatPricingOptionLabel(
  option: RegistrationPricingOption | undefined,
  optionId: string,
  currency: string,
) {
  if (!option) {
    return optionId;
  }

  if (typeof option.amount === "number") {
    return `${option.label} (${formatAmount(option.amount, currency)})`;
  }

  return option.label;
}

export default function EventRegistrationsPage() {
  const { club } = useContext(ClubContext) as ClubContextType;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [selectedPaymentStatus, setSelectedPaymentStatus] =
    useState<string>("all");
  const [fieldFilters, setFieldFilters] = useState<Record<string, string>>({});
  const [selectedPricingFilter, setSelectedPricingFilter] =
    useState<string>("all");
  const [expandedRegistrationId, setExpandedRegistrationId] = useState<
    string | null
  >(null);
  const [copiedRegistrationId, setCopiedRegistrationId] = useState<
    string | null
  >(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedRegistrationForPayment, setSelectedRegistrationForPayment] =
    useState<EventRegistration | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);

  const {
    data: registrationsResponse,
    isLoading,
    isFetching,
    isError,
  } = useQuery({
    queryKey: [
      "admin-event-registrations",
      club?.club_account_id,
      selectedEvent,
    ],
    queryFn: () =>
      getEventRegistrations(
        club?.club_account_id || "",
        selectedEvent || undefined,
      ),
    enabled: !!club?.club_account_id,
    placeholderData: (previousData) => previousData,
  });

  const registrations = useMemo(
    () =>
      normalizeRegistrations(
        registrationsResponse as EventRegistrationsPayload | undefined,
      ),
    [registrationsResponse],
  );

  const chosenEventId = useMemo(() => {
    const payload = registrationsResponse as
      | EventRegistrationsPayload
      | undefined;
    return payload?.chosen_event?.event_id?.trim() || "";
  }, [registrationsResponse]);

  const selectedEventTitle = useMemo(() => {
    const payload = registrationsResponse as
      | EventRegistrationsPayload
      | undefined;
    const chosenEvent = payload?.chosen_event;

    if (selectedEvent) {
      const matchedEvent = payload?.eventsFilters?.find(
        (eventFilter) => eventFilter.event_id === selectedEvent,
      );

      if (matchedEvent?.event_name) {
        return matchedEvent.event_name;
      }

      const matchedRegistration = registrations.find(
        (registration) => registration.eventId === selectedEvent,
      );

      return matchedRegistration?.eventTitle || "Selected event";
    }

    if (chosenEvent?.title?.trim()) {
      return chosenEvent.title.trim();
    }

    const chosenEventId = chosenEvent?.event_id?.trim();
    if (!chosenEventId) {
      return "No event selected";
    }

    const matchedEvent = payload?.eventsFilters?.find(
      (eventFilter) => eventFilter.event_id === chosenEventId,
    );

    return matchedEvent?.event_name || "Selected event";
  }, [registrations, registrationsResponse, selectedEvent]);

  const expandedRegistration = useMemo(
    () =>
      registrations.find(
        (registration) => registration.id === expandedRegistrationId,
      ) ?? null,
    [expandedRegistrationId, registrations],
  );

  const {
    data: registrationDetailResponse,
    isLoading: isRegistrationDetailLoading,
    isError: isRegistrationDetailError,
  } = useQuery({
    queryKey: [
      "admin-event-registration",
      club?.club_account_id,
      expandedRegistration?.eventId,
      expandedRegistrationId,
    ],
    queryFn: () =>
      getEventRegistration(
        club?.club_account_id || "",
        expandedRegistration?.eventId || "",
        expandedRegistrationId || "",
      ),
    enabled:
      !!club?.club_account_id &&
      !!expandedRegistrationId &&
      !!expandedRegistration?.eventId,
  });

  const registrationDetail = useMemo(
    () => getDetailPayload(registrationDetailResponse),
    [registrationDetailResponse],
  );

  const expandedPricingSelections = useMemo(() => {
    if (!expandedRegistration) {
      return [];
    }

    if (
      expandedRegistration.pricingType !== "MULTIPLE" &&
      expandedRegistration.pricingType !== "ADDITIONAL"
    ) {
      return [];
    }

    const selectedOptionIds = registrationDetail.selected_pricing_option_ids
      ?.length
      ? registrationDetail.selected_pricing_option_ids
      : expandedRegistration.selectedPricingOptionIds;

    return selectedOptionIds.map((optionId) => ({
      id: optionId,
      label: formatPricingOptionLabel(
        expandedRegistration.pricingOptions.find(
          (option) => option.id === optionId,
        ),
        optionId,
        club?.currency || "ZAR",
      ),
    }));
  }, [
    club?.currency,
    expandedRegistration,
    registrationDetail.selected_pricing_option_ids,
  ]);

  const eventOptions = useMemo(() => {
    const responsePayload = registrationsResponse as
      | EventRegistrationsPayload
      | undefined;
    const directOptions = Array.isArray(responsePayload?.eventsFilters)
      ? responsePayload.eventsFilters
          .filter((eventFilter): eventFilter is Required<ApiEventFilter> =>
            Boolean(eventFilter.event_id && eventFilter.event_name),
          )
          .map((eventFilter) => ({
            value: eventFilter.event_id,
            label: eventFilter.event_name,
          }))
      : [];

    if (directOptions.length > 0) {
      return directOptions;
    }

    const uniqueEvents = new Map<string, string>();

    registrations.forEach((registration) => {
      uniqueEvents.set(registration.eventId, registration.eventTitle);
    });

    return Array.from(uniqueEvents.entries()).map(([value, label]) => ({
      value,
      label,
    }));
  }, [registrations, registrationsResponse]);

  const registrationFilterFields = useMemo(() => {
    const payload = registrationsResponse as
      | EventRegistrationsPayload
      | undefined;

    return (payload?.chosen_event?.formFields || []).reduce<
      EventRegistrationFilterField[]
    >((filters, field) => {
      const id = String(field.id || "").trim();
      const label = String(field.label || "").trim();
      const inputType = String(field.inputType || "").toUpperCase();

      if (!id || !label) {
        return filters;
      }

      if (inputType === "TEXT") {
        filters.push({
          id,
          label,
          inputType: "TEXT",
          options: [],
        });

        return filters;
      }

      if (inputType === "DROPDOWN") {
        filters.push({
          id,
          label,
          inputType: "DROPDOWN",
          options: Array.isArray(field.options)
            ? field.options.filter(
                (option): option is string =>
                  typeof option === "string" && option.trim().length > 0,
              )
            : [],
        });

        return filters;
      }

      if (inputType === "CHECKBOX") {
        filters.push({
          id,
          label,
          inputType: "CHECKBOX",
          options: ["Yes", "No"],
        });

        return filters;
      }

      return filters;
    }, []);
  }, [registrationsResponse]);

  const pricingFilterOptions = useMemo(() => {
    const payload = registrationsResponse as
      | EventRegistrationsPayload
      | undefined;
    const pricing = payload?.chosen_event?.pricing;
    const pricingType = normalizePricingType(pricing?.type);

    if (pricingType !== "MULTIPLE" && pricingType !== "ADDITIONAL") {
      return [];
    }

    return Array.isArray(pricing?.options)
      ? pricing.options
          .map((option) => {
            const id = String(option.id || "").trim();

            if (!id) {
              return null;
            }

            return {
              value: id,
              label:
                String(
                  option.label || option.option_label || option.name || id,
                ).trim() || id,
            };
          })
          .filter((option): option is { value: string; label: string } =>
            Boolean(option),
          )
      : [];
  }, [registrationsResponse]);

  const pricingFilterLabel = useMemo(() => {
    const payload = registrationsResponse as
      | EventRegistrationsPayload
      | undefined;
    return (
      String(
        payload?.chosen_event?.pricing?.fieldName ||
          payload?.chosen_event?.pricing?.field_name ||
          "Pricing selection",
      ).trim() || "Pricing selection"
    );
  }, [registrationsResponse]);

  useEffect(() => {
    if (!eventOptions.length) {
      return;
    }

    setSelectedEvent((currentValue) => {
      if (
        currentValue &&
        eventOptions.some((eventOption) => eventOption.value === currentValue)
      ) {
        return currentValue;
      }

      if (
        chosenEventId &&
        eventOptions.some((eventOption) => eventOption.value === chosenEventId)
      ) {
        return chosenEventId;
      }

      return eventOptions[0]?.value || "";
    });
  }, [chosenEventId, eventOptions]);

  useEffect(() => {
    setExpandedRegistrationId(null);
  }, [selectedEvent]);

  useEffect(() => {
    setFieldFilters({});
    setSelectedPricingFilter("all");
  }, [selectedEvent]);

  const filteredRegistrations = useMemo(() => registrations, [registrations]);

  const totalRegistrations = registrations.length;
  const awaitingPaymentCount = registrations.filter(
    (registration) => registration.paymentStatus === "Awaiting payment",
  ).length;
  const confirmedCount = registrations.filter(
    (registration) => registration.registrationStatus === "Confirmed",
  ).length;
  const totalRevenue = registrations.reduce(
    (sum, registration) => sum + registration.amountPaid,
    0,
  );

  const handleCopy = async (value: string, copyKey: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedRegistrationId(copyKey);
    window.setTimeout(() => {
      setCopiedRegistrationId((currentValue) =>
        currentValue === copyKey ? null : currentValue,
      );
    }, 1500);
  };

  const handlePaymentAmountChange = (value: string) => {
    const cleanedValue = value.replace(/[^\d]/g, "");
    const amount = Number.parseInt(cleanedValue || "0", 10);
    setPaymentAmount(formatAmount(amount, club?.currency || "ZAR"));
  };

  const handleOpenPaymentDialog = (registration: EventRegistration) => {
    const outstandingAmount = Math.max(
      registration.amountDue - registration.amountPaid,
      0,
    );
    setSelectedRegistrationForPayment(registration);
    setPaymentAmount(formatAmount(outstandingAmount, club?.currency || "ZAR"));
    setPaymentDialogOpen(true);
  };

  const handleClosePaymentDialog = () => {
    if (isConfirmingPayment) {
      return;
    }

    setPaymentDialogOpen(false);
    setSelectedRegistrationForPayment(null);
    setPaymentAmount("");
  };

  const handleConfirmPayment = async () => {
    if (!selectedRegistrationForPayment || !club?.club_account_id) {
      return;
    }

    const paymentAmountInCents = Number.parseInt(
      paymentAmount.replace(/[^\d]/g, "") || "0",
      10,
    );
    const outstandingAmount = Math.max(
      selectedRegistrationForPayment.amountDue -
        selectedRegistrationForPayment.amountPaid,
      0,
    );

    if (
      !selectedRegistrationForPayment.transactionId ||
      selectedRegistrationForPayment.transactionId === "N/A"
    ) {
      toast.error(
        "This registration does not have a valid transaction to confirm.",
      );
      return;
    }

    if (paymentAmountInCents <= 0) {
      toast.error("Payment amount must be greater than 0.");
      return;
    }

    if (paymentAmountInCents > outstandingAmount) {
      toast.error(
        `Payment amount cannot exceed ${formatAmount(outstandingAmount, club.currency || "ZAR")}.`,
      );
      return;
    }

    setIsConfirmingPayment(true);

    try {
      const response = await confirmEventPayment({
        club_account_id: club.club_account_id,
        event_id: selectedRegistrationForPayment.eventId,
        event_registration_id: selectedRegistrationForPayment.id,
        transaction_id: selectedRegistrationForPayment.transactionId,
        amount_paid: paymentAmountInCents,
      });

      if (response.status !== 200) {
        toast.error(response.data?.message || "Failed to confirm payment.");
        return;
      }

      toast.success(
        response.data?.message || "Payment confirmed successfully.",
      );
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["admin-event-registrations", club.club_account_id],
        }),
        queryClient.invalidateQueries({
          queryKey: ["admin-event-registration", club.club_account_id],
        }),
      ]);
      handleClosePaymentDialog();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Error confirming payment.";
      toast.error(message);
    } finally {
      setIsConfirmingPayment(false);
    }
  };

  const isTableLoading = isLoading || isFetching;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Event Registrations
          </h1>
          <p className="text-muted-foreground">
            Review all registrations submitted across your club events.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border bg-background px-4 py-3 shadow-sm">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Use the filters below to focus on one event or payment state.
          </p>
        </div>
      </div>

      {!club?.enable_events && (
        <Card className="mb-6 overflow-hidden border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 p-0 shadow-sm">
          <CardContent className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-amber-300 bg-amber-100">
                <AlertCircle className="h-4 w-4 text-amber-700" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-amber-950 sm:text-base">
                  Events are currently disabled
                </p>
                <p className="max-w-2xl text-sm leading-snug text-amber-800">
                  Go to the events page to enable events before managing registrations.
                </p>
              </div>
            </div>
            <Button
              onClick={() => navigate("/events")}
              className="w-full bg-amber-700 text-white hover:bg-amber-800 sm:w-auto"
            >
              Go to Events
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="border-sky-200 bg-gradient-to-r from-sky-50 via-background to-cyan-50 shadow-sm">
        <CardContent className="flex flex-col gap-4 p-5">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                Selected Event
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-900">
                {selectedEventTitle}
              </h2>
            </div>
            <Badge className="w-fit border-sky-200 bg-white text-sky-700">
              {eventOptions.length} available event
              {eventOptions.length === 1 ? "" : "s"}
            </Badge>
          </div>

          <div className="flex flex-wrap gap-2">
            {eventOptions.map((eventOption) => (
              <Button
                key={eventOption.value}
                variant={
                  selectedEvent === eventOption.value ? "default" : "outline"
                }
                className={cn(
                  "rounded-full",
                  selectedEvent === eventOption.value &&
                    "bg-sky-600 text-white hover:bg-sky-700",
                )}
                onClick={() => setSelectedEvent(eventOption.value)}
              >
                {eventOption.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total registrations</CardDescription>
            <CardTitle className="text-3xl">{totalRegistrations}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              Across all active club events.
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Awaiting payment</CardDescription>
            <CardTitle className="text-3xl">{awaitingPaymentCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CreditCard className="h-4 w-4" />
              Registrations still needing payment.
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Confirmed entries</CardDescription>
            <CardTitle className="text-3xl">{confirmedCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4" />
              Fully accepted registrations.
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Revenue collected</CardDescription>
            <CardTitle className="text-3xl">
              {formatAmount(totalRevenue, club?.currency || "ZAR")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Ticket className="h-4 w-4" />
              Paid amounts from current registrations.
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registration Queue</CardTitle>
          <CardDescription>
            Review and expand registrations to inspect event details and
            submitted answers.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid auto-rows-fr gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="grid h-full min-w-0 gap-2">
              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Payment Status
              </label>
              <Select
                value={selectedPaymentStatus}
                onValueChange={setSelectedPaymentStatus}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter by payment status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All payment states</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Awaiting payment">
                    Awaiting payment
                  </SelectItem>
                  <SelectItem value="Partially paid">Partially paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {registrationFilterFields.map((field) => {
              if (field.inputType === "TEXT") {
                return (
                  <div key={field.id} className="grid h-full min-w-0 gap-2">
                    <label className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      {field.label}
                    </label>
                    <Input
                      className="w-full"
                      value={fieldFilters[field.id] || ""}
                      onChange={(event) =>
                        setFieldFilters((current) => ({
                          ...current,
                          [field.id]: event.target.value,
                        }))
                      }
                      placeholder={`Filter by ${field.label.toLowerCase()}`}
                    />
                  </div>
                );
              }

              return (
                <div key={field.id} className="grid h-full min-w-0 gap-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {field.label}
                  </label>
                  <Select
                    value={fieldFilters[field.id] || "all"}
                    onValueChange={(value) =>
                      setFieldFilters((current) => {
                        if (value === "all") {
                          const nextFilters = { ...current };
                          delete nextFilters[field.id];
                          return nextFilters;
                        }

                        return {
                          ...current,
                          [field.id]: value,
                        };
                      })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={`Filter by ${field.label.toLowerCase()}`}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {field.options.map((option) => (
                        <SelectItem
                          key={`${field.id}-${option}`}
                          value={option}
                        >
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            })}

            {pricingFilterOptions.length > 0 && (
              <div className="grid h-full min-w-0 gap-2">
                <label className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {pricingFilterLabel}
                </label>
                <Select
                  value={selectedPricingFilter}
                  onValueChange={setSelectedPricingFilter}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={`Filter by ${pricingFilterLabel.toLowerCase()}`}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {pricingFilterOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {(registrationFilterFields.length > 0 ||
            pricingFilterOptions.length > 0) && (
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setFieldFilters({});
                  setSelectedPricingFilter("all");
                }}
              >
                Reset form filters
              </Button>
            </div>
          )}

          <div className="overflow-hidden rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-12 text-center"></TableHead>
                  <TableHead className="w-[20%] text-center">
                    Member
                  </TableHead>
                  <TableHead className="w-[20%] text-center">
                    Registration ID
                  </TableHead>
                  <TableHead className="w-[20%] text-center">
                    Payment
                  </TableHead>
                  <TableHead className="w-[20%] text-center">
                    Status
                  </TableHead>
                  <TableHead className="w-[20%] text-center">
                    Submitted
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isTableLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-10 text-center text-muted-foreground"
                    >
                      Loading registrations...
                    </TableCell>
                  </TableRow>
                ) : isError ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-10 text-center text-destructive"
                    >
                      Unable to load event registrations right now.
                    </TableCell>
                  </TableRow>
                ) : filteredRegistrations.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-10 text-center text-muted-foreground"
                    >
                      No registrations are available for the selected event.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRegistrations.map((registration) => (
                    <Fragment key={registration.id}>
                      <TableRow className="border-border/60">
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setExpandedRegistrationId((currentValue) =>
                                currentValue === registration.id
                                  ? null
                                  : registration.id,
                              )
                            }
                            className="h-7 w-7 p-0"
                          >
                            <ChevronDown
                              className={cn(
                                "h-4 w-4 transition-transform",
                                expandedRegistrationId === registration.id &&
                                  "rotate-180",
                              )}
                            />
                          </Button>
                        </TableCell>
                        <TableCell className="w-[20%] text-center">
                          <div>
                            <p className="font-medium">{`${registration.memberFirstName} ${registration.memberSurname}`}</p>
                            <div className="mt-1 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                              <span className="font-mono">
                                {getShortUserId(registration.userId)}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 p-0"
                                onClick={() =>
                                  void handleCopy(
                                    registration.userId,
                                    `user-${registration.id}`,
                                  )
                                }
                                title="Copy user ID"
                              >
                                {copiedRegistrationId ===
                                `user-${registration.id}` ? (
                                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="w-[20%] text-center">
                          <div className="flex items-center justify-center gap-2">
                            <span className="rounded bg-muted px-2 py-1 font-mono text-xs">
                              {getShortId(registration.id)}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() =>
                                void handleCopy(
                                  registration.id,
                                  `registration-${registration.id}`,
                                )
                              }
                              title="Copy registration ID"
                            >
                              {copiedRegistrationId ===
                              `registration-${registration.id}` ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="w-[20%] text-center">
                          <div className="space-y-1">
                            <Badge
                              className={getPaymentBadgeClassName(
                                registration.paymentStatus,
                              )}
                            >
                              {registration.paymentStatus}
                            </Badge>
                            {registration.amountDue > 0 && registration.paymentStatus !== "Paid" && (
                              <p className="text-xs text-muted-foreground">
                                {formatAmount(
                                  registration.amountPaid,
                                  club?.currency || "ZAR",
                                )}{" "}
                                of{" "}
                                {formatAmount(
                                  registration.amountDue,
                                  club?.currency || "ZAR",
                                )}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="w-[20%] text-center">
                          <Badge
                            className={getRegistrationBadgeClassName(
                              registration.registrationStatus,
                            )}
                          >
                            {registration.registrationStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="w-[20%] text-center text-sm text-muted-foreground">
                          {formatSubmittedDate(registration.submittedAt)}
                        </TableCell>
                      </TableRow>

                      {expandedRegistrationId === registration.id && (
                        <TableRow className="bg-muted/20 hover:bg-muted/20">
                          <TableCell colSpan={6} className="p-4">
                            {isRegistrationDetailLoading ? (
                              <div className="flex min-h-60 items-center justify-center rounded-xl border bg-background">
                                <div className="flex items-center gap-3 text-muted-foreground">
                                  <Loader2 className="h-5 w-5 animate-spin" />
                                  Loading registration details...
                                </div>
                              </div>
                            ) : isRegistrationDetailError ? (
                              <div className="flex min-h-60 items-center justify-center rounded-xl border bg-background text-destructive">
                                Unable to load registration details right now.
                              </div>
                            ) : (
                              <div className="space-y-4">
                                <div className="rounded-xl border bg-background p-4">
                                  <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                        Registration Details
                                      </p>
                                      <h3 className="mt-2 text-lg font-semibold">
                                        {registration.memberName}
                                      </h3>
                                    </div>
                                  </div>

                                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                                    <div className="rounded-lg border bg-muted/20 p-3">
                                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                                        Event
                                      </p>
                                      <p className="mt-2 font-medium">
                                        {registration.eventTitle}
                                      </p>
                                    </div>
                                    <div className="rounded-lg border bg-muted/20 p-3">
                                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                                        Registration amount
                                      </p>
                                      <p className="mt-2 font-medium">
                                        {formatAmount(
                                          registration.amountDue,
                                          club?.currency || "ZAR",
                                        )}
                                      </p>
                                      <p className="mt-2 text-sm text-muted-foreground">
                                        Paid:{" "}
                                        {formatAmount(
                                          registration.amountPaid,
                                          club?.currency || "ZAR",
                                        )}
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        Outstanding:{" "}
                                        {formatAmount(
                                          Math.max(
                                            registration.amountDue -
                                              registration.amountPaid,
                                            0,
                                          ),
                                          club?.currency || "ZAR",
                                        )}
                                      </p>
                                      {registration.paymentStatus !== "Paid" &&
                                        Math.max(
                                          registration.amountDue -
                                            registration.amountPaid,
                                          0,
                                        ) > 0 && (
                                          <Button
                                            type="button"
                                            className="mt-3"
                                            onClick={() =>
                                              handleOpenPaymentDialog(
                                                registration,
                                              )
                                            }
                                          >
                                            Confirm Payment
                                          </Button>
                                        )}
                                    </div>
                                  </div>
                                </div>

                                <div className="rounded-xl border bg-background p-4">
                                  <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                    <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                      Registration Form
                                    </h4>
                                  </div>
                                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                                    {expandedPricingSelections.length > 0 && (
                                      <div className="h-full rounded-lg border bg-muted/20 p-3">
                                        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                                          {registration.pricingFieldName}
                                        </p>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                          {expandedPricingSelections.map(
                                            (option) => (
                                              <Badge
                                                key={`${registration.id}-${option.id}`}
                                                variant="secondary"
                                                className="px-3 py-1"
                                              >
                                                {option.label}
                                              </Badge>
                                            ),
                                          )}
                                        </div>
                                      </div>
                                    )}
                                    {(
                                      registrationDetail.registration_fields ||
                                      []
                                    ).map((field, index) => (
                                      <div
                                        key={`${registration.id}-${field.field_id || field.field_label || index}`}
                                        className="h-full rounded-lg border bg-muted/20 p-3"
                                      >
                                        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                                          {field.field_label ||
                                            `Field ${index + 1}`}
                                        </p>
                                        <p className="mt-2 text-sm font-medium whitespace-pre-wrap">
                                          {formatFieldValue(field.value)}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                {registration.notes && (
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="text-base">
                                        Internal Notes
                                      </CardTitle>
                                      <CardDescription>
                                        Mock operational context for this
                                        registration.
                                      </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                      <p className="text-sm text-muted-foreground">
                                        {registration.notes}
                                      </p>
                                    </CardContent>
                                  </Card>
                                )}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={paymentDialogOpen} onOpenChange={handleClosePaymentDialog}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Confirm Event Registration Payment</DialogTitle>
            <DialogDescription>
              Confirm payment for{" "}
              {selectedRegistrationForPayment?.memberName ||
                "this registration"}
              .
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-lg border bg-muted/20 p-4">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">
                  Registration amount
                </span>
                <span className="font-medium">
                  {formatAmount(
                    selectedRegistrationForPayment?.amountDue || 0,
                    club?.currency || "ZAR",
                  )}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">Already paid</span>
                <span className="font-medium">
                  {formatAmount(
                    selectedRegistrationForPayment?.amountPaid || 0,
                    club?.currency || "ZAR",
                  )}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">Outstanding</span>
                <span className="font-semibold">
                  {formatAmount(
                    Math.max(
                      (selectedRegistrationForPayment?.amountDue || 0) -
                        (selectedRegistrationForPayment?.amountPaid || 0),
                      0,
                    ),
                    club?.currency || "ZAR",
                  )}
                </span>
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Payment amount</label>
              <Input
                value={paymentAmount}
                onChange={(event) =>
                  handlePaymentAmountChange(event.target.value)
                }
                inputMode="numeric"
                placeholder={formatAmount(0, club?.currency || "ZAR")}
                disabled={isConfirmingPayment}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleClosePaymentDialog}
              disabled={isConfirmingPayment}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmPayment}
              disabled={isConfirmingPayment}
            >
              {isConfirmingPayment ? "Processing..." : "Confirm Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
