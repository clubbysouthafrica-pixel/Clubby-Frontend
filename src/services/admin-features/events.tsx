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

export const createOrUpdateEvents = (
  request: CreateOrUpdateEventRequest,
): Promise<unknown> => {
  return api.post("/events/createOrUpdateEvents", request).then((res) => res.data);
};

export const getEvents = (clubAccountId: string): Promise<GetEventsResponse> => {
  return api.get(`/events/getEvents?club_account_id=${clubAccountId}`).then((res) => res.data);
};