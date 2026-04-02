import {
  listStorageQuery,
  listStorageRequestQuery,
} from "@/services/admin-features/storage";
import { useQuery } from "@tanstack/react-query";

export const useFetchClubStorage = (clubAccountId: string) => {
  console.log("fetching sotrage for club: ", clubAccountId);
  return useQuery({
    queryKey: ["club/storage", clubAccountId],
    queryFn: ({ queryKey }) => {
      const [_key, clubId] = queryKey;
      return listStorageQuery(clubId as string);
    },
    enabled: !!clubAccountId,
  });
};

export const useFetchClubStorageRequests = (clubAccountId: string) => {
  return useQuery({
    queryKey: ["club/storage/requests", clubAccountId],
    queryFn: ({ queryKey }) => {
      const [_key, clubId] = queryKey;
      return listStorageRequestQuery(clubId as string);
    },
    enabled: !!clubAccountId,
  });
};
