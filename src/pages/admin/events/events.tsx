import * as React from "react";
import {
  DndContext,
  DragEndEvent,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Loader2,
  MenuIcon,
  Pencil,
  Plus,
  Settings,
  Trash2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClubContext, ClubContextType } from "@/context/ClubContext";
import { updateClubDetails } from "@/services/admin/club";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createOrUpdateEvents, getEvents } from "@/services/admin-features/events";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { formatAmount } from "@/data/currencies";
import { cn } from "@/lib/utils";
import { getApiErrorMessage } from "@/utils/apiError";
import { toast } from "sonner";

type EventFormInputType = "TEXT" | "DROPDOWN" | "CHECKBOX";

type EventFieldVariant = EventFormInputType;

type EventFormField = {
  id: string;
  label: string;
  inputType: EventFormInputType;
  required: boolean;
  placeholder: string;
  options: string[];
};

type EventPricingType = "FREE" | "SINGLE" | "MULTIPLE" | "ADDITIONAL";

type EventPricingOption = {
  id: string;
  label: string;
  amount: string;
};

type EventPricing = {
  type: EventPricingType;
  fieldName: string;
  options: EventPricingOption[];
};

type EventItem = {
  id: string;
  eventId?: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  registrationOpenDate: string;
  registrationCloseDate: string;
  colorClass: string;
  formFields: EventFormField[];
  pricing: EventPricing;
  previewFieldOrder: string[];
};

type PreviewFieldItem =
  | { id: string; kind: "form"; field: EventFormField }
  | { id: string; kind: "pricing"; pricingType: "MULTIPLE" | "ADDITIONAL" };

type EventFormState = {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  registrationOpenDate: string;
  registrationCloseDate: string;
};

type EventFieldDraft = {
  label: string;
  variant: EventFieldVariant;
  required: boolean;
  placeholder: string;
  optionsText: string;
};

type EventPricingDraft = {
  label: string;
  amount: string;
};

const PRICING_PREVIEW_FIELD_ID = "pricing-field";
const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const REMOVED_MOCK_EVENT_IDS = new Set(["launch-regatta", "junior-camp"]);
const FIELD_TYPE_OPTIONS: {
  value: EventFieldVariant;
  label: string;
  inputType: EventFormInputType;
}[] = [
  {
    value: "TEXT",
    label: "Text",
    inputType: "TEXT",
  },
  {
    value: "DROPDOWN",
    label: "Dropdown",
    inputType: "DROPDOWN",
  },
  {
    value: "CHECKBOX",
    label: "Checkbox",
    inputType: "CHECKBOX",
  },
];
const PRICING_TYPE_OPTIONS: { value: EventPricingType; label: string; description: string }[] = [
  {
    value: "FREE",
    label: "Free",
    description: "No entry cost for this event.",
  },
  {
    value: "SINGLE",
    label: "Fixed price",
    description: "One fee per entry, for example R100 for each entry.",
  },
  {
    value: "MULTIPLE",
    label: "Selectable pricing",
    description: "Offer several price options and let the registrant choose one, for example Junior or Senior.",
  },
  {
    value: "ADDITIONAL",
    label: "Add-on pricing",
    description: "Offer extra price options that can be combined, for example U12 plus U15.",
  },
];
const EVENT_COLORS = ["bg-sky-100 text-sky-800 border-sky-200"];

const today = new Date();
const todayKey = formatDateKey(today);

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateKey(value: string) {
  return new Date(`${value}T00:00:00`);
}

function dateKeyToEpoch(value: string) {
  return parseDateKey(value).getTime();
}

function epochToDateKey(value: number) {
  return formatDateKey(new Date(value));
}

function getMonthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getMonthEnd(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function getCalendarGrid(date: Date) {
  const monthStart = getMonthStart(date);
  const monthEnd = getMonthEnd(date);
  const startOffset = (monthStart.getDay() + 6) % 7;
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - startOffset);

  const endOffset = 6 - ((monthEnd.getDay() + 6) % 7);
  const gridEnd = new Date(monthEnd);
  gridEnd.setDate(monthEnd.getDate() + endOffset);

  const days: Date[] = [];
  const cursor = new Date(gridStart);
  while (cursor <= gridEnd) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}

function isEventOnDay(event: EventItem, dayKey: string) {
  return event.startDate <= dayKey && event.endDate >= dayKey;
}

function getEventDuration(event: EventItem) {
  const start = parseDateKey(event.startDate).getTime();
  const end = parseDateKey(event.endDate).getTime();
  return Math.floor((end - start) / 86400000) + 1;
}

function formatLongDate(dateKey: string) {
  return parseDateKey(dateKey).toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatMonthLabel(date: Date) {
  return date.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

function getRangeLabel(event: EventItem) {
  if (event.startDate === event.endDate) {
    return formatLongDate(event.startDate);
  }

  const start = parseDateKey(event.startDate).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
  const end = parseDateKey(event.endDate).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return `${start} - ${end}`;
}

function getDefaultFieldDraft(): EventFieldDraft {
  return {
    label: "",
    variant: "TEXT",
    required: true,
    placeholder: "",
    optionsText: "",
  };
}

function getDefaultPricing(): EventPricing {
  return {
    type: "FREE",
    fieldName: "",
    options: [],
  };
}

function getDefaultPricingDraft(): EventPricingDraft {
  return {
    label: "",
    amount: "",
  };
}

function getFieldConfig(variant: EventFieldVariant) {
  return FIELD_TYPE_OPTIONS.find((option) => option.value === variant) ?? FIELD_TYPE_OPTIONS[0];
}

function getFieldVariant(inputType: EventFormInputType): EventFieldVariant {
  const match = FIELD_TYPE_OPTIONS.find((option) => option.inputType === inputType);

  return match?.value ?? "TEXT";
}

function sanitizeField(rawField: Partial<EventFormField>): EventFormField | null {
  if (!rawField.label || typeof rawField.label !== "string") {
    return null;
  }

  let nextInputType: EventFormInputType = "TEXT";

  if (
    rawField.inputType === "TEXT" ||
    rawField.inputType === "DROPDOWN" ||
    rawField.inputType === "CHECKBOX"
  ) {
    nextInputType = rawField.inputType;
  } else if ((rawField as { type?: string }).type === "select") {
    nextInputType = "DROPDOWN";
  } else if ((rawField as { type?: string }).type === "checkbox") {
    nextInputType = "CHECKBOX";
  }

  return {
    id: rawField.id || `field-${Date.now()}-${Math.random()}`,
    label: rawField.label.trim(),
    inputType: nextInputType,
    required: Boolean(rawField.required),
    placeholder: rawField.placeholder?.trim() || "",
    options:
      nextInputType === "DROPDOWN"
        ? (rawField.options || []).map((option) => option.trim()).filter(Boolean)
        : [],
  };
}

function sanitizePricing(rawPricing: Partial<EventPricing> | undefined): EventPricing {
  const nextType: EventPricingType =
    rawPricing?.type === "SINGLE" ||
    rawPricing?.type === "MULTIPLE" ||
    rawPricing?.type === "ADDITIONAL"
      ? rawPricing.type
      : "FREE";

  const rawOptions = Array.isArray(rawPricing?.options) ? rawPricing?.options : [];

  return {
    type: nextType,
    fieldName:
      nextType === "MULTIPLE" || nextType === "ADDITIONAL"
        ? rawPricing?.fieldName?.trim() || ""
        : "",
    options:
      nextType === "FREE"
        ? []
        : rawOptions
            .map((option) => ({
              id: option.id || `pricing-${Date.now()}-${Math.random()}`,
              label: option.label?.trim() || "",
              amount: option.amount?.toString().trim() || "",
            }))
            .filter((option) => option.label && option.amount),
  };
}

function sanitizeRegistrationDate(value: unknown, fallback: string) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return epochToDateKey(value);
  }

  return typeof value === "string" && value.trim() ? value : fallback;
}

