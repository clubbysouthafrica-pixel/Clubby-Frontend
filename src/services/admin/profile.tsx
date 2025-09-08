import { ProfileSettings } from "@/interfaces/profile"
import { api } from "./api"

export const onboardAdminProfileService = (profileSettigsRequest: ProfileSettings): Promise<any> => {
    return api.put('/user/onboardUser', profileSettigsRequest)
        .then(res => res.data)
}

export const updateAdminProfileService = (profileSettigsRequest: ProfileSettings): Promise<any> => {
    return api.post('/user/updateUserDetails', profileSettigsRequest)
        .then(res => res.data)
}

export const getAdminProfileService = () => {
    return api.get("/user/getUser")
        .then(res => res.data)
}