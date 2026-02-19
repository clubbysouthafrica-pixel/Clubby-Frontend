import { fetchMemberUser } from "@/services/admin/member-user"
import { useQuery } from "@tanstack/react-query"

export const useFetchMemberUser = (memberUserId: string, registrationId?: string) => {
    return useQuery({
        queryKey: ['adminMemberUser', memberUserId, registrationId],
        queryFn: ({ queryKey }) => {
            const [_key, userId, regId] = queryKey as [string, string, string | undefined];
            return fetchMemberUser(userId, regId);
          },
        enabled: !!(memberUserId || registrationId),
        staleTime: 0,
        gcTime: 0,
      })
}
 