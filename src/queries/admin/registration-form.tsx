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

export const useFetchMemberRegisteration = (clubAccountId: string, userId: string, currency: string) => {
  return useQuery({
    queryKey: ['memberRegistration', clubAccountId, userId, currency],
    queryFn: ({ queryKey }) => {
      const [_key, clubId, userId, currency] = queryKey;
      return fetchMemberRegistration(clubId, userId, currency);
    },
    enabled: Boolean(clubAccountId && userId && currency),
  });
};