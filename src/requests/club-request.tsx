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

export interface ClubVariableRequest {
  name: string;
  key: string;
  visible: boolean;
}

export interface ClubDetailsRequest {
  club_account_id: string;
  auto_register_members_if_paid?: boolean;
  opening_times?: ClubOpeningTimesRequest[];
  bank_details?: ClubBankDetailsRequest;
  payfast_details?: ClubPayFastDetailsRequest;
  country_of_operation?: string;
  currency?: string;
  support_email?: string;
  club_url?: string;
  about_club?: string;
  facebook_url?: string;
  instagram_url?: string;
  hide_from_public?: boolean;
  enable_shop?: boolean;
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
