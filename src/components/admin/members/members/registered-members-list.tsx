import { DndContext, closestCenter } from "@dnd-kit/core";
import { useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ClubMember } from "@/interfaces/club"
import { formatAmount } from "@/data/currencies"
import { Club } from "@/context/ClubContext"
import { filteredRegisteredMembers as frg } from "@/helpers/admin/members/filter-members-list";

interface ImageProps {
    club: Club | null
    sensors: any
    sortableId: any
    allMembersSelected: boolean
    listActionItems: { email: string, name: string }[]
    selectedTab: string
    clubMembers: any
    memberNameFilter: string
    dynamicFilters: Record<string, string>
    dereigsterMembers: { user_id: string, name: string }[]
    setAllListActionItems: (members: ClubMember[]) => void
    setSelectedMember: React.Dispatch<React.SetStateAction<object>>
    setlistActionItems: React.Dispatch<React.SetStateAction<{ email: string, name: string }[]>>
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
    dereigsterMembers,
    setAllListActionItems,
    setSelectedMember,
    setlistActionItems,
    setDeregisterMembers,
    setAllMembersSelected,
    setRegisteredMembersLength,
}: ImageProps) {

    const filteredRegisteredMembers = frg(selectedTab, clubMembers, memberNameFilter, dynamicFilters)

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
                                <TableCell className="text-center w-1/7">
                                    <Checkbox
                                        checked={listActionItems.some(
                                            (item) =>
                                                item.email === member.member_email &&
                                                item.name === `${member.member_first_name} ${member.member_surname}`
                                        )}
                                        onCheckedChange={(checked: boolean) => {
                                            if (checked) {
                                                const updatedDeregisterMembers = [...dereigsterMembers, { user_id: member.user_id, name: `${member.member_first_name} ${member.member_surname}` }]
                                                setDeregisterMembers(updatedDeregisterMembers)

                                                const updatedListActionItems = [...listActionItems, { email: member.member_email, name: `${member.member_first_name} ${member.member_surname}` }];
                                                setlistActionItems(updatedListActionItems);
                                                if (updatedListActionItems.length === filteredRegisteredMembers.length) {
                                                    setAllMembersSelected(true);
                                                }
                                            } else {
                                                const updatedDeregisterMembers = dereigsterMembers.filter(
                                                    (item) => item.user_id !== member.user_id
                                                )
                                                setDeregisterMembers(updatedDeregisterMembers);

                                                const updatedListActionItems = listActionItems.filter(
                                                    (item) => item.email !== member.member_email
                                                );
                                                setlistActionItems(updatedListActionItems);
                                                setAllMembersSelected(false);
                                            }
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
