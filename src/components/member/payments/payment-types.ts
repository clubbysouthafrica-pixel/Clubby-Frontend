export interface PaymentTransactionOption {
  transaction_id: string;
  type: string;
  outstanding_amount?: number;
  total_amount?: number;
  order_id?: string;
  event_id?: string;
  event_registration_id?: string;
  registration_id?: string;
  storage_id?: string;
}

export interface BankDetails {
  bank?: string;
  account_number?: string;
  branch_code?: string;
  account_type?: string;
  registration_payment_reference?: string;
  outstanding_amount?: number;
  transaction_options?: PaymentTransactionOption[];
}