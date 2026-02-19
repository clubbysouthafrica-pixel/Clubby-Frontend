import { fetchRegistrationForm, fetchMemberRegistration } from "@/services/admin/registration-form"
import { useQuery } from "@tanstack/react-query"

export const useFetchRegistrationForm = (clubAccountId: string) => {
  return useQuery({
    queryKey: ['registrationForm', clubAccountId],
    queryFn: ({ queryKey }) => {
      const [_key, clubId] = queryKey;
      return fetchRegistrationForm(clubId);
    },
    enabled: !!clubAccountId,
  });
};

export const useFetchMemberRegisteration = (clubAccountId: string, userId: string, currency: string, registrationId?: string) => {
  return useQuery({
    queryKey: ['memberRegistration', clubAccountId, userId, currency, registrationId],
    queryFn: ({ queryKey }) => {
      const [_key, clubId, userId, currency, regId] = queryKey as [string, string, string, string, string | undefined];
      return fetchMemberRegistration(clubId, userId, currency, regId);
    },
    enabled: Boolean(clubAccountId && userId && currency),
  });
};