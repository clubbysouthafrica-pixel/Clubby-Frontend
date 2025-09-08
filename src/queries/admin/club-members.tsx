import { fetchClubMembers } from "@/services/admin/club-members"
import { useQuery } from "@tanstack/react-query"

export const useFetchClubMembers = (clubId: string) => {
    return useQuery({
        queryKey: ['adminClubMembers', clubId],
        queryFn: ({ queryKey }) => {
            const [_key, clubId] = queryKey;
            return fetchClubMembers(clubId);
          },
        enabled: !!clubId,
      })
}
