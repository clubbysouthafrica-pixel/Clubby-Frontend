export interface DropdownBillingOption {
  label: string
  amount: number
  id: string
}

export interface Field {
  id: string;
  field_id: string;
  field_name: string;
  field_type: string;
  placeholder: string;
  currency?: string;
  amount?: number;
  input_type: string;
  required: boolean;
  options?: string[];
  billingOptions?: DropdownBillingOption[]
  value?: any
}
