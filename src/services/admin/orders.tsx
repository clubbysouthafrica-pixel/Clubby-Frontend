import { api } from "./api";

interface FetchClubOrdersResponse {
    status: number;
    data: any;
}

interface ConfirmOrderPaymentRequest {
    order_id: string;
    club_account_id: string;
    transaction_id: string;
    payment_amount: number;
    payment_type: string;
}

export const getClubOrders = async (clubAccountId: string): Promise<FetchClubOrdersResponse> => {
    try {
        const res = await api.get(`/orders/getClubOrders?club_account_id=${clubAccountId}`);
        return { status: res.status, data: res.data };
    } catch (err: any) {
        if (err.response) {
            return { status: err.response.status, data: err.response.data };
        }
        throw err;
    }
};

export const confirmOrderPayment = async (payload: ConfirmOrderPaymentRequest): Promise<FetchClubOrdersResponse> => {
    try {
        const res = await api.post("/orders/confirmOrderPayment", payload);
        return { status: res.status, data: res.data };
    } catch (err: any) {
        if (err.response) {
            return { status: err.response.status, data: err.response.data };
        }
        throw err;
    }
};
