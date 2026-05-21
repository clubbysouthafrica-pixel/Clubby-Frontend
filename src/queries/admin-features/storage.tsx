import {
  listStorageQuery,
  listStorageRequestQuery,
} from "@/services/admin-features/storage";
import { useQuery } from "@tanstack/react-query";

export const useFetchClubStorage = (
  clubAccountId: string,
  enabled: boolean = true,
) => {
  return useQuery({
    queryKey: ["club/storage", clubAccountId],
    queryFn: ({ queryKey }) => {
      const [_key, clubId] = queryKey;
      return listStorageQuery(clubId as string);
    },
    enabled: !!clubAccountId && enabled,
  });
};

export const useFetchClubStorageRequests = (clubAccountId?: string) => {
  return useQuery({
    queryKey: ["club/storage/requests", clubAccountId],
    queryFn: ({ queryKey }) => {
      const [_key, clubId] = queryKey;
      return listStorageRequestQuery(clubId as string);
    },
    enabled: !!clubAccountId,
  });
};
