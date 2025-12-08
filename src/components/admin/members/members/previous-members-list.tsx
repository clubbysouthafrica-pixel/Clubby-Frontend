import { DndContext, closestCenter } from "@dnd-kit/core";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ClubMember } from "@/interfaces/club"
import { useEffect, useMemo, useState } from "react";
import { ChevronsUpDown, Trash2 } from "lucide-react";
import { Club } from "@/context/ClubContext"
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { previousRegisteredMembers } from "@/helpers/admin/members/filter-members-list";
import RemoveMemberDialog from "./remove-member-dialog";

interface ImageProps {
    club: Club | null
    sensors: any
    sortableId: any
    selectedTab: string
    clubMembers: any
    listActionItems: { email: string, name: string }[]
    allMembersSelected: boolean
    memberNameFilter: string
    memberIdFilter: string
    dynamicFilters: Record<string, string>
    setAllMembersSelected: React.Dispatch<React.SetStateAction<boolean>>
    setlistActionItems: React.Dispatch<React.SetStateAction<{ email: string, name: string }[]>>
    setSelectedMember: React.Dispatch<React.SetStateAction<object>>
    setDeregisteredMembersLength: React.Dispatch<React.SetStateAction<number>>
    setAllListActionItems: (members: ClubMember[]) => void
}

export default function PreviousMembersList({
    sensors,
    sortableId,
    selectedTab,
    clubMembers,
    memberNameFilter,
    memberIdFilter,
    allMembersSelected,
    dynamicFilters,
    listActionItems,
    setSelectedMember,
    setAllListActionItems,
    setDeregisteredMembersLength,
    setlistActionItems,
    setAllMembersSelected,
}: ImageProps) {

    const filteredDeregisteredMembers = previousRegisteredMembers(selectedTab, clubMembers, memberNameFilter, memberIdFilter, dynamicFilters);
    const [deregSortAsc, setDeregSortAsc] = useState<boolean | null>(null);
    const [openRemoveDialog, setOpenRemoveDialog] = useState<boolean>(false);
    const [selectedMemberToRemove, setSelectedMemberToRemove] = useState<ClubMember | null>(null);

    const sortedDeregisteredMembers = useMemo(() => {
        if (deregSortAsc === null) return filteredDeregisteredMembers;
        const copy = [...filteredDeregisteredMembers];
        copy.sort((a: ClubMember, b: ClubMember) => {
            const at = a?.deregistered_on ? new Date(a.deregistered_on).getTime() : 0;
            const bt = b?.deregistered_on ? new Date(b.deregistered_on).getTime() : 0;
            return deregSortAsc ? at - bt : bt - at;
        });
        return copy;
    }, [filteredDeregisteredMembers, deregSortAsc]);

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
                            <TableHead className="text-center w-1/5">Member Name</TableHead>
                            <TableHead className="text-center w-1/5">Member ID</TableHead>
                            <TableHead className="text-center w-1/5">
                                <button
                                    type="button"
                                    className="inline-flex items-center gap-1 hover:underline"
                                    onClick={() => setDeregSortAsc(prev => prev === null ? true : !prev)}
                                    title="Toggle sort by Deregistered On"
                                >
                                    Deregistered On
                                    {deregSortAsc === null ? (
                                        <ChevronsUpDown className="h-3 w-3 opacity-60" />
                                    ) : (
                                        <span className="text-xs">{deregSortAsc ? "▲" : "▼"}</span>
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
                                        onCheckedChange={() => setAllListActionItems(filteredDeregisteredMembers)}
                                        checked={allMembersSelected}
                                    />
                                </div>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedDeregisteredMembers.length ? sortedDeregisteredMembers.map((member: ClubMember) => (
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
                                    {member.deregistered_on ? new Date(member.deregistered_on).toLocaleString() : "Previous season registration"}
                                </TableCell>
                                <TableCell className="text-center w-1/5">
                                    <div className="flex justify-center gap-2">
                                        {/* <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="rounded-full border border-black hover:bg-gray-100 hover:text-black"
                                                    >
                                                        <RotateCcw className="h-6 w-6" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Re-register member</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider> */}
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="rounded-full border border-black hover:bg-gray-100 hover:text-black"
                                                        onClick={() => {
                                                            setSelectedMemberToRemove(member);
                                                            setOpenRemoveDialog(true);
                                                        }}
                                                    >
                                                        <Trash2 className="h-6 w-6" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Remove member</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
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
                                                    const updatedList = [...listActionItems, { email: member.member_email, name: `${member.member_first_name} ${member.member_surname}` }];
                                                    setlistActionItems(updatedList);
                                                    if (updatedList.length === filteredDeregisteredMembers.length) {
                                                        setAllMembersSelected(true);
                                                    }
                                                } else {
                                                    const updatedList = listActionItems.filter(
                                                        (item) => item.email !== member.member_email
                                                    );
                                                    setlistActionItems(updatedList);
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

            <RemoveMemberDialog
                open={openRemoveDialog}
                onOpenChange={setOpenRemoveDialog}
                member={selectedMemberToRemove}
                onRemoveSuccess={() => {
                    setlistActionItems(listActionItems.filter(item => item.email !== selectedMemberToRemove?.member_email));
                    setSelectedMemberToRemove(null);
                }}
            />
        </div>
    )
}
