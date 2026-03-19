import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import RequiredLabel from "./required-label";

interface Field {
  field_id: string;
  field_name: string;
  field_type: string;
  input_type: string;
  placeholder?: string;
  required?: boolean;
  value?: string | number;
  options?: string[];
}

interface StandardFieldInputProps {
  field: Field;
  currentPageIndex: number;
  pages: any[];
  setFieldValue: (
    pageIndex: number,
    fieldId: string,
    updater: (f: any) => any,
  ) => void;
}

export default function StandardDropdown({
  field,
  currentPageIndex,
  pages,
  setFieldValue,
}: StandardFieldInputProps) {
  const onChange = (val: string) => {
    // If "undefined" is selected, set value to undefined (empty)
    const valueToSet = val === "undefined" ? "" : val;
    setFieldValue(pages[currentPageIndex].page_index, field.field_id, (f) => ({
      ...f,
      value: valueToSet,
    }));
  };

  return (
    <div className="space-y-2 relative min-w-0" key={field.field_id}>
      <RequiredLabel htmlFor={field.field_id} required={field.required} className="block text-base font-medium text-gray-900">
        {field.field_name}
      </RequiredLabel>

      <Select
        onValueChange={onChange}
        value={typeof field.value === "string" && field.value ? field.value : "undefined"}
      >
        <SelectTrigger className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-base font-normal focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent">
          <SelectValue placeholder={field.placeholder ?? "Select an option"} />
        </SelectTrigger>

        <SelectContent
          className={`${(field.options?.length ?? 0) > 5 ? "max-h-[400px] overflow-y-auto" : ""} w-full max-w-full overflow-x-auto left-0 right-0`}
          style={{ minWidth: 0, maxWidth: "90vw" }}
        >
          <SelectGroup>
            <SelectItem value="undefined" className="text-gray-500">
              -- Select an option --
            </SelectItem>
            <SelectLabel className="text-gray-500/70">
              Options
            </SelectLabel>
            {field.options?.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
