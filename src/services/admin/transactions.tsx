import { api } from "./api";

export const getMemberTransactions = (clubId: string, userId: string) => {
    return api.get(`/transactions/member?club_account_id=${clubId}&user_id=${userId}`)
        .then(res => res.data);
}

export const getClubTransactions = (clubId: string) => {
    return api.get(`/transactions/club?club_account_id=${clubId}`)
        .then(res => res.data);
}