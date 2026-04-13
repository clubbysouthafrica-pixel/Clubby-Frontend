import { getClubbyCheckoutUrl } from "@/services/admin/payfast";
import { useQuery } from "@tanstack/react-query";

export const useGetClubbyCheckoutUrlQuery = (
  clubAccountId?: string,
  yearMonth?: string,
  payAll?: boolean,
) => {
  return useQuery({
    queryKey: ["clubbyCheckoutUrl", clubAccountId, yearMonth, payAll],
    queryFn: ({ queryKey }) => {
      const [_key, clubId, month, shouldPayAll] = queryKey as [
        string,
        string | undefined,
        string | undefined,
        boolean | undefined,
      ];

      return getClubbyCheckoutUrl({
        club_account_id: clubId ?? "",
        year_month: month,
        pay_all: Boolean(shouldPayAll),
      });
    },
    enabled: false,
  });
};