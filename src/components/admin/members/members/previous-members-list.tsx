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
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import RemoveMemberDialog from "./features/remove-member-dialog";
import ReusableSendEmailDialog from "./features/reusable-send-email-dialog";
import { formatAmount } from "@/data/currencies";

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
  memberLimit: number;
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
  clubMembers,
  clubId,
  club,
  allMembersSelected,
  activeColumnKeys = [],
  listActionItems,
  setSelectedMember,
  setAllListActionItems,
  setDeregisteredMembersLength,
  setlistActionItems,
  setAllMembersSelected,
}: ImageProps) {
  // Use raw clubMembers.deregistered - backend already handles pagination and member_name/member_id filtering
  const baseDeregisteredMembers = clubMembers?.deregistered || [];
  const [deregSortAsc, setDeregSortAsc] = useState<boolean | null>(null);
  const [memberNameSortAsc, setMemberNameSortAsc] = useState<boolean | null>(null);
  const [totalFeeSortAsc, setTotalFeeSortAsc] = useState<boolean | null>(null);
  const [openRemoveDialog, setOpenRemoveDialog] = useState<boolean>(false);
  const [selectedMembersToRemove, setSelectedMembersToRemove] = useState<
    ClubMember[]
  >([]);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);

  const sortedDeregisteredMembers = useMemo(() => {
    let sortedCopy = [...baseDeregisteredMembers];
    
    if (memberNameSortAsc !== null) {
      sortedCopy.sort((a: ClubMember, b: ClubMember) => {
        const aName = `${a.member_first_name} ${a.member_surname}`.toLowerCase();
        const bName = `${b.member_first_name} ${b.member_surname}`.toLowerCase();
        return memberNameSortAsc ? aName.localeCompare(bName) : bName.localeCompare(aName);
      });
    } else if (totalFeeSortAsc !== null) {
      sortedCopy.sort((a: ClubMember, b: ClubMember) => {
        const aFee = a.total_fee || 0;
        const bFee = b.total_fee || 0;
        return totalFeeSortAsc ? aFee - bFee : bFee - aFee;
      });
    } else if (deregSortAsc !== null) {
      sortedCopy.sort((a: ClubMember, b: ClubMember) => {
        const at = a?.deregistered_on ? new Date(a.deregistered_on).getTime() : 0;
        const bt = b?.deregistered_on ? new Date(b.deregistered_on).getTime() : 0;
        return deregSortAsc ? at - bt : bt - at;
      });
    }
    
    return sortedCopy;
  }, [baseDeregisteredMembers, deregSortAsc, memberNameSortAsc, totalFeeSortAsc]);

  useEffect(() => {
    setDeregisteredMembersLength(baseDeregisteredMembers.length);
  }, [baseDeregisteredMembers, setDeregisteredMembersLength]);

  return (
    <>
      <div
        className={`overflow-x-auto rounded-lg border max-w-[79vw] ${baseDeregisteredMembers.length > 10 ? "max-h-[600px] overflow-y-auto" : "overflow-y-hidden"}`}
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
                <TableHead className="text-center w-[80px] py-2 flex-shrink-0 sticky left-0 z-20 bg-muted">
                  <div className="flex justify-center items-center rounded-[10px] pl-3 pr-1 border-gray-300 border-1 w-fit mx-auto hover:border-gray-400 transition-colors">
                    <Checkbox
                      checked={allMembersSelected}
                      onCheckedChange={(checked: boolean) => {
                        if (checked) {
                          setAllListActionItems(sortedDeregisteredMembers);
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
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 hover:underline w-full justify-center"
                    onClick={() => {
                      setMemberNameSortAsc((prev) => (prev === null ? true : !prev));
                      setDeregSortAsc(null);
                      setTotalFeeSortAsc(null);
                    }}
                    title="Toggle sort by Member Name"
                  >
                    Member Name
                    {memberNameSortAsc === null ? (
                      <ChevronsUpDown className="h-3 w-3 opacity-60" />
                    ) : (
                      <span className="text-xs">{memberNameSortAsc ? "▲" : "▼"}</span>
                    )}
                  </button>
                </TableHead>
                <TableHead className="text-center w-[150px]">
                  Email
                </TableHead>
                <TableHead className="text-center w-[150px]">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 hover:underline w-full justify-center"
                    onClick={() => {
                      setTotalFeeSortAsc((prev) => (prev === null ? true : !prev));
                      setDeregSortAsc(null);
                      setMemberNameSortAsc(null);
                    }}
                    title="Toggle sort by Total Fee"
                  >
                    Total Fee
                    {totalFeeSortAsc === null ? (
                      <ChevronsUpDown className="h-3 w-3 opacity-60" />
                    ) : (
                      <span className="text-xs">{totalFeeSortAsc ? "▲" : "▼"}</span>
                    )}
                  </button>
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
                    className={`h-12 ${
                      listActionItems.some(
                        (item) =>
                          item.email === member.member_email &&
                          item.name ===
                            `${member.member_first_name} ${member.member_surname}`,
                      )
                        ? "bg-blue-50"
                        : ""
                    }`}
                  >
                    <TableCell className="text-center w-[80px] flex-shrink-0 sticky left-0 z-20 bg-white">
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
                                baseDeregisteredMembers.length
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
                      <div className="flex items-center justify-center gap-2">
                        <a
                          onClick={() => setSelectedMember(member)}
                          href={`#${member.user_id}`}
                          className="underline hover:text-blue-800 cursor-pointer"
                        >
                          {member.member_first_name + " " + member.member_surname}
                        </a>
                        {member?.last_season_registration === true && (
                          <Badge variant="destructive" className="text-xs">
                            Previous Season Registration
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center w-[150px]">
                      {member.member_email}
                    </TableCell>
                    <TableCell className="text-center w-[150px]">
                      {member?.total_fee ? (
                        formatAmount(member.total_fee, club?.currency)
                      ) : (
                        <span className="text-gray-400">n/a</span>
                      )}
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
                          columnValue = customField?.value ? formatAmount(customField?.value, club?.currency) : "N/A";
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
                            {columnValue === "N/A" ? (
                              <span className="text-gray-400">n/a</span>
                            ) : (
                              columnValue
                            )}
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
