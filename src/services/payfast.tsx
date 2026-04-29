import { api } from "./api";

interface PayFastCheckoutParams {
    userId?: string;
    transactionId?: string;
    orderId?: string;
    eventId?: string;
    eventRegistrationId?: string;
}

export const fetchPayFastCheckoutURL = (
    clubAccountId: string,
    checkoutParams?: PayFastCheckoutParams,
): Promise<any> => {
    const queryParams = new URLSearchParams({ club_account_id: clubAccountId });
    if (checkoutParams?.userId) {
        queryParams.append('user_id', checkoutParams.userId);
    }
    if (checkoutParams?.transactionId) {
        queryParams.append('transaction_id', checkoutParams.transactionId);
    }
    if (checkoutParams?.orderId) {
        queryParams.append('order_id', checkoutParams.orderId);
    }
    if (checkoutParams?.eventId) {
        queryParams.append('event_id', checkoutParams.eventId);
    }
    if (checkoutParams?.eventRegistrationId) {
        queryParams.append('event_registration_id', checkoutParams.eventRegistrationId);
    }
    return api.get(`/payfast/checkoutUrl?${queryParams.toString()}`)
        .then(res => res.data);
} 
