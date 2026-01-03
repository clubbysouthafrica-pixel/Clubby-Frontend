import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ClubMember } from "@/interfaces/club";
import { useEffect, useMemo, useState } from "react";
import { ChevronsUpDown, ChevronDown } from "lucide-react";
import { Club } from "@/context/ClubContext";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { previousRegisteredMembers } from "@/helpers/admin/members/filter-members-list";
import RemoveMemberDialog from "./features/remove-member-dialog";
import ReusableSendEmailDialog from "./features/reusable-send-email-dialog";

interface ImageProps {
  club: Club | null;
  sensors: any;
  sortableId: any;
  selectedTab: string;
  clubMembers: any;
  clubId: string;
  listActionItems: { email: string; name: string }[];
  allMembersSelected: boolean;
  memberNameFilter: string;
  memberIdFilter: string;
  dynamicFilters: Record<string, string>;
  activeColumnKeys?: string[];
  setAllMembersSelected: React.Dispatch<React.SetStateAction<boolean>>;
  setlistActionItems: React.Dispatch<
    React.SetStateAction<{ email: string; name: string }[]>
  >;
  setSelectedMember: React.Dispatch<React.SetStateAction<object>>;
  setDeregisteredMembersLength: React.Dispatch<React.SetStateAction<number>>;
  setAllListActionItems: (members: ClubMember[]) => void;
}

