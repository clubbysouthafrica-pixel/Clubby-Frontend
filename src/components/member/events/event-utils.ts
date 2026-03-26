import { formatAmount } from "@/data/currencies";

export type EventFormInputType = "TEXT" | "DROPDOWN" | "CHECKBOX";
export type EventPricingType = "FREE" | "SINGLE" | "MULTIPLE" | "ADDITIONAL";

export type EventFormField = {
  id: string;
  label: string;
  inputType: EventFormInputType;
  required: boolean;
  placeholder: string;
  options: string[];
};

export type EventPricingOption = {
  id: string;
  label: string;
  amount: string | number;
};

export type EventPricing = {
  type: EventPricingType;
  fieldName?: string;
  options: EventPricingOption[];
};

export type MemberEvent = {
  id: string;
  eventId?: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  registrationOpenDate: string;
  registrationCloseDate: string;
  pricing: EventPricing;
  formFields: EventFormField[];
  previewFieldOrder: string[];
};

export const PRICING_PREVIEW_FIELD_ID = "pricing-field";

export function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateKey(value: string) {
  return new Date(`${value}T00:00:00`);
}

function toDateKey(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return formatDateKey(new Date(value));
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return "";
    }

    if (/^\d+$/.test(trimmed)) {
      const asNumber = Number(trimmed);
      return Number.isFinite(asNumber) ? formatDateKey(new Date(asNumber)) : "";
    }

    return trimmed;
  }

  return "";
}

function sanitizePricing(rawPricing: unknown): EventPricing {
  const pricing = typeof rawPricing === "object" && rawPricing !== null ? (rawPricing as Partial<EventPricing>) : {};
  const nextType: EventPricingType =
    pricing.type === "SINGLE" || pricing.type === "MULTIPLE" || pricing.type === "ADDITIONAL"
      ? pricing.type
      : "FREE";
  const rawOptions = Array.isArray(pricing.options) ? pricing.options : [];

  return {
    type: nextType,
    fieldName: typeof pricing.fieldName === "string" ? pricing.fieldName : "",
    options: rawOptions
      .map((option, index) => {
        const nextOption = typeof option === "object" && option !== null ? (option as Partial<EventPricingOption>) : {};
        return {
          id:
            typeof nextOption.id === "string" && nextOption.id.trim()
              ? nextOption.id
              : `pricing-${index}`,
          label: typeof nextOption.label === "string" ? nextOption.label : "",
          amount:
            typeof nextOption.amount === "number" || typeof nextOption.amount === "string"
              ? nextOption.amount
              : "0",
        };
      })
      .filter((option) => option.label || option.amount),
  };
}

function sanitizeField(rawField: unknown, index: number): EventFormField | null {
  const field = typeof rawField === "object" && rawField !== null ? (rawField as Partial<EventFormField>) : null;

  if (!field || typeof field.label !== "string" || !field.label.trim()) {
    return null;
  }

  const inputType: EventFormInputType =
    field.inputType === "DROPDOWN" || field.inputType === "CHECKBOX" ? field.inputType : "TEXT";

  return {
    id: typeof field.id === "string" && field.id.trim() ? field.id : `field-${index}`,
    label: field.label.trim(),
    inputType,
    required: Boolean(field.required),
    placeholder: typeof field.placeholder === "string" ? field.placeholder : "",
    options:
      inputType === "DROPDOWN" && Array.isArray(field.options)
        ? field.options.filter((option): option is string => typeof option === "string" && option.trim().length > 0)
        : [],
  };
}

function getPreviewFieldIds(formFields: EventFormField[], pricing: EventPricing) {
  const ids = formFields.map((field) => field.id);

  if (pricing.type === "MULTIPLE" || pricing.type === "ADDITIONAL") {
    ids.push(PRICING_PREVIEW_FIELD_ID);
  }

  return ids;
}

function sanitizePreviewFieldOrder(rawOrder: unknown, formFields: EventFormField[], pricing: EventPricing) {
  const availableIds = getPreviewFieldIds(formFields, pricing);
  const requestedOrder = Array.isArray(rawOrder)
    ? rawOrder.filter((value): value is string => typeof value === "string")
    : [];

  const orderedIds = requestedOrder.filter(
    (id, index) => availableIds.includes(id) && requestedOrder.indexOf(id) === index,
  );

  return [...orderedIds, ...availableIds.filter((id) => !orderedIds.includes(id))];
}

