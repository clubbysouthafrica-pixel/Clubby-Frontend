import { api } from "./api";

export const generalReportingQuery = (clubId: string) => {
    return api.get(`/reporting/generalReporting?club_account_id=${clubId}`)
        .then(res => res.data);
}

export const getRegistrationBillingReporting = (clubId: string) => {
    return api.get(`/reporting/registrationBilling?club_account_id=${clubId}`)
        .then(res => res.data);
}

export const getMcsBillingReporting = (clubId: string) => {
    return api.get(`/reporting/mcsBilling?club_account_id=${clubId}`)
        .then(res => res.data);
}