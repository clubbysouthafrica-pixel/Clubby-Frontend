export interface RegistrationConfigurationRequest {
  club_account_id: string;
  send_qr_code_email_on_registration?: boolean;
  send_login_credentials_email_on_registration?: boolean;
}
