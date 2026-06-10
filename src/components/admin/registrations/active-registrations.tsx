import { DndContext, closestCenter } from "@dnd-kit/core";
import { useMemo, useState } from "react";
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
import { formatAmount } from "@/data/currencies";
import EmptyRegistrationsRow from "@/components/admin/registrations/features/empty-registrations-row";
import { useIsMobile } from "@/hooks/use-mobile";

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
  showTenRows?: boolean;
  setAllListActionItems: (members: ClubMember[]) => void;
  setSelectedMember: React.Dispatch<React.SetStateAction<object>>;
  setlistActionItems: React.Dispatch<
    React.SetStateAction<{ email: string; name: string }[]>
  >;
  setDeregisterMembers: React.Dispatch<
    React.SetStateAction<{ user_id: string; name: string }[]>
  >;
  setAllMembersSelected: React.Dispatch<React.SetStateAction<boolean>>;
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
  showTenRows = false,
  setAllListActionItems,
  setSelectedMember,
  setlistActionItems,
  setDeregisterMembers,
  setAllMembersSelected,
}: ImageProps) {
  const isMobile = useIsMobile();
  const baseRegisteredMembers = clubMembers?.registered || [];
  const [regSortAsc, setRegSortAsc] = useState<boolean | null>(null);
  const [memberNameSortAsc, setMemberNameSortAsc] = useState<boolean | null>(null);
  const [totalFeeSortAsc, setTotalFeeSortAsc] = useState<boolean | null>(null);
  const [isDeregisterDialogOpen, setIsDeregisterDialogOpen] = useState(false);


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

  const rowHeight = isMobile ? 46 : 60;
  const maxVisibleRows = showTenRows ? 10 : 5;
  const shouldScrollY = baseRegisteredMembers.length > maxVisibleRows;
  const tableViewportMaxHeight = shouldScrollY
    ? maxVisibleRows * rowHeight
    : undefined;
  const tableColumnWidths = [
    isMobile ? "56px" : "80px",
    isMobile ? "122px" : "150px",
    isMobile ? "138px" : "150px",
    isMobile ? "112px" : "150px",
    isMobile ? "122px" : "150px",
    ...activeColumnKeys.map(() => (isMobile ? "132px" : "150px")),
  ];

  return (
    <>
      <div className="w-full max-w-full min-w-0 overflow-hidden rounded-[18px] border border-slate-200 bg-white [contain:inline-size] sm:rounded-[20px]">
        <div className="block max-w-full overflow-x-auto">
          <DndContext
            collisionDetection={closestCenter}
            sensors={sensors}
            id={sortableId}
          >
            <div
              className={shouldScrollY ? "overflow-y-auto" : "overflow-y-hidden"}
              style={
                tableViewportMaxHeight
                  ? {
                      maxHeight: `${tableViewportMaxHeight}px`,
                      scrollbarGutter: "stable",
                    }
                  : undefined
              }
            >
              <Table
                className="table-fixed"
                style={{
                  width: "max-content",
                  minWidth: "100%",
                  maxWidth: "none",
                }}
              >
                <colgroup>
                  {tableColumnWidths.map((width, index) => (
                    <col key={`active-col-${index}`} style={{ width }} />
                  ))}
                </colgroup>
            <TableHeader className="sticky top-0 z-10 bg-zinc-700 [&_tr]:border-zinc-600">
              <TableRow>
                <TableHead className="sticky left-0 z-30 w-[56px] flex-shrink-0 bg-zinc-700 px-1 py-1.5 text-center text-slate-200 sm:w-[80px] sm:py-2">
                  <div className="mx-auto flex w-fit items-center justify-center rounded-full border border-slate-200/80 bg-slate-50 pl-1.5 pr-0.5 transition-colors hover:bg-white sm:pl-3 sm:pr-1">
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
                      className="h-4 w-4 rounded-[5px] border-2 border-slate-400 bg-white shadow-sm transition-colors hover:border-slate-500 data-[state=checked]:border-slate-600 data-[state=checked]:bg-slate-600 data-[state=checked]:text-white sm:h-5 sm:w-5 sm:rounded-[6px]"
                    />
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 rounded-full p-0 text-slate-600 hover:bg-slate-100 hover:text-slate-900 sm:h-7 sm:w-7">
                          <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 rounded-[18px] border-slate-200">
                        <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
                          Actions
                        </DropdownMenuLabel>
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
                <TableHead className="h-9 w-[122px] px-0 text-center text-[10px] text-slate-200 sm:h-11 sm:w-[150px] sm:text-xs">
                  <button
                    type="button"
                    className="grid w-full grid-cols-[8px_auto_auto_8px] items-center justify-center gap-0.5 px-1 hover:underline sm:grid-cols-[10px_auto_auto_10px] sm:gap-1 sm:px-1.5"
                    onClick={() => {
                      setMemberNameSortAsc((prev) => (prev === null ? true : !prev));
                      setRegSortAsc(null);
                      setTotalFeeSortAsc(null);
                    }}
                    title="Toggle sort by Member Name"
                  >
                    <span aria-hidden="true" />
                    <span className="text-center">Member name</span>
                    <span className="flex justify-start">
                      {memberNameSortAsc === null ? (
                        <ChevronsUpDown className="h-2.5 w-2.5 opacity-60 sm:h-3 sm:w-3" />
                      ) : (
                        <span className="text-[10px] sm:text-xs">{memberNameSortAsc ? "▲" : "▼"}</span>
                      )}
                    </span>
                    <span aria-hidden="true" />
                  </button>
                </TableHead>
                <TableHead className="h-9 w-[138px] text-center text-[10px] text-slate-200 sm:h-11 sm:w-[150px] sm:text-xs">
                  Email
                </TableHead>
                <TableHead className="h-9 w-[112px] px-0 text-center text-[10px] text-slate-200 sm:h-11 sm:w-[150px] sm:text-xs">
                  <button
                    type="button"
                    className="grid w-full grid-cols-[8px_auto_auto_8px] items-center justify-center gap-0.5 px-1 hover:underline sm:grid-cols-[10px_auto_auto_10px] sm:gap-1 sm:px-1.5"
                    onClick={() => {
                      setTotalFeeSortAsc((prev) => (prev === null ? true : !prev));
                      setRegSortAsc(null);
                      setMemberNameSortAsc(null);
                    }}
                    title="Toggle sort by Total Fee"
                  >
                    <span aria-hidden="true" />
                    <span className="text-center">Registration Fee</span>
                    <span className="flex justify-start">
                      {totalFeeSortAsc === null ? (
                        <ChevronsUpDown className="h-2.5 w-2.5 opacity-60 sm:h-3 sm:w-3" />
                      ) : (
                        <span className="text-[10px] sm:text-xs">{totalFeeSortAsc ? "▲" : "▼"}</span>
                      )}
                    </span>
                    <span aria-hidden="true" />
                  </button>
                </TableHead>
                <TableHead className="h-9 w-[122px] px-0 text-center text-[10px] text-slate-200 sm:h-11 sm:w-[150px] sm:text-xs">
                  <button
                    type="button"
                    className="grid w-full grid-cols-[8px_auto_auto_8px] items-center justify-center gap-0.5 px-1 hover:underline sm:grid-cols-[10px_auto_auto_10px] sm:gap-1 sm:px-1.5"
                    onClick={() =>
                      setRegSortAsc((prev) => (prev === null ? true : !prev))
                    }
                    title="Toggle sort by Registered On"
                  >
                    <span aria-hidden="true" />
                    <span className="text-center">Registered On</span>
                    <span className="flex justify-start">
                      {regSortAsc === null ? (
                        <ChevronsUpDown className="h-2.5 w-2.5 opacity-60 sm:h-3 sm:w-3" />
                      ) : (
                        <span className="text-[10px] sm:text-xs">{regSortAsc ? "▲" : "▼"}</span>
                      )}
                    </span>
                    <span aria-hidden="true" />
                  </button>
                </TableHead>
                {clubMembers?.filters
                  ?.filter((col: any) => activeColumnKeys.includes(col.key))
                  .map((column: any) => (
                    <TableHead
                      key={column.key}
                      className="h-9 w-[132px] text-center text-[10px] text-slate-200 sm:h-11 sm:w-[150px] sm:text-xs"
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
                    className={`group h-11 cursor-pointer border-slate-200 bg-white text-xs transition-colors hover:bg-slate-50 sm:h-14 sm:text-sm ${
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
                    <TableCell className="relative sticky left-0 z-20 w-[56px] bg-white px-1 py-1.5 text-center sm:w-[80px]">
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
                          className="h-4 w-4 rounded-[5px] border-2 border-slate-300 bg-white shadow-sm transition-colors hover:border-slate-500 data-[state=checked]:border-slate-600 data-[state=checked]:bg-slate-600 data-[state=checked]:text-white sm:h-5 sm:w-5 sm:rounded-[6px]"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="w-[122px] px-0 text-[11px] font-medium leading-4 text-slate-900 sm:w-[150px] sm:text-sm">
                      <div className="flex w-full justify-center px-1.5 text-center sm:px-2">
                        <span className="line-clamp-2 underline decoration-slate-400 underline-offset-2 sm:line-clamp-1">
                          {member.member_first_name + " " + member.member_surname}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="w-[138px] px-1 text-[11px] leading-4 text-slate-800 sm:w-[150px] sm:text-sm">
                      <div className="flex w-full justify-center px-1.5 text-center sm:px-2">
                        {member.member_email === "n/a" ? (
                          <span className="text-gray-400">n/a</span>
                        ) : (
                          <span className="line-clamp-2 break-all sm:line-clamp-1">{member.member_email}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="w-[112px] px-0 text-[11px] font-medium leading-4 text-slate-900 sm:w-[150px] sm:text-sm">
                      <div className="flex w-full justify-center px-1.5 text-center sm:px-2">
                        {member.total_fee === 0 ? (
                          <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 sm:px-2.5 sm:py-1 sm:text-xs">
                            Free
                          </span>
                        ) : member.total_fee != null ? (
                          <span className="line-clamp-2 sm:line-clamp-1">{formatAmount(member.total_fee, currency)}</span>
                        ) : (
                          <span className="text-gray-400">n/a</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="w-[122px] px-0 text-[10px] leading-4 text-slate-800 sm:w-[150px] sm:text-sm">
                      <div className="flex w-full justify-center px-1.5 text-center sm:px-2">
                        {member.registered_on
                          ? new Date(member.registered_on).toLocaleString()
                          : "-"}
                      </div>
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
                            className="w-[132px] px-1.5 text-center text-[11px] leading-4 text-slate-800 sm:w-[150px] sm:text-sm"
                          >
                            {columnValue === "N/A" ? (
                              <span className="text-gray-400">n/a</span>
                            ) : (
                              <span className="line-clamp-2 break-words sm:line-clamp-1">{columnValue}</span>
                            )}
                          </TableCell>
                        );
                      })}
                  </TableRow>
                ))
              ) : (
                <EmptyRegistrationsRow
                  colSpan={5 + (activeColumnKeys?.length ?? 0)}
                />
              )}
            </TableBody>
              </Table>
            </div>
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



    </>
  );
}
