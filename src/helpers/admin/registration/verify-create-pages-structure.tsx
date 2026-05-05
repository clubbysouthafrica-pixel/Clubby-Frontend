import { PageFormRegistration } from "@/interfaces/formRegistration";

export function createPagesRequest(
    pages: PageFormRegistration[]
  ): PageFormRegistration[] {
  return pages.map((page, index) => ({
    ...page,
    page_index: index,
    fields: (page.fields ?? []).map((field) => {
      const {
        prorata_enabled: _prorataEnabled,
        prorata_start_date: _prorataStartDate,
        prorata_end_date: _prorataEndDate,
        prorata_percentage: _prorataPercentage,
        prorata_rules: _prorataRules,
        ...restField
      } = field as PageFormRegistration["fields"][number] & {
        prorata_enabled?: boolean;
        prorata_start_date?: string;
        prorata_end_date?: string;
        prorata_percentage?: number;
        prorata_rules?: unknown;
      };

      return {
        ...restField,
        prorata: field.field_type === "BILLING" && field.prorata?.enabled && (field.prorata?.rules?.length ?? 0) > 0
          ? {
            enabled: true,
            rules: field.prorata.rules,
          }
          : undefined,
      };
    }),
  }));
  }