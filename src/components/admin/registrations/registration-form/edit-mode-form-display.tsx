import React, { useRef, useState } from 'react';
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
import { MenuIcon, PencilIcon } from 'lucide-react';
import { InputFormRegistration, PageFormRegistration } from '@/interfaces/formRegistration';
import FieldInputEditorDialog from '@/components/dialog-field-input-editor';
import ConfirmDeleteDialog from '@/components/dialog-confirm-delete';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface EditableSortableItemProps {
  id: string;
  field: InputFormRegistration;
  currency: string;
  allPages: PageFormRegistration[];
  onUpdate: (field: InputFormRegistration) => void;
  onDelete: (id: string) => void;
  children: React.ReactNode;
}

function EditableSortableItem({
  id,
  field,
  currency,
  allPages,
  onUpdate,
  onDelete,
  children,
}: EditableSortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const [openEditDialog, setOpenEditDialog] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const editDialogTriggerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group rounded-lg p-4 bg-white border border-gray-300 hover:border-blue-300 hover:shadow-md transition-all"
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute left-2 top-1/2 -translate-y-1/2 cursor-move select-none text-gray-400 hover:text-blue-500 transition-colors"
      >
        <MenuIcon size={18} />
      </div>

      <div className="pl-8">{children}</div>

      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 transition-opacity">
        <div 
          ref={editDialogTriggerRef}
          className="relative"
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setOpenEditDialog(true)}
                title="Edit field"
              >
                <PencilIcon size={18} className="text-gray-600 hover:text-blue-500" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Edit field</TooltipContent>
          </Tooltip>
          <FieldInputEditorDialog
            currency={currency}
            field={field}
            allPages={allPages}
            update={onUpdate}
            openDialog={openEditDialog}
            setOpenDialog={setOpenEditDialog}
          />
        </div>
        <ConfirmDeleteDialog
          id={field.field_id}
          tooltipDescription="Remove field"
          removeFunc={onDelete}
        />
      </div>
    </div>
  );
}

interface EditModeFormDisplayProps {
  currency: string;
  page: PageFormRegistration;
  allPages: PageFormRegistration[];
  setFields: (pageIndex: number, fields: InputFormRegistration[]) => void;
  setDeletedFields: React.Dispatch<React.SetStateAction<string[]>>;
}

