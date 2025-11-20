import { ClubMember } from "@/interfaces/club";

export function filteredRegisteredMembers(
    selectedTab: string,
    clubMembers: any,
    memberNameFilter: string,
    dynamicFilters: any
): any {
    return selectedTab === "registered-members"
        ? clubMembers?.registered?.filter((member: ClubMember) => {
            const fullName = (member.member_first_name + " " + member.member_surname).toLowerCase();
            if (!fullName.includes(memberNameFilter.toLowerCase())) return false;

            for (const [fullKey, selectedValue] of Object.entries(dynamicFilters)) {
                if (!selectedValue || selectedValue === "all") continue;
                const [type, fieldName] = fullKey.split(":");

                if (type === "standard") {
                    const field = member.meta_standard?.find((f: any) => f.field_name === fieldName);
                    if (!field) return false;
                    // Text filter: check if field value includes the filter text
                    if (typeof selectedValue === "string" && selectedValue.trim()) {
                        if (!field.value?.toString().toLowerCase().includes(selectedValue.toLowerCase())) return false;
                    }
                }

                if (type === "billing") {
                    const field = member.meta_billing?.find((f: any) => f.field_name === fieldName);
                    if (!field || field.label_value !== selectedValue) return false;
                }
            }

            return true;
        }) ?? []
        : clubMembers?.registered ?? [];
}

export function previousRegisteredMembers(
    selectedTab: string,
    clubMembers: any,
    memberNameFilter: string,
    dynamicFilters: any
): any {
    return selectedTab === "previous-members"
            ? clubMembers?.unregistered?.filter((member: ClubMember) => {
                const fullName = (member.member_first_name + " " + member.member_surname).toLowerCase();
                if (!fullName.includes(memberNameFilter.toLowerCase())) return false;

                if (!member?.resubmission_required) return false

                for (const [fullKey, selectedValue] of Object.entries(dynamicFilters)) {
                    if (!selectedValue || selectedValue === "all") continue;
                    const [type, fieldName] = fullKey.split(":");

                    if (type === "standard") {
                        const field = member.meta_standard?.find((f: any) => f.field_name === fieldName);
                        if (!field) return false;
                        // Text filter: check if field value includes the filter text
                        if (typeof selectedValue === "string" && selectedValue.trim()) {
                            if (!field.value?.toString().toLowerCase().includes(selectedValue.toLowerCase())) return false;
                        }
                    }

                    if (type === "billing") {
                        const field = member.meta_billing?.find((f: any) => f.field_name === fieldName);
                        if (!field || field.label_value !== selectedValue) return false;
                    }
                }

                return true;
            }) ?? []
            : clubMembers?.unregistered?.filter((member: ClubMember) => member?.resubmission_required) ?? [];
}

export function pendingRegisteredMembers(
    selectedTab: string,
    clubMembers: any,
    memberNameFilter: string,
    dynamicFilters: any
): any {
    return selectedTab === "pending-members"
            ? clubMembers?.unregistered?.filter((member: ClubMember) => {
                const fullName = (member.member_first_name + " " + member.member_surname).toLowerCase();
                if (!fullName.includes(memberNameFilter.toLowerCase())) return false;

                if (member?.resubmission_required) return false

                for (const [fullKey, selectedValue] of Object.entries(dynamicFilters)) {
                    if (!selectedValue || selectedValue === "all") continue;
                    const [type, fieldName] = fullKey.split(":");

                    if (type === "standard") {
                        const field = member.meta_standard?.find((f: any) => f.field_name === fieldName);
                        if (!field) return false;
                        // Text filter: check if field value includes the filter text
                        if (typeof selectedValue === "string" && selectedValue.trim()) {
                            if (!field.value?.toString().toLowerCase().includes(selectedValue.toLowerCase())) return false;
                        }
                    }

                    if (type === "billing") {
                        const field = member.meta_billing?.find((f: any) => f.field_name === fieldName);
                        if (!field || field.label_value !== selectedValue) return false;
                    }
                }

                return true;
            }) ?? []
            : clubMembers?.unregistered?.filter((member: ClubMember) => !member?.resubmission_required) ?? [];
}