import { DndContext, closestCenter } from "@dnd-kit/core";
import { Fragment, useEffect, useMemo, useState } from "react";
import { ChevronsUpDown, ChevronDown, UserPlus, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ClubMember } from "@/interfaces/club";
import { formatAmount } from "@/data/currencies";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Club } from "@/context/ClubContext";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { ClubVariable } from "@/interfaces/club-variable";
import { generateClubVariableValue } from "@/lib/club-variable-rules";
import ReusableDeregisterDialog from "./features/reusable-deregister-dialog";
import ReusableSendEmailDialog from "@/components/admin/members/members/features/reusable-send-email-dialog";

interface ImageProps {
  club: Club | null;
  sensors: any;
  sortableId: any;
  openDialogUserId: string | null;
  displayAmount: string;
  memberRegisterAmount: number;
  isPending: boolean;
  invalidRegistrationAmount: boolean;
  isError: any;
  selectedTab: string;
  clubMembers: any;
  memberNameFilter: string;
  memberIdFilter: string;
  dynamicFilters: Record<string, string>;
  allMembersSelected: boolean;
  listActionItems: { email: string; name: string }[];
  clubId: string;
  activeColumnKeys?: string[];
  memberLimit: number;
  showTenRows?: boolean;
  reset: () => void;
  handleFormattedInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  registerUser: (
    member: ClubMember,
    paymentMethod?: string,
    templateVariables?: Array<{ name: string; value: string; auto_generated?: boolean }>,
  ) => void;
  setSelectedMember: React.Dispatch<React.SetStateAction<object>>;
  setOpenDialogUserId: React.Dispatch<React.SetStateAction<string | null>>;
  setlistActionItems: React.Dispatch<
    React.SetStateAction<{ email: string; name: string }[]>
  >;
  setMemberRegisterAmount: React.Dispatch<React.SetStateAction<number>>;
  setAllListActionItems: (members: ClubMember[]) => void;
  setAllMembersSelected: React.Dispatch<React.SetStateAction<boolean>>;
  showPendingSummary?: boolean;
}