export function EditModeFormDisplay({
  currency,
  page,
  allPages,
  setFields,
  setDeletedFields,
}: EditModeFormDisplayProps) {
  const updatePageInput = (input: InputFormRegistration) => {
    setFields(
      page.page_index,
      page.fields.map((f) =>
        f.field_order_id === input.field_order_id ? input : f
      )
    );
  };

  const removeFieldItem = (id: string) => {
    const field_to_delete = page.fields?.find((f) => f.field_id === id);
    if (!field_to_delete || !field_to_delete.field_id) return;

    const updatedFields = page.fields
      ?.filter((f) => f.field_id !== id)
      .map((f, index) => ({ ...f, field_order_id: index + 1 }));

    setFields(page.page_index, updatedFields);
    setDeletedFields((prev) => [...prev, field_to_delete.field_id as string]);
  };

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = page.fields.findIndex((f) => f.field_id === active.id);
      const newIndex = page.fields.findIndex((f) => f.field_id === over.id);

      const reordered = arrayMove(page.fields, oldIndex, newIndex).map(
        (f, index) => ({ ...f, field_order_id: index + 1 })
      );

      setFields(page.page_index, reordered);
    }
  }

  const renderField = (field: InputFormRegistration) => {
    const label = field.field_name || field.field_text || `Field ${field.field_order_id}`;

    // Metadata display component
    const renderMetadata = () => (
      <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-600 flex flex-wrap gap-x-2 gap-y-1">
        <span>Is Required: <span className="font-semibold text-gray-700">{field.required ? "true" : "false"}</span></span>
        <span>|</span>
        <span>Editable by Member: <span className="font-semibold text-gray-700">{field.editable_by_member ? "true" : "false"}</span></span>
        <span>|</span>
        <span>Phone Number: <span className="font-semibold text-gray-700">{field.phone_number_input ? "true" : "false"}</span></span>
      </div>
    );

    // For display types (TEXT field type), just show text
    if (field.field_type === 'TEXT') {
      return (
        <div className="space-y-2 relative min-w-0">
          <Label className="block text-base font-medium text-gray-900">
            {label}
          </Label>
          <div className="text-gray-700 p-3">{field.field_text}</div>
        </div>
      );
    }

    // For standard input fields
    if (field.field_type === 'STANDARD') {
      if (field.input_type === 'CHECKBOX') {
        return (
          <div className="space-y-2 relative min-w-0">
            <div className="flex items-center space-x-2">
              <Checkbox disabled />
              <Label className="text-base font-medium text-gray-900 cursor-pointer">
                {label}
              </Label>
            </div>
            {renderMetadata()}
          </div>
        );
      } else if (field.input_type === 'SIGNATURE') {
        return (
          <div className="space-y-2 relative min-w-0">
            <Label className="block text-base font-medium text-gray-900">
              {label}
            </Label>
            <div className="border-2 border-dashed border-gray-300 rounded p-8 text-center text-gray-500 bg-gray-50">
              Signature area
            </div>
            {renderMetadata()}
          </div>
        );
      } else if (field.input_type === 'DROPDOWN') {
        return (
          <div className="space-y-2 relative min-w-0">
            <Label className="block text-base font-medium text-gray-900">
              {label}
            </Label>
            <Select disabled>
              <SelectTrigger className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-base font-normal">
                <SelectValue placeholder={field.placeholder ?? "Select an option"} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((opt) => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {renderMetadata()}
          </div>
        );
      } else {
        // TEXT or NUMBER
        return (
          <div className="space-y-2 relative min-w-0">
            <Label className="block text-base font-medium text-gray-900">
              {label}
            </Label>
            <Input
              disabled
              placeholder={field.placeholder}
              type={field.input_type === 'NUMBER' ? 'number' : 'text'}
              className="border border-gray-300"
            />
            {renderMetadata()}
          </div>
        );
      }
    }

    // For billing fields
    if (field.field_type === 'BILLING') {
      if (field.input_type === 'DROPDOWN') {
        return (
          <div className="space-y-2 relative min-w-0">
            <Label className="block text-base font-medium text-gray-900">
              {label}
            </Label>
            <Select disabled>
              <SelectTrigger className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-base font-normal">
                <SelectValue placeholder={field.placeholder ?? "Select an option"} />
              </SelectTrigger>
              <SelectContent>
                {field.billingOptions?.map((opt) => (
                  <SelectItem key={opt.option_order_id} value={opt.option_order_id}>
                    {opt.label} - R{(opt.amount / 100).toFixed(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {renderMetadata()}
          </div>
        );
      } else {
        // TEXT or NUMBER
        return (
          <div className="space-y-2 relative min-w-0">
            <Label className="block text-base font-medium text-gray-900">
              {label}
            </Label>
            <Input
              disabled
              placeholder={field.placeholder}
              type={field.input_type === 'NUMBER' ? 'number' : 'text'}
              className="border border-gray-300"
            />
            {renderMetadata()}
          </div>
        );
      }
    }

    return <div className="text-gray-500">Unknown field type</div>;
  };

  return (
    <div className="space-y-4">
      <DndContext
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={page.fields.map((f) => f.field_id || '').filter(Boolean)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {page.fields
              .sort((a, b) => a.field_order_id - b.field_order_id)
              .map((field) => (
                <EditableSortableItem
                  key={field.field_id}
                  id={field.field_id as string}
                  field={field}
                  currency={currency}
                  allPages={allPages}
                  onUpdate={updatePageInput}
                  onDelete={removeFieldItem}
                >
                  {renderField(field)}
                </EditableSortableItem>
              ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
