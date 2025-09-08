import { useEffect, useState } from "react"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { PencilIcon, XIcon } from "lucide-react"
import { InputBillingOption, InputFormRegistration } from "@/interfaces/formRegistration"
import { Label } from "./ui/label"
import { Input } from "./ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Checkbox } from "./ui/checkbox"
import { v4 } from "uuid"
import { formatAmount } from "@/data/currencies"

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

    const [dropdownLabel, setDropdownLabel] = useState("")
    const [dropdownAmount, setDropdownAmount] = useState(0)
    const [dropdownBillingOptions, setDropdownBillingOptions] = useState<InputBillingOption[]>([])
    const [dropdownOptions, setDropdownOptions] = useState<string[]>([])

    useEffect(() => {
        setFieldName(field.field_name)
        setPlaceholder(field.placeholder)
        setRequired(field.required)
        setFieldId(field?.field_id ?? crypto.randomUUID())
        setFieldText(field?.field_text ?? "")

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

    const addBillingOptionDisabled = () => !!(!dropdownAmount || !dropdownLabel)
    const handleAddBillingOption = () => {
        if (addBillingOptionDisabled()) return

        const option: InputBillingOption = {
            option_order_id: v4(),
            amount: dropdownAmount,
            label: dropdownLabel
        }

        setDropdownBillingOptions(v => [...v, option])

        setDropdownAmount(0)
        setDropdownLabel("")
    }


    const handleRemoveBillingOption = (id: string) => {
        setDropdownBillingOptions(v => v.filter(v => v.option_order_id !== id))
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
                            isInputType() &&
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
                                            return <SelectItem key={option} value={option}>{option}</SelectItem>
                                        })}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        }
                        {field.input_type !== "DISPLAY" && field.input_type ? <p className="text-xs mt-1">Is Required: {field.required ? "true" : "false"} </p> : undefined}
                    </div>
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
                        <div>
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Field text
                                </label>
                                <Input
                                    required
                                    type="text"
                                    value={fieldText}
                                    onChange={(e) => setFieldText(e.target.value)}
                                />
                            </div>
                        </div>
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


                                {/* MEMBERSHIP DROPDOWN */}

                                {
                                    field.input_type?.toLowerCase() === "membership" && (
                                        <div>
                                            <label className="block text-sm font-medium my-4">
                                                Membership Options
                                            </label>
                                            <div className='flex space-x-2 items-end'>
                                                <div className='flex-1'>
                                                    <Label className="mb-2">Label</Label>
                                                    <Input
                                                        required
                                                        type="text"
                                                        placeholder='Enter dropdown value'
                                                        value={dropdownLabel}
                                                        onChange={(e) => setDropdownLabel(e.target.value)}
                                                    />
                                                </div>
                                                <div className='flex-1'>
                                                    <Label className="mb-2">Amount {formatAmount(dropdownAmount, field.currency)}</Label>
                                                    <Input
                                                        required
                                                        type="number"
                                                        placeholder='Enter dropdown amount'
                                                        value={dropdownAmount}
                                                        onChange={(e) => setDropdownAmount(Number(e.target.value))}
                                                    />
                                                </div>
                                                <Button variant={'outline'} disabled={addBillingOptionDisabled()} onClick={() => handleAddBillingOption()}>Add</Button>
                                            </div>
                                        </div>
                                    )
                                }
                                {field.input_type?.toLowerCase() === "membership" &&
                                    (dropdownBillingOptions?.length > 0) && (
                                        <div className="mt-2 space-y-1">
                                            {dropdownBillingOptions.map((option) => (
                                                <div key={option.option_order_id} className="flex items-center justify-between bg-gray-50 px-3 py-1 rounded-lg">
                                                    <span>{option.label} {formatAmount(option.amount, field.currency)}</span>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => handleRemoveBillingOption(option.option_order_id)}
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
