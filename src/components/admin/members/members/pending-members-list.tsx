import { DndContext, closestCenter } from "@dnd-kit/core";
import { useEffect, useMemo, useState } from "react";
import { ChevronsUpDown, ChevronDown } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
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
import ReusableDeregisterDialog from "./features/reusable-deregister-dialog";
import ReusableSendEmailDialog from "./features/reusable-send-email-dialog";

interface ImageProps {
  club: Club | null;
  sensors: any;
  sortableId: any;
  openDialogUserId: string | null;
  displayAmount: string;
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
  reset: () => void;
  handleFormattedInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  registerUser: (
    member: ClubMember,
    paymentMethod?: string,
    templateVariables?: Array<{ name: string; value: string }>,
  ) => void;
  setSelectedMember: React.Dispatch<React.SetStateAction<object>>;
  setOpenDialogUserId: React.Dispatch<React.SetStateAction<string | null>>;
  setlistActionItems: React.Dispatch<
    React.SetStateAction<{ email: string; name: string }[]>
  >;
  setMemberRegisterAmount: React.Dispatch<React.SetStateAction<number>>;
  setUnregisteredMembersLength: React.Dispatch<React.SetStateAction<number>>;
  setAllListActionItems: (members: ClubMember[]) => void;
  setAllMembersSelected: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function PendingMembersList({
  club,
  sensors,
  sortableId,
  openDialogUserId,
  displayAmount,
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
  registerUser,
  setSelectedMember,
  setlistActionItems,
  setOpenDialogUserId,
  setAllMembersSelected,
  setMemberRegisterAmount,
  setUnregisteredMembersLength,
  setAllListActionItems,
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
  const [deregisterMembers, setDeregisterMembers] = useState<
    { user_id: string; name: string }[]
  >([]);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);

  const validateTemplateVariables = (): boolean => {
    if (
      !clubMembers?.template_variables ||
      !Array.isArray(clubMembers.template_variables)
    ) {
      return true;
    }

    const emptyFields = clubMembers.template_variables.filter(
      (variable: any) => {
        const varName = variable?.name || variable;
        const varTitle = variable?.title || variable;
        const value = templateVariables[varName];

        // "Member Name" has a default value so it's never empty
        if (varTitle === "Member Name") {
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
      const value =
        varTitle === "Member Name"
          ? templateVariables[varName] ||
            member.member_first_name + " " + member.member_surname
          : templateVariables[varName];

      return {
        name: varName,
        value: value,
      };
    });
  };

  // Use raw clubMembers.unregistered - backend already handles pagination and member_name/member_id filtering
  const baseUnregisteredMembers = clubMembers?.unregistered || [];

  const [submittedSortAsc, setSubmittedSortAsc] = useState<boolean | null>(
    null,
  );

  const sortedUnregisteredMembers = useMemo(() => {
    if (submittedSortAsc === null) return baseUnregisteredMembers;
    const copy = [...baseUnregisteredMembers];
    copy.sort((a: ClubMember, b: ClubMember) => {
      const at = a?.registration_submitted_on
        ? new Date(a.registration_submitted_on).getTime()
        : 0;
      const bt = b?.registration_submitted_on
        ? new Date(b.registration_submitted_on).getTime()
        : 0;
      return submittedSortAsc ? at - bt : bt - at;
    });
    return copy;
  }, [baseUnregisteredMembers, submittedSortAsc]);

  useEffect(() => {
    setUnregisteredMembersLength(baseUnregisteredMembers.length);
  }, [baseUnregisteredMembers, setUnregisteredMembersLength]);

  useEffect(() => {
    // Sync deregisterMembers with listActionItems
    // This ensures the deregister button enabled state matches the checkbox state
    const updatedDeregisterMembers = baseUnregisteredMembers
      .filter((member: ClubMember) =>
        listActionItems.some(
          (item) =>
            item.email === member.member_email &&
            item.name === `${member.member_first_name} ${member.member_surname}`,
        ),
      )
      .map((member: ClubMember) => ({
        user_id: member.user_id,
        name: `${member.member_first_name} ${member.member_surname}`,
      }));
    setDeregisterMembers(updatedDeregisterMembers);
  }, [listActionItems, baseUnregisteredMembers]);

  return (
    <div className="flex flex-col gap-4">
      <div
        className={`rounded-lg border w-full overflow-hidden max-w-[79vw] ${
          baseUnregisteredMembers.length > 10
            ? "max-h-[600px] flex flex-col"
            : ""
        }`}
      >
        <div
          className={`overflow-y-auto overflow-x-auto flex-1 ${
            baseUnregisteredMembers.length > 10 ? "" : ""
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
                    <div className="flex justify-center items-center border rounded-[10px] pl-3 pr-1 border-gray-300 border-1 w-fit mx-auto hover:border-gray-400 transition-colors">
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
                        setSubmittedSortAsc((prev) =>
                          prev === null ? true : !prev,
                        )
                      }
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
                  <TableHead className="text-center w-[150px]">
                    Outstanding Reg. Amount
                  </TableHead>
                  <TableHead className="text-center w-[150px]">
                    Register Member
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
                {baseUnregisteredMembers.length ? (
                  sortedUnregisteredMembers.map((member: ClubMember) => (
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
                                  ...deregisterMembers,
                                  {
                                    user_id: member.user_id,
                                    name: `${member.member_first_name} ${member.member_surname}`,
                                  },
                                ];
                                setDeregisterMembers(updatedDeregisterMembers);

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
                                setDeregisterMembers(updatedDeregisterMembers);

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
                          {member.member_first_name +
                            " " +
                            member.member_surname}
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
                        {member.registration_submitted_on
                          ? new Date(
                              member.registration_submitted_on,
                            ).toLocaleString()
                          : "-"}
                      </TableCell>
                      <TableCell className="text-center w-[150px]">
                        {formatAmount(
                          member.outstanding_amount,
                          club?.currency,
                        )}
                      </TableCell>
                      <TableCell className="text-center w-[150px]">
                        <div className="flex justify-center gap-2">
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
                            <div className="flex justify-center items-center">
                              <Button
                                variant="ghost"
                                className="border border-black hover:bg-gray-100 hover:text-black"
                                onClick={() => {
                                  setOpenDialogUserId(member.user_id);
                                }}
                              >
                                Register
                              </Button>
                            </div>
                            <DialogContent>
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
                                    {formatAmount(
                                      member.outstanding_amount,
                                      club?.currency,
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
                                                    onCheckedChange={(
                                                      checked,
                                                    ) => {
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
                                  Array.isArray(
                                    clubMembers.template_variables,
                                  ) &&
                                  clubMembers.template_variables.length > 0 && (
                                    <div className="grid gap-4 pt-2">
                                      <div>
                                        <button
                                          onClick={() =>
                                            setIsTemplateVariablesOpen(
                                              !isTemplateVariablesOpen,
                                            )
                                          }
                                          className="flex items-center justify-between w-full p-3 bg-muted/40 rounded-lg hover:bg-muted/50 transition-colors"
                                        >
                                          <Label className="text-sm font-semibold mb-0 cursor-pointer">
                                            Email Template Fields
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
                                            {clubMembers.template_variables.map(
                                              (variable: any) => {
                                                const varName =
                                                  variable?.name || variable;
                                                const varTitle =
                                                  variable?.title || variable;
                                                const isMemberNameField =
                                                  varTitle === "Member Name";

                                                return (
                                                  <div
                                                    key={varName}
                                                    className="grid gap-2"
                                                  >
                                                    <Label
                                                      htmlFor={`template-${varName}`}
                                                      className="text-sm font-normal"
                                                    >
                                                      {varTitle}
                                                    </Label>
                                                    <Input
                                                      id={`template-${varName}`}
                                                      type="text"
                                                      placeholder={`Enter ${
                                                        varTitle?.toLowerCase?.() ||
                                                        ""
                                                      }`}
                                                      value={
                                                        isMemberNameField
                                                          ? templateVariables[
                                                              varName
                                                            ] ||
                                                            member.member_first_name +
                                                              " " +
                                                              member.member_surname
                                                          : templateVariables[
                                                              varName
                                                            ] || ""
                                                      }
                                                      onChange={(e) => {
                                                        setTemplateVariables(
                                                          (prev) => ({
                                                            ...prev,
                                                            [varName]:
                                                              e.target.value,
                                                          }),
                                                        );
                                                        setTemplateVariablesError(
                                                          "",
                                                        );
                                                      }}
                                                      className=""
                                                    />
                                                  </div>
                                                );
                                              },
                                            )}
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
                                    if (!validateTemplateVariables()) {
                                      setIsTemplateVariablesOpen(true);
                                    } else {
                                      const structuredTemplateVariables =
                                        buildTemplateVariablesWithValues(
                                          member,
                                        );
                                      registerUser(
                                        member,
                                        selectedPaymentMethod,
                                        structuredTemplateVariables,
                                      );
                                    }
                                  }}
                                  disabled={isPending}
                                >
                                  {isPending
                                    ? "Registering..."
                                    : "Register Member"}
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
                                    {formatAmount(1, club?.currency)} and more
                                    than the outstanding amount.
                                  </AlertDescription>
                                </Alert>
                              )}
                            </DialogContent>
                          </Dialog>
                          {/* {member.resubmission_required && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-full border border-black hover:bg-gray-100 hover:text-black"
                                onClick={() => {
                                  setSelectedMemberToRemove(member);
                                  setOpenRemoveDialog(true);
                                }}
                              >
                                <Trash2 className="h-6 w-6" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Remove member</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )} */}
                        </div>
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
                              {columnValue}
                            </TableCell>
                          );
                        })}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6 + (activeColumnKeys?.length ?? 0)}
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
      </div>

      <ReusableDeregisterDialog
        isOpen={isDeregisterDialogOpen}
        onOpenChange={setIsDeregisterDialogOpen}
        title="Deregister Members"
        description="Members to deregister"
        itemsList={deregisterMembers.map((member) => ({
          id: member.user_id,
          name: member.name,
        }))}
        clubId={clubId}
        userIds={deregisterMembers.map((member) => member.user_id)}
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
