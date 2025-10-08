import { DndContext, closestCenter } from "@dnd-kit/core";
import { useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ClubMember } from "@/interfaces/club"
import { formatAmount } from "@/data/currencies"
import { Club } from "@/context/ClubContext"

interface ImageProps {
    club: Club | null
    sensors: any
    sortableId: any
    allMembersSelected: boolean
    listActionItems: string[]
    selectedTab: string
    clubMembers: any
    memberNameFilter: string
    dynamicFilters: Record<string, string>
    setAllListActionItems: (members: ClubMember[]) => void
    setSelectedMember: React.Dispatch<React.SetStateAction<object>>
    setlistActionItems: React.Dispatch<React.SetStateAction<string[]>>
    setDeregisterMembers: React.Dispatch<React.SetStateAction<{ user_id: string, name: string }[]>>
    setAllMembersSelected: React.Dispatch<React.SetStateAction<boolean>>
    setRegisteredMembersLength: React.Dispatch<React.SetStateAction<number>>
}

export default function RegisteredMembersList({
    club,
    sensors,
    sortableId,
    allMembersSelected,
    listActionItems,
    selectedTab,
    clubMembers,
    memberNameFilter,
    dynamicFilters,
    setAllListActionItems,
    setSelectedMember,
    setlistActionItems,
    setDeregisterMembers,
    setAllMembersSelected,
    setRegisteredMembersLength,
}: ImageProps) {

    const filteredRegisteredMembers =
        selectedTab === "registered-members"
            ? clubMembers?.registered?.filter((member: ClubMember) => {
                const fullName = (member.member_first_name + " " + member.member_surname).toLowerCase();
                if (!fullName.includes(memberNameFilter.toLowerCase())) return false;

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
            : clubMembers?.registered ?? [];

    useEffect(() => {
        setRegisteredMembersLength(filteredRegisteredMembers.length);
    }, [filteredRegisteredMembers, setRegisteredMembersLength]);

    return (
        <div className="overflow-hidden rounded-lg border">
            <DndContext
                collisionDetection={closestCenter}
                sensors={sensors}
                id={sortableId}>

                <Table>
                    <TableHeader className="bg-muted sticky top-0 z-10">
                        <TableRow>
                            <TableHead className="text-center w-1/5">Member name</TableHead>
                            <TableHead className="text-center w-1/5">Member ID</TableHead>
                            <TableHead className="text-center w-1/5">Email</TableHead>
                            <TableHead className="text-center w-1/5">Outstanding Amount</TableHead>
                            <TableHead className="text-center w-1/5">
                                <div className="flex items-center justify-center gap-2">
                                    Action
                                    <Checkbox
                                        className="bg-white"
                                        onCheckedChange={() => setAllListActionItems(filteredRegisteredMembers)}
                                        checked={allMembersSelected}
                                    />
                                </div>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredRegisteredMembers.length ? filteredRegisteredMembers.map((member: ClubMember) => (
                            <TableRow key={member.user_id}>
                                <TableCell className="text-center w-1/5">
                                    <a
                                        onClick={() => setSelectedMember(member)}
                                        href={`#${member.user_id}`}
                                        className="underline hover:text-blue-800 cursor-pointer"
                                    >
                                        {member.member_first_name + " " + member.member_surname}
                                    </a>
                                </TableCell>
                                <TableCell className="text-center w-1/5">
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
                                <TableCell className="text-center w-1/5">{member.member_email}</TableCell>
                                <TableCell className="text-center w-1/5">{formatAmount(member.outstanding_amount, club?.currency)}</TableCell>
                                <TableCell className="text-center w-1/5">
                                    <Checkbox
                                        checked={listActionItems.includes(member.member_email as string)}
                                        onCheckedChange={(checked: boolean) => {
                                            setlistActionItems([])
                                            setDeregisterMembers([])
                                            setAllMembersSelected(false)
                                            setlistActionItems(prev =>
                                                checked
                                                    ? prev.includes(member.member_email as string)
                                                        ? prev
                                                        : [...prev, member.member_email as string]
                                                    : prev.filter(id => id !== member.member_email as string)
                                            )
                                            setDeregisterMembers(prev =>
                                                checked
                                                    ? prev.some(m => m.user_id === member.user_id)
                                                        ? prev
                                                        : [...prev, { user_id: member.user_id, name: `${member.member_first_name} ${member.member_surname}` }]
                                                    : prev.filter(m => m.user_id !== member.user_id)
                                            )
                                        }}
                                    />
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell
                                    colSpan={4}
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
