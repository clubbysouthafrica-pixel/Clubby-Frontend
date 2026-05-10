import { useMutation } from "@tanstack/react-query";
import {
  resetSnapScanDetails,
  updateSnapScanDetails,
} from "@/services/snapscan/details";

export const useUpdateSnapScanDetailsMutation = () => {
  return useMutation({
    mutationFn: updateSnapScanDetails,
  });
};

export const useResetSnapScanDetailsMutation = () => {
  return useMutation({
    mutationFn: resetSnapScanDetails,
  });
};