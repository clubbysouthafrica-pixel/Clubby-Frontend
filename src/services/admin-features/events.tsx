import { api } from "./api";

export type EventFormInputType = "TEXT" | "DROPDOWN" | "CHECKBOX";

export type EventPricingType = "FREE" | "SINGLE" | "MULTIPLE" | "ADDITIONAL";

export interface CreateOrUpdateEventFormFieldRequest {
  id: string;
  label: string;
  inputType: EventFormInputType;
  required: boolean;
  placeholder: string;
  options: string[];
}

export interface CreateOrUpdateEventPricingOptionRequest {
  id: string;
  label: string;
  amount: string;
}

export interface CreateOrUpdateEventPricingRequest {
  type: EventPricingType;
  fieldName: string;
  options: CreateOrUpdateEventPricingOptionRequest[];
}

export interface CreateOrUpdateEventRegistrationTagRequest {
  label: string;
}

export interface CreateOrUpdateEventRegistrationRequest {
  autoConfirmIfPaid: boolean;
  allowMemberRegistrationOnce: boolean;
  registrationTags?: CreateOrUpdateEventRegistrationTagRequest[];
}

export interface CreateOrUpdateEventRequest {
  club_account_id: string;
  id?: string;
  event_id?: string;
  title: string;
  description: string;
  startDate: number;
  endDate: number;
  registrationOpenDate: number;
  registrationCloseDate: number;
  formFields: CreateOrUpdateEventFormFieldRequest[];
  pricing: CreateOrUpdateEventPricingRequest;
  eventRegistration: CreateOrUpdateEventRegistrationRequest;
  previewFieldOrder: string[];
}

export type CreateOrUpdateEventsRequest =
  | CreateOrUpdateEventRequest
  | CreateOrUpdateEventRequest[];

export interface CreateOrUpdateEventResponse {
  message?: string;
  event_id?: string;
}

export interface GetEventsResponse {
  events: unknown[];
}

export interface GetEventRegistrationsResponse {
  event_registrations?: unknown[];
  pageToken?: string;
  page_token?: string;
}

export interface GetEventRegistrationsFieldFilter {
  field_id: string;
  value: string;
}

export interface GetEventRegistrationsFilters {
  payment_status?: string;
  pricing_option_id?: string;
  pricing_option_ids?: string[];
  field_filters?: GetEventRegistrationsFieldFilter[];
}

export interface GetEventRegistrationResponse {
  registration_fields?: unknown[];
  selected_pricing_option_ids?: string[];
}

export interface ConfirmEventPaymentRequest {
  club_account_id: string;
  event_id: string;
  event_registration_id: string;
  transaction_id: string;
  amount_paid: number;
}

export interface ConfirmEventRegistrationFieldRequest {
  field_id: string;
  field_label: string;
  value: string;
}

export interface ConfirmEventRegistrationRequest {
  club_account_id: string;
  event_id: string;
  event_registration_id: string;
  registration_fields?: ConfirmEventRegistrationFieldRequest[];
}

export interface DeleteEventRequest {
  club_account_id: string;
  event_id: string;
}

export interface EventAdminActionResponse {
  status: number;
  data: unknown;
  message?: string;
}

export const createOrUpdateEvents = (
  request: CreateOrUpdateEventsRequest,
): Promise<CreateOrUpdateEventResponse> => {
  return api.post("/events/createOrUpdateEvents", request).then((res) => res.data);
};

export const getEvents = (clubAccountId: string): Promise<GetEventsResponse> => {
  return api.get(`/events/getEvents?club_account_id=${clubAccountId}`).then((res) => res.data);
};

export const getEventRegistrations = (
  clubAccountId: string,
  eventId?: string,
  limit?: number,
  pageToken?: string,
  filters?: GetEventRegistrationsFilters,
): Promise<GetEventRegistrationsResponse> => {
  const params = new URLSearchParams({
    club_account_id: clubAccountId,
  });

  if (eventId) {
    params.append("event_id", eventId);
  }

  if (typeof limit === "number") {
    params.append("limit", limit.toString());
  }

  if (pageToken) {
    params.append("pageToken", pageToken);
    params.append("page_token", pageToken);
  }

  const requestBody: {
    filters?: GetEventRegistrationsFilters;
  } = {};

  if (filters) {
    const requestFilters: GetEventRegistrationsFilters = {};

    if (filters.payment_status?.trim()) {
      requestFilters.payment_status = filters.payment_status;
    }

    if (filters.pricing_option_id?.trim()) {
      requestFilters.pricing_option_id = filters.pricing_option_id;
    }

    if (
      Array.isArray(filters.pricing_option_ids) &&
      filters.pricing_option_ids.length > 0
    ) {
      requestFilters.pricing_option_ids = filters.pricing_option_ids;
    }

    if (Array.isArray(filters.field_filters) && filters.field_filters.length > 0) {
      requestFilters.field_filters = filters.field_filters;
    }

    if (Object.keys(requestFilters).length > 0) {
      requestBody.filters = requestFilters;
    }
  }

  return api
    .post(`/events/getEventRegistrations?${params.toString()}`, requestBody)
    .then((res) => res.data);
};

export const getEventRegistration = (
  clubAccountId: string,
  eventId: string,
  eventRegistrationId: string,
): Promise<GetEventRegistrationResponse> => {
  return api
    .get(
      `/events/getEventRegistration?club_account_id=${clubAccountId}&event_id=${eventId}&event_registration_id=${eventRegistrationId}`,
    )
    .then((res) => res.data);
};

export const confirmEventPayment = async (
  payload: ConfirmEventPaymentRequest,
): Promise<EventAdminActionResponse> => {
  try {
    const res = await api.post("/events/confirmPayment", payload);
    return { status: res.status, data: res.data };
  } catch (err: unknown) {
    const apiError = err as {
      response?: {
        status: number;
        data: unknown;
      };
    };

    if (apiError.response) {
      return { status: apiError.response.status, data: apiError.response.data };
    }

    throw err;
  }
};

export const confirmEventRegistration = async (
  payload: ConfirmEventRegistrationRequest,
): Promise<EventAdminActionResponse> => {
  try {
    const res = await api.post("/events/confirmRegistration", payload);
    return { status: res.status, data: res.data };
  } catch (err: unknown) {
    const apiError = err as {
      response?: {
        status: number;
        data: unknown;
      };
    };

    if (apiError.response) {
      return { status: apiError.response.status, data: apiError.response.data };
    }

    throw err;
  }
};

export const deleteEvent = async (
  payload: DeleteEventRequest,
): Promise<EventAdminActionResponse> => {
  try {
    const res = await api.post("/events/deleteEvent", payload);
    return { status: res.status, data: res.data };
  } catch (err: unknown) {
    const apiError = err as {
      response?: {
        status: number;
        data: unknown;
      };
    };

    if (apiError.response) {
      return { status: apiError.response.status, data: apiError.response.data };
    }

    throw err;
  }
};