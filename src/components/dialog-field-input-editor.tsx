import { useEffect, useState } from "react"
import { Dialog, DialogTrigger, DialogContent, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { PencilIcon, XIcon } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { InputBillingOption, InputBillingProrataRule, InputFormRegistration, PageFormRegistration } from "@/interfaces/formRegistration"
import { formatProrataPercentage, hasOverlappingProrataRules, prorataRulesOverlap } from "@/lib/billing-prorata"
import { Label } from "./ui/label"
import { Input } from "./ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Checkbox } from "./ui/checkbox"
import EditTextDisplay from "./admin/registrations/registration-form/edit-fields/text-display"
import EditBillingText from "./admin/registrations/registration-form/edit-fields/billing-text"
import DisplayBillingText from "./admin/registrations/registration-form/display-fields/billing-text";
import EditBillingDropdown from './admin/registrations/registration-form/edit-fields/billing-dropdown';
import EditBillingNumber from './admin/registrations/registration-form/edit-fields/billing-number';
import DisplayBillingDropdown from "./admin/registrations/registration-form/display-fields/billing-dropdown"
import DisplayBillingNumber from "./admin/registrations/registration-form/display-fields/billing-number"
import EditStandardCheckbox from "./admin/registrations/registration-form/edit-fields/standard-checkbox"
import DisplayStandardCheckbox from "./admin/registrations/registration-form/display-fields/standard-checkbox"
import DisplayStandardText from "./admin/registrations/registration-form/display-fields/standard-text"
import StandardSignature from "./admin/registrations/registration-form/display-fields/standard-signature"
import EditStandardSignature from "./admin/registrations/registration-form/edit-fields/standard-signature"

function createEmptyProrataRule(): InputBillingProrataRule {
    return {
        id: crypto.randomUUID(),
        prorata_start_date: "",
        prorata_end_date: "",
        prorata_percentage: 0,
    }
}

interface Props {
    currency: string;
    field: InputFormRegistration
    allPages: PageFormRegistration[]
    update: (input: InputFormRegistration) => void
    openDialog?: boolean;
    setOpenDialog?: (open: boolean) => void;
}

export default function FieldInputEditorDialog({ currency, field, allPages, update, openDialog: externalOpenDialog, setOpenDialog: externalSetOpenDialog }: Props) {
    const [internalOpenDialog, setInternalOpenDialog] = useState<boolean>(false);
    
    // Use external state if provided, otherwise use internal state
    const openDialog = externalOpenDialog !== undefined ? externalOpenDialog : internalOpenDialog;
    const setOpenDialog = externalSetOpenDialog || setInternalOpenDialog;

    const [fieldText, setFieldText] = useState("")
    const [fieldName, setFieldName] = useState("")
    const [fieldId, setFieldId] = useState("")
    const [placeholder, setPlaceholder] = useState("")
    const [required, setRequired] = useState(false)
    const [editable_by_member, setEditable_by_member] = useState(false)
    const [multiplier, setMultiplier] = useState(false)
    const [phone_number_input, setPhoneNumberInput] = useState(false)
    const [sensitive_information, setSensitiveInformation] = useState(false)
    const [prorataEnabled, setProrataEnabled] = useState(false)
    const [prorataRules, setProrataRules] = useState<InputBillingProrataRule[]>([])
    const [pendingProrataRule, setPendingProrataRule] = useState<InputBillingProrataRule>(createEmptyProrataRule())
    const [prorataValidationError, setProrataValidationError] = useState("")
    
    // Check if this field exists in allPages (the original pages from the initial server response)
    // If it exists in allPages, it's an existing field from the database that should be locked
    // If it doesn't exist in allPages, it's a newly created field that can be edited
    const isExistingField = field?.field_id ? allPages.some(page => 
        page.fields.some(f => f.field_id === field.field_id)
    ) : false
    const [dropdownOptionField, setDropdownOptionField] = useState("")
    const [amount, setAmount] = useState(0)

    const [dropdownBillingOptions, setDropdownBillingOptions] = useState<InputBillingOption[]>([])
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
        setSensitiveInformation(field?.sensitive_information ?? false)
        setProrataEnabled(field?.prorata?.enabled ?? false)
        setProrataRules(
            field?.prorata?.rules?.length
                ? field.prorata.rules
                : [],
        )
        setPendingProrataRule(createEmptyProrataRule())
        setProrataValidationError("")

        if (field?.billingOptions?.length) {
            setDropdownBillingOptions(field.billingOptions)
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
        if (field.field_type === "BILLING" && prorataEnabled && hasOverlappingProrataRules(prorataRules)) {
            setProrataValidationError("Prorata date ranges cannot overlap.")
            return
        }

        const validProrataRules = prorataRules.filter(
            (rule) => rule.prorata_start_date && rule.prorata_end_date,
        )

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
            sensitive_information: (field.field_type === "STANDARD" && (field.input_type?.toUpperCase() === "TEXT" || field.input_type?.toUpperCase() === "NUMBER")) ? sensitive_information : undefined,
            prorata: field.field_type === "BILLING" && prorataEnabled && validProrataRules.length > 0
                ? {
                    enabled: true,
                    rules: validProrataRules,
                }
                : undefined,
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

    const addProrataRule = () => {
        if (!pendingProrataRule.prorata_start_date || !pendingProrataRule.prorata_end_date) return
        if (pendingProrataRule.prorata_percentage <= 0) return
        if (pendingProrataRule.prorata_end_date < pendingProrataRule.prorata_start_date) {
            setProrataValidationError("The prorata end date must be on or after the start date.")
            return
        }
        if (prorataRules.some(rule => prorataRulesOverlap(rule, pendingProrataRule))) {
            setProrataValidationError("Prorata date ranges cannot overlap.")
            return
        }

        setProrataRules(prev => [...prev, pendingProrataRule])
        setPendingProrataRule(createEmptyProrataRule())
        setProrataValidationError("")
    }

    const removeProrataRule = (id: string) => {
        setProrataRules(prev => prev.filter(rule => rule.id !== id))
        setProrataValidationError("")
    }

    return (
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            {externalSetOpenDialog && <DialogTrigger asChild><div className='hidden' /></DialogTrigger>}
            {!externalSetOpenDialog && <DialogTrigger asChild><div className='w-full space-x-2 flex items-center'>
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
                                                        {field.field_type === "STANDARD" && (field.input_type?.toUpperCase() === "TEXT" || field.input_type?.toUpperCase() === "NUMBER") && (
                                                            <> | Sensitive: {field.sensitive_information ? "true" : "false"}</>
                                                        )}
                                                    </p>
                                                ) : undefined}
                                            </div>
                    }
                    <Button>
                        <PencilIcon />
                    </Button>
                </div>
            </DialogTrigger>}
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
                                                {(field.input_type?.toUpperCase() === "TEXT" || field.input_type?.toUpperCase() === "NUMBER") && (
                                                    <div className="space-y-3 mt-4 border-t pt-4">
                                                        <Label className="text-sm font-semibold block">Field Settings</Label>
                                                        {field.input_type?.toUpperCase() === "TEXT" && (
                                                            <div className="flex items-center gap-3">
                                                                <Checkbox
                                                                    checked={phone_number_input}
                                                                    onCheckedChange={(checked: boolean) => setPhoneNumberInput(checked)}
                                                                />
                                                                <Label>Validate as phone number</Label>
                                                            </div>
                                                        )}
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <div className="flex items-center gap-3">
                                                                    <Checkbox
                                                                        checked={sensitive_information}
                                                                        onCheckedChange={(checked: boolean) => setSensitiveInformation(checked)}
                                                                        disabled={isExistingField}
                                                                    />
                                                                    <Label className={isExistingField ? "text-gray-400 cursor-not-allowed" : ""}>Contains sensitive information</Label>
                                                                </div>
                                                            </TooltipTrigger>
                                                            {isExistingField && (
                                                                <TooltipContent>
                                                                    <p>This setting cannot be changed after the field is created</p>
                                                                </TooltipContent>
                                                            )}
                                                        </Tooltip>
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
                                                        <div className={dropdownOptions.length > 5 ? "mt-2 space-y-1 max-h-[400px] overflow-y-auto" : "mt-2 space-y-1"}>
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
                {field.field_type === "BILLING" && (
                    <div className="mt-4 space-y-4 border-t pt-4">
                        <Label className="text-sm font-semibold block">Prorata</Label>
                        <div className="flex items-center gap-3">
                            <Checkbox
                                checked={prorataEnabled}
                                onCheckedChange={(checked: boolean) => {
                                    setProrataEnabled(checked)
                                    setProrataValidationError("")
                                    if (!checked) {
                                        setProrataRules([])
                                        setPendingProrataRule(createEmptyProrataRule())
                                    }
                                }}
                            />
                            <Label>Enable prorata deduction for this billing field</Label>
                        </div>

                        {prorataEnabled && (
                            <>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <Label className="block text-sm font-medium mb-2">Start date</Label>
                                        <Input
                                            type="date"
                                            value={pendingProrataRule.prorata_start_date}
                                            onChange={(e) => setPendingProrataRule(prev => ({ ...prev, prorata_start_date: e.target.value }))}
                                        />
                                    </div>
                                    <div>
                                        <Label className="block text-sm font-medium mb-2">End date</Label>
                                        <Input
                                            type="date"
                                            value={pendingProrataRule.prorata_end_date}
                                            onChange={(e) => setPendingProrataRule(prev => ({ ...prev, prorata_end_date: e.target.value }))}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-end gap-2">
                                    <div className="flex-1">
                                        <Label className="block text-sm font-medium mb-2">Deduction percentage</Label>
                                        <Input
                                            type="number"
                                            min="0"
                                            max="100"
                                            step="0.01"
                                            placeholder="e.g. 25"
                                            value={pendingProrataRule.prorata_percentage || ""}
                                            onChange={(e) => setPendingProrataRule(prev => ({
                                                ...prev,
                                                prorata_percentage: Number(e.target.value || 0),
                                            }))}
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={addProrataRule}
                                        disabled={!pendingProrataRule.prorata_start_date || !pendingProrataRule.prorata_end_date || pendingProrataRule.prorata_percentage <= 0}
                                    >
                                        Add
                                    </Button>
                                </div>

                                {prorataRules.length > 0 && (
                                    <div className="space-y-2">
                                        {prorataRules.map((rule) => (
                                            <div key={rule.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
                                                <span>
                                                    {formatProrataPercentage(rule.prorata_percentage)}% deduction from {rule.prorata_start_date} to {rule.prorata_end_date}
                                                </span>
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => removeProrataRule(rule.id)}
                                                >
                                                    <XIcon />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {prorataValidationError && (
                                    <p className="text-sm text-red-600">{prorataValidationError}</p>
                                )}
                            </>
                        )}
                    </div>
                )}
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
