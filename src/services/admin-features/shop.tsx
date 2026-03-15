import { api } from "./api";

export interface AddProductRequest {
    club_account_id: string;
    name: string;
    price: number;
    active_product: boolean;
    purchase_limit: "single" | "multiple";
    description?: string;
    product_image?: string;
}

export interface UpdateProductRequest {
    product_id: string;
    club_account_id: string;
    name?: string;
    initial_quantity?: number;
    active_product?: boolean;
    product_image?: string;
}

export const addProduct = (productRequest: AddProductRequest): Promise<any> => {
    return api.post("/shop/addProduct", productRequest)
        .then(res => res.data);
}

export const getClubProducts = (clubAccountId: string): Promise<any> => {
    return api.get(`/shop/getClubProducts?club_account_id=${clubAccountId}`)
        .then(res => res.data);
}

export const updateProduct = (updateRequest: UpdateProductRequest): Promise<any> => {
    return api.post("/shop/updateProduct", updateRequest)
        .then(res => res.data);
}