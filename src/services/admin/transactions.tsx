import { api } from "./api";

export const getMemberTransactions = (clubId: string, userId: string, limit?: number, pageToken?: string) => {
    const params = new URLSearchParams({
        club_account_id: clubId,
        user_id: userId,
    });
    
    if (limit) params.append('limit', limit.toString());
    if (pageToken) params.append('page_token', pageToken);
    
    return api.post(`/transactions/member?${params.toString()}`)
        .then(res => res.data);
}

export const getClubTransactions = (clubId: string, limit?: number, pageToken?: string, filters?: { transaction_id?: string; member_id?: string; transaction_type?: string; status?: string }) => {
    const params = new URLSearchParams({
        club_account_id: clubId,
    });
    
    if (limit) params.append('limit', limit.toString());
    if (pageToken) params.append('page_token', pageToken);
    
    const requestBody: any = {};
    
    if (filters) {
        const filterObj: any = {};
        if (filters.transaction_id?.trim()) {
            filterObj.transaction_id = filters.transaction_id;
        }
        if (filters.member_id?.trim()) {
            filterObj.member_id = filters.member_id;
        }
        if (filters.transaction_type && filters.transaction_type !== "all") {
            filterObj.transaction_type = filters.transaction_type;
        }
        if (filters.status && filters.status !== "all") {
            filterObj.status = filters.status;
        }
        if (Object.keys(filterObj).length > 0) {
            requestBody.filters = filterObj;
        }
    }
    
    return api.post(`/transactions/club?${params.toString()}`, requestBody)
        .then(res => res.data);
}