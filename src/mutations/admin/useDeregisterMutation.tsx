import { deregisterAllMembersQuery, deregisterMemberQuery } from "@/services/admin/registration-form";
import { useMutation } from "@tanstack/react-query";

export const useDeregisterAllMutation = () => {
    return useMutation({
      mutationFn: deregisterAllMembersQuery
    });
}

export const useDeregisterMemberMutation = () => {
    return useMutation({
        mutationFn: deregisterMemberQuery
    });
}