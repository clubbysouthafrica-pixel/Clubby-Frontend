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
import {
  ChevronsUpDown,
  Archive,
  ArchiveRestore,
  AlertTriangle,
} from "lucide-react";
import { Club } from "@/context/ClubContext";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { formatAmount } from "@/data/currencies";
import { useArchiveRegistrationMutation } from "@/mutations/admin/useRegistrationMutation";
import { toast } from "sonner";
import EmptyRegistrationsRow from "@/components/admin/members/registrations/features/empty-registrations-row";

interface PreviousMembersListProps {
  club: Club | null;
  sensors: any;
  sortableId: any;
  selectedTab: string;
  clubMembers: any;
  listActionItems: { email: string; name: string }[];
  memberNameFilter: string;
  memberIdFilter: string;
  dynamicFilters: Record<string, string>;
  activeColumnKeys?: string[];
  memberLimit: number;
  showTenRows?: boolean;
  showArchived?: boolean;
  setlistActionItems: React.Dispatch<
    React.SetStateAction<{ email: string; name: string }[]>
  >;
  setDeregisteredMembers: React.Dispatch<React.SetStateAction<ClubMember[]>>;
  setSelectedMember: React.Dispatch<React.SetStateAction<object>>;
  setDeregisteredMembersLength: React.Dispatch<React.SetStateAction<number>>;
}

const getRegistrationRowKey = (
  member: Pick<ClubMember, "registration_id" | "user_id" | "registered_on" | "deregistered_on">,
) =>
  member.registration_id ||
  `${member.user_id}-${member.registered_on || "registration"}-${member.deregistered_on || "deregistered"}`;

const getRegistrationPaymentStatus = (member: ClubMember) => {
  const totalFee = member.total_fee || 0;
  const outstandingAmount = member.outstanding_amount || 0;

  if (totalFee <= 0) {
    return {
      label: "No fee",
      className: "border-slate-200 bg-slate-100 text-slate-700",
    };
  }

  if (outstandingAmount <= 0) {
    return {
      label: "Paid",
      className: "border-green-200 bg-green-100 text-green-800",
    };
  }

  if (outstandingAmount < totalFee) {
    return {
      label: "Partially paid",
      className: "border-amber-200 bg-amber-100 text-amber-800",
    };
  }

  return {
    label: "Not paid",
    className: "border-orange-200 bg-orange-100 text-orange-800",
  };
};

