import { RegisterClubMember } from "@/interfaces/club";
import { api } from "./api";

export const fetchClubMembers = (clubId: string) => {
    return api.get(`/clubMember/getAllClubMembers?club_account_id=${clubId}`)
        .then(res => res.data);
} 

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