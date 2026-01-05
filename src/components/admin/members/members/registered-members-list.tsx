import { DndContext, closestCenter } from "@dnd-kit/core";
import { useEffect, useMemo, useState } from "react";
import { ChevronsUpDown, ChevronDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ClubMember } from "@/interfaces/club";
import { filteredRegisteredMembers as frg } from "@/helpers/admin/members/filter-members-list";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import ReusableDeregisterDialog from "./features/reusable-deregister-dialog";
import ReusableSendEmailDialog from "./features/reusable-send-email-dialog";
import { formatAmount } from "@/data/currencies";

interface ImageProps {
  sensors: any;
  sortableId: any;
  allMembersSelected: boolean;
  listActionItems: { email: string; name: string }[];
  selectedTab: string;
  clubMembers: any;
  memberNameFilter: string;
  memberIdFilter: string;
  dynamicFilters: Record<string, string>;
  activeColumnKeys?: string[];
  dereigsterMembers: { user_id: string; name: string }[];
  clubId: string;
  currency: string;
  setAllListActionItems: (members: ClubMember[]) => void;
  setSelectedMember: React.Dispatch<React.SetStateAction<object>>;
  setlistActionItems: React.Dispatch<
    React.SetStateAction<{ email: string; name: string }[]>
  >;
  setDeregisterMembers: React.Dispatch<
    React.SetStateAction<{ user_id: string; name: string }[]>
  >;
  setAllMembersSelected: React.Dispatch<React.SetStateAction<boolean>>;
  setRegisteredMembersLength: React.Dispatch<React.SetStateAction<number>>;
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
  activeColumnKeys = [],
  dereigsterMembers,
  clubId,
  currency,
  setAllListActionItems,
  setSelectedMember,
  setlistActionItems,
  setDeregisterMembers,
  setAllMembersSelected,
  setRegisteredMembersLength,
}: ImageProps) {
  const filteredRegisteredMembers = frg(
    selectedTab,
    clubMembers,
    memberNameFilter,
    memberIdFilter,
    dynamicFilters,
    clubMembers?.filters,
  );
  const [regSortAsc, setRegSortAsc] = useState<boolean | null>(null);
  const [isDeregisterDialogOpen, setIsDeregisterDialogOpen] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
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
    <>
      <div
        className={`w-full rounded-lg border overflow-x-auto max-w-[79vw] ${
          filteredRegisteredMembers.length > 10
            ? "max-h-[600px] overflow-y-auto"
            : "overflow-y-hidden"
        }`}
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
                          setAllListActionItems(filteredRegisteredMembers);
                          setDeregisterMembers(
                            filteredRegisteredMembers.map(
                              (member: ClubMember) => ({
                                user_id: member.user_id,
                                name: `${member.member_first_name} ${member.member_surname}`,
                              }),
                            ),
                          );
                          setAllMembersSelected(true);
                        } else {
                          setlistActionItems([]);
                          setDeregisterMembers([]);
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
                          onClick={() => setIsEmailDialogOpen(true)}
                          disabled={!listActionItems.length}
                        >
                          Send Email
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setIsDeregisterDialogOpen(true)}
                          disabled={!dereigsterMembers.length}
                          className="text-red-600"
                        >
                          Deregister Members
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableHead>
                <TableHead className="text-center w-[150px]">
                  Member name
                </TableHead>
                <TableHead className="text-center w-[150px]">
                  Member ID
                </TableHead>
                <TableHead className="text-center w-[150px]">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 hover:underline"
                    onClick={() =>
                      setRegSortAsc((prev) => (prev === null ? true : !prev))
                    }
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
              {sortedRegisteredMembers.length ? (
                sortedRegisteredMembers.map((member: ClubMember) => (
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
                              const updatedDeregisterMembers = [
                                ...dereigsterMembers,
                                {
                                  user_id: member.user_id,
                                  name: `${member.member_first_name} ${member.member_surname}`,
                                },
                              ];
                              setDeregisterMembers(updatedDeregisterMembers);

                              const updatedListActionItems = [
                                ...listActionItems,
                                {
                                  email: member.member_email,
                                  name: `${member.member_first_name} ${member.member_surname}`,
                                },
                              ];
                              setlistActionItems(updatedListActionItems);
                              if (
                                updatedListActionItems.length ===
                                filteredRegisteredMembers.length
                              ) {
                                setAllMembersSelected(true);
                              }
                            } else {
                              const updatedDeregisterMembers =
                                dereigsterMembers.filter(
                                  (item) => item.user_id !== member.user_id,
                                );
                              setDeregisterMembers(updatedDeregisterMembers);

                              const updatedListActionItems =
                                listActionItems.filter(
                                  (item) => item.email !== member.member_email,
                                );
                              setlistActionItems(updatedListActionItems);
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
                      {member.registered_on
                        ? new Date(member.registered_on).toLocaleString()
                        : "-"}
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
                          columnValue = customField?.value ? formatAmount(customField?.value, currency) : "N/A";
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
      </div>

      <ReusableDeregisterDialog
        isOpen={isDeregisterDialogOpen}
        onOpenChange={setIsDeregisterDialogOpen}
        title="Deregister Members"
        description="Members to deregister"
        itemsList={dereigsterMembers.map((member) => ({
          id: member.user_id,
          name: member.name,
        }))}
        clubId={clubId}
        userIds={dereigsterMembers.map((member) => member.user_id)}
        confirmationText="I understand that this action will permanently deregister all selected club members."
        submitButtonText="Deregister"
        onSuccessClose={() => {
          setlistActionItems([]);
          setDeregisterMembers([]);
          setAllMembersSelected(false);
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
          setDeregisterMembers([]);
          setAllMembersSelected(false);
        }}
      />
    </>
  );
}
