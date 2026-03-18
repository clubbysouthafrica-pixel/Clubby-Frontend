import { PageFieldBase } from "@/components/shared/registration/reusable-registration-form"
import { Checkbox } from "@/components/ui/checkbox"

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
  const label = field.field_name || field.placeholder || "Checkbox";

  return (
    <div className="flex items-start gap-3" key={field.field_id}>
      <Checkbox
        checked={!!field.value}
        onCheckedChange={(checked: any) =>
          setFieldValue(currentPageIndex, field.field_id, (f) => ({
            ...f,
            value: checked ? "true" : "",
          }))
        }
        className="mt-1 border-gray-300 rounded"
      />
      <label className="text-base font-normal text-gray-900 cursor-pointer leading-relaxed">
        {label}
      </label>
    </div>
  )
}
