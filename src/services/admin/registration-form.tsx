import { DeregisterMemberRequest } from "@/requests/registration-request";
import { api } from "./api";
import { FormRegistrationRequest } from "@/interfaces/formRegistration";

export const createRegistrationForm = (registrationRequest: FormRegistrationRequest) => {
    return api.post("/registration/createRegistrationForm", registrationRequest)
        .then(res => res.data);
}

export const fetchRegistrationForm = (clubAccountId: string): Promise<any> => {
    if (!clubAccountId) throw new Error("no club set")

    return api.get(`/registration/getForm?club_account_id=${clubAccountId}`)
        .then(res => res.data);
} 
export const deregisterAllMembersQuery = (clubId: string) => {
    return api.post("/deregistration/season", {club_account_id: clubId})
        .then(res => res.data);
}

export const deregisterMembersQuery = (request: DeregisterMemberRequest) => {
    console.log({club_account_id: request.clubId, user_ids: request.userIds})
    return api.post("/deregistration/members", {club_account_id: request.clubId, user_ids: request.userIds})
        .then(res => res.data);
}