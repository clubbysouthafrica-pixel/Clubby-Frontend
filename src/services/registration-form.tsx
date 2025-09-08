import { RegistrationRequest } from "@/requests/registration-request";
import { api } from "./api";

export const fetchRegistrationForm = (clubAccountId: string): Promise<any> => {
    if (!clubAccountId) throw new Error("no club set")

    return api.get(`/registration/getForm?club_account_id=${clubAccountId}`)
        .then(res => res.data);
} 

export const createMemberRegistrationForm = (registrationFromRequest: RegistrationRequest): Promise<any> => {
    return api.put('/clubMember/submitRegistration', registrationFromRequest)
        .then(res => res.data)
}