import { InputFormRegistration } from "@/interfaces/formRegistration"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Props {
    field: InputFormRegistration
}

export default function DisplayBillingDiscountDropdown({ field }: Props) {
    return (
        <div className='w-full'>
            <Label className='flex justify-between mb-2'>
                <p>{field.field_name}</p>
                <p className='text-gray-400 text-xs'>{field.input_type} (DISCOUNT)</p>
            </Label>
            <Select>
                <SelectTrigger className="w-full">
                    <SelectValue placeholder={field.placeholder} />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        {field.discountOptions?.map(option => (
                            <SelectItem key={option.option_order_id} value={option.option_order_id}>
                                {option.label} ({option.percentage}% off)
                            </SelectItem>
                        ))}
                    </SelectGroup>
                </SelectContent>
            </Select>
            <p className="text-xs mt-1">Is Required: {field.required ? "true" : "false"}</p>
        </div>
    )
}
