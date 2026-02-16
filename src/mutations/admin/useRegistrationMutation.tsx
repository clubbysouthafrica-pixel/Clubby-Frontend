import { createRegistrationForm, removeRegistration, archiveRegistration } from "@/services/admin/registration-form";
import { useMutation } from "@tanstack/react-query";

export const useCreateClubMutation = () => {
  return useMutation({
    mutationFn: createRegistrationForm
  });
}

export const useRemoveRegistrationMutation = () => {
  return useMutation({
    mutationFn: ({ user_id, registration_id }: { user_id: string; registration_id: string }) =>
      removeRegistration(user_id, registration_id)
  });
}

export const useArchiveRegistrationMutation = () => {
  return useMutation({
    mutationFn: ({ user_id, registration_id }: { user_id: string; registration_id: string }) =>
      archiveRegistration(user_id, registration_id)
  });
}