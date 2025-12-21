import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface Field {
    field_id: string
    field_name: string
    field_type: string
    input_type: string
    placeholder?: string
    required?: boolean
    value?: string
    options?: string[]
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

export default function StandardDropdown({
    field,
    currentPageIndex,
    pages,
    setFieldValue,
}: StandardFieldInputProps) {
    const onChange = (val: string) => {
        // If "undefined" is selected, set value to undefined (empty)
        const valueToSet = val === "undefined" ? "" : val
        setFieldValue(
            pages[currentPageIndex].page_index,
            field.field_id,
            (f) => ({
                ...f,
                value: valueToSet,
            })
        )
    }

    return (
        <div className="grid gap-2" key={field.field_id}>
            <Label htmlFor={field.field_id}>
                {field.field_name}{" "}
                {field.required ? <span className="text-red-500">*</span> : null}
            </Label>


            <Select onValueChange={onChange} value={field.value || "undefined"}>
                <SelectTrigger className="w-full">
                    <SelectValue placeholder={field.placeholder ?? "Select an option"} />
                </SelectTrigger>

                <SelectContent>
                    <SelectGroup>
                        <SelectItem value="undefined" className="text-muted-foreground">
                            -- Select an option --
                        </SelectItem>
                        <SelectLabel className="text-muted-foreground/60">Options</SelectLabel>
                        {field.options?.map((opt) => (
                            <SelectItem key={opt} value={opt}>
                                {opt}
                            </SelectItem>
                        ))}
                    </SelectGroup>
                </SelectContent>
            </Select>
        </div>
    )
}
