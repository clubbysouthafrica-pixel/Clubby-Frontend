import { Label } from "@/components/ui/label"
import { InputFormRegistration } from "@/interfaces/formRegistration"
import { formatAmount } from "@/data/currencies"

interface Props {
  field: InputFormRegistration
}

export default function DisplayBillingText({ currency, field }: Props) {
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
          {formatAmount(field.amount ?? 0, currency)}
        </p>
      </Label>
    </div>
  )
}
