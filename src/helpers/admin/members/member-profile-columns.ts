import { ClubMember } from "@/interfaces/club";

export type MemberProfileColumn = {
  key: string;
  field_id: string;
  field_name: string;
  type: "member_profile";
  input_type?: "text" | "date" | "phone";
  options?: string[];
};

export const MEMBER_PROFILE_COLUMNS: MemberProfileColumn[] = [
  { key: "phone_number", field_id: "phone_number", field_name: "Phone Number", type: "member_profile", input_type: "phone" },
  { key: "date_of_birth", field_id: "date_of_birth", field_name: "Date of Birth", type: "member_profile", input_type: "date" },
  { key: "address_line_1", field_id: "address_line_1", field_name: "Address Line 1", type: "member_profile", input_type: "text" },
  { key: "address_line_2", field_id: "address_line_2", field_name: "Address Line 2", type: "member_profile", input_type: "text" },
  { key: "suburb", field_id: "suburb", field_name: "Suburb", type: "member_profile", input_type: "text" },
  { key: "city", field_id: "city", field_name: "City", type: "member_profile", input_type: "text" },
  { key: "postal_code", field_id: "postal_code", field_name: "Postal Code", type: "member_profile", input_type: "text" },
  { key: "country", field_id: "country", field_name: "Country", type: "member_profile", input_type: "text" },
];

const MEMBER_PROFILE_FIELD_ALIASES: Record<string, string[]> = {
  phone_number: ["phone_number", "phone number"],
  date_of_birth: ["date_of_birth", "date of birth"],
  address_line_1: ["address_line_1", "address line 1", "address 1"],
  address_line_2: ["address_line_2", "address line 2", "address 2"],
  suburb: ["suburb"],
  city: ["city"],
  postal_code: ["postal_code", "postal code", "postcode"],
  country: ["country"],
};

function normalizeFieldKey(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
}

export function getMemberProfileColumnValue(
  member: ClubMember & Record<string, any>,
  columnKey: string,
) {
  const directValue = member[columnKey];

  if (directValue !== undefined && directValue !== null && directValue !== "") {
    return String(directValue);
  }

  const standardFields = Array.isArray(member.meta_standard)
    ? member.meta_standard
    : Object.values(member.meta_standard ?? {});
  const aliases = MEMBER_PROFILE_FIELD_ALIASES[columnKey] ?? [columnKey];

  const matchedField = standardFields.find((field: any) => {
    const candidateKeys = [field?.field_id, field?.field_name, field?.name]
      .filter(Boolean)
      .map((value: string) => normalizeFieldKey(value));

    return aliases.some((alias) => candidateKeys.includes(normalizeFieldKey(alias)));
  });

  if (matchedField?.value !== undefined && matchedField?.value !== null && matchedField?.value !== "") {
    return String(matchedField.value);
  }

  if (
    matchedField?.label_value !== undefined &&
    matchedField?.label_value !== null &&
    matchedField?.label_value !== ""
  ) {
    return String(matchedField.label_value);
  }

  return "N/A";
}