export function sanitizeEvents(rawEvents: unknown[]) {
  return rawEvents
    .map((rawEvent, index): MemberEvent | null => {
      const event = typeof rawEvent === "object" && rawEvent !== null ? (rawEvent as Record<string, unknown>) : null;
      if (!event || typeof event.title !== "string" || !event.title.trim()) {
        return null;
      }

      const startDate = toDateKey(event.startDate);
      const endDate = toDateKey(event.endDate) || startDate;
      const registrationOpenDate = toDateKey(event.registrationOpenDate) || startDate;
      const registrationCloseDate = toDateKey(event.registrationCloseDate) || endDate;
      const pricing = sanitizePricing(event.pricing);
      const formFields = Array.isArray(event.formFields)
        ? event.formFields
            .map((field, fieldIndex) => sanitizeField(field, fieldIndex))
            .filter((field): field is EventFormField => Boolean(field))
        : [];

      return {
        id: typeof event.id === "string" && event.id.trim() ? event.id : `event-${index}`,
        eventId: typeof event.event_id === "string" && event.event_id.trim() ? event.event_id : undefined,
        title: event.title.trim(),
        description: typeof event.description === "string" ? event.description : "",
        startDate,
        endDate,
        registrationOpenDate,
        registrationCloseDate,
        pricing,
        formFields,
        previewFieldOrder: sanitizePreviewFieldOrder(event.previewFieldOrder, formFields, pricing),
      };
    })
    .filter((event): event is MemberEvent => Boolean(event))
    .sort((left, right) => left.startDate.localeCompare(right.startDate));
}

export function formatLongDate(dateKey: string) {
  return parseDateKey(dateKey).toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatRangeLabel(event: Pick<MemberEvent, "startDate" | "endDate">) {
  if (!event.startDate) {
    return "Date to be confirmed";
  }

  if (event.startDate === event.endDate || !event.endDate) {
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

export function getRegistrationStatus(event: Pick<MemberEvent, "registrationOpenDate" | "registrationCloseDate">, todayKey: string) {
  if (!event.registrationOpenDate || !event.registrationCloseDate) {
    return {
      label: "Schedule pending",
      className: "border-slate-200 bg-slate-100 text-slate-700",
    };
  }

  if (todayKey < event.registrationOpenDate) {
    return {
      label: "Opens soon",
      className: "border-amber-200 bg-amber-100 text-amber-800",
    };
  }

  if (todayKey > event.registrationCloseDate) {
    return {
      label: "Registration closed",
      className: "border-slate-200 bg-slate-100 text-slate-700",
    };
  }

  return {
    label: "Registration open",
    className: "border-emerald-200 bg-emerald-100 text-emerald-800",
  };
}

export function isRegistrationOpen(
  event: Pick<MemberEvent, "registrationOpenDate" | "registrationCloseDate">,
  todayKey: string,
) {
  return Boolean(
    event.registrationOpenDate &&
      event.registrationCloseDate &&
      todayKey >= event.registrationOpenDate &&
      todayKey <= event.registrationCloseDate,
  );
}

export function getPricingSummary(pricing: EventPricing, currency: string) {
  if (pricing.type === "FREE") {
    return "Free";
  }

  const amounts = pricing.options
    .map((option) => Number(option.amount) / 100)
    .filter((amount) => Number.isFinite(amount) && amount >= 0);

  if (pricing.type === "SINGLE") {
    return amounts[0] !== undefined ? formatAmount(amounts[0], currency) : "Fixed price";
  }

  if (amounts.length === 0) {
    return pricing.type === "MULTIPLE" ? "Selectable pricing" : "Add-on pricing";
  }

  const minAmount = Math.min(...amounts);
  const maxAmount = Math.max(...amounts);

  if (pricing.type === "MULTIPLE") {
    return minAmount === maxAmount
      ? `Selectable: ${formatAmount(minAmount, currency)}`
      : `Selectable: ${formatAmount(minAmount, currency)} - ${formatAmount(maxAmount, currency)}`;
  }

  return `Add-ons from ${formatAmount(minAmount, currency)}`;
}
