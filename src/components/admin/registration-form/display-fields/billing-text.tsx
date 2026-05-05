import { Label } from "@/components/ui/label"
import { InputFormRegistration } from "@/interfaces/formRegistration"
import { formatAmount } from "@/data/currencies"
import { formatProrataPercentage, getActiveProrataRule, getProratedAmount } from "@/lib/billing-prorata"

interface Props {
  currency: string
  field: InputFormRegistration
}

export default function DisplayBillingText({ currency, field }: Props) {
  const baseAmount = field.amount ?? 0
  const adjustedAmount = getProratedAmount(baseAmount, field)
  const activeProrataRule = getActiveProrataRule(field)

  return (
    <div className="w-full">
      <Label className="flex justify-between mb-2">
        <p>
          {field.field_type.toLowerCase() === "text"
            ? field.field_text
            : field.field_name}
        </p>
        <p className="text-gray-400 text-xs">
          {field.input_type} ({field.field_type})
        </p>
      </Label>

      <Label className="flex justify-between mb-2">
        <p className="text-gray-500 text-s">
          {formatAmount(adjustedAmount, currency)}
        </p>
      </Label>
      {activeProrataRule && adjustedAmount !== baseAmount && (
        <p className="mb-2 text-xs text-emerald-700">
          {formatProrataPercentage(activeProrataRule.prorata_percentage)}% prorata discount active from {activeProrataRule.prorata_start_date} to {activeProrataRule.prorata_end_date}. Reduced from {formatAmount(baseAmount, currency)}.
        </p>
      )}
      <div className="flex items-center space-x-2 text-xs">
        <p>Is Required: {field.required ? "true" : "false"}</p>
        <span className="text-gray-400">|</span>
        <p>Multiplier: {field.multiplier ? "true" : "false"}</p>
      </div>
    </div>
  )
}