function sanitizeEventIdentifier(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function sanitizeEventText(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function getPricingSummary(pricing: EventPricing) {
  switch (pricing.type) {
    case "FREE":
      return "Free";
    case "SINGLE":
      return pricing.options[0] ? `${formatCurrency(pricing.options[0].amount)} per entry` : "Fixed price";
    case "MULTIPLE":
      return pricing.options.length > 0
        ? pricing.options.map((option) => `${option.label}: ${formatCurrency(option.amount)}`).join(" | ")
        : "Selectable pricing";
    case "ADDITIONAL":
      return pricing.options.length > 0
        ? pricing.options.map((option) => `${option.label}: ${formatCurrency(option.amount)}`).join(" + ")
        : "Add-on pricing";
    default:
      return "Free";
  }
}

function getPricingAmount(option: EventPricingOption) {
  const amount = Number(option.amount);
  return Number.isFinite(amount) ? amount : 0;
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

function formatPriceBadgeAmount(value: number | string) {
  const amount = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(amount) || amount <= 0) {
    return "FREE";
  }

  return formatCurrency(amount);
}

function getPreviewFieldIds(formFields: EventFormField[], pricing: EventPricing) {
  const ids = formFields.map((field) => field.id);

  if (pricing.type === "MULTIPLE" || pricing.type === "ADDITIONAL") {
    ids.push(PRICING_PREVIEW_FIELD_ID);
  }

  return ids;
}

function sanitizePreviewFieldOrder(
  rawOrder: unknown,
  formFields: EventFormField[],
  pricing: EventPricing,
) {
  const availableIds = getPreviewFieldIds(formFields, pricing);
  const requestedOrder = Array.isArray(rawOrder)
    ? rawOrder.filter((value): value is string => typeof value === "string")
    : [];

  const orderedIds = requestedOrder.filter(
    (id, index) => availableIds.includes(id) && requestedOrder.indexOf(id) === index,
  );

  return [...orderedIds, ...availableIds.filter((id) => !orderedIds.includes(id))];
}

function areStringArraysEqual(left: string[], right: string[]) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function buildEventRequestPayload(params: {
  clubAccountId: string;
  eventId?: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  registrationOpenDate: string;
  registrationCloseDate: string;
  formFields: EventFormField[];
  pricing: EventPricing;
  previewFieldOrder: string[];
}) {
  return {
    club_account_id: params.clubAccountId,
    event_id: params.eventId,
    title: sanitizeEventText(params.title).trim(),
    description: sanitizeEventText(params.description).trim(),
    startDate: dateKeyToEpoch(params.startDate),
    endDate: dateKeyToEpoch(params.endDate),
    registrationOpenDate: dateKeyToEpoch(params.registrationOpenDate),
    registrationCloseDate: dateKeyToEpoch(params.registrationCloseDate),
    formFields: params.formFields,
    pricing: params.pricing,
    previewFieldOrder: params.previewFieldOrder,
  };
}

function SortablePreviewField({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("rounded-lg", isDragging && "opacity-60")}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="inline-flex self-center rounded-md p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          aria-label="Reorder field"
          {...attributes}
          {...listeners}
        >
          <MenuIcon className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}

function sanitizeLoadedEvents(events: EventItem[]) {
  return events
    .filter((event) => !REMOVED_MOCK_EVENT_IDS.has(event.id))
    .map((event) => {
      const formFields = Array.isArray(event.formFields)
        ? event.formFields.map(sanitizeField).filter(Boolean) as EventFormField[]
        : [];
      const pricing = sanitizePricing(event.pricing);
      const startDate = sanitizeRegistrationDate(event.startDate, todayKey);
      const endDate = sanitizeRegistrationDate(event.endDate, startDate);

      return {
        ...event,
        id: sanitizeEventIdentifier(event.id, `${event.title ?? "event"}-${Date.now()}`),
        eventId: sanitizeEventIdentifier((event as { event_id?: unknown }).event_id, event.id),
        title: sanitizeEventText(event.title),
        description: sanitizeEventText(event.description),
        startDate,
        endDate,
        registrationOpenDate: sanitizeRegistrationDate(event.registrationOpenDate, startDate),
        registrationCloseDate: sanitizeRegistrationDate(event.registrationCloseDate, endDate),
        colorClass: EVENT_COLORS[0],
        formFields,
        pricing,
        previewFieldOrder: sanitizePreviewFieldOrder(event.previewFieldOrder, formFields, pricing),
      };
    });
}

export default function EventsPage() {
  const { club, setClub } = React.useContext(ClubContext) as ClubContextType;
  const [events, setEvents] = React.useState<EventItem[]>([]);
  const [monthDate, setMonthDate] = React.useState(() => getMonthStart(today));
  const [selectedDate, setSelectedDate] = React.useState(todayKey);
  const [isEditorOpen, setIsEditorOpen] = React.useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);
  const [editingEventId, setEditingEventId] = React.useState<string | null>(null);
  const [editingFieldId, setEditingFieldId] = React.useState<string | null>(null);
  const [previewEventId, setPreviewEventId] = React.useState<string | null>(null);
  const [previewValues, setPreviewValues] = React.useState<Record<string, string | boolean>>({});
  const [previewPricingSelection, setPreviewPricingSelection] = React.useState<string[]>([]);
  const [previewFieldOrder, setPreviewFieldOrder] = React.useState<string[]>([]);
  const [previewFieldErrors, setPreviewFieldErrors] = React.useState<Record<string, string>>({});
  const [previewError, setPreviewError] = React.useState("");
  const [formError, setFormError] = React.useState("");
  const [formState, setFormState] = React.useState<EventFormState>({
    title: "",
    description: "",
    startDate: todayKey,
    endDate: todayKey,
    registrationOpenDate: todayKey,
    registrationCloseDate: todayKey,
  });
  const [eventFormFields, setEventFormFields] = React.useState<EventFormField[]>([]);
  const [fieldDraft, setFieldDraft] = React.useState<EventFieldDraft>(getDefaultFieldDraft());
  const [pricing, setPricing] = React.useState<EventPricing>(getDefaultPricing());
  const [pricingDraft, setPricingDraft] = React.useState<EventPricingDraft>(getDefaultPricingDraft());
  const [isTogglingEvents, setIsTogglingEvents] = React.useState(false);
  const [isSavingPreviewOrder, setIsSavingPreviewOrder] = React.useState(false);
  const [isSavingEvent, setIsSavingEvent] = React.useState(false);
  const [showEventsSettings, setShowEventsSettings] = React.useState(false);

  const handleToggleEvents = React.useCallback(
    async (enabled: boolean) => {
      if (!club?.club_account_id) {
        return;
      }

      try {
        setIsTogglingEvents(true);
        const response = await updateClubDetails({
          club_account_id: club.club_account_id,
          enable_events: enabled,
        });

        if (response?.message) {
          toast.success(enabled ? "Events enabled successfully" : "Events disabled successfully");
          if (club) {
            setClub({ ...club, enable_events: enabled });
          }
        } else {
          toast.error("Failed to update events settings");
        }
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Error updating events settings"));
      } finally {
        setIsTogglingEvents(false);
      }
    },
    [club, setClub],
  );

  React.useEffect(() => {
    if (!club?.club_account_id) {
      setEvents([]);
      return;
    }

    let isActive = true;

    getEvents(club.club_account_id)
      .then((response) => {
        if (!isActive) {
          return;
        }

        const nextEvents = Array.isArray(response.events)
          ? sanitizeLoadedEvents(response.events as EventItem[])
          : [];

        setEvents(nextEvents);
      })
      .catch(() => {
        if (!isActive) {
          return;
        }

        setEvents([]);
      });

    return () => {
      isActive = false;
    };
  }, [club?.club_account_id]);

  const calendarDays = React.useMemo(() => getCalendarGrid(monthDate), [monthDate]);

  const sortedEvents = React.useMemo(() => {
    return [...events].sort((left, right) => {
      if (left.startDate !== right.startDate) {
        return left.startDate.localeCompare(right.startDate);
      }

      if (left.endDate !== right.endDate) {
        return left.endDate.localeCompare(right.endDate);
      }

      return left.title.localeCompare(right.title);
    });
  }, [events]);

  const selectedDateEvents = React.useMemo(() => {
    return sortedEvents.filter((event) => isEventOnDay(event, selectedDate));
  }, [selectedDate, sortedEvents]);

  const upcomingEvents = React.useMemo(() => {
    return sortedEvents.filter((event) => event.endDate >= todayKey).slice(0, 5);
  }, [sortedEvents]);

  const multiDayCount = React.useMemo(() => {
    return sortedEvents.filter((event) => event.startDate !== event.endDate).length;
  }, [sortedEvents]);

  const editingEvent = React.useMemo(
    () => events.find((event) => event.id === editingEventId) ?? null,
    [editingEventId, events],
  );

  const openCreateDialog = React.useCallback(
    (dateKey?: string) => {
      const nextDate = dateKey ?? selectedDate;
      setFormError("");
      setEditingEventId(null);
      setEditingFieldId(null);
      setPreviewEventId(null);
      setIsPreviewOpen(false);
      setFormState({
        title: "",
        description: "",
        startDate: nextDate,
        endDate: nextDate,
        registrationOpenDate: nextDate,
        registrationCloseDate: nextDate,
      });
      setEventFormFields([]);
      setFieldDraft(getDefaultFieldDraft());
      setPricing(getDefaultPricing());
      setPricingDraft(getDefaultPricingDraft());
      setPreviewFieldOrder([]);
      setIsEditorOpen(true);
    },
    [selectedDate],
  );

  const openEditDialog = React.useCallback((event: EventItem) => {
    setFormError("");
    setEditingEventId(event.id);
    setEditingFieldId(null);
    setPreviewEventId(null);
    setIsPreviewOpen(false);
    setFormState({
      title: sanitizeEventText(event.title),
      description: sanitizeEventText(event.description),
      startDate: event.startDate,
      endDate: event.endDate,
      registrationOpenDate: event.registrationOpenDate,
      registrationCloseDate: event.registrationCloseDate,
    });
    setEventFormFields(event.formFields);
    setFieldDraft(getDefaultFieldDraft());
    setPricing(sanitizePricing(event.pricing));
    setPricingDraft(getDefaultPricingDraft());
    setPreviewFieldOrder(event.previewFieldOrder);
    setIsEditorOpen(true);
  }, []);

  const openPreviewPanel = React.useCallback((event: EventItem) => {
    setFormError("");
    setPreviewError("");
    setPreviewFieldErrors({});
    setIsEditorOpen(false);
    setIsPreviewOpen(true);
    setPreviewEventId(event.id);
    setPreviewValues(
      Object.fromEntries(
        event.formFields.map((field) => [field.id, field.inputType === "CHECKBOX" ? false : ""]),
      ),
    );
    setPreviewFieldOrder(event.previewFieldOrder);
    setPreviewPricingSelection(
      event.pricing.type === "SINGLE" && event.pricing.options[0]
        ? [event.pricing.options[0].id]
        : [],
    );
  }, []);

  const resetEditorState = React.useCallback((open: boolean) => {
    setIsEditorOpen(open);

    if (!open) {
      setEditingEventId(null);
      setEditingFieldId(null);
      setFormError("");
      setFieldDraft(getDefaultFieldDraft());
      setPricingDraft(getDefaultPricingDraft());
      setIsPreviewOpen(false);
      setPreviewEventId(null);
      setPreviewValues({});
      setPreviewPricingSelection([]);
      setPreviewFieldOrder([]);
      setPreviewFieldErrors({});
      setPreviewError("");
    }
  }, []);

  const handleAddFormField = () => {
    const nextLabel = fieldDraft.label.trim();
    const nextPlaceholder = fieldDraft.placeholder.trim();
    const nextOptions = fieldDraft.optionsText
      .split("\n")
      .map((option) => option.trim())
      .filter(Boolean);
    const fieldConfig = getFieldConfig(fieldDraft.variant);

    if (!nextLabel) {
      setFormError("Each event form field needs a label.");
      return;
    }

    if (fieldConfig.inputType === "DROPDOWN" && nextOptions.length === 0) {
      setFormError("Dropdown fields need at least one option.");
      return;
    }

    setFormError("");
    const nextField: EventFormField = {
      id: editingFieldId ?? `event-field-${Date.now()}`,
      label: nextLabel,
      inputType: fieldConfig.inputType,
      required: fieldDraft.required,
      placeholder: nextPlaceholder,
      options: fieldConfig.inputType === "DROPDOWN" ? nextOptions : [],
    };

    setEventFormFields((current) => {
      if (!editingFieldId) {
        return [...current, nextField];
      }

      return current.map((field) => (field.id === editingFieldId ? nextField : field));
    });

    setEditingFieldId(null);
    setFieldDraft(getDefaultFieldDraft());
  };

  const handleEditFormField = (field: EventFormField) => {
    setFormError("");
    setEditingFieldId(field.id);
    setFieldDraft({
      label: field.label,
      variant: getFieldVariant(field.inputType),
      required: field.required,
      placeholder: field.placeholder,
      optionsText: field.options.join("\n"),
    });
  };

  const handleCancelFieldEdit = () => {
    setEditingFieldId(null);
    setFieldDraft(getDefaultFieldDraft());
  };

  const handleRemoveFormField = (fieldId: string) => {
    setEventFormFields((current) => current.filter((field) => field.id !== fieldId));
  };

  const handleAddPricingOption = () => {
    const nextLabel = pricingDraft.label.trim();
    const nextAmount = pricingDraft.amount.trim();
    const nextAmountValue = Number(nextAmount);

    if (pricing.type === "FREE") {
      return;
    }

    if (pricing.type !== "SINGLE" && !nextLabel) {
      setFormError("Each price option needs a label.");
      return;
    }

    if (!nextAmount || !Number.isFinite(nextAmountValue) || nextAmountValue <= 0) {
      setFormError("Each price option needs a valid amount greater than zero.");
      return;
    }

    if (pricing.type === "SINGLE") {
      setPricing({
        type: pricing.type,
        fieldName: "",
        options: [
          {
            id: pricing.options[0]?.id ?? `pricing-${Date.now()}`,
            label: nextLabel || "Fixed price",
            amount: nextAmount,
          },
        ],
      });
    } else {
      setPricing((current) => ({
        ...current,
        options: [
          ...current.options,
          {
            id: `pricing-${Date.now()}`,
            label: nextLabel,
            amount: nextAmount,
          },
        ],
      }));
    }

    setFormError("");
    setPricingDraft(getDefaultPricingDraft());
  };

  const handleRemovePricingOption = (optionId: string) => {
    setPricing((current) => ({
      ...current,
      options: current.options.filter((option) => option.id !== optionId),
    }));
  };

  const handleSaveEvent = async () => {
    const title = sanitizeEventText(formState.title).trim();
    const description = sanitizeEventText(formState.description).trim();
    const isKeepingExistingStartDate = Boolean(
      editingEvent && editingEvent.startDate === formState.startDate,
    );
    const isUpdatingExistingPastEvent = Boolean(
      editingEvent && isKeepingExistingStartDate && editingEvent.startDate < todayKey,
    );
    const showSaveError = (message: string) => {
      setFormError(message);
      toast.error(message);
    };

    setFormError("");

    if (!club?.club_account_id) {
      showSaveError("A club must be selected before saving an event.");
      return;
    }

    if (!title) {
      showSaveError("Event title is required.");
      return;
    }

    if (!formState.startDate || !formState.endDate) {
      showSaveError("Start and end dates are required.");
      return;
    }

    if (!formState.registrationOpenDate || !formState.registrationCloseDate) {
      showSaveError("Registration open and close dates are required.");
      return;
    }

    if (formState.startDate < todayKey && !isKeepingExistingStartDate) {
      showSaveError("Events cannot start in the past.");
      return;
    }

    if (formState.endDate < formState.startDate) {
      showSaveError("End date cannot be before the start date.");
      return;
    }

    if (formState.registrationCloseDate < formState.registrationOpenDate) {
      showSaveError("Registration close date cannot be before the registration open date.");
      return;
    }

    if (formState.registrationCloseDate > formState.startDate && !isUpdatingExistingPastEvent) {
      showSaveError("Registration must close on or before the event start date.");
      return;
    }

    if (pricing.type !== "FREE" && pricing.options.length === 0) {
      showSaveError("Add at least one pricing option, or set the event pricing to Free.");
      return;
    }

    const sanitizedPreviewFieldOrder = sanitizePreviewFieldOrder(
      editingEvent?.previewFieldOrder,
      eventFormFields,
      pricing,
    );

    const eventRequestPayload = buildEventRequestPayload({
      clubAccountId: club.club_account_id,
      eventId: editingEvent?.eventId,
      title,
      description,
      startDate: formState.startDate,
      endDate: formState.endDate,
      registrationOpenDate: formState.registrationOpenDate,
      registrationCloseDate: formState.registrationCloseDate,
      formFields: eventFormFields,
      pricing,
      previewFieldOrder: sanitizedPreviewFieldOrder,
    });

    try {
      setIsSavingEvent(true);
      await createOrUpdateEvents(eventRequestPayload);
    } catch (error) {
      const message = getApiErrorMessage(error, "Unable to save the event right now.");
      setFormError(message);
      toast.error(message);
      return;
    } finally {
      setIsSavingEvent(false);
    }

    toast.success(editingEventId ? "Event updated successfully" : "Event saved successfully");

    const nextEvent: EventItem = {
      id: editingEventId ?? `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`,
      eventId: editingEvent?.eventId,
      title,
      description,
      startDate: formState.startDate,
      endDate: formState.endDate,
      registrationOpenDate: formState.registrationOpenDate,
      registrationCloseDate: formState.registrationCloseDate,
      colorClass: EVENT_COLORS[0],
      formFields: eventFormFields,
      pricing,
      previewFieldOrder: sanitizedPreviewFieldOrder,
    };

    setEvents((current) => {
      if (!editingEventId) {
        return [...current, nextEvent];
      }

      return current.map((event) => (event.id === editingEventId ? nextEvent : event));
    });
    setSelectedDate(formState.startDate);
    setMonthDate(getMonthStart(parseDateKey(formState.startDate)));
    resetEditorState(false);
  };

  const handleDeleteEvent = (eventId: string) => {
    setEvents((current) => current.filter((event) => event.id !== eventId));
  };

  const previewEvent = React.useMemo(
    () => events.find((event) => event.id === previewEventId) ?? null,
    [events, previewEventId],
  );

  const previewPricingTotal = React.useMemo(() => {
    if (!previewEvent || previewEvent.pricing.type === "FREE") {
      return 0;
    }

    const selectedOptions = previewEvent.pricing.options.filter((option) =>
      previewPricingSelection.includes(option.id),
    );

    return selectedOptions.reduce((sum, option) => sum + getPricingAmount(option), 0);
  }, [previewEvent, previewPricingSelection]);

  const previewPricingFieldLabel = React.useMemo(() => {
    if (!previewEvent) {
      return "";
    }

    switch (previewEvent.pricing.type) {
      case "MULTIPLE":
        return previewEvent.pricing.fieldName || "Entry category";
      case "ADDITIONAL":
        return previewEvent.pricing.fieldName || "Divisions";
      default:
        return "";
    }
  }, [previewEvent]);

  const previewPriceBadgeLabel = React.useMemo(() => {
    if (!previewEvent) {
      return "FREE";
    }

    switch (previewEvent.pricing.type) {
      case "FREE":
        return "FREE";
      case "SINGLE": {
        const option = previewEvent.pricing.options[0];
        return option ? formatPriceBadgeAmount(option.amount) : "FREE";
      }
      case "MULTIPLE": {
        const selectedOption = previewEvent.pricing.options.find((option) =>
          previewPricingSelection.includes(option.id),
        );
        return selectedOption
          ? formatPriceBadgeAmount(selectedOption.amount)
          : `R0`;
      }
      case "ADDITIONAL":
        return previewPricingSelection.length > 0
          ? formatPriceBadgeAmount(previewPricingTotal)
          : `R0`;
      default:
        return "FREE";
    }
  }, [previewEvent, previewPricingSelection, previewPricingTotal]);

  const handlePreviewSubmit = React.useCallback(() => {
    if (!previewEvent) {
      return;
    }

    const nextFieldErrors = previewEvent.formFields.reduce<Record<string, string>>((errors, field) => {
      if (!field.required) {
        return errors;
      }

      const value = previewValues[field.id];
      const isMissing =
        field.inputType === "CHECKBOX"
          ? value !== true
          : typeof value !== "string" || value.trim().length === 0;

      if (isMissing) {
        errors[field.id] = `Please complete "${field.label}" before submitting the preview form.`;
      }

      return errors;
    }, {});

    setPreviewFieldErrors(nextFieldErrors);

    if (
      (previewEvent.pricing.type === "MULTIPLE" || previewEvent.pricing.type === "ADDITIONAL") &&
      previewPricingSelection.length === 0
    ) {
      setPreviewError(`Please select ${previewPricingFieldLabel.toLowerCase()} before submitting the preview form.`);
      return;
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setPreviewError("");
      return;
    }

    setPreviewError("");
  }, [previewEvent, previewPricingFieldLabel, previewPricingSelection.length, previewValues]);

  const hasPreviewFormFields = React.useMemo(() => {
    if (!previewEvent) {
      return false;
    }

    return (
      previewEvent.formFields.length > 0 ||
      previewEvent.pricing.type === "MULTIPLE" ||
      previewEvent.pricing.type === "ADDITIONAL"
    );
  }, [previewEvent]);

  const savedPreviewFieldOrder = React.useMemo(() => {
    if (!previewEvent) {
      return [];
    }

    return sanitizePreviewFieldOrder(previewEvent.previewFieldOrder, previewEvent.formFields, previewEvent.pricing);
  }, [previewEvent]);

  const previewFieldItems = React.useMemo<PreviewFieldItem[]>(() => {
    if (!previewEvent) {
      return [];
    }

    const items: PreviewFieldItem[] = previewEvent.formFields.map((field) => ({
      id: field.id,
      kind: "form",
      field,
    }));

    if (previewEvent.pricing.type === "MULTIPLE" || previewEvent.pricing.type === "ADDITIONAL") {
      items.push({
        id: PRICING_PREVIEW_FIELD_ID,
        kind: "pricing",
        pricingType: previewEvent.pricing.type,
      });
    }

    const itemMap = new Map(items.map((item) => [item.id, item]));
    const orderedIds = sanitizePreviewFieldOrder(previewFieldOrder, previewEvent.formFields, previewEvent.pricing);

    return orderedIds
      .map((id) => itemMap.get(id))
      .filter((item): item is PreviewFieldItem => Boolean(item));
  }, [previewEvent, previewFieldOrder]);

  const hasUnsavedPreviewOrderChanges = React.useMemo(() => {
    return !areStringArraysEqual(previewFieldOrder, savedPreviewFieldOrder);
  }, [previewFieldOrder, savedPreviewFieldOrder]);

  const handlePreviewDragEnd = React.useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    setPreviewFieldOrder((current) => {
      const oldIndex = current.indexOf(String(active.id));
      const newIndex = current.indexOf(String(over.id));

      if (oldIndex === -1 || newIndex === -1) {
        return current;
      }

      return arrayMove(current, oldIndex, newIndex);
    });
  }, []);

  const handleSavePreviewFieldOrder = React.useCallback(async () => {
    if (!club?.club_account_id || !previewEventId || !previewEvent) {
      return;
    }

    const nextOrder = sanitizePreviewFieldOrder(previewFieldOrder, previewEvent.formFields, previewEvent.pricing);

    const eventRequestPayload = buildEventRequestPayload({
      clubAccountId: club.club_account_id,
      eventId: previewEvent.eventId ?? previewEvent.id,
      title: previewEvent.title,
      description: previewEvent.description,
      startDate: previewEvent.startDate,
      endDate: previewEvent.endDate,
      registrationOpenDate: previewEvent.registrationOpenDate,
      registrationCloseDate: previewEvent.registrationCloseDate,
      formFields: previewEvent.formFields,
      pricing: previewEvent.pricing,
      previewFieldOrder: nextOrder,
    });

    try {
      setIsSavingPreviewOrder(true);
      await createOrUpdateEvents(eventRequestPayload);
      setEvents((current) =>
        current.map((event) =>
          event.id === previewEventId
            ? { ...event, previewFieldOrder: nextOrder }
            : event,
        ),
      );
      toast.success("Preview field order saved successfully");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to save the field order right now."));
    } finally {
      setIsSavingPreviewOrder(false);
    }
  }, [club?.club_account_id, previewEvent, previewEventId, previewFieldOrder]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Events</h1>
          <p className="text-muted-foreground">
            Add one-day or multi-day events directly onto your club calendar.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowEventsSettings(true)}
            title="Events settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button className="gap-2" onClick={() => openCreateDialog()}>
            <Plus className="h-4 w-4" />
            Add Event
          </Button>
        </div>
      </div>

      {!club?.enable_events && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="flex items-center justify-between gap-4 py-3">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-semibold text-orange-900">Events are currently disabled</p>
                <p className="text-sm text-orange-700">
                  Enable events to allow your club to manage and publish event registrations.
                </p>
              </div>
            </div>
            <Button
              onClick={() => handleToggleEvents(true)}
              disabled={isTogglingEvents}
              className="bg-orange-600 text-white hover:bg-orange-700"
            >
              {isTogglingEvents ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enabling...
                </>
              ) : (
                "Enable Events"
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total scheduled</CardDescription>
            <CardTitle className="text-3xl">{sortedEvents.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              All upcoming and historical events saved in this calendar.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Multi-day events</CardDescription>
            <CardTitle className="text-3xl">{multiDayCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Events running across two or more consecutive dates.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Selected day</CardDescription>
            <CardTitle className="text-lg">{formatLongDate(selectedDate)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {selectedDateEvents.length === 0
                ? "No events on this date yet."
                : `${selectedDateEvents.length} event${selectedDateEvents.length === 1 ? "" : "s"} scheduled.`}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <div className="perspective-[1600px] min-h-[820px]">
          <AnimatePresence mode="wait" initial={false}>
            {!isEditorOpen && !isPreviewOpen ? (
              <motion.div
                key="calendar-view"
                initial={{ opacity: 0, rotateY: -18, x: -20 }}
                animate={{ opacity: 1, rotateY: 0, x: 0 }}
                exit={{ opacity: 0, rotateY: 18, x: 20 }}
                transition={{ duration: 0.28, ease: "easeInOut" }}
                style={{ transformStyle: "preserve-3d" }}
              >
                <Card>
                  <CardHeader className="flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle>{formatMonthLabel(monthDate)}</CardTitle>
                      <CardDescription>
                        Click a day to inspect it or add a new event.
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          setMonthDate(
                            new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1),
                          )
                        }
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setMonthDate(getMonthStart(today));
                          setSelectedDate(todayKey);
                        }}
                      >
                        Today
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          setMonthDate(
                            new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1),
                          )
                        }
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4">
                    <div className="grid grid-cols-7 gap-2 pb-2">
                      {WEEK_DAYS.map((day) => (
                        <div
                          key={day}
                          className="px-2 py-1 text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground"
                        >
                          {day}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                      {calendarDays.map((date) => {
                        const dayKey = formatDateKey(date);
                        const isCurrentMonth = date.getMonth() === monthDate.getMonth();
                        const isSelected = selectedDate === dayKey;
                        const isToday = dayKey === todayKey;
                        const isPastDay = dayKey < todayKey;
                        const dayEvents = sortedEvents.filter((event) => isEventOnDay(event, dayKey));

                        return (
                          <button
                            key={dayKey}
                            type="button"
                            disabled={isPastDay}
                            onClick={() => setSelectedDate(dayKey)}
                            onDoubleClick={() => openCreateDialog(dayKey)}
                            className={cn(
                              "relative min-h-28 rounded-2xl border p-2 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400",
                              isCurrentMonth ? "bg-white" : "bg-muted/40 text-muted-foreground",
                              !isPastDay && "border-slate-200 bg-linear-to-br from-slate-50 via-white to-white shadow-sm hover:border-slate-300 hover:shadow-md",
                              isSelected && "border-orange-400 bg-orange-50 shadow-sm",
                              isPastDay && "cursor-not-allowed border-slate-200 bg-slate-100/80 opacity-45",
                            )}
                          >
                            <span
                              className={cn(
                                "absolute left-2 top-2 flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold",
                                isToday && "bg-orange-600 text-white",
                                !isToday && !isPastDay && "bg-slate-100 text-slate-700",
                                !isToday && isSelected && "bg-orange-100 text-orange-700",
                              )}
                            >
                              {date.getDate()}
                            </span>
                            {dayEvents.length > 0 && (
                              <Badge
                                variant="outline"
                                className="absolute right-2 top-2 border-orange-200 bg-orange-50 text-[10px] text-orange-700"
                              >
                                {dayEvents.length}
                              </Badge>
                            )}
                            <div className="space-y-1 pt-10">
                              {!isPastDay && dayEvents.length === 0 && (
                                <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-600">
                                  Available
                                </div>
                              )}
                              {dayEvents.slice(0, 2).map((event) => (
                                <div
                                  key={`${event.id}-${dayKey}`}
                                  onClick={(clickEvent) => {
                                    clickEvent.stopPropagation();
                                    setSelectedDate(dayKey);
                                    openPreviewPanel(event);
                                  }}
                                  className={cn(
                                    "truncate rounded-md border px-2 py-1 text-[11px] font-medium transition hover:opacity-85",
                                    "cursor-pointer focus-visible:outline-none",
                                    event.colorClass,
                                  )}
                                  title={`Open ${event.title}`}
                                >
                                  {event.title}
                                </div>
                              ))}
                              {dayEvents.length > 2 && (
                                <div className="text-[11px] font-medium text-muted-foreground">
                                  +{dayEvents.length - 2} more
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : isPreviewOpen && previewEvent ? (
              <motion.div
                key="preview-view"
                initial={{ opacity: 0, rotateY: 18, x: 20 }}
                animate={{ opacity: 1, rotateY: 0, x: 0 }}
                exit={{ opacity: 0, rotateY: -18, x: -20 }}
                transition={{ duration: 0.28, ease: "easeInOut" }}
                style={{ transformStyle: "preserve-3d" }}
              >
                <Card>
                  <CardHeader className="border-b pb-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <CardTitle>Form Preview</CardTitle>
                        <CardDescription>
                          Interactive preview of how the registration form for {previewEvent.title} will behave.
                        </CardDescription>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {hasUnsavedPreviewOrderChanges && (
                          <Button
                            variant="default"
                            onClick={handleSavePreviewFieldOrder}
                            disabled={isSavingPreviewOrder}
                          >
                            {isSavingPreviewOrder ? "Saving..." : "Save Changes"}
                          </Button>
                        )}
                        <Button variant="outline" onClick={() => resetEditorState(false)}>
                          Back To Calendar
                        </Button>
                        <Button variant="outline" onClick={() => openEditDialog(previewEvent)}>
                          Edit Event
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6 p-4 sm:p-6">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xl font-semibold">{previewEvent.title}</h3>
                        <Badge className="bg-green-100 text-green-800 border-green-200 text-sm" variant="outline">{previewPriceBadgeLabel}</Badge>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{getRangeLabel(previewEvent)}</p>
                      {previewEvent.description && (
                        <p className="mt-2 text-sm text-muted-foreground">{previewEvent.description}</p>
                      )}
                    </div>

                    <div className="space-y-4 pt-2">
                      {!hasPreviewFormFields ? (
                        <div className="rounded-lg bg-muted/20 p-4 text-sm text-muted-foreground">
                          This event does not currently have any registration form fields.
                        </div>
                      ) : (
                        <DndContext collisionDetection={closestCenter} onDragEnd={handlePreviewDragEnd}>
                          <SortableContext
                            items={previewFieldItems.map((item) => item.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            <div className="space-y-4">
                              {previewFieldItems.map((item) => (
                                <SortablePreviewField key={item.id} id={item.id}>
                                  {item.kind === "form" ? (
                                    <div className="grid gap-2 rounded-lg bg-muted/10 p-4">
                                      {item.field.inputType !== "CHECKBOX" && (
                                        <Label className="text-sm font-medium">{item.field.label}</Label>
                                      )}

                                      {item.field.inputType === "TEXT" && (
                                        <Input
                                          value={String(previewValues[item.field.id] ?? "")}
                                          onChange={(event) => {
                                            const nextValue = event.target.value;
                                            setPreviewValues((current) => ({
                                              ...current,
                                              [item.field.id]: nextValue,
                                            }));
                                            if (nextValue.trim()) {
                                              setPreviewFieldErrors((current) => {
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
                                          value={String(previewValues[item.field.id] ?? "")}
                                          onValueChange={(value) => {
                                            setPreviewValues((current) => ({
                                              ...current,
                                              [item.field.id]: value,
                                            }));
                                            if (value.trim()) {
                                              setPreviewFieldErrors((current) => {
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
                                        <div className="flex items-center gap-3 rounded-md bg-background px-3 py-3">
                                          <Checkbox
                                            id={`preview-${item.field.id}`}
                                            checked={previewValues[item.field.id] === true}
                                            onCheckedChange={(checked) => {
                                              const isChecked = checked === true;
                                              setPreviewValues((current) => ({
                                                ...current,
                                                [item.field.id]: isChecked,
                                              }));
                                              if (isChecked) {
                                                setPreviewFieldErrors((current) => {
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
                                          <Label htmlFor={`preview-${item.field.id}`}>
                                            {item.field.placeholder}
                                          </Label>
                                        </div>
                                      )}

                                      {previewFieldErrors[item.field.id] && (
                                        <p className="text-sm font-medium text-destructive">
                                          {previewFieldErrors[item.field.id]}
                                        </p>
                                      )}
                                    </div>
                                  ) : item.pricingType === "MULTIPLE" ? (
                                    <div className="grid gap-2 rounded-lg bg-muted/10 p-4">
                                      <Label className="text-sm font-medium">{previewPricingFieldLabel}</Label>
                                      <Select
                                        value={previewPricingSelection[0] ?? ""}
                                        onValueChange={(value) => {
                                          setPreviewPricingSelection([value]);
                                          setPreviewError("");
                                        }}
                                      >
                                        <SelectTrigger className="w-full">
                                          <SelectValue placeholder={`Select ${previewPricingFieldLabel.toLowerCase()}`} />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {previewEvent.pricing.options.map((option) => (
                                            <SelectItem key={option.id} value={option.id}>
                                              {option.label} ({formatCurrency(option.amount)})
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <p className="text-sm text-muted-foreground">
                                        {`Choose one ${previewPricingFieldLabel.toLowerCase()} for this entry.`}
                                      </p>
                                      {previewError && (
                                        <p className="text-sm font-medium text-destructive">{previewError}</p>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="grid gap-3 rounded-lg bg-muted/10 p-4">
                                      <Label className="text-sm font-medium">{previewPricingFieldLabel}</Label>
                                      <div className="space-y-2">
                                        {previewEvent.pricing.options.map((option) => {
                                          const isSelected = previewPricingSelection.includes(option.id);

                                          return (
                                            <div key={option.id} className="flex items-center justify-between rounded-md border px-3 py-3">
                                              <div className="flex items-center gap-3">
                                                <Checkbox
                                                  id={`pricing-preview-${option.id}`}
                                                  checked={isSelected}
                                                  onCheckedChange={(checked) =>
                                                    setPreviewPricingSelection((current) => {
                                                      const nextSelection =
                                                        checked === true
                                                          ? current.includes(option.id)
                                                            ? current
                                                            : [...current, option.id]
                                                          : current.filter((id) => id !== option.id);
                                                      if (nextSelection.length > 0) {
                                                        setPreviewError("");
                                                      }
                                                      return nextSelection;
                                                    })
                                                  }
                                                />
                                                <Label htmlFor={`pricing-preview-${option.id}`}>{option.label}</Label>
                                              </div>
                                              <span className="text-sm font-medium">{formatCurrency(option.amount)}</span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                      <p className="text-sm text-muted-foreground">
                                        {`Select one or multiple ${previewPricingFieldLabel.toLowerCase()}. The total in the header updates from all selected ${previewPricingFieldLabel.toLowerCase()}.`}
                                      </p>
                                      {previewError && (
                                        <p className="text-sm font-medium text-destructive">{previewError}</p>
                                      )}
                                    </div>
                                  )}
                                </SortablePreviewField>
                              ))}
                            </div>
                          </SortableContext>
                        </DndContext>
                      )}
                    </div>

                    <div className="flex justify-end border-t pt-4">
                      <Button type="button" onClick={handlePreviewSubmit}>Preview Submit</Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="editor-view"
                initial={{ opacity: 0, rotateY: 18, x: 20 }}
                animate={{ opacity: 1, rotateY: 0, x: 0 }}
                exit={{ opacity: 0, rotateY: -18, x: -20 }}
                transition={{ duration: 0.28, ease: "easeInOut" }}
                style={{ transformStyle: "preserve-3d" }}
              >
                <Card>
                  <CardHeader className="border-b pb-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <CardTitle>{editingEventId ? "Edit Event" : "Create Event"}</CardTitle>
                        <CardDescription>
                          {editingEventId
                            ? "Update the event details, pricing, and attached registration form."
                            : "Configure the event details, pricing, and registration form before publishing it."}
                        </CardDescription>
                      </div>
                      <Button variant="outline" onClick={() => resetEditorState(false)}>
                        Back To Calendar
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 p-4 sm:p-6">
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <label className="text-sm font-medium">Event title</label>
                        <Input
                          value={formState.title}
                          onChange={(event) =>
                            setFormState((current) => ({ ...current, title: event.target.value }))
                          }
                          placeholder="Club championship"
                        />
                      </div>

                      <div className="grid gap-2 md:grid-cols-2">
                        <div className="grid gap-2">
                          <label className="text-sm font-medium">Start date</label>
                          <Input
                            type="date"
                            value={formState.startDate}
                            min={
                              editingEvent?.startDate && editingEvent.startDate < todayKey
                                ? editingEvent.startDate
                                : todayKey
                            }
                            onChange={(event) =>
                              setFormState((current) => {
                                const nextStartDate = event.target.value;
                                return {
                                  ...current,
                                  startDate: nextStartDate,
                                  endDate:
                                    current.endDate < nextStartDate ? nextStartDate : current.endDate,
                                  registrationCloseDate:
                                    current.registrationCloseDate > nextStartDate
                                      ? nextStartDate
                                      : current.registrationCloseDate,
                                };
                              })
                            }
                          />
                        </div>
                        <div className="grid gap-2">
                          <label className="text-sm font-medium">End date</label>
                          <Input
                            type="date"
                            value={formState.endDate}
                            min={
                              formState.startDate < todayKey
                                ? editingEvent?.endDate && editingEvent.endDate < todayKey
                                  ? editingEvent.endDate
                                  : formState.startDate
                                : formState.startDate
                            }
                            onChange={(event) =>
                              setFormState((current) => ({ ...current, endDate: event.target.value }))
                            }
                          />
                        </div>
                      </div>

                      <div className="grid gap-2 md:grid-cols-2">
                        <div className="grid gap-2">
                          <label className="text-sm font-medium">Open registration date</label>
                          <Input
                            type="date"
                            value={formState.registrationOpenDate}
                            min={
                              editingEvent?.registrationOpenDate &&
                              editingEvent.registrationOpenDate < todayKey
                                ? editingEvent.registrationOpenDate
                                : todayKey
                            }
                            max={formState.startDate}
                            onChange={(event) =>
                              setFormState((current) => {
                                const nextOpenDate = event.target.value;
                                return {
                                  ...current,
                                  registrationOpenDate: nextOpenDate,
                                  registrationCloseDate:
                                    current.registrationCloseDate < nextOpenDate
                                      ? nextOpenDate
                                      : current.registrationCloseDate,
                                };
                              })
                            }
                          />
                        </div>
                        <div className="grid gap-2">
                          <label className="text-sm font-medium">Close registration date</label>
                          <Input
                            type="date"
                            value={formState.registrationCloseDate}
                            min={
                              formState.registrationOpenDate < todayKey
                                ? editingEvent?.registrationCloseDate &&
                                  editingEvent.registrationCloseDate < todayKey
                                  ? editingEvent.registrationCloseDate
                                  : formState.registrationOpenDate
                                : formState.registrationOpenDate
                            }
                            max={formState.startDate}
                            onChange={(event) =>
                              setFormState((current) => ({
                                ...current,
                                registrationCloseDate: event.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>

                      <div className="grid gap-2">
                        <label className="text-sm font-medium">Description</label>
                        <Textarea
                          value={formState.description}
                          onChange={(event) =>
                            setFormState((current) => ({ ...current, description: event.target.value }))
                          }
                          placeholder="Optional notes for staff or members"
                          rows={4}
                        />
                      </div>

                      <div className="rounded-xl border border-dashed p-4">
                        <div className="mb-4 flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-semibold">Event Pricing</h3>
                            <p className="text-sm text-muted-foreground">
                              Set whether the event is free, fixed-fee, category-based, or additive across divisions.
                            </p>
                          </div>
                          <Badge variant="outline">{getPricingSummary(pricing)}</Badge>
                        </div>

                        <div className="grid gap-3">
                          <div className="grid gap-2">
                            <Label>Pricing model</Label>
                            <Select
                              value={pricing.type}
                              onValueChange={(value) => {
                                const nextType = value as EventPricingType;
                                setPricing({
                                  type: nextType,
                                  fieldName:
                                    nextType === "MULTIPLE" || nextType === "ADDITIONAL"
                                      ? pricing.fieldName
                                      : "",
                                  options: [],
                                });
                                setPricingDraft(getDefaultPricingDraft());
                              }}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select pricing model" />
                              </SelectTrigger>
                              <SelectContent>
                                {PRICING_TYPE_OPTIONS.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                              {PRICING_TYPE_OPTIONS.find((option) => option.value === pricing.type)?.description}
                            </p>
                          </div>

                          {(pricing.type === "MULTIPLE" || pricing.type === "ADDITIONAL") && (
                            <div className="grid gap-2">
                              <Label>Pricing field name</Label>
                              <Input
                                value={pricing.fieldName}
                                onChange={(event) =>
                                  setPricing((current) => ({
                                    ...current,
                                    fieldName: event.target.value,
                                  }))
                                }
                                placeholder={pricing.type === "MULTIPLE" ? "Entry category" : "Divisions"}
                              />
                            </div>
                          )}

                          {pricing.type !== "FREE" && (
                            <>
                              {pricing.options.length > 0 && (
                                <div className="space-y-2">
                                  {pricing.options.map((option) => (
                                    <div key={option.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                                      <div>
                                        <p className="font-medium">{option.label}</p>
                                        <p className="text-sm text-muted-foreground">{formatCurrency(option.amount)}</p>
                                      </div>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleRemovePricingOption(option.id)}
                                      >
                                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}

                              <div
                                className={cn(
                                  "grid gap-3 rounded-lg border bg-muted/20 p-3 md:items-end",
                                  pricing.type === "SINGLE"
                                    ? "md:grid-cols-[minmax(0,1fr)_auto]"
                                    : "md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto]",
                                )}
                              >
                                {pricing.type !== "SINGLE" && (
                                  <div className="grid gap-2">
                                    <Label>
                                      {pricing.type === "MULTIPLE" ? "Option label" : "Add-on label"}
                                    </Label>
                                    <Input
                                      value={pricingDraft.label}
                                      onChange={(event) =>
                                        setPricingDraft((current) => ({ ...current, label: event.target.value }))
                                      }
                                      placeholder={
                                        pricing.type === "MULTIPLE" ? "Junior Division" : "Equipment Rental"
                                      }
                                    />
                                  </div>
                                )}
                                <div className="grid gap-2">
                                  <Label>Amount (R)</Label>
                                  <Input
                                    type="text"
                                    inputMode="numeric"
                                    value={formatAmount(Number(pricingDraft.amount || 0), club?.currency || "ZAR")}
                                    onChange={(event) => {
                                      const cleaned = event.target.value.replace(/[^\d]/g, "");
                                      setPricingDraft((current) => ({
                                        ...current,
                                        amount: cleaned,
                                      }));
                                    }}
                                    placeholder={formatAmount(0, club?.currency || "ZAR")}
                                  />
                                </div>
                                <Button type="button" variant="outline" onClick={handleAddPricingOption}>
                                  {pricing.type === "SINGLE"
                                    ? "Set Price"
                                    : pricing.type === "MULTIPLE"
                                      ? "Add Option"
                                      : "Add Add-on"}
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="rounded-xl border border-dashed p-4">
                        <div className="mb-4 flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-semibold">Event Registration Form</h3>
                            <p className="text-sm text-muted-foreground">
                              Build the form attendees must complete for this event.
                            </p>
                          </div>
                          <Badge variant="outline">{eventFormFields.length} fields</Badge>
                        </div>

                        <div className="space-y-3">
                          {eventFormFields.length === 0 && (
                            <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                              Add text, dropdown, or checkbox fields for attendees to complete.
                            </div>
                          )}

                          {eventFormFields.map((field) => (
                            <div key={field.id} className="flex items-start justify-between gap-3 rounded-lg border p-3">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="font-medium">{field.label}</p>
                                  <Badge variant="outline" className="capitalize">
                                    {field.inputType.toLowerCase()}
                                  </Badge>
                                  {field.required && <Badge variant="secondary">Required</Badge>}
                                </div>
                                {field.placeholder && (
                                  <p className="mt-1 text-sm text-muted-foreground">
                                    Placeholder: {field.placeholder}
                                  </p>
                                )}
                                {field.inputType === "DROPDOWN" && field.options.length > 0 && (
                                  <p className="mt-1 text-sm text-muted-foreground">
                                    Options: {field.options.join(", ")}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditFormField(field)}
                                >
                                  <Pencil className="h-4 w-4 text-muted-foreground" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemoveFormField(field.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-4 grid gap-3 rounded-lg border bg-muted/20 p-3">
                          <div className="grid gap-3 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                            <div className="grid gap-2">
                              <Label>Field label</Label>
                              <Input
                                value={fieldDraft.label}
                                onChange={(event) =>
                                  setFieldDraft((current) => ({ ...current, label: event.target.value }))
                                }
                                placeholder="Full name"
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label>Field type</Label>
                              <Select
                                value={fieldDraft.variant}
                                onValueChange={(value) =>
                                  setFieldDraft((current) => ({
                                    ...current,
                                    variant: value as EventFieldVariant,
                                    optionsText: getFieldConfig(value as EventFieldVariant).inputType === "DROPDOWN"
                                      ? current.optionsText
                                      : "",
                                  }))
                                }
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select field type" />
                                </SelectTrigger>
                                <SelectContent>
                                  {FIELD_TYPE_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                            <div className="grid gap-2">
                              <Label>
                                {getFieldConfig(fieldDraft.variant).inputType === "CHECKBOX"
                                  ? "Checkbox text"
                                  : "Placeholder or helper text"}
                              </Label>
                              <Input
                                value={fieldDraft.placeholder}
                                onChange={(event) =>
                                  setFieldDraft((current) => ({ ...current, placeholder: event.target.value }))
                                }
                                placeholder={
                                  getFieldConfig(fieldDraft.variant).inputType === "CHECKBOX"
                                    ? "I agree to the event rules"
                                    : "Enter your full name"
                                }
                              />
                            </div>
                            <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
                              <Checkbox
                                id="event-field-required"
                                checked={fieldDraft.required}
                                onCheckedChange={(checked) =>
                                  setFieldDraft((current) => ({ ...current, required: checked === true }))
                                }
                              />
                              <Label htmlFor="event-field-required">Required</Label>
                            </div>
                          </div>

                          {getFieldConfig(fieldDraft.variant).inputType === "DROPDOWN" && (
                            <div className="grid gap-2">
                              <Label>Dropdown options</Label>
                              <Textarea
                                rows={4}
                                value={fieldDraft.optionsText}
                                onChange={(event) =>
                                  setFieldDraft((current) => ({ ...current, optionsText: event.target.value }))
                                }
                                placeholder={"Option 1\nOption 2\nOption 3"}
                              />
                              <p className="text-xs text-muted-foreground">
                                Enter one option per line.
                              </p>
                            </div>
                          )}

                          <div className="flex flex-wrap gap-2">
                            <Button type="button" variant="outline" onClick={handleAddFormField}>
                              {editingFieldId ? "Update Form Field" : "Add Form Field"}
                            </Button>
                            {editingFieldId && (
                              <Button type="button" variant="ghost" onClick={handleCancelFieldEdit}>
                                Cancel Field Edit
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>

                      {formError && (
                        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                          {formError}
                        </div>
                      )}

                      <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
                        <Button variant="outline" onClick={() => resetEditorState(false)}>
                          Cancel
                        </Button>
                        <Button type="button" onClick={handleSaveEvent} disabled={isSavingEvent}>
                          {isSavingEvent
                            ? "Saving..."
                            : editingEventId
                              ? "Save Changes"
                              : "Save Event"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{formatLongDate(selectedDate)}</CardTitle>
              <CardDescription>
                Events scheduled for the selected date.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedDateEvents.length === 0 && (
                <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                  Nothing scheduled for this day yet.
                </div>
              )}
              {selectedDateEvents.map((event) => (
                <div key={event.id} className="rounded-xl border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-foreground">{event.title}</h3>
                        <Badge variant="secondary">{event.formFields.length} form fields</Badge>
                        <Badge variant="outline">{getPricingSummary(event.pricing)}</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock3 className="h-4 w-4" />
                        <span>{getRangeLabel(event)}</span>
                      </div>
                      {event.description && (
                        <p className="text-sm text-muted-foreground">{event.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2 pt-1">
                        {event.formFields.map((field) => (
                          <Badge key={field.id} variant="outline" className="capitalize">
                            {field.label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openPreviewPanel(event)}
                        title="View form"
                      >
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(event)}
                        title="Edit event form"
                      >
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteEvent(event.id)}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full" onClick={() => openCreateDialog(selectedDate)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Event On This Day
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-orange-700">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle>Upcoming Events</CardTitle>
                  <CardDescription>Next items currently on the calendar.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingEvents.length === 0 && (
                <p className="text-sm text-muted-foreground">No upcoming events yet.</p>
              )}
              {upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-start justify-between gap-3 rounded-xl border p-3">
                  <div>
                    <p className="font-medium">{event.title}</p>
                    <p className="text-sm text-muted-foreground">{getRangeLabel(event)}</p>
                    <p className="text-xs text-muted-foreground">
                      {event.formFields.length} required form field{event.formFields.length === 1 ? "" : "s"} configured
                    </p>
                    <p className="text-xs text-muted-foreground">{getPricingSummary(event.pricing)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={cn("border", event.colorClass)} variant="outline">
                      {getEventDuration(event) === 1 ? "1 day" : `${getEventDuration(event)} days`}
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => openPreviewPanel(event)}
                      title="View form"
                    >
                      <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(event)}
                      title="Edit event form"
                    >
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showEventsSettings} onOpenChange={setShowEventsSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Events Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label className="text-base font-semibold">Enable Events</Label>
                <p className="mt-1 text-sm text-muted-foreground">
                  Toggle to enable or disable events for your club.
                </p>
              </div>
              <Switch
                checked={club?.enable_events || false}
                onCheckedChange={handleToggleEvents}
                disabled={isTogglingEvents}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEventsSettings(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}