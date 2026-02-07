import { generalReportingQuery, getMcsBillingReporting, getRegistrationBillingReporting, getShopReporting } from "@/services/admin/reporting-query";
import { useQuery } from "@tanstack/react-query"

export const useGeneralReportingQuery = (clubAccountId: string, seasonCycle?: number) => {
  return useQuery({
    queryKey: ['queryGeneralReporting', clubAccountId, seasonCycle],
    queryFn: ({ queryKey }) => {
      const [_key, clubId, season] = queryKey as [string, string, number | undefined];
      return generalReportingQuery(clubId, season);
    },
    enabled: !!clubAccountId,
  });
};

export const useRegistrationBillingReportingQuery = (clubAccountId: string, seasonCycle?: number) => {
  return useQuery({
    queryKey: ['queryRegistrationBillingReportin', clubAccountId, seasonCycle],
    queryFn: ({ queryKey }) => {
      const [_key, clubId, season] = queryKey as [string, string, number | undefined];
      return getRegistrationBillingReporting(clubId, season);
    },
    enabled: !!clubAccountId,
  });
};

export const useMcsBillingReportingQuery = (clubAccountId: string, seasonCycle?: number) => {
  return useQuery({
    queryKey: ['queryMcsBillingReporting', clubAccountId, seasonCycle],
    queryFn: ({ queryKey }) => {
      const [_key, clubId, season] = queryKey as [string, string, number | undefined];
      return getMcsBillingReporting(clubId, season);
    },
    enabled: !!clubAccountId,
  });
};

export const useShopReportingQuery = (clubAccountId: string, seasonCycle?: number) => {
  return useQuery({
    queryKey: ['queryShopReporting', clubAccountId, seasonCycle],
    queryFn: ({ queryKey }) => {
      const [_key, clubId, season] = queryKey as [string, string, number | undefined];
      return getShopReporting(clubId, season);
    },
    enabled: !!clubAccountId,
  });
};