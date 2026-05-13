import React, { useContext, useEffect, useState, useRef } from "react";
import { useFetchClubMembers } from "@/queries/admin/club-members";
import { ClubContext, ClubContextType } from "@/context/ClubContext";
import { Label } from "@/components/ui/label";
import SelectedMemberDialog from "@/components/admin/members/members/features/selected-member-dialog";
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
import MembersTable from "@/components/admin/members/members/members_table";
import { Loader2, X, Download, AlertCircle, Users } from "lucide-react";
import { exportTableData } from "@/helpers/admin/members/csv-export";
import { Card } from "@/components/ui/card";
import AddFiltersDialog from "@/components/admin/members/registrations/features/add-filters-dialog";
import AddColumnsDialog from "@/components/admin/members/registrations/features/add-columns-dialog";
import { countryCodes, getDialingCode } from "@/data/country-codes";
import {
  MEMBER_PROFILE_COLUMNS,
  type MemberProfileColumn,
} from "../../../../helpers/admin/members/member-profile-columns";
import { useSearchParams } from "react-router-dom";

export default function MembersPage() {
  const { club, isLoading: clubLoading } = useContext(
    ClubContext,
  ) as ClubContextType;
  const [searchParams] = useSearchParams();
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

  const [registeredMembersLength, setRegisteredMembersLength] =
    useState<number>(0);

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
  const [showFilterSelector, setShowFilterSelector] = useState(false);

  const [activeColumnKeysRegistered, setActiveColumnKeysRegistered] = useState<
    string[]
  >([]);
  const [appliedColumnKeysRegistered, setAppliedColumnKeysRegistered] =
    useState<string[]>([]);
  const [isAddColumnsOpen, setIsAddColumnsOpen] = useState(false);

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

    setRegisteredMembersLength(allRegisteredMembers.length);
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

  return (
    <div className="min-h-screen overflow-x-hidden bg-[linear-gradient(180deg,_#e7e5e4_0%,_#f5f5f4_22%,_#fafaf9_22%,_#fafaf9_100%)] text-slate-900">
      {clubLoading ? (
        <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(214,211,209,0.55),_transparent_32%),linear-gradient(180deg,_#e7e5e4_0%,_#f5f5f4_40%,_#fafaf9_100%)] px-6">
          <div className="flex flex-col items-center gap-4 rounded-[24px] border border-stone-300/70 bg-white/90 px-8 py-10 text-zinc-900 shadow-xl backdrop-blur">
            <Loader2 className="h-10 w-10 animate-spin text-zinc-500" />
            <p className="text-lg font-medium text-zinc-700">
              Loading members workspace...
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
                  <Users className="h-3.5 w-3.5 text-zinc-500" />
                  Member directory
                </div>
                <h1 className="text-xl font-semibold tracking-tight md:text-3xl">
                  Club members
                </h1>
                <p className="mt-1.5 max-w-2xl text-xs leading-5 text-zinc-600 md:text-sm">
                  Manage member records, apply profile filters, and review registration states from one workspace.
                </p>
              </div>
            </div>
          </section>

          <div className="flex w-full max-w-full min-w-0 flex-col justify-start gap-3 overflow-x-hidden">
            <Card className="max-w-full overflow-hidden rounded-[24px] border border-slate-200/70 bg-white/90 p-4 shadow-[0_16px_36px_rgba(15,23,42,0.07)] backdrop-blur md:p-5">
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
                <Select
                  value={memberType}
                  onValueChange={(value) => {
                    setMemberType(value);
                    setlistActionItems([]);
                    setDeregisterMembers([]);
                    setAllMembersSelected(false);
                  }}
                >
                  <SelectTrigger className="h-8 w-[300px] rounded-full bg-white text-xs text-slate-700">
                    <SelectValue placeholder="Select member type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Members</SelectItem>
                    <SelectItem value="registered">Registered</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="previous">Deregistered</SelectItem>
                  </SelectContent>
                </Select>
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
                          ({ key, field_name, options, type, input_type }) => {
                            // Handle billing:number type with comparison operators
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
                                  <div className="mb-2 flex items-center justify-between gap-2">
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
                                      className="h-8 w-[150px] rounded-full border-slate-200 bg-white text-xs text-slate-700"
                                    />
                                  </div>
                                </div>
                              );
                            }

                            if (type === "member_profile" && input_type === "date") {
                              return (
                                <div
                                  key={key}
                                  className="rounded-[18px] border border-slate-200 bg-slate-50/70 p-3"
                                >
                                  <div className="mb-2 flex items-center justify-between gap-2">
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
                                    type="date"
                                    value={String(dynamicFilters[key] || "").replaceAll("/", "-")}
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

                            if (type === "member_profile" && input_type === "phone") {
                              const phoneFilter =
                                typeof dynamicFilters[key] === "object" && dynamicFilters[key] !== null
                                  ? dynamicFilters[key]
                                  : {
                                      countryCode: filterCountryCodes[key] || "ZA",
                                      value: typeof dynamicFilters[key] === "string" ? dynamicFilters[key] : "",
                                    };

                              return (
                                <div
                                  key={key}
                                  className="rounded-[18px] border border-slate-200 bg-slate-50/70 p-3"
                                >
                                  <div className="mb-2 flex items-center justify-between gap-2">
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
                                        setFilterCountryCodes((prev) => {
                                          const newCodes = { ...prev };
                                          delete newCodes[key];
                                          return newCodes;
                                        });
                                      }}
                                      className="rounded-full p-1 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                  <div className="flex gap-2">
                                    <Select
                                      value={phoneFilter.countryCode || filterCountryCodes[key] || "ZA"}
                                      onValueChange={(countryCode) => {
                                        setFilterCountryCodes((prev) => ({
                                          ...prev,
                                          [key]: countryCode,
                                        }));
                                        setDynamicFilters((prev) => ({
                                          ...prev,
                                          [key]: {
                                            countryCode,
                                            value: phoneFilter.value || "",
                                          },
                                        }));
                                        setlistActionItems([]);
                                        setDeregisterMembers([]);
                                        setAllMembersSelected(false);
                                      }}
                                    >
                                      <SelectTrigger className="h-8 w-[130px] rounded-full bg-white text-xs text-slate-700">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {countryCodes.map((country) => (
                                          <SelectItem key={country.code} value={country.code}>
                                            {country.dialingCode} {country.code}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <Input
                                      type="tel"
                                      placeholder="Phone number"
                                      value={phoneFilter.value || ""}
                                      onChange={(e) => {
                                        let value = e.target.value;
                                        if (value.startsWith("0") && value.length > 1) {
                                          value = value.substring(1);
                                        }
                                        const digitsOnly = value.replace(/\D/g, "");
                                        if (digitsOnly.length <= 15) {
                                          setDynamicFilters((prev) => ({
                                            ...prev,
                                            [key]: {
                                              countryCode: phoneFilter.countryCode || filterCountryCodes[key] || "ZA",
                                              value,
                                            },
                                          }));
                                          setlistActionItems([]);
                                          setDeregisterMembers([]);
                                          setAllMembersSelected(false);
                                        }
                                      }}
                                      className="h-8 w-[148px] rounded-full border-slate-200 bg-white text-xs text-slate-700"
                                      maxLength={20}
                                    />
                                  </div>
                                </div>
                              );
                            }

                            if (!options) {
                              return (
                                <div
                                  key={key}
                                  className="rounded-[18px] border border-slate-200 bg-slate-50/70 p-3"
                                >
                                  <div className="mb-2 flex items-center justify-between gap-2">
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
                                    value={dynamicFilters[key] || ""}
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
                                  <div className="mb-2 flex items-center justify-between gap-2">
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
                                  <label htmlFor={key} className="ml-2 cursor-pointer text-sm font-medium">
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
                                <div className="mb-2 flex items-center justify-between gap-2">
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
                                  value={dynamicFilters[key] || ""}
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
                <AddColumnsDialog
                  open={isAddColumnsOpen}
                  onOpenChange={setIsAddColumnsOpen}
                  availableFields={MEMBER_PROFILE_COLUMNS}
                  activeColumnKeys={activeColumnKeysRegistered}
                  onColumnKeysChange={setActiveColumnKeysRegistered}
                  title="Add Member Columns"
                  description="Select which columns you want to display. After selecting, click the Run button below to apply these columns."
                />
              </div>
              {activeColumnKeysRegistered.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {activeColumnKeysRegistered.map((key) => {
                    const field =
                      MEMBER_PROFILE_COLUMNS.find((column: MemberProfileColumn) => column.key === key) ||
                      availableDynamicFilters?.find((f) => f.key === key);
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
                </div>
              )}
              <div className="mt-3 flex flex-col gap-3 border-t border-slate-200 pt-3 md:flex-row md:items-center md:justify-between">
                <p className="text-xs leading-5 text-slate-500">
                  Configure your filters and columns above, then click the <span className="font-semibold">Run</span> button to apply your selections and display the results.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-3">
                    <Label className="text-xs font-medium text-slate-600">Results per page:</Label>
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
                      isLoadingMoreRef.current = false;
                      setIsLoadingMore(false);
                      setAppliedMemberNameFilter(memberNameFilter);
                      setAppliedMemberIdFilter(memberIdFilter);
                      setAppliedMemberType(memberType === "all" ? "" : memberType);
                      setAppliedColumnKeysRegistered(activeColumnKeysRegistered);
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
            <div className="relative flex min-w-0 max-w-full flex-col gap-4 overflow-hidden">
              <Card className="max-w-full overflow-hidden rounded-[24px] border border-slate-200/70 bg-white/95 p-4 shadow-[0_16px_36px_rgba(15,23,42,0.07)] md:p-5">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold text-slate-950">
                    Members - Items returned (
                    {registeredMembersLength})
                  </h2>
                </div>
                {fetchError && (
                  <div className="flex items-center justify-between rounded-md border border-red-400 bg-red-100 px-4 py-3 text-red-700">
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
                (allRegisteredMembers.length === 0 &&
                  ((clubMembersLoading && !isLoadingMore) ||
                    filterLoading)) ? (
                  <div className="flex justify-center items-center p-8 min-h-96">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <div className="w-full max-w-full min-w-0 overflow-hidden">
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
                      setRegisteredMembersLength={setRegisteredMembersLength}
                      onRemoveMembers={(memberIds) => {
                        setAllRegisteredMembers((prev) =>
                          prev.filter((member) => !memberIds.includes(member.user_id))
                        );
                      }}
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
            </div>
          </div>
        </div>
      )}
      {hashUserId && (
        <SelectedMemberDialog
          selectedMember={selectedMember}
          setSelectedMember={setSelectedMember}
        />
      )}
    </div>
  );
}
