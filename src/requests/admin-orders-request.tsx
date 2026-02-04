import { api } from "@/services/admin/api";

export const updateAdminOrderFulfillment = (clubAccountId: string, orderId: string, type: "fulfillment" | "refund_completion" = "fulfillment"): Promise<any> => {
    return api.post('/orders/updateOrderFulfillment', {
        club_account_id: clubAccountId,
        order_id: orderId,
        type: type
    })
        .then(res => ({ status: res.status, ...res.data }));
}

