import { deregisterAllMembersQuery, deregisterMembersQuery } from "@/services/admin/registration-form";
import { useMutation } from "@tanstack/react-query";

export const useDeregisterAllMutation = () => {
    return useMutation({
      mutationFn: deregisterAllMembersQuery
    });
}

export const useDeregisterMembersMutation = () => {
    return useMutation({
        mutationFn: deregisterMembersQuery
    });
}