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
import { v4 as uuidv4 } from 'uuid';
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
          <MenuIcon/>
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
  deletedFields: string[],
  setFields: (pageIndex: number, fields: InputFormRegistration[]) => void,
  setDeletedFields: React.Dispatch<React.SetStateAction<string[]>>
}

export default function DynamicFormBuilder({ clubAccountId, page, setFields, deletedFields, setDeletedFields }: FormBuilderProps) {
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
    }
  ]

  const addField = () => {
    const inputType = fieldItemType.split(";")[0]
    const fieldType = fieldItemType.split(";")[1]

    const type = {
        field_order_id: uuidv4(),
        field_name: fieldType === "text"  ? "" : `Field ${page?.fields?.length ?? "Field" + 1}`,
        input_type: fieldType === "text"  ? "DISPLAY" : inputType.toUpperCase(),
        placeholder: 'Default placeholder',
        field_type: fieldType.toUpperCase(),
        required: true,
        field_text: `Field ${page.fields?.length ?? 0 + 1}`,
      }
    
    setFields(page.page_index, [
      ...page.fields,
      type,
    ]);
  };

  const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;
  if (!over || active.id === over.id) return;

  const oldIndex = page.fields.findIndex(f => f.field_order_id === active.id);
  const newIndex = page.fields.findIndex(f => f.field_order_id === over.id);

  if (oldIndex === -1 || newIndex === -1) return;

  const reordered = arrayMove(page.fields, oldIndex, newIndex);
  setFields(page.page_index, reordered);
};

  const removeFieldItem = (id: string) => {
    const field_to_delete = page.fields?.filter(f => f.field_id === id)
    setFields(page.page_index, page.fields?.filter(f => f.field_id !== id))

    const fields = (deletedFields?.length > 0) ? deletedFields.push(field_to_delete[0].field_id as string) : [field_to_delete[0].field_id]
    setDeletedFields(fields as string[])
  }

  const updatePageInput = (input: InputFormRegistration) => {
    setFields(page.page_index, page.fields.map(f => f.field_order_id === input.field_order_id ? input : f))
  }

  return (
    <div className="w-full mx-auto py-6 space-y-4">
      <div>
        <Card className='p-4'> 
          <form className='flex space-x-4' onSubmit={(e) => {e.preventDefault();addField()}}>
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

          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={page.fields.length > 0 ? page.fields.map((f: InputFormRegistration) => f.field_order_id) : []} strategy={verticalListSortingStrategy}>
                {(!page.fields?.length) && <p className='text-sm text-center'>Start adding fields</p>}
                {page.fields?.map((field: InputFormRegistration) => (
                    <SortableItem id={field.field_order_id} key={field.field_order_id}>
                      <div className='flex items-center'>
                        <div className='flex w-full items-center justify-center mt-1 cursor-pointer hover:bg-gray-100 p-2 rounded-md' key={field.field_order_id}>
                          <FieldInputEditorDialog field={field} update={updatePageInput}/>
                        </div>
                        <ConfirmDeleteDialog id={field.field_id} tooltipDescription="Remove input" removeFunc={removeFieldItem}/>
                      </div>
                    </SortableItem>
                ))}
            </SortableContext>
          </DndContext>
        </Card>
      </div>
    </div>
  );
}
