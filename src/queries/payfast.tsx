import { fetchPayFastCheckoutURL } from "@/services/payfast";
import { useQuery } from "@tanstack/react-query";

export const useFetchPayFastCheckoutUrlQuery = (clubAccountId: string, orderId?: string) => {
  return useQuery({
    queryKey: ["checkoutUrl", clubAccountId, orderId],
    queryFn: ({ queryKey }) => {
      const [_key, clubId, orderIdParam] = queryKey;
      return fetchPayFastCheckoutURL(clubId as string, orderIdParam);
    },
    enabled: !!clubAccountId,
  });
};
