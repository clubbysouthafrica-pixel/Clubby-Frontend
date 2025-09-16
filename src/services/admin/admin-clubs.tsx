import { api } from "./api";

interface FetchAdminClubsResponse {
    status: number;
    data: any;
}

export const fetchAdminClubs = async (): Promise<FetchAdminClubsResponse> => {
    try {
        const res = await api.get("/clubAdmin/getAllAdminClubs");
        return { status: res.status, data: res.data };
    } catch (err: any) {
        if (err.response) {
            // This handles 403 and any other non-2xx response
            return { status: err.response.status, data: err.response.data };
        }
        // If it's not a server response error (e.g. network error), rethrow
        throw err;
    }
};