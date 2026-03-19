import { PageFieldBase, FormPage } from "@/components/shared/registration/reusable-registration-form"
import { Checkbox } from "@/components/ui/checkbox"
import RequiredLabel from "./required-label"

interface Props {
  field: PageFieldBase
  currentPageIndex: number
  pages: FormPage[]
  setFieldValue: (
    pageIndex: number,
    fieldId: string,
    updater: (f: PageFieldBase) => PageFieldBase
  ) => void
}

export default function StandardCheckbox({
  field,
  currentPageIndex,
  pages,
  setFieldValue,
}: Props) {
  const label = field.field_name || field.placeholder || "Checkbox";
  const targetPageIndex = pages[currentPageIndex]?.page_index ?? currentPageIndex;

  return (
    <div className="flex items-start gap-3" key={field.field_id}>
      <Checkbox
        id={field.field_id}
        checked={!!field.value}
        onCheckedChange={(checked) =>
          setFieldValue(targetPageIndex, field.field_id, (f) => ({
            ...f,
            value: checked ? "true" : "",
          }))
        }
        className="mt-1 border-gray-300 rounded"
      />
      <RequiredLabel
        htmlFor={field.field_id}
        required={field.required}
        className="text-base font-normal text-gray-900 cursor-pointer leading-relaxed"
      >
        {label}
      </RequiredLabel>
    </div>
  )
}
