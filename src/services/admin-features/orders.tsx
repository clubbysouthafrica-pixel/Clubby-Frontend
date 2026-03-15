import { api } from "./api";

interface FetchClubOrdersResponse {
    status: number;
    data: any;
    message?: string;
}

interface ConfirmOrderPaymentRequest {
    order_id: string;
    club_account_id: string;
    transaction_id: string;
    payment_amount: number;
    payment_type: string;
}

interface Item {
    product_id: string;
    name: string;
    quantity: number;
    price: number;
    subtotal?: number;
}

interface RefundOrRemoveRequest {
    transaction_id: string;
    order_id: string;
    club_account_id: string;
    refund_amount?: number;
    is_full_refund?: boolean;
    items: Item[];
}

export const getClubOrders = async (
  clubAccountId: string,
  limit?: number,
  pageToken?: string,
  filters?: {
    transaction_id?: string;
    member_name?: string;
    payment_status?: string;
    fulfillment_status?: string;
  }
): Promise<FetchClubOrdersResponse> => {
  try {
    let url = `/orders/getClubOrders?club_account_id=${clubAccountId}`;
    
    if (limit) url += `&limit=${limit}`;
    if (pageToken) url += `&pageToken=${pageToken}`;
    if (filters?.transaction_id) url += `&transaction_id=${encodeURIComponent(filters.transaction_id)}`;
    if (filters?.member_name) url += `&member_name=${encodeURIComponent(filters.member_name)}`;
    if (filters?.payment_status && filters.payment_status !== "all") url += `&payment_status=${encodeURIComponent(filters.payment_status)}`;
    if (filters?.fulfillment_status && filters.fulfillment_status !== "all") url += `&fulfillment_status=${encodeURIComponent(filters.fulfillment_status)}`;
    
    
    const res = await api.get(url);
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

export const refundOrRemoveOrder = async (payload: RefundOrRemoveRequest): Promise<FetchClubOrdersResponse> => {
    try {
        const res = await api.post("/orders/refundOrRemove", payload);
        return { status: res.status, data: res.data };
    } catch (err: any) {
        if (err.response) {
            return { status: err.response.status, data: err.response.data };
        }
        throw err;
    }
};

interface UpdateFulfillmentRequest {
    orders: {
        order_id: string;
        product_id: string;
    }[];
    club_account_id: string;
}

export const updateAdminOrderFulfillment = async (payload: UpdateFulfillmentRequest): Promise<FetchClubOrdersResponse> => {
    try {
        const res = await api.post("/orders/updateOrderFulfillment", payload);
        return { status: res.status, data: res.data };
    } catch (err: any) {
        if (err.response) {
            return { status: err.response.status, data: err.response.data };
        }
        throw err;
    }
};
