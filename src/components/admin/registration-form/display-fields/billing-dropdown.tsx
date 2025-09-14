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
  field_type: string
  placeholder?: string
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
      <p className="text-xs mt-1">
        Is Required: {field.required ? "true" : "false"}
      </p>
    </div>
  )
}
