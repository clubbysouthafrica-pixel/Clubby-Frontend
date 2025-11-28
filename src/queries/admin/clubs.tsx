import { fetchAdminClubs } from "@/services/admin/admin-clubs"
import { fetchClub, fetchClubDetails } from "@/services/admin/club";
import { useQuery } from "@tanstack/react-query"

export const useFetchAdminClubs = () => {
    return useQuery({
        queryKey: ['adminClubs'],
        queryFn: fetchAdminClubs,
      })
}

export const useFetchClub = (clubAccountId: string, options?: { includeImages?: boolean }) => {
    return useQuery({
      queryKey: ['getClub', clubAccountId, options?.includeImages],
      queryFn: ({ queryKey }) => {
        const [_key, clubId] = queryKey;
        return fetchClub(clubId as string, options);
      },
      enabled: !!clubAccountId,
    });
}

export const useFetchClubDetails = (clubAccountId: string) => {
  return useQuery({
    queryKey: ['getClubDetails', clubAccountId],
    queryFn: ({ queryKey }) => {
      const [_key, clubId] = queryKey;
      return fetchClubDetails(clubId);
    },
    enabled: !!clubAccountId,
  });
}