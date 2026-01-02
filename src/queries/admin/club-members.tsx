import { fetchClubMembers } from "@/services/admin/club-members"
import { useQuery } from "@tanstack/react-query"

export const useFetchClubMembers = (clubId: string, activeKeys?: string[], memberType?: string) => {
    return useQuery({
        queryKey: ['adminClubMembers', clubId, activeKeys, memberType],
        queryFn: ({ queryKey }) => {
            const [_key, clubId, activeKeys, memberType] = queryKey as [string, string, string[] | undefined, string | undefined];
            return fetchClubMembers(clubId, activeKeys, memberType);
          },
        enabled: !!clubId,
      })
}
