import { ProfileSettings } from "@/interfaces/profile"
import { api } from "./api"


export const onboardProfileService = (profileSettigsRequest: ProfileSettings): Promise<any> => {
    return api.put('/user/onboardUser', profileSettigsRequest)
        .then(res => res.data)
}

export const updateProfileService = (profileSettigsRequest: ProfileSettings): Promise<any> => {
    return api.post('/user/updateUserDetails', profileSettigsRequest)
        .then(res => res.data)
}

export const getProfileService = () => {
    return api.get("/user/getUser")
        .then(res => res.data)
}