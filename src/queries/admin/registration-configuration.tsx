import { fetchRegistrationConfiguration } from "@/services/admin/registration-configuration";
import { useQuery } from "@tanstack/react-query";

export const useFetchRegistrationConfiguration = (clubAccountId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['getRegistrationConfiguration', clubAccountId],
    queryFn: ({ queryKey }) => {
      const [, clubId] = queryKey;
      return fetchRegistrationConfiguration(clubId as string);
    },
    enabled: !!clubAccountId && enabled,
  });
}
