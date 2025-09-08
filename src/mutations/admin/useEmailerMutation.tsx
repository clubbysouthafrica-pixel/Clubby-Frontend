import { useSendEmail } from "@/services/admin/mail";
import { useMutation } from "@tanstack/react-query";

export const useEmailerProcessMutation = () => {
  return useMutation({
    mutationFn: useSendEmail
  });
}