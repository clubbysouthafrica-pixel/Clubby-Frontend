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
import { formatProrataPercentage, getActiveProrataRule, getProratedAmount } from "@/lib/billing-prorata"

interface BillingOption {
  label: string
  amount: number
  multiplier?: boolean
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
  prorata?: {
    enabled?: boolean
    rules?: Array<{
      id?: string
      prorata_start_date: string
      prorata_end_date: string
      prorata_percentage: number
    }>
  }
}

interface BillingSelectProps {
  currency: string;
  field: Field
}

export default function DisplayBillingDropdown({ currency, field }: BillingSelectProps) {
  const activeProrataRule = getActiveProrataRule(field)

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
                <div className="flex items-center gap-2">
                  <span>
                    {option.label} <strong>({option.amount == 0 ? "FREE" : formatAmount(getProratedAmount(option.amount, field), currency)})</strong>
                  </span>
                  {option.multiplier && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Multiplier</span>}
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      {activeProrataRule && (
        <p className="mt-2 text-xs text-emerald-700">
          {formatProrataPercentage(activeProrataRule.prorata_percentage)}% prorata discount active on billing options.
        </p>
      )}
      <div className="flex items-center space-x-2 text-xs">
        <p>Is Required: {field.required ? "true" : "false"}</p>
      </div>
    </div>
  )
}
