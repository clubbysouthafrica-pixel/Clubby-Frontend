import React, { useState } from 'react';
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
import { MenuIcon } from 'lucide-react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from './ui/select';
import { Card } from './ui/card';
import { InputFormRegistration, PageFormRegistration } from '@/interfaces/formRegistration';
import FieldInputEditorDialog from './dialog-field-input-editor';
import ConfirmDeleteDialog from './dialog-confirm-delete';

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
          <MenuIcon />
        </div>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}

interface FormBuilderProps {
  currency: string
  clubAccountId: string
  page: PageFormRegistration
  allPages: PageFormRegistration[]
  deletedFields: string[],
  setFields: (pageIndex: number, fields: InputFormRegistration[]) => void,
  setDeletedFields: React.Dispatch<React.SetStateAction<string[]>>
}

export default function DynamicFormBuilder({ currency, clubAccountId, page, allPages, setFields, setDeletedFields }: FormBuilderProps) {
  if (!clubAccountId) return

  const [fieldItemType, setFieldItemType] = useState('')

  const displayTypes = [
    {
      value: "text;text",
      display: "Text"
    },
  ]

  const inputTypes = [
    {
      value: "text;standard",
      display: "Text"
    },
    {
      value: "number;standard",
      display: "Number"
    },
    {
      value: "dropdown;standard",
      display: "Dropdown"
    },
    {
      value: "checkbox;standard",
      display: "Checkbox"
    },
    {
      value: "signature;standard",
      display: "Signature"
    }
  ]
  const billingTypes = [
    {
      value: "text;billing",
      display: "Text"
    },
    {
      value: "dropdown;billing",
      display: "Dropdown"
    },
    {
      value: "discount;billing",
      display: "Discount Dropdown"
    }
  ]

  const addField = () => {
    const inputType = fieldItemType.split(";")[0]
    const fieldType = fieldItemType.split(";")[1]

    const type = {
      field_order_id: page.fields.length + 1,
      field_id: `new-field-${Date.now()}-${Math.random()}`, // Generate unique ID for new fields
      field_type: fieldType.toUpperCase(),
      required: true,
      field_text: `Field ${page.fields?.length ?? 0 + 1}`,
      input_type: fieldType === "text" ? "DISPLAY" : inputType.toUpperCase(),
      field_name: "",
      placeholder: "",
    }

    if (fieldType === "standard" && inputType === "signature") {
      type.field_name = "Signature"
      type.placeholder = "Sign field with your name"
    } else {
      type.field_name = fieldType === "text" ? "" : `Field ${page?.fields?.length ?? "Field" + 1}`,
      type.placeholder = "Default placeholder"
    }

    setFields(page.page_index, [
      ...page.fields,
      type,
    ]);
  };

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = page.fields.findIndex(f => f.field_id === active.id);
      const newIndex = page.fields.findIndex(f => f.field_id === over.id);

      const reordered = arrayMove(page.fields, oldIndex, newIndex)
        .map((f, index) => ({ ...f, field_order_id: index + 1 }));

      setFields(page.page_index, reordered);
    }
  }

  const removeFieldItem = (id: string) => {
    const field_to_delete = page.fields?.find(f => f.field_id === id);
    if (!field_to_delete) return;
  
    // Filter out the deleted field and reindex field_order_id
    const updatedFields = page.fields
      ?.filter(f => f.field_id !== id)
      .map((f, index) => ({ ...f, field_order_id: index + 1 }));
    
    setFields(page.page_index, updatedFields);
    setDeletedFields((prev: any) => [...prev, field_to_delete.field_id]);
  }

  const updatePageInput = (input: InputFormRegistration) => {
    setFields(page.page_index, page.fields.map(f => f.field_order_id === input.field_order_id ? input : f))
  }

  return (
    <div className="w-full mx-auto py-6 space-y-4">
      <div>
        <Card className='p-4'>
          <form className='flex space-x-4' onSubmit={(e) => { e.preventDefault(); addField() }}>
            <div className='flex-1 w-full'>
              <Select onValueChange={setFieldItemType} defaultValue={fieldItemType}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select input type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Standard Input Types</SelectLabel>
                    {
                      inputTypes.map(i => (
                        <SelectItem key={i.value} value={i.value}>{i.display}</SelectItem>
                      ))
                    }

                    <SelectLabel>Billing Input Types</SelectLabel>
                    {
                      billingTypes.map(i => (
                        <SelectItem key={i.value} value={i.value}>{i.display}</SelectItem>
                      ))
                    }

                    <SelectLabel>Display Types</SelectLabel>
                    {
                      displayTypes.map(i => (
                        <SelectItem key={i.value} value={i.value}>{i.display}</SelectItem>
                      ))
                    }
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className='flex-init'>
              <Button type='submit' className="flex-init" variant="outline" disabled={!fieldItemType}>Add Field</Button>
            </div>
          </form>

          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={page.fields.map(f => f.field_id) as any}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-8">
                {page.fields
                  .sort((a, b) => a.field_order_id - b.field_order_id)
                  .map((field) => (
                    <SortableItem key={field.field_order_id} id={field.field_id as string}>
                      <div className="flex items-center space-x-2">
                        <FieldInputEditorDialog
                          currency={currency}
                          field={field}
                          allPages={allPages}
                          update={updatePageInput}
                        />
                        <ConfirmDeleteDialog id={field.field_id} tooltipDescription="Remove input" removeFunc={removeFieldItem}/>
                      </div>
                    </SortableItem>
                  ))}
              </div>
            </SortableContext>
          </DndContext>
        </Card>
      </div>
    </div>
  );
}
