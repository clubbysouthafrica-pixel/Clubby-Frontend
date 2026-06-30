import React, { useContext, useEffect, useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useFetchClubMembers } from "@/queries/admin/club-members";
import { ClubContext, ClubContextType } from "@/context/ClubContext";
import { Label } from "@/components/ui/label";
import SelectedMemberDialog from "@/components/admin/user-management/features/selected-member-dialog";
import {
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { ClubMember } from "@/interfaces/club";
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
import MembersTable from "@/components/admin/user-management/members_table";
import { Loader2, X, Download, AlertCircle, ChevronDown, ArrowLeft } from "lucide-react";
import { exportTableData } from "@/helpers/admin/members/csv-export";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { countryCodes, getDialingCode } from "@/data/country-codes";
import {
  MEMBER_PROFILE_COLUMNS,
  type MemberProfileColumn,
} from "@/helpers/admin/members/member-profile-columns";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function MembersPage() {
  const { club, isLoading: clubLoading } = useContext(
    ClubContext,
  ) as ClubContextType;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo")?.trim() ?? "";
  const returnLabel = searchParams.get("returnLabel")?.trim() ?? "members";
  const [requestedKeys, setRequestedKeys] = useState<string[]>([]);

  const [memberLimit, setMemberLimit] = useState(100);
  const [pageToken, setPageToken] = useState<string | undefined>(undefined);
  const [allRegisteredMembers, setAllRegisteredMembers] = useState<any[]>([]);
  const [allFilters, setAllFilters] = useState<any>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [memberNameFilter, setMemberNameFilter] = useState("");
  const [memberIdFilter, setMemberIdFilter] = useState("");
  const [appliedMemberNameFilter, setAppliedMemberNameFilter] = useState("");
  const [appliedMemberIdFilter, setAppliedMemberIdFilter] = useState("");
  const [memberType, setMemberType] = useState<string>("all");
  const [appliedMemberType, setAppliedMemberType] = useState<string>("");
  const [dynamicFilters, setDynamicFilters] = useState<Record<string, any>>({});
  const [filterCountryCodes, setFilterCountryCodes] = useState<Record<string, string>>({});
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
  const isLoadingMoreRef = useRef(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const {
    data: clubMembers,
    isLoading: clubMembersLoading,
    refetch: refetchClubMembers,
    error: clubMembersError,
  } = useFetchClubMembers(
    club?.club_account_id as string,
    requestedKeys.length > 0 ? requestedKeys : undefined,
    appliedMemberType || undefined,
    memberLimit,
    pageToken,
    appliedMemberNameFilter,
    appliedMemberIdFilter,
    appliedCustomFilters.length > 0 ? appliedCustomFilters : undefined,
    "members",
  );


  const [listActionItems, setlistActionItems] = useState<
    { email: string; name: string; timestamp?: string | number }[]
  >([]);
  const [allMembersSelected, setAllMembersSelected] = useState(false);
  const [dereigsterMembers, setDeregisterMembers] = useState<
    { user_id: string; name: string }[]
  >([]);
  const [selectedMember, setSelectedMember] = useState({});
  const [hashUserId, setHashUserId] = useState<string | null>(null);
  const [filterLoading, setFilterLoading] = useState(true);


  const [availableDynamicFilters, setAvailableDynamicFilters] = useState<
    {
      key: string;
      field_id?: string;
      field_name: string;
      type: string;
      input_type?: string;
      options?: string[];
    }[]
  >([]);
  const [activeFilterKeys, setActiveFilterKeys] = useState<string[]>([]);
  const [filtersDropdownOpen, setFiltersDropdownOpen] = useState(false);
  const [tempFilterKeys, setTempFilterKeys] = useState<string[]>([]);
  const [columnsDropdownOpen, setColumnsDropdownOpen] = useState(false);

  const [activeColumnKeysRegistered, setActiveColumnKeysRegistered] = useState<
    string[]
  >([]);
  const [appliedColumnKeysRegistered, setAppliedColumnKeysRegistered] =
    useState<string[]>([]);

  const sortableId = React.useId();

  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {}),
  );
  const setAllListActionItems = (members: ClubMember[]) => {

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
      const members = clubMembers.members || [];

      if (isLoadingMoreRef.current) {
        // Append new data when loading more
        setAllRegisteredMembers((prev) => [...prev, ...members]);
        isLoadingMoreRef.current = false;
        setIsLoadingMore(false);
      } else {
        // Replace data when starting fresh (filters changed, etc)
        setAllRegisteredMembers(members);
        setAllFilters(clubMembers.filters || null);
        setIsLoadingMore(false);
      }
      setFilterLoading(false);
    }
  }, [clubMembers, clubMembersError]);

  useEffect(() => {
    setAvailableDynamicFilters([
      ...MEMBER_PROFILE_COLUMNS,
      ...(allFilters || []),
    ]);

    if (allRegisteredMembers.length === 0) return;

    setFilterLoading(false);
  }, [allFilters, allRegisteredMembers]);

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
      if (fieldType === "billing:number") {
        inputType = "number";
        const filterObj = value as any;
        actualValue = String(filterObj.value || "");
        condition = filterObj.operator || filterConditions[key];
      } else if (fieldType === "member_profile") {
        if (filterDefinition?.input_type === "date") {
          inputType = "date";
          actualValue = String(value).replaceAll("-", "/");
        } else if (filterDefinition?.input_type === "phone") {
          inputType = "text";
          const phoneFilter =
            typeof value === "object" && value !== null
              ? (value as { countryCode?: string; value?: string })
              : { countryCode: filterCountryCodes[key] || "ZA", value: String(value || "") };
          const dialingCode = getDialingCode(phoneFilter.countryCode || filterCountryCodes[key] || "ZA");
          const phoneWithoutLeadingZero = String(phoneFilter.value || "")
            .replace(/\D/g, "")
            .replace(/^0+/, "");
          actualValue = phoneWithoutLeadingZero ? `${dialingCode}${phoneWithoutLeadingZero}` : "";
        } else {
          inputType = "text";
        }
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

      const filterObj: any = {
        field_id: fieldType === "member_profile" ? fieldId : `reg_field_${fieldId}`,
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
  }, [dynamicFilters, availableDynamicFilters, filterConditions, filterCountryCodes]);

  useEffect(() => {
    const allKeys = [
      ...new Set([...appliedColumnKeysRegistered]),
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
  }, [appliedColumnKeysRegistered, requestedKeys]);

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
    const memberIdFromQuery = searchParams.get("memberId")?.trim() ?? "";
    const memberNameFromQuery = searchParams.get("memberName")?.trim() ?? "";
    const memberTypeFromQuery = searchParams.get("memberType")?.trim() ?? "";

    if (!memberIdFromQuery && !memberNameFromQuery && !memberTypeFromQuery) {
      return;
    }

    setMemberIdFilter(memberIdFromQuery);
    setAppliedMemberIdFilter(memberIdFromQuery);
    setMemberNameFilter(memberNameFromQuery);
    setAppliedMemberNameFilter(memberNameFromQuery);
    setMemberType(memberTypeFromQuery || "all");
    setAppliedMemberType(memberTypeFromQuery === "all" ? "" : memberTypeFromQuery);
    setPageToken(undefined);
    isLoadingMoreRef.current = false;
    setIsLoadingMore(false);
    setlistActionItems([]);
    setDeregisterMembers([]);
    setAllMembersSelected(false);
  }, [searchParams]);

  useEffect(() => {
    const memberIdFromQuery = searchParams.get("memberId")?.trim() ?? "";

    if (!memberIdFromQuery || allRegisteredMembers.length === 0) {
      return;
    }

    const matchedMember = allRegisteredMembers.find(
      (member) => member.user_id === memberIdFromQuery,
    );

    if (!matchedMember) {
      return;
    }

    const selectedMemberUserId =
      selectedMember &&
      typeof selectedMember === "object" &&
      "user_id" in selectedMember &&
      typeof (selectedMember as ClubMember).user_id === "string"
        ? (selectedMember as ClubMember).user_id
        : null;

    if (
      selectedMemberUserId === memberIdFromQuery &&
      hashUserId === memberIdFromQuery
    ) {
      return;
    }

    setSelectedMember(matchedMember);
    setHashUserId(memberIdFromQuery);
  }, [allRegisteredMembers, hashUserId, searchParams, selectedMember]);

  const resetFilters = () => {
    setMemberNameFilter("");
    setMemberIdFilter("");
    setDynamicFilters({});
    setFilterCountryCodes({});
    setFilterConditions({});
    setAppliedCustomFilters([]);
    setActiveFilterKeys([]);
    setMemberType("all");
  };

  const handleDownloadRegisteredMembers = () => {
    const memberProfileCols = MEMBER_PROFILE_COLUMNS.filter((column: MemberProfileColumn) =>
      activeColumnKeysRegistered.includes(column.key),
    );
    const customCols =
      clubMembers?.filters?.filter((f: any) =>
        activeColumnKeysRegistered.includes(f.key),
      ) || [];

    exportTableData({
      members: allRegisteredMembers,
      tableName: "Active_Members",
      defaultColumns: ["Member Name", "Member ID", "Registered On"],
      customColumns: [...memberProfileCols, ...customCols],
    });
  };

  const selectedDirectoryMember =
    hashUserId &&
    selectedMember &&
    typeof selectedMember === "object" &&
    "user_id" in selectedMember &&
    typeof (selectedMember as ClubMember).user_id === "string"
      ? (selectedMember as ClubMember)
      : null;

  const handleBackToMembers = () => {
    if (returnTo) {
      navigate(returnTo, { replace: true });
      return;
    }

    setSelectedMember({});
    setHashUserId(null);
    const nextSearchParams = new URLSearchParams(searchParams.toString());
    nextSearchParams.delete("memberId");

    const nextSearch = nextSearchParams.toString();
    navigate(
      {
        pathname: window.location.pathname,
        search: nextSearch ? `?${nextSearch}` : "",
        hash: "",
      },
      { replace: true },
    );
  };

  const applyAll = async () => {
    setPageToken(undefined);
    isLoadingMoreRef.current = false;
    setIsLoadingMore(false);
    setAppliedMemberNameFilter(memberNameFilter);
    setAppliedMemberIdFilter(memberIdFilter);
    setAppliedMemberType(memberType === "all" ? "" : memberType);
    setAppliedColumnKeysRegistered(activeColumnKeysRegistered);
    setAppliedCustomFilters(computedCustomFilters);
    await refetchClubMembers();
  };

  return (
    <div
      className={`h-full ${selectedDirectoryMember ? "overflow-visible" : "overflow-x-hidden"} bg-white text-slate-900`}
    >
      {clubLoading ? (
        <div className="flex h-full items-center justify-center px-6">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            <p className="text-sm text-slate-500">Loading members...</p>
          </div>
        </div>
      ) : (
        <div
          className={`flex w-full flex-col gap-4 ${selectedDirectoryMember ? "overflow-visible" : ""} px-4 py-6 sm:px-6 md:px-8`}
        >
          <AnimatePresence mode="wait" initial={false}>
            {selectedDirectoryMember ? (
              <div className="flex flex-col gap-4">
                <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-white py-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBackToMembers}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {`Go back to ${returnLabel}`}
                  </Button>
                </div>
                <motion.div
                  key="member-detail"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.28, ease: "easeInOut" }}
                >
                  <SelectedMemberDialog selectedMember={selectedDirectoryMember} />
                </motion.div>
              </div>
            ) : (
              <motion.div
                key="members-overview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.28, ease: "easeInOut" }}
              >
                <div className="mb-2 flex flex-col gap-1">
                  <h1 className="text-2xl font-bold text-slate-900">Users</h1>
                  <p className="text-sm text-slate-500">
                    Search, filter, and manage all users.
                  </p>
                </div>

                <div className="border border-slate-100 bg-slate-50/60 px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <DropdownMenu open={columnsDropdownOpen} onOpenChange={setColumnsDropdownOpen}>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="h-9 gap-1.5 rounded-full border-slate-200 bg-white px-3.5 text-sm text-slate-700 hover:bg-slate-50">
                          Columns
                          {activeColumnKeysRegistered.length > 0 && (
                            <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-slate-700 px-1 text-[10px] font-bold text-white">
                              {activeColumnKeysRegistered.length}
                            </span>
                          )}
                          <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-52 p-1">
                        <div className="max-h-56 overflow-y-auto">
                          {MEMBER_PROFILE_COLUMNS.length > 0 ? (
                            MEMBER_PROFILE_COLUMNS.map(({ key, field_name }: MemberProfileColumn) => (
                              <DropdownMenuItem
                                key={key}
                                onSelect={(e) => e.preventDefault()}
                                onClick={() =>
                                  setActiveColumnKeysRegistered((prev) =>
                                    prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
                                  )
                                }
                                className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-xs"
                              >
                                <Checkbox
                                  checked={activeColumnKeysRegistered.includes(key)}
                                  className="pointer-events-none h-3.5 w-3.5"
                                />
                                {field_name}
                              </DropdownMenuItem>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-xs text-slate-400">No columns available</div>
                          )}
                        </div>
                        <div className="mt-1 border-t border-slate-100 pt-1">
                          <button
                            onClick={async () => {
                              await applyAll();
                              setColumnsDropdownOpen(false);
                            }}
                            className="w-full rounded-md bg-zinc-700 py-1.5 text-xs font-medium text-white transition hover:bg-zinc-800"
                          >
                            Apply
                          </button>
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>

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
                            { key: "__membership__", field_name: "Membership" },
                          ].map(({ key, field_name }) => (
                            <DropdownMenuItem
                              key={key}
                              onSelect={(e) => e.preventDefault()}
                              onClick={() =>
                                setTempFilterKeys((prev) =>
                                  prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
                                )
                              }
                              className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-xs"
                            >
                              <Checkbox checked={tempFilterKeys.includes(key)} className="pointer-events-none h-3.5 w-3.5" />
                              {field_name}
                            </DropdownMenuItem>
                          ))}
                          {availableDynamicFilters.length > 0 && (
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
                                  className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-xs"
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
                              if (!tempFilterKeys.includes("__membership__")) setMemberType("all");
                              setFiltersDropdownOpen(false);
                            }}
                            className="w-full rounded-md bg-zinc-700 py-1.5 text-xs font-medium text-white transition hover:bg-zinc-800"
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

                  {activeFilterKeys.length > 0 && (() => {
                    const dynamicActiveFilters = availableDynamicFilters.filter(({ key }) => activeFilterKeys.includes(key));
                    const sortedFilters = dynamicActiveFilters.sort((a, b) => {
                      const getType = (f: (typeof availableDynamicFilters)[0]) => {
                        if (!f.options) return 0;
                        if (f.options.length === 2 && f.options.includes("true") && f.options.includes("false")) return 2;
                        return 1;
                      };
                      return getType(a) - getType(b);
                    });

                    return (
                      <div className="mt-2 flex flex-col gap-1">
                        {activeFilterKeys.includes("__name__") && (
                          <div className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-slate-100/60">
                            <span className="w-32 shrink-0 text-xs font-medium text-slate-600">Member Name</span>
                            <Input placeholder="Filter by name" value={memberNameFilter} onChange={(e) => { setMemberNameFilter(e.target.value); setlistActionItems([]); setDeregisterMembers([]); setAllMembersSelected(false); }} className="h-8 flex-1 rounded-full border-slate-200 bg-white px-2.5 text-xs text-slate-700" />
                            <button onClick={() => { setMemberNameFilter(""); setActiveFilterKeys((prev) => prev.filter((k) => k !== "__name__")); }} className="rounded-full p-1 text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"><X className="h-3.5 w-3.5" /></button>
                          </div>
                        )}
                        {activeFilterKeys.includes("__id__") && (
                          <div className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-slate-100/60">
                            <span className="w-32 shrink-0 text-xs font-medium text-slate-600">Member ID</span>
                            <Input placeholder="Filter by ID" value={memberIdFilter} onChange={(e) => { setMemberIdFilter(e.target.value); setlistActionItems([]); setDeregisterMembers([]); setAllMembersSelected(false); }} className="h-8 flex-1 rounded-full border-slate-200 bg-white px-2.5 text-xs text-slate-700" />
                            <button onClick={() => { setMemberIdFilter(""); setActiveFilterKeys((prev) => prev.filter((k) => k !== "__id__")); }} className="rounded-full p-1 text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"><X className="h-3.5 w-3.5" /></button>
                          </div>
                        )}
                        {activeFilterKeys.includes("__membership__") && (
                          <div className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-slate-100/60">
                            <span className="w-32 shrink-0 text-xs font-medium text-slate-600">Membership</span>
                            <Select value={memberType} onValueChange={(v) => { setMemberType(v); setlistActionItems([]); setDeregisterMembers([]); setAllMembersSelected(false); }}>
                              <SelectTrigger className="h-8 flex-1 rounded-full border-slate-200 bg-white px-2.5 text-xs text-slate-700"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Members</SelectItem>
                                <SelectItem value="registered">Registered</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="previous">Deregistered</SelectItem>
                              </SelectContent>
                            </Select>
                            <button onClick={() => { setMemberType("all"); setActiveFilterKeys((prev) => prev.filter((k) => k !== "__membership__")); }} className="rounded-full p-1 text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"><X className="h-3.5 w-3.5" /></button>
                          </div>
                        )}
                        {sortedFilters.map(({ key, field_name, options, type, input_type }) => {
                          const removeFilter = () => {
                            setActiveFilterKeys((prev) => prev.filter((k) => k !== key));
                            setDynamicFilters((prev) => { const next = { ...prev }; delete next[key]; return next; });
                          };

                          if (type === "billing:number") {
                            const filterValue = (dynamicFilters[key] || {}) as { operator?: string; value?: string };
                            const operator = filterValue.operator || "gte";
                            const rawValue = filterValue.value || "";
                            const displayValue = rawValue ? formatAmount(parseInt(rawValue) || 0, club?.currency) : "";
                            return (
                              <div key={key} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-slate-100/60">
                                <span className="w-32 shrink-0 text-xs font-medium text-slate-600">{field_name}</span>
                                <div className="flex flex-1 items-center gap-2">
                                  <Select onValueChange={(newOperator) => { setDynamicFilters((prev) => ({ ...prev, [key]: { operator: newOperator, value: rawValue } })); setlistActionItems([]); setDeregisterMembers([]); setAllMembersSelected(false); }} value={operator}>
                                    <SelectTrigger className="h-8 w-[160px] rounded-full border-slate-200 bg-white px-2.5 text-xs text-slate-700"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="eq">Equal to</SelectItem>
                                      <SelectItem value="neq">Not equal to</SelectItem>
                                      <SelectItem value="gt">Greater than</SelectItem>
                                      <SelectItem value="gte">Greater or equal</SelectItem>
                                      <SelectItem value="lt">Less than</SelectItem>
                                      <SelectItem value="lte">Less or equal</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Input type="text" placeholder="Amount" value={displayValue} onChange={(e) => { const n = e.target.value.replace(/[^\d]/g, ""); setDynamicFilters((prev) => ({ ...prev, [key]: { operator, value: n } })); setlistActionItems([]); setDeregisterMembers([]); setAllMembersSelected(false); }} className="h-8 w-[120px] rounded-full border-slate-200 bg-white px-2.5 text-xs text-slate-700" />
                                </div>
                                <button onClick={removeFilter} className="rounded-full p-1 text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"><X className="h-3.5 w-3.5" /></button>
                              </div>
                            );
                          }

                          if (type === "member_profile" && input_type === "date") {
                            return (
                              <div key={key} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-slate-100/60">
                                <span className="w-32 shrink-0 text-xs font-medium text-slate-600">{field_name}</span>
                                <Input type="date" value={String(dynamicFilters[key] || "").replaceAll("/", "-")} onChange={(e) => { setDynamicFilters((prev) => ({ ...prev, [key]: e.target.value })); setlistActionItems([]); setDeregisterMembers([]); setAllMembersSelected(false); }} className="h-8 flex-1 rounded-full border-slate-200 bg-white px-2.5 text-xs text-slate-700" />
                                <button onClick={removeFilter} className="rounded-full p-1 text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"><X className="h-3.5 w-3.5" /></button>
                              </div>
                            );
                          }

                          if (type === "member_profile" && input_type === "phone") {
                            const phoneFilter = typeof dynamicFilters[key] === "object" && dynamicFilters[key] !== null
                              ? dynamicFilters[key] as { countryCode?: string; value?: string }
                              : { countryCode: filterCountryCodes[key] || "ZA", value: typeof dynamicFilters[key] === "string" ? dynamicFilters[key] as string : "" };
                            return (
                              <div key={key} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-slate-100/60">
                                <span className="w-32 shrink-0 text-xs font-medium text-slate-600">{field_name}</span>
                                <div className="flex flex-1 items-center gap-2">
                                  <Select value={phoneFilter.countryCode || filterCountryCodes[key] || "ZA"} onValueChange={(countryCode) => { setFilterCountryCodes((prev) => ({ ...prev, [key]: countryCode })); setDynamicFilters((prev) => ({ ...prev, [key]: { countryCode, value: phoneFilter.value || "" } })); setlistActionItems([]); setDeregisterMembers([]); setAllMembersSelected(false); }}>
                                    <SelectTrigger className="h-8 w-[110px] rounded-full border-slate-200 bg-white px-2.5 text-xs text-slate-700"><SelectValue /></SelectTrigger>
                                    <SelectContent>{countryCodes.map((c) => <SelectItem key={c.code} value={c.code}>{c.dialingCode} {c.code}</SelectItem>)}</SelectContent>
                                  </Select>
                                  <Input type="tel" placeholder="Phone number" value={phoneFilter.value || ""} onChange={(e) => { let v = e.target.value; if (v.startsWith("0") && v.length > 1) v = v.substring(1); if (v.replace(/\D/g, "").length <= 15) { setDynamicFilters((prev) => ({ ...prev, [key]: { countryCode: phoneFilter.countryCode || filterCountryCodes[key] || "ZA", value: v } })); setlistActionItems([]); setDeregisterMembers([]); setAllMembersSelected(false); } }} className="h-8 flex-1 rounded-full border-slate-200 bg-white px-2.5 text-xs text-slate-700" maxLength={20} />
                                </div>
                                <button onClick={() => { removeFilter(); setFilterCountryCodes((prev) => { const n = { ...prev }; delete n[key]; return n; }); }} className="rounded-full p-1 text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"><X className="h-3.5 w-3.5" /></button>
                              </div>
                            );
                          }

                          if (!options || options.length === 0) {
                            return (
                              <div key={key} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-slate-100/60">
                                <span className="w-32 shrink-0 text-xs font-medium text-slate-600">{field_name}</span>
                                <Input placeholder={`Filter by ${field_name}`} value={(dynamicFilters[key] as string) || ""} onChange={(e) => { setDynamicFilters((prev) => ({ ...prev, [key]: e.target.value })); setlistActionItems([]); setDeregisterMembers([]); setAllMembersSelected(false); }} className="h-8 flex-1 rounded-full border-slate-200 bg-white px-2.5 text-xs text-slate-700" />
                                <button onClick={removeFilter} className="rounded-full p-1 text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"><X className="h-3.5 w-3.5" /></button>
                              </div>
                            );
                          }

                          if (options.length === 2 && options.includes("true") && options.includes("false")) {
                            return (
                              <div key={key} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-slate-100/60">
                                <label htmlFor={key} className="w-32 shrink-0 cursor-pointer text-xs font-medium text-slate-600">{field_name}</label>
                                <Switch id={key} checked={dynamicFilters[key] === "true"} onCheckedChange={(checked) => { setDynamicFilters((prev) => ({ ...prev, [key]: checked ? "true" : "" })); setlistActionItems([]); setDeregisterMembers([]); setAllMembersSelected(false); }} />
                                <button onClick={removeFilter} className="ml-auto rounded-full p-1 text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"><X className="h-3.5 w-3.5" /></button>
                              </div>
                            );
                          }

                          return (
                            <div key={key} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-slate-100/60">
                              <span className="w-32 shrink-0 text-xs font-medium text-slate-600">{field_name}</span>
                              <Select onValueChange={(value) => { setDynamicFilters((prev) => ({ ...prev, [key]: value })); setlistActionItems([]); setDeregisterMembers([]); setAllMembersSelected(false); }} value={(dynamicFilters[key] as string) || ""}>
                                <SelectTrigger className="h-8 flex-1 rounded-full border-slate-200 bg-white px-2.5 text-xs text-slate-700"><SelectValue placeholder="All" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">All</SelectItem>
                                  {options.map((opt) => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                                </SelectContent>
                              </Select>
                              <button onClick={removeFilter} className="rounded-full p-1 text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"><X className="h-3.5 w-3.5" /></button>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}

                  {activeFilterKeys.length > 0 && (
                    <div className="mt-2 flex justify-end">
                      <button
                        onClick={applyAll}
                        className="h-8 rounded-full bg-zinc-700 px-4 text-xs font-medium text-white transition hover:bg-zinc-800"
                      >
                        Apply Filters
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-2">
                  {fetchError && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md flex items-center justify-between">
                      <p className="font-medium">{fetchError}</p>
                      <button onClick={() => setFetchError(null)} className="text-red-700 hover:text-red-900 font-bold">✕</button>
                    </div>
                  )}
                  {!fetchError && clubMembers?.pageToken && clubMembers.pageToken !== "" && (
                    <div className="mt-4 flex items-center justify-between border border-amber-300 bg-amber-50 px-4 py-3">
                      <div className="flex items-center gap-2 text-amber-900">
                        <AlertCircle className="h-4 w-4" />
                        <p className="text-sm font-medium">More results available</p>
                      </div>
                      <button
                        onClick={() => {
                          setAppliedMemberNameFilter(memberNameFilter);
                          setAppliedMemberIdFilter(memberIdFilter);
                          setAppliedColumnKeysRegistered(activeColumnKeysRegistered);
                          isLoadingMoreRef.current = true;
                          setIsLoadingMore(true);
                          setPageToken(clubMembers.pageToken);
                        }}
                        disabled={isLoadingMore}
                        className="h-8 rounded-full border border-amber-400 bg-amber-100 px-3 text-xs text-amber-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-50 flex items-center gap-2"
                      >
                        {isLoadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : "Load More"}
                      </button>
                    </div>
                  )}
                  {!fetchError && allRegisteredMembers.length === 0 && ((clubMembersLoading && !isLoadingMore) || filterLoading) ? (
                    <div className="flex justify-center items-center p-8 min-h-96">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : (
                    <div className="w-full min-w-0">
                      <MembersTable
                        clubId={club?.club_account_id || ""}
                        activeColumnKeys={appliedColumnKeysRegistered}
                        sensors={sensors}
                        sortableId={sortableId}
                        allMembersSelected={allMembersSelected}
                        listActionItems={listActionItems}
                        members={allRegisteredMembers}
                        dereigsterMembers={dereigsterMembers}
                        currency={club?.currency || ""}
                        memberLimit={memberLimit}
                        setAllListActionItems={setAllListActionItems}
                        setSelectedMember={setSelectedMember}
                        setlistActionItems={setlistActionItems}
                        setDeregisterMembers={setDeregisterMembers}
                        setAllMembersSelected={setAllMembersSelected}
                        onRemoveMembers={(memberIds) => {
                          setAllRegisteredMembers((prev) =>
                            prev.filter((member) => !memberIds.includes(member.user_id))
                          );
                        }}
                      />
                      <button
                        onClick={handleDownloadRegisteredMembers}
                        className="mt-4 p-2 w-fit bg-transparent cursor-pointer hover:bg-gray-100 transition rounded-md"
                        title="Download table data as CSV"
                      >
                        <Download className="h-5 w-5 text-green-600" />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
