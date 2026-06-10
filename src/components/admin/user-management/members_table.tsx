import { DndContext, closestCenter } from "@dnd-kit/core";
import { useEffect, useMemo, useState } from "react";
import { ChevronsUpDown, ChevronDown, ChevronRight, ArrowUpRight } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ReusableSendEmailDialog from "./features/reusable-send-email-dialog";
import RemoveMemberDialog from "./features/remove-member-dialog";
import { Badge } from "@/components/ui/badge";
import {
  getMemberProfileColumnValue,
  MEMBER_PROFILE_COLUMNS,
  type MemberProfileColumn,
} from "@/helpers/admin/members/member-profile-columns";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

const getMemberStatus = (
  registered: boolean,
  resubmissionRequired: boolean,
  nonRegistration?: boolean,
) => {
  if (nonRegistration) {
    return {
      status: "Non Registration",
      className: "bg-sky-100 text-sky-800 border-sky-300",
    };
  }

  if (!registered && resubmissionRequired) {
    return { status: "Deregistered", className: "bg-red-100 text-red-800 border-red-300" };
  }
  if (!registered && !resubmissionRequired) {
    return { status: "Pending", className: "bg-orange-100 text-orange-800 border-orange-300" };
  }
  // registered true (both true or registered true, resubmission false)
  return { status: "Registered", className: "bg-green-100 text-green-800 border-green-300" };
};

interface ImageProps {
  sensors: any;
  sortableId: any;
  allMembersSelected: boolean;
  listActionItems: { email: string; name: string; timestamp?: string | number; email_opt_in?: boolean }[];
  dereigsterMembers: { user_id: string; name: string }[];
  clubId: string;
  currency: string;
  memberLimit: number;
  members: any[];
  activeColumnKeys?: string[];
  setAllListActionItems: (members: ClubMember[]) => void;
  setSelectedMember: React.Dispatch<React.SetStateAction<object>>;
  setlistActionItems: React.Dispatch<
    React.SetStateAction<{ email: string; name: string; timestamp?: string | number; email_opt_in?: boolean }[]>
  >;
  setDeregisterMembers: React.Dispatch<
    React.SetStateAction<{ user_id: string; name: string }[]>
  >;
  setAllMembersSelected: React.Dispatch<React.SetStateAction<boolean>>;
  setRegisteredMembersLength: React.Dispatch<React.SetStateAction<number>>;
  onRemoveMembers?: (memberIds: string[]) => void;
}

