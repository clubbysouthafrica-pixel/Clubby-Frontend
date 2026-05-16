import { RegisterClubMember } from "@/interfaces/club";
import { api } from "./api";
import {
    getClubMember,
    type GetClubMemberResponse,
} from "@/services/club-members";

export type { GetClubMemberResponse };

export const fetchClubMembers = (clubId: string, activeKeys?: string[], memberType?: string, limit?: number, pageToken?: string, memberName?: string, memberId?: string, customFilters?: Array<{ field_id: string; type: string; input_type: string; value: string; condition?: string }>, page?: string, showArchived?: boolean) => {
    const params = new URLSearchParams();
    params.append("club_account_id", clubId);
    params.append("limit", (limit || 5).toString());
    if (memberType) {
        params.append("memberType", memberType);
    }
    if (activeKeys && activeKeys.length > 0) {
        params.append("activeKeys", activeKeys.join(','));
    }
    if (pageToken && typeof pageToken === "string") {
        params.append("pageToken", pageToken);
    }
    if (page) {
        params.append("page", page);
    }
    if (showArchived) {
        params.append("show_archived", "true");
    }
    
    const requestBody: any = {};
    const memberFilters: any = {};
    
    if (memberName && memberName.trim()) {
        memberFilters.member_name = memberName;
    }
    if (memberId && memberId.trim()) {
        memberFilters.member_id = memberId;
    }
    
    if (Object.keys(memberFilters).length > 0) {
        requestBody.member_filters = memberFilters;
    }
    
    if (customFilters && customFilters.length > 0) {
        requestBody.custom_filters = customFilters;
    }
    
    return api.post(`/clubMember/getAllClubMembers?${params.toString()}`, requestBody)
        .then(res => res.data);
} 

export { getClubMember };

export const registerMemberToClub = (request: RegisterClubMember) => 
    api.post("/clubMember/registerMember", {
        club_account_id: request.clubId,
        member_id: request.userId,
        payment_amount: request.payment_amount,
        payment_method: request.payment_method,
        template_variables: request.template_variables
    }).then(res => res.data)

export const removeMember = (clubAccountId: string, memberIds: string[]) =>
    api.post(`/clubMember/removeMember?club_account_id=${clubAccountId}`, {
        member_ids: memberIds
    }).then(res => res.data)

export const updateMemberVariable = (
    clubAccountId: string,
    userId: string,
    variableName: string,
    variableValue: string | number | boolean
) => {
    return api.post(
        `/clubMember/updateVariables?club_account_id=${clubAccountId}&user_id=${userId}`,
        {
            variable_name: variableName,
            variable_value: variableValue
        }
    ).then(res => res.data);
}