import { api } from "./api";

export const fetchPayFastCheckoutURL = (clubAccountId: string, orderId?: string): Promise<any> => {
    const params = new URLSearchParams({ club_account_id: clubAccountId });
    if (orderId) {
        params.append('order_id', orderId);
    }
    return api.get(`/payfast/checkoutUrl?${params.toString()}`)
        .then(res => res.data);
} 
