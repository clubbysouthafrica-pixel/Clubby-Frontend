import { getClubProducts } from "@/services/admin/shop";
import { useQuery } from "@tanstack/react-query";

export const useFetchClubProducts = (clubAccountId: string) => {
    return useQuery({
        queryKey: ['clubProducts', clubAccountId],
        queryFn: ({ queryKey }) => {
            const [_key, clubId] = queryKey;
            return getClubProducts(clubId as string);
        },
        enabled: !!clubAccountId,
    });
}