import { api } from "./api";

interface FetchAdminClubsResponse {
    status: number;
    data: any;
}

export const fetchAdminClubs = async (): Promise<FetchAdminClubsResponse> => {
    try {
        const res = await api.get("/clubAdmin/getAllAdminClubs");
        return { status: 403, data: res.data };
    } catch (err: any) {
        if (err.response) {
            return { status: err.response.status, data: err.response.data };
        }
        throw err;
    }
};