import { api } from "./api";

export const getMemberOrders = (clubAccountId: string): Promise<any> => {
    return api.get(`/orders/getMemberOrders?club_account_id=${clubAccountId}`)
        .then(res => res.data);
}

export const createOrder = (orderData: any): Promise<any> => {
    return api.post('/orders/createOrder', orderData)
        .then(res => res.data);
}