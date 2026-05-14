import { api } from "./api";

const appendSeasonCycle = (params: URLSearchParams, seasonCycle?: number) => {
    if (seasonCycle !== undefined) {
        params.append('season_cycle', seasonCycle.toString());
    }
};

export const generalReportingQuery = (clubId: string, seasonCycle?: number) => {
    const params = new URLSearchParams({ club_account_id: clubId });
    appendSeasonCycle(params, seasonCycle);
    return api.get(`/reporting/generalReporting?${params.toString()}`)
        .then(res => res.data);
}

export const getRegistrationBillingReporting = (clubId: string, seasonCycle?: number) => {
    const params = new URLSearchParams({ club_account_id: clubId });
    appendSeasonCycle(params, seasonCycle);
    return api.get(`/reporting/registrationBilling?${params.toString()}`)
        .then(res => res.data);
}

export const getMcsBillingReporting = (clubId: string, seasonCycle?: number) => {
    const params = new URLSearchParams({ club_account_id: clubId });
    appendSeasonCycle(params, seasonCycle);
    return api.get(`/reporting/mcsBilling?${params.toString()}`)
        .then(res => res.data);
}

export const getShopReporting = (clubId: string, seasonCycle?: number) => {
    const params = new URLSearchParams({ club_account_id: clubId });
    appendSeasonCycle(params, seasonCycle);
    return api.get(`/reporting/shopReporting?${params.toString()}`)
        .then(res => res.data);
}