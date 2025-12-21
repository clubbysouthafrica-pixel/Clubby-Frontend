import { DndContext, closestCenter } from "@dnd-kit/core";
import { useEffect, useMemo, useState } from "react";
import { ChevronsUpDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ClubMember } from "@/interfaces/club"
import { filteredRegisteredMembers as frg } from "@/helpers/admin/members/filter-members-list";

interface ImageProps {
    sensors: any
    sortableId: any
    allMembersSelected: boolean
    listActionItems: { email: string, name: string }[]
    selectedTab: string
    clubMembers: any
    memberNameFilter: string
    memberIdFilter: string
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
    sensors,
    sortableId,
    allMembersSelected,
    listActionItems,
    selectedTab,
    clubMembers,
    memberNameFilter,
    memberIdFilter,
    dynamicFilters,
    dereigsterMembers,
    setAllListActionItems,
    setSelectedMember,
    setlistActionItems,
    setDeregisterMembers,
    setAllMembersSelected,
    setRegisteredMembersLength,
}: ImageProps) {

    const filteredRegisteredMembers = frg(selectedTab, clubMembers, memberNameFilter, memberIdFilter, dynamicFilters)
    const [regSortAsc, setRegSortAsc] = useState<boolean | null>(null);
    // const [openRemoveDialog, setOpenRemoveDialog] = useState<boolean>(false);
    // const [selectedMemberToRemove, setSelectedMemberToRemove] = useState<ClubMember | null>(null);

    const sortedRegisteredMembers = useMemo(() => {
        if (regSortAsc === null) return filteredRegisteredMembers;
        const copy = [...filteredRegisteredMembers];
        copy.sort((a: ClubMember, b: ClubMember) => {
            const at = a?.registered_on ? new Date(a.registered_on).getTime() : 0;
            const bt = b?.registered_on ? new Date(b.registered_on).getTime() : 0;
            return regSortAsc ? at - bt : bt - at;
        });
        return copy;
    }, [filteredRegisteredMembers, regSortAsc]);

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
                            <TableHead className="text-center w-1/5">
                                <button
                                    type="button"
                                    className="inline-flex items-center gap-1 hover:underline"
                                    onClick={() => setRegSortAsc((prev) => (prev === null ? true : !prev))}
                                    title="Toggle sort by Registered On"
                                >
                                    Registered On
                                    {regSortAsc === null ? (
                                        <ChevronsUpDown className="h-3 w-3 opacity-60" />
                                    ) : (
                                        <span className="text-xs">{regSortAsc ? "▲" : "▼"}</span>
                                    )}
                                </button>
                            </TableHead>
                            <TableHead className="text-center w-1/5">
                                Actions
                            </TableHead>
                            <TableHead className="text-center w-1/5">
                                <div className="flex justify-center">
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
                        {sortedRegisteredMembers.length ? sortedRegisteredMembers.map((member: ClubMember) => (
                            <TableRow key={member.user_id} className={listActionItems.some((item) => item.email === member.member_email && item.name === `${member.member_first_name} ${member.member_surname}`) ? "bg-blue-50" : ""}>
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
                                <TableCell className="text-center w-1/5">
                                    {member.registered_on ? new Date(member.registered_on).toLocaleString() : "-"}
                                </TableCell>
                                <TableCell className="text-center w-1/5">
                                    <div className="flex justify-center gap-2">
                                        -
                                    </div>
                                </TableCell>
                                <TableCell className="text-center w-1/5">
                                    <div className="flex justify-center">
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

            {/* <RemoveMemberDialog
                open={openRemoveDialog}
                onOpenChange={setOpenRemoveDialog}
                member={selectedMemberToRemove}
                onRemoveSuccess={() => {
                    setlistActionItems(listActionItems.filter(item => item.email !== selectedMemberToRemove?.member_email));
                    setSelectedMemberToRemove(null);
                }}
            /> */}
        </div>
    )
}
