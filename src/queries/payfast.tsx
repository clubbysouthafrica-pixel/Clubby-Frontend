import { fetchPayFastCheckoutURL } from "@/services/payfast";
import { useQuery } from "@tanstack/react-query";

export const useFetchPayFastCheckoutUrlQuery = (clubAccountId: string) => {
  return useQuery({
    queryKey: ["checkoutUrl", clubAccountId],
    queryFn: ({ queryKey }) => {
      const [_key, clubId] = queryKey;
      return fetchPayFastCheckoutURL(clubId);
    },
    enabled: !!clubAccountId,
  });
};
