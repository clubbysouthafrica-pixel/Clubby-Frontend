import React, { useContext, useEffect, useState, useRef } from "react";
import { useFetchClubMembers } from "@/queries/admin/club-members";
import { ClubContext, ClubContextType } from "@/context/ClubContext";
import { Label } from "@/components/ui/label";

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
import { Loader2, X, Download, AlertCircle } from "lucide-react";
import { exportTableData } from "@/helpers/admin/members/csv-export";
import { Card } from "@/components/ui/card";

export default function MembersPage() {
  const { club, isLoading: clubLoading } = useContext(
    ClubContext,
  ) as ClubContextType;
  const [requestedKeys, setRequestedKeys] = useState<string[]>([]);

  const [memberLimit, setMemberLimit] = useState(25);
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
  const [, setSelectedMember] = useState({});
  const [filterLoading, setFilterLoading] = useState(true);

  const [registeredMembersLength, setRegisteredMembersLength] =
    useState<number>(0);

  const [availableDynamicFilters, setAvailableDynamicFilters] = useState<
    {
      key: string;
      field_id?: string;
      field_name: string;
      type: string;
      options: string[];
    }[]
  >([]);
  const [activeFilterKeys, setActiveFilterKeys] = useState<string[]>([]);

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
    } else if (clubMembers) {
      setFetchError(null);
      const members = clubMembers.members || [];

      if (isLoadingMoreRef.current) {
        // Append new data when loading more
        setAllRegisteredMembers((prev) => [...prev, ...members]);
        isLoadingMoreRef.current = false;
      } else {
        // Replace data when starting fresh (filters changed, etc)
        setAllRegisteredMembers(members);
        setAllFilters(clubMembers.filters || null);
      }
      setFilterLoading(false);
    }
  }, [clubMembers, clubMembersError]);

  useEffect(() => {
    if (allRegisteredMembers.length === 0) return;

    setAvailableDynamicFilters(allFilters);
    setFilterLoading(false);

    setRegisteredMembersLength(allRegisteredMembers.length);
  }, [allRegisteredMembers]);

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
        const filterObj = value as any;
        actualValue = String(filterObj.value || "");
        condition = filterObj.operator || filterConditions[key];
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
        field_id: `reg_field_${fieldId}`,
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
      ]),
    ];

    // Check if there are any new keys not in requestedKeys
    const newKeys = allKeys.filter((key) => !requestedKeys.includes(key));

    if (newKeys.length > 0) {
      // Merge new keys with previously requested keys
      const mergedKeys = [...new Set([...requestedKeys, ...newKeys])];
      setRequestedKeys(mergedKeys);
    } else if (allKeys.length === 0) {
      // If all keys removed, clear requested keys
      setRequestedKeys([]);
    }
  }, [
    appliedColumnKeysRegistered,
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

  const resetFilters = () => {
    setMemberNameFilter("");
    setMemberIdFilter("");
    setDynamicFilters({});
    setFilterConditions({});
    setAppliedCustomFilters([]);
    setActiveFilterKeys([]);
    setMemberType("all");
  };

  const handleDownloadRegisteredMembers = () => {
    const customCols =
      clubMembers?.filters?.filter((f: any) =>
        activeColumnKeysRegistered.includes(f.key),
      ) || [];

    exportTableData({
      members: allRegisteredMembers,
      tableName: "Active_Members",
      defaultColumns: ["Member Name", "Member ID", "Registered On"],
      customColumns: customCols,
    });
  };

  return (
    <div className="p-5">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Members</h1>
          <p className="text-muted-foreground">
            Manage your club's members.
          </p>
        </div>
      </div>
      <>
        {clubLoading ? (
          <div className="flex justify-center items-center p-8 min-h-96">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="w-full flex-col justify-start gap-1 mt-2">
            <Card className="p-4 flex flex-col gap-4">
              <div className="flex items-center">
                <p
                  className="text-blue-600 underline p-0 cursor-pointer"
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
                  className="w-[300px]"
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
                  className="w-[300px]"
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
                  <SelectTrigger className="w-[300px]">
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
                          ({ key, field_name, options, type }) => {
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
                                  className="border rounded-lg p-3 bg-white"
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
                                      className="p-0.5 hover:bg-gray-200 rounded"
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
                                      <SelectTrigger className="w-[200px] text-sm">
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

                            if (!options) {
                              return (
                                <div
                                  key={key}
                                  className="border rounded-lg p-3 bg-white"
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
                                      className="p-0.5 hover:bg-gray-200 rounded"
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
                                    className="w-[280px] text-sm"
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
                                  className="border rounded-lg p-3 bg-white"
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
                                      className="p-0.5 hover:bg-gray-200 rounded"
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
                                className="border rounded-lg p-3 bg-white"
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
                                    className="p-0.5 hover:bg-gray-200 rounded"
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
                                  <SelectTrigger className="w-[280px] text-sm">
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
              {activeColumnKeysRegistered.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {activeColumnKeysRegistered.map((key) => {
                    const field = availableDynamicFilters?.find(
                      (f) => f.key === key,
                    );
                    return (
                      <div
                        key={key}
                        className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                      >
                        {field?.field_name || key}
                        <button
                          onClick={() =>
                            setActiveColumnKeysRegistered((prev) =>
                              prev.filter((k) => k !== key),
                            )
                          }
                          className="ml-1 hover:text-blue-600 font-bold"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              <p className="text-sm text-gray-600 my-1">
                Configure your filters and columns above, then click the{" "}
                <span className="font-semibold">Run</span> button to apply your
                selections and display the results.
              </p>
              <button
                onClick={async () => {
                  setPageToken(undefined);
                  setAppliedMemberNameFilter(memberNameFilter);
                  setAppliedMemberIdFilter(memberIdFilter);
                  setAppliedMemberType(memberType === "all" ? "" : memberType);
                  setAppliedColumnKeysRegistered(activeColumnKeysRegistered);
                  setAppliedCustomFilters(computedCustomFilters);
                  await refetchClubMembers();
                }}
                title="Run database query to refresh members data"
                className="px-4 py-1 w-[100px] bg-orange-400 hover:bg-orange-500 rounded-[20px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center font-bold"
              >
                Run
              </button>
              <div className="flex items-center gap-3 pt-4 border-t">
                <Label className="text-sm font-medium">Results per page:</Label>
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
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </Card>
            <div className="relative flex flex-col gap-4 overflow-y-auto">
              <Card className="p-4 mt-2 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <h2 className="px-2 text-xl font-semibold">
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
                          isLoadingMoreRef.current = true;
                          setPageToken(clubMembers.pageToken);
                          setTimeout(() => refetchClubMembers(), 0);
                        }}
                        disabled={clubMembersLoading}
                        className="px-4 py-2 bg-orange-100 hover:bg-orange-200 cursor-pointer rounded-[20px] border border-black text-black font-semibold rounded-md hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {clubMembersLoading ? (
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
                  <div className="w-full">
                    <MembersTable
                      clubId={club?.club_account_id || ""}
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
        )}
      </>
    </div>
  );
}
