import { api } from "./api";

export const getMemberOrders = (clubAccountId: string): Promise<any> => {
    return api.get(`/orders/getMemberOrders?club_account_id=${clubAccountId}`)
        .then(res => res.data);
}

type CancelOrderRequest = {
    transaction_id: string;
    club_account_id: string;
    order_id: string;
}

export const createOrder = (orderData: any): Promise<any> => {
    return api.post('/orders/createOrder', orderData)
        .then(res => res.data);
}

export const cancelOrder = (orderData: CancelOrderRequest): Promise<any> => {
    return api.post('/orders/cancelOrder', orderData)
        .then(res => res.data);
}