export default function PreviousMembersList({
  sensors,
  sortableId,
  clubMembers,
  club,
  activeColumnKeys = [],
  listActionItems,
  showTenRows = false,
  setSelectedMember,
  setDeregisteredMembersLength,
  showArchived = false,
}: PreviousMembersListProps) {
  // Use raw clubMembers.deregistered - backend already handles pagination and member_name/member_id filtering
  const baseDeregisteredMembers = useMemo<ClubMember[]>(
    () => clubMembers?.deregistered || [],
    [clubMembers?.deregistered],
  );
  const [deregSortAsc, setDeregSortAsc] = useState<boolean | null>(null);
  const [memberNameSortAsc, setMemberNameSortAsc] = useState<boolean | null>(
    null,
  );
  const [totalFeeSortAsc, setTotalFeeSortAsc] = useState<boolean | null>(null);
  const [localArchivedToggle, setLocalArchivedToggle] = useState<
    Record<string, boolean | undefined>
  >({});
  const { mutate: archiveRegistrationMutate, isPending: isArchiving } =
    useArchiveRegistrationMutation();

  const sortedDeregisteredMembers = useMemo(() => {
    let sortedCopy = [...baseDeregisteredMembers];

    // Filter out locally archived entries (only when not showing archived)
    if (!showArchived) {
      sortedCopy = sortedCopy.filter((member: ClubMember) => {
        const isArchived =
          localArchivedToggle[member.user_id] !== undefined
            ? localArchivedToggle[member.user_id]
            : member.archived;
        return !isArchived;
      });
    }

    if (memberNameSortAsc !== null) {
      sortedCopy.sort((a: ClubMember, b: ClubMember) => {
        const aName =
          `${a.member_first_name} ${a.member_surname}`.toLowerCase();
        const bName =
          `${b.member_first_name} ${b.member_surname}`.toLowerCase();
        return memberNameSortAsc
          ? aName.localeCompare(bName)
          : bName.localeCompare(aName);
      });
    } else if (totalFeeSortAsc !== null) {
      sortedCopy.sort((a: ClubMember, b: ClubMember) => {
        const aFee = a.total_fee || 0;
        const bFee = b.total_fee || 0;
        return totalFeeSortAsc ? aFee - bFee : bFee - aFee;
      });
    } else if (deregSortAsc !== null) {
      sortedCopy.sort((a: ClubMember, b: ClubMember) => {
        const at = a?.deregistered_on
          ? new Date(a.deregistered_on).getTime()
          : 0;
        const bt = b?.deregistered_on
          ? new Date(b.deregistered_on).getTime()
          : 0;
        return deregSortAsc ? at - bt : bt - at;
      });
    }

    return sortedCopy;
  }, [
    baseDeregisteredMembers,
    deregSortAsc,
    memberNameSortAsc,
    totalFeeSortAsc,
    localArchivedToggle,
    showArchived,
  ]);

  useEffect(() => {
    setDeregisteredMembersLength(sortedDeregisteredMembers.length);
  }, [setDeregisteredMembersLength, sortedDeregisteredMembers]);

  const rowHeight = 60;
  const maxVisibleRows = showTenRows ? 10 : 5;
  const shouldScrollY = sortedDeregisteredMembers.length > maxVisibleRows;
  const tableViewportMaxHeight = shouldScrollY
    ? maxVisibleRows * rowHeight
    : undefined;
  const tableColumnWidths = [
    "120px",
    "220px",
    "150px",
    "150px",
    "150px",
    ...activeColumnKeys.map(() => "150px"),
  ];

  return (
    <>
      <div className="w-full max-w-full min-w-0 overflow-hidden rounded-[20px] border border-slate-200 bg-white [contain:inline-size]">
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
                <col key={`previous-col-${index}`} style={{ width }} />
              ))}
            </colgroup>
            <TableHeader className="sticky top-0 z-10 bg-zinc-700 [&_tr]:border-zinc-600">
              <TableRow>
                <TableHead className="sticky left-0 z-30 h-11 w-[120px] flex-shrink-0 bg-zinc-700 py-2 text-center text-xs text-slate-200">
                  Actions
                </TableHead>
                <TableHead className="h-11 w-[220px] px-0 text-center text-xs text-slate-200">
                  <button
                    type="button"
                    className="grid w-full grid-cols-[10px_auto_auto_10px] items-center justify-center gap-1 px-1.5 hover:underline"
                    onClick={() => {
                      setMemberNameSortAsc((prev) =>
                        prev === null ? true : !prev,
                      );
                      setDeregSortAsc(null);
                      setTotalFeeSortAsc(null);
                    }}
                    title="Toggle sort by Member Name"
                  >
                    <span aria-hidden="true" />
                    <span className="text-center">Member Name</span>
                    <span className="flex justify-start">
                      {memberNameSortAsc === null ? (
                        <ChevronsUpDown className="h-3 w-3 opacity-60" />
                      ) : (
                        <span className="text-xs">
                          {memberNameSortAsc ? "▲" : "▼"}
                        </span>
                      )}
                    </span>
                    <span aria-hidden="true" />
                  </button>
                </TableHead>
                <TableHead className="h-11 w-[150px] text-center text-xs text-slate-200">Email</TableHead>
                <TableHead className="h-11 w-[150px] px-0 text-center text-xs text-slate-200">
                  <button
                    type="button"
                    className="grid w-full grid-cols-[10px_auto_auto_10px] items-center justify-center gap-1 px-1.5 hover:underline"
                    onClick={() => {
                      setTotalFeeSortAsc((prev) =>
                        prev === null ? true : !prev,
                      );
                      setDeregSortAsc(null);
                      setMemberNameSortAsc(null);
                    }}
                    title="Toggle sort by Total Fee"
                  >
                    <span aria-hidden="true" />
                    <span className="text-center">Total Fee</span>
                    <span className="flex justify-start">
                      {totalFeeSortAsc === null ? (
                        <ChevronsUpDown className="h-3 w-3 opacity-60" />
                      ) : (
                        <span className="text-xs">
                          {totalFeeSortAsc ? "▲" : "▼"}
                        </span>
                      )}
                    </span>
                    <span aria-hidden="true" />
                  </button>
                </TableHead>
                <TableHead className="h-11 w-[150px] px-0 text-center text-xs text-slate-200">
                  <button
                    type="button"
                    className="grid w-full grid-cols-[10px_auto_auto_10px] items-center justify-center gap-1 px-1.5 hover:underline"
                    onClick={() =>
                      setDeregSortAsc((prev) => (prev === null ? true : !prev))
                    }
                    title="Toggle sort by Deregistered On"
                  >
                    <span aria-hidden="true" />
                    <span className="text-center">Deregistered On</span>
                    <span className="flex justify-start">
                      {deregSortAsc === null ? (
                        <ChevronsUpDown className="h-3 w-3 opacity-60" />
                      ) : (
                        <span className="text-xs">
                          {deregSortAsc ? "▲" : "▼"}
                        </span>
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
                      className="h-11 w-[150px] text-center text-xs text-slate-200"
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
                    key={getRegistrationRowKey(member)}
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
                    <TableCell className="relative sticky left-0 z-20 w-[120px] flex-shrink-0 bg-white px-0 text-center">
                      <div
                        className="flex w-full justify-center gap-2 px-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => {
                                archiveRegistrationMutate(
                                  {
                                    user_id: member.user_id,
                                    registration_id:
                                      member.registration_id || "",
                                  },
                                  {
                                    onSuccess: () => {
                                      const currentState =
                                        localArchivedToggle[member.user_id] !==
                                        undefined
                                          ? localArchivedToggle[member.user_id]
                                          : member.archived;
                                      setLocalArchivedToggle((prev) => ({
                                        ...prev,
                                        [member.user_id]: !currentState,
                                      }));
                                      if (currentState) {
                                        toast.success(
                                          "Registration unarchived successfully",
                                        );
                                      } else {
                                        toast.success(
                                          "Registration archived successfully",
                                        );
                                      }
                                    },
                                    onError: (error: unknown) => {
                                      const errObj = error as
                                        | Record<string, unknown>
                                        | undefined;
                                      const resp = errObj?.response as
                                        | Record<string, unknown>
                                        | undefined;
                                      const msg =
                                        ((
                                          resp?.data as
                                            | Record<string, unknown>
                                            | undefined
                                        )?.message as string | undefined) ??
                                        String(error ?? "An error occurred");
                                      toast.error(msg);
                                    },
                                  },
                                );
                              }}
                              disabled={isArchiving}
                              className="cursor-pointer rounded-full border border-slate-200 bg-slate-50 p-1.5 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {(() => {
                                const isArchived =
                                  localArchivedToggle[member.user_id] !==
                                  undefined
                                    ? localArchivedToggle[member.user_id]
                                    : member.archived;
                                return isArchived ? (
                                  <ArchiveRestore className="h-4 w-4" />
                                ) : (
                                  <Archive className="h-4 w-4" />
                                );
                              })()}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {(() => {
                              const isArchived =
                                localArchivedToggle[member.user_id] !==
                                undefined
                                  ? localArchivedToggle[member.user_id]
                                  : member.archived;
                              return isArchived
                                ? "Unarchive registration"
                                : "Archive registration";
                            })()}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                    <TableCell className="w-[220px] px-0 text-center">
                      <div className="flex w-full items-center justify-center gap-2 px-2">
                        <span className="underline">
                          {member.member_first_name +
                            " " +
                            member.member_surname}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="w-[150px] px-0 text-center">
                      <div className="flex w-full justify-center px-2 text-center">
                        {member.member_email === "n/a" ? <span className="text-gray-400">n/a</span> : member.member_email}
                      </div>
                    </TableCell>
                    <TableCell className="w-[150px] px-0 text-center">
                      {(() => {
                        const paymentStatus = getRegistrationPaymentStatus(member);
                        const totalFee = member.total_fee || 0;
                        const outstandingAmount = member.outstanding_amount || 0;
                        const amountPaid = Math.max(totalFee - outstandingAmount, 0);

                        if (!totalFee) {
                          return <div className="flex w-full justify-center px-2 text-center"><span className="text-gray-400">n/a</span></div>;
                        }

                        return (
                          <div className="flex w-full justify-center px-2 text-center">
                            <div className="flex flex-col items-center gap-2 text-center">
                              <Badge className={paymentStatus.className}>
                                {paymentStatus.label}
                              </Badge>
                              <p className="text-xs font-medium text-foreground">
                                {outstandingAmount > 0
                                  ? `${formatAmount(amountPaid, club?.currency)} of ${formatAmount(totalFee, club?.currency)}`
                                  : formatAmount(totalFee, club?.currency)}
                              </p>
                            </div>
                          </div>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="relative w-[150px] px-0 text-center">
                      <div className="flex w-full justify-center px-2 text-center">
                        {member?.last_season_registration ||
                        !member?.deregistered_on ? (
                          <Badge className="bg-red-100 text-red-800 border-red-300">
                            Previous Season Registration
                          </Badge>
                        ) : (
                          new Date(member?.deregistered_on).toLocaleString()
                        )}
                      </div>
                      {member.missing_club_member && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <AlertTriangle className="h-4 w-4 text-red-600 fill-red-100" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            This member no longer exists with the club
                          </TooltipContent>
                        </Tooltip>
                      )}
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
                          columnValue = customField?.value
                            ? formatAmount(customField?.value, club?.currency)
                            : "N/A";
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
    </>
  );
}
