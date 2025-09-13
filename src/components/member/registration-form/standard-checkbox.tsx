import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { PageFieldBase } from "@/types" 

interface Props {
  field: PageFieldBase
  currentPageIndex: number
  setFieldValue: (
    pageIndex: number,
    fieldId: string,
    updater: (f: PageFieldBase) => PageFieldBase
  ) => void
}

export default function StandardCheckbox({ field, currentPageIndex, setFieldValue }: Props) {
  return (
    <div className="flex items-center gap-2" key={field.field_id}>
      <div className="flex items-center gap-1">
        {field.required && <span className="text-red-500">*</span>}
        <Checkbox
          checked={!!field.value}
          onCheckedChange={(checked) =>
            setFieldValue(currentPageIndex, field.field_id, (f) => ({
              ...f,
              value: checked ? "true" : "",
            }))
          }
        />
      </div>
      <Label>{field.placeholder}</Label>
    </div>
  )
}
