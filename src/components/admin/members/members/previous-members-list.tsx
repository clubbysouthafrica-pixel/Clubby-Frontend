import { DndContext, closestCenter } from "@dnd-kit/core";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ClubMember } from "@/interfaces/club"
import { formatAmount } from "@/data/currencies"
import { Label } from "@/components/ui/label";
import { useEffect } from "react";
import { Club } from "@/context/ClubContext"

interface ImageProps {
    club: Club | null
    sensors: any
    sortableId: any
    selectedTab: string
    clubMembers: any
    memberNameFilter: string
    dynamicFilters: Record<string, string>
    setSelectedMember: React.Dispatch<React.SetStateAction<object>>
    setDeregisteredMembersLength: React.Dispatch<React.SetStateAction<number>>
}

export default function PreviousMembersList({
    club,
    sensors,
    sortableId,
    selectedTab,
    clubMembers,
    memberNameFilter,
    dynamicFilters,
    setSelectedMember,
    setDeregisteredMembersLength,
}: ImageProps) {

    const filteredDeregisteredMembers =
        selectedTab === "previous-members"
            ? clubMembers?.unregistered?.filter((member: ClubMember) => {
                const fullName = (member.member_first_name + " " + member.member_surname).toLowerCase();
                if (!fullName.includes(memberNameFilter.toLowerCase())) return false;

                if (!member?.resubmission_required) return false

                for (const [fullKey, selectedValue] of Object.entries(dynamicFilters)) {
                    if (!selectedValue || selectedValue === "all") continue;
                    const [type, fieldName] = fullKey.split(":");

                    if (type === "standard") {
                        const field = member.meta_standard?.find((f: any) => f.field_name === fieldName);
                        if (!field || field.value !== selectedValue) return false;
                    }

                    if (type === "billing") {
                        const field = member.meta_billing?.find((f: any) => f.field_name === fieldName);
                        if (!field || field.label_value !== selectedValue) return false;
                    }
                }

                return true;
            }) ?? []
            : clubMembers?.unregistered?.filter((member: ClubMember) => member?.resubmission_required) ?? [];

    useEffect(() => {
        setDeregisteredMembersLength(filteredDeregisteredMembers.length);
    }, [filteredDeregisteredMembers, setDeregisteredMembersLength]);

    return (
        <div className="overflow-hidden rounded-lg border">
            <DndContext
                collisionDetection={closestCenter}
                sensors={sensors}
                id={sortableId}>

                <Table>
                    <TableHeader className="bg-muted sticky top-0 z-10">
                        <TableRow>
                            <TableHead className="text-center w-1/6">Display Name</TableHead>
                            <TableHead className="text-center w-1/6">Member ID</TableHead>
                            <TableHead className="text-center w-1/6">Registration Submitted</TableHead>
                            <TableHead className="text-center w-1/6">Reference Numbers</TableHead>
                            <TableHead className="text-center w-1/6">Outstanding Amount</TableHead>
                            <TableHead className="text-center w-1/6">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredDeregisteredMembers.length ? filteredDeregisteredMembers.map((member: ClubMember) => (
                            <TableRow key={member.user_id}>
                                <TableCell className="text-center w-1/6">
                                    <a
                                        onClick={() => setSelectedMember(member)}
                                        href={`#${member.user_id}`}
                                        className="underline hover:text-blue-800 cursor-pointer"
                                    >
                                        {member.member_first_name + " " + member.member_surname}
                                    </a>
                                </TableCell>
                                <TableCell className="text-center w-1/6">
                                    <div className="inline-flex items-center gap-2 justify-center">
                                        <span className="font-mono">{member.user_id.slice(0, 8)}...</span>

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigator.clipboard.writeText(member.user_id);
                                            }}
                                            title="Click to copy full Transaction ID"
                                            className="hover:text-primary cursor-pointer"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-4 w-4 text-muted-foreground hover:text-foreground transition"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M8 16h8m2 0a2 2 0 002-2V6a2 2 0 00-2-2H8a2 2 0 00-2 2v8a2 2 0 002 2zM8 16v2a2 2 0 002 2h8a2 2 0 002-2v-2"
                                                />
                                            </svg>
                                        </button>
                                    </div>
                                </TableCell>
                                <TableCell className="text-center w-1/6">
                                    {member.registration_submitted_on ? (() => {
                                        const date = new Date(member.registration_submitted_on);
                                        const now = new Date();
                                        const diffTime = Math.abs(now.getTime() - date.getTime());
                                        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                                        return `${date.toLocaleString()} (${diffDays === 0 ? 'today' : diffDays === 1 ? '1 day ago' : `${diffDays} days ago`})`;
                                    })() : "-"}
                                </TableCell>
                                <TableCell className="text-center w-1/6">
                                    {member.registration_payment_reference}
                                </TableCell>
                                <TableCell className="text-center w-1/6">
                                    {member.resubmission_required ? "N/A" : formatAmount(member.outstanding_amount, club?.currency)}
                                </TableCell>
                                <TableCell className="text-center w-1/6">
                                    <div className="flex justify-center items-center">
                                        <Label className="text-red-500 font-bold">
                                            Member resubmission required
                                        </Label>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell
                                    colSpan={5}
                                    className="h-24 text-center"
                                >
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </DndContext>
        </div>
    )
}
