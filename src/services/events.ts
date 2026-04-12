import { api } from "./api";

export interface GetEventsResponse {
  events: unknown[];
}

export interface GetEventRegistrationsResponse {
  [key: string]: unknown;
}

export interface RegisterEventFieldRequest {
  field_id: string;
  field_label: string;
  input_type: string;
  value: string | boolean | null;
}

export interface RegisterEventRequest {
  club_account_id?: string;
  event_id: string;
  user_id?: string;
  entry_fee_amount: number;
  pricing_type: string;
  selected_pricing_option_ids: string[];
  registration_fields: RegisterEventFieldRequest[];
}

export interface RegisterEventResponse {
  message?: string;
  transaction_id?: string;
  event_id?: string;
  event_registration_id?: string;
  registration_id?: string;
  id?: string;
}

function buildGetEventsPath(clubAccountId: string, includeAll?: boolean) {
  const params = new URLSearchParams({
    club_account_id: clubAccountId,
  });

  if (includeAll) {
    params.append("include_all", "true");
  }

  return `/events/getEvents?${params.toString()}`;
}

export const getEvents = (clubAccountId: string): Promise<GetEventsResponse> => {
  return api.get(buildGetEventsPath(clubAccountId)).then((res) => res.data);
};

export const getEventsIncludingAll = (clubAccountId: string): Promise<GetEventsResponse> => {
  return api.get(buildGetEventsPath(clubAccountId, true)).then((res) => res.data);
};

export const getEventRegistrations = (
  clubAccountId: string,
): Promise<GetEventRegistrationsResponse> => {
  if (!clubAccountId) {
    throw new Error("clubAccountId is required");
  }

  return api
    .get(`/events/getEventRegistrations?club_account_id=${clubAccountId}`)
    .then((res) => res.data);
};

export const registerEvent = (request: RegisterEventRequest): Promise<RegisterEventResponse> => {
  return api.post("/events/register", request).then((res) => res.data);
};