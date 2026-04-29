import { fetchPayFastCheckoutURL } from "@/services/payfast";
import { useQuery } from "@tanstack/react-query";

interface PayFastCheckoutParams {
  userId?: string;
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
      params?.userId,
      params?.transactionId,
      params?.orderId,
      params?.eventId,
      params?.eventRegistrationId,
    ],
    queryFn: ({ queryKey }) => {
      const [_key, clubId, userId, transactionId, orderId, eventId, eventRegistrationId] = queryKey;
      return fetchPayFastCheckoutURL(clubId as string, {
        userId: userId as string | undefined,
        transactionId: transactionId as string | undefined,
        orderId: orderId as string | undefined,
        eventId: eventId as string | undefined,
        eventRegistrationId: eventRegistrationId as string | undefined,
      });
    },
    enabled: false,
  });
};
