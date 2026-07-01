import { api } from "./api";

export const getUserTransactions = (clubId: string, userId: string) => {
    return api.get(`/transactions/user?club_account_id=${clubId}&user_id=${userId}`)
        .then(res => res.data);
}

export const getTransactionStatus = (clubAccountId: string, transactionId: string): Promise<{ is_paid: boolean }> => {
    return api.get(`/transactions/status?club_account_id=${clubAccountId}&transaction_id=${transactionId}`)
        .then(res => res.data);
}
