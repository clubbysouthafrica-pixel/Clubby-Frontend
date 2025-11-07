import { fetchMemberRegistration, fetchRegistrationForm } from "@/services/registration-form"
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

export const useFetchMemberRegisteration = (clubAccountId: string, currency: string) => {
  return useQuery({
    queryKey: ['memberRegistration', clubAccountId, currency],
    queryFn: ({ queryKey }) => {
      const [_key, clubId, currency] = queryKey;
      return fetchMemberRegistration(clubId, currency);
    },
    enabled: Boolean(clubAccountId && currency),
  });
};