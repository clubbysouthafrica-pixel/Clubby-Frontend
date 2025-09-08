import { getAllAdminMemberClubs } from "@/services/admin/member-club";
import { getAllMemberClubs } from "@/services/member-club";
import { useQuery } from "@tanstack/react-query"

export const useFetchMemberClubsQuery = (isAdmin: boolean) => {
  return useQuery({
    queryKey: ['listMemberClubs'],
    queryFn: isAdmin ? getAllAdminMemberClubs: getAllMemberClubs,
  });
};