import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  CheckCircle2,
  Copy,
  Clock3,
  FileText,
  Loader2,
  Search,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getEventRegistrations, getEvents } from "@/services/events";
import {
  formatDateKey,
  formatLongDate,
  formatRangeLabel,
  getRegistrationStatus,
  isRegistrationOpen,
  type MemberEvent,
  sanitizeEvents,
} from "@/components/member/events/event-utils";
import { formatAmount } from "@/data/currencies";

type RegistrationStatus = "Registered" | "Pending payment" | "Confirmed";

type PaymentStatus = "Paid" | "Awaiting payment" | "Reserved";

type MemberEventRegistration = {
  id: string;
  eventId: string;
  eventRegistrationId: string;
  submittedAt: string;
  status: RegistrationStatus;
  paymentStatus: PaymentStatus;
  formResponses: Array<{
    fieldId: string;
    label: string;
    value: string;
  }>;
  selectedPricingOptionIds: string[];
  amountLabel: string;
};

interface MemberEventsProps {
  clubId: string;
  clubAccountId: string;
  currency?: string;
  registrationSearchQuery?: string;
  onPayRegistration?: (eventRegistrationId?: string) => void;
}
export default function MemberEvents({
  clubId,
  clubAccountId,
  currency = "ZAR",
  registrationSearchQuery = "",
  onPayRegistration,
}: MemberEventsProps) {
  const navigate = useNavigate();
  const todayKey = useMemo(() => formatDateKey(new Date()), []);
  const [activeTab, setActiveTab] = useState<"events" | "registrations">("events");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["member-events", clubAccountId],
    queryFn: () => getEvents(clubAccountId),
    enabled: !!clubAccountId,
  });

  const {
    data: registrationsData,
    isLoading: isRegistrationsLoading,
    isError: isRegistrationsError,
  } = useQuery({
    queryKey: ["member-event-registrations", clubAccountId],
    queryFn: () => getEventRegistrations(clubAccountId),
    enabled: !!clubAccountId,
  });

  const events = useMemo(() => {
    return sanitizeEvents(Array.isArray(data?.events) ? data.events : []);
  }, [data?.events]);

  const upcomingEvents = useMemo(() => {
    return events.filter(
      (event) => !event.endDate || event.endDate >= todayKey,
    );
  }, [events, todayKey]);

  const registrations = useMemo(() => {
    return sanitizeRegistrations(getRegistrationItems(registrationsData), events, currency);
  }, [currency, events, registrationsData]);

  const [selectedRegistrationId, setSelectedRegistrationId] = useState<string | null>(null);

  useEffect(() => {
    if (!registrations.length) {
      setSelectedRegistrationId(null);
      return;
    }

    const trimmedQuery = registrationSearchQuery.trim().toLowerCase();

    if (!trimmedQuery) {
      setSelectedRegistrationId((currentValue) => {
        if (
          currentValue &&
          registrations.some((registration) => registration.id === currentValue)
        ) {
          return currentValue;
        }

        return registrations[0]?.id ?? null;
      });
      return;
    }

    const matchedRegistration =
      registrations.find(
        (registration) =>
          registration.eventRegistrationId.toLowerCase() === trimmedQuery,
      ) ??
      registrations.find((registration) =>
        registration.eventRegistrationId.toLowerCase().includes(trimmedQuery),
      );

    if (matchedRegistration) {
      setSelectedRegistrationId(matchedRegistration.id);
    }
  }, [registrationSearchQuery, registrations]);

  const selectedRegistration = useMemo(() => {
    const fallbackRegistrationId = registrations[0]?.id ?? null;
    const currentRegistrationId = selectedRegistrationId ?? fallbackRegistrationId;
    return registrations.find((registration) => registration.id === currentRegistrationId) ?? null;
  }, [registrations, selectedRegistrationId]);

  const selectedRegisteredEvent = useMemo(() => {
    if (!selectedRegistration) {
      return null;
    }

    return (
      events.find(
        (event) => (event.eventId ?? event.id) === selectedRegistration.eventId,
      ) ?? null
    );
  }, [events, selectedRegistration]);

  return (
    <TabsSection
      activeTab={activeTab}
      onTabChange={(value) => setActiveTab(value as "events" | "registrations")}
      isLoading={isLoading}
      isError={isError}
      isRegistrationsLoading={isRegistrationsLoading}
      isRegistrationsError={isRegistrationsError}
      hasRequestedRegistrations={isRegistrationsLoading || registrationsData !== undefined}
      allEvents={events}
      events={upcomingEvents}
      todayKey={todayKey}
      currency={currency}
      registrationSearchQuery={registrationSearchQuery}
      registrations={registrations}
      selectedRegistration={selectedRegistration}
      selectedRegisteredEvent={selectedRegisteredEvent}
      onRegister={(event) =>
        navigate(
          `/myclubs/${clubId}/events/${event.eventId ?? event.id}/register`,
        )
      }
      onSelectRegistration={setSelectedRegistrationId}
      onPayRegistration={onPayRegistration}
    />
  );
}

