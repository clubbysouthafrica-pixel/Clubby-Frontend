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
  Trash2,
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import RemoveRegistrationDialog from "./features/remove-registration-dialog";
import { formatAmount } from "@/data/currencies";
import { useArchiveRegistrationMutation } from "@/mutations/admin/useRegistrationMutation";
import { toast } from "sonner";

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
  showArchived?: boolean;
  onShowArchivedChange?: (value: boolean) => void;
  setlistActionItems: React.Dispatch<
    React.SetStateAction<{ email: string; name: string }[]>
  >;
  setSelectedMember: React.Dispatch<React.SetStateAction<object>>;
  setDeregisteredMembersLength: React.Dispatch<React.SetStateAction<number>>;
}

const getRegistrationKey = (member: Pick<ClubMember, "registration_id" | "user_id">) =>
  member.registration_id || member.user_id;

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
  setSelectedMember,
  setDeregisteredMembersLength,
  setlistActionItems,
  showArchived = false,
  onShowArchivedChange,
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
  const [openRemoveDialog, setOpenRemoveDialog] = useState<boolean>(false);
  const [selectedMembersToRemove, setSelectedMembersToRemove] = useState<
    ClubMember[]
  >([]);
  const [removedRegistrationKeys, setRemovedRegistrationKeys] = useState<string[]>(
    [],
  );
  const [localArchivedToggle, setLocalArchivedToggle] = useState<
    Record<string, boolean | undefined>
  >({});
  const { mutate: archiveRegistrationMutate, isPending: isArchiving } =
    useArchiveRegistrationMutation();

  const sortedDeregisteredMembers = useMemo(() => {
    let sortedCopy = baseDeregisteredMembers.filter(
      (member: ClubMember) =>
        !removedRegistrationKeys.includes(getRegistrationKey(member)),
    );

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
    removedRegistrationKeys,
    localArchivedToggle,
    showArchived,
  ]);

  useEffect(() => {
    setDeregisteredMembersLength(
      baseDeregisteredMembers.filter(
        (member: ClubMember) =>
          !removedRegistrationKeys.includes(getRegistrationKey(member)),
      ).length,
    );
  }, [baseDeregisteredMembers, removedRegistrationKeys, setDeregisteredMembersLength]);

  return (
    <>
      <div className="mb-4 flex items-center gap-2">
        <Switch
          id="show-archived"
          checked={showArchived}
          onCheckedChange={onShowArchivedChange}
        />
        <Label htmlFor="show-archived" className="cursor-pointer">
          Show archived registrations
        </Label>
      </div>
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
                <TableHead className="text-center w-[120px] py-2 flex-shrink-0 sticky left-0 z-20 bg-muted">
                  Actions
                </TableHead>
                <TableHead className="text-center w-[220px]">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 hover:underline w-full justify-center"
                    onClick={() => {
                      setMemberNameSortAsc((prev) =>
                        prev === null ? true : !prev,
                      );
                      setDeregSortAsc(null);
                      setTotalFeeSortAsc(null);
                    }}
                    title="Toggle sort by Member Name"
                  >
                    Member Name
                    {memberNameSortAsc === null ? (
                      <ChevronsUpDown className="h-3 w-3 opacity-60" />
                    ) : (
                      <span className="text-xs">
                        {memberNameSortAsc ? "▲" : "▼"}
                      </span>
                    )}
                  </button>
                </TableHead>
                <TableHead className="text-center w-[150px]">Email</TableHead>
                <TableHead className="text-center w-[150px]">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 hover:underline w-full justify-center"
                    onClick={() => {
                      setTotalFeeSortAsc((prev) =>
                        prev === null ? true : !prev,
                      );
                      setDeregSortAsc(null);
                      setMemberNameSortAsc(null);
                    }}
                    title="Toggle sort by Total Fee"
                  >
                    Total Fee
                    {totalFeeSortAsc === null ? (
                      <ChevronsUpDown className="h-3 w-3 opacity-60" />
                    ) : (
                      <span className="text-xs">
                        {totalFeeSortAsc ? "▲" : "▼"}
                      </span>
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
                    onClick={() => {
                      setSelectedMember(member);
                      window.location.hash = member.user_id;
                    }}
                    className={`h-12 cursor-pointer hover:drop-shadow-md transition-shadow relative ${
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
                    <TableCell className="text-center w-[120px] flex-shrink-0 sticky left-0 z-20 bg-white relative">
                      <div
                        className="flex justify-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => {
                                setSelectedMembersToRemove([member]);
                                setOpenRemoveDialog(true);
                              }}
                              className="p-1 rounded-md transition-colors text-red-600 hover:text-red-700 cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Delete registration</TooltipContent>
                        </Tooltip>
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
                              className="p-1 rounded-md transition-colors text-gray-600 hover:text-gray-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
                    <TableCell className="text-center w-[150px]">
                      <div className="flex items-center justify-center gap-2">
                        <span className="underline">
                          {member.member_first_name +
                            " " +
                            member.member_surname}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center w-[150px]">
                      {member.member_email === "n/a" ? <span className="text-gray-400">n/a</span> : member.member_email}
                    </TableCell>
                    <TableCell className="text-center w-[150px]">
                      {(() => {
                        const paymentStatus = getRegistrationPaymentStatus(member);
                        const totalFee = member.total_fee || 0;
                        const outstandingAmount = member.outstanding_amount || 0;
                        const amountPaid = Math.max(totalFee - outstandingAmount, 0);

                        if (!totalFee) {
                          return <span className="text-gray-400">n/a</span>;
                        }

                        return (
                          <div className="flex flex-col items-center gap-2 text-center">
                            <Badge className={paymentStatus.className}>
                              {paymentStatus.label}
                            </Badge>
                            <div className="space-y-1 text-xs text-muted-foreground">
                              <p className="font-medium text-foreground">
                                Paid: {formatAmount(amountPaid, club?.currency)}
                              </p>
                              <p>
                                Total: {formatAmount(totalFee, club?.currency)}
                              </p>
                            </div>
                          </div>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="text-center w-[150px]">
                      {member.missing_club_member && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="absolute top-5 right-5 transform translate-x-1 -translate-y-1">
                              <AlertTriangle className="h-4 w-4 text-red-600 fill-red-100" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            This member no longer exists with the club
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {member?.last_season_registration ||
                      !member?.deregistered_on ? (
                        <Badge className="bg-red-100 text-red-800 border-red-300">
                          Previous Season Registration
                        </Badge>
                      ) : (
                        new Date(member?.deregistered_on).toLocaleString()
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
                <TableRow>
                  <TableCell
                    colSpan={5 + (activeColumnKeys?.length ?? 0)}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DndContext>

        <RemoveRegistrationDialog
          open={openRemoveDialog}
          onOpenChange={setOpenRemoveDialog}
          members={selectedMembersToRemove}
          onRemoveSuccess={(removedMembers) => {
            const removedKeys = removedMembers.map((member) =>
              getRegistrationKey(member),
            );

            setRemovedRegistrationKeys((prev) => [
              ...prev,
              ...removedKeys.filter((key) => !prev.includes(key)),
            ]);
            setlistActionItems((prev) =>
              prev.filter(
                (item) =>
                  !removedMembers.some(
                    (member) => member.member_email === item.email,
                  ),
              ),
            );
            setSelectedMembersToRemove([]);
          }}
        />
      </div>
    </>
  );
}
