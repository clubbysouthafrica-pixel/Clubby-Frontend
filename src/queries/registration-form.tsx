import { fetchMemberRegistration, fetchRegistrationForm } from "@/services/registration-form"
import { useQuery } from "@tanstack/react-query"

export const useFetchRegistrationForm = (clubAccountId: string, email?: string) => {
  return useQuery({
    queryKey: ['registrationForm', clubAccountId, email],
    queryFn: ({ queryKey }) => {
      const [_key, clubId, email] = queryKey;
      return fetchRegistrationForm(clubId as string, email ?? undefined);
    },
    enabled: !!clubAccountId,
    retry: (_, error) => {
      const status = (error as { response?: { status?: number } })?.response?.status;
      return status !== 409;
    },
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