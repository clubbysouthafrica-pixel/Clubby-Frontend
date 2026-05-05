import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  PencilIcon,
  Tag,
  X,
} from "lucide-react";

import { useFetchMemberRegisteration } from "@/queries/registration-form";
import {
  fetchMemberRegistrationField,
  updateMemberRegistrationField,
} from "@/services/registration-form";
import { countryCodes, getDialingCode } from "@/data/country-codes";
import { cn } from "@/lib/utils";
import {
  getStandardFieldType,
  validateFieldValue,
} from "@/utils/fieldValidation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type VariableEntry = {
  name: string;
  value: string | number | boolean | null | undefined;
};

type MemberTag = {
  id: string;
  label: string;
  value: string;
};

type MemberFieldMetadata = {
  input_type: string;
  options?: string[];
  required?: boolean;
  placeholder?: string;
  editable_by_member?: boolean;
  phone_number_input?: boolean;
  sensitive_information?: boolean;
};

type RegistrationField = {
  type: string;
  label: string;
  value: string;
  input_type?: string;
  field_id?: string;
  signature_type?: string;
  quantity?: number;
  discount?: number;
  editable_by_member?: boolean;
  visible?: boolean;
};

function formatVariableName(name: string): string {
  return name
    .replace(/_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function formatMembershipLabel(membershipStatus: string) {
  if (membershipStatus === "Resubmission required") {
    return "Needs resubmission";
  }

  return membershipStatus;
}

function getMembershipTone(membershipStatus: string) {
  if (membershipStatus === "Resubmission required") {
    return {
      badgeClassName: "border-amber-200 bg-amber-50 text-amber-800",
      panelClassName: "border-amber-200 bg-amber-50/80 text-amber-900",
      description:
        "Your latest registration is no longer active. Review the submitted information below and resubmit where needed.",
    };
  }

  if (membershipStatus === "Pending") {
    return {
      badgeClassName: "border-sky-200 bg-sky-50 text-sky-800",
      panelClassName: "border-sky-200 bg-sky-50/80 text-sky-900",
      description:
        "Your submitted registration is waiting for club review. You can still inspect the details below and update fields that the club allows members to edit.",
    };
  }

  return {
    badgeClassName: "border-emerald-200 bg-emerald-50 text-emerald-800",
    panelClassName: "border-emerald-200 bg-emerald-50/80 text-emerald-900",
    description:
      "This is the latest registration the club has on file for your membership. Editable fields can still be updated directly from this view.",
  };
}

function formatTagValue(value: unknown) {
  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return "";
}

function parseBooleanLikeValue(value: unknown): boolean | null {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue = value.trim().toLowerCase();

  if (normalizedValue === "true" || normalizedValue === "yes") {
    return true;
  }

  if (normalizedValue === "false" || normalizedValue === "no") {
    return false;
  }

  return null;
}

function extractMemberTags(source: unknown): MemberTag[] {
  if (!source || typeof source !== "object") {
    return [];
  }

  const record = source as Record<string, unknown>;
  const rawTags = [
    record.registration_tags,
    record.registrationTags,
    record.member_tags,
    record.memberTags,
    record.tags,
  ].find(Array.isArray);

  if (!Array.isArray(rawTags)) {
    return [];
  }

  return rawTags
    .map((rawTag, index) => {
      if (typeof rawTag === "string") {
        const cleanedValue = rawTag.trim();

        if (!cleanedValue) {
          return null;
        }

        return {
          id: `member-tag-${index}`,
          label: cleanedValue,
          value: cleanedValue,
        } satisfies MemberTag;
      }

      if (!rawTag || typeof rawTag !== "object") {
        return null;
      }

      const tag = rawTag as Record<string, unknown>;
      const label = formatTagValue(tag.label ?? tag.name ?? tag.key);
      const value = formatTagValue(tag.value ?? tag.tag_value ?? tag.name ?? tag.label);
      const id = formatTagValue((tag.id ?? tag.key ?? label) || `member-tag-${index}`);

      if (!label || !value) {
        return null;
      }

      return {
        id,
        label,
        value,
      } satisfies MemberTag;
    })
    .filter((entry, index, entries): entry is MemberTag => {
      if (!entry) {
        return false;
      }

      return entries.findIndex((candidate) => candidate?.id === entry.id) === index;
    });
}

export function MemberRegistration({
  clubAccountId,
  clubName,
  currency,
  membershipStatus,
}: {
  clubAccountId: string;
  currency: string;
  clubName: string;
  membershipStatus: string;
}) {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isAdminNotesOpen, setIsAdminNotesOpen] = useState(true);
  const [isVariablesOpen, setIsVariablesOpen] = useState(false);
  const [isTagsOpen, setIsTagsOpen] = useState(true);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [countryCode, setCountryCode] = useState<string>("ZA");
  const [updatedFieldValues, setUpdatedFieldValues] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [loadingFieldId, setLoadingFieldId] = useState<string | null>(null);
  const [fieldMetadata, setFieldMetadata] = useState<Record<string, MemberFieldMetadata>>({});

  const { data, isLoading } = useFetchMemberRegisteration(clubAccountId, currency);

  const deregReason = useMemo(() => {
    if (typeof data === "object" && data !== null && "deregistration_reason" in data) {
      const value = (data as { deregistration_reason?: unknown }).deregistration_reason;

      if (typeof value === "string" && value.trim()) {
        return value;
      }
    }

    return undefined;
  }, [data]);

  const visiblePages = useMemo(() => {
    return (
      data?.pages?.filter((page: { fields: RegistrationField[] }) =>
        page.fields.some((field) => !(field.visible === false && !field.value)),
      ) ?? []
    );
  }, [data?.pages]);

  const visibleAdminNotes = useMemo(() => {
    if (!Array.isArray(data?.admin_notes)) {
      return [];
    }

    return data.admin_notes.filter((note: { visibleToMember?: boolean }) => note.visibleToMember);
  }, [data?.admin_notes]);

  const memberVariables = useMemo<VariableEntry[]>(() => {
    return Array.isArray(data?.variables) ? data.variables : [];
  }, [data?.variables]);

  const memberTags = useMemo(() => extractMemberTags(data), [data]);

  const membershipTone = getMembershipTone(membershipStatus);
  const currentPage = visiblePages[currentPageIndex];

  if (isLoading || !data) {
    return (
      <div className="flex min-h-[420px] items-center justify-center px-4 py-10">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleCancelEdit = () => {
    setEditingFieldId(null);
    setEditValue("");
  };

  const handleSave = async (field: RegistrationField) => {
    const metadata = fieldMetadata[field.label];

    setIsSaving(true);

    try {
      const fieldType = metadata?.input_type || "TEXT";
      const isPhoneNumber = metadata?.phone_number_input === true;
      const validationError = validateFieldValue(field.label, editValue, metadata);

      if (validationError) {
        toast.error(validationError, { duration: 3000 });
        setIsSaving(false);
        return;
      }

      let valueToSave = editValue;

      if (isPhoneNumber) {
        if (editValue.trim() === "") {
          valueToSave = "";
        } else {
          const dialingCode = getDialingCode(countryCode);
          const phoneWithoutLeadingZero = editValue.replace(/^0+/, "");
          valueToSave = `${dialingCode}${phoneWithoutLeadingZero}`;
        }
      }

      await updateMemberRegistrationField(
        data.registration_id,
        field.field_id || "",
        field.label,
        getStandardFieldType(fieldType),
        valueToSave,
        metadata?.sensitive_information,
      );

      setUpdatedFieldValues((previousValues) => ({
        ...previousValues,
        [field.label]: valueToSave,
      }));

      setEditingFieldId(null);
      toast.success(`${field.label} updated successfully`, { duration: 3000 });
    } catch (error) {
      console.error("Error updating field:", error);
      toast.error("Failed to update field", { duration: 3000 });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = async (field: RegistrationField) => {
    const existingMetadata = fieldMetadata[field.label];

    if (!existingMetadata && field.field_id) {
      setLoadingFieldId(field.label);

      try {
        const response = await fetchMemberRegistrationField(clubAccountId, field.field_id);
        const nextMetadata = response.field as MemberFieldMetadata;

        setFieldMetadata((previousValue) => ({
          ...previousValue,
          [field.label]: nextMetadata,
        }));

        const valueToSet = updatedFieldValues[field.label] ?? field.value;

        if (nextMetadata?.phone_number_input === true) {
          let phoneNumber = valueToSet;
          const sortedCodes = [...countryCodes].sort(
            (left, right) => right.dialingCode.length - left.dialingCode.length,
          );

          for (const country of sortedCodes) {
            if (valueToSet.startsWith(country.dialingCode)) {
              phoneNumber = valueToSet.substring(country.dialingCode.length);
              setCountryCode(country.code);
              break;
            }
          }

          setEditValue(phoneNumber);
        } else {
          setEditValue(valueToSet);
        }

        setEditingFieldId(field.label);
      } catch (error) {
        console.error("Error loading field metadata:", error);
        toast.error("Failed to load field", { duration: 2000 });
      } finally {
        setLoadingFieldId(null);
      }

      return;
    }

    const valueToSet = updatedFieldValues[field.label] ?? field.value;

    if (existingMetadata?.phone_number_input === true) {
      let phoneNumber = valueToSet;
      const sortedCodes = [...countryCodes].sort(
        (left, right) => right.dialingCode.length - left.dialingCode.length,
      );

      for (const country of sortedCodes) {
        if (valueToSet.startsWith(country.dialingCode)) {
          phoneNumber = valueToSet.substring(country.dialingCode.length);
          setCountryCode(country.code);
          break;
        }
      }

      setEditValue(phoneNumber);
    } else {
      setEditValue(valueToSet);
    }

    setEditingFieldId(field.label);
  };

  const renderEditableInput = (field: RegistrationField) => {
    const metadata = fieldMetadata[field.label];
    const inputType = metadata?.input_type || "TEXT";
    const options = metadata?.options || [];
    const isPhoneNumber = metadata?.phone_number_input === true;

    if (inputType === "DROPDOWN") {
      return (
        <Select
          value={editValue || "undefined"}
          onValueChange={(value) => setEditValue(value === "undefined" ? "" : value)}
        >
          <SelectTrigger className="w-full border-slate-200 bg-white text-sm shadow-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {!metadata?.required && (
              <SelectItem value="undefined" className="text-muted-foreground">
                -- Not Selected --
              </SelectItem>
            )}
            {options.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (inputType === "CHECKBOX") {
      return (
        <div className="flex min-h-11 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <Checkbox
            checked={parseBooleanLikeValue(editValue) === true}
            onCheckedChange={(checked) => setEditValue(checked ? "true" : "false")}
          />
          <span className="text-sm text-slate-700">{metadata?.placeholder || field.label}</span>
        </div>
      );
    }

    if (inputType === "NUMBER") {
      return (
        <Input
          autoFocus
          type="number"
          value={editValue}
          onChange={(event) => setEditValue(event.target.value)}
          className="border-slate-200 bg-white shadow-sm"
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              handleSave(field);
            } else if (event.key === "Escape") {
              handleCancelEdit();
            }
          }}
        />
      );
    }

    if (isPhoneNumber) {
      return (
        <div className="flex flex-col gap-3 md:flex-row">
          <Select value={countryCode} onValueChange={setCountryCode}>
            <SelectTrigger className="w-full border-slate-200 bg-white text-sm shadow-sm md:w-[160px]">
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
            autoFocus
            type="tel"
            value={editValue}
            onChange={(event) => {
              let nextValue = event.target.value;

              if (nextValue.startsWith("0") && nextValue.length > 1) {
                nextValue = nextValue.substring(1);
              }

              const digitsOnly = nextValue.replace(/\D/g, "");

              if (digitsOnly.length <= 15) {
                setEditValue(nextValue);
              }
            }}
            placeholder="Phone number"
            className="border-slate-200 bg-white shadow-sm"
            maxLength={20}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleSave(field);
              } else if (event.key === "Escape") {
                handleCancelEdit();
              }
            }}
          />
        </div>
      );
    }

    return (
      <Input
        autoFocus
        value={editValue}
        onChange={(event) => setEditValue(event.target.value)}
        className="border-slate-200 bg-white shadow-sm"
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            handleSave(field);
          } else if (event.key === "Escape") {
            handleCancelEdit();
          }
        }}
      />
    );
  };

  const renderFieldValue = (field: RegistrationField) => {
    const metadata = fieldMetadata[field.label];
    const displayValue = updatedFieldValues[field.label] ?? field.value;
    const booleanValue = parseBooleanLikeValue(displayValue);

    if (field.type === "STANDARD_SIGNATURE") {
      if (field.signature_type === "signature") {
        return (
          <img
            src={displayValue}
            alt="User signature"
            className="max-w-xs border-b-2 border-slate-400 pb-2"
          />
        );
      }

      return (
        <p className="border-b-2 border-slate-400 pb-2 font-[cursive] text-lg text-slate-700">
          {displayValue}
        </p>
      );
    }

    if (field.type === "STANDARD_OTHER") {
      if (editingFieldId === field.label) {
        return renderEditableInput(field);
      }

      const isCheckboxField =
        field.input_type === "CHECKBOX" || metadata?.input_type === "CHECKBOX";

      if (isCheckboxField || booleanValue !== null) {
        const checked = booleanValue === true;

        return (
          <div
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium",
              checked
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-rose-200 bg-rose-50 text-rose-700",
            )}
          >
            <span
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full border text-xs",
                checked
                  ? "border-emerald-500 bg-emerald-100 text-emerald-700"
                  : "border-rose-500 bg-rose-100 text-rose-700",
              )}
            >
              {checked ? "✓" : "✗"}
            </span>
            {checked ? "Yes" : "No"}
          </div>
        );
      }

      return <p className="text-sm leading-6 text-slate-700">{displayValue || "-"}</p>;
    }

    if (field.type === "BILLING") {
      return (
        <div className="space-y-2">
          <p className="text-sm font-medium leading-6 text-slate-800">{displayValue || "-"}</p>
          {field.discount ? (
            <Badge className="border-emerald-200 bg-emerald-50 text-emerald-800">
              {field.discount}% off
            </Badge>
          ) : null}
        </div>
      );
    }

    if (field.type === "TEXT") {
      const cleaned = field.label
        .replace(/<ol>(\s*<li[^>]*data-list="bullet"[^>]*>[\s\S]*?)<\/ol>/g, "<ul>$1</ul>")
        .replace(/<span class="ql-ui"[^>]*><\/span>/g, "");

      return (
        <div
          className="prose prose-sm max-w-none text-slate-700 [&_ol]:ml-5 [&_ol]:list-inside [&_ol]:list-decimal [&_ul]:ml-5 [&_ul]:list-inside [&_ul]:list-disc"
          dangerouslySetInnerHTML={{ __html: cleaned }}
        />
      );
    }

    if (field.type === "DNE") {
      return <p className="text-sm italic text-slate-500">Not filled in by member.</p>;
    }

    return <p className="text-sm leading-6 text-slate-700">{displayValue || "-"}</p>;
  };

  return (
    <div className="flex w-full flex-col items-center gap-4 bg-gradient-to-b from-gray-50 to-white px-3 py-4 lg:px-4 lg:gap-8 lg:py-10">
      <div className="w-full max-w-4xl">
        <Card className="overflow-hidden border-0 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.35)]">
          <CardHeader className="border-b border-slate-200 bg-white px-3 py-4 sm:px-6 sm:py-6 lg:px-10 lg:py-8">
            <div className="flex flex-col items-center gap-3 text-center sm:gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-lg font-semibold text-slate-700 shadow-sm sm:h-20 sm:w-20 sm:text-2xl">
                {clubName
                  .split(" ")
                  .map((word) => word[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Badge className={cn("border px-3 py-1 text-xs font-semibold", membershipTone.badgeClassName)}>
                  {formatMembershipLabel(membershipStatus)}
                </Badge>
                <CardTitle className="text-xl font-bold text-slate-950 sm:text-2xl lg:text-4xl">
                  {membershipStatus === "Resubmission required"
                    ? `Review registration for ${clubName}`
                    : `${clubName} registration`}
                </CardTitle>
                <CardDescription className="mx-auto max-w-2xl text-sm leading-5 text-slate-600 sm:leading-6 lg:text-base">
                  {membershipTone.description}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 bg-white px-3 py-3 sm:space-y-4 sm:px-6 sm:py-6 lg:px-10 lg:py-8">
            <div className={cn("rounded-2xl border px-3 py-3 sm:px-5 sm:py-4", membershipTone.panelClassName)}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold">Current registration status</p>
                  <p className="mt-1 text-sm leading-5 opacity-90 sm:leading-6">{membershipTone.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-left sm:min-w-[220px]">
                  <div className="rounded-xl border border-white/70 bg-white/70 px-3 py-2">
                    <p className="text-[11px] uppercase tracking-[0.18em] opacity-70">Pages</p>
                    <p className="mt-1 text-lg font-semibold">{visiblePages.length}</p>
                  </div>
                  <div className="rounded-xl border border-white/70 bg-white/70 px-3 py-2">
                    <p className="text-[11px] uppercase tracking-[0.18em] opacity-70">Notes</p>
                    <p className="mt-1 text-lg font-semibold">{visibleAdminNotes.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {deregReason ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-3 text-amber-950 sm:px-5 sm:py-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold">Why was this registration deregistered?</p>
                    <p className="whitespace-pre-wrap text-sm leading-5 text-amber-900/90 sm:leading-6">{deregReason}</p>
                  </div>
                </div>
              </div>
            ) : null}

            {memberTags.length > 0 ? (
              <section className="rounded-2xl border border-slate-200 bg-slate-50/70">
                <button
                  type="button"
                  onClick={() => setIsTagsOpen((currentValue) => !currentValue)}
                  className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left sm:gap-4 sm:px-5 sm:py-4"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Member tags</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Club-assigned tags and identifiers linked to this registration.
                    </p>
                  </div>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 text-slate-500 transition-transform",
                      isTagsOpen ? "rotate-180" : "rotate-0",
                    )}
                  />
                </button>
                {isTagsOpen ? (
                  <div className="border-t border-slate-200 px-3 py-3 sm:px-5 sm:py-4">
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {memberTags.map((tag) => (
                        <Badge
                          key={tag.id}
                          className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-700 shadow-sm"
                        >
                          <Tag className="h-3.5 w-3.5" />
                          {tag.label}: {tag.value}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null}
              </section>
            ) : null}

            {memberVariables.length > 0 ? (
              <section className="rounded-2xl border border-slate-200 bg-slate-50/70">
                <button
                  type="button"
                  onClick={() => setIsVariablesOpen((currentValue) => !currentValue)}
                  className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left sm:gap-4 sm:px-5 sm:py-4"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Additional information</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Extra club-managed information attached to your member profile.
                    </p>
                  </div>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 text-slate-500 transition-transform",
                      isVariablesOpen ? "rotate-180" : "rotate-0",
                    )}
                  />
                </button>
                {isVariablesOpen ? (
                  <div className="grid gap-2.5 border-t border-slate-200 px-3 py-3 sm:grid-cols-2 sm:px-5 sm:py-4">
                    {memberVariables.map((variable, index) => (
                      <div key={`${variable.name}-${index}`} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm sm:px-4 sm:py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          {formatVariableName(variable.name)}
                        </p>
                        <p className="mt-1.5 text-sm leading-5 text-slate-700 sm:mt-2 sm:leading-6">
                          {String(variable.value ?? "").trim() || "Does not exist for this member"}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </section>
            ) : null}

            {visibleAdminNotes.length > 0 ? (
              <section className="rounded-2xl border border-amber-200 bg-amber-50/60">
                <button
                  type="button"
                  onClick={() => setIsAdminNotesOpen((currentValue) => !currentValue)}
                  className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left sm:gap-4 sm:px-5 sm:py-4"
                >
                  <div>
                    <p className="text-sm font-semibold text-amber-950">Notes from club staff</p>
                    <p className="mt-1 text-sm text-amber-900/70">
                      Messages your club has chosen to make visible on your registration.
                    </p>
                  </div>
                  <Badge className="border-amber-200 bg-white text-amber-800">
                    {visibleAdminNotes.length}
                  </Badge>
                </button>
                {isAdminNotesOpen ? (
                  <div className="space-y-2.5 border-t border-amber-200 px-3 py-3 sm:space-y-3 sm:px-5 sm:py-4">
                    {visibleAdminNotes.map((note: { id: string; title: string; content: string }) => (
                      <div key={note.id} className="rounded-xl border border-amber-200 bg-white/80 px-3 py-2.5 shadow-sm sm:px-4 sm:py-3">
                        <p className="text-sm font-semibold text-amber-950">{note.title}</p>
                        <p className="mt-1.5 whitespace-pre-wrap text-sm leading-5 text-amber-900/85 sm:mt-2 sm:leading-6">
                          {note.content}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </section>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {currentPage ? (
        <div id="registration-page-card" className="w-full max-w-4xl">
          <Card className="overflow-hidden border-0 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.35)]">
            <CardHeader className="border-b border-slate-200 bg-white px-3 py-4 sm:px-6 sm:py-6 lg:px-10 lg:py-8">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between lg:gap-4">
                <div>
                  <CardDescription className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Submitted registration form
                  </CardDescription>
                  <CardTitle className="mt-1.5 text-xl font-bold text-slate-950 sm:mt-2 sm:text-2xl">
                    {currentPage.page_header}
                  </CardTitle>
                </div>
                {visiblePages.length > 1 ? (
                  <div className="text-sm text-slate-500">
                    Page {currentPageIndex + 1} of {visiblePages.length}
                  </div>
                ) : null}
              </div>
            </CardHeader>
            <CardContent className="bg-white px-3 py-3 sm:px-6 sm:py-6 lg:px-10 lg:py-8">
              <div className="space-y-3 sm:space-y-4">
                {currentPage.fields.map((field: RegistrationField, index: number) => {
                  if (field.visible === false && !field.value) {
                    return null;
                  }

                  const canEdit =
                    membershipStatus !== "Resubmission required" &&
                    field.field_id &&
                    (field.editable_by_member === true ||
                      fieldMetadata[field.label]?.editable_by_member === true) &&
                    field.visible !== false;

                  return (
                    <div
                      key={`${field.label}-${field.field_id || index}`}
                      className={cn(
                        "rounded-2xl border px-3 py-3 shadow-sm sm:px-5 sm:py-4",
                        field.type === "TEXT"
                          ? "border-none shadow-none"
                          : field.type === "BILLING"
                            ? "border-emerald-200 bg-emerald-50/40"
                            : field.type === "DNE"
                              ? "border-dashed border-slate-200 bg-slate-50"
                              : "border-slate-200 bg-slate-50/70",
                      )}
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-4">
                        <div className="min-w-0 flex-1 space-y-2.5 sm:space-y-3">
                          {field.type !== "TEXT" ? (
                            <div className="flex flex-wrap items-center gap-2">
                              <Label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                {field.label}
                                {field.type === "BILLING" && field.quantity ? ` (x${field.quantity})` : ""}
                              </Label>
                              {field.visible === false ? (
                                <Badge className="border-orange-200 bg-orange-50 text-orange-700">
                                  Removed from registration form
                                </Badge>
                              ) : null}
                            </div>
                          ) : null}
                          {renderFieldValue(field)}
                        </div>

                        {canEdit ? (
                          <div className="flex shrink-0 items-center gap-2 lg:ml-4">
                            {editingFieldId === field.label ? (
                              <>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                  onClick={() => handleSave(field)}
                                  disabled={isSaving}
                                >
                                  <Check className="mr-1 h-4 w-4" />
                                  Save
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                                  onClick={handleCancelEdit}
                                  disabled={isSaving}
                                >
                                  <X className="mr-1 h-4 w-4" />
                                  Cancel
                                </Button>
                              </>
                            ) : (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                                onClick={() => handleEdit(field)}
                                disabled={loadingFieldId === field.label}
                              >
                                {loadingFieldId === field.label ? (
                                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                                ) : (
                                  <PencilIcon className="mr-1 h-4 w-4" />
                                )}
                                Update
                              </Button>
                            )}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>

              {visiblePages.length > 1 ? (
                <div className="mt-5 flex flex-col gap-2.5 border-t border-slate-200 pt-4 sm:mt-8 sm:gap-3 sm:pt-6 sm:flex-row sm:items-center sm:justify-between">
                  {currentPageIndex > 0 ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 border-slate-200 bg-white px-3 text-sm text-slate-700 hover:bg-slate-50"
                      onClick={() => {
                        setCurrentPageIndex((value) => value - 1);
                        document.getElementById("registration-page-card")?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                      }}
                    >
                      <ChevronLeft className="mr-1 h-4 w-4" />
                      Previous
                    </Button>
                  ) : (
                    <div className="hidden sm:block" />
                  )}

                  <div className="text-center text-sm text-slate-500">
                    Page {currentPageIndex + 1} of {visiblePages.length}
                  </div>

                  {currentPageIndex < visiblePages.length - 1 ? (
                    <Button
                      type="button"
                      className="h-9 bg-black px-3 text-sm text-white hover:bg-slate-900"
                      onClick={() => {
                        setCurrentPageIndex((value) => value + 1);
                        document.getElementById("registration-page-card")?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                      }}
                    >
                      Next
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  ) : (
                    <div className="hidden sm:block" />
                  )}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
