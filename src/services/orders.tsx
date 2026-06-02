import { api } from "./api";

export const getMemberOrders = (clubAccountId: string): Promise<any> => {
    return api.get(`/orders/getMemberOrders?club_account_id=${clubAccountId}`)
        .then(res => res.data);
}

type OrderLineItem = {
    product_id: string | number;
    name: string;
    price: number;
    quantity: number;
    subtotal: number;
    selected_valid_day?: string;
}

type CancelOrderRequest = {
    transaction_id: string;
    club_account_id: string;
    order_id: string;
}

type CreateOrderRequest = {
    club_account_id?: string;
    items: OrderLineItem[];
    total_amount: number;
    total_items: number;
}

type PublicCreateOrderRequest = CreateOrderRequest & {
    email: string;
    first_name: string;
    surname: string;
    email_opt_in: boolean;
}

export const createOrder = (orderData: CreateOrderRequest): Promise<any> => {
    return api.post('/orders/createOrder', orderData)
        .then(res => res.data);
}

export const publicCreateOrder = (orderData: PublicCreateOrderRequest): Promise<any> => {
    return api.post('/orders/publicCreateOrder', orderData)
        .then(res => res.data);
}

export const cancelOrder = (orderData: CancelOrderRequest): Promise<any> => {
    return api.post('/orders/cancelOrder', orderData)
        .then(res => res.data);
}