function TabsSection({
  activeTab,
  onTabChange,
  isLoading,
  isError,
  isRegistrationsLoading,
  isRegistrationsError,
  hasRequestedRegistrations,
  allEvents,
  events,
  todayKey,
  currency,
  registrationSearchQuery,
  registrations,
  selectedRegistration,
  selectedRegisteredEvent,
  onRegister,
  onSelectRegistration,
  onPayRegistration,
}: {
  activeTab: "events" | "registrations";
  onTabChange: (value: string) => void;
  isLoading: boolean;
  isError: boolean;
  isRegistrationsLoading: boolean;
  isRegistrationsError: boolean;
  hasRequestedRegistrations: boolean;
  allEvents: MemberEvent[];
  events: MemberEvent[];
  todayKey: string;
  currency: string;
  registrationSearchQuery: string;
  registrations: MemberEventRegistration[];
  selectedRegistration: MemberEventRegistration | null;
  selectedRegisteredEvent: MemberEvent | null;
  onRegister: (event: MemberEvent) => void;
  onSelectRegistration: (registrationId: string) => void;
  onPayRegistration?: (eventRegistrationId?: string) => void;
}) {
  const [copiedRegistrationKey, setCopiedRegistrationKey] = useState<string | null>(null);
  const [registrationSearch, setRegistrationSearch] = useState(registrationSearchQuery);
  const selectedFormCardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setRegistrationSearch(registrationSearchQuery);

    if (registrationSearchQuery.trim()) {
      onTabChange("registrations");
    }
  }, [registrationSearchQuery, onTabChange]);

  const filteredRegistrations = useMemo(() => {
    const query = registrationSearch.trim().toLowerCase();

    if (!query) {
      return registrations;
    }

    return registrations.filter((registration) => {
      const event = allEvents.find(
        (entry) => (entry.eventId ?? entry.id) === registration.eventId,
      );

      return [
        event?.title,
        registration.eventRegistrationId,
        registration.status,
        registration.paymentStatus,
        registration.amountLabel,
        registration.submittedAt,
      ].some((value) => String(value ?? "").toLowerCase().includes(query));
    });
  }, [allEvents, registrationSearch, registrations]);

  const handleCopyRegistrationId = async (value: string, key: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedRegistrationKey(key);
    window.setTimeout(() => {
      setCopiedRegistrationKey((currentValue) => (currentValue === key ? null : currentValue));
    }, 1500);
  };

  useEffect(() => {
    if (!selectedRegistration || !selectedFormCardRef.current) {
      return;
    }

    selectedFormCardRef.current.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [selectedRegistration]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading events...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-destructive">
          Unable to load events right now.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-primary/10 bg-gradient-to-br from-background via-background to-muted/30">
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-sky-100 text-sky-700 shadow-sm">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Club Events</CardTitle>
                <CardDescription>
                  Browse upcoming events and review the registrations you have already submitted.
                </CardDescription>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:min-w-72">
              <div className="rounded-2xl border bg-background/80 p-3 shadow-sm">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  Upcoming
                </p>
                <p className="mt-1 text-2xl font-semibold text-foreground">{events.length}</p>
              </div>
              <div className="rounded-2xl border bg-background/80 p-3 shadow-sm">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  Registered
                </p>
                <p className="mt-1 text-2xl font-semibold text-foreground">
                  {hasRequestedRegistrations ? registrations.length : "-"}
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={onTabChange} className="space-y-6">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-2 bg-muted/40 p-1">
          <TabsTrigger value="events" className="py-2.5">
            Upcoming Events
          </TabsTrigger>
          <TabsTrigger value="registrations" className="py-2.5">
            My Registrations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
          {events.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No Events Available</CardTitle>
                <CardDescription>
                  This club has no published events available right now.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="grid gap-4">
              {events.map((event) => {
                const status = getRegistrationStatus(event, todayKey);
                const canRegister = isRegistrationOpen(event, todayKey);
                const registrationCount = registrations.filter(
                  (registration) => registration.eventId === (event.eventId ?? event.id),
                ).length;

                return (
                  <Card key={event.eventId ?? event.id} className="gap-0">
                    <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-2">
                        {registrationCount > 0 && (
                          <div className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-900">
                            You have submitted {registrationCount} registration{registrationCount === 1 ? "" : "s"} for this event.
                          </div>
                        )}
                        <div className="flex flex-wrap items-center gap-2">
                          <CardTitle className="text-xl">{event.title}</CardTitle>
                          <Badge variant="outline" className={status.className}>
                            {status.label}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {event.description && (
                        <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                          {event.description}
                        </p>
                      )}

                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="rounded-lg border bg-muted/20 p-3">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <CalendarDays className="h-4 w-4 text-muted-foreground" />
                            Event dates
                          </div>
                          <p className="mt-2 text-sm text-muted-foreground">
                            {formatRangeLabel(event)}
                          </p>
                        </div>

                        <div className="rounded-lg border bg-muted/20 p-3">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <Clock3 className="h-4 w-4 text-muted-foreground" />
                            Registration window
                          </div>
                          <p className="mt-2 text-sm text-muted-foreground">
                            {event.registrationOpenDate && event.registrationCloseDate
                              ? `${formatLongDate(event.registrationOpenDate)} to ${formatLongDate(event.registrationCloseDate)}`
                              : "To be confirmed"}
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-end border-t pt-4">
                        {canRegister && (
                          <Button type="button" onClick={() => onRegister(event)}>
                            Register
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="registrations" className="space-y-4">
          {isRegistrationsLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Loading your registrations...
                </div>
              </CardContent>
            </Card>
          ) : isRegistrationsError ? (
            <Card>
              <CardContent className="py-12 text-center text-sm text-destructive">
                Unable to load your registrations right now.
              </CardContent>
            </Card>
          ) : registrations.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No Registrations Yet</CardTitle>
                <CardDescription>
                  Your submitted event forms and payment progress will appear here once you register.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="space-y-4">
              <Card className="overflow-hidden border-primary/20">
                <CardHeader>
                  <CardTitle>Submitted Registrations</CardTitle>
                  <CardDescription>
                    Select a registration to review the submitted form below.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="border-b border-primary/10 p-4">
                    <div className="relative max-w-md">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={registrationSearch}
                        onChange={(event) => setRegistrationSearch(event.target.value)}
                        placeholder="Search by event, registration ID, status, payment, or amount"
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div
                    className={`${filteredRegistrations.length > 5 ? "max-h-96 overflow-y-auto" : "overflow-hidden"}`}
                  >
                  <Table className="border-0">
                    <TableHeader className="bg-gradient-to-r from-muted/50 to-muted/30 sticky top-0 z-10">
                      <TableRow className="border-primary/10 hover:bg-transparent">
                        <TableHead className="text-center flex-1 font-semibold">Event</TableHead>
                        <TableHead className="text-center flex-1 font-semibold">Registration ID</TableHead>
                        <TableHead className="text-center flex-1 font-semibold">Submitted</TableHead>
                        <TableHead className="text-center flex-1 font-semibold">Amount</TableHead>
                        <TableHead className="text-center flex-1 font-semibold">Payment</TableHead>
                        <TableHead className="text-center flex-1 font-semibold">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRegistrations.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No registrations match your search.
                          </TableCell>
                        </TableRow>
                      )}
                      {filteredRegistrations.map((registration) => {
                        const event = allEvents.find(
                          (entry) => (entry.eventId ?? entry.id) === registration.eventId,
                        );
                        const isSelected = registration.id === selectedRegistration?.id;
                        const requiresPayment =
                          registration.paymentStatus === "Awaiting payment";

                        return (
                          <TableRow
                            key={registration.id}
                            data-state={isSelected ? "selected" : undefined}
                            className="cursor-pointer hover:bg-primary/5 transition-colors border-primary/10 group"
                            onClick={() => onSelectRegistration(registration.id)}
                          >
                            <TableCell className="text-center flex-1 py-4 font-medium">
                              {event?.title || "Event registration"}
                            </TableCell>
                            <TableCell className="text-center flex-1 py-4">
                              <div className="flex items-center justify-center gap-2">
                                <span className="font-mono text-sm bg-muted/50 px-2 py-1 rounded">
                                  {getShortRegistrationId(registration.eventRegistrationId)}
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    void handleCopyRegistrationId(
                                      registration.eventRegistrationId,
                                      `table-${registration.id}`,
                                    );
                                  }}
                                  title="Copy Event Registration ID"
                                  className="h-6 w-6 p-0"
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                                {copiedRegistrationKey === `table-${registration.id}` && (
                                  <span className="text-[11px] text-muted-foreground">Copied</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-center flex-1 py-4">
                              {formatLongDate(registration.submittedAt)}
                            </TableCell>
                            <TableCell className="text-center flex-1 py-4 font-semibold">
                              {registration.amountLabel}
                            </TableCell>
                            <TableCell className="text-center flex-1 py-4">
                              <div className="flex flex-col items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className={getPaymentBadgeClassName(registration.paymentStatus)}
                                >
                                  {registration.paymentStatus}
                                </Badge>
                                {requiresPayment && onPayRegistration && (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 px-2 text-xs text-red-600 underline"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      onPayRegistration(
                                        registration.eventRegistrationId,
                                      );
                                    }}
                                  >
                                    Pay Now
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-center flex-1 py-4">
                              <Badge
                                variant="outline"
                                className={getRegistrationBadgeClassName(registration.status)}
                              >
                                {registration.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  </div>
                </CardContent>
              </Card>

              <div ref={selectedFormCardRef}>
                <Card className="border-primary/20 bg-gradient-to-br from-background to-muted/40">
                <CardHeader className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle>Your Submitted Form</CardTitle>
                      <CardDescription>
                        Review the registration answers and payment details returned for your submission.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  {selectedRegistration ? (
                    <>
                      <div className="rounded-2xl border bg-background/80 p-4 shadow-sm">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-lg font-semibold text-foreground">
                              {selectedRegisteredEvent?.title || "Event registration"}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {selectedRegisteredEvent ? formatRangeLabel(selectedRegisteredEvent) : "Date to be confirmed"}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={getRegistrationBadgeClassName(selectedRegistration.status)}
                          >
                            {selectedRegistration.status}
                          </Badge>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <CopyableDetailItem
                            label="Registration ID"
                            value={selectedRegistration.eventRegistrationId}
                            displayValue={getShortRegistrationId(selectedRegistration.eventRegistrationId)}
                            copyTitle="Copy Event Registration ID"
                            copied={copiedRegistrationKey === `detail-${selectedRegistration.id}`}
                            onCopy={() =>
                              handleCopyRegistrationId(
                                selectedRegistration.eventRegistrationId,
                                `detail-${selectedRegistration.id}`,
                              )
                            }
                          />
                          <DetailItem
                            label="Submitted"
                            value={formatLongDate(selectedRegistration.submittedAt)}
                          />
                          <DetailItem
                            label="Amount"
                            value={selectedRegistration.amountLabel}
                          />
                          <DetailItem
                            label="Payment status"
                            value={selectedRegistration.paymentStatus}
                          />
                        </div>

                        {selectedRegistration.paymentStatus === "Awaiting payment" &&
                          onPayRegistration && (
                          <div className="flex justify-end">
                            <Button
                              type="button"
                              onClick={() =>
                                onPayRegistration(
                                  selectedRegistration.eventRegistrationId,
                                )
                              }
                            >
                              Pay Now
                            </Button>
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                            Submitted Answers
                          </p>
                        </div>

                        <div className="space-y-3">
                          {selectedRegistration.formResponses.map((response) => (
                            <div
                              key={`${selectedRegistration.id}-${response.fieldId}`}
                              className="rounded-xl border bg-background/80 p-4 shadow-sm"
                            >
                              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                                {response.label}
                              </p>
                              <p className="mt-2 text-sm font-medium text-foreground whitespace-pre-wrap">
                                {response.value}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {selectedRegisteredEvent &&
                        (selectedRegisteredEvent.pricing.type === "MULTIPLE" ||
                          selectedRegisteredEvent.pricing.type === "ADDITIONAL") &&
                        selectedRegistration.selectedPricingOptionIds.length > 0 && (
                        <div className="rounded-xl border bg-background/70 p-4 shadow-sm">
                          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                            {selectedRegisteredEvent.pricing.fieldName || "Pricing selection"}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {selectedRegistration.selectedPricingOptionIds.map((optionId) => {
                              const option = selectedRegisteredEvent.pricing.options.find(
                                (pricingOption) => pricingOption.id === optionId,
                              );
                              const optionLabel = option
                                ? `${option.label} (${formatPriceLabel(option.amount, currency)})`
                                : optionId;

                              return (
                                <Badge key={optionId} variant="secondary" className="px-3 py-1">
                                  {optionLabel}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Select a registration to inspect the submitted form details.
                    </p>
                  )}
                </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function getRegistrationItems(response: unknown): unknown[] {
  if (Array.isArray(response)) {
    return response;
  }

  if (!response || typeof response !== "object") {
    return [];
  }

  const record = response as Record<string, unknown>;

  const directKeys = ["event_registrations", "eventRegistrations", "registrations", "items"];
  for (const key of directKeys) {
    if (Array.isArray(record[key])) {
      return record[key];
    }
  }

  if (record.data && typeof record.data === "object" && !Array.isArray(record.data)) {
    const nestedRecord = record.data as Record<string, unknown>;
    for (const key of directKeys) {
      if (Array.isArray(nestedRecord[key])) {
        return nestedRecord[key];
      }
    }
  }

  return [];
}

function sanitizeRegistrations(
  rawRegistrations: unknown[],
  events: MemberEvent[],
  currency: string,
): MemberEventRegistration[] {
  return rawRegistrations
    .map((rawRegistration, index) => sanitizeRegistration(rawRegistration, index, events, currency))
    .filter((registration): registration is MemberEventRegistration => Boolean(registration))
    .sort((left, right) => right.submittedAt.localeCompare(left.submittedAt));
}

function sanitizeRegistration(
  rawRegistration: unknown,
  index: number,
  events: MemberEvent[],
  currency: string,
): MemberEventRegistration | null {
  const registration = toRecord(rawRegistration);
  if (!registration) {
    return null;
  }

  const nestedEvent = toRecord(registration.event);
  const eventId =
    getString(registration, ["event_id", "eventId"]) ||
    getString(nestedEvent, ["event_id", "eventId", "id"]);

  const eventRegistrationId = getString(registration, [
    "event_registration_id",
    "eventRegistrationId",
    "registration_id",
    "id",
  ]);

  if (!eventId || !eventRegistrationId) {
    return null;
  }

  const matchedEvent = events.find((event) => (event.eventId ?? event.id) === eventId);
  const selectedPricingOptionIds = getStringArray(registration, [
    "selected_pricing_option_ids",
    "selectedPricingOptionIds",
  ]);
  const amountPaid = getNumber(registration, ["amount_paid", "amountPaid"]);
  const entryFeeAmount = getNumber(registration, ["entry_fee_amount", "entryFeeAmount", "amount"]);
  const status = normalizeRegistrationStatus(
    getString(registration, ["status", "registration_status"]),
    getString(registration, ["payment_status", "paymentStatus"]),
    amountPaid,
    entryFeeAmount,
  );
  const paymentStatus = normalizePaymentStatus(
    getString(registration, ["payment_status", "paymentStatus"]),
    status,
    amountPaid,
    entryFeeAmount,
  );
  const amountLabel = getAmountLabel(registration, matchedEvent, currency);

  return {
    id: getString(registration, ["id", "event_registration_id", "registration_id"]) || `${eventId}-${index}`,
    eventId,
    eventRegistrationId,
    submittedAt: toDateKey(
      registration.submitted_on ??
      registration.submitted_at ??
        registration.submittedAt ??
        registration.created_at ??
        registration.createdAt ??
        registration.updated_at ??
        registration.updatedAt,
    ),
    status,
    paymentStatus,
    selectedPricingOptionIds,
    amountLabel,
    formResponses: getFormResponses(registration),
  };
}

function toRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function getString(record: Record<string, unknown> | null, keys: string[]) {
  if (!record) {
    return "";
  }

  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

function getStringArray(record: Record<string, unknown> | null, keys: string[]) {
  if (!record) {
    return [];
  }

  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
    }
  }

  return [];
}

function getNumber(record: Record<string, unknown> | null, keys: string[]) {
  if (!record) {
    return null;
  }

  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim()) {
      const numericValue = Number(value);
      if (Number.isFinite(numericValue)) {
        return numericValue;
      }
    }
  }

  return null;
}

function getFormResponses(registration: Record<string, unknown>) {
  const rawResponses = [
    registration.registration_fields,
    registration.registrationFields,
    registration.form_responses,
    registration.formResponses,
  ].find(Array.isArray);

  if (!Array.isArray(rawResponses)) {
    return [];
  }

  return rawResponses
    .map((rawResponse, index) => {
      const response = toRecord(rawResponse);
      if (!response) {
        return null;
      }

      return {
        fieldId:
          getString(response, ["field_id", "fieldId", "id"]) ||
          `field-${index}`,
        label:
          getString(response, ["field_label", "fieldLabel", "label", "name"]) ||
          "Submitted field",
        value: formatResponseValue(response.value),
      };
    })
    .filter(
      (
        response,
      ): response is { fieldId: string; label: string; value: string } => Boolean(response),
    );
}

function formatResponseValue(value: unknown): string {
  if (typeof value === "string") {
    return value.trim() || "-";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "number") {
    return `${value}`;
  }

  if (Array.isArray(value)) {
    return value.map((item) => formatResponseValue(item)).join(", ");
  }

  return "-";
}

function toDateKey(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return formatDateKey(new Date(value));
  }

  if (typeof value !== "string") {
    return formatDateKey(new Date());
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return formatDateKey(new Date());
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  if (/^\d+$/.test(trimmed)) {
    const numericValue = Number(trimmed);
    return Number.isFinite(numericValue) ? formatDateKey(new Date(numericValue)) : formatDateKey(new Date());
  }

  const parsedTimestamp = Date.parse(trimmed);
  return Number.isFinite(parsedTimestamp)
    ? formatDateKey(new Date(parsedTimestamp))
    : formatDateKey(new Date());
}

function normalizeRegistrationStatus(
  rawStatus: string,
  rawPaymentStatus: string,
  amountPaid: number | null,
  entryFeeAmount: number | null,
): RegistrationStatus {
  const normalizedStatus = rawStatus.toLowerCase();
  const normalizedPaymentStatus = rawPaymentStatus.toLowerCase();
  const isPaidInFull =
    amountPaid !== null && entryFeeAmount !== null ? amountPaid >= entryFeeAmount : false;

  if (
    normalizedStatus.includes("confirm") ||
    normalizedStatus.includes("paid") ||
    normalizedPaymentStatus.includes("paid") ||
    isPaidInFull
  ) {
    return "Confirmed";
  }

  if (
    normalizedStatus.includes("pending") ||
    normalizedStatus.includes("await") ||
    normalizedPaymentStatus.includes("pending") ||
    normalizedPaymentStatus.includes("await") ||
    (amountPaid !== null && entryFeeAmount !== null && amountPaid < entryFeeAmount)
  ) {
    return "Pending payment";
  }

  return "Registered";
}

function normalizePaymentStatus(
  rawPaymentStatus: string,
  status: RegistrationStatus,
  amountPaid: number | null,
  entryFeeAmount: number | null,
): PaymentStatus {
  const normalizedPaymentStatus = rawPaymentStatus.toLowerCase();
  const isPaidInFull =
    amountPaid !== null && entryFeeAmount !== null ? amountPaid >= entryFeeAmount : false;

  if (normalizedPaymentStatus.includes("paid") || status === "Confirmed" || isPaidInFull) {
    return "Paid";
  }

  if (
    normalizedPaymentStatus.includes("pending") ||
    normalizedPaymentStatus.includes("await") ||
    (amountPaid !== null && entryFeeAmount !== null && amountPaid < entryFeeAmount)
  ) {
    return "Awaiting payment";
  }

  return status === "Pending payment" ? "Awaiting payment" : "Reserved";
}

function getAmountLabel(
  registration: Record<string, unknown>,
  event: MemberEvent | undefined,
  currency: string,
) {
  const rawAmount =
    registration.total_amount ??
    registration.entry_fee_amount ??
    registration.entryFeeAmount ??
    registration.amount ??
    null;
  if (typeof rawAmount === "number" || typeof rawAmount === "string") {
    return formatPriceLabel(rawAmount, currency);
  }

  if (event && event.pricing.type === "FREE") {
    return "Included";
  }

  return "TBC";
}

function formatPriceLabel(amount: string | number, currency: string) {
  const numericAmount = Number(amount || 0);
  if (!Number.isFinite(numericAmount) || numericAmount === 0) {
    return "Included";
  }

  return formatAmount(numericAmount, currency);
}

function getRegistrationBadgeClassName(status: MemberEventRegistration["status"]) {
  if (status === "Confirmed") {
    return "border-emerald-200 bg-emerald-100 text-emerald-800";
  }

  if (status === "Pending payment") {
    return "border-amber-200 bg-amber-100 text-amber-800";
  }

  return "border-sky-200 bg-sky-100 text-sky-800";
}

function getPaymentBadgeClassName(status: MemberEventRegistration["paymentStatus"]) {
  if (status === "Paid") {
    return "border-emerald-200 bg-emerald-100 text-emerald-800";
  }

  if (status === "Awaiting payment") {
    return "border-amber-200 bg-amber-100 text-amber-800";
  }

  return "border-slate-200 bg-slate-100 text-slate-700";
}

function getShortRegistrationId(value: string) {
  return `${value.slice(0, 10)}...`;
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-muted/20 p-3">
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

function CopyableDetailItem({
  label,
  value,
  displayValue,
  copyTitle,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  displayValue: string;
  copyTitle: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="rounded-xl border bg-muted/20 p-3">
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <div className="mt-2 flex items-center gap-2">
        <p className="text-sm font-medium text-foreground">{displayValue}</p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCopy}
          title={copyTitle}
          className="h-6 w-6 p-0"
        >
          <Copy className="h-3 w-3" />
        </Button>
        {copied && <span className="text-[11px] text-muted-foreground">Copied</span>}
      </div>
      <span className="sr-only">{value}</span>
    </div>
  );
}