export default function PendingMembersList({
  club,
  sensors,
  sortableId,
  openDialogUserId,
  displayAmount,
  memberRegisterAmount,
  isPending,
  invalidRegistrationAmount,
  isError,
  clubMembers,
  allMembersSelected,
  listActionItems,
  clubId,
  activeColumnKeys = [],
  reset,
  handleFormattedInputChange,
  showTenRows = false,
  registerUser,
  setSelectedMember,
  setlistActionItems,
  setOpenDialogUserId,
  setAllMembersSelected,
  setMemberRegisterAmount,
  setAllListActionItems,
  showPendingSummary = true,
}: ImageProps) {
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<string>("EFT/Cash");
  const [templateVariables, setTemplateVariables] = useState<
    Record<string, string>
  >({});
  const [templateVariablesError, setTemplateVariablesError] =
    useState<string>("");
  const [isTemplateVariablesOpen, setIsTemplateVariablesOpen] =
    useState<boolean>(true);
  const [isPaymentMethodsOpen, setIsPaymentMethodsOpen] =
    useState<boolean>(true);
  const [isDeregisterDialogOpen, setIsDeregisterDialogOpen] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [
    showPendingRegistrationsDropdown,
    setShowPendingRegistrationsDropdown,
  ] = useState(false);
  const [deregisterMembers, setDeregisterMembers] = useState<
    { user_id: string; name: string }[]
  >([]);

  const allMembersForRules = useMemo(
    () => [
      ...(clubMembers?.registered ?? []),
      ...(clubMembers?.unregistered ?? []),
      ...(clubMembers?.deregistered ?? []),
    ],
    [
      clubMembers?.deregistered,
      clubMembers?.registered,
      clubMembers?.unregistered,
    ],
  );

  const isRulesEngineTemplateVariable = (rulesEngine: unknown) => {
    if (typeof rulesEngine === "boolean") {
      return rulesEngine;
    }

    if (rulesEngine && typeof rulesEngine === "object") {
      return Boolean((rulesEngine as { enabled?: boolean }).enabled);
    }

    return false;
  };

  const isTemplateVariableEntryUnlocked = (member: ClubMember) => {
    const outstandingAmount = Number(member.outstanding_amount || 0);

    if (outstandingAmount <= 0) {
      return true;
    }

    return !invalidRegistrationAmount && memberRegisterAmount === outstandingAmount;
  };

  const buildGeneratedTemplateVariables = (member: ClubMember) => {
    const generatedValues: Record<string, string> = {
      member_name: `${member.member_first_name} ${member.member_surname}`,
    };

    const configuredVariables = Array.isArray(clubMembers?.template_variables)
      ? clubMembers.template_variables
      : [];

    configuredVariables.forEach((rawVariable: any) => {
      const variable: ClubVariable = {
        name: String(rawVariable?.title || rawVariable?.name || ""),
        key: String(rawVariable?.name || rawVariable?.key || ""),
        visible: rawVariable?.visible ?? true,
        rules_engine: rawVariable?.rules_engine,
      };

      if (
        !variable.key ||
        !variable.rules_engine ||
        typeof variable.rules_engine === "boolean" ||
        !variable.rules_engine.enabled
      ) {
        return;
      }

      const generatedValue = generateClubVariableValue({
        variable,
        member,
        members: allMembersForRules,
      });

      if (!generatedValue?.value || generatedValue.missingTokens.length > 0) {
        return;
      }

      generatedValues[variable.key] = generatedValue.value;
    });

    return generatedValues;
  };

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
      label: "Awaiting payment",
      className: "border-orange-200 bg-orange-100 text-orange-800",
    };
  };

  const validateTemplateVariables = (member?: ClubMember): boolean => {
    if (
      !clubMembers?.template_variables ||
      !Array.isArray(clubMembers.template_variables)
    ) {
      return true;
    }

    if (member && !isTemplateVariableEntryUnlocked(member)) {
      setTemplateVariablesError("");
      return true;
    }

    const emptyFields = clubMembers.template_variables.filter(
      (variable: any) => {
        const varName = variable?.name || variable;
        const varTitle = variable?.title || variable;
        const value = templateVariables[varName];
        const hasRulesEngine = isRulesEngineTemplateVariable(
          variable?.rules_engine,
        );

        // "Member Name" has a default value so it's never empty
        if (varTitle === "Member Name" || hasRulesEngine) {
          return false;
        }

        return !value || (typeof value === "string" && value.trim() === "");
      },
    );

    if (emptyFields.length > 0) {
      setTemplateVariablesError("All email template fields are required.");
      return false;
    }

    setTemplateVariablesError("");
    return true;
  };

  const buildTemplateVariablesWithValues = (member: ClubMember) => {
    if (
      !clubMembers?.template_variables ||
      !Array.isArray(clubMembers.template_variables)
    ) {
      return [];
    }

    return clubMembers.template_variables.map((variable: any) => {
      const varName = variable?.name || variable;
      const varTitle = variable?.title || variable;
      const autoGenerated = isRulesEngineTemplateVariable(variable?.rules_engine);
      const value =
        varTitle === "Member Name"
          ? templateVariables[varName] ||
            member.member_first_name + " " + member.member_surname
          : templateVariables[varName];

      return {
        name: varName,
        value: value,
        auto_generated: autoGenerated,
      };
    });
  };

  const baseUnregisteredMembers = clubMembers?.unregistered || [];

  const [submittedSortAsc, setSubmittedSortAsc] = useState<boolean | null>(
    null,
  );
  const [memberNameSortAsc, setMemberNameSortAsc] = useState<boolean | null>(
    null,
  );
  const [totalFeeSortAsc, setTotalFeeSortAsc] = useState<boolean | null>(null);
  const [outstandingAmountSortAsc, setOutstandingAmountSortAsc] = useState<
    boolean | null
  >(null);

  const sortedUnregisteredMembers = useMemo(() => {
    let sortedCopy = [...baseUnregisteredMembers];

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
    } else if (outstandingAmountSortAsc !== null) {
      sortedCopy.sort((a: ClubMember, b: ClubMember) => {
        const aAmount = a.outstanding_amount || 0;
        const bAmount = b.outstanding_amount || 0;
        return outstandingAmountSortAsc ? aAmount - bAmount : bAmount - aAmount;
      });
    } else if (submittedSortAsc !== null) {
      sortedCopy.sort((a: ClubMember, b: ClubMember) => {
        const at = a?.registration_submitted_on
          ? new Date(a.registration_submitted_on).getTime()
          : 0;
        const bt = b?.registration_submitted_on
          ? new Date(b.registration_submitted_on).getTime()
          : 0;
        return submittedSortAsc ? at - bt : bt - at;
      });
    }

    return sortedCopy;
  }, [
    baseUnregisteredMembers,
    submittedSortAsc,
    memberNameSortAsc,
    totalFeeSortAsc,
    outstandingAmountSortAsc,
  ]);

  useEffect(() => {
    if (!openDialogUserId) {
      return;
    }

    const activeMember = baseUnregisteredMembers.find(
      (member: ClubMember) => member.user_id === openDialogUserId,
    );

    if (!activeMember) {
      return;
    }

    setTemplateVariables(buildGeneratedTemplateVariables(activeMember));
    setTemplateVariablesError("");
    setSelectedPaymentMethod("EFT/Cash");
    setIsTemplateVariablesOpen(true);
    setIsPaymentMethodsOpen(true);
  }, [openDialogUserId, baseUnregisteredMembers, allMembersForRules]);

  useEffect(() => {
    // Sync deregisterMembers with listActionItems
    // This ensures the deregister button enabled state matches the checkbox state
    const updatedDeregisterMembers = baseUnregisteredMembers
      .filter((member: ClubMember) =>
        listActionItems.some(
          (item) =>
            item.email === member.member_email &&
            item.name ===
              `${member.member_first_name} ${member.member_surname}`,
        ),
      )
      .map((member: ClubMember) => ({
        user_id: member.user_id,
        name: `${member.member_first_name} ${member.member_surname}`,
      }));
    setDeregisterMembers(updatedDeregisterMembers);
  }, [listActionItems, baseUnregisteredMembers]);

  const headerHeight = 48;
  const rowHeight = 60;
  const visibleRowCount = Math.min(
    baseUnregisteredMembers.length,
    showTenRows ? 10 : 5,
  );
  const tableViewportMaxHeight =
    visibleRowCount > 0
      ? headerHeight + visibleRowCount * rowHeight
      : undefined;
  const shouldScrollY = baseUnregisteredMembers.length > (showTenRows ? 10 : 5);

  return (
    <div className="flex flex-col gap-4">
      {showPendingSummary && (
        <div className="flex items-center gap-4 rounded-[20px] border border-slate-200 bg-slate-50/80 px-4 py-3">
          <div className="relative">
            <button
              type="button"
              onClick={() =>
                setShowPendingRegistrationsDropdown(
                  !showPendingRegistrationsDropdown,
                )
              }
              className="relative rounded-full border border-slate-200 bg-slate-50 p-2.5 transition-colors hover:bg-slate-100"
              title="Pending registrations"
            >
              <UserPlus className="h-4 w-4 text-slate-700" />
              {baseUnregisteredMembers.length > 0 && (
                <span className="absolute right-0 top-0 inline-flex -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-bold leading-none text-white">
                  {baseUnregisteredMembers.length}
                </span>
              )}
            </button>

            {showPendingRegistrationsDropdown && (
              <div className="absolute left-0 top-full z-50 mt-2 max-h-96 w-96 overflow-y-auto rounded-[22px] border border-slate-200 bg-white shadow-2xl">
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
                  <h3 className="font-semibold text-slate-900">
                    Pending Registrations ({baseUnregisteredMembers.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowPendingRegistrationsDropdown(false)}
                    className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {baseUnregisteredMembers.length === 0 ? (
                  <div className="p-5 text-center text-sm text-slate-500">
                    No pending registrations.
                  </div>
                ) : (
                  <div className="max-h-96 divide-y overflow-y-auto">
                    {sortedUnregisteredMembers.map((member: ClubMember) => (
                      <div
                        key={member.user_id}
                        className="p-4 transition-colors hover:bg-slate-50"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1 space-y-1">
                            <p className="text-sm font-medium text-slate-900">
                              {member.member_first_name} {member.member_surname}
                            </p>
                            <p className="text-xs text-slate-500">
                              Email: {member.member_email || "n/a"}
                            </p>
                            <p className="text-xs font-medium text-amber-700">
                              Outstanding:{" "}
                              {formatAmount(
                                member.outstanding_amount || 0,
                                club?.currency,
                              )}
                            </p>
                          </div>

                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 rounded-full border-slate-200 bg-white px-3 text-xs text-slate-700 hover:bg-slate-100"
                            onClick={() => {
                              setShowPendingRegistrationsDropdown(false);
                              setOpenDialogUserId(member.user_id);
                              setTemplateVariables(
                                buildGeneratedTemplateVariables(member),
                              );
                              setIsTemplateVariablesOpen(true);
                              setIsPaymentMethodsOpen(true);
                            }}
                          >
                            <UserPlus className="h-3.5 w-3.5" />
                            Review
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
            Pending registrations:{" "}
            <span className="font-bold">{baseUnregisteredMembers.length}</span>
          </h2>
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
                            setAllListActionItems(sortedUnregisteredMembers);
                          } else {
                            setlistActionItems([]);
                            setDeregisterMembers([]);
                            setAllMembersSelected(false);
                          }
                        }}
                        className="h-5 w-5 rounded-[6px] border-2 border-slate-400 bg-white shadow-sm transition-colors hover:border-slate-500 data-[state=checked]:border-slate-600 data-[state=checked]:bg-slate-600 data-[state=checked]:text-white"
                      />
                      <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 rounded-full p-0 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-48 rounded-[18px] border-slate-200"
                        >
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
                              setIsDeregisterDialogOpen(true);
                            }}
                            disabled={!deregisterMembers.length}
                            className="text-red-600"
                          >
                            Deregister Members
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableHead>
                  <TableHead className="h-11 w-[190px] text-center text-xs text-slate-200">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 hover:underline w-full justify-center"
                      onClick={() => {
                        setMemberNameSortAsc((prev) =>
                          prev === null ? true : !prev,
                        );
                        setSubmittedSortAsc(null);
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
                  <TableHead className="h-11 w-[150px] text-center text-xs text-slate-200">
                    Email
                  </TableHead>
                  <TableHead className="h-11 w-[150px] text-center text-xs text-slate-200">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 hover:underline w-full justify-center"
                      onClick={() => {
                        setOutstandingAmountSortAsc((prev) =>
                          prev === null ? true : !prev,
                        );
                        setSubmittedSortAsc(null);
                        setMemberNameSortAsc(null);
                        setTotalFeeSortAsc(null);
                      }}
                      title="Toggle sort by registration payment summary"
                    >
                      Registration Payment
                      {outstandingAmountSortAsc === null ? (
                        <ChevronsUpDown className="h-3 w-3 opacity-60" />
                      ) : (
                        <span className="text-xs">
                          {outstandingAmountSortAsc ? "▲" : "▼"}
                        </span>
                      )}
                    </button>
                  </TableHead>
                  <TableHead className="h-11 w-[150px] text-center text-xs text-slate-200">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 hover:underline w-full justify-center"
                      onClick={() => {
                        setSubmittedSortAsc((prev) =>
                          prev === null ? true : !prev,
                        );
                        setMemberNameSortAsc(null);
                        setTotalFeeSortAsc(null);
                      }}
                      title="Toggle sort by Registration Submitted On"
                    >
                      Registration Submitted
                      {submittedSortAsc === null ? (
                        <ChevronsUpDown className="h-3 w-3 opacity-60" />
                      ) : (
                        <span className="text-xs">
                          {submittedSortAsc ? "▲" : "▼"}
                        </span>
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
                {baseUnregisteredMembers.length ? (
                  sortedUnregisteredMembers.map((member: ClubMember) => (
                    <Fragment key={member.user_id}>
                      <TableRow
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
                          <div
                            className="flex justify-center"
                            onClick={(e) => e.stopPropagation()}
                          >
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
                                    ...deregisterMembers,
                                    {
                                      user_id: member.user_id,
                                      name: `${member.member_first_name} ${member.member_surname}`,
                                    },
                                  ];
                                  setDeregisterMembers(
                                    updatedDeregisterMembers,
                                  );

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
                                    baseUnregisteredMembers.length
                                  ) {
                                    setAllMembersSelected(true);
                                  }
                                } else {
                                  const updatedDeregisterMembers =
                                    deregisterMembers.filter(
                                      (item) => item.user_id !== member.user_id,
                                    );
                                  setDeregisterMembers(
                                    updatedDeregisterMembers,
                                  );

                                  const updatedList = listActionItems.filter(
                                    (item) =>
                                      item.email !== member.member_email,
                                  );
                                  setlistActionItems(updatedList);
                                  setAllMembersSelected(false);
                                }
                              }}
                              className="h-5 w-5 rounded-[6px] border-2 border-slate-300 bg-white shadow-sm transition-colors hover:border-slate-500 data-[state=checked]:border-slate-600 data-[state=checked]:bg-slate-600 data-[state=checked]:text-white"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="w-[150px] text-center text-sm font-medium text-slate-900">
                          <span className="underline decoration-slate-400 underline-offset-2">
                            {member.member_first_name +
                              " " +
                              member.member_surname}
                          </span>
                        </TableCell>
                        <TableCell className="w-[150px] text-center text-sm text-slate-800">
                          {member.member_email === "n/a" ? (
                            <span className="text-gray-400">n/a</span>
                          ) : (
                            member.member_email
                          )}
                        </TableCell>
                        <TableCell className="w-[190px] text-center">
                          {(() => {
                            const paymentStatus =
                              getRegistrationPaymentStatus(member);
                            const totalFee = member.total_fee || 0;
                            const outstandingAmount =
                              member.outstanding_amount || 0;
                            const amountPaid = Math.max(
                              totalFee - outstandingAmount,
                              0,
                            );

                            if (!totalFee) {
                              return <span className="text-gray-400">n/a</span>;
                            }

                            return (
                              <div className="flex flex-col items-center gap-2 text-center">
                                <Badge className={paymentStatus.className}>
                                  {paymentStatus.label}
                                </Badge>
                                <p className="text-sm font-medium text-slate-900">
                                  {formatAmount(amountPaid, club?.currency)} of{" "}
                                  {formatAmount(totalFee, club?.currency)}
                                </p>
                              </div>
                            );
                          })()}
                        </TableCell>
                        <TableCell className="w-[150px] text-center text-sm text-slate-800">
                          {member.registration_submitted_on
                            ? new Date(
                                member.registration_submitted_on,
                              ).toLocaleString()
                            : "-"}
                        </TableCell>
                        {clubMembers?.filters
                          ?.filter((col: any) =>
                            activeColumnKeys.includes(col.key),
                          )
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
                                ? formatAmount(
                                    customField?.value,
                                    club?.currency,
                                  )
                                : "N/A";
                            }

                            if (column.type === "standard") {
                              const standardFields = Array.isArray(
                                member.meta_standard,
                              )
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
                              const clubVariableKey = column.key?.startsWith(
                                "club_variable:",
                              )
                                ? column.key.replace("club_variable:", "")
                                : column.field_id || column.field_name;
                              const clubVariables = Array.isArray(
                                member.meta_club_variables,
                              )
                                ? member.meta_club_variables
                                : Object.values(
                                    member.meta_club_variables ?? {},
                                  );
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
                      <Dialog
                        open={openDialogUserId === member.user_id}
                        onOpenChange={(open) => {
                          reset();
                          setOpenDialogUserId(open ? member.user_id : null);
                          setMemberRegisterAmount(0);
                          if (open) {
                            setTemplateVariables({
                              member_name:
                                member.member_first_name +
                                " " +
                                member.member_surname,
                            });
                            setIsTemplateVariablesOpen(true);
                            setIsPaymentMethodsOpen(true);
                          } else {
                            setTemplateVariables({});
                            setSelectedPaymentMethod("EFT/Cash");
                            setTemplateVariablesError("");
                            setIsTemplateVariablesOpen(true);
                            setIsPaymentMethodsOpen(true);
                          }
                        }}
                      >
                        <DialogContent onClick={(e) => e.stopPropagation()}>
                          <DialogHeader>
                            <DialogTitle>
                              Register Member:{" "}
                              <strong>
                                {member.member_first_name +
                                  " " +
                                  member.member_surname}
                              </strong>
                            </DialogTitle>
                            <DialogDescription>
                              Confirm payment details and provide required
                              information
                            </DialogDescription>
                            <div className="flex flex-col gap-1 my-4">
                              <Label className="text-l">
                                Outstanding amount:{" "}
                                {member.outstanding_amount ? (
                                  formatAmount(
                                    member.outstanding_amount,
                                    club?.currency,
                                  )
                                ) : (
                                  <span className="text-gray-400">n/a</span>
                                )}
                              </Label>
                              <Label className="text-l">
                                Member payment reference:{" "}
                                {member.registration_payment_reference}
                              </Label>
                            </div>
                            {member.outstanding_amount > 0 && (
                              <div className="grid gap-3 my-4">
                                <Label htmlFor="pay">Payment Amount</Label>
                                <Input
                                  id="pay"
                                  type="text"
                                  placeholder="Enter amount"
                                  value={displayAmount}
                                  onChange={handleFormattedInputChange}
                                />
                              </div>
                            )}
                            {clubMembers?.payment_methods &&
                              member.outstanding_amount > 0 &&
                              clubMembers.payment_methods.length > 0 && (
                                <div className="grid gap-4 pt-2">
                                  <div>
                                    <button
                                      onClick={() =>
                                        setIsPaymentMethodsOpen(
                                          !isPaymentMethodsOpen,
                                        )
                                      }
                                      className="flex items-center justify-between w-full p-3 bg-muted/40 rounded-lg hover:bg-muted/50 transition-colors"
                                    >
                                      <Label className="text-sm font-semibold mb-0 cursor-pointer">
                                        Payment Method
                                      </Label>
                                      <ChevronDown
                                        className={`h-4 w-4 transition-transform ${
                                          isPaymentMethodsOpen
                                            ? "rotate-180"
                                            : ""
                                        }`}
                                      />
                                    </button>
                                    {isPaymentMethodsOpen && (
                                      <div className="space-y-3 bg-muted/40 p-4 rounded-lg mt-2">
                                        {clubMembers.payment_methods.map(
                                          (method: string) => (
                                            <div
                                              key={method}
                                              className="flex items-center gap-3"
                                            >
                                              <Checkbox
                                                id={`payment-${method}`}
                                                checked={
                                                  selectedPaymentMethod ===
                                                  method
                                                }
                                                onCheckedChange={(checked) => {
                                                  setSelectedPaymentMethod(
                                                    checked ? method : "",
                                                  );
                                                }}
                                              />
                                              <Label
                                                htmlFor={`payment-${method}`}
                                                className="cursor-pointer font-normal text-sm"
                                              >
                                                {method}
                                              </Label>
                                            </div>
                                          ),
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            {clubMembers?.template_variables &&
                              Array.isArray(clubMembers.template_variables) &&
                              clubMembers.template_variables.length > 0 && (
                                <div className="grid gap-4 pt-2">
                                  <div>
                                    {isTemplateVariableEntryUnlocked(member) ? (
                                      <>
                                        <button
                                          onClick={() =>
                                            setIsTemplateVariablesOpen(
                                              !isTemplateVariablesOpen,
                                            )
                                          }
                                          className="flex items-center justify-between w-full p-3 bg-muted/40 rounded-lg hover:bg-muted/50 transition-colors"
                                        >
                                          <Label className="text-sm font-semibold mb-0 cursor-pointer">
                                            Club tags
                                          </Label>
                                          <ChevronDown
                                            className={`h-4 w-4 transition-transform ${
                                              isTemplateVariablesOpen
                                                ? "rotate-180"
                                                : ""
                                            }`}
                                          />
                                        </button>
                                        {isTemplateVariablesOpen && (
                                          <div className="space-y-3 bg-muted/40 p-4 rounded-lg mt-2">
                                            {[...clubMembers.template_variables]
                                              .sort((left: any, right: any) => {
                                                const leftAutoGenerated = isRulesEngineTemplateVariable(
                                                  left?.rules_engine,
                                                );
                                                const rightAutoGenerated = isRulesEngineTemplateVariable(
                                                  right?.rules_engine,
                                                );

                                                if (leftAutoGenerated === rightAutoGenerated) {
                                                  return 0;
                                                }

                                                return leftAutoGenerated ? 1 : -1;
                                              })
                                              .map(
                                              (variable: any) => {
                                                const varName =
                                                  variable?.name || variable;
                                                const varTitle =
                                                  variable?.title || variable;
                                                const isMemberNameField =
                                                  varTitle === "Member Name";
                                                const hasRulesEngine =
                                                  isRulesEngineTemplateVariable(
                                                    variable?.rules_engine,
                                                  );

                                                return (
                                                  <div key={varName} className="grid gap-2">
                                                    <div className="flex items-center gap-2">
                                                      <Label
                                                        htmlFor={`template-${varName}`}
                                                        className="text-sm font-normal"
                                                      >
                                                        {varTitle}
                                                      </Label>
                                                      {hasRulesEngine ? (
                                                        <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-sky-700">
                                                          Auto generated tag
                                                        </span>
                                                      ) : null}
                                                    </div>
                                                    {hasRulesEngine ? <></> : (
                                                      <Input
                                                        id={`template-${varName}`}
                                                        type="text"
                                                        placeholder={`Enter ${
                                                          varTitle?.toLowerCase?.() || ""
                                                        }`}
                                                        value={
                                                          isMemberNameField
                                                            ? templateVariables[varName] ||
                                                              member.member_first_name +
                                                                " " +
                                                                member.member_surname
                                                            : templateVariables[varName] || ""
                                                        }
                                                        onChange={(e) => {
                                                          setTemplateVariables((prev) => ({
                                                            ...prev,
                                                            [varName]: e.target.value,
                                                          }));
                                                          setTemplateVariablesError("");
                                                        }}
                                                        className=""
                                                      />
                                                    )}
                                                  </div>
                                                );
                                              },
                                            )}
                                          </div>
                                        )}
                                      </>
                                    ) : (
                                      <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-3 text-amber-950">
                                        <p className="text-sm font-medium">
                                          Club tags unlock once the full outstanding amount is entered.
                                        </p>
                                        <p className="mt-1 text-xs text-amber-800">
                                          Enter {formatAmount(member.outstanding_amount || 0, club?.currency)} as the payment amount to unlock and require these fields.
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            {isError && (
                              <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription className="text-xs">
                                  Something went wrong registering user
                                </AlertDescription>
                              </Alert>
                            )}
                          </DialogHeader>
                          <DialogFooter>
                            <DialogClose asChild>
                              <Button variant="outline">Cancel</Button>
                            </DialogClose>
                            <Button
                              onClick={() => {
                                if (!validateTemplateVariables(member)) {
                                  setIsTemplateVariablesOpen(true);
                                } else {
                                  const structuredTemplateVariables =
                                    isTemplateVariableEntryUnlocked(member)
                                      ? buildTemplateVariablesWithValues(member)
                                      : undefined;
                                  registerUser(
                                    member,
                                    selectedPaymentMethod,
                                    structuredTemplateVariables,
                                  );
                                }
                              }}
                              disabled={isPending}
                            >
                              {isPending ? "Registering..." : "Register Member"}
                            </Button>
                          </DialogFooter>
                          {templateVariablesError && (
                            <Alert className="border border-red-600 text-red-600">
                              <AlertCircle className="h-4 w-4 text-red-600" />
                              <AlertDescription className="text-xs text-red-600">
                                {templateVariablesError}
                              </AlertDescription>
                            </Alert>
                          )}
                          {invalidRegistrationAmount && (
                            <Alert className="border border-red-600 text-red-600">
                              <AlertCircle className="h-4 w-4 text-red-600" />
                              <AlertDescription className="text-xs text-red-600">
                                The amount entered cannot be less than{" "}
                                {formatAmount(1, club?.currency)} and more than
                                the outstanding amount.
                              </AlertDescription>
                            </Alert>
                          )}
                        </DialogContent>
                      </Dialog>
                    </Fragment>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6 + activeColumnKeys.length}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No pending registrations found.
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
        itemsList={deregisterMembers.map((member) => {
          const fullMember = sortedUnregisteredMembers.find(
            (m) => m.user_id === member.user_id,
          );
          return {
            id: member.user_id,
            name: member.name,
            total_fee: fullMember?.total_fee,
            total_outstanding_amount: fullMember?.outstanding_amount,
          };
        })}
        clubId={clubId}
        userIds={deregisterMembers.map((member) => member.user_id)}
        currency={club?.currency}
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
    </div>
  );
}
