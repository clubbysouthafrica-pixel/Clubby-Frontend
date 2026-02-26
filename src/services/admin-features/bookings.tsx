import { api } from "@/services/admin-features/api.tsx";

export interface CreateBookingRequest {
    venue_id: string;
    smallest_booking_unit: number;
    start_time: number;
    name: string;
    duration: number;
}

export const createBooking = (createBookingRequest: CreateBookingRequest): Promise<any> => {
    return api.post("/bookings/createBooking", createBookingRequest)
        .then(res => res.data);
}

export const getBookings = (venueId: string, start_slot_time: string, end_slot_time: string): Promise<any> => {
    return api.get(`/bookings/getBookings?venue_id=${venueId}&start_slot_time=${start_slot_time}&end_slot_time=${end_slot_time}`)
        .then(res => res.data);
}