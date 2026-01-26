import { api } from "./api";

export const getClubProducts = (clubAccountId: string): Promise<any> => {
    return api.get(`/shop/getClubProducts?club_account_id=${clubAccountId}`)
        .then(res => res.data);
}