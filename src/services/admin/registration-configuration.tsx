import { RegistrationConfigurationRequest } from "@/requests/registration-configuration-request";
import { RegistrationConfigurationResponse } from "@/interfaces/registration-configuration";
import { api } from "./api";

export const fetchRegistrationConfiguration = (clubAccountId: string): Promise<RegistrationConfigurationResponse> => {
    return api.get(`registrationConfiguration/getRegistrationConfiguration?club_account_id=${clubAccountId}`).then(res => res.data)
}

export const updateRegistrationConfiguration = (registrationConfigurationRequest: RegistrationConfigurationRequest) => {
    return api.post("registrationConfiguration/updateRegistrationConfiguration", registrationConfigurationRequest).then(res => res.data)
}
