import { api } from "./api";

export const fetchPayFastCheckoutURL = (clubAccountId: string): Promise<any> => {
    return api.get(`/payfast/checkoutUrl?club_account_id=${clubAccountId}`)
        .then(res => res.data);
} 
