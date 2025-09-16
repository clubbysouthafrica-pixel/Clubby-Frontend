import { generalReportingQuery, getMcsBillingReporting, getRegistrationBillingReporting } from "@/services/admin/reporting-query";
import { useQuery } from "@tanstack/react-query"

export const useGeneralReportingQuery = (clubAccountId: string) => {
  return useQuery({
    queryKey: ['queryGeneralReporting', clubAccountId],
    queryFn: ({ queryKey }) => {
      const [_key, clubId] = queryKey;
      return generalReportingQuery(clubId);
    },
    enabled: !!clubAccountId,
  });
};

export const useRegistrationBillingReportingQuery = (clubAccountId: string) => {
  return useQuery({
    queryKey: ['queryRegistrationBillingReportin', clubAccountId],
    queryFn: ({ queryKey }) => {
      const [_key, clubId] = queryKey;
      return getRegistrationBillingReporting(clubId);
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