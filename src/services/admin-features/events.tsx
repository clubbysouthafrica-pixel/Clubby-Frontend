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

export interface CreateOrUpdateEventRequest {
  club_account_id: string;
  event_id?: string;
  title: string;
  description: string;
  startDate: number;
  endDate: number;
  registrationOpenDate: number;
  registrationCloseDate: number;
  formFields: CreateOrUpdateEventFormFieldRequest[];
  pricing: CreateOrUpdateEventPricingRequest;
  previewFieldOrder: string[];
}

export interface GetEventsResponse {
  events: unknown[];
}

export interface GetEventRegistrationsResponse {
  event_registrations?: unknown[];
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

export interface EventAdminActionResponse {
  status: number;
  data: any;
  message?: string;
}

export const createOrUpdateEvents = (
  request: CreateOrUpdateEventRequest,
): Promise<unknown> => {
  return api.post("/events/createOrUpdateEvents", request).then((res) => res.data);
};

export const getEvents = (clubAccountId: string): Promise<GetEventsResponse> => {
  return api.get(`/events/getEvents?club_account_id=${clubAccountId}`).then((res) => res.data);
};

export const getEventRegistrations = (
  clubAccountId: string,
  eventId?: string,
): Promise<GetEventRegistrationsResponse> => {
  const eventQuery = eventId ? `&event_id=${eventId}` : "";

  return api
    .get(`/events/getEventRegistrations?club_account_id=${clubAccountId}${eventQuery}`)
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
  } catch (err: any) {
    if (err.response) {
      return { status: err.response.status, data: err.response.data };
    }

    throw err;
  }
};