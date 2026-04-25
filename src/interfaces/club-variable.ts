export type ClubVariableRulesReset =
  | "none"
  | "year"
  | "field_year"
  | "mapped_field_year"
  | "district_year";

export interface ClubVariableRulesFieldMapping {
  fieldId?: string;
  field_id?: string;
  fieldLabel?: string;
  field_label?: string;
  token?: string;
  mappings?: Record<string, string>;
}

export interface ClubVariableRulesEngine {
  enabled: boolean;
  pattern: string;
  initialSequence?: number;
  initial_sequence?: number;
  reset?: ClubVariableRulesReset;
  resetFieldId?: string;
  reset_field_id?: string;
  fieldMappings?: ClubVariableRulesFieldMapping[];
  field_mappings?: ClubVariableRulesFieldMapping[];
  sourceFieldId?: string;
  districtFieldId?: string;
  mappings?: Record<string, string>;
}

export interface ClubVariable {
  name: string;
  key: string;
  visible: boolean;
  rules_engine?: ClubVariableRulesEngine;
}

export interface RegistrationDropdownField {
  fieldId: string;
  label: string;
  options: string[];
}