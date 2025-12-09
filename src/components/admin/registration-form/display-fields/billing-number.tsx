import { Label } from "@/components/ui/label"
import { InputFormRegistration } from "@/interfaces/formRegistration"

interface Props {
  field: InputFormRegistration
}

export default function DisplayBillingNumber({ field }: Props) {
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

      <div className="flex items-center space-x-2 text-xs">
        <p>Is Required: {field.required ? "true" : "false"}</p>
      </div>
    </div>
  )
}
