import { updatePayFastDetails, resetPayFastDetails } from "@/services/admin/payfast";
import { useMutation } from "@tanstack/react-query";

export const useUpdatePayFastDetailsMutation = () => {
  return useMutation({
    mutationFn: updatePayFastDetails
  });
}

export const useResetPayFastDetailsMutation = () => {
  return useMutation({
    mutationFn: resetPayFastDetails
  });
}