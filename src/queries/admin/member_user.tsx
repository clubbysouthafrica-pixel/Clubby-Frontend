import { fetchMemberUser } from "@/services/admin/member-user"
import { useQuery } from "@tanstack/react-query"

export const useFetchMemberUser = (memberUserId: string) => {
    return useQuery({
        queryKey: ['adminMemberUser', memberUserId],
        queryFn: ({ queryKey }) => {
            const [_key, memberUserId] = queryKey;
            return fetchMemberUser(memberUserId);
          },
        enabled: !!memberUserId,
      })
}
