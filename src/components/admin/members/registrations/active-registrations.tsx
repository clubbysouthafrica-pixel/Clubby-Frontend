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
// Removed unused import - using raw clubMembers data instead
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import ReusableDeregisterDialog from "./features/reusable-deregister-dialog";
import ReusableSendEmailDialog from "@/components/admin/members/members/features/reusable-send-email-dialog";
import { formatAmount } from "@/data/currencies";

interface ImageProps {
  sensors: any;
  sortableId: any;
  allMembersSelected: boolean;
  listActionItems: { email: string; name: string }[];
  clubMembers: any;
  activeColumnKeys?: string[];
  dereigsterMembers: { user_id: string; name: string }[];
  clubId: string;
  currency: string;
  memberLimit: number;
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
  clubMembers,
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
  const [showTenRows, setShowTenRows] = useState(false);

  const baseRegisteredMembers = clubMembers?.registered || [];
  const [regSortAsc, setRegSortAsc] = useState<boolean | null>(null);
  const [memberNameSortAsc, setMemberNameSortAsc] = useState<boolean | null>(null);
  const [totalFeeSortAsc, setTotalFeeSortAsc] = useState<boolean | null>(null);
  const [isDeregisterDialogOpen, setIsDeregisterDialogOpen] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);


  const sortedRegisteredMembers = useMemo(() => {
    let sortedCopy = [...baseRegisteredMembers];
    
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
    } else if (regSortAsc !== null) {
      sortedCopy.sort((a: ClubMember, b: ClubMember) => {
        const at = a?.registered_on ? new Date(a.registered_on).getTime() : 0;
        const bt = b?.registered_on ? new Date(b.registered_on).getTime() : 0;
        return regSortAsc ? at - bt : bt - at;
      });
    }
    
    return sortedCopy;
  }, [baseRegisteredMembers, regSortAsc, memberNameSortAsc, totalFeeSortAsc]);

  useEffect(() => {
    setRegisteredMembersLength(baseRegisteredMembers.length);
  }, [baseRegisteredMembers, setRegisteredMembersLength]);

  const headerHeight = 48;
  const rowHeight = 60;
  const visibleRowCount = Math.min(
    baseRegisteredMembers.length,
    showTenRows ? 10 : 5,
  );
  const tableViewportMaxHeight =
    visibleRowCount > 0
      ? headerHeight + visibleRowCount * rowHeight
      : undefined;
  const shouldScrollY = baseRegisteredMembers.length > (showTenRows ? 10 : 5);

  return (
    <>
      {baseRegisteredMembers.length > 5 && (
        <div className="mb-3 flex justify-end">
          <button
            type="button"
            onClick={() => setShowTenRows((prev) => !prev)}
            className="inline-flex h-8 items-center rounded-full border border-slate-200 bg-slate-50 px-3.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
          >
            {showTenRows ? "Show 5 rows" : "Show 10 rows"}
          </button>
        </div>
      )}
      <div className="w-full max-w-full min-w-0 overflow-hidden rounded-[20px] border border-slate-200 bg-white [contain:inline-size]">
        <div
          className={`block max-w-full overflow-x-auto ${
            shouldScrollY ? "overflow-y-auto" : "overflow-y-hidden"
          }`}
          style={
            tableViewportMaxHeight
              ? { maxHeight: `${tableViewportMaxHeight}px` }
              : undefined
          }
        >
          <DndContext
            collisionDetection={closestCenter}
            sensors={sensors}
            id={sortableId}
          >
            <Table
              className="table-auto"
              style={{
                width: "max-content",
                minWidth: "100%",
                maxWidth: "none",
              }}
            >
              <TableHeader className="sticky top-0 z-10 bg-zinc-700 [&_tr]:border-zinc-600">
                <TableRow>
                <TableHead className="sticky left-0 z-20 w-[80px] flex-shrink-0 bg-zinc-700 py-2 text-center text-slate-200">
                  <div className="mx-auto flex w-fit items-center justify-center rounded-full border border-slate-200/80 bg-slate-50 pl-3 pr-1 transition-colors hover:bg-white">
                    <Checkbox
                      checked={allMembersSelected}
                      onCheckedChange={(checked: boolean) => {
                        if (checked) {
                          setAllListActionItems(sortedRegisteredMembers);
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
                        <Button variant="ghost" size="sm" className="h-7 w-7 rounded-full p-0 text-slate-600 hover:bg-slate-100 hover:text-slate-900">
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 rounded-[18px] border-slate-200">
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
                <TableHead className="h-11 w-[150px] text-center text-xs text-slate-200">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 hover:underline w-full justify-center"
                    onClick={() => {
                      setMemberNameSortAsc((prev) => (prev === null ? true : !prev));
                      setRegSortAsc(null);
                      setTotalFeeSortAsc(null);
                    }}
                    title="Toggle sort by Member Name"
                  >
                    Member name
                    {memberNameSortAsc === null ? (
                      <ChevronsUpDown className="h-3 w-3 opacity-60" />
                    ) : (
                      <span className="text-xs">{memberNameSortAsc ? "▲" : "▼"}</span>
                    )}
                  </button>
                </TableHead>
                <TableHead className="h-11 w-[150px] text-center text-xs text-slate-200">
                  Email
                </TableHead>
                <TableHead className="h-11 w-[150px] text-center text-xs text-slate-200">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 hover:underline w-full justify-center"
                    onClick={() => {
                      setTotalFeeSortAsc((prev) => (prev === null ? true : !prev));
                      setRegSortAsc(null);
                      setMemberNameSortAsc(null);
                    }}
                    title="Toggle sort by Total Fee"
                  >
                    Registration Fee
                    {totalFeeSortAsc === null ? (
                      <ChevronsUpDown className="h-3 w-3 opacity-60" />
                    ) : (
                      <span className="text-xs">{totalFeeSortAsc ? "▲" : "▼"}</span>
                    )}
                  </button>
                </TableHead>
                <TableHead className="h-11 w-[150px] text-center text-xs text-slate-200">
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
                      className="h-11 w-[150px] text-center text-xs text-slate-200"
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
                    onClick={() => {
                      setSelectedMember(member);
                      window.location.hash = member.user_id;
                    }}
                    className={`group h-14 cursor-pointer border-slate-200 bg-white text-sm transition-colors hover:bg-slate-50 ${
                      listActionItems.some(
                        (item) =>
                          item.email === member.member_email &&
                          item.name ===
                            `${member.member_first_name} ${member.member_surname}`,
                      )
                        ? "bg-slate-50"
                        : ""
                    }`}
                  >
                    <TableCell className="relative sticky left-0 z-20 w-[80px] flex-shrink-0 bg-white text-center">
                      <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
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
                                baseRegisteredMembers.length
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
                    <TableCell className="w-[150px] text-center text-sm font-medium text-slate-900">
                      <span className="underline decoration-slate-400 underline-offset-2">
                        {member.member_first_name + " " + member.member_surname}
                      </span>
                    </TableCell>
                    <TableCell className="w-[150px] text-center text-sm text-slate-800">
                      {member.member_email === "n/a" ? (
                        <span className="text-gray-400">n/a</span>
                      ) : (
                        member.member_email
                      )}
                    </TableCell>
                    <TableCell className="w-[150px] text-center text-sm font-medium text-slate-900">
                      {member.total_fee ? (
                        formatAmount(member.total_fee, currency)
                      ) : (
                        <span className="text-gray-400">n/a</span>
                      )}
                    </TableCell>
                    <TableCell className="w-[150px] text-center text-sm text-slate-800">
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
                          const standardFields = Array.isArray(member.meta_standard)
                            ? member.meta_standard
                            : Object.values(member.meta_standard ?? {});
                          const standardField = standardFields.find(
                            (f: any) =>
                              f.field_name === column.field_name ||
                              f.field_id === column.field_id,
                          );
                          columnValue = standardField?.value || "N/A";
                        }

                        if (column.type === "club_variable") {
                          const clubVariableKey = column.key?.startsWith("club_variable:")
                            ? column.key.replace("club_variable:", "")
                            : column.field_id || column.field_name;
                          const clubVariables = Array.isArray(member.meta_club_variables)
                            ? member.meta_club_variables
                            : Object.values(member.meta_club_variables ?? {});
                          const clubVariable = clubVariables.find(
                            (f: any) =>
                              f.name === clubVariableKey ||
                              f.field_name === clubVariableKey ||
                              f.field_name === column.field_name ||
                              f.name === column.field_id,
                          );
                          columnValue = clubVariable?.value || "N/A";
                        }

                        return (
                          <TableCell
                            key={column.key}
                            className="w-[150px] text-center text-sm text-slate-800"
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
                    className="h-24 text-center text-slate-500"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          </DndContext>
        </div>
      </div>

      <ReusableDeregisterDialog
        isOpen={isDeregisterDialogOpen}
        onOpenChange={setIsDeregisterDialogOpen}
        title="Deregister Members"
        description="Members to deregister"
        itemsList={dereigsterMembers.map((member) => {
          const fullMember = sortedRegisteredMembers.find((m) => m.user_id === member.user_id);
          return {
            id: member.user_id,
            name: member.name,
            total_fee: fullMember?.total_fee,
            total_outstanding_amount: fullMember?.outstanding_amount,
          };
        })}
        clubId={clubId}
        userIds={dereigsterMembers.map((member) => member.user_id)}
        currency={currency}
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
