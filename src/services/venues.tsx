import { api } from "@/services/api.tsx";

export const getVenues = (clubAccountId: string): Promise<any> => {
    return api.get(`/venues/getVenues?club_account_id=${clubAccountId}`)
        .then(res => res.data);
}
