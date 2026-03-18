import { api } from "@/services/admin-features/api.tsx";

export interface CreateVenueRequest {
    venue_name: string;
    smallest_booking_unit: number;
    max_daily_booking_time: number | null;
    times: Array<{
        day_of_week: number;
        start_time: string;
        end_time: string;
        is_closed?: boolean;
    }>;
}

export interface EnableVenuesRequest {
    club_account_id: string;
    venues_enabled: boolean;
}

export const createVenue = (createVenueRequest: CreateVenueRequest): Promise<any> => {
    return api.post("/venues/createVenue", createVenueRequest)
        .then(res => res.data);
}

export const getVenues = (clubAccountId: string): Promise<any> => {
    return api.get(`/venues/getVenues?club_account_id=${clubAccountId}`)
        .then(res => res.data);
}

export const enableVenues = (enableVenuesRequest: EnableVenuesRequest): Promise<any> => {
    return api.post("/venues/enableVenues", enableVenuesRequest)
        .then(res => res.data);
}