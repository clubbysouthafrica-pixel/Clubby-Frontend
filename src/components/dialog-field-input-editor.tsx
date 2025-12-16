import { useEffect, useState } from "react"
import { Dialog, DialogTrigger, DialogContent, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { PencilIcon, XIcon } from "lucide-react"
import { InputBillingOption, InputDiscountOption, InputFormRegistration, PageFormRegistration } from "@/interfaces/formRegistration"
import { Label } from "./ui/label"
import { Input } from "./ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Checkbox } from "./ui/checkbox"
import EditTextDisplay from "./admin/registration-form/edit-fields/text-display"
import EditBillingText from "./admin/registration-form/edit-fields/billing-text"
import DisplayBillingText from "./admin/registration-form/display-fields/billing-text";
import EditBillingDropdown from './admin/registration-form/edit-fields/billing-dropdown';
import EditBillingDiscountDropdown from './admin/registration-form/edit-fields/billing-discount-dropdown';
import EditBillingNumber from './admin/registration-form/edit-fields/billing-number';
import DisplayBillingDropdown from "./admin/registration-form/display-fields/billing-dropdown"
import DisplayBillingDiscountDropdown from "./admin/registration-form/display-fields/billing-discount-dropdown"
import DisplayBillingNumber from "./admin/registration-form/display-fields/billing-number"
import EditStandardCheckbox from "./admin/registration-form/edit-fields/standard-checkbox"
import DisplayStandardCheckbox from "./admin/registration-form/display-fields/standard-checkbox"
import DisplayStandardText from "./admin/registration-form/display-fields/standard-text"
import StandardSignature from "./admin/registration-form/display-fields/standard-signature"
import EditStandardSignature from "./admin/registration-form/edit-fields/standard-signature"

interface Props {
    currency: string;
    field: InputFormRegistration
    allPages: PageFormRegistration[]
    update: (input: InputFormRegistration) => void
}

export default function FieldInputEditorDialog({ currency, field, allPages, update }: Props) {
    const [openDialog, setOpenDialog] = useState<boolean>(false);

    const [fieldText, setFieldText] = useState("")
    const [fieldName, setFieldName] = useState("")
    const [fieldId, setFieldId] = useState("")
    const [placeholder, setPlaceholder] = useState("")
    const [required, setRequired] = useState(false)
    const [editable_by_member, setEditable_by_member] = useState(false)
    const [multiplier, setMultiplier] = useState(false)
    const [phone_number_input, setPhoneNumberInput] = useState(false)
    const [dropdownOptionField, setDropdownOptionField] = useState("")
    const [amount, setAmount] = useState(0)

    const [dropdownBillingOptions, setDropdownBillingOptions] = useState<InputBillingOption[]>([])
    const [dropdownDiscountOptions, setDropdownDiscountOptions] = useState<InputDiscountOption[]>([])
    const [dropdownOptions, setDropdownOptions] = useState<string[]>([])

    useEffect(() => {
        setFieldName(field.field_name)
        setPlaceholder(field.placeholder)
        setRequired(field.required)
        setEditable_by_member(field.editable_by_member ?? false)
        setFieldId(field?.field_id ?? crypto.randomUUID())
        setFieldText(field?.field_text ?? "")
        setAmount(field?.amount ?? 0)
        setMultiplier(field?.multiplier ?? false)
        setPhoneNumberInput(field?.phone_number_input ?? false)

        if (field?.billingOptions?.length) {
            setDropdownBillingOptions(field.billingOptions)
        }
        if (field?.discountOptions?.length) {
            setDropdownDiscountOptions(field.discountOptions)
        }
        if (field?.options?.length) {
            setDropdownOptions(field.options)
        }
    }, [field])

    // Auto-disable editable_by_member when required is true ONLY for CHECKBOX fields
    useEffect(() => {
        if (required && field.input_type?.toUpperCase() === "CHECKBOX") {
            setEditable_by_member(false)
        }
    }, [required, field.input_type])

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
            multiplier: multiplier,
            editable_by_member: editable_by_member,
            phone_number_input: field.field_type === "STANDARD" && field.input_type?.toUpperCase() === "TEXT" ? phone_number_input : undefined,
        }

        if (field.input_type === "TEXT" && field.field_type === "BILLING") {
            inputRequest.amount = Number(amount);
        }

        if (dropdownBillingOptions.length > 0) {
            inputRequest.billingOptions = dropdownBillingOptions
        }

        if (dropdownDiscountOptions.length > 0) {
            inputRequest.discountOptions = dropdownDiscountOptions
        }

        if (dropdownOptions.length > 0) {
            inputRequest.options = dropdownOptions
        }

        update(inputRequest)
        setOpenDialog(false)
    }

    const handleAddBillingOption = (option: InputBillingOption) => {
        setDropdownBillingOptions(prev => [...prev, option])
    }

    const handleRemoveBillingOption = (id: string) => {
        setDropdownBillingOptions(prev => prev.filter(o => o.option_order_id !== id))
    }

    const handleAddDiscountOption = (option: InputDiscountOption) => {
        setDropdownDiscountOptions(prev => [...prev, option])
    }

    const handleRemoveDiscountOption = (id: string) => {
        setDropdownDiscountOptions(prev => prev.filter(o => o.option_order_id !== id))
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
                        field.input_type === "SIGNATURE" && field.field_type === "STANDARD" ?
                            <StandardSignature field={field} />
                            : field.input_type === "TEXT" && field.field_type === "BILLING" ?
                                <DisplayBillingText
                                    currency={currency} field={field}
                                />
                                : field.input_type === "DROPDOWN" && field.field_type === "BILLING" ?
                                    <DisplayBillingDropdown currency={currency} field={field} />
                                    : field.input_type === "NUMBER" && field.field_type === "BILLING" ?
                                        <DisplayBillingNumber field={field} />
                                    : field.input_type === "DISCOUNT" && field.field_type === "BILLING" ?
                                        <DisplayBillingDiscountDropdown field={field} />
                                    : field.input_type === "CHECKBOX" && field.field_type === "STANDARD" ?
                                        <DisplayStandardCheckbox field={field} />
                                        : field.input_type === "TEXT" && field.field_type === "STANDARD" ?
                                            <DisplayStandardText field={field} />
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
                                                                    return <SelectItem key={option} value={option}>{option}</SelectItem>
                                                                })}
                                                            </SelectGroup>
                                                        </SelectContent>
                                                    </Select>
                                                }
                                                {field.input_type !== "DISPLAY" && field.input_type ? (
                                                    <p className="text-xs mt-1">
                                                        Is Required: {field.required ? "true" : "false"}
                                                        {field.field_type === "STANDARD" && (field.input_type?.toUpperCase() === "TEXT" || field.input_type?.toUpperCase() === "NUMBER" || field.input_type?.toUpperCase() === "DROPDOWN" || field.input_type?.toUpperCase() === "CHECKBOX") && (
                                                            <> | Editable by Member: {field.editable_by_member ? "true" : "false"}</>
                                                        )}
                                                        {field.field_type === "STANDARD" && field.input_type?.toUpperCase() === "TEXT" && (
                                                            <> | Phone Number: {field.phone_number_input ? "true" : "false"}</>
                                                        )}
                                                    </p>
                                                ) : undefined}
                                            </div>
                    }
                    <Button>
                        <PencilIcon />
                    </Button>
                </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px] flex flex-col overflow-hidden">
                <div className="flex-1 pr-2">
                {
                    field.input_type === "SIGNATURE" ?
                        <EditStandardSignature
                            required={required}
                            fieldName={fieldName}
                            onFieldNameChange={setFieldName}
                            onRequiredChange={setRequired}
                        />
                        : field.field_type === "TEXT" ?
                            <EditTextDisplay
                                label="Field text"
                                value={fieldText}
                                onChange={setFieldText}
                            />
                            : field.input_type === "CHECKBOX" && field.field_type === "STANDARD" ?
                                <EditStandardCheckbox
                                    fieldName={fieldName}
                                    placeholder={placeholder}
                                    required={required}
                                    editable_by_member={editable_by_member}
                                    onFieldNameChange={setFieldName}
                                    onPlaceholderChange={setPlaceholder}
                                    onRequiredChange={setRequired}
                                    onEditable_by_memberChange={setEditable_by_member}
                                />
                                : field.input_type === "TEXT" && field.field_type === "BILLING" ?
                                    <EditBillingText
                                        currency={currency}
                                        fieldName={fieldName}
                                        amount={amount}
                                        onMultiplierChange={setMultiplier}
                                        multiplier={multiplier}
                                        required={required}
                                        onFieldNameChange={setFieldName}
                                        onAmountChange={setAmount}
                                        onRequiredChange={setRequired}
                                    />
                                    : field.input_type === "DROPDOWN" && field.field_type === "BILLING" ?
                                        <EditBillingDropdown
                                            currency={currency}
                                            fieldName={fieldName}
                                            placeholder={placeholder}
                                            required={required}
                                            dropdownBillingOptions={dropdownBillingOptions}
                                            // onMultiplierChange={setMultiplier}
                                            // multiplier={multiplier}
                                            onFieldNameChange={setFieldName}
                                            onPlaceholderChange={setPlaceholder}
                                            onRequiredChange={setRequired}
                                            onAddBillingOption={handleAddBillingOption}
                                            onRemoveBillingOption={handleRemoveBillingOption}
                                        />
                                        : field.input_type === "DISCOUNT" && field.field_type === "BILLING" ?
                                        <EditBillingDiscountDropdown
                                            fieldName={fieldName}
                                            placeholder={placeholder}
                                            required={required}
                                            discountOptions={dropdownDiscountOptions}
                                            allBillingFields={allPages.flatMap(p => p.fields.filter(f => f.field_type === "BILLING" && f.input_type !== "DISCOUNT"))}
                                            onFieldNameChange={setFieldName}
                                            onPlaceholderChange={setPlaceholder}
                                            onRequiredChange={setRequired}
                                            onAddDiscountOption={handleAddDiscountOption}
                                            onRemoveDiscountOption={handleRemoveDiscountOption}
                                        />
                                        : field.input_type === "NUMBER" && field.field_type === "BILLING" ?
                                        <EditBillingNumber
                                            fieldName={fieldName}
                                            placeholder={placeholder}
                                            required={required}
                                            onFieldNameChange={setFieldName}
                                            onPlaceholderChange={setPlaceholder}
                                            onRequiredChange={setRequired}
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
                                                {field.field_type === "STANDARD" && (field.input_type?.toUpperCase() === "TEXT" || field.input_type?.toUpperCase() === "NUMBER" || field.input_type?.toUpperCase() === "DROPDOWN" || field.input_type?.toUpperCase() === "CHECKBOX") && (
                                                    <div className="flex items-center gap-3 mt-4">
                                                        <Checkbox
                                                            checked={editable_by_member}
                                                            onCheckedChange={(checked: boolean) => setEditable_by_member(checked)}
                                                            disabled={required && field.input_type?.toUpperCase() === "CHECKBOX"}
                                                        />
                                                        <Label className={required && field.input_type?.toUpperCase() === "CHECKBOX" ? "text-gray-400" : ""}>Editable by member post registration</Label>
                                                    </div>
                                                )}
                                                {field.input_type?.toUpperCase() === "TEXT" && (
                                                    <div className="space-y-3 mt-4 border-t pt-4">
                                                        <Label className="text-sm font-semibold block">Field Validations</Label>
                                                        <div className="flex items-center gap-3">
                                                            <Checkbox
                                                                checked={phone_number_input}
                                                                onCheckedChange={(checked: boolean) => setPhoneNumberInput(checked)}
                                                            />
                                                            <Label>Validate as phone number</Label>
                                                        </div>
                                                    </div>
                                                )}
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
                </div>
                <DialogFooter className="flex-shrink-0 pt-4 border-t">
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button type="submit" onClick={updateRequest}>Update</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