export default function PreviousMembersList({
  sensors,
  sortableId,
  selectedTab,
  clubMembers,
  clubId,
  memberNameFilter,
  memberIdFilter,
  allMembersSelected,
  dynamicFilters,
  activeColumnKeys = [],
  listActionItems,
  setSelectedMember,
  setAllListActionItems,
  setDeregisteredMembersLength,
  setlistActionItems,
  setAllMembersSelected,
}: ImageProps) {
  const filteredDeregisteredMembers = previousRegisteredMembers(
    selectedTab,
    clubMembers,
    memberNameFilter,
    memberIdFilter,
    dynamicFilters,
    clubMembers?.filters,
  );
  const [deregSortAsc, setDeregSortAsc] = useState<boolean | null>(null);
  const [openRemoveDialog, setOpenRemoveDialog] = useState<boolean>(false);
  const [selectedMembersToRemove, setSelectedMembersToRemove] = useState<
    ClubMember[]
  >([]);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);

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
    <>
      <div
        className={`overflow-hidden rounded-lg border max-w-[79vw] ${filteredDeregisteredMembers.length > 10 ? "max-h-[600px] overflow-y-auto" : ""}`}
      >
        <DndContext
          collisionDetection={closestCenter}
          sensors={sensors}
          id={sortableId}
        >
          <Table
            className="table-auto"
            style={{
              // Use smaller per-column width and a softer minimum
              minWidth: `${Math.max(700, (4 + activeColumnKeys.length) * 150)}px`,
            }}
          >
            <TableHeader className="bg-muted sticky top-0 z-10">
              <TableRow>
                <TableHead className="text-center w-[80px] py-2 flex-shrink-0">
                  <div className="flex justify-center items-center rounded-[10px] pl-3 pr-1 border-gray-300 border-1 w-fit mx-auto hover:border-gray-400 transition-colors">
                    <Checkbox
                      checked={allMembersSelected}
                      onCheckedChange={(checked: boolean) => {
                        if (checked) {
                          setAllListActionItems(filteredDeregisteredMembers);
                          setAllMembersSelected(true);
                        } else {
                          setlistActionItems([]);
                          setAllMembersSelected(false);
                        }
                      }}
                      className="w-4 h-4 border-gray-300 border-1 hover:border-gray-400 transition-colors"
                    />
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8">
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
                          Actions
                        </DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => {
                            setIsEmailDialogOpen(true);
                          }}
                          disabled={!listActionItems.length}
                        >
                          Send Email
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            if (listActionItems.length > 0) {
                              const membersToRemove =
                                sortedDeregisteredMembers.filter(
                                  (member: any) =>
                                    listActionItems.some(
                                      (item) =>
                                        item.email === member.member_email &&
                                        item.name ===
                                          `${member.member_first_name} ${member.member_surname}`,
                                    ),
                                );
                              if (membersToRemove.length > 0) {
                                setSelectedMembersToRemove(membersToRemove);
                                setOpenRemoveDialog(true);
                              }
                            }
                          }}
                          disabled={!listActionItems.length}
                          className="text-red-600"
                        >
                          Remove Members
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableHead>
                <TableHead className="text-center w-[150px]">
                  Member Name
                </TableHead>
                <TableHead className="text-center w-[150px]">
                  Member ID
                </TableHead>
                <TableHead className="text-center w-[150px]">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 hover:underline"
                    onClick={() =>
                      setDeregSortAsc((prev) => (prev === null ? true : !prev))
                    }
                    title="Toggle sort by Deregistered On"
                  >
                    Deregistered On
                    {deregSortAsc === null ? (
                      <ChevronsUpDown className="h-3 w-3 opacity-60" />
                    ) : (
                      <span className="text-xs">
                        {deregSortAsc ? "▲" : "▼"}
                      </span>
                    )}
                  </button>
                </TableHead>
                {clubMembers?.filters
                  ?.filter((col: any) => activeColumnKeys.includes(col.key))
                  .map((column: any) => (
                    <TableHead
                      key={column.key}
                      className="text-center w-[150px]"
                    >
                      {column.field_name}
                    </TableHead>
                  ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedDeregisteredMembers.length ? (
                sortedDeregisteredMembers.map((member: ClubMember) => (
                  <TableRow
                    key={member.user_id}
                    className={
                      listActionItems.some(
                        (item) =>
                          item.email === member.member_email &&
                          item.name ===
                            `${member.member_first_name} ${member.member_surname}`,
                      )
                        ? "bg-blue-50"
                        : ""
                    }
                  >
                    <TableCell className="text-center w-[80px] flex-shrink-0">
                      <div className="flex justify-center">
                        <Checkbox
                          checked={listActionItems.some(
                            (item) =>
                              item.email === member.member_email &&
                              item.name ===
                                `${member.member_first_name} ${member.member_surname}`,
                          )}
                          onCheckedChange={(checked: boolean) => {
                            if (checked) {
                              const updatedList = [
                                ...listActionItems,
                                {
                                  email: member.member_email,
                                  name: `${member.member_first_name} ${member.member_surname}`,
                                },
                              ];
                              setlistActionItems(updatedList);
                              if (
                                updatedList.length ===
                                filteredDeregisteredMembers.length
                              ) {
                                setAllMembersSelected(true);
                              }
                            } else {
                              const updatedList = listActionItems.filter(
                                (item) => item.email !== member.member_email,
                              );
                              setlistActionItems(updatedList);
                              setAllMembersSelected(false);
                            }
                          }}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-center w-[150px]">
                      <a
                        onClick={() => setSelectedMember(member)}
                        href={`#${member.user_id}`}
                        className="underline hover:text-blue-800 cursor-pointer"
                      >
                        {member.member_first_name + " " + member.member_surname}
                      </a>
                    </TableCell>
                    <TableCell className="text-center w-[150px]">
                      <div className="inline-flex items-center gap-2 justify-center">
                        <span className="font-mono">
                          {member.user_id.slice(0, 8)}...
                        </span>

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
                    <TableCell className="text-center w-[150px]">
                      {member.deregistered_on
                        ? new Date(member.deregistered_on).toLocaleString()
                        : "Previous season registration"}
                    </TableCell>
                    {clubMembers?.filters
                      ?.filter((col: any) => activeColumnKeys.includes(col.key))
                      .map((column: any) => {
                        let columnValue = "N/A";

                        if (column.type === "billing") {
                          const billingField = member.meta_billing?.find(
                            (f: any) => f.field_name === column.field_name,
                          );
                          columnValue = billingField?.label_value || "N/A";
                        }

                        if (column.type === "billing:number") {
                          const customField = member.meta_billing?.find(
                            (f: any) => f.field_name === column.field_name,
                          );
                          columnValue = customField?.value || "N/A";
                        }

                        if (column.type === "standard") {
                          const standardField = member.meta_standard?.find(
                            (f: any) => f.field_name === column.field_name,
                          );
                          columnValue = standardField?.value || "N/A";
                        }

                        return (
                          <TableCell
                            key={column.key}
                            className="text-center w-[150px]"
                          >
                            {columnValue}
                          </TableCell>
                        );
                      })}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={4 + (activeColumnKeys?.length ?? 0)}
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
          members={selectedMembersToRemove}
          onRemoveSuccess={() => {
            setlistActionItems(
              listActionItems.filter(
                (item) =>
                  !selectedMembersToRemove.some(
                    (member) => member.member_email === item.email,
                  ),
              ),
            );
            setSelectedMembersToRemove([]);
            window.location.reload();
          }}
        />

        <ReusableSendEmailDialog
          isOpen={isEmailDialogOpen}
          onOpenChange={setIsEmailDialogOpen}
          title="Send Email"
          description="Mailing list"
          contactsList={listActionItems}
          clubId={clubId}
          onSuccessClose={() => {
            setlistActionItems([]);
            setAllMembersSelected(false);
          }}
        />
      </div>
    </>
  );
}
