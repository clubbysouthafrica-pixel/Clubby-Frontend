import { Button } from "@/components/ui/button";
import {
  PencilIcon,
  CheckIcon,
  XIcon,
  Trash2Icon,
  MenuIcon,
} from "lucide-react";
import { Fragment, ReactNode, useState } from "react";
import { Input } from "@/components/ui/input";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  StandardCheckbox,
  BillingDropdown,
  BillingDiscountDropdown,
  StandardDropdown,
  StandardText,
  StandardSignature,
  BillingText,
  BillingNumber,
} from "@/components/shared/registration/registration_form_fields";

export type InputType =
  | "TEXT"
  | "DROPDOWN"
  | "CHECKBOX"
  | "NUMBER"
  | "SIGNATURE"
  | "DISCOUNT";
export type FieldType = "TEXT" | "STANDARD" | "BILLING";

interface SortableFieldWrapperProps {
  field: PageFieldBase;
  element: React.ReactNode;
  currentPageIndex: number;
  isRecentlyAdded?: boolean;
  onFieldEdit?: (pageIndex: number, field: PageFieldBase) => void;
  onFieldDelete?: (pageIndex: number, fieldId: string) => void;
}

function SortableFieldWrapper({
  field,
  element,
  currentPageIndex,
  isRecentlyAdded = false,
  onFieldEdit,
  onFieldDelete,
}: SortableFieldWrapperProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.field_id as string });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
    zIndex: isDragging ? 10 : "auto",
    position: "relative" as const,
  };

  const items = [
    field?.required && "Required Field",
    field?.phone_number_input && "Phone Number Input",
    field?.editable_by_member && field?.field_type !== "BILLING" && "Editable by Member",
    field?.sensitive_information && "Sensitive Information",
  ].filter(Boolean);

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-preview-field-id={field.field_id}
      className="scroll-mt-24"
    >
      <div
        className={`relative flex gap-2 items-center group rounded-lg border p-4 transition-all ${
          isDragging ? "shadow-lg" : ""
        } ${
          isRecentlyAdded
            ? "border-slate-300 bg-transparent shadow-lg shadow-slate-200/60"
            : "border-transparent"
        }`}
      >
        {isRecentlyAdded && (
          <div className="absolute -top-3 right-3 rounded-full border border-blue-200 bg-white px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-blue-600 shadow-sm">
            Just added
          </div>
        )}
        <div
          {...attributes}
          {...listeners}
          className="text-gray-400 cursor-grab active:cursor-grabbing hover:text-gray-600 transition-colors touch-none"
        >
          <MenuIcon size={25} />
        </div>
        <div className="flex-1">
          <div>{element}</div>
          {field.field_type !== "TEXT" && (
            <div className="mt-1 pt-0 border-gray-200 text-xs text-gray-600 flex flex-wrap gap-x-1 gap-y-1">
              {items.map((text, index) => (
                <span key={index} className="">
                  {text}
                  {index < items.length - 1 && " |"}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 transition-opacity">
          <button
            type="button"
            onClick={() => onFieldEdit?.(currentPageIndex, field)}
            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors flex-shrink-0"
            title="Edit field"
          >
            <PencilIcon size={18} />
          </button>
          <button
            type="button"
            onClick={() =>
              onFieldDelete?.(currentPageIndex, field.field_id as string)
            }
            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors flex-shrink-0"
            title="Delete field"
          >
            <Trash2Icon size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

export interface BillingOption {
  option_order_id: string;
  amount: number; // in cents
  label: string;
}

export interface FieldRequest {
  field_id: string;
  value: string | number;
  option_order_id?: string;
  label?: string;
}

export interface PageFieldBase {
  field_order_id: string;
  field_id: string;
  field_type: FieldType;
  field_text?: string;
  field_name: string;
  required?: boolean;
  input_type: InputType;
  placeholder?: string;
  multiplier?: boolean;
  multiplier_value?: number;
  options?: string[];
  billingOptions?: BillingOption[];
  discountOptions?: Array<{
    option_order_id: string;
    percentage: number;
    label: string;
    applicable_billing_fields: string[];
  }>;
  currency?: string;
  amount?: number;
  value?: string | number;
  signature_type?: string;
  selectedAmountCents?: number;
  selectedDiscountPercentage?: number;
  applicable_billing_fields?: string[];
  option_order_id?: string;
  percentage?: number;
  label?: string;
  editable_by_member?: boolean;
  phone_number_input?: boolean;
  sensitive_information?: boolean;
}

// Helper type for components that require signature_type
export interface SignatureField extends PageFieldBase {
  signature_type: string;
}

export interface FormPage {
  page_index: number;
  page_header: string;
  fields: PageFieldBase[];
}

export interface PagedFormPayload {
  pages: FormPage[];
}

interface AdminRegistrationFormProps {
  clubName: string;
  clubCurrency: string;
  clubProfileUrl?: string;
  pages: FormPage[];
  currentPageIndex: number;
  setCurrentPageIndex: (index: number | ((prev: number) => number)) => void;
  setFieldValue: (
    pageIndex: number,
    fieldId: string,
    updater: (f: PageFieldBase) => PageFieldBase,
  ) => void;
  headerTitle?: string;
  headerDescription?: string;
  showHeader?: boolean;
  topContent?: ReactNode;
  bottomContent?: ReactNode;
  onPrevious?: () => void;
  onNext?: () => void;
  onContinue?: () => void;
  isPending?: boolean;
  showNavigation?: boolean;
  customActions?: ReactNode;
  className?: string;
  onPageHeaderChange?: (pageIndex: number, newHeader: string) => void;
  isEditing?: boolean;
  onFieldEdit?: (pageIndex: number, field: PageFieldBase) => void;
  onFieldDelete?: (pageIndex: number, fieldId: string) => void;
  onFieldsReorder?: (
    pageIndex: number,
    reorderedFields: PageFieldBase[],
  ) => void;
  onAddFieldFromPalette?: (pageIndex: number, fieldType: string) => void;
  pageDropZoneId?: string;
  paletteInsertIndex?: number | null;
  recentlyAddedFieldId?: string | null;
}

function PaletteDropContainer({
  dropZoneId,
  children,
  isEmpty,
}: {
  dropZoneId: string;
  children: ReactNode;
  isEmpty: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: dropZoneId });

  return (
    <div
      ref={setNodeRef}
      className={isEmpty ? "min-h-[120px]" : undefined}
    >
      {children}
      {isEmpty && (
        <div
          className={`min-h-[120px] rounded-lg border-2 border-dashed transition-colors flex items-center justify-center text-sm ${
            isOver
              ? "border-blue-400 bg-blue-50 text-blue-600"
              : "border-gray-300 bg-gray-50 text-gray-500"
          }`}
        >
          <div className="px-4 text-center">
            <p className="font-medium">Start building this page</p>
            <p className="mt-1 text-xs sm:text-sm">
              Drag a field from the left panel and drop it here.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function renderPreviewField(
  field: PageFieldBase,
  pages: FormPage[],
  currentPageIndex: number,
  setFieldValue: (
    pageIndex: number,
    fieldId: string,
    updater: (f: PageFieldBase) => PageFieldBase,
  ) => void,
  clubCurrency: string,
  isEditing: boolean,
  recentlyAddedFieldId?: string | null,
  onFieldEdit?: (pageIndex: number, field: PageFieldBase) => void,
  onFieldDelete?: (pageIndex: number, fieldId: string) => void,
) {
  const isRecentlyAdded = field.field_id === recentlyAddedFieldId;

  if (field.field_type === "TEXT" && field.field_text) {
    const cleaned = field.field_text
      .replace(
        /<ol>(\s*<li[^>]*data-list="bullet"[^>]*>[\s\S]*?)<\/ol>/g,
        "<ul>$1</ul>",
      )
      .replace(/<span class="ql-ui"[^>]*><\/span>/g, "");

    const element = (
      <div
        className="prose prose-base max-w-none border-0 bg-transparent p-0 break-words overflow-hidden w-full text-slate-900 shadow-none [&_*]:break-words [&_*]:max-w-full [&_p]:text-slate-900 [&_p]:leading-7 [&_ul]:list-disc [&_ul]:list-inside [&_ul]:ml-5 [&_ol]:list-decimal [&_ol]:list-inside [&_ol]:ml-5 [&_li]:text-slate-900 [&_li]:leading-7 [&_strong]:text-slate-950 [&_strong]:font-semibold [&_em]:text-slate-800 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-bold [&_h3]:text-lg [&_h3]:font-semibold [&_h4]:text-base [&_h4]:font-semibold [&_h5]:text-sm [&_h5]:font-semibold [&_h6]:text-xs [&_h6]:font-semibold"
        dangerouslySetInnerHTML={{ __html: cleaned }}
      />
    );

    return isEditing ? (
      <SortableFieldWrapper
        field={field}
        element={element}
        currentPageIndex={currentPageIndex}
        isRecentlyAdded={isRecentlyAdded}
        onFieldEdit={onFieldEdit}
        onFieldDelete={onFieldDelete}
      />
    ) : (
      element
    );
  }

  if (field.field_type === "STANDARD" && field.input_type === "CHECKBOX") {
    const element = (
      <StandardCheckbox
        field={field}
        currentPageIndex={currentPageIndex}
        pages={pages}
        setFieldValue={setFieldValue}
      />
    );

    return isEditing ? (
      <SortableFieldWrapper
        field={field}
        element={element}
        currentPageIndex={currentPageIndex}
        isRecentlyAdded={isRecentlyAdded}
        onFieldEdit={onFieldEdit}
        onFieldDelete={onFieldDelete}
      />
    ) : (
      element
    );
  }

  if (field.field_type === "STANDARD" && field.input_type === "DROPDOWN") {
    const element = (
      <StandardDropdown
        field={field}
        currentPageIndex={currentPageIndex}
        pages={pages}
        setFieldValue={setFieldValue}
      />
    );

    return isEditing ? (
      <SortableFieldWrapper
        field={field}
        element={element}
        currentPageIndex={currentPageIndex}
        isRecentlyAdded={isRecentlyAdded}
        onFieldEdit={onFieldEdit}
        onFieldDelete={onFieldDelete}
      />
    ) : (
      element
    );
  }

  if (
    field.field_type === "STANDARD" &&
    (field.input_type === "TEXT" || field.input_type === "NUMBER")
  ) {
    const element = (
      <StandardText
        field={field}
        currentPageIndex={currentPageIndex}
        pages={pages}
        setFieldValue={setFieldValue}
      />
    );

    return isEditing ? (
      <SortableFieldWrapper
        field={field}
        element={element}
        currentPageIndex={currentPageIndex}
        isRecentlyAdded={isRecentlyAdded}
        onFieldEdit={onFieldEdit}
        onFieldDelete={onFieldDelete}
      />
    ) : (
      element
    );
  }

  if (field.field_type === "STANDARD" && field.input_type === "SIGNATURE") {
    const element = (
      <StandardSignature
        field={field as SignatureField}
        currentPageIndex={currentPageIndex}
        pages={pages}
        setFieldValue={setFieldValue}
      />
    );

    return isEditing ? (
      <SortableFieldWrapper
        field={field}
        element={element}
        currentPageIndex={currentPageIndex}
        isRecentlyAdded={isRecentlyAdded}
        onFieldEdit={onFieldEdit}
        onFieldDelete={onFieldDelete}
      />
    ) : (
      element
    );
  }

  if (field.field_type === "BILLING" && field.input_type === "DROPDOWN") {
    const element = (
      <BillingDropdown
        field={field}
        clubCurrency={clubCurrency}
        currentPageIndex={currentPageIndex}
        pages={pages}
        setFieldValue={setFieldValue}
      />
    );

    return isEditing ? (
      <SortableFieldWrapper
        field={field}
        element={element}
        currentPageIndex={currentPageIndex}
        isRecentlyAdded={isRecentlyAdded}
        onFieldEdit={onFieldEdit}
        onFieldDelete={onFieldDelete}
      />
    ) : (
      element
    );
  }

  if (field.field_type === "BILLING" && field.input_type === "TEXT") {
    const element = (
      <BillingText
        field={field}
        clubCurrency={clubCurrency}
        currentPageIndex={currentPageIndex}
        pages={pages}
        setFieldValue={setFieldValue}
      />
    );

    return isEditing ? (
      <SortableFieldWrapper
        field={field}
        element={element}
        currentPageIndex={currentPageIndex}
        isRecentlyAdded={isRecentlyAdded}
        onFieldEdit={onFieldEdit}
        onFieldDelete={onFieldDelete}
      />
    ) : (
      element
    );
  }

  if (field.field_type === "BILLING" && field.input_type === "DISCOUNT") {
    const element = (
      <BillingDiscountDropdown
        field={field}
        currentPageIndex={currentPageIndex}
        pages={pages}
        setFieldValue={setFieldValue}
      />
    );

    return isEditing ? (
      <SortableFieldWrapper
        field={field}
        element={element}
        currentPageIndex={currentPageIndex}
        isRecentlyAdded={isRecentlyAdded}
        onFieldEdit={onFieldEdit}
        onFieldDelete={onFieldDelete}
      />
    ) : (
      element
    );
  }

  if (field.field_type === "BILLING" && field.input_type === "NUMBER") {
    const element = (
      <BillingNumber
        field={field}
        clubCurrency={clubCurrency}
        currentPageIndex={currentPageIndex}
        pages={pages}
        setFieldValue={setFieldValue}
      />
    );

    return isEditing ? (
      <SortableFieldWrapper
        field={field}
        element={element}
        currentPageIndex={currentPageIndex}
        onFieldEdit={onFieldEdit}
        onFieldDelete={onFieldDelete}
      />
    ) : (
      element
    );
  }

  return null;
}

export function AdminRegistrationForm({
  clubName,
  clubCurrency,
  clubProfileUrl,
  pages,
  currentPageIndex,
  setCurrentPageIndex,
  setFieldValue,
  headerTitle,
  headerDescription,
  showHeader = true,
  topContent,
  bottomContent,
  onPrevious,
  onNext,
  onContinue,
  isPending = false,
  showNavigation = true,
  customActions,
  className,
  onPageHeaderChange,
  isEditing = false,
  onFieldEdit,
  onFieldDelete,
  pageDropZoneId = "preview-page-drop-zone",
  paletteInsertIndex,
  recentlyAddedFieldId,
}: AdminRegistrationFormProps) {
  const [editingHeaderIndex, setEditingHeaderIndex] = useState<number | null>(
    null,
  );
  const [editingHeaderValue, setEditingHeaderValue] = useState<string>("");

  const isLastPage = currentPageIndex === pages.length - 1;

  const handlePrevious = () => {
    if (onPrevious) {
      onPrevious();
    } else {
      setCurrentPageIndex((i) => i - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleNext = () => {
    if (onNext) {
      onNext();
    } else {
      setCurrentPageIndex((i) => i + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const sortedFields = [...(pages[currentPageIndex]?.fields ?? [])].sort(
    (a, b) => Number(a.field_order_id) - Number(b.field_order_id),
  );

  return (
    <div
      className={`flex flex-col gap-10 justify-center items-center px-3 lg:px-4 w-full overflow-x-hidden  bg-gradient-to-b from-gray-50 to-white ${className ?? "py-6 lg:py-12"}`}
    >
      <div
        className={`w-full ${isEditing ? "max-w-7xl" : "max-w-2xl"} bg-white rounded-lg shadow-md overflow-hidden ${className}`}
      >
        {showHeader && (
          <div className="border-b border-gray-200 bg-white py-4 lg:py-6 px-6 lg:px-10 flex flex-col items-center gap-4">
            {clubProfileUrl && (
              <img
                src={clubProfileUrl}
                alt="Club Profile"
                className="w-32 h-32 rounded-full object-cover border-2 border-gray-300 shadow-md"
              />
            )}
            <div className="flex flex-col items-center gap-1">
              <h1 className="text-2xl lg:text-4xl font-bold text-center text-gray-900">
                {headerTitle || clubName}
              </h1>
              {headerDescription && (
                <p className="text-center text-sm lg:text-base text-gray-600 mt-2">
                  {headerDescription}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
      <div
        className={`w-full ${isEditing ? "max-w-7xl" : "max-w-2xl"} mb-5 bg-white rounded-lg shadow-md overflow-hidden ${className}`}
      >
        <div className="px-6 lg:px-10 py-6 lg:py-8 overflow-x-hidden">
          {pages.length > 0 && (
            <form>
              <div className="space-y-0 min-w-0">
                <div className="min-w-0">
                  {topContent}

                  {pages[currentPageIndex] &&
                    (isEditing && editingHeaderIndex === currentPageIndex ? (
                      <div className="flex gap-2 items-center mb-8 pb-6 border-b border-gray-300">
                        <Input
                          value={editingHeaderValue}
                          onChange={(e) =>
                            setEditingHeaderValue(e.target.value)
                          }
                          className="text-2xl lg:text-2xl font-bold flex-1"
                          placeholder="Page header"
                          autoFocus
                          onInvalid={(e) => e.preventDefault()}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            onPageHeaderChange?.(
                              currentPageIndex,
                              editingHeaderValue,
                            );
                            setEditingHeaderIndex(null);
                          }}
                          className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                          title="Save"
                        >
                          <CheckIcon size={20} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingHeaderIndex(null)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Cancel"
                        >
                          <XIcon size={20} />
                        </button>
                      </div>
                    ) : isEditing ? (
                      <div className="flex gap-2 items-center mb-8 pb-6 border-b border-gray-300">
                        <h2 className="text-2xl lg:text-2xl font-bold text-gray-900 flex-1">
                          {pages[currentPageIndex].page_header}
                        </h2>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingHeaderIndex(currentPageIndex);
                            setEditingHeaderValue(
                              pages[currentPageIndex].page_header,
                            );
                          }}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors flex-shrink-0"
                          title="Edit header"
                        >
                          <PencilIcon size={18} />
                        </button>
                      </div>
                    ) : (
                      <h2 className="text-2xl lg:text-2xl font-bold text-gray-900 pb-6 mb-8 border-b border-gray-300">
                        {pages[currentPageIndex].page_header}
                      </h2>
                    ))}

                  {pages[currentPageIndex] && (
                    <SortableContext
                      items={sortedFields
                        .map((f) => f.field_id || "")
                        .filter(Boolean)}
                      strategy={verticalListSortingStrategy}
                    >
                      <PaletteDropContainer
                        dropZoneId={pageDropZoneId}
                        isEmpty={sortedFields.length === 0}
                      >
                        <div
                          key={pages[currentPageIndex].page_index}
                          className="space-y-6 lg:space-y-8"
                        >
                          {sortedFields.map((field, index) => (
                            <Fragment key={field.field_id}>
                              {paletteInsertIndex === index && (
                                <div className="rounded-lg border-2 border-dashed border-blue-400 bg-blue-50/80 transition-all h-14" />
                              )}
                              {renderPreviewField(
                                field,
                                pages,
                                currentPageIndex,
                                setFieldValue,
                                clubCurrency,
                                isEditing,
                                recentlyAddedFieldId,
                                onFieldEdit,
                                onFieldDelete,
                              )}
                            </Fragment>
                          ))}
                          {paletteInsertIndex === sortedFields.length && sortedFields.length > 0 && (
                            <div className="rounded-lg border-2 border-dashed border-blue-400 bg-blue-50/80 transition-all h-14" />
                          )}
                        </div>
                      </PaletteDropContainer>
                    </SortableContext>
                  )}

                  {customActions ? (
                    customActions
                  ) : showNavigation ? (
                    pages.length === 1 ? (
                      <div className="mt-8">
                        <Button
                          type="button"
                          onClick={onContinue}
                          disabled={isPending}
                          className="w-full bg-black hover:bg-gray-900 text-white font-semibold py-2.5 rounded-md text-base"
                        >
                          {isPending ? "Processing..." : "Continue"}
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col lg:flex-row justify-between items-center gap-3 lg:gap-4 pt-8 border-t border-gray-200 mt-8">
                        {currentPageIndex > 0 ? (
                          <Button
                            variant="outline"
                            type="button"
                            className="w-full lg:w-auto px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50"
                            onClick={handlePrevious}
                            disabled={isPending}
                          >
                            Previous
                          </Button>
                        ) : (
                          <div className="w-full lg:w-auto" />
                        )}
                        <div className="text-sm text-gray-600 flex-1 text-center order-first lg:order-none">
                          Page {currentPageIndex + 1} of {pages.length}
                        </div>
                        {isLastPage ? (
                          <Button
                            type="button"
                            className="w-full lg:w-auto px-6 py-2 bg-black hover:bg-gray-900 text-white font-semibold rounded-md"
                            onClick={onContinue}
                            disabled={isPending}
                          >
                            {isPending ? "Processing..." : "Submit"}
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            className="w-full lg:w-auto px-6 py-2 bg-black hover:bg-gray-900 text-white font-semibold rounded-md"
                            onClick={handleNext}
                            disabled={isPending}
                          >
                            Next
                          </Button>
                        )}
                      </div>
                    )
                  ) : null}

                  {bottomContent}
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
