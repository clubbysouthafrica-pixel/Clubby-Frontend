import { getClubbyCheckoutUrl } from "@/services/admin/payfast";
import { useQuery } from "@tanstack/react-query";

export const useGetClubbyCheckoutUrlQuery = (
  clubAccountId?: string,
  userId?: string,
  yearMonth?: string,
  payAll?: boolean,
) => {
  return useQuery({
    queryKey: ["clubbyCheckoutUrl", clubAccountId, userId, yearMonth, payAll],
    queryFn: ({ queryKey }) => {
      const [_key, clubId, requestedUserId, month, shouldPayAll] = queryKey as [
        string,
        string | undefined,
        string | undefined,
        string | undefined,
        boolean | undefined,
      ];

      return getClubbyCheckoutUrl({
        club_account_id: clubId ?? "",
        userId: requestedUserId,
        year_month: month,
        pay_all: Boolean(shouldPayAll),
      });
    },
    enabled: false,
  });
};