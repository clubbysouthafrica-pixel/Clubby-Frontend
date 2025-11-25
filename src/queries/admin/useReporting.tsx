import { generalReportingQuery, getMcsBillingReporting, getRegistrationBillingReporting } from "@/services/admin/reporting-query";
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

export const useMcsBillingReportingQuery = (clubAccountId: string) => {
  return useQuery({
    queryKey: ['queryMcsBillingReporting', clubAccountId],
    queryFn: ({ queryKey }) => {
      const [_key, clubId] = queryKey;
      return getMcsBillingReporting(clubId);
    },
    enabled: !!clubAccountId,
  });
};