import React, { useEffect, useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DndContext,
  DragEndEvent,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { v4 as uuidv4 } from 'uuid';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Loader2, MenuIcon, XIcon } from 'lucide-react';
import { useFetchRegisterationForm } from '@/queries/admin/registration-form';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from './ui/select';
import { DropdownBillingOption, Field } from '@/interfaces/field';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { TabsContent } from '@radix-ui/react-tabs';
import { Card } from './ui/card';
import { currencies, formatAmount } from '@/data/currencies';

function SortableItem({ id, children }: { id: string; children: React.ReactNode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="rounded-lg p-2 bg-white">
      <div className="flex items-center space-x-2">
        {/* Drag handle */}
        <div {...attributes} {...listeners} className="cursor-move select-none text-lg px-2">
          <MenuIcon/>
        </div>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}

interface FormBuilderProps {
  clubAccountId: string
  fields: Field[],
  deletedFields: string[],
  setFields: React.Dispatch<React.SetStateAction<Field[]>>
  setDeletedFields: React.Dispatch<React.SetStateAction<string[]>>
}

export default function FormBuilder({ clubAccountId, fields, setFields, deletedFields, setDeletedFields }: FormBuilderProps) {
  if (!clubAccountId) return

  const [dropdownOptionField, setDropdownOptionField] = useState('')

  const [dropdownBillingOptionLabel, setDropdownBillingOptionLabel] = useState('')
  const [dropdownBillingOptionValue, setDropdownBillingOptionValue] = useState(0)

  const [fieldItemType, setFieldItemType] = useState('')
  const [openItem, setOpenItem] = useState<string>('');

  const {data, isLoading } = useFetchRegisterationForm(clubAccountId)

  useEffect(() => {
    if (data?.items) {
      data.items = data.items.map((i: Field) => ({ ...i, id: i.id ?? uuidv4() }))

      setFields(data.items);
    }
  }, [data]);

  const addField = (fieldType: string) => {
    setFields([
      ...fields,
      {
        id: uuidv4(),
        field_name: `Field ${fields.length + 1}`,
        input_type: fieldItemType.toUpperCase(),
        placeholder: 'Default placeholder',
        field_type: fieldType,
        required: true,
      },
    ]);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = fields.findIndex((f) => f.id === active.id);
      const newIndex = fields.findIndex((f) => f.id === over?.id);
      setFields((fields) => arrayMove(fields, oldIndex, newIndex));
    }
  };

  const updateFieldName = (id: string, value: string) => {
    setFields(fields?.map((f) => (f.id === id ? { ...f, field_name: value } : f)));
  };

  const updateFieldPlaceholder = (id: string, value: string) => {
    setFields(fields?.map((f) => (f.id === id ? { ...f, placeholder: value } : f)));
  };

  const updateFieldAmount = (id: string, value: number) => {
    setFields(fields?.map((f) => (f.id === id ? { ...f, amount: value } : f)));
  };

  const updateFieldCurrency = (id: string, value: string) => {
    setFields(fields?.map((f) => (f.id === id ? { ...f, currency: value } : f)));
  };

  const handleAddOption = (fieldId: string) => {
    setFields(prevFields =>
      prevFields.map(field => {
        if (field.id === fieldId) {
          return {
            ...field,
            options: [...(field.options as string[] || []), dropdownOptionField as string]
          };
        }
        return field;
      })
    );
    setDropdownOptionField('');
  };

  const handleAddBillingOption = (fieldId: string) => {
    setFields(prevFields =>
      prevFields.map(field => {
        if (field.id === fieldId) {
          return {
            ...field,
            billingOptions: [...(field.billingOptions as DropdownBillingOption[] || []), { label: dropdownBillingOptionLabel, amount: dropdownBillingOptionValue, id: uuidv4()}]
          };
        }
        return field;
      })
    );
    setDropdownBillingOptionLabel('')
    setDropdownBillingOptionValue(0)
  };

  const handleRemoveBillingOption = (fieldId: string, optionIdToRemove: string) => {
    setFields(prevFields =>
      prevFields.map(field => {
        if (field.id === fieldId) {
          return {
            ...field,
            billingOptions: field.billingOptions?.filter(opt => opt.id !== optionIdToRemove)
          };
        }
        return field;
      })
    );
  };

  const handleRemoveOption = (fieldId: string, optionToRemove: string) => {
    setFields(prevFields =>
      prevFields.map(field => {
        if (field.id === fieldId) {
          return {
            ...field,
            options: field.options?.filter(opt => opt !== optionToRemove)
          };
        }
        return field;
      })
    );
  };

  const removeFieldFromList = (fieldId: string, fieldName: string) => {
    setFields(fields.filter(f => f.id !== fieldId))
    setDeletedFields([...deletedFields, fieldName])
  }

  return (
    <div className="w-full mx-auto p-6 space-y-4">
      {
        isLoading ? 
        (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )
        :
        (

          <Tabs defaultValue='standard'>
            <TabsList>
              <TabsTrigger value='standard'>Add Standard Fields</TabsTrigger>
              <TabsTrigger value='billing'>Add Billing Fields</TabsTrigger>
            </TabsList>
            <TabsContent value='standard'>
              <Card className='p-4'> 
                <form className='flex space-x-4' onSubmit={(e) => {e.preventDefault();addField("STANDARD")}}>
                  <div className='flex-1 w-full'>
                    <Select onValueChange={setFieldItemType} defaultValue={fieldItemType}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select input type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Input Types</SelectLabel>
                            <SelectItem value="text">Text</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            {/* <SelectItem value="currency">Currency</SelectItem> */}
                            <SelectItem value="dropdown">Dropdown</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                  </div>
                  <div className='flex-init'>
                    <Button type='submit' className="flex-init" variant="outline" disabled={!fieldItemType}>Add Field</Button>
                  </div>
                </form>

                <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={fields.filter(f => f.field_type === "STANDARD").map((f: Field) => f.id)} strategy={verticalListSortingStrategy}>
                    <Accordion
                      type="single"
                      collapsible
                      value={openItem}
                      onValueChange={(v) => setOpenItem(v ?? '')}
                    >
                      {(!fields?.filter(f => f.field_type === "STANDARD")?.length) && <p className='text-sm text-center'>Start adding fields</p>}
                      {fields.filter(f => f.field_type === "STANDARD").map((field: Field) => (
                        <AccordionItem key={field.id} value={field.id} className='py-1'>
                          <SortableItem id={field.id}>
                            <div className="w-full">
                              <AccordionTrigger>
                                <div className="w-full flex">{field.field_name}<div className="text-gray-400 text-xs flex-1 text-right">{field.input_type}</div></div>
                              </AccordionTrigger>
                              <AccordionContent className='p-2 space-y-4 border-1 rounded-lg p-4'>
                                <div>
                                  <label className="block text-sm font-medium mb-2">
                                    Field Name
                                  </label>
                                  <Input
                                    required
                                    type="text"
                                    value={field.field_name}
                                    onChange={(e) => updateFieldName(field.id, e.target.value)}
                                  />
                                </div>
                                    <div>
                                      <label className="block text-sm font-medium mb-2">
                                        Placeholder
                                      </label>
                                      <Input
                                        required
                                        type="text"
                                        value={field.placeholder}
                                        onChange={(e) => updateFieldPlaceholder(field.id, e.target.value)}
                                      />
                                    </div>
                                    <div className="flex items-center gap-3" id={field.id ?? field.field_name}>
                                      <Checkbox
                                        checked={field.required}
                                        onCheckedChange={(checked: boolean) =>
                                          setFields(prev =>
                                            prev.map(f => f.id === field.id ? { ...f, required: checked } : f)
                                          )
                                        }
                                      />
                                      <Label htmlFor="terms">Is required</Label>
                                    </div>
                                    {
                                      field.input_type?.toLowerCase() === "dropdown" && (
                                        <form onSubmit={(e) => {e.preventDefault(); handleAddOption(field.id);}}>
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
                                            <Button type='submit'>Add</Button>
                                          </div>
                                        </form>
                                      )
                                    }
                                    { field.input_type?.toLowerCase() === "dropdown" &&
                                      field.options?.length && (
                                        <div className="mt-2 space-y-1">
                                          {field.options.map((option) => (
                                            <div key={option} className="flex items-center justify-between bg-gray-50 px-3 py-1 rounded-lg">
                                              <span>{option}</span>
                                              <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => handleRemoveOption(field.id, option)}
                                              >
                                                <XIcon />
                                              </Button>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                  <Button variant="destructive" onClick={() => removeFieldFromList(field.id, field.field_id)}>
                                    Remove Field
                                  </Button>
                              </AccordionContent>
                            </div>
                          </SortableItem>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </SortableContext>
                </DndContext>
              </Card>
            </TabsContent>
            <TabsContent value='billing'>
              <Card className='p-4'>
                <form className='flex space-x-4' onSubmit={(e) => {e.preventDefault(); addField("BILLING")}}>
                  <div className='flex-1 w-full'>
                    <Select onValueChange={setFieldItemType} defaultValue={fieldItemType}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select input type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Input Types</SelectLabel>
                            <SelectItem value="text">Text</SelectItem>
                            <SelectItem value="dropdown">Dropdown</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                  </div>
                  <div className='flex-init'>
                    <Button type='submit' className="flex-init" variant="outline" disabled={!fieldItemType}>Add Field</Button>
                  </div>
                </form>
                <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={fields.filter(f => f.field_type === "BILLING").map((f: Field) => f.id)} strategy={verticalListSortingStrategy}>
                    <Accordion
                      type="single"
                      collapsible
                      value={openItem}
                      onValueChange={(v) => setOpenItem(v ?? '')}
                    >

                      {(!fields?.filter(f => f.field_type === "BILLING")?.length) && <p className='text-sm text-center'>Start adding fields</p>}
                      {fields.filter(f => f.field_type === "BILLING").map((field: Field) => (
                        <AccordionItem key={field.id} value={field.id} className='py-1'>
                          <SortableItem id={field.id}>
                            <div className="w-full">
                              <AccordionTrigger>
                                <div className="w-full flex">{field.field_name}<div className="text-gray-400 text-xs flex-1 text-right">{field.input_type}</div></div>
                              </AccordionTrigger>
                              <AccordionContent className='p-2 space-y-4 border-1 rounded-lg p-4'>
                                  <div>
                                    <label className="block text-sm font-medium mb-2">
                                      Field Name
                                    </label>
                                    <Input
                                      required
                                      type="text"
                                      value={field.field_name}
                                      onChange={(e) => updateFieldName(field.id, e.target.value)}
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium mb-2">
                                      Currency
                                    </label>
                                    <Select
                                      value={field.currency || ""}
                                      onValueChange={(v) => updateFieldCurrency(field.id, v)}
                                    >
                                      <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select a currency" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {currencies.map((currency) => (
                                          <SelectItem key={currency.code} value={currency.code}>
                                            {currency.name} ({currency.symbol})
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    {/* <Input
                                      required
                                      type="text"
                                      value={field.currency}
                                      onChange={(e) => updateFieldCurrency(field.id, e.target.value)}
                                    /> */}
                                  </div>
                                  {
                                   field.input_type?.toLowerCase() !== "dropdown" && 
                                    <div>
                                      <label className="block text-sm font-medium mb-2">
                                        Amount { (field.amount) && <span className='text-sm'>
                                            ({formatAmount(field.amount, field?.currency)})
                                          </span>}
                                      </label>
                                      <Input
                                        required
                                        type="number"
                                        value={field.amount}
                                        onChange={(e) => updateFieldAmount(field.id, Number(e.target.value))}
                                      />
                                      <div>
                                        Amount is in cents.
                                      </div>
                                    </div>
                                  }
                                  {
                                      field.input_type?.toLowerCase() === "dropdown" && (
                                        <form onSubmit={(e) => {e.preventDefault(); handleAddBillingOption(field.id);}}>
                                            <label className="block text-sm font-medium mb-2">
                                              Dropdown Options
                                            </label>
                                          <div className='flex space-x-2'>
                                            <div className='flex-1'>
                                              <Label>Label</Label>
                                                <Input
                                                required
                                                type="text"
                                                placeholder='Enter dropdown value'
                                                value={dropdownBillingOptionLabel}
                                                onChange={(e) => setDropdownBillingOptionLabel(e.target.value)}
                                              />
                                            </div>
                                            <div className='flex-1'>
                                              <Label>Amount {formatAmount(dropdownBillingOptionValue, field.currency)}</Label>
                                                <Input
                                                  required
                                                  type="number"
                                                  placeholder='Enter dropdown amount'
                                                  value={dropdownBillingOptionValue}
                                                  onChange={(e) => setDropdownBillingOptionValue(Number(e.target.value))}
                                                />
                                            </div>
                                              <Button type='submit'>Add</Button>
                                          </div>
                                        </form>
                                      )
                                    }
                                    { field.input_type?.toLowerCase() === "dropdown" &&
                                      field.billingOptions?.length && (
                                        <div className="mt-2 space-y-1">
                                          {field.billingOptions.map((option) => (
                                            <div key={option.id} className="flex items-center justify-between bg-gray-50 px-3 py-1 rounded-lg">
                                              <span>{option.label} {formatAmount(option.amount, field.currency)}</span>
                                              <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => handleRemoveBillingOption(field.id, option.id)}
                                              >
                                                <XIcon />
                                              </Button>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                  <Button variant="destructive" onClick={() => removeFieldFromList(field.id, field.field_name)}>
                                    Remove Field
                                  </Button>
                              </AccordionContent>
                            </div>
                          </SortableItem>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </SortableContext>
                </DndContext>
              </Card>
            </TabsContent>
          </Tabs>
        )
      }
    </div>
  );
}
