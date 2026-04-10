import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFetchClub } from "@/queries/clubs";
import { getEvents, registerEvent } from "@/services/events";
import { getApiErrorMessage } from "@/utils/apiError";
import {
  formatDateKey,
  formatLongDate,
  formatRangeLabel,
  getRegistrationStatus,
  isRegistrationOpen,
  MemberEvent,
  PRICING_PREVIEW_FIELD_ID,
  sanitizeEvents,
} from "@/components/member/events/event-utils";

type PreviewFieldItem =
  | { id: string; kind: "form"; field: MemberEvent["formFields"][number] }
  | { id: string; kind: "pricing"; pricingType: "MULTIPLE" | "ADDITIONAL" };

function BackToClubButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="sticky top-4 z-20 mb-6 w-fit rounded-lg bg-white/95 backdrop-blur-sm">
      <Button variant="ghost" onClick={onClick}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Club
      </Button>
    </div>
  );
}

function formatCurrency(value: number | string) {
  const amount = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(amount)) {
    return "R0";
  }

  const actualAmount = amount / 100;

  const hasDecimals = Math.round(actualAmount * 100) % 100 !== 0;
  return `R${hasDecimals ? actualAmount.toFixed(2) : actualAmount.toFixed(0)}`;
}

export default function EventRegistrationPage() {
  const navigate = useNavigate();
  const { clubId, eventId } = useParams();
  const todayKey = useMemo(() => formatDateKey(new Date()), []);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [clubId, eventId]);

  const { data: clubData, isLoading: isClubLoading } = useFetchClub(clubId || "");
  const { data: eventsResponse, isLoading: isEventsLoading, isError } = useQuery({
    queryKey: ["member-event-registration", clubData?.club_account_id],
    queryFn: () => getEvents(clubData?.club_account_id || ""),
    enabled: !!clubData?.club_account_id,
  });

  const events = useMemo(() => {
    return sanitizeEvents(Array.isArray(eventsResponse?.events) ? eventsResponse.events : []);
  }, [eventsResponse?.events]);

  const event = useMemo(() => {
    return events.find((entry) => entry.eventId === eventId || entry.id === eventId) ?? null;
  }, [eventId, events]);

  const [formValues, setFormValues] = useState<Record<string, string | boolean>>({});
  const [pricingSelection, setPricingSelection] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pricingError, setPricingError] = useState("");
  const [isSubmittingRegistration, setIsSubmittingRegistration] = useState(false);

  useEffect(() => {
    if (!event) {
      return;
    }

    setFormValues(
      Object.fromEntries(
        event.formFields.map((field) => [field.id, field.inputType === "CHECKBOX" ? false : ""]),
      ),
    );
    setFieldErrors({});
    setPricingError("");
    setPricingSelection(
      event.pricing.type === "SINGLE" && event.pricing.options[0]
        ? [event.pricing.options[0].id]
        : [],
    );
  }, [event]);

  const orderedItems = useMemo<PreviewFieldItem[]>(() => {
    if (!event) {
      return [];
    }

    const items: PreviewFieldItem[] = event.formFields.map((field) => ({
      id: field.id,
      kind: "form",
      field,
    }));

    if (event.pricing.type === "MULTIPLE" || event.pricing.type === "ADDITIONAL") {
      items.push({
        id: PRICING_PREVIEW_FIELD_ID,
        kind: "pricing",
        pricingType: event.pricing.type,
      });
    }

    const itemMap = new Map(items.map((item) => [item.id, item]));
    return event.previewFieldOrder
      .map((id) => itemMap.get(id))
      .filter((item): item is PreviewFieldItem => Boolean(item));
  }, [event]);

  const pricingFieldLabel = useMemo(() => {
    if (!event) {
      return "";
    }

    if (event.pricing.type === "MULTIPLE") {
      return event.pricing.fieldName || "Entry category";
    }

    if (event.pricing.type === "ADDITIONAL") {
      return event.pricing.fieldName || "Divisions";
    }

    return "";
  }, [event]);

  const entryFeeAmount = useMemo(() => {
    if (!event) {
      return 0;
    }

    if (event.pricing.type === "FREE") {
      return 0;
    }

    if (event.pricing.type === "SINGLE") {
      return Number(event.pricing.options[0]?.amount ?? 0);
    }

    const selectedOptions = event.pricing.options.filter((option) =>
      pricingSelection.includes(option.id),
    );

    if (event.pricing.type === "MULTIPLE") {
      return Number(selectedOptions[0]?.amount ?? 0);
    }

    return selectedOptions.reduce((sum, option) => sum + Number(option.amount || 0), 0);
  }, [event, pricingSelection]);

  const entryFeeLabel = useMemo(() => {
    if (!event) {
      return "R0";
    }

    if (event.pricing.type === "FREE") {
      return "FREE";
    }

    return formatCurrency(entryFeeAmount);
  }, [entryFeeAmount, event]);

  const registrationStatus = useMemo(() => {
    return event ? getRegistrationStatus(event, todayKey) : null;
  }, [event, todayKey]);

  const canRegister = useMemo(() => {
    return event ? isRegistrationOpen(event, todayKey) : false;
  }, [event, todayKey]);

  const hasRegistrationInputs = orderedItems.length > 0;

  const isMemberAllowed = Boolean(clubData?.club_member_exists && clubData?.registered);

  const handleBack = () => {
    navigate(`/myclubs/${clubId}/events`);
  };

  const handleValidateForm = async () => {
    if (!event) {
      return;
    }

    const nextFieldErrors = event.formFields.reduce<Record<string, string>>((errors, field) => {
      if (!field.required) {
        return errors;
      }

      const value = formValues[field.id];
      const isMissing =
        field.inputType === "CHECKBOX"
          ? value !== true
          : typeof value !== "string" || value.trim().length === 0;

      if (isMissing) {
        errors[field.id] = `Please complete "${field.label}".`;
      }

      return errors;
    }, {});

    setFieldErrors(nextFieldErrors);

    if (
      (event.pricing.type === "MULTIPLE" || event.pricing.type === "ADDITIONAL") &&
      pricingSelection.length === 0
    ) {
      setPricingError(`Please select ${pricingFieldLabel.toLowerCase()} before continuing.`);
      return;
    }

    setPricingError("");

    if (
      Object.keys(nextFieldErrors).length === 0
    ) {
      const registrationRequest = {
        club_account_id: clubData?.club_account_id,
        event_id: event.eventId ?? event.id,
        user_id: clubData?.user_id,
        entry_fee_amount: entryFeeAmount,
        pricing_type: event.pricing.type,
        selected_pricing_option_ids: pricingSelection,
        registration_fields: [
          ...event.formFields.map((field) => ({
            field_id: field.id,
            field_label: field.label,
            input_type: field.inputType,
            value: formValues[field.id] ?? null,
          })),
        ],
      };

      try {
        setIsSubmittingRegistration(true);
        const response = await registerEvent(registrationRequest);
        toast.success(response.message || "Event registration submitted successfully.");

        if (entryFeeAmount <= 0) {
          navigate(`/myclubs/${clubId}`);
          return;
        }

        const transactionId = response.transaction_id;
        const eventId = response.event_id;
        const eventRegistrationId =
          response.event_registration_id || response.registration_id || response.id;
        const queryParams = new URLSearchParams();

        queryParams.append("tab", "bank");
        queryParams.append("paymentScreen", "true");
        if (transactionId) {
          queryParams.append("transactionId", transactionId);
        }
        if (eventId) {
          queryParams.append("eventId", eventId);
        }
        if (eventRegistrationId) {
          queryParams.append("eventRegistrationId", eventRegistrationId);
        }

        navigate(`/myclubs/${clubId}?${queryParams.toString()}`);
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Unable to submit event registration right now."));
      } finally {
        setIsSubmittingRegistration(false);
      }
    }
  };

  if (isClubLoading || isEventsLoading) {
    return (
      <div className="min-h-screen bg-white px-4 py-6 md:px-8 md:py-10">
        <BackToClubButton onClick={handleBack} />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading event registration form...
          </div>
        </div>
      </div>
    );
  }

  if (!isMemberAllowed) {
    return (
      <div className="min-h-screen bg-white px-4 py-6 md:px-8 md:py-10">
        <BackToClubButton onClick={handleBack} />
        <div className="mx-auto max-w-xl">
          <Card>
            <CardHeader>
              <CardTitle>Access Restricted</CardTitle>
              <CardDescription>
                You must be a registered member of this club to access event registrations.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  if (event && !canRegister) {
    return (
      <div className="min-h-screen bg-white px-4 py-6 md:px-8 md:py-10">
        <BackToClubButton onClick={handleBack} />
        <div className="mx-auto max-w-xl">
          <Card>
            <CardHeader>
              <CardTitle>Registration Not Open</CardTitle>
              <CardDescription>
                Registration is only available while the event registration window is open.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  if (isError || !event || !clubData?.enable_events) {
    return (
      <div className="min-h-screen bg-white px-4 py-6 md:px-8 md:py-10">
        <BackToClubButton onClick={handleBack} />
        <div className="mx-auto max-w-xl">
          <Card>
            <CardHeader>
              <CardTitle>Event Not Available</CardTitle>
              <CardDescription>
                This event registration form could not be loaded.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-4 py-6 md:px-8 md:py-10">
      <BackToClubButton onClick={handleBack} />

      <div className="mx-auto max-w-4xl space-y-6">
        <Card>
          <CardHeader className="gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-2xl">{event.title}</CardTitle>
                  {registrationStatus && (
                    <Badge variant="outline" className={registrationStatus.className}>
                      {registrationStatus.label}
                    </Badge>
                  )}
                </div>
                <CardDescription>{formatRangeLabel(event)}</CardDescription>
                <p className="text-sm font-medium text-foreground">
                  Entry fee: {entryFeeLabel}
                </p>
              </div>
            </div>

            {event.description && (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{event.description}</p>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border bg-muted/20 p-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  Event dates
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{formatRangeLabel(event)}</p>
              </div>
              <div className="rounded-lg border bg-muted/20 p-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  Registration window
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {event.registrationOpenDate && event.registrationCloseDate
                    ? `${formatLongDate(event.registrationOpenDate)} to ${formatLongDate(event.registrationCloseDate)}`
                    : "To be confirmed"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {hasRegistrationInputs && (
          <Card>
            <CardHeader>
              <CardTitle>Event Registration Form</CardTitle>
              <CardDescription>Complete the fields below to register for this event.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {orderedItems.map((item) => (
                item.kind === "form" ? (
                  <div key={item.id} className="grid gap-2 rounded-lg bg-muted/10 p-4">
                    {item.field.inputType !== "CHECKBOX" && (
                      <Label className="text-sm font-medium">{item.field.label}</Label>
                    )}

                    {item.field.inputType === "TEXT" && (
                      <Input
                        value={String(formValues[item.field.id] ?? "")}
                        onChange={(event) => {
                          const nextValue = event.target.value;
                          setFormValues((current) => ({ ...current, [item.field.id]: nextValue }));
                          if (nextValue.trim()) {
                            setFieldErrors((current) => {
                              if (!current[item.field.id]) {
                                return current;
                              }

                              const nextErrors = { ...current };
                              delete nextErrors[item.field.id];
                              return nextErrors;
                            });
                          }
                        }}
                        placeholder={item.field.placeholder || `Enter ${item.field.label.toLowerCase()}`}
                      />
                    )}

                    {item.field.inputType === "DROPDOWN" && (
                      <Select
                        value={String(formValues[item.field.id] ?? "")}
                        onValueChange={(value) => {
                          setFormValues((current) => ({ ...current, [item.field.id]: value }));
                          if (value.trim()) {
                            setFieldErrors((current) => {
                              if (!current[item.field.id]) {
                                return current;
                              }

                              const nextErrors = { ...current };
                              delete nextErrors[item.field.id];
                              return nextErrors;
                            });
                          }
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={item.field.placeholder || `Select ${item.field.label.toLowerCase()}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {item.field.options.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {item.field.inputType === "CHECKBOX" && (
                      <div className="flex items-center gap-3 rounded-md bg-background py-3">
                        <Checkbox
                          id={`event-registration-${item.field.id}`}
                          checked={formValues[item.field.id] === true}
                          onCheckedChange={(checked) => {
                            const isChecked = checked === true;
                            setFormValues((current) => ({ ...current, [item.field.id]: isChecked }));
                            if (isChecked) {
                              setFieldErrors((current) => {
                                if (!current[item.field.id]) {
                                  return current;
                                }

                                const nextErrors = { ...current };
                                delete nextErrors[item.field.id];
                                return nextErrors;
                              });
                            }
                          }}
                        />
                        <Label htmlFor={`event-registration-${item.field.id}`}>{item.field.placeholder}</Label>
                      </div>
                    )}

                    {fieldErrors[item.field.id] && (
                      <p className="text-sm font-medium text-destructive">{fieldErrors[item.field.id]}</p>
                    )}
                  </div>
                ) : item.pricingType === "MULTIPLE" ? (
                  <div key={item.id} className="grid gap-2 rounded-lg bg-muted/10 p-4">
                    <Label className="text-sm font-medium">{pricingFieldLabel}</Label>
                    <Select
                      value={pricingSelection[0] ?? ""}
                      onValueChange={(value) => {
                        setPricingSelection([value]);
                        setPricingError("");
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={`Select ${pricingFieldLabel.toLowerCase()}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {event.pricing.options.map((option) => (
                          <SelectItem key={option.id} value={option.id}>
                            {option.label} ({formatCurrency(option.amount)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {pricingError && <p className="text-sm font-medium text-destructive">{pricingError}</p>}
                  </div>
                ) : (
                  <div key={item.id} className="grid gap-2 rounded-lg bg-muted/10 p-4">
                    <Label className="text-sm font-medium">{pricingFieldLabel}</Label>
                    <div className="space-y-2">
                      {event.pricing.options.map((option) => {
                        const isSelected = pricingSelection.includes(option.id);

                        return (
                          <div key={option.id} className="flex items-center justify-between rounded-md border px-3 py-3">
                            <div className="flex items-center gap-3">
                              <Checkbox
                                id={`event-pricing-${option.id}`}
                                checked={isSelected}
                                onCheckedChange={(checked) => {
                                  setPricingSelection((current) => {
                                    const nextSelection =
                                      checked === true
                                        ? current.includes(option.id)
                                          ? current
                                          : [...current, option.id]
                                        : current.filter((id) => id !== option.id);
                                    if (nextSelection.length > 0) {
                                      setPricingError("");
                                    }
                                    return nextSelection;
                                  });
                                }}
                              />
                              <Label htmlFor={`event-pricing-${option.id}`}>{option.label}</Label>
                            </div>
                            <span className="text-sm font-medium">{formatCurrency(option.amount)}</span>
                          </div>
                        );
                      })}
                    </div>
                    {pricingError && <p className="text-sm font-medium text-destructive">{pricingError}</p>}
                  </div>
                )
              ))}

              <div className="flex justify-end border-t pt-4">
                <Button type="button" onClick={handleValidateForm} disabled={isSubmittingRegistration}>
                  {isSubmittingRegistration ? "Submitting..." : "Register"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {!hasRegistrationInputs && (
          <div className="flex justify-end border-t pt-4">
            <Button type="button" onClick={handleValidateForm} disabled={isSubmittingRegistration}>
              {isSubmittingRegistration ? "Submitting..." : "Register"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}