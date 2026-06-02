export type TicketDateConfig = {
  startDate: string;
  endDate: string;
  excludedDates: string;
};

type TicketDateRecord = {
  valid_day_start_date?: string;
  valid_day_end_date?: string;
  excluded_valid_day_options?: string[];
  valid_day_options?: string[];
};

type ExcludedDatesInput = string | string[] | undefined;

export const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const parseIsoDateToUtcTime = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);

  return Date.UTC(year, month - 1, day);
};

const formatUtcTimeAsIsoDate = (value: number) =>
  new Date(value).toISOString().slice(0, 10);

export const isIsoDateInput = (value: string) => ISO_DATE_PATTERN.test(value);

export const normalizeExcludedDatesInput = (value: ExcludedDatesInput) => {
  const rawValues = Array.isArray(value) ? value : (value ?? "").split("\n");

  return Array.from(
    new Set(
      rawValues
        .map((option) => option.trim())
        .filter(Boolean),
    ),
  ).sort((left, right) => left.localeCompare(right));
};

export const buildValidDayOptionsFromDateRange = (
  startDate: string,
  endDate: string,
  excludedDates: ExcludedDatesInput,
) => {
  if (!isIsoDateInput(startDate) || !isIsoDateInput(endDate)) {
    return {
      options: [] as string[],
      error: "Select a valid start and end date for ticket products.",
    };
  }

  if (startDate > endDate) {
    return {
      options: [] as string[],
      error: "The start date must be on or before the end date.",
    };
  }

  const parsedExcludedDates = normalizeExcludedDatesInput(excludedDates);
  const invalidExcludedDate = parsedExcludedDates.find(
    (value) => !isIsoDateInput(value),
  );

  if (invalidExcludedDate) {
    return {
      options: [] as string[],
      error: `Excluded date "${invalidExcludedDate}" must use the YYYY-MM-DD format.`,
    };
  }

  const outOfRangeDate = parsedExcludedDates.find(
    (value) => value < startDate || value > endDate,
  );

  if (outOfRangeDate) {
    return {
      options: [] as string[],
      error: `Excluded date "${outOfRangeDate}" must fall inside the selected date range.`,
    };
  }

  const excludedDateSet = new Set(parsedExcludedDates);
  const rangeStart = parseIsoDateToUtcTime(startDate);
  const rangeEnd = parseIsoDateToUtcTime(endDate);
  const options: string[] = [];

  for (
    let current = rangeStart;
    current <= rangeEnd;
    current += DAY_IN_MS
  ) {
    const option = formatUtcTimeAsIsoDate(current);

    if (!excludedDateSet.has(option)) {
      options.push(option);
    }
  }

  if (options.length === 0) {
    return {
      options,
      error: "At least one valid ticket date must remain after exclusions.",
    };
  }

  return { options };
};

export const buildTicketDateConfig = (
  options: string[] | undefined,
): TicketDateConfig => {
  const normalizedOptions = Array.from(
    new Set(
      (Array.isArray(options) ? options : []).filter(
        (option): option is string =>
          typeof option === "string" && isIsoDateInput(option),
      ),
    ),
  ).sort((left, right) => left.localeCompare(right));

  if (normalizedOptions.length === 0) {
    return {
      startDate: "",
      endDate: "",
      excludedDates: "",
    };
  }

  const startDate = normalizedOptions[0];
  const endDate = normalizedOptions[normalizedOptions.length - 1];
  const includedDates = new Set(normalizedOptions);
  const excludedDates: string[] = [];
  const rangeStart = parseIsoDateToUtcTime(startDate);
  const rangeEnd = parseIsoDateToUtcTime(endDate);

  for (
    let current = rangeStart;
    current <= rangeEnd;
    current += DAY_IN_MS
  ) {
    const option = formatUtcTimeAsIsoDate(current);

    if (!includedDates.has(option)) {
      excludedDates.push(option);
    }
  }

  return {
    startDate,
    endDate,
    excludedDates: excludedDates.join("\n"),
  };
};

export const normalizeTicketDateConfig = (
  record?: TicketDateRecord | null,
): TicketDateConfig => {
  if (
    record?.valid_day_start_date &&
    record.valid_day_end_date &&
    isIsoDateInput(record.valid_day_start_date) &&
    isIsoDateInput(record.valid_day_end_date)
  ) {
    return {
      startDate: record.valid_day_start_date,
      endDate: record.valid_day_end_date,
      excludedDates: normalizeExcludedDatesInput(
        record.excluded_valid_day_options,
      ).join("\n"),
    };
  }

  return buildTicketDateConfig(record?.valid_day_options);
};

export const normalizeTicketValidDayOptions = (
  record?: TicketDateRecord | null,
) => {
  if (
    record?.valid_day_start_date &&
    record.valid_day_end_date &&
    isIsoDateInput(record.valid_day_start_date) &&
    isIsoDateInput(record.valid_day_end_date)
  ) {
    const compactResult = buildValidDayOptionsFromDateRange(
      record.valid_day_start_date,
      record.valid_day_end_date,
      record.excluded_valid_day_options,
    );

    if (!compactResult.error) {
      return compactResult.options;
    }
  }

  return Array.isArray(record?.valid_day_options)
    ? record.valid_day_options.filter(
        (option): option is string =>
          typeof option === "string" && option.trim().length > 0,
      )
    : [];
};

export const formatTicketDateLabel = (value?: string) => {
  if (!value || !ISO_DATE_PATTERN.test(value)) {
    return value ?? "";
  }

  const parsedDate = new Date(`${value}T00:00:00`);

  return Number.isNaN(parsedDate.getTime())
    ? value
    : parsedDate.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
};

export const formatTicketDateSummary = (options: string[]) => {
  if (!options.length) {
    return "No dates configured";
  }

  const sortedOptions = [...options].sort((left, right) =>
    left.localeCompare(right),
  );
  const firstDate = sortedOptions[0];
  const lastDate = sortedOptions[sortedOptions.length - 1];

  if (!isIsoDateInput(firstDate) || !isIsoDateInput(lastDate)) {
    return `${options.length} configured`;
  }

  return firstDate === lastDate ? firstDate : `${firstDate} to ${lastDate}`;
};

export const emptyTicketDateConfig = (): TicketDateConfig => ({
  startDate: "",
  endDate: "",
  excludedDates: "",
});