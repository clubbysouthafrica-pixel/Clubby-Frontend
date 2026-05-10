import {
  fetchSnapScanQRCode,
  type FetchSnapScanQRCodeRequest,
  type FetchSnapScanQRCodeResponse,
} from "@/services/snapscan/details";
import { useQuery } from "@tanstack/react-query";

export const useFetchSnapScanQRCodeQuery = (
  request?: FetchSnapScanQRCodeRequest | null,
  enabled = false,
) => {
  return useQuery<FetchSnapScanQRCodeResponse>({
    queryKey: [
      "snapscan-qr-code",
      request?.club_account_id,
      request?.user_id,
      request?.transaction_id,
    ],
    queryFn: () => {
      if (!request) {
        throw new Error("Missing SnapScan QR code request.");
      }

      return fetchSnapScanQRCode(request);
    },
    enabled: enabled && !!request,
  });
};