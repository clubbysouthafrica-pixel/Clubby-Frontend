import { PageFieldBase } from "@/components/club-onboard-form"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

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
        <Checkbox
          checked={!!field.value}
          onCheckedChange={(checked: any) =>
            setFieldValue(currentPageIndex, field.field_id, (f) => ({
              ...f,
              value: checked ? "true" : "",
            }))
          }
        />
      </div>
      <Label>{field.placeholder}</Label>
      {field.required && <span className="text-red-500">*</span>}
    </div>
  )
}
