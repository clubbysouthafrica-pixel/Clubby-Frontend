import React, { useContext, useEffect, useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useFetchClubMembers } from "@/queries/admin/club-members";
import { ClubContext, ClubContextType } from "@/context/ClubContext";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { ClubMember } from "@/interfaces/club";
import { useRegisterUserToClubMutation } from "@/mutations/admin/member";
import RegistrationDialog from "@/components/admin/registrations/features/registration-dialog";
import { formatAmount } from "@/data/currencies";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import RegisteredMembersList from "@/components/admin/registrations/active-registrations";
import PendingMembersList from "@/components/admin/registrations/pending-registrations";
import PreviousMembersList from "@/components/admin/registrations/previous-registrations";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  ChevronDown,
  Loader2,
  X,
  Download,
  AlertCircle,
} from "lucide-react";
import { exportTableData } from "@/helpers/admin/members/csv-export";

type AvailableDynamicFilter = {
  key: string;
  field_id?: string;
  field_name: string;
  type: string;
  options?: string[];
};

type DynamicFilterValue = string | { operator?: string; value?: string };


export default function RegistrationsPage() {
  const { club, isLoading: clubLoading } = useContext(
    ClubContext,
  ) as ClubContextType;
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [requestedKeys, setRequestedKeys] = useState<string[]>([]);
  const initialTab = searchParams.get("tab");
  const [selectedTab, setSelectedTab] = useState(
    initialTab === "pending-members" ||
      initialTab === "previous-members" ||
      initialTab === "registered-members"
      ? initialTab
      : "pending-members",
  );
  const handleTabChange = (value: string) => {
    setPageToken(undefined);
    setFilterLoading(true);
    isLoadingMoreRef.current = false;
    setIsLoadingMore(false);
    setRequestedKeys([]);
    setSelectedTab(value);
    setHashUserId(null);
    setlistActionItems([]);
    setDeregisterMembers([]);
    setAllMembersSelected(false);
    setSelectedMember({});
    setSearchParams({ tab: value });
    setMemberNameFilter("");
    setMemberIdFilter("");
    setAppliedMemberNameFilter("");
    setAppliedMemberIdFilter("");
    setDynamicFilters({});
    setFilterConditions({});
    setAppliedCustomFilters([]);
    setActiveFilterKeys([]);
    setActiveColumnKeysRegistered([]);
    setActiveColumnKeysPending([]);
    setActiveColumnKeysPrevious([]);
  };

  const [memberLimit, setMemberLimit] = useState(100);
  const [pageToken, setPageToken] = useState<string | undefined>(undefined);
  const [allRegisteredMembers, setAllRegisteredMembers] = useState<
    ClubMember[]
  >([]);
  const [allUnregisteredMembers, setAllUnregisteredMembers] = useState<
    ClubMember[]
  >([]);
  const [allDeregisteredMembers, setAllDeregisteredMembers] = useState<
    ClubMember[]
  >([]);
  const [allFilters, setAllFilters] = useState<AvailableDynamicFilter[] | null>(
    null,
  );
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [memberNameFilter, setMemberNameFilter] = useState("");
  const [memberIdFilter, setMemberIdFilter] = useState("");
  const [appliedMemberNameFilter, setAppliedMemberNameFilter] = useState("");
  const [appliedMemberIdFilter, setAppliedMemberIdFilter] = useState("");
  const [dynamicFilters, setDynamicFilters] = useState<
    Record<string, DynamicFilterValue>
  >({});
  const [filterConditions, setFilterConditions] = useState<
    Record<string, string>
  >({});
  const [appliedCustomFilters, setAppliedCustomFilters] = useState<
    Array<{
      field_id: string;
      type: string;
      input_type: string;
      value: string;
      condition?: string;
    }>
  >([]);
  const [computedCustomFilters, setComputedCustomFilters] = useState<
    Array<{
      field_id: string;
      type: string;
      input_type: string;
      value: string;
      condition?: string;
    }>
  >([]);
  const [showArchived, setShowArchived] = useState<boolean>(false);
  const isLoadingMoreRef = useRef(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const getMemberType = (tab: string): string => {
    switch (tab) {
      case "registered-members":
        return "registered";
      case "pending-members":
        return "pending";
      case "previous-members":
        return "previous";
      default:
        return "registered";
    }
  };

  useEffect(() => {
    const requestedTab = searchParams.get("tab");

    if (
      requestedTab &&
      ["registered-members", "pending-members", "previous-members"].includes(
        requestedTab,
      ) &&
      requestedTab !== selectedTab
    ) {
      setSelectedTab(requestedTab);
    }
  }, [searchParams, selectedTab]);

  const {
    data: clubMembers,
    isLoading: clubMembersLoading,
    refetch: refetchClubMembers,
    error: clubMembersError,
  } = useFetchClubMembers(
    club?.club_account_id as string,
    requestedKeys.length > 0 ? requestedKeys : undefined,
    getMemberType(selectedTab),
    memberLimit,
    pageToken,
    appliedMemberNameFilter,
    appliedMemberIdFilter,
    appliedCustomFilters.length > 0 ? appliedCustomFilters : undefined,
    undefined,
    selectedTab === "previous-members" ? showArchived : undefined,
  );

  const { mutate, isPending, isSuccess, isError, reset } =
    useRegisterUserToClubMutation();
  const [listActionItems, setlistActionItems] = useState<
    { email: string; name: string }[]
  >([]);
  const [allMembersSelected, setAllMembersSelected] = useState(false);
  const [openDialogUserId, setOpenDialogUserId] = useState<string | null>(null);
  const [dereigsterMembers, setDeregisterMembers] = useState<
    { user_id: string; name: string }[]
  >([]);
  const [hashUserId, setHashUserId] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState({});
  const [memberRegisterAmount, setMemberRegisterAmount] = useState<number>(0);
  const [displayAmount, setDisplayAmount] = useState<string>(
    formatAmount(0, club?.currency),
  );
  const [invalidRegistrationAmount, setInvalidRegistrationAmount] =
    useState(false);
  const [filterLoading, setFilterLoading] = useState(true);

  const [isReturningToMembersTable, setIsReturningToMembersTable] =
    useState(false);

  const [availableDynamicFilters, setAvailableDynamicFilters] = useState<
    AvailableDynamicFilter[]
  >([]);
  const [activeFilterKeys, setActiveFilterKeys] = useState<string[]>([]);
  const [filtersDropdownOpen, setFiltersDropdownOpen] = useState(false);
  const [tempFilterKeys, setTempFilterKeys] = useState<string[]>([]);
  const [columnsDropdownOpen, setColumnsDropdownOpen] = useState(false);
  const [templateVariables, setTemplateVariables] = useState<
    Array<{ name: string; value: string }>
  >([]);
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);

  useEffect(() => {
    const memberIdFromQuery = searchParams.get("memberId")?.trim() ?? "";
    const registrationIdFromQuery =
      searchParams.get("registrationId")?.trim() ?? "";

    if (!memberIdFromQuery) {
      return;
    }

    const membersForSelectedTab =
      selectedTab === "registered-members"
        ? allRegisteredMembers
        : selectedTab === "pending-members"
          ? allUnregisteredMembers
          : allDeregisteredMembers;

    if (!membersForSelectedTab.length) {
      return;
    }

    const matchedMember = membersForSelectedTab.find(
      (member) => member.user_id === memberIdFromQuery,
    );

    if (!matchedMember) {
      return;
    }

    const nextSelectedMember = registrationIdFromQuery
      ? { ...matchedMember, registration_id: registrationIdFromQuery }
      : matchedMember;

    const selectedMemberUserId =
      selectedMember &&
      typeof selectedMember === "object" &&
      "user_id" in selectedMember &&
      typeof (selectedMember as ClubMember).user_id === "string"
        ? (selectedMember as ClubMember).user_id
        : null;
    const selectedMemberRegistrationId =
      selectedMember &&
      typeof selectedMember === "object" &&
      "registration_id" in selectedMember &&
      typeof (selectedMember as ClubMember).registration_id === "string"
        ? (selectedMember as ClubMember).registration_id
        : undefined;

    if (
      selectedMemberUserId === memberIdFromQuery &&
      selectedMemberRegistrationId === (registrationIdFromQuery || undefined) &&
      hashUserId === memberIdFromQuery
    ) {
      return;
    }

    setSelectedMember(nextSelectedMember);
    setHashUserId(memberIdFromQuery);
  }, [
    allDeregisteredMembers,
    allRegisteredMembers,
    allUnregisteredMembers,
    hashUserId,
    searchParams,
    selectedMember,
    selectedTab,
  ]);

  const [activeColumnKeysRegistered, setActiveColumnKeysRegistered] = useState<
    string[]
  >([]);
  const [appliedColumnKeysRegistered, setAppliedColumnKeysRegistered] =
    useState<string[]>([]);
  const [displayedColumnKeysRegistered, setDisplayedColumnKeysRegistered] =
    useState<string[]>([]);

  const [activeColumnKeysPending, setActiveColumnKeysPending] = useState<
    string[]
  >([]);
  const [appliedColumnKeysPending, setAppliedColumnKeysPending] = useState<
    string[]
  >([]);
  const [displayedColumnKeysPending, setDisplayedColumnKeysPending] = useState<
    string[]
  >([]);

  const [activeColumnKeysPrevious, setActiveColumnKeysPrevious] = useState<
    string[]
  >([]);
  const [appliedColumnKeysPrevious, setAppliedColumnKeysPrevious] = useState<
    string[]
  >([]);
  const [displayedColumnKeysPrevious, setDisplayedColumnKeysPrevious] =
    useState<string[]>([]);


  const handleFormattedInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setInvalidRegistrationAmount(false);
    const inputValue = e.target.value.replace(/[^\d]/g, "");
    const numericValue = parseInt(inputValue || "0", 10);

    setMemberRegisterAmount(numericValue);
    setDisplayAmount(formatAmount(numericValue, club?.currency));
  };

  const sortableId = React.useId();

  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {}),
  );
  const setAllListActionItems = (members: ClubMember[]) => {
    // Directly set the items without toggle logic
    const allMembers = members.map((member: ClubMember) => {
      return {
        email: member.member_email as string,
        name: `${member.member_first_name} ${member.member_surname}`,
        email_opt_in: member.email_opt_in,
      };
    });
    const allDeregisterMembers = members.map((member: ClubMember) => {
      return {
        user_id: member.user_id,
        name: `${member.member_first_name} ${member.member_surname}`,
      };
    });
    setlistActionItems(allMembers);
    setAllMembersSelected(true);
    setDeregisterMembers(allDeregisterMembers);
  };

  useEffect(() => {
    if (clubMembersError) {
      // Handle API errors
      const errorMessage =
        clubMembersError instanceof Error
          ? clubMembersError.message
          : "Failed to load members. Please try again.";
      setFetchError(errorMessage);
      isLoadingMoreRef.current = false;
      setIsLoadingMore(false);
      setFilterLoading(false);
    } else if (clubMembers) {
      setFetchError(null);
      const memberType = getMemberType(selectedTab);
      const members = clubMembers.members || [];

      if (isLoadingMoreRef.current) {
        // Append new data when loading more
        if (memberType === "registered") {
          setAllRegisteredMembers((prev) => [...prev, ...members]);
        } else if (memberType === "pending") {
          setAllUnregisteredMembers((prev) => [...prev, ...members]);
        } else if (memberType === "previous") {
          setAllDeregisteredMembers((prev) => [...prev, ...members]);
        }
        isLoadingMoreRef.current = false;
        setIsLoadingMore(false);
      } else {
        // Replace data when starting fresh (filters changed, tab changed, etc)
        if (memberType === "registered") {
          setAllRegisteredMembers(members);
        } else if (memberType === "pending") {
          setAllUnregisteredMembers(members);
        } else if (memberType === "previous") {
          setAllDeregisteredMembers(members);
        }

        if (memberType === "registered") {
          setDisplayedColumnKeysRegistered(appliedColumnKeysRegistered);
        } else if (memberType === "pending") {
          setDisplayedColumnKeysPending(appliedColumnKeysPending);
        } else if (memberType === "previous") {
          setDisplayedColumnKeysPrevious(appliedColumnKeysPrevious);
        }
        setAllFilters(clubMembers.filters || null);
        setTemplateVariables(clubMembers.template_variables || []);
        setPaymentMethods(clubMembers.payment_methods || []);
        setIsLoadingMore(false);
      }
      setFilterLoading(false);
    }
  }, [
    appliedColumnKeysPending,
    appliedColumnKeysPrevious,
    appliedColumnKeysRegistered,
    clubMembers,
    clubMembersError,
    selectedTab,
  ]);

  useEffect(() => {
    if (
      allRegisteredMembers.length === 0 &&
      allUnregisteredMembers.length === 0 &&
      allDeregisteredMembers.length === 0
    )
      return;

    setAvailableDynamicFilters(allFilters ?? []);
    setFilterLoading(false);
  }, [
    allDeregisteredMembers,
    allFilters,
    allRegisteredMembers,
    allUnregisteredMembers,
  ]);

  useEffect(() => {
    setDisplayAmount(formatAmount(0, club?.currency));
  }, [club]);

  useEffect(() => {
    setPageToken(undefined);
  }, [appliedMemberNameFilter, appliedMemberIdFilter]);

  // Build customFilters array from dynamicFilters
  useEffect(() => {
    const customFiltersArray: Array<{
      field_id: string;
      type: string;
      input_type: string;
      value: string;
      condition?: string;
    }> = [];

    Object.entries(dynamicFilters).forEach(([key, value]) => {
      // Skip empty or "all" values
      if (!value || value === "" || value === "all") {
        return;
      }

      // Find the filter definition to get the field_id, type, and determine input_type
      const filterDefinition = availableDynamicFilters?.find(
        (f) => f.key === key,
      );
      const fieldId = filterDefinition?.field_id || key;
      const fieldType = filterDefinition?.type || "text";
      const options = filterDefinition?.options || [];

      // Determine input_type and extract value and condition
      let inputType = "text";
      let actualValue = String(value);
      let condition: string | undefined = undefined;

      // Handle billing:number or other number types with operator
      if (fieldType === "billing:number" || typeof value === "object") {
        inputType = "number";
        const filterValue = value as { operator?: string; value?: string };
        actualValue = String(filterValue.value || "");
        condition = filterValue.operator || filterConditions[key];
      } else if (fieldType === "club_variable") {
        inputType = "text";
      } else if (
        options.length === 2 &&
        options.includes("true") &&
        options.includes("false")
      ) {
        inputType = "checkbox";
      } else if (options.length > 0) {
        inputType = "select";
      } else if (fieldType === "number" || !isNaN(Number(value))) {
        inputType = "number";
        condition = filterConditions[key];
      }

      const filterObj: {
        field_id: string;
        type: string;
        input_type: string;
        value: string;
        condition?: string;
      } = {
        field_id:
          fieldType === "club_variable" ? fieldId : `reg_field_${fieldId}`,
        type: fieldType,
        input_type: inputType,
        value: actualValue,
      };

      // Add condition for number fields
      if (condition) {
        filterObj.condition = condition;
      }

      customFiltersArray.push(filterObj);
    });

    setComputedCustomFilters(customFiltersArray);
  }, [dynamicFilters, availableDynamicFilters, filterConditions]);

  useEffect(() => {
    const allKeys = [
      ...new Set([
        ...appliedColumnKeysRegistered,
        ...appliedColumnKeysPending,
        ...appliedColumnKeysPrevious,
      ]),
    ];

    const mergedKeys = [...new Set([...requestedKeys, ...allKeys])];
    const hasSameKeys =
      mergedKeys.length === requestedKeys.length &&
      mergedKeys.every((key, index) => key === requestedKeys[index]);

    if (allKeys.length === 0) {
      if (requestedKeys.length > 0) {
        setRequestedKeys([]);
      }
      return;
    }

    if (!hasSameKeys) {
      setRequestedKeys(mergedKeys);
    }
  }, [
    appliedColumnKeysRegistered,
    appliedColumnKeysPending,
    appliedColumnKeysPrevious,
    requestedKeys,
  ]);

  useEffect(() => {
    if (window.location.hash) {
      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search,
      );
    }
  }, []);

  useEffect(() => {
    const updateHash = () => {
      const hash = window.location.hash.replace("#", "");
      setHashUserId(hash || null);
    };

    updateHash();
    window.addEventListener("hashchange", updateHash);

    return () => {
      window.removeEventListener("hashchange", updateHash);
    };
  }, []);

  const registerUser = (
    member: ClubMember,
    paymentMethod?: string,
    templateVariables?: Array<{
      name: string;
      value: string;
      auto_generated?: boolean;
    }>,
  ) => {
    if (
      memberRegisterAmount > member.outstanding_amount ||
      (memberRegisterAmount == 0 && member.outstanding_amount > 0) ||
      memberRegisterAmount < 0
    ) {
      setInvalidRegistrationAmount(true);
      return;
    }

    mutate(
      {
        clubId: club?.club_account_id as string,
        userId: member.user_id,
        payment_amount: memberRegisterAmount,
        payment_method: paymentMethod,
        template_variables: templateVariables,
      },
      {
        onSuccess: (response: { registered?: boolean }) => {
          if (!response.registered) {
            clubMembers.members.forEach((m: ClubMember) => {
              if (m.user_id === member.user_id) {
                m.outstanding_amount -= memberRegisterAmount;
              }
            });
          } else {
            window.location.reload();
          }
          setMemberRegisterAmount(0);
          setDisplayAmount(formatAmount(0, club?.currency));
        },
      },
    );
  };

  useEffect(() => {
    if (isSuccess) {
      setOpenDialogUserId(null);
    }
  }, [isSuccess]);

  const selectedRegistrationMember =
    selectedMember &&
    typeof selectedMember === "object" &&
    "user_id" in selectedMember &&
    typeof (selectedMember as ClubMember).user_id === "string"
      ? (selectedMember as ClubMember)
      : null;
  const openedFromMembersTable =
    searchParams.get("source") === "members-table";
  const openedFromQrScanner = searchParams.get("source") === "qr-scanner";

  const handleBackToRegistrations = () => {
    if (openedFromMembersTable || openedFromQrScanner) {
      setIsReturningToMembersTable(true);
      return;
    }

    setSelectedMember({});
    setHashUserId(null);

    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.delete("memberId");
    nextSearchParams.delete("registrationId");
    setSearchParams(nextSearchParams);
  };

  const handleReviewPendingRegistration = (member: ClubMember) => {
    handleBackToRegistrations();
    setOpenDialogUserId(member.user_id);
  };

  const isPendingSelectedRegistration = Boolean(
    selectedRegistrationMember?.registration_submitted_on &&
      !selectedRegistrationMember?.registered_on &&
      !selectedRegistrationMember?.deregistered_on,
  );

  const resetFilters = () => {
    setMemberNameFilter("");
    setMemberIdFilter("");
    setDynamicFilters({});
    setFilterConditions({});
    setAppliedCustomFilters([]);
    setActiveFilterKeys([]);
  };

  const handleDownloadRegisteredMembers = () => {
    const customCols =
      clubMembers?.filters?.filter((f: { key: string }) =>
        activeColumnKeysRegistered.includes(f.key),
      ) || [];

    exportTableData({
      members: allRegisteredMembers,
      tableName: "Active_Members",
      defaultColumns: ["Member Name", "Member ID", "Registered On"],
      customColumns: customCols,
    });
  };

  const handleDownloadPendingMembers = () => {
    const customCols =
      clubMembers?.filters?.filter((f: { key: string }) =>
        activeColumnKeysPending.includes(f.key),
      ) || [];

    exportTableData({
      members: allUnregisteredMembers,
      tableName: "Pending_Members",
      defaultColumns: [
        "Member Name",
        "Member ID",
        "Registration Submitted On",
        "Outstanding Amount",
      ],
      customColumns: customCols,
    });
  };

  const handleDownloadPreviousMembers = () => {
    const customCols =
      clubMembers?.filters?.filter((f: { key: string }) =>
        activeColumnKeysPrevious.includes(f.key),
      ) || [];

    exportTableData({
      members: allDeregisteredMembers,
      tableName: "Previous_Members",
      defaultColumns: ["Member Name", "Member ID", "Deregistered On"],
      customColumns: customCols,
    });
  };

  const dynamicFilterTextValues = Object.fromEntries(
    Object.entries(dynamicFilters).map(([key, value]) => [
      key,
      typeof value === "string" ? value : value?.value || "",
    ]),
  ) as Record<string, string>;

  const displayRegisteredMembers = allRegisteredMembers;
  const displayUnregisteredMembers = allUnregisteredMembers;

  const hasFilterChanges =
    memberNameFilter !== appliedMemberNameFilter ||
    memberIdFilter !== appliedMemberIdFilter ||
    JSON.stringify(computedCustomFilters) !== JSON.stringify(appliedCustomFilters);

  return (
    <div
      className={`h-full ${selectedRegistrationMember ? "overflow-visible" : "overflow-x-hidden"} bg-white text-slate-900`}
    >
      {clubLoading ? (
        <div className="flex h-full items-center justify-center px-6">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            <p className="text-sm text-slate-500">Loading registrations...</p>
          </div>
        </div>
      ) : (
        <div
          className={`flex w-full flex-col gap-4 ${selectedRegistrationMember ? "overflow-visible" : "overflow-x-hidden"} px-4 py-6 sm:px-6 md:px-8`}
        >
          <AnimatePresence mode="wait" initial={false}>
            {selectedRegistrationMember ? (
              <motion.div
                key="registration-detail-shell"
                className="flex flex-col gap-4"
                initial={{ opacity: 0, rotateY: -18, x: -20 }}
                animate={
                  isReturningToMembersTable
                    ? { opacity: 0, rotateY: 18, x: 20 }
                    : { opacity: 1, rotateY: 0, x: 0 }
                }
                transition={{ duration: 0.28, ease: "easeInOut" }}
                style={{ transformStyle: "preserve-3d" }}
                onAnimationComplete={() => {
                  if (isReturningToMembersTable) {
                    navigate(
                      openedFromQrScanner
                        ? "/manage/members?scanner=member-verification"
                        : "/manage/members",
                    );
                  }
                }}
              >
                <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-white py-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBackToRegistrations}
                    disabled={isReturningToMembersTable}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {openedFromQrScanner
                      ? "Go back to QR code scanning"
                      : openedFromMembersTable
                      ? "Go back to members table"
                      : "Go back to registrations"}
                  </Button>
                  {isPendingSelectedRegistration ? (
                    <Button
                      type="button"
                      onClick={() =>
                        handleReviewPendingRegistration(selectedRegistrationMember)
                      }
                    >
                      Register Member
                    </Button>
                  ) : null}
                </div>

                <motion.div
                  key="registration-detail"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.28, ease: "easeInOut" }}
                >
                  <RegistrationDialog
                    clubName={club?.club_name ?? ""}
                    selectedMember={selectedRegistrationMember}
                    currency={club?.currency ?? "ZAR"}
                    clubAccountId={club?.club_account_id ?? ""}
                  />
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="registration-overview"
                initial={{ opacity: 0, rotateY: -18, x: -20 }}
                animate={{ opacity: 1, rotateY: 0, x: 0 }}
                exit={{ opacity: 0, rotateY: 18, x: 20 }}
                transition={{ duration: 0.28, ease: "easeInOut" }}
                style={{ transformStyle: "preserve-3d" }}
              >
          <div className="mb-2 flex flex-col gap-1">
            <h1 className="text-2xl font-bold text-slate-900">Registrations</h1>
            <p className="text-sm text-slate-500">
              Review and manage active registrations, pending requests, and de-registrations.
            </p>
          </div>

          <Tabs
            value={selectedTab}
            onValueChange={handleTabChange}
            className="w-full flex-col justify-start gap-2.5"
          >
            <div>
              <Select value={selectedTab} onValueChange={handleTabChange}>
                <SelectTrigger className="h-10 w-auto min-w-[220px] border-2 border-slate-200 bg-white text-l text-slate-900 shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="registered-members" className="text-l">Active Registrations</SelectItem>
                  <SelectItem value="pending-members" className="text-l">Pending Registrations</SelectItem>
                  <SelectItem value="previous-members" className="text-l">De-registrations</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="border border-slate-100 bg-slate-50/60 px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                {(() => {
                  const activeKeys =
                    selectedTab === "pending-members" ? activeColumnKeysPending :
                    selectedTab === "previous-members" ? activeColumnKeysPrevious :
                    activeColumnKeysRegistered;
                  const setActiveKeys =
                    selectedTab === "pending-members" ? setActiveColumnKeysPending :
                    selectedTab === "previous-members" ? setActiveColumnKeysPrevious :
                    setActiveColumnKeysRegistered;
                  return (
                    <DropdownMenu open={columnsDropdownOpen} onOpenChange={setColumnsDropdownOpen}>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="h-9 gap-1.5 rounded-full border-slate-200 bg-white px-3.5 text-sm text-slate-700 hover:bg-slate-50">
                          Columns
                          {activeKeys.length > 0 && (
                            <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-slate-700 px-1 text-[10px] font-bold text-white">
                              {activeKeys.length}
                            </span>
                          )}
                          <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-52 p-1">
                        <div className="max-h-56 overflow-y-auto">
                          {availableDynamicFilters && availableDynamicFilters.length > 0 ? (
                            availableDynamicFilters.map(({ key, field_name }) => (
                              <DropdownMenuItem
                                key={key}
                                onSelect={(e) => e.preventDefault()}
                                onClick={() =>
                                  setActiveKeys((prev) =>
                                    prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
                                  )
                                }
                                className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm"
                              >
                                <Checkbox
                                  checked={activeKeys.includes(key)}
                                  className="pointer-events-none h-3.5 w-3.5"
                                />
                                {field_name}
                              </DropdownMenuItem>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-sm text-slate-400">No columns available</div>
                          )}
                        </div>
                        <div className="mt-1 border-t border-slate-100 pt-1">
                          <button
                            onClick={async () => {
                              if (selectedTab === "registered-members") {
                                setAppliedColumnKeysRegistered(activeColumnKeysRegistered);
                              } else if (selectedTab === "pending-members") {
                                setAppliedColumnKeysPending(activeColumnKeysPending);
                              } else if (selectedTab === "previous-members") {
                                setAppliedColumnKeysPrevious(activeColumnKeysPrevious);
                              }
                              setAppliedMemberNameFilter(memberNameFilter);
                              setAppliedMemberIdFilter(memberIdFilter);
                              setAppliedCustomFilters(computedCustomFilters);
                              setPageToken(undefined);
                              isLoadingMoreRef.current = false;
                              setIsLoadingMore(false);
                              await refetchClubMembers();
                              setColumnsDropdownOpen(false);
                            }}
                            className="w-full rounded-md bg-zinc-700 py-1.5 text-sm font-medium text-white transition hover:bg-zinc-800"
                          >
                            Apply
                          </button>
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  );
                })()}
                <DropdownMenu
                  open={filtersDropdownOpen}
                  onOpenChange={(open) => {
                    if (open) setTempFilterKeys(activeFilterKeys);
                    setFiltersDropdownOpen(open);
                  }}
                >
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="h-9 gap-1.5 rounded-full border-slate-200 bg-white px-3.5 text-sm text-slate-700 hover:bg-slate-50">
                      Filters
                      {activeFilterKeys.length > 0 && (
                        <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-slate-700 px-1 text-[10px] font-bold text-white">
                          {activeFilterKeys.length}
                        </span>
                      )}
                      <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-52 p-1">
                    <div className="max-h-56 overflow-y-auto">
                      {[
                        { key: "__name__", field_name: "Member Name" },
                        { key: "__id__", field_name: "Member ID" },
                      ].map(({ key, field_name }) => (
                        <DropdownMenuItem
                          key={key}
                          onSelect={(e) => e.preventDefault()}
                          onClick={() =>
                            setTempFilterKeys((prev) =>
                              prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
                            )
                          }
                          className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm"
                        >
                          <Checkbox checked={tempFilterKeys.includes(key)} className="pointer-events-none h-3.5 w-3.5" />
                          {field_name}
                        </DropdownMenuItem>
                      ))}
                      {availableDynamicFilters && availableDynamicFilters.length > 0 && (
                        <>
                          <div className="my-1 border-t border-slate-100" />
                          {availableDynamicFilters.map(({ key, field_name }) => (
                            <DropdownMenuItem
                              key={key}
                              onSelect={(e) => e.preventDefault()}
                              onClick={() =>
                                setTempFilterKeys((prev) =>
                                  prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
                                )
                              }
                              className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm"
                            >
                              <Checkbox checked={tempFilterKeys.includes(key)} className="pointer-events-none h-3.5 w-3.5" />
                              {field_name}
                            </DropdownMenuItem>
                          ))}
                        </>
                      )}
                    </div>
                    <div className="mt-1 border-t border-slate-100 pt-1">
                      <button
                        onClick={() => {
                          setActiveFilterKeys(tempFilterKeys);
                          setDynamicFilters((prev) => {
                            const next = { ...prev };
                            Object.keys(next).forEach((k) => {
                              if (!tempFilterKeys.includes(k)) delete next[k];
                            });
                            return next;
                          });
                          if (!tempFilterKeys.includes("__name__")) setMemberNameFilter("");
                          if (!tempFilterKeys.includes("__id__")) setMemberIdFilter("");
                          setFiltersDropdownOpen(false);
                        }}
                        className="w-full rounded-md bg-zinc-700 py-1.5 text-sm font-medium text-white transition hover:bg-zinc-800"
                      >
                        Apply
                      </button>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
                <div className="ml-auto flex items-center gap-2">
                  <Label className="text-sm font-medium text-slate-500">Rows:</Label>
                  <Select
                    value={memberLimit.toString()}
                    onValueChange={(value) => {
                      setMemberLimit(parseInt(value));
                      setPageToken(undefined);
                      isLoadingMoreRef.current = false;
                      setIsLoadingMore(false);
                      setlistActionItems([]);
                      setDeregisterMembers([]);
                      setAllMembersSelected(false);
                    }}
                  >
                    <SelectTrigger className="h-9 w-[85px] rounded-full border-slate-200 bg-white px-2.5 text-sm text-slate-700 shadow-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="100">100</SelectItem>
                      <SelectItem value="200">200</SelectItem>
                    </SelectContent>
                  </Select>
                  <button onClick={resetFilters} className="text-sm text-slate-400 hover:text-slate-600">
                    Reset
                  </button>
                </div>
              </div>

              {activeFilterKeys.length > 0 &&
                (() => {
                  const activeFilters = availableDynamicFilters.filter(
                    ({ key }) => activeFilterKeys.includes(key),
                  );

                  const sortedFilters = activeFilters.sort((a, b) => {
                    const getType = (
                      filter: (typeof availableDynamicFilters)[0],
                    ) => {
                      if (!filter.options) return 0;
                      if (
                        filter.options.length === 2 &&
                        filter.options.includes("true") &&
                        filter.options.includes("false")
                      )
                        return 2;
                      return 1;
                    };
                    return getType(a) - getType(b);
                  });

                  return (
                    <div className="mt-2 flex flex-col gap-1">
                      {activeFilterKeys.includes("__name__") && (
                        <div className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-slate-100/60">
                          <span className="w-32 shrink-0 text-sm font-medium text-slate-600">Member Name</span>
                          <Input placeholder="Filter by name" value={memberNameFilter} onChange={(e) => { setMemberNameFilter(e.target.value); setlistActionItems([]); setDeregisterMembers([]); setAllMembersSelected(false); }} className="h-8 flex-1 rounded-full border-slate-200 bg-white px-2.5 text-xs text-slate-700" />
                          <button onClick={() => { setMemberNameFilter(""); setActiveFilterKeys((prev) => prev.filter((k) => k !== "__name__")); }} className="rounded-full p-1 text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"><X className="h-3.5 w-3.5" /></button>
                        </div>
                      )}
                      {activeFilterKeys.includes("__id__") && (
                        <div className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-slate-100/60">
                          <span className="w-32 shrink-0 text-sm font-medium text-slate-600">Member ID</span>
                          <Input placeholder="Filter by ID" value={memberIdFilter} onChange={(e) => { setMemberIdFilter(e.target.value); setlistActionItems([]); setDeregisterMembers([]); setAllMembersSelected(false); }} className="h-8 flex-1 rounded-full border-slate-200 bg-white px-2.5 text-xs text-slate-700" />
                          <button onClick={() => { setMemberIdFilter(""); setActiveFilterKeys((prev) => prev.filter((k) => k !== "__id__")); }} className="rounded-full p-1 text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"><X className="h-3.5 w-3.5" /></button>
                        </div>
                      )}
                      {sortedFilters.map(
                        ({ key, field_name, options, type }) => {
                          const removeFilter = () => {
                            setActiveFilterKeys((prev) => prev.filter((k) => k !== key));
                            setDynamicFilters((prev) => {
                              const next = { ...prev };
                              delete next[key];
                              return next;
                            });
                          };

                          if (type === "billing:number") {
                            const filterValue = dynamicFilters[key] || {};
                            const operator =
                              typeof filterValue === "object"
                                ? filterValue.operator || "gte"
                                : "gte";
                            const rawValue =
                              typeof filterValue === "object"
                                ? filterValue.value || ""
                                : "";
                            const displayValue = rawValue
                              ? formatAmount(parseInt(rawValue) || 0, club?.currency)
                              : "";

                            return (
                              <div key={key} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-slate-100/60">
                                <span className="w-32 shrink-0 text-sm font-medium text-slate-600">{field_name}</span>
                                <div className="flex flex-1 items-center gap-2">
                                  <Select
                                    onValueChange={(newOperator) => {
                                      setDynamicFilters((prev) => ({
                                        ...prev,
                                        [key]: { operator: newOperator, value: rawValue },
                                      }));
                                      setlistActionItems([]);
                                      setDeregisterMembers([]);
                                      setAllMembersSelected(false);
                                    }}
                                    value={operator}
                                  >
                                    <SelectTrigger className="h-8 w-[160px] rounded-full border-slate-200 bg-white px-2.5 text-xs text-slate-700">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="eq">Equal to</SelectItem>
                                      <SelectItem value="neq">Not equal to</SelectItem>
                                      <SelectItem value="gt">Greater than</SelectItem>
                                      <SelectItem value="gte">Greater or equal</SelectItem>
                                      <SelectItem value="lt">Less than</SelectItem>
                                      <SelectItem value="lte">Less or equal</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Input
                                    type="text"
                                    placeholder="Amount"
                                    value={displayValue}
                                    onChange={(e) => {
                                      const numericValue = e.target.value.replace(/[^\d]/g, "");
                                      setDynamicFilters((prev) => ({
                                        ...prev,
                                        [key]: { operator, value: numericValue },
                                      }));
                                      setlistActionItems([]);
                                      setDeregisterMembers([]);
                                      setAllMembersSelected(false);
                                    }}
                                    className="h-8 w-[120px] rounded-full border-slate-200 bg-white px-2.5 text-xs text-slate-700"
                                  />
                                </div>
                                <button onClick={removeFilter} className="rounded-full p-1 text-slate-400 transition hover:bg-slate-200 hover:text-slate-600">
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            );
                          }

                          if (type === "club_variable" || !options || options.length === 0) {
                            return (
                              <div key={key} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-slate-100/60">
                                <span className="w-32 shrink-0 text-sm font-medium text-slate-600">{field_name}</span>
                                <Input
                                  placeholder={`Filter by ${field_name}`}
                                  value={dynamicFilterTextValues[key] || ""}
                                  onChange={(e) => {
                                    setDynamicFilters((prev) => ({ ...prev, [key]: e.target.value }));
                                    setlistActionItems([]);
                                    setDeregisterMembers([]);
                                    setAllMembersSelected(false);
                                  }}
                                  className="h-8 flex-1 rounded-full border-slate-200 bg-white px-2.5 text-xs text-slate-700"
                                />
                                <button onClick={removeFilter} className="rounded-full p-1 text-slate-400 transition hover:bg-slate-200 hover:text-slate-600">
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            );
                          }

                          if (options && options.length === 2 && options.includes("true") && options.includes("false")) {
                            return (
                              <div key={key} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-slate-100/60">
                                <label htmlFor={key} className="w-32 shrink-0 cursor-pointer text-sm font-medium text-slate-600">
                                  {field_name}
                                </label>
                                <Switch
                                  id={key}
                                  checked={dynamicFilters[key] === "true"}
                                  onCheckedChange={(checked) => {
                                    setDynamicFilters((prev) => ({ ...prev, [key]: checked ? "true" : "" }));
                                    setlistActionItems([]);
                                    setDeregisterMembers([]);
                                    setAllMembersSelected(false);
                                  }}
                                />
                                <button onClick={removeFilter} className="ml-auto rounded-full p-1 text-slate-400 transition hover:bg-slate-200 hover:text-slate-600">
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            );
                          }

                          return (
                            <div key={key} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-slate-100/60">
                              <span className="w-32 shrink-0 text-sm font-medium text-slate-600">{field_name}</span>
                              <Select
                                onValueChange={(value) => {
                                  setDynamicFilters((prev) => ({ ...prev, [key]: value }));
                                  setlistActionItems([]);
                                  setDeregisterMembers([]);
                                  setAllMembersSelected(false);
                                }}
                                value={dynamicFilterTextValues[key] || ""}
                              >
                                <SelectTrigger className="h-8 flex-1 rounded-full border-slate-200 bg-white px-2.5 text-xs text-slate-700">
                                  <SelectValue placeholder="All" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">All</SelectItem>
                                  {options.map((opt) => (
                                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <button onClick={removeFilter} className="rounded-full p-1 text-slate-400 transition hover:bg-slate-200 hover:text-slate-600">
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          );
                        },
                      )}
                    </div>
                  );
                })()}
              {activeFilterKeys.length > 0 && (
                <div className="mt-2 flex justify-end">
                  <button
                    disabled={!hasFilterChanges}
                    onClick={async () => {
                      setPageToken(undefined);
                      isLoadingMoreRef.current = false;
                      setIsLoadingMore(false);
                      setAppliedMemberNameFilter(memberNameFilter);
                      setAppliedMemberIdFilter(memberIdFilter);
                      if (selectedTab === "registered-members") {
                        setAppliedColumnKeysRegistered(activeColumnKeysRegistered);
                      } else if (selectedTab === "pending-members") {
                        setAppliedColumnKeysPending(activeColumnKeysPending);
                      } else if (selectedTab === "previous-members") {
                        setAppliedColumnKeysPrevious(activeColumnKeysPrevious);
                      }
                      setAppliedCustomFilters(computedCustomFilters);
                      await refetchClubMembers();
                    }}
                    className="h-9 rounded-full bg-zinc-700 px-4 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Apply Filters
                  </button>
                </div>
              )}
            </div>
            <TabsContent
              value="registered-members"
              className="relative flex flex-col gap-4 overflow-y-auto"
            >
              <div className="mt-2">
                {fetchError && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md flex items-center justify-between">
                    <p className="font-medium">{fetchError}</p>
                    <button
                      onClick={() => setFetchError(null)}
                      className="text-red-700 hover:text-red-900 font-bold"
                    >
                      ✕
                    </button>
                  </div>
                )}
                {!fetchError &&
                  clubMembers?.pageToken &&
                  clubMembers.pageToken !== "" && (
                    <div className="mt-4 flex items-center justify-between border border-amber-300 bg-amber-50 px-4 py-3">
                      <div className="flex items-center gap-2 text-amber-900">
                        <AlertCircle className="h-4 w-4" />
                        <p className="text-sm font-medium">
                          More results available
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setAppliedMemberNameFilter(memberNameFilter);
                          setAppliedMemberIdFilter(memberIdFilter);
                          setAppliedColumnKeysRegistered(
                            activeColumnKeysRegistered,
                          );
                          isLoadingMoreRef.current = true;
                          setIsLoadingMore(true);
                          setPageToken(clubMembers.pageToken);
                        }}
                        disabled={isLoadingMore}
                        className="h-8 rounded-full border border-amber-400 bg-amber-100 px-3 text-xs text-amber-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-50 flex items-center gap-2"
                      >
                        {isLoadingMore ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Load More"
                        )}
                      </button>
                    </div>
                  )}
                {!fetchError &&
                displayRegisteredMembers.length === 0 &&
                ((clubMembersLoading && !isLoadingMore) || filterLoading) ? (
                  <div className="flex justify-center items-center p-8 min-h-96">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <div className="w-full min-w-0">
                    <RegisteredMembersList
                      clubId={club?.club_account_id || ""}
                      sensors={sensors}
                      sortableId={sortableId}
                      allMembersSelected={allMembersSelected}
                      listActionItems={listActionItems}
                      clubMembers={{
                        registered: displayRegisteredMembers,
                        unregistered: displayUnregisteredMembers,
                        deregistered: allDeregisteredMembers,
                        filters: allFilters,
                      }}
                      activeColumnKeys={displayedColumnKeysRegistered}
                      dereigsterMembers={dereigsterMembers}
                      currency={club?.currency || ""}
                      memberLimit={memberLimit}
                      setAllListActionItems={setAllListActionItems}
                      setSelectedMember={setSelectedMember}
                      setlistActionItems={setlistActionItems}
                      setDeregisterMembers={setDeregisterMembers}
                      setAllMembersSelected={setAllMembersSelected}
                    />
                    <button
                      onClick={handleDownloadRegisteredMembers}
                      className="mt-4 p-2 w-fit bg-transparent cursor-pointer hover:bg-gray-100 transition rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed"
                      title="Download table data as CSV"
                    >
                      <Download className="h-5 w-5 text-green-600" />
                    </button>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent
              value="pending-members"
              className="relative flex flex-col gap-4 overflow-auto"
            >
              <div className="mt-2">
                {fetchError && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md flex items-center justify-between">
                    <p className="font-medium">{fetchError}</p>
                    <button
                      onClick={() => setFetchError(null)}
                      className="text-red-700 hover:text-red-900 font-bold"
                    >
                      ✕
                    </button>
                  </div>
                )}
                {!fetchError &&
                  clubMembers?.pageToken &&
                  clubMembers.pageToken !== "" && (
                    <div className="mt-4 flex items-center justify-between rounded-[20px] border border-amber-300 bg-amber-50 px-4 py-3">
                      <div className="flex items-center gap-2 text-amber-900">
                        <AlertCircle className="h-4 w-4" />
                        <p className="text-sm font-medium">
                          More results available
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setAppliedMemberNameFilter(memberNameFilter);
                          setAppliedMemberIdFilter(memberIdFilter);
                          setAppliedColumnKeysPending(activeColumnKeysPending);
                          isLoadingMoreRef.current = true;
                          setIsLoadingMore(true);
                          setPageToken(clubMembers.pageToken);
                        }}
                        disabled={isLoadingMore}
                        className="h-8 rounded-full border border-amber-400 bg-amber-100 px-3 text-xs text-amber-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-50 flex items-center gap-2"
                      >
                        {isLoadingMore ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Load More"
                        )}
                      </button>
                    </div>
                  )}
                {!fetchError &&
                displayUnregisteredMembers.length === 0 &&
                ((clubMembersLoading && !isLoadingMore) || filterLoading) ? (
                  <div className="flex justify-center items-center p-8 min-h-96">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <div className="flex w-full min-w-0 flex-col">
                    <PendingMembersList
                      clubId={club?.club_account_id || ""}
                      club={club}
                      sensors={sensors}
                      sortableId={sortableId}
                      openDialogUserId={openDialogUserId}
                      displayAmount={displayAmount}
                      memberRegisterAmount={memberRegisterAmount}
                      isPending={isPending}
                      invalidRegistrationAmount={invalidRegistrationAmount}
                      isError={isError}
                      reset={reset}
                      selectedTab={selectedTab}
                      clubMembers={{
                        registered: displayRegisteredMembers,
                        unregistered: displayUnregisteredMembers,
                        deregistered: allDeregisteredMembers,
                        filters: allFilters,
                        template_variables: templateVariables,
                        payment_methods: paymentMethods,
                      }}
                      listActionItems={listActionItems}
                      memberNameFilter={memberNameFilter}
                      memberIdFilter={memberIdFilter}
                      dynamicFilters={dynamicFilterTextValues}
                      allMembersSelected={allMembersSelected}
                      activeColumnKeys={displayedColumnKeysPending}
                      memberLimit={memberLimit}
                      handleFormattedInputChange={handleFormattedInputChange}
                      registerUser={registerUser}
                      setlistActionItems={setlistActionItems}
                      setSelectedMember={setSelectedMember}
                      setOpenDialogUserId={setOpenDialogUserId}
                      setMemberRegisterAmount={setMemberRegisterAmount}
                      setDisplayAmount={setDisplayAmount}
                      setAllListActionItems={setAllListActionItems}
                      setAllMembersSelected={setAllMembersSelected}
                      showPendingSummary={false}
                    />
                    <button
                      onClick={handleDownloadPendingMembers}
                      className="mt-4 p-2 w-fit bg-transparent cursor-pointer hover:bg-gray-100 transition rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed"
                      title="Download table data as CSV"
                    >
                      <Download className="h-5 w-5 text-green-600" />
                    </button>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent
              value="previous-members"
              className="relative flex flex-col gap-4 overflow-auto"
            >
              <div className="mt-2">
                <div className="flex min-h-12 items-center justify-between gap-3">
                  <div className="flex min-h-8 items-center gap-2">
                    <label className="inline-flex h-8 items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-100">
                      <Switch
                        id="show-archived-registrations"
                        checked={showArchived}
                        onCheckedChange={(checked) => {
                          setShowArchived(checked);
                          setPageToken(undefined);
                          isLoadingMoreRef.current = false;
                        }}
                      />
                      <span>Show archived registrations</span>
                    </label>
                  </div>
                </div>
                {fetchError && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md flex items-center justify-between">
                    <p className="font-medium">{fetchError}</p>
                    <button
                      onClick={() => setFetchError(null)}
                      className="text-red-700 hover:text-red-900 font-bold"
                    >
                      ✕
                    </button>
                  </div>
                )}
                {!fetchError &&
                  clubMembers?.pageToken &&
                  clubMembers.pageToken !== "" && (
                    <div className="mt-4 flex items-center justify-between rounded-[20px] border border-amber-300 bg-amber-50 px-4 py-3">
                      <div className="flex items-center gap-2 text-amber-900">
                        <AlertCircle className="h-4 w-4" />
                        <p className="text-sm font-medium">
                          More results available
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setAppliedMemberNameFilter(memberNameFilter);
                          setAppliedMemberIdFilter(memberIdFilter);
                          setAppliedColumnKeysPrevious(
                            activeColumnKeysPrevious,
                          );
                          isLoadingMoreRef.current = true;
                          setIsLoadingMore(true);
                          setPageToken(clubMembers.pageToken);
                        }}
                        disabled={isLoadingMore}
                        className="h-8 rounded-full border border-amber-400 bg-amber-100 px-3 text-xs text-amber-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-50 flex items-center gap-2"
                      >
                        {isLoadingMore ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Load More"
                        )}
                      </button>
                    </div>
                  )}
                {!fetchError &&
                allDeregisteredMembers.length === 0 &&
                ((clubMembersLoading && !isLoadingMore) || filterLoading) ? (
                  <div className="flex justify-center items-center p-8 min-h-96">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <div className="flex w-full min-w-0 flex-col">
                    <PreviousMembersList
                      club={club}
                      sensors={sensors}
                      sortableId={sortableId}
                      selectedTab={selectedTab}
                      clubMembers={{
                        registered: displayRegisteredMembers,
                        unregistered: displayUnregisteredMembers,
                        deregistered: allDeregisteredMembers,
                        filters: allFilters,
                      }}
                      memberNameFilter={memberNameFilter}
                      memberIdFilter={memberIdFilter}
                      dynamicFilters={dynamicFilterTextValues}
                      listActionItems={listActionItems}
                      activeColumnKeys={displayedColumnKeysPrevious}
                      memberLimit={memberLimit}
                      showArchived={showArchived}
                      setSelectedMember={setSelectedMember}
                      setDeregisteredMembers={setAllDeregisteredMembers}
                      setlistActionItems={setlistActionItems}
                    />
                    <button
                      onClick={handleDownloadPreviousMembers}
                      className="mt-4 p-2 w-fit bg-transparent cursor-pointer hover:bg-gray-100 transition rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed"
                      title="Download table data as CSV"
                    >
                      <Download className="h-5 w-5 text-green-600" />
                    </button>
                  </div>
                )}
              </div>
            </TabsContent>

          </Tabs>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
