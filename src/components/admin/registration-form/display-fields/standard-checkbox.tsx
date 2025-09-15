import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

interface Field {
  field_name: string
  input_type: string
  field_type: string
  placeholder?: string
  required?: boolean
}

interface CheckboxFieldProps {
  field: Field
}

export default function DisplayStandardCheckbox({ field }: CheckboxFieldProps) {
  return (
    <div className="w-full">
      <Label className="flex justify-between mb-2">
        <p>{field.field_name}</p>
        <p className="text-gray-400 text-xs">
          {field.input_type} ({field.field_type})
        </p>
      </Label>

      <div className="flex items-center gap-2">
        <Checkbox />
        <Label>{field.placeholder}</Label>
      </div>
      <p className="text-xs mt-1">
        Is Required: {field.required ? "true" : "false"}
      </p>
    </div>
  )
}
