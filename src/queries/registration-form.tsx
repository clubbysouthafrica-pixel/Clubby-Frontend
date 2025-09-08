import { fetchRegistrationForm } from "@/services/registration-form"
import { useQuery } from "@tanstack/react-query"

export const useFetchRegisterationForm = (clubAccountId: string) => {
  return useQuery({
    queryKey: ['registrationForm', clubAccountId],
    queryFn: ({ queryKey }) => {
      const [_key, clubId] = queryKey;
      return fetchRegistrationForm(clubId);
    },
    enabled: !!clubAccountId,
  });
};