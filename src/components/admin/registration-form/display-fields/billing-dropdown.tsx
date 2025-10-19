import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatAmount } from "@/data/currencies"

interface BillingOption {
  label: string
  amount: number
}

interface Field {
  field_name: string
  input_type: string
  required?: boolean;
  field_type: string
  placeholder?: string
  multiplier?: boolean
  multiplier_value?: number
  billingOptions?: BillingOption[]
}

interface BillingSelectProps {
  currency: string;
  field: Field
}

export default function DisplayBillingDropdown({ currency, field }: BillingSelectProps) {
  return (
    <div className="w-full">
      <Label className="flex justify-between mb-2">
        <p>{field.field_name}</p>
        <p className="text-gray-400 text-xs">
          {field.input_type} ({field.field_type})
        </p>
      </Label>
      <Select>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={field.placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {field.billingOptions?.map((option) => (
              <SelectItem key={option.label} value={option.label}>
                {option.label} ({formatAmount(option.amount, currency)})
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <div className="flex items-center space-x-2 text-xs">
        <p>Is Required: {field.required ? "true" : "false"}</p>
        <span className="text-gray-400">|</span>
        <p>Multiplier: {field.multiplier ? "true" : "false"}</p>
      </div>
    </div>
  )
}
