import { api } from "./api";


export const submitAdminClubRegistration = (registrationFormRequest: string): Promise<any> => {
    return api.post(`/clubMember/submitRegistration`, registrationFormRequest)
        .then(res => res.data);
} 

export const getAllAdminMemberClubs = () => {
    return api.get(`/clubMember/getAllMemberClubs`)
        .then(res => res.data)
}

