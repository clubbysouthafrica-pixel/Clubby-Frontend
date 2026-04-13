import { fetchPayFastCheckoutURL } from "@/services/payfast";
import { useQuery } from "@tanstack/react-query";

interface PayFastCheckoutParams {
  transactionId?: string;
  orderId?: string;
  eventId?: string;
  eventRegistrationId?: string;
}

export const useFetchPayFastCheckoutUrlQuery = (
  clubAccountId: string,
  params?: PayFastCheckoutParams,
) => {
  return useQuery({
    queryKey: [
      "checkoutUrl",
      clubAccountId,
      params?.transactionId,
      params?.orderId,
      params?.eventId,
      params?.eventRegistrationId,
    ],
    queryFn: ({ queryKey }) => {
      const [_key, clubId, transactionId, orderId, eventId, eventRegistrationId] = queryKey;
      return fetchPayFastCheckoutURL(clubId as string, {
        transactionId: transactionId as string | undefined,
        orderId: orderId as string | undefined,
        eventId: eventId as string | undefined,
        eventRegistrationId: eventRegistrationId as string | undefined,
      });
    },
    enabled: false,
  });
};
