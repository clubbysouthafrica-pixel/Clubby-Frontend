import { DndContext, closestCenter } from "@dnd-kit/core";
import { useEffect, useMemo, useState } from "react";
import { ChevronsUpDown, ChevronDown, ChevronRight } from "lucide-react";
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

const getMemberStatus = (registered: boolean, resubmissionRequired: boolean) => {
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
  listActionItems: { email: string; name: string; timestamp?: string | number }[];
  dereigsterMembers: { user_id: string; name: string }[];
  clubId: string;
  currency: string;
  memberLimit: number;
  members: any[];
  setAllListActionItems: (members: ClubMember[]) => void;
  setSelectedMember: React.Dispatch<React.SetStateAction<object>>;
  setlistActionItems: React.Dispatch<
    React.SetStateAction<{ email: string; name: string; timestamp?: string | number }[]>
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
  setAllListActionItems,
  setSelectedMember,
  setlistActionItems,
  setDeregisterMembers,
  setAllMembersSelected,
  setRegisteredMembersLength,
  onRemoveMembers,
}: ImageProps) {

  const [regSortAsc, setRegSortAsc] = useState<boolean | null>(null);
  const [memberNameSortAsc, setMemberNameSortAsc] = useState<boolean | null>(null);
  const [statusSortAsc, setStatusSortAsc] = useState<boolean | null>(null);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isValidationDialogOpen, setIsValidationDialogOpen] = useState(false);
  const [selectedMembersToDelete, setSelectedMembersToDelete] = useState<ClubMember[]>([]);
  const [membersRequiringDeregistration, setMembersRequiringDeregistration] = useState<ClubMember[]>([]);
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);


  const getStatusNumber = (member: any) => {
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

  return (
    <>

      <div
        className={`w-full rounded-lg border overflow-x-auto max-w-[79vw] ${
          members.length > 10
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
          >
            <TableHeader className="bg-muted sticky top-0 z-10">
              <TableRow>
                <TableHead className="text-center w-[80px] py-2 flex-shrink-0 sticky left-0 z-20 bg-muted">
                  <div className="flex justify-center items-center rounded-[10px] pl-3 pr-1 border-gray-300 border-1 w-fit mx-auto hover:border-gray-400 transition-colors">
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
                                // Check if all selected members are deregistered
                                const nonDeregistered = membersToDelete.filter(
                                  (member: any) => 
                                    member.registered || !member.resubmission_required
                                );
                                
                                if (nonDeregistered.length > 0) {
                                  // Some members are not deregistered
                                  setMembersRequiringDeregistration(nonDeregistered);
                                  setIsValidationDialogOpen(true);
                                } else {
                                  // All members are deregistered - proceed with delete
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
                <TableHead className="text-center w-[150px]">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 hover:underline w-full justify-center"
                    onClick={() => {
                      setMemberNameSortAsc((prev) => (prev === null ? true : !prev));
                      setRegSortAsc(null);
                      setStatusSortAsc(null);
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
                <TableHead className="text-center w-[150px]">
                  Email
                </TableHead>
                <TableHead className="text-center w-[120px]">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 hover:underline w-full justify-center"
                    onClick={() => {
                      setStatusSortAsc((prev) => (prev === null ? true : !prev));
                      setMemberNameSortAsc(null);
                      setRegSortAsc(null);
                    }}
                    title="Toggle sort by Status"
                  >
                    Status
                    {statusSortAsc === null ? (
                      <ChevronsUpDown className="h-3 w-3 opacity-60" />
                    ) : (
                      <span className="text-xs">{statusSortAsc ? "▲" : "▼"}</span>
                    )}
                  </button>
                </TableHead>
                <TableHead className="text-center w-[150px]">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 hover:underline"
                    onClick={() =>
                      setRegSortAsc((prev) => (prev === null ? true : !prev))
                    }
                    title="Toggle sort by Submission Date"
                  >
                    Submitted On
                    {regSortAsc === null ? (
                      <ChevronsUpDown className="h-3 w-3 opacity-60" />
                    ) : (
                      <span className="text-xs">{regSortAsc ? "▲" : "▼"}</span>
                    )}
                  </button>
                </TableHead>
                <TableHead className="text-center w-[120px]">
                  Registrations
                </TableHead>
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
                      className={`h-12 cursor-pointer border-l-4 ${expandedMemberId === member.user_id ? "border-l-blue-500" : "border-l-transparent"}`}
                    >
                      <TableCell className="text-center w-[80px] flex-shrink-0 sticky left-0 z-20 bg-white">
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
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-center w-[150px]">
                        <span className="underline">
                          {member.member_first_name + " " + member.member_surname}
                        </span>
                      </TableCell>
                      <TableCell className="text-center w-[150px]">
                        {member.member_email}
                      </TableCell>
                      <TableCell className="text-center w-[120px]">
                        {(() => {
                          const { status, className } = getMemberStatus(
                            member.registered,
                            member.resubmission_required
                          );
                          return (
                            <Badge className={className}>
                              {status}
                            </Badge>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="text-center w-[150px]">
                        {member.registrations?.[0]?.registration_submitted_on
                          ? new Date(
                              member.registrations[0].registration_submitted_on
                            ).toLocaleString()
                          : "-"}
                      </TableCell>
                      <TableCell className="text-center w-[120px]">
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
                          className="gap-1"
                        >
                          <ChevronRight
                            className={`h-4 w-4 transition-transform ${
                              expandedMemberId === member.user_id
                                ? "rotate-90"
                                : ""
                            }`}
                          />
                          {member.registrations?.length || 0}
                        </Button>
                      </TableCell>
                    </TableRow>
                    {expandedMemberId === member.user_id && (
                      <TableRow className="">
                        <TableCell colSpan={6} className="p-4 border-l-4 border-blue-500">
                          <div className="overflow-hidden rounded-lg border border-blue-200">
                            <Table className="w-full">
                              <TableHeader className="bg-blue-100 sticky top-0 z-10">
                                <TableRow>
                                  <TableHead className="text-center">
                                  </TableHead>
                                  <TableHead className="text-center">
                                    Registration State
                                  </TableHead>
                                  <TableHead className="text-center">
                                    Submitted On
                                  </TableHead>
                                  <TableHead className="text-center">
                                    Registered On
                                  </TableHead>
                                  <TableHead className="text-center">
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
                                      const memberStatus = getMemberStatus(member.registered, member.resubmission_required);
                                      const registrationState = reg.latest_registration ? memberStatus.status : "Deregistered";
                                      const registrationStateClass = reg.latest_registration ? memberStatus.className : "bg-red-100 text-red-800 border-red-300";
                                      return (
                                        <TableRow key={idx}>
                                          <TableCell className="text-center text-sm">
                                            <Badge className="bg-gray-100 text-gray-800 border-gray-300">
                                              {reg.latest_registration ? "Latest registration" : "Old registration"}
                                            </Badge>
                                          </TableCell>
                                          <TableCell className="text-center text-sm">
                                            <Badge className={registrationStateClass}>
                                              {registrationState}
                                            </Badge>
                                          </TableCell>
                                          <TableCell className="text-center text-sm">
                                            {new Date(
                                              reg.registration_submitted_on
                                            ).toLocaleString()}
                                          </TableCell>
                                          <TableCell className="text-center text-sm">
                                            {reg.registered_on
                                              ? new Date(
                                                  reg.registered_on
                                                ).toLocaleString()
                                              : "-"}
                                          </TableCell>
                                          <TableCell className="text-center text-sm">
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
                                      className="text-center text-sm text-muted-foreground"
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
                    colSpan={6}
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
                  const status = getMemberStatus(member.registered, member.resubmission_required);
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
