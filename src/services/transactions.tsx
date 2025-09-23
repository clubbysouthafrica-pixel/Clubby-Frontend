import { api } from "./api";

export const getUserTransactions = (clubId: string, userId: string) => {
    return api.get(`/transactions/user?club_account_id=${clubId}&user_id=${userId}`)
        .then(res => res.data);
}
