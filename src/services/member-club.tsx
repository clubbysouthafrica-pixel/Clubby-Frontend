import { api } from "./api";


export const submitClubRegistration = (registrationFormRequest: string): Promise<any> => {
    return api.post(`/clubMember/submitRegistration`, registrationFormRequest)
        .then(res => res.data);
} 

export const getAllMemberClubs = () => {
    return api.get(`/clubMember/getAllMemberClubs`)
        .then(res => res.data)
}
