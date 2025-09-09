import { useEffect, useState } from "react"
import { Dialog, DialogTrigger, DialogContent, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { PencilIcon, XIcon } from "lucide-react"
import { InputBillingOption, InputFormRegistration } from "@/interfaces/formRegistration"
import { Label } from "./ui/label"
import { Input } from "./ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Checkbox } from "./ui/checkbox"
import EditTextDisplay from "./admin/registration-form/edit-fields/text-display"
import EditBillingText from "./admin/registration-form/edit-fields/billing-text"
import DisplayBillingText from "./admin/registration-form/display-fields/billing-text";
import EditBillingDropdown from './admin/registration-form/edit-fields/billing-dropdown';
import BillingDropdown from "./admin/registration-form/display-fields/billing-dropdown"

interface Props {
    field: InputFormRegistration
    update: (input: InputFormRegistration) => void
}

export default function FieldInputEditorDialog({ field, update }: Props) {
    const [openDialog, setOpenDialog] = useState<boolean>(false);

    const [fieldText, setFieldText] = useState("")
    const [fieldName, setFieldName] = useState("")
    const [fieldId, setFieldId] = useState("")
    const [placeholder, setPlaceholder] = useState("")
    const [required, setRequired] = useState(false)
    const [dropdownOptionField, setDropdownOptionField] = useState("")
    const [amount, setAmount] = useState(0)

    // const [dropdownLabel, setDropdownLabel] = useState("")
    // const [dropdownAmount, setDropdownAmount] = useState(0)
    const [dropdownBillingOptions, setDropdownBillingOptions] = useState<InputBillingOption[]>([])
    const [dropdownOptions, setDropdownOptions] = useState<string[]>([])

    useEffect(() => {
        setFieldName(field.field_name)
        setPlaceholder(field.placeholder)
        setRequired(field.required)
        setFieldId(field?.field_id ?? crypto.randomUUID())
        setFieldText(field?.field_text ?? "")
        setAmount(field?.amount ?? 0)

        if (field?.billingOptions?.length) {
            setDropdownBillingOptions(field.billingOptions)
        }
        if (field?.options?.length) {
            setDropdownOptions(field.options)
        }
    }, [field])

    const isInputType = () => field.input_type?.toUpperCase() === "TEXT" ||
        field.input_type?.toUpperCase() === "NUMBER"

    const updateRequest = () => {
        const inputRequest: InputFormRegistration = {
            ...field,
            field_name: fieldName,
            field_text: fieldText,
            required: required,
            placeholder: placeholder,
            field_id: fieldId,
            amount: amount > 0 ? amount : undefined,
        }

        if (field.input_type === "TEXT" && field.field_type === "BILLING") {
            inputRequest.amount = Number(amount);
        }

        if (dropdownBillingOptions.length > 0) {
            inputRequest.billingOptions = dropdownBillingOptions
        }

        if (dropdownOptions.length > 0) {
            inputRequest.options = dropdownOptions
        }

        update(inputRequest)
        setOpenDialog(false)
    }

    // const addBillingOptionDisabled = () => !!(!dropdownAmount || !dropdownLabel)
    const handleAddBillingOption = (option: InputBillingOption) => {
        setDropdownBillingOptions(prev => [...prev, option])
    }


    const handleRemoveBillingOption = (id: string) => {
        setDropdownBillingOptions(prev => prev.filter(o => o.option_order_id !== id))
    }

    const addOption = () => {
        if (!dropdownOptionField) return

        setDropdownOptions(v => [...v, dropdownOptionField])
        setDropdownOptionField("")
    }

    const removeOption = (val: string) => {
        setDropdownOptions(v => v.filter(v => v !== val))
    }

    return (
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
                <div className='w-full space-x-2 flex items-center'>
                    {
                        field.input_type === "TEXT" && field.field_type === "BILLING" ?
                            <DisplayBillingText field={field} />
                            : field.input_type === "DROPDOWN" && field.field_type === "BILLING" ?
                                <BillingDropdown field={field} />
                                :
                                <div className='w-full'>
                                    <Label className='flex justify-between mb-2'>
                                        <p>{field.field_type.toLowerCase() === "text" ? field.field_text : field.field_name}</p>
                                        <p className='text-gray-400 text-xs'>{field.input_type} ({field.field_type})</p>
                                    </Label>
                                    {
                                        field.input_type?.toUpperCase() === "CHECKBOX" &&
                                        <Checkbox />
                                    }
                                    {
                                        isInputType() && field.input_type !== "TEXT" &&
                                        <Input placeholder={field.placeholder} type={field.input_type} disabled />
                                    }
                                    {
                                        (field.input_type?.toUpperCase() === "DROPDOWN" || field.input_type?.toUpperCase() === "MEMBERSHIP") &&
                                        <Select>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder={field.placeholder} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectGroup>
                                                    {field.options?.map(option => {
                                                        console.log('here ', option)
                                                        return <SelectItem key={option} value={option}>{option}</SelectItem>
                                                    })}
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                    }
                                    {field.input_type !== "DISPLAY" && field.input_type ? <p className="text-xs mt-1">Is Required: {field.required ? "true" : "false"} </p> : undefined}
                                </div>
                    }
                    <Button>
                        <PencilIcon />
                    </Button>
                </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                {/* <DialogHeader>
                    <DialogTitle>Edit {field.input_type} field</DialogTitle>
                </DialogHeader> */}
                {
                    field.input_type === "DISPLAY" ?
                        <EditTextDisplay
                            label="Field text"
                            value={fieldText}
                            onChange={setFieldText}
                            placeholder="Enter something..."
                        />
                        : field.input_type === "TEXT" && field.field_type === "BILLING" ?
                            <EditBillingText
                                fieldName={fieldName}
                                amount={amount}
                                required={required}
                                onFieldNameChange={setFieldName}
                                onAmountChange={setAmount}
                                onRequiredChange={setRequired}
                            />
                            : field.input_type === "DROPDOWN" && field.field_type === "BILLING" ?
                                <EditBillingDropdown
                                    fieldName={fieldName}
                                    required={required}
                                    dropdownBillingOptions={dropdownBillingOptions} // always pass parent state
                                    onFieldNameChange={setFieldName}
                                    onRequiredChange={setRequired}
                                    onAddBillingOption={handleAddBillingOption}
                                    onRemoveBillingOption={handleRemoveBillingOption}
                                />
                                : field.input_type ?
                                    <div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2">
                                                Field Name
                                            </label>
                                            <Input
                                                required
                                                type="text"
                                                value={fieldName}
                                                onChange={(e) => setFieldName(e.target.value)}
                                            />
                                        </div>
                                        {field.input_type?.toUpperCase() !== "CHECKBOX" &&
                                            <div className="mt-4">
                                                <label className="block text-sm font-medium mb-2">
                                                    Placeholder
                                                </label>
                                                <Input
                                                    required
                                                    type="text"
                                                    value={placeholder}
                                                    onChange={(e) => setPlaceholder(e.target.value)}
                                                />
                                            </div>
                                        }
                                        <div className="flex items-center gap-3 mt-4">
                                            <Checkbox
                                                checked={required}
                                                onCheckedChange={(checked: boolean) => setRequired(checked)}
                                            />
                                            <Label htmlFor="terms">Is required</Label>
                                        </div>
                                        {
                                            field.input_type?.toLowerCase() === "dropdown" && (
                                                <div className="mt-4">
                                                    <label className="block text-sm font-medium mb-2">
                                                        Dropdown Options
                                                    </label>
                                                    <div className='flex space-x-2'>
                                                        <Input
                                                            required
                                                            type="text"
                                                            placeholder='Enter dropdown value'
                                                            value={dropdownOptionField}
                                                            onChange={(e) => setDropdownOptionField(e.target.value)}
                                                        />
                                                        <Button variant={"outline"} disabled={!dropdownOptionField} onClick={addOption}>Add</Button>
                                                    </div>
                                                </div>
                                            )
                                        }

                                        {/* NORMAL DROPDOWN */}
                                        {field.input_type?.toLowerCase() === "dropdown" &&
                                            (dropdownOptions?.length > 0) && (
                                                <div className="mt-2 space-y-1">
                                                    {dropdownOptions.map((o) => (
                                                        <div key={o} className="flex items-center justify-between bg-gray-50 px-3 py-1 rounded-lg">
                                                            <span>{o}</span>
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                onClick={() => removeOption(o)}
                                                            >
                                                                <XIcon />
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                    </div> :
                                    <div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2">
                                                Field Text
                                            </label>
                                            <Input
                                                required
                                                type="text"
                                                value={fieldText}
                                                onChange={(e) => setFieldText(e.target.value)}
                                            />
                                        </div>
                                    </div>
                }
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button type="submit" onClick={updateRequest}>Update</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