export default function MembersTable({
  sensors,
  sortableId,
  allMembersSelected,
  listActionItems,
  dereigsterMembers,
  members,
  clubId,
  activeColumnKeys = [],
  setAllListActionItems,
  setSelectedMember,
  setlistActionItems,
  setDeregisterMembers,
  setAllMembersSelected,
  setRegisteredMembersLength,
  onRemoveMembers,
}: ImageProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [regSortAsc, setRegSortAsc] = useState<boolean | null>(null);
  const [memberNameSortAsc, setMemberNameSortAsc] = useState<boolean | null>(null);
  const [statusSortAsc, setStatusSortAsc] = useState<boolean | null>(null);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isValidationDialogOpen, setIsValidationDialogOpen] = useState(false);
  const [selectedMembersToDelete, setSelectedMembersToDelete] = useState<ClubMember[]>([]);
  const [membersRequiringDeregistration, setMembersRequiringDeregistration] = useState<ClubMember[]>([]);
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);

  const getRegistrationsTab = (
    member: ClubMember & { registered?: boolean },
  ) => {
    if (member.registered === true) {
      return "registered-members";
    }

    if (member.registered === false && !member.resubmission_required) {
      return "pending-members";
    }

    return "previous-members";
  };

  const handleGoToRegistration = (
    member: ClubMember & { registered?: boolean },
    registrationId?: string,
  ) => {
    const params = new URLSearchParams({
      tab: getRegistrationsTab(member),
      memberId: member.user_id,
      source: "members-table",
    });

    if (registrationId?.trim()) {
      params.set("registrationId", registrationId);
    }

    navigate(`/manage/member/registrations?${params.toString()}`);
  };


  const getStatusNumber = (member: any) => {
    if (member.non_registration) return 0;
    if (!member.registered && member.resubmission_required) return 0;
    if (!member.registered && !member.resubmission_required) return 1;
    return 2;
  };

  const sortedRegisteredMembers = useMemo(() => {
    let sortedCopy = [...members];

    if (memberNameSortAsc !== null) {
      sortedCopy.sort((a: any, b: any) => {
        const aName = `${a.member_first_name} ${a.member_surname}`.toLowerCase();
        const bName = `${b.member_first_name} ${b.member_surname}`.toLowerCase();
        return memberNameSortAsc ? aName.localeCompare(bName) : bName.localeCompare(aName);
      });
    } else if (statusSortAsc !== null) {
      sortedCopy.sort((a: any, b: any) => {
        const aStatus = getStatusNumber(a);
        const bStatus = getStatusNumber(b);
        return statusSortAsc ? aStatus - bStatus : bStatus - aStatus;
      });
    } else if (regSortAsc !== null) {
      sortedCopy.sort((a: any, b: any) => {
        const aTime = a.registrations?.[0]?.registration_submitted_on || 0;
        const bTime = b.registrations?.[0]?.registration_submitted_on || 0;
        return regSortAsc ? aTime - bTime : bTime - aTime;
      });
    }

    return sortedCopy;
  }, [members, regSortAsc, memberNameSortAsc, statusSortAsc]);

  useEffect(() => {
    setRegisteredMembersLength(members.length);
  }, [members, setRegisteredMembersLength]);

  const selectedProfileColumns = useMemo<MemberProfileColumn[]>(
    () => MEMBER_PROFILE_COLUMNS.filter((column) => activeColumnKeys.includes(column.key)),
    [activeColumnKeys],
  );
  const headerHeight = isMobile ? 36 : 44;
  const rowHeight = isMobile ? 46 : 56;
  const maxVisibleRows = 10;
  const shouldScrollY = members.length > maxVisibleRows;
  const tableViewportMaxHeight = shouldScrollY
    ? headerHeight + maxVisibleRows * rowHeight
    : undefined;
  const tableColumnWidths = [
    isMobile ? "56px" : "80px",
    isMobile ? "122px" : "150px",
    isMobile ? "138px" : "150px",
    isMobile ? "96px" : "120px",
    isMobile ? "96px" : "120px",
    ...selectedProfileColumns.map(() => (isMobile ? "132px" : "170px")),
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
                <col key={`members-col-${index}`} style={{ width }} />
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
                          onClick={() => setIsEmailDialogOpen(true)}
                          disabled={!listActionItems.length}
                        >
                          Send Email
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            if (listActionItems.length > 0) {
                              const membersToDelete = sortedRegisteredMembers.filter(
                                (member: any) =>
                                  listActionItems.some(
                                    (item) =>
                                      item.email === member.member_email &&
                                      item.name ===
                                        `${member.member_first_name} ${member.member_surname}`,
                                  ),
                              );
                              if (membersToDelete.length > 0) {
                                const nonDeregistered = membersToDelete.filter(
                                  (member: any) =>
                                    member.registered || !member.resubmission_required,
                                );

                                if (nonDeregistered.length > 0) {
                                  setMembersRequiringDeregistration(nonDeregistered);
                                  setIsValidationDialogOpen(true);
                                } else {
                                  setSelectedMembersToDelete(membersToDelete);
                                  setIsDeleteDialogOpen(true);
                                }
                              }
                            }
                          }}
                          disabled={!listActionItems.length}
                          className="text-red-600"
                        >
                          Delete Members
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
                      setStatusSortAsc(null);
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
                <TableHead className="h-9 w-[96px] px-0 text-center text-[10px] text-slate-200 sm:h-11 sm:w-[120px] sm:text-xs">
                  <button
                    type="button"
                    className="grid w-full grid-cols-[8px_auto_auto_8px] items-center justify-center gap-0.5 px-1 hover:underline sm:grid-cols-[10px_auto_auto_10px] sm:gap-1 sm:px-1.5"
                    onClick={() => {
                      setStatusSortAsc((prev) => (prev === null ? true : !prev));
                      setMemberNameSortAsc(null);
                      setRegSortAsc(null);
                    }}
                    title="Toggle sort by Status"
                  >
                    <span aria-hidden="true" />
                    <span className="text-center">Status</span>
                    <span className="flex justify-start">
                      {statusSortAsc === null ? (
                        <ChevronsUpDown className="h-2.5 w-2.5 opacity-60 sm:h-3 sm:w-3" />
                      ) : (
                        <span className="text-[10px] sm:text-xs">{statusSortAsc ? "▲" : "▼"}</span>
                      )}
                    </span>
                    <span aria-hidden="true" />
                  </button>
                </TableHead>
                <TableHead className="h-9 w-[96px] text-center text-[10px] text-slate-200 sm:h-11 sm:w-[120px] sm:text-xs">
                  Registrations
                </TableHead>
                {selectedProfileColumns.map((column) => (
                  <TableHead key={column.key} className="h-9 min-w-[132px] text-center text-[10px] text-slate-200 sm:h-11 sm:min-w-[170px] sm:text-xs">
                    {column.field_name}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRegisteredMembers.length ? (
                sortedRegisteredMembers.map((member: any) => (
                  <>
                    <TableRow
                      key={member.user_id}
                      onClick={() => {
                        setSelectedMember(member);
                        window.location.hash = member.user_id;
                      }}
                      className={`group h-11 cursor-pointer border-slate-200 bg-white text-xs transition-colors hover:bg-slate-50 sm:h-14 sm:text-sm ${expandedMemberId === member.user_id ? "bg-slate-50 shadow-[inset_4px_0_0_0_#3b82f6]" : ""}`}
                    >
                      <TableCell className={`relative sticky left-0 z-20 w-[56px] px-1 py-1.5 text-center sm:w-[80px] ${expandedMemberId === member.user_id ? "bg-slate-50" : "bg-white"}`}>
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
                                    email_opt_in: member.email_opt_in,
                                  },
                                ];
                                setlistActionItems(updatedListActionItems);
                                if (
                                  updatedListActionItems.length ===
                                  members.length
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
                      <TableCell className="w-[138px] px-1 text-center text-[11px] leading-4 text-slate-800 sm:w-[150px] sm:text-sm">
                        {member.member_email === "n/a" ? (
                          <span className="text-gray-400">n/a</span>
                        ) : (
                          <span className="line-clamp-2 break-all sm:line-clamp-1">{member.member_email}</span>
                        )}
                      </TableCell>
                      <TableCell className="w-[96px] px-0 text-center">
                        {(() => {
                          const { status, className } = getMemberStatus(
                            member.registered,
                            member.resubmission_required,
                            member.non_registration,
                          );
                          return (
                            <div className="flex w-full justify-center px-1.5 sm:px-2">
                              <Badge className={`${className} px-1.5 py-0.5 text-[10px] font-medium sm:px-2 sm:py-0.5 sm:text-xs`}>
                                {status}
                              </Badge>
                            </div>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="w-[96px] px-0 text-center">
                        <div className="flex w-full justify-center px-1.5 sm:px-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedMemberId(
                                expandedMemberId === member.user_id
                                  ? null
                                  : member.user_id
                              )
                            }}
                            className="h-7 gap-1 rounded-full px-1.5 text-[10px] text-slate-700 hover:bg-slate-100 hover:text-slate-900 sm:h-8 sm:px-2.5 sm:text-sm"
                          >
                            <ChevronRight
                              className={`h-3 w-3 transition-transform sm:h-4 sm:w-4 ${
                                expandedMemberId === member.user_id
                                  ? "rotate-90"
                                  : ""
                              }`}
                            />
                            {member.registrations?.length || 0}
                          </Button>
                        </div>
                      </TableCell>
                      {selectedProfileColumns.map((column) => {
                        const columnValue = getMemberProfileColumnValue(member, column.key);

                        return (
                          <TableCell key={column.key} className="min-w-[132px] px-1.5 text-center text-[11px] leading-4 text-slate-800 sm:min-w-[170px] sm:text-sm">
                            {columnValue === "N/A" ? (
                              <span className="text-gray-400">n/a</span>
                            ) : (
                              <span className="line-clamp-2 break-words sm:line-clamp-1">{columnValue}</span>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                    {expandedMemberId === member.user_id && (
                      <TableRow>
                        <TableCell colSpan={6 + selectedProfileColumns.length} className="border-l-4 border-blue-500 p-2 sm:p-4">
                          <div className="overflow-hidden rounded-[14px] border border-slate-200 bg-slate-50 sm:rounded-[18px]">
                            <Table className="w-full">
                              <TableHeader className="sticky top-0 z-10 bg-zinc-700 [&_tr]:border-zinc-600">
                                <TableRow>
                                  <TableHead className="px-1 py-2 text-center text-[10px] text-slate-200 sm:text-xs">
                                  </TableHead>
                                  <TableHead className="px-1 py-2 text-center text-[10px] text-slate-200 sm:text-xs">
                                    Registration State
                                  </TableHead>
                                  <TableHead className="px-1 py-2 text-center text-[10px] text-slate-200 sm:text-xs">
                                    Submitted On
                                  </TableHead>
                                  <TableHead className="px-1 py-2 text-center text-[10px] text-slate-200 sm:text-xs">
                                    Registered On
                                  </TableHead>
                                  <TableHead className="px-1 py-2 text-center text-[10px] text-slate-200 sm:text-xs">
                                    Deregistered On
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {member.registrations &&
                                member.registrations.length > 0 ? (
                                  [...member.registrations]
                                    .sort((a: any, b: any) =>
                                      b.latest_registration === true ? 1 : a.latest_registration === true ? -1 : 0
                                    )
                                    .map(
                                    (reg: any, idx: number) => {
                                      const memberStatus = getMemberStatus(member.registered, member.resubmission_required, member.non_registration);
                                      const registrationState = reg.latest_registration ? memberStatus.status : "Deregistered";
                                      const registrationStateClass = reg.latest_registration ? memberStatus.className : "bg-red-100 text-red-800 border-red-300";
                                      return (
                                        <TableRow key={idx} className="h-10 border-slate-200 bg-white text-[11px] hover:bg-slate-50 sm:h-12 sm:text-sm">
                                          <TableCell className="px-1.5 py-1.5 text-center text-[11px] text-slate-800 sm:text-sm">
                                            <Button
                                              type="button"
                                              variant="outline"
                                              size="sm"
                                              className="h-6 rounded-full border-slate-300 bg-white px-2 text-[10px] text-slate-700 hover:border-slate-400 hover:bg-slate-50 sm:h-8 sm:px-3 sm:text-xs"
                                              onClick={(event) => {
                                                event.stopPropagation();
                                                handleGoToRegistration(member, reg.registration_id);
                                              }}
                                            >
                                              Open
                                              <ArrowUpRight className="ml-1 h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                            </Button>
                                          </TableCell>
                                          <TableCell className="px-1.5 py-1.5 text-center text-[11px] sm:text-sm">
                                            <Badge className={`${registrationStateClass} px-1.5 py-0.5 text-[10px] font-medium sm:px-2 sm:text-xs`}>
                                              {registrationState}
                                            </Badge>
                                          </TableCell>
                                          <TableCell className="px-1.5 py-1.5 text-center text-[10px] leading-4 text-slate-800 sm:text-sm">
                                            {new Date(
                                              reg.registration_submitted_on
                                            ).toLocaleString()}
                                          </TableCell>
                                          <TableCell className="px-1.5 py-1.5 text-center text-[10px] leading-4 text-slate-800 sm:text-sm">
                                            {reg.registered_on
                                              ? new Date(
                                                  reg.registered_on
                                                ).toLocaleString()
                                              : "-"}
                                          </TableCell>
                                          <TableCell className="px-1.5 py-1.5 text-center text-[10px] leading-4 text-slate-800 sm:text-sm">
                                            {reg.deregistered_on
                                              ? new Date(
                                                  reg.deregistered_on
                                                ).toLocaleString()
                                              : "-"}
                                          </TableCell>
                                        </TableRow>
                                      );
                                    }
                                  )
                                ) : (
                                  <TableRow>
                                    <TableCell
                                      colSpan={5}
                                      className="text-center text-sm text-slate-500"
                                    >
                                      No registrations
                                    </TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={6 + selectedProfileColumns.length}
                    className="h-20 text-center text-sm text-slate-500"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          </div>
        </DndContext>
        </div>
      </div>

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

      <RemoveMemberDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        members={selectedMembersToDelete}
        onRemoveSuccess={(memberIds) => {
          setlistActionItems([]);
          setDeregisterMembers([]);
          setAllMembersSelected(false);
          setSelectedMembersToDelete([]);
          onRemoveMembers?.(memberIds);
        }}
      />

      <Dialog open={isValidationDialogOpen} onOpenChange={setIsValidationDialogOpen}>
        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>Cannot Delete Members</DialogTitle>
            <DialogDescription>
              The following members cannot be deleted because they have active or pending registrations.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg border bg-orange-50 border-orange-200 p-4">
              <p className="text-sm font-semibold text-orange-900 mb-3">
                Members requiring deregistration:
              </p>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {membersRequiringDeregistration.map((member: any) => {
                  const status = getMemberStatus(member.registered, member.resubmission_required, member.non_registration);
                  const initials = `${member.member_first_name} ${member.member_surname}`
                    .split(" ")
                    .map((n: string) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase();

                  return (
                    <div
                      key={member.user_id}
                      className="flex items-center gap-3 p-2 bg-white rounded border border-orange-100"
                    >
                      <div className="h-8 w-8 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm shadow-sm flex-shrink-0">
                        {initials}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {member.member_first_name} {member.member_surname}
                        </p>
                        <p className="text-xs text-gray-600">{member.member_email}</p>
                      </div>
                      <Badge className={status.className}>
                        {status.status}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2 bg-blue-50 p-3 rounded-lg border border-blue-200">
              <p className="text-sm font-semibold text-blue-900">What to do next:</p>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>
                  Go back to the Registrations section (Active, Pending, or Previous)
                </li>
                <li>
                  Find each member that needs to be deleted
                </li>
                <li>
                  Deregister them first if they have active or pending registrations
                </li>
                <li>
                  Once all selected members are deregistered, you can then delete them
                </li>
              </ol>
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
