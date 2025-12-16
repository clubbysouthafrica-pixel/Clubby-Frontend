import { Label } from "@/components/ui/label"
import {
  Select,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Field {
  field_name: string
  field_type: string
  field_text?: string
  input_type?: string
  placeholder?: string
  required?: boolean
  editable_by_member?: boolean
  phone_number_input?: boolean
}

interface DropdownFieldProps {
  field: Field
}

export default function DisplayStandardText({ field }: DropdownFieldProps) {
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

      <Select>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={field.placeholder} />
        </SelectTrigger>
      </Select>

      <p className="text-xs mt-1">
        Is Required: {field.required ? "true" : "false"} | Editable by Member: {field.editable_by_member ? "true" : "false"} | Phone Number: {field.phone_number_input ? "true" : "false"}
      </p>
    </div>
  )
}
