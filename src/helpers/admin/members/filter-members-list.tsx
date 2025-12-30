import { ClubMember } from "@/interfaces/club";

export function filteredRegisteredMembers(
    selectedTab: string,
    clubMembers: any,
    memberNameFilter: string,
    memberIdFilter: string,
    dynamicFilters: any
): any {
    return selectedTab === "registered-members"
        ? clubMembers?.registered?.filter((member: ClubMember) => {
            
            const fullName = (member.member_first_name + " " + member.member_surname).toLowerCase();
            if (!fullName.includes(memberNameFilter.toLowerCase())) return false;
            
            const memberId = member.user_id?.toString().toLowerCase() || "";
            const idFilterStr = String(memberIdFilter || "").toLowerCase();
            if (idFilterStr && !memberId.includes(idFilterStr)) return false;

            for (const [fullKey, selectedValue] of Object.entries(dynamicFilters)) {
                if (!selectedValue || selectedValue === "all") {
                    continue;
                }
                
                // Parse type and fieldName - handle "billing:number" as a single type
                let type: string;
                let fieldName: string;
                if (fullKey.startsWith("billing:number:")) {
                    type = "billing:number";
                    fieldName = fullKey.substring("billing:number:".length);
                } else {
                    const parts = fullKey.split(":");
                    type = parts[0];
                    fieldName = parts.slice(1).join(":");
                }

                if (type === "standard") {
                    const field = member.meta_standard?.find((f: any) => f.field_name === fieldName);
                    if (field && typeof selectedValue === "string" && selectedValue.trim()) {
                        if (!field.value?.toString().toLowerCase().includes(selectedValue.toLowerCase())) {
                            return false;
                        }
                    }
                }

                if (type === "billing") {
                    const field = member.meta_billing?.find((f: any) => f.field_name === fieldName);
                    
                    // Check if this is a numeric billing field
                    if (field?.type === "BILLING_NUMBER") {
                        // Handle as numeric billing field with operator
                        if (typeof selectedValue === "object" && selectedValue !== null) {
                            const { operator, value } = selectedValue as { operator: string; value: string };
                            
                            if (!value || value === "") {
                                continue;
                            }
                            
                            // If field doesn't exist or has no value, exclude the member
                            if (!field || field.value === null || field.value === undefined || field.value === "") {
                                return false;
                            }
                            
                            const fieldValue = parseFloat(field.value) || 0;
                            const compareValue = parseFloat(value) || 0;
                            
                            switch (operator) {
                                case "eq":
                                    if (fieldValue !== compareValue) {
                                        return false;
                                    }
                                    break;
                                case "gt":
                                    if (fieldValue <= compareValue) {
                                        return false;
                                    }
                                    break;
                                case "gte":
                                    if (fieldValue < compareValue) {
                                        return false;
                                    }
                                    break;
                                case "lt":
                                    if (fieldValue >= compareValue) {
                                        return false;
                                    }
                                    break;
                                case "lte":
                                    if (fieldValue > compareValue) {
                                        return false;
                                    }
                                    break;
                                case "neq":
                                    if (fieldValue === compareValue) {
                                        return false;
                                    }
                                    break;
                            }
                        }
                    }} else if (!field && typeof selectedValue === "object" && selectedValue !== null && (selectedValue as { value?: any }).value) {{
                        // Field not found but we're trying to filter by billing:number with a non-empty value - exclude this member
                        return false;
                    } else if (field && field.label_value !== selectedValue) {
                        return false;
                    }
                }

                if (type === "billing:number") {
                    const field = member.meta_billing?.find((f: any) => f.field_name === fieldName);
                    
                    // selectedValue should be an object like { operator: "gt", value: "100" }
                    if (typeof selectedValue === "object" && selectedValue !== null) {
                        const { operator, value } = selectedValue as { operator: string; value: string };
                        // Skip if value is empty
                        if (!value || value === "") {
                            continue;
                        }
                        
                        // If field doesn't exist or has no value, exclude the member
                        if (!field || field.value === null || field.value === undefined || field.value === "") {
                            return false;
                        }
                        
                        const fieldValue = parseFloat(field.value) || 0;
                        const compareValue = parseFloat(value) || 0;
                        
                        switch (operator) {
                            case "eq":
                                if (fieldValue !== compareValue) {
                                    return false;
                                }
                                break;
                            case "gt":
                                if (fieldValue <= compareValue) {
                                    return false;
                                }
                                break;
                            case "gte":
                                if (fieldValue < compareValue) {
                                    return false;
                                }
                                break;
                            case "lt":
                                if (fieldValue >= compareValue) {
                                    return false;
                                }
                                break;
                            case "lte":
                                if (fieldValue > compareValue) {
                                    return false;
                                }
                                break;
                            case "neq":
                                if (fieldValue === compareValue) {
                                    return false;
                                }
                                break;
                        }
                    }
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
    memberIdFilter: string,
    dynamicFilters: any
): any {
    return selectedTab === "previous-members"
            ? clubMembers?.unregistered?.filter((member: ClubMember) => {
                const fullName = (member.member_first_name + " " + member.member_surname).toLowerCase();
                if (!fullName.includes(memberNameFilter.toLowerCase())) return false;
                
                const memberId = member.user_id?.toString().toLowerCase() || "";
                const idFilterStr = String(memberIdFilter || "").toLowerCase();
                if (idFilterStr && !memberId.includes(idFilterStr)) return false;

                if (!member?.resubmission_required) return false

                for (const [fullKey, selectedValue] of Object.entries(dynamicFilters)) {
                    if (!selectedValue || selectedValue === "all") continue;
                    
                    // Parse type and fieldName - handle "billing:number" as a single type
                    let type: string;
                    let fieldName: string;
                    if (fullKey.startsWith("billing:number:")) {
                        type = "billing:number";
                        fieldName = fullKey.substring("billing:number:".length);
                    } else {
                        const parts = fullKey.split(":");
                        type = parts[0];
                        fieldName = parts.slice(1).join(":");
                    }

                    if (type === "standard") {
                        const field = member.meta_standard?.find((f: any) => f.field_name === fieldName);
                        if (field && typeof selectedValue === "string" && selectedValue.trim()) {
                            if (!field.value?.toString().toLowerCase().includes(selectedValue.toLowerCase())) return false;
                        }
                    }

                    if (type === "billing") {
                        const field = member.meta_billing?.find((f: any) => f.field_name === fieldName);
                        
                        // Check if this is a numeric billing field
                        if (field?.type === "BILLING_NUMBER") {
                            // Handle as numeric billing field with operator
                            if (typeof selectedValue === "object" && selectedValue !== null) {
                                const { operator, value } = selectedValue as { operator: string; value: string };
                                // Skip if value is empty
                                if (!value || value === "") continue;
                                
                                const fieldValue = parseFloat(field.value) || 0;
                                const compareValue = parseFloat(value) || 0;
                                
                                switch (operator) {
                                    case "eq":
                                        if (fieldValue !== compareValue) return false;
                                        break;
                                    case "gt":
                                        if (fieldValue <= compareValue) return false;
                                        break;
                                    case "gte":
                                        if (fieldValue < compareValue) return false;
                                        break;
                                    case "lt":
                                        if (fieldValue >= compareValue) return false;
                                        break;
                                    case "lte":
                                        if (fieldValue > compareValue) return false;
                                        break;
                                    case "neq":
                                        if (fieldValue === compareValue) return false;
                                        break;
                                }
                            }
                        } else if (field && field.label_value !== selectedValue) {
                            return false;
                        }
                    }

                    if (type === "billing:number") {
                        const field = member.meta_billing?.find((f: any) => f.field_name === fieldName);
                        
                        // selectedValue should be an object like { operator: "gt", value: "100" }
                        if (typeof selectedValue === "object" && selectedValue !== null) {
                            const { operator, value } = selectedValue as { operator: string; value: string };
                            // Skip if value is empty
                            if (!value || value === "") continue;
                            
                            // If field doesn't exist or has no value, exclude the member
                            if (!field || field.value === null || field.value === undefined || field.value === "") {
                                return false;
                            }
                            
                            const fieldValue = parseFloat(field.value) || 0;
                            const compareValue = parseFloat(value) || 0;
                            
                            switch (operator) {
                                case "eq":
                                    if (fieldValue !== compareValue) {
                                        return false;
                                    }
                                    break;
                                case "gt":
                                    if (fieldValue <= compareValue) {
                                        return false;
                                    }
                                    break;
                                case "gte":
                                    if (fieldValue < compareValue) {
                                        return false;
                                    }
                                    break;
                                case "lt":
                                    if (fieldValue >= compareValue) {
                                        return false;
                                    }
                                    break;
                                case "lte":
                                    if (fieldValue > compareValue) {
                                        return false;
                                    }
                                    break;
                                case "neq":
                                    if (fieldValue === compareValue) {
                                        return false;
                                    }
                                    break;
                            }
                        }
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
    memberIdFilter: string,
    dynamicFilters: any
): any {
    return selectedTab === "pending-members"
            ? clubMembers?.unregistered?.filter((member: ClubMember) => {
                const fullName = (member.member_first_name + " " + member.member_surname).toLowerCase();
                if (!fullName.includes(memberNameFilter.toLowerCase())) return false;
                
                const memberId = member.user_id?.toString().toLowerCase() || "";
                const idFilterStr = String(memberIdFilter || "").toLowerCase();
                if (idFilterStr && !memberId.includes(idFilterStr)) return false;

                if (member?.resubmission_required) return false;

                for (const [fullKey, selectedValue] of Object.entries(dynamicFilters)) {
                    if (!selectedValue || selectedValue === "all") continue;
                    
                    // Parse type and fieldName - handle "billing:number" as a single type
                    let type: string;
                    let fieldName: string;
                    if (fullKey.startsWith("billing:number:")) {
                        type = "billing:number";
                        fieldName = fullKey.substring("billing:number:".length);
                    } else {
                        const parts = fullKey.split(":");
                        type = parts[0];
                        fieldName = parts.slice(1).join(":");
                    }

                    if (type === "standard") {
                        const field = member.meta_standard?.find((f: any) => f.field_name === fieldName);
                        if (field && typeof selectedValue === "string" && selectedValue.trim()) {
                            if (!field.value?.toString().toLowerCase().includes(selectedValue.toLowerCase())) {
                                return false;
                            }
                        }
                    }

                    if (type === "billing") {
                        const field = member.meta_billing?.find((f: any) => f.field_name === fieldName);
                        
                        // Check if this is a numeric billing field
                        if (field?.type === "BILLING_NUMBER") {
                            // Handle as numeric billing field with operator
                            if (typeof selectedValue === "object" && selectedValue !== null) {
                                const { operator, value } = selectedValue as { operator: string; value: string };
                                if (!value || value === "") {
                                    continue;
                                }
                                
                                // If field doesn't exist or has no value, exclude the member
                                if (!field || field.value === null || field.value === undefined || field.value === "") {
                                    return false;
                                }
                                
                                const fieldValue = parseFloat(field.value) || 0;
                                const compareValue = parseFloat(value) || 0;
                                
                                switch (operator) {
                                    case "eq":
                                        if (fieldValue !== compareValue) {
                                            return false;
                                        }
                                        break;
                                    case "gt":
                                        if (fieldValue <= compareValue) {
                                            return false;
                                        }
                                        break;
                                    case "gte":
                                        if (fieldValue < compareValue) {
                                            return false;
                                        }
                                        break;
                                    case "lt":
                                        if (fieldValue >= compareValue) {
                                            return false;
                                        }
                                        break;
                                    case "lte":
                                        if (fieldValue > compareValue) {
                                            return false;
                                        }
                                        break;
                                    case "neq":
                                        if (fieldValue === compareValue) {
                                            return false;
                                        }
                                        break;
                                }
                            }
                        } else if (!field && typeof selectedValue === "object" && selectedValue !== null && (selectedValue as { value?: any }).value) {
                            // Field not found but we're trying to filter by billing:number with a non-empty value - exclude this member
                            return false;
                        } else if (field && field.label_value !== selectedValue) {
                            return false;
                        }
                    }

                    if (type === "billing:number") {
                        const field = member.meta_billing?.find((f: any) => f.field_name === fieldName);
                        
                        // selectedValue should be an object like { operator: "gt", value: "100" }
                        if (typeof selectedValue === "object" && selectedValue !== null) {
                            const { operator, value } = selectedValue as { operator: string; value: string };
                            
                            // Skip if value is empty
                            if (!value || value === "") {
                                continue;
                            }
                            
                            // If field doesn't exist or has no value, exclude the member
                            if (!field || field.value === null || field.value === undefined || field.value === "") {
                                return false;
                            }
                            
                            const fieldValue = parseFloat(field.value) || 0;
                            const compareValue = parseFloat(value) || 0;
                            
                            switch (operator) {
                                case "eq":
                                    if (fieldValue !== compareValue) {
                                        return false;
                                    }
                                    break;
                                case "gt":
                                    if (fieldValue <= compareValue) {
                                        return false;
                                    }
                                    break;
                                case "gte":
                                    if (fieldValue < compareValue) {
                                        return false;
                                    }
                                    break;
                                case "lt":
                                    if (fieldValue >= compareValue) {
                                        return false;
                                    }
                                    break;
                                case "lte":
                                    if (fieldValue > compareValue) {
                                        return false;
                                    }
                                    break;
                                case "neq":
                                    if (fieldValue === compareValue) {
                                        return false;
                                    }
                                    break;
                            }
                        }
                    }
                }

                return true;
            }) ?? []
            : clubMembers?.unregistered?.filter((member: ClubMember) => !member?.resubmission_required) ?? [];
}