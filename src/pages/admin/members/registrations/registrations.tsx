import React, { useContext, useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useFetchClubMembers } from "@/queries/admin/club-members";
import { ClubContext, ClubContextType } from "@/context/ClubContext";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { ClubMember } from "@/interfaces/club";
import { useRegisterUserToClubMutation } from "@/mutations/admin/member";
import RegistrationDialog from "@/components/admin/members/registrations/features/registration-dialog";
import DeregisterSeasonDialog from "@/components/admin/members/registrations/features/deregister-season";
import { formatAmount } from "@/data/currencies";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import RegisteredMembersList from "@/components/admin/members/registrations/active-registrations";
import PendingMembersList from "@/components/admin/members/registrations/pending-registrations";
import PreviousMembersList from "@/components/admin/members/registrations/previous-registrations";
import AddColumnsDialog from "@/components/admin/members/registrations/features/add-columns-dialog";
import AddFiltersDialog from "@/components/admin/members/registrations/features/add-filters-dialog";
import {
  Loader2,
  X,
  Download,
  AlertCircle,
  Users,
  UserPlus,
  Archive,
} from "lucide-react";
import { exportTableData } from "@/helpers/admin/members/csv-export";
import { Card } from "@/components/ui/card";
import { useRegistrationBillingReportingQuery } from "@/queries/admin/useReporting";
import { RegistrationReportData } from "@/components/registration-report-data-table";
import {
  RegistrationReportDropDown,
  RegistrationReportRowDataItem,
  RegistrationRowData,
} from "@/interfaces/report";

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
  const [searchParams, setSearchParams] = useSearchParams();
  const [requestedKeys, setRequestedKeys] = useState<string[]>([]);
  const initialTab = searchParams.get("tab");
  const [selectedTab, setSelectedTab] = useState(
    initialTab === "pending-members" ||
      initialTab === "previous-members" ||
      initialTab === "registered-members"
      ? initialTab
      : "registered-members",
  );
  const [memberLimit, setMemberLimit] = useState(100);
  const [pageToken, setPageToken] = useState<string | undefined>(undefined);
  const [allRegisteredMembers, setAllRegisteredMembers] = useState<ClubMember[]>(
    [],
  );
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
  const [isLoadingMoreRegistered, setIsLoadingMoreRegistered] = useState(false);
  const [isLoadingMorePending, setIsLoadingMorePending] = useState(false);
  const [isLoadingMorePrevious, setIsLoadingMorePrevious] = useState(false);

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

  const [selectedSeason, setSelectedSeason] = useState<string>("current");
  const [showOldFields, setShowOldFields] = useState<boolean>(false);
  const seasonCycle = (club as { season_cycle?: number } | null)?.season_cycle;
  const seasonToFetch =
    selectedSeason === "current" ? undefined : parseInt(selectedSeason, 10);
  const availableSeasons = seasonCycle
    ? Array.from({ length: seasonCycle - 1 }, (_, index) => ({
        value: (seasonCycle - index - 1).toString(),
        label: `Season ${seasonCycle - index - 1}`,
      }))
    : [];

  const {
    data: registrationBillingData,
    isLoading: registrationBillingLoading,
  } = useRegistrationBillingReportingQuery(
    club?.club_account_id as string,
    seasonToFetch,
  );

  useEffect(() => {
    const requestedTab = searchParams.get("tab");

    if (
      requestedTab &&
      ["registered-members", "pending-members", "previous-members"].includes(requestedTab) &&
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

  const [registeredMembersLength, setRegisteredMembersLength] =
    useState<number>(0);
  const [unregisteredMembersLength, setUnregisteredMembersLength] =
    useState<number>(0);
  const [deregisteredMembersLength, setDeregisteredMembersLength] =
    useState<number>(0);
  const [showPendingRegistrationsDropdown, setShowPendingRegistrationsDropdown] =
    useState(false);

  const [availableDynamicFilters, setAvailableDynamicFilters] = useState<
    AvailableDynamicFilter[]
  >([]);
  const [activeFilterKeys, setActiveFilterKeys] = useState<string[]>([]);
  const [showFilterSelector, setShowFilterSelector] = useState(false);
  const [templateVariables, setTemplateVariables] = useState<
    Array<{ name: string; value: string }>
  >([]);
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);

  const [activeColumnKeysRegistered, setActiveColumnKeysRegistered] = useState<
    string[]
  >([]);
  const [appliedColumnKeysRegistered, setAppliedColumnKeysRegistered] =
    useState<string[]>([]);
  const [displayedColumnKeysRegistered, setDisplayedColumnKeysRegistered] =
    useState<string[]>([]);
  const [showColumnSelectorRegistered, setShowColumnSelectorRegistered] =
    useState(false);
  const [activeColumnKeysPending, setActiveColumnKeysPending] = useState<
    string[]
  >([]);
  const [appliedColumnKeysPending, setAppliedColumnKeysPending] = useState<
    string[]
  >([]);
  const [displayedColumnKeysPending, setDisplayedColumnKeysPending] = useState<
    string[]
  >([]);
  const [showColumnSelectorPending, setShowColumnSelectorPending] =
    useState(false);
  const [activeColumnKeysPrevious, setActiveColumnKeysPrevious] = useState<
    string[]
  >([]);
  const [appliedColumnKeysPrevious, setAppliedColumnKeysPrevious] = useState<
    string[]
  >([]);
  const [displayedColumnKeysPrevious, setDisplayedColumnKeysPrevious] =
    useState<string[]>([]);
  const [showColumnSelectorPrevious, setShowColumnSelectorPrevious] =
    useState(false);

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
      setFilterLoading(false);
      setIsLoadingMoreRegistered(false);
      setIsLoadingMorePending(false);
      setIsLoadingMorePrevious(false);
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
        setIsLoadingMoreRegistered(false);
        setIsLoadingMorePending(false);
        setIsLoadingMorePrevious(false);
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

    setRegisteredMembersLength(allRegisteredMembers.length);
    setUnregisteredMembersLength(allUnregisteredMembers.length);
    setDeregisteredMembersLength(allDeregisteredMembers.length);
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
        field_id: fieldType === "club_variable" ? fieldId : `reg_field_${fieldId}`,
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
    templateVariables?: Array<{ name: string; value: string }>,
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
        },
      },
    );
  };

  useEffect(() => {
    if (isSuccess) {
      setOpenDialogUserId(null);
    }
  }, [isSuccess]);

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

  const handleDownloadRegistrationBillingReport = () => {
    if (!registrationBillingData) return;

    const report = Array.isArray(registrationBillingData.report)
      ? (registrationBillingData.report as RegistrationReportDropDown[])
      : [];
    const csvSections: string[] = [];

    report.forEach((item: RegistrationReportDropDown, index: number) => {
      if (index > 0) {
        csvSections.push("");
        csvSections.push("");
      }

      const fieldName =
        item.table_name +
        (item.old_field ? " (OLD FIELD - PREVIOUSLY EXISTED)" : "");
      csvSections.push(`"========== ${fieldName} =========="`);
      csvSections.push("");

      if (item.rows && item.rows.length > 0) {
        item.rows.forEach((row: RegistrationRowData) => {
          const optionName = row.row_name + (row.old_field ? " (OLD)" : "");
          csvSections.push(
            `"Option: ${optionName}","Fee: ${row.fee_amount || "Custom/Free"}"`,
          );
          csvSections.push(
            '"Date","Total","Paid to Club","Pending","Due to Club"',
          );

          if (row.data && row.data.length > 0) {
            row.data.forEach((dataItem: RegistrationReportRowDataItem) => {
              csvSections.push(
                `"${dataItem.date}","${dataItem.total}","${dataItem.paid_to_club}","${dataItem.pending}","${dataItem.due_to_club}"`,
              );
            });
          }

          csvSections.push(
            `"TOTAL","${row.total.total}","${row.total.paid_to_club}","${row.total.pending}","${row.total.due_to_club}"`,
          );
          csvSections.push("");
        });
      } else if (item.data && item.data.length > 0) {
        csvSections.push(`"Fee: ${item.fee_amount || "Custom/Free"}"`);
        csvSections.push(
          '"Date","Total","Paid to Club","Pending","Due to Club"',
        );

        item.data.forEach((dataItem: RegistrationReportRowDataItem) => {
          csvSections.push(
            `"${dataItem.date}","${dataItem.total}","${dataItem.paid_to_club}","${dataItem.pending}","${dataItem.due_to_club}"`,
          );
        });

        csvSections.push(
          `"TOTAL","${item.total?.total || 0}","${item.total?.paid_to_club || 0}","${item.total?.pending || 0}","${item.total?.due_to_club || 0}"`,
        );
      }
    });

    const csvContent = csvSections.join("\n");
    const element = document.createElement("a");
    const file = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    element.href = URL.createObjectURL(file);
    const timestamp = new Date().toISOString().split("T")[0];
    element.download = `Registration_Billing_Report_${timestamp}.csv`;
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const dynamicFilterTextValues = Object.fromEntries(
    Object.entries(dynamicFilters).map(([key, value]) => [
      key,
      typeof value === "string" ? value : value?.value || "",
    ]),
  ) as Record<string, string>;

  const currentTableSummary =
    selectedTab === "registered-members"
      ? {
          badge: "Active registrations",
          title: "Current member registrations",
          count: registeredMembersLength,
          icon: Users,
        }
      : selectedTab === "pending-members"
        ? {
            badge: "Pending registrations",
            title: "Awaiting payment or approval",
            count: unregisteredMembersLength,
            icon: UserPlus,
          }
        : {
            badge: "De-registrations",
            title: "Historical member removals",
            count: deregisteredMembersLength,
            icon: Archive,
          };

  const CurrentTableIcon = currentTableSummary.icon;

  return (
    <div className="min-h-screen overflow-x-hidden bg-[linear-gradient(180deg,_#e7e5e4_0%,_#f5f5f4_22%,_#fafaf9_22%,_#fafaf9_100%)] text-slate-900">
      {clubLoading ? (
        <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(214,211,209,0.55),_transparent_32%),linear-gradient(180deg,_#e7e5e4_0%,_#f5f5f4_40%,_#fafaf9_100%)] px-6">
          <div className="flex flex-col items-center gap-4 rounded-[24px] border border-stone-300/70 bg-white/90 px-8 py-10 text-zinc-900 shadow-xl backdrop-blur">
            <Loader2 className="h-10 w-10 animate-spin text-zinc-500" />
            <p className="text-lg font-medium text-zinc-700">
              Loading registrations workspace...
            </p>
          </div>
        </div>
      ) : (
        <div className="flex w-full max-w-full flex-col gap-3 overflow-x-hidden px-2 py-3 sm:px-3 md:px-4 md:py-4 xl:px-5 2xl:px-6">
          <section className="relative overflow-hidden rounded-[24px] border border-stone-300/70 bg-stone-200 px-4 py-4 text-zinc-900 shadow-[0_18px_40px_rgba(120,113,108,0.16)] md:px-5 md:py-4">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.72),_transparent_28%),radial-gradient(circle_at_right,_rgba(214,211,209,0.55),_transparent_24%)]" />
            <div className="relative flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white/70 px-2.5 py-1 text-[11px] text-zinc-600 backdrop-blur">
                  <CurrentTableIcon className="h-3.5 w-3.5 text-zinc-500" />
                  {currentTableSummary.badge}
                </div>
                <h1 className="text-xl font-semibold tracking-tight md:text-3xl">
                  {currentTableSummary.title}
                </h1>
              </div>

              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                {availableSeasons.length > 0 && (
                  <Select value={selectedSeason} onValueChange={setSelectedSeason}>
                    <SelectTrigger className="h-8 w-full rounded-full border-stone-300 bg-white text-zinc-700 shadow-none sm:w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="current">Current Season</SelectItem>
                      {availableSeasons.map((season) => (
                        <SelectItem key={season.value} value={season.value}>
                          {season.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <button
                  onClick={handleDownloadRegistrationBillingReport}
                  disabled={!registrationBillingData}
                  className="inline-flex h-8 items-center justify-center gap-2 rounded-full border border-stone-300 bg-white px-3.5 text-xs text-zinc-800 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50"
                  title="Download registration billing data as CSV"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export report
                </button>
              </div>
            </div>

          </section>

          <Tabs
            value={selectedTab}
            onValueChange={(value: string) => {
              setPageToken(undefined);
              setFilterLoading(true);
              isLoadingMoreRef.current = false;
              setRequestedKeys([]);
              setSelectedTab(value);
              setHashUserId(null);
              setlistActionItems([]);
              setDeregisterMembers([]);
              setAllMembersSelected(false);
              setSelectedMember({});
              setSearchParams({ tab: value });

              // Reset both input filters and applied filters
              setMemberNameFilter("");
              setMemberIdFilter("");
              setAppliedMemberNameFilter("");
              setAppliedMemberIdFilter("");
              setDynamicFilters({});
              setFilterConditions({});
              setAppliedCustomFilters([]);
              setActiveFilterKeys([]);

              // Reset custom columns for all tabs
              setActiveColumnKeysRegistered([]);
              setActiveColumnKeysPending([]);
              setActiveColumnKeysPrevious([]);
            }}
            className="w-full flex-col justify-start gap-3"
          >
            <section className="rounded-[24px] border border-slate-200/70 bg-white/90 p-2.5 shadow-[0_16px_36px_rgba(15,23,42,0.07)] backdrop-blur md:p-3">
              <div className="rounded-[18px] border border-slate-200/70 bg-slate-50/90 p-1.5 backdrop-blur">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <TabsList className="h-auto flex-wrap justify-start gap-2 bg-transparent p-0">
                    <TabsTrigger
                      value="registered-members"
                      className="h-8 min-w-[180px] rounded-full border border-slate-200 bg-white px-3.5 text-xs font-medium text-zinc-700 data-[state=active]:bg-zinc-700 data-[state=active]:text-white"
                    >
                      Active Registrations
                    </TabsTrigger>
                    <TabsTrigger
                      value="pending-members"
                      className="h-8 min-w-[180px] rounded-full border border-slate-200 bg-white px-3.5 text-xs font-medium text-zinc-700 data-[state=active]:bg-zinc-700 data-[state=active]:text-white"
                    >
                      Pending Registrations
                    </TabsTrigger>
                    <TabsTrigger
                      value="previous-members"
                      className="h-8 min-w-[180px] rounded-full border border-slate-200 bg-white px-3.5 text-xs font-medium text-zinc-700 data-[state=active]:bg-zinc-700 data-[state=active]:text-white"
                    >
                      De-registrations
                    </TabsTrigger>
                  </TabsList>
                  <div className="flex shrink-0 items-center gap-2">
                    <DeregisterSeasonDialog clubId={club?.club_account_id ?? ""} />
                  </div>
                </div>
              </div>
            </section>
            <Card className="rounded-[24px] border border-slate-200/70 bg-white/90 p-4 shadow-[0_16px_36px_rgba(15,23,42,0.07)] backdrop-blur md:p-5">
                <div className="flex items-center">
                  <p
                    className="cursor-pointer text-xs font-medium uppercase tracking-[0.18em] text-slate-500 underline decoration-slate-300 underline-offset-4"
                    onClick={resetFilters}
                  >
                    Reset filters
                  </p>
                </div>
                <div className="flex flex-row flex-wrap gap-2">
                  <Input
                    placeholder="Filter by member name"
                    value={memberNameFilter}
                    onChange={(e) => {
                      setMemberNameFilter(e.target.value);
                      setlistActionItems([]);
                      setDeregisterMembers([]);
                      setAllMembersSelected(false);
                    }}
                    className="h-8 w-[300px] rounded-full border-slate-200 bg-white text-xs text-slate-700 placeholder:text-slate-400"
                  />
                  <Input
                    placeholder="Filter by member ID"
                    value={memberIdFilter}
                    onChange={(e) => {
                      setMemberIdFilter(e.target.value);
                      setlistActionItems([]);
                      setDeregisterMembers([]);
                      setAllMembersSelected(false);
                    }}
                    className="h-8 w-[300px] rounded-full border-slate-200 bg-white text-xs text-slate-700 placeholder:text-slate-400"
                  />
                </div>

                {availableDynamicFilters &&
                  activeFilterKeys.length > 0 &&
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
                      <div className="flex flex-col gap-2 p-2">
                        <span className="text-xs font-semibold text-muted-foreground">
                          Custom Filters
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {sortedFilters.map(
                            ({ key, field_name, options, type }) => {
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
                                  ? formatAmount(
                                      parseInt(rawValue) || 0,
                                      club?.currency,
                                    )
                                  : "";

                                return (
                                  <div
                                    key={key}
                                    className="rounded-[18px] border border-slate-200 bg-slate-50/70 p-3"
                                  >
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                      <Label className="text-xs font-semibold">
                                        {field_name}
                                      </Label>
                                      <button
                                        onClick={() => {
                                          setActiveFilterKeys((prev) =>
                                            prev.filter((k) => k !== key),
                                          );
                                          setDynamicFilters((prev) => {
                                            const newFilters = { ...prev };
                                            delete newFilters[key];
                                            return newFilters;
                                          });
                                        }}
                                        className="rounded-full p-1 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </div>
                                    <div className="flex gap-2 items-center">
                                      <Select
                                        onValueChange={(newOperator) => {
                                          setDynamicFilters((prev) => ({
                                            ...prev,
                                            [key]: {
                                              operator: newOperator,
                                              value: rawValue,
                                            },
                                          }));
                                          setlistActionItems([]);
                                          setDeregisterMembers([]);
                                          setAllMembersSelected(false);
                                        }}
                                        value={operator}
                                      >
                                        <SelectTrigger className="h-8 w-[200px] rounded-full bg-white text-xs text-slate-700">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="eq">
                                            Equal to
                                          </SelectItem>
                                          <SelectItem value="neq">
                                            Not equal to
                                          </SelectItem>
                                          <SelectItem value="gt">
                                            Greater than
                                          </SelectItem>
                                          <SelectItem value="gte">
                                            Greater or equal
                                          </SelectItem>
                                          <SelectItem value="lt">
                                            Less than
                                          </SelectItem>
                                          <SelectItem value="lte">
                                            Less or equal
                                          </SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <Input
                                        type="text"
                                        placeholder="Enter amount"
                                        value={displayValue}
                                        onChange={(e) => {
                                          const inputValue =
                                            e.target.value.replace(/[^\d]/g, "");
                                          const numericValue = inputValue || "";
                                          setDynamicFilters((prev) => ({
                                            ...prev,
                                            [key]: {
                                              operator,
                                              value: numericValue,
                                            },
                                          }));
                                          setlistActionItems([]);
                                          setDeregisterMembers([]);
                                          setAllMembersSelected(false);
                                        }}
                                        className="w-[150px] text-sm"
                                      />
                                    </div>
                                  </div>
                                );
                              }

                              if (
                                type === "club_variable" ||
                                !options ||
                                options.length === 0
                              ) {
                                return (
                                  <div
                                    key={key}
                                    className="rounded-[18px] border border-slate-200 bg-slate-50/70 p-3"
                                  >
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                      <Label className="text-xs font-semibold">
                                        {field_name}
                                      </Label>
                                      <button
                                        onClick={() => {
                                          setActiveFilterKeys((prev) =>
                                            prev.filter((k) => k !== key),
                                          );
                                          setDynamicFilters((prev) => {
                                            const newFilters = { ...prev };
                                            delete newFilters[key];
                                            return newFilters;
                                          });
                                        }}
                                        className="rounded-full p-1 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </div>
                                    <Input
                                      placeholder={`Filter by ${field_name}`}
                                      value={dynamicFilterTextValues[key] || ""}
                                      onChange={(e) => {
                                        setDynamicFilters((prev) => ({
                                          ...prev,
                                          [key]: e.target.value,
                                        }));
                                        setlistActionItems([]);
                                        setDeregisterMembers([]);
                                        setAllMembersSelected(false);
                                      }}
                                      className="h-8 w-[280px] rounded-full border-slate-200 bg-white text-xs text-slate-700"
                                    />
                                  </div>
                                );
                              }

                              if (
                                options &&
                                options.length === 2 &&
                                options.includes("true") &&
                                options.includes("false")
                              ) {
                                return (
                                  <div
                                    key={key}
                                    className="rounded-[18px] border border-slate-200 bg-slate-50/70 p-3"
                                  >
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                      <Label className="text-xs font-semibold">
                                        {field_name}
                                      </Label>
                                      <button
                                        onClick={() => {
                                          setActiveFilterKeys((prev) =>
                                            prev.filter((k) => k !== key),
                                          );
                                          setDynamicFilters((prev) => {
                                            const newFilters = { ...prev };
                                            delete newFilters[key];
                                            return newFilters;
                                          });
                                        }}
                                        className="rounded-full p-1 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </div>
                                    <Checkbox
                                      id={key}
                                      checked={dynamicFilters[key] === "true"}
                                      onCheckedChange={(checked) => {
                                        setDynamicFilters((prev) => ({
                                          ...prev,
                                          [key]: checked ? "true" : "",
                                        }));
                                        setlistActionItems([]);
                                        setDeregisterMembers([]);
                                        setAllMembersSelected(false);
                                      }}
                                    />
                                    <label
                                      htmlFor={key}
                                      className="text-sm font-medium cursor-pointer ml-2"
                                    >
                                      Enabled
                                    </label>
                                  </div>
                                );
                              }

                              return (
                                <div
                                  key={key}
                                  className="rounded-[18px] border border-slate-200 bg-slate-50/70 p-3"
                                >
                                  <div className="flex items-center justify-between gap-2 mb-2">
                                    <Label className="text-xs font-semibold">
                                      {field_name}
                                    </Label>
                                    <button
                                      onClick={() => {
                                        setActiveFilterKeys((prev) =>
                                          prev.filter((k) => k !== key),
                                        );
                                        setDynamicFilters((prev) => {
                                          const newFilters = { ...prev };
                                          delete newFilters[key];
                                          return newFilters;
                                        });
                                      }}
                                      className="rounded-full p-1 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                  <Select
                                    onValueChange={(value) => {
                                      setDynamicFilters((prev) => ({
                                        ...prev,
                                        [key]: value,
                                      }));
                                      setlistActionItems([]);
                                      setDeregisterMembers([]);
                                      setAllMembersSelected(false);
                                    }}
                                    value={dynamicFilterTextValues[key] || ""}
                                  >
                                    <SelectTrigger className="h-8 w-[280px] rounded-full bg-white text-xs text-slate-700">
                                      <SelectValue placeholder="All" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="all">All</SelectItem>
                                      {options.map((opt) => (
                                        <SelectItem key={opt} value={opt}>
                                          {opt}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              );
                            },
                          )}
                        </div>
                      </div>
                    );
                  })()}
                <div className="flex flex-row gap-2 items-start">
                  <AddFiltersDialog
                    open={showFilterSelector}
                    onOpenChange={setShowFilterSelector}
                    availableFields={availableDynamicFilters}
                    activeFilterKeys={activeFilterKeys}
                    onFilterKeysChange={setActiveFilterKeys}
                    description="Select which filters you want to display. After selecting, click the Run button below to apply these filters."
                  />
                  {selectedTab === "registered-members" && (
                    <AddColumnsDialog
                      open={showColumnSelectorRegistered}
                      onOpenChange={setShowColumnSelectorRegistered}
                      availableFields={availableDynamicFilters}
                      activeColumnKeys={activeColumnKeysRegistered}
                      onColumnKeysChange={setActiveColumnKeysRegistered}
                      description="Select which columns you want to display. After selecting, click the Run button below to apply these columns."
                    />
                  )}
                  {selectedTab === "pending-members" && (
                    <AddColumnsDialog
                      open={showColumnSelectorPending}
                      onOpenChange={setShowColumnSelectorPending}
                      availableFields={availableDynamicFilters}
                      activeColumnKeys={activeColumnKeysPending}
                      onColumnKeysChange={setActiveColumnKeysPending}
                      description="Select which columns you want to display. After selecting, click the Run button below to apply these columns."
                    />
                  )}
                  {selectedTab === "previous-members" && (
                    <AddColumnsDialog
                      open={showColumnSelectorPrevious}
                      onOpenChange={setShowColumnSelectorPrevious}
                      availableFields={availableDynamicFilters}
                      activeColumnKeys={activeColumnKeysPrevious}
                      onColumnKeysChange={setActiveColumnKeysPrevious}
                      description="Select which columns you want to display. After selecting, click the Run button below to apply these columns."
                    />
                  )}
                </div>
                {(activeColumnKeysRegistered.length > 0 ||
                  activeColumnKeysPending.length > 0 ||
                  activeColumnKeysPrevious.length > 0) && (
                  <div className="flex flex-wrap gap-2">
                    {selectedTab === "registered-members" &&
                      activeColumnKeysRegistered.map((key) => {
                        const field = availableDynamicFilters?.find(
                          (f) => f.key === key,
                        );
                        return (
                          <div
                            key={key}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700"
                          >
                            {field?.field_name || key}
                            <button
                              onClick={() =>
                                setActiveColumnKeysRegistered((prev) =>
                                  prev.filter((k) => k !== key),
                                )
                              }
                              className="ml-1 font-bold text-slate-400 hover:text-slate-700"
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                    {selectedTab === "pending-members" &&
                      activeColumnKeysPending.map((key) => {
                        const field = availableDynamicFilters?.find(
                          (f) => f.key === key,
                        );
                        return (
                          <div
                            key={key}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700"
                          >
                            {field?.field_name || key}
                            <button
                              onClick={() =>
                                setActiveColumnKeysPending((prev) =>
                                  prev.filter((k) => k !== key),
                                )
                              }
                              className="ml-1 font-bold text-slate-400 hover:text-slate-700"
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                    {selectedTab === "previous-members" &&
                      activeColumnKeysPrevious.map((key) => {
                        const field = availableDynamicFilters?.find(
                          (f) => f.key === key,
                        );
                        return (
                          <div
                            key={key}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700"
                          >
                            {field?.field_name || key}
                            <button
                              onClick={() =>
                                setActiveColumnKeysPrevious((prev) =>
                                  prev.filter((k) => k !== key),
                                )
                              }
                              className="ml-1 font-bold text-slate-400 hover:text-slate-700"
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                  </div>
                )}
                <div className="mt-3 flex flex-col gap-3 border-t border-slate-200 pt-3 md:flex-row md:items-center md:justify-between">
                  <p className="text-xs leading-5 text-slate-500">
                    Configure your filters and columns above, then click the{" "}
                    <span className="font-semibold">Run</span> button to apply
                    your selections and display the results.
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-3">
                      <Label className="text-xs font-medium text-slate-600">
                        Results per page:
                      </Label>
                      <Select
                        value={memberLimit.toString()}
                        onValueChange={(value) => {
                          setMemberLimit(parseInt(value));
                          setPageToken(undefined);
                          setlistActionItems([]);
                          setDeregisterMembers([]);
                          setAllMembersSelected(false);
                        }}
                      >
                        <SelectTrigger className="h-8 w-[100px] rounded-full bg-white text-xs text-slate-700">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="100">100</SelectItem>
                          <SelectItem value="200">200</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <button
                      onClick={async () => {
                        setPageToken(undefined);
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
                      title="Run database query to refresh members data"
                      className="inline-flex h-8 w-[100px] items-center justify-center rounded-full bg-zinc-700 px-4 text-xs font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Run
                    </button>
                  </div>
                </div>
            </Card>
            <TabsContent
              value="registered-members"
              className="relative flex flex-col gap-4 overflow-y-auto"
            >
              <Card className="rounded-[24px] border border-slate-200/70 bg-white/95 p-4 shadow-[0_16px_36px_rgba(15,23,42,0.07)] md:p-5">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold text-slate-950">
                    Active Registrations - Items returned (
                    {registeredMembersLength})
                  </h2>
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
                    <div className="bg-orange-100 max-w-[79vw] border border-orange-600 p-4 rounded-md flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-orange-600" />
                        <p className="text-black font-medium">
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
                          setIsLoadingMoreRegistered(true);
                          isLoadingMoreRef.current = true;
                          setPageToken(clubMembers.pageToken);
                          setTimeout(() => refetchClubMembers(), 0);
                        }}
                        disabled={isLoadingMoreRegistered}
                        className="px-4 py-2 bg-orange-100 hover:bg-orange-200 cursor-pointer rounded-[20px] border border-black text-black font-semibold rounded-md hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isLoadingMoreRegistered ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Load More"
                        )}
                      </button>
                    </div>
                  )}
                {!fetchError && (clubMembersLoading || filterLoading) ? (
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
                        registered: allRegisteredMembers,
                        unregistered: allUnregisteredMembers,
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
                      setRegisteredMembersLength={setRegisteredMembersLength}
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
              </Card>
            </TabsContent>

            <TabsContent
              value="pending-members"
              className="relative flex flex-col gap-4 overflow-auto"
            >
              <Card className="rounded-[24px] border border-slate-200/70 bg-white/95 p-4 shadow-[0_16px_36px_rgba(15,23,42,0.07)] md:p-5">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-semibold text-slate-950">
                    Pending Registrations - Items returned (
                    {unregisteredMembersLength})
                  </h2>
                  <div className="relative shrink-0">
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
                      {allUnregisteredMembers.length > 0 && (
                        <span className="absolute right-0 top-0 inline-flex -translate-y-1/3 translate-x-1/3 items-center justify-center rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-bold text-white">
                          {allUnregisteredMembers.length}
                        </span>
                      )}
                    </button>

                    {showPendingRegistrationsDropdown && (
                      <div className="absolute right-0 top-full z-50 mt-2 w-[22rem] overflow-y-auto rounded-[22px] border border-slate-200 bg-white shadow-2xl">
                        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
                          <h3 className="font-semibold text-slate-900">
                            Pending Registrations ({allUnregisteredMembers.length})
                          </h3>
                          <button
                            type="button"
                            onClick={() => setShowPendingRegistrationsDropdown(false)}
                            className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        {allUnregisteredMembers.length === 0 ? (
                          <div className="p-5 text-center text-sm text-slate-500">
                            No pending registrations.
                          </div>
                        ) : (
                          <div className="max-h-96 divide-y overflow-y-auto">
                            {allUnregisteredMembers.map((member) => (
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

                                  <button
                                    type="button"
                                    className="inline-flex h-8 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                                    onClick={() => {
                                      reset();
                                      setShowPendingRegistrationsDropdown(false);
                                      setMemberRegisterAmount(0);
                                      setOpenDialogUserId(member.user_id);
                                    }}
                                  >
                                    <UserPlus className="h-3.5 w-3.5" />
                                    Review
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
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
                    <div className="bg-orange-100 max-w-[79vw] border border-orange-600 p-4 rounded-md flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-orange-600" />
                        <p className="text-black font-medium">
                          More results available
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setAppliedMemberNameFilter(memberNameFilter);
                          setAppliedMemberIdFilter(memberIdFilter);
                          setAppliedColumnKeysPending(activeColumnKeysPending);
                          setIsLoadingMorePending(true);
                          isLoadingMoreRef.current = true;
                          setPageToken(clubMembers.pageToken);
                          setTimeout(() => refetchClubMembers(), 0);
                        }}
                        disabled={isLoadingMorePending}
                        className="px-4 py-2 bg-orange-100 rounded-[20px] hover:bg-orange-200 cursor-pointer border border-orange-600 text-black font-semibold rounded-md hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isLoadingMorePending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Load More"
                        )}
                      </button>
                    </div>
                  )}
                {!fetchError && (clubMembersLoading || filterLoading) ? (
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
                      isPending={isPending}
                      invalidRegistrationAmount={invalidRegistrationAmount}
                      isError={isError}
                      reset={reset}
                      selectedTab={selectedTab}
                      clubMembers={{
                        registered: allRegisteredMembers,
                        unregistered: allUnregisteredMembers,
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
                      setUnregisteredMembersLength={
                        setUnregisteredMembersLength
                      }
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
              </Card>
            </TabsContent>

            <TabsContent
              value="previous-members"
              className="relative flex flex-col gap-4 overflow-auto"
            >
              <Card className="rounded-[24px] border border-slate-200/70 bg-white/95 p-4 shadow-[0_16px_36px_rgba(15,23,42,0.07)] md:p-5">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-semibold text-slate-950">
                    De-registrations - Items returned (
                    {deregisteredMembersLength})
                  </h2>
                  <label className="inline-flex h-8 items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-100">
                    <Switch
                      id="show-archived-registrations"
                      checked={showArchived}
                      onCheckedChange={setShowArchived}
                    />
                    <span>Show archived registrations</span>
                  </label>
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
                    <div className="bg-orange-100 max-w-[79vw] border border-orange-600 p-4 rounded-md flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-orange-600" />
                        <p className="text-black font-medium">
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
                          setIsLoadingMorePrevious(true);
                          isLoadingMoreRef.current = true;
                          setPageToken(clubMembers.pageToken);
                          setTimeout(() => refetchClubMembers(), 0);
                        }}
                        disabled={isLoadingMorePrevious}
                        className="px-4 py-2 bg-orange-100 border hover:bg-orange-200 cursor-pointer rounded-[20px] border-orange-600 text-black font-semibold rounded-md hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isLoadingMorePrevious ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Load More"
                        )}
                      </button>
                    </div>
                  )}
                {!fetchError && (clubMembersLoading || filterLoading) ? (
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
                        registered: allRegisteredMembers,
                        unregistered: allUnregisteredMembers,
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
                      setlistActionItems={setlistActionItems}
                      setDeregisteredMembersLength={
                        setDeregisteredMembersLength
                      }
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
              </Card>
            </TabsContent>

            <section className="rounded-[24px] border border-slate-200/70 bg-white/90 p-2.5 shadow-[0_16px_36px_rgba(15,23,42,0.07)] backdrop-blur md:p-3">
              <div className="rounded-[18px] border border-slate-200/70 bg-slate-50/90 p-1.5 backdrop-blur">
                <div className="space-y-3 px-1 pb-1 pt-2.5 md:px-2 md:pb-2">
                  <section className="rounded-[20px] border border-slate-200/70 bg-white/95 p-4 shadow-sm md:p-5">
                    <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 lg:flex-row lg:items-end lg:justify-between">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-400">
                          Registration billing
                        </p>
                        <h2 className="mt-1 text-xl font-semibold text-slate-950">
                          Registration fee reporting
                        </h2>
                        <p className="mt-1.5 max-w-2xl text-xs leading-5 text-slate-500">
                          Review registration revenue trends, pending balances,
                          and field-level billing performance without leaving the
                          registrations workspace.
                        </p>
                      </div>

                      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                        {availableSeasons.length > 0 && (
                          <Select
                            value={selectedSeason}
                            onValueChange={setSelectedSeason}
                          >
                            <SelectTrigger className="h-8 w-full rounded-full border-stone-300 bg-white text-zinc-700 shadow-none sm:w-[180px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="current">Current Season</SelectItem>
                              {availableSeasons.map((season) => (
                                <SelectItem key={season.value} value={season.value}>
                                  {season.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        <label className="inline-flex h-8 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700">
                          <Checkbox
                            id="show-old-registration-fields"
                            checked={showOldFields}
                            onCheckedChange={(checked) =>
                              setShowOldFields(Boolean(checked))
                            }
                          />
                          <span>Show old fields</span>
                        </label>
                        <button
                          onClick={handleDownloadRegistrationBillingReport}
                          disabled={!registrationBillingData}
                          className="inline-flex h-8 items-center gap-2 rounded-full border border-stone-300 bg-white px-3.5 text-xs text-zinc-800 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50"
                          title="Download registration billing data as CSV"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Export active view
                        </button>
                      </div>
                    </div>

                    <div className="pt-4">
                      {registrationBillingLoading ? (
                        <div className="flex min-h-96 items-center justify-center">
                          <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                      ) : registrationBillingData ? (
                        <RegistrationReportData
                          data={registrationBillingData}
                          currency={club?.currency as string}
                          showOldFields={showOldFields}
                        />
                      ) : (
                        <div className="flex min-h-48 items-center justify-center rounded-[18px] border border-slate-200 bg-slate-50 text-sm text-muted-foreground">
                          No registration billing data available.
                        </div>
                      )}
                    </div>
                  </section>
                </div>
              </div>
            </section>
          </Tabs>
        </div>
      )}
      {hashUserId && (
        <RegistrationDialog
          clubName={club?.club_name ?? ""}
          selectedMember={selectedMember}
          setSelectedMember={setSelectedMember}
          currency={club?.currency ?? "ZAR"}
          clubAccountId={club?.club_account_id ?? ""}
        />
      )}
    </div>
  );
}
