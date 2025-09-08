import { Label } from "@/components/ui/label"
import { InputFormRegistration } from "@/interfaces/formRegistration"

interface Props {
  field: InputFormRegistration
}

export default function DisplayBillingText({ field }: Props) {
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
          R{field.amount ?? "0"}
        </p>
      </Label>
    </div>
  )
}
