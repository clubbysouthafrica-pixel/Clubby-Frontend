import { ClubMember } from "@/interfaces/club";
import { getMemberProfileColumnValue } from "@/helpers/admin/members/member-profile-columns";

interface CSVExportOptions {
  members: ClubMember[];
  tableName: string;
  defaultColumns: string[];
  customColumns?: any[];
}

export const generateCSVContent = (options: CSVExportOptions): string => {
  const { members, defaultColumns, customColumns = [] } = options;

  // Build header row
  const headers = [...defaultColumns];
  customColumns.forEach((column) => {
    headers.push(column.field_name);
  });

  // Build data rows
  const rows = members.map((member) => {
    const row: string[] = [];

    // Add default column values
    defaultColumns.forEach((column) => {
      let value = "";
      
      switch (column) {
        case "Member Name":
          value = `${member.member_first_name} ${member.member_surname}`;
          break;
        case "Member ID":
          value = member.user_id;
          break;
        case "Registered On":
          value = member.registered_on
            ? new Date(member.registered_on).toLocaleString()
            : "-";
          break;
        case "Registration Submitted On":
        case "Registration Submitted":
          value = member.registration_submitted_on
            ? new Date(member.registration_submitted_on).toLocaleString()
            : "-";
          break;
        case "Deregistered On":
          value = member.deregistered_on
            ? new Date(member.deregistered_on).toLocaleString()
            : "Previous season registration";
          break;
        case "Outstanding Amount":
          value = member.outstanding_amount?.toString() || "0";
          break;
        default:
          value = "";
      }

      row.push(`"${value.replace(/"/g, '""')}"`);
    });

    // Add custom column values
    customColumns.forEach((column) => {
      let value = "N/A";

      if (column.type === "billing") {
        const billingField = member.meta_billing?.find(
          (f: any) => f.field_name === column.field_name
        );
        value = billingField?.label_value || "N/A";
      }

      if (column.type === "billing:number") {
        const customField = member.meta_billing?.find(
          (f: any) => f.field_name === column.field_name
        );
        value = customField?.value || "N/A";
      }

      if (column.type === "standard") {
        const standardFields = Array.isArray(member.meta_standard)
          ? member.meta_standard
          : Object.values(member.meta_standard ?? {});
        const standardField = standardFields.find(
          (f: any) =>
            f.field_name === column.field_name ||
            f.field_id === column.field_id
        );
        value = standardField?.value || "N/A";
      }

      if (column.type === "club_variable") {
        const clubVariableKey = column.key?.startsWith("club_variable:")
          ? column.key.replace("club_variable:", "")
          : column.field_id || column.field_name;
        const clubVariables = Array.isArray(member.meta_club_variables)
          ? member.meta_club_variables
          : Object.values(member.meta_club_variables ?? {});
        const clubVariable = clubVariables.find(
          (f: any) =>
            f.name === clubVariableKey ||
            f.field_name === clubVariableKey ||
            f.field_name === column.field_name ||
            f.name === column.field_id
        );
        value = clubVariable?.value || "N/A";
      }

      if (column.type === "member_profile") {
        value = getMemberProfileColumnValue(member as ClubMember & Record<string, any>, column.key);
      }

      row.push(`"${value.toString().replace(/"/g, '""')}"`);
    });

    return row.join(",");
  });

  // Combine headers and rows
  const csvContent = [headers.map((h) => `"${h}"`).join(","), ...rows].join(
    "\n"
  );

  return csvContent;
};

export const downloadCSV = (content: string, filename: string) => {
  const element = document.createElement("a");
  const file = new Blob([content], { type: "text/csv;charset=utf-8;" });
  element.href = URL.createObjectURL(file);
  element.download = filename;
  element.style.display = "none";
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

export const exportTableData = (options: CSVExportOptions) => {
  const content = generateCSVContent(options);
  const timestamp = new Date().toISOString().split("T")[0];
  const filename = `${options.tableName}_${timestamp}.csv`;
  downloadCSV(content, filename);
};
