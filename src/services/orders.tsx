import { api } from "./api";

export const getMemberOrders = (clubAccountId: string): Promise<any> => {
    return api.get(`/orders/getMemberOrders?club_account_id=${clubAccountId}`)
        .then(res => res.data);
}

export const createOrder = (orderData: any): Promise<any> => {
    return api.post('/orders/createOrder', orderData)
        .then(res => res.data);
}

export const updateOrderFulfillment = (clubAccountId: string, orderId: string): Promise<any> => {
    return api.post('/orders/updateFulfillment', {
        club_account_id: clubAccountId,
        order_id: orderId
    })
        .then(res => res.data);
}