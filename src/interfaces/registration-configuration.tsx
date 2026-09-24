export interface RegistrationConfiguration {
  send_qr_code_email_on_registration?: boolean;
  send_login_credentials_email_on_registration?: boolean;
}

export interface RegistrationConfigurationResponse {
  club_account_id: string;
  configuration: RegistrationConfiguration;
}
