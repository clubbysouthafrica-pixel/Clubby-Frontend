import { ClubVariable } from "@/interfaces/club-variable";
import { getRulesEngineFieldMappings } from "@/lib/club-variable-rules";

export interface ClubBankDetailsRequest {
  bank: string;
  account_number: string;
  branch_code: string;
  account_type: string;
}

export interface ClubPayFastDetailsRequest {
  merchant_id: string;
  merchant_key: string;
  passphrase?: string;
  auto_register_members_if_paid?: boolean;
}

export interface ClubLocationDetailsRequest {
  country: string;
}

export interface ClubOpeningTimesRequest {
  day: string;
  open: string;
  close: string;
  closed: boolean;
}

export interface ClubVariableRulesFieldMappingRequest {
  field_id: string;
  field_label?: string;
  token: string;
  mappings?: Record<string, string>;
}

export interface ClubVariableRulesEngineRequest {
  pattern: string;
  initial_sequence?: number;
  field_mappings?: ClubVariableRulesFieldMappingRequest[];
}

export interface ClubVariableRequest {
  name: string;
  key: string;
  visible: boolean;
  rules_engine?: ClubVariableRulesEngineRequest;
}

export function toClubVariableRequest(variable: ClubVariable): ClubVariableRequest {
  const rulesEngine = variable.rules_engine;
  const isRulesEngineEnabled =
    !!rulesEngine &&
    typeof rulesEngine === "object" &&
    (rulesEngine.enabled ?? true) === true;

  return {
    name: variable.name,
    key: variable.key,
    visible: variable.visible,
    rules_engine: isRulesEngineEnabled
      ? {
          pattern: rulesEngine.pattern,
          initial_sequence: Math.max(
            1,
            Number(rulesEngine.initialSequence ?? rulesEngine.initial_sequence ?? 1),
          ),
          field_mappings: getRulesEngineFieldMappings(rulesEngine).map((fieldMapping) => ({
            field_id: fieldMapping.fieldId,
            field_label: fieldMapping.fieldLabel,
            token: fieldMapping.token,
            mappings: fieldMapping.mappings,
          })),
        }
      : undefined,
  };
}

export interface ClubDetailsRequest {
  club_account_id: string;
  club_name?: string;
  auto_register_members_if_paid?: boolean;
  opening_times?: ClubOpeningTimesRequest[];
  bank_details?: ClubBankDetailsRequest;
  payfast_details?: ClubPayFastDetailsRequest;
  country_of_operation?: string;
  currency?: string;
  time_zone?: string;
  support_email?: string;
  club_url?: string;
  about_club?: string;
  facebook_url?: string;
  instagram_url?: string;
  hide_from_public?: boolean;
  enable_shop?: boolean;
  enable_events?: boolean;
  enable_storage?: boolean;
  venues_enabled?: boolean;
  registration_submission_email_template_body?: string;
  registration_submission_email_subject?: string;
  registration_success_email_template_body?: string;
  registration_success_email_subject?: string;
  use_success_email_template?: boolean;
  use_submission_email_template?: boolean;
  notify_on_member_registration?: boolean;
  club_variables?: ClubVariableRequest[];
}
