import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Field {
  field_id: string
  field_name: string
  field_type: string
  input_type: string
  placeholder?: string
  required?: boolean
  value?: string
}

interface StandardFieldInputProps {
  field: Field
  currentPageIndex: number
  pages: any[]
  setFieldValue: (
    pageIndex: number,
    fieldId: string,
    updater: (f: any) => any
  ) => void
}

export default function StandardText({
  field,
  currentPageIndex,
  pages,
  setFieldValue,
}: StandardFieldInputProps) {
  const isNumber = field.input_type?.toLowerCase() === "number"

  const onChange = (val: string) => {
    if (!isNumber || val === "" || /^[0-9]*$/.test(val)) {
      setFieldValue(
        pages[currentPageIndex].page_index,
        field.field_id,
        (f) => ({
          ...f,
          value: val,
        })
      )
    }
  }

  return (
    <div className="grid gap-3" key={field.field_id}>
      <Label htmlFor={field.field_id}>
        {field.field_name}{" "}
        {field.required ? <span className="text-red-500">*</span> : null}
      </Label>
      <Input
        id={field.field_id}
        type={isNumber ? "number" : "text"}
        placeholder={field.placeholder}
        value={field.value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        required={field.required}
      />
    </div>
  )
}
