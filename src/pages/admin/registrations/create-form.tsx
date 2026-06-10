import { Button } from "@/components/ui/button";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { ClubContext, ClubContextType } from "@/context/ClubContext";
import { useCreateClubMutation } from "@/mutations/admin/useRegistrationMutation";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  InputFormRegistration,
  PageFormRegistration,
} from "@/interfaces/formRegistration";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  EyeIcon,
  Loader2,
  PlusIcon,
  SearchIcon,
  XIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useFetchRegistrationForm } from "@/queries/admin/registration-form";
import { createDeleteFieldsRequest } from "@/helpers/admin/registration/verify-delete-fields-structure";
import { createPagesRequest } from "@/helpers/admin/registration/verify-create-pages-structure";
import {
  AdminRegistrationForm,
  FormPage,
  PageFieldBase,
} from "@/components/admin/registrations/registration-form/admin-registration-form";
import { ReusableRegistrationForm } from "@/components/shared/registration/reusable-registration-form";
import FieldInputEditorDialog from "@/components/dialog-field-input-editor";
import {
  CollisionDetection,
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragOverEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  pointerWithin,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import "../../../index.css";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

// Field Palette Item Component
function FieldPaletteItem({
  id,
  label,
  description,
}: {
  id: string;
  label: string;
  description?: string;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`p-3 mb-2 bg-white border-2 rounded cursor-move select-none touch-none transition-all ${
        isDragging
          ? "opacity-0 border-blue-500 scale-95 shadow-lg"
          : "border-gray-300 hover:border-blue-500 hover:shadow-md"
      }`}
    >
      <p className="font-medium text-sm text-gray-900">{label}</p>
      {description && <p className="text-xs text-gray-500">{description}</p>}
    </div>
  );
}

interface PaletteFieldDefinition {
  id: string;
  label: string;
  description: string;
}

interface PaletteFieldGroup {
  id: "display" | "standard" | "billing";
  title: string;
  fields: PaletteFieldDefinition[];
}

const DEFAULT_PAGE: PageFormRegistration = {
  page_index: 0,
  page_header: "Page 1",
  fields: [],
};

export default function AdminRegistrationFormPage() {
  const { club, setClub } = useContext(ClubContext) as ClubContextType;
  const [deletedFields, setDeletedFields] = useState<string[]>([]);

  const { mutate } = useCreateClubMutation();
  const { data, isLoading } = useFetchRegistrationForm(
    club?.club_account_id as string,
  );

  const [saving, setSaving] = useState(false);
  const [formName, setFormName] = useState("Join Club");

  // controlled active tab so we can detect changes and scroll
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  // ref to the scrollable content area below the header
  const contentRef = useRef<HTMLDivElement | null>(null);
  // track previous field counts per page to detect when a field is added (use ref to avoid re-renders)
  const prevFieldCountsRef = useRef<Record<number, number>>({});

  // State for AdminRegistrationForm preview
  const [previewPages, setPreviewPages] = useState<FormPage[]>([]);
  const [currentPreviewPageIndex, setCurrentPreviewPageIndex] = useState(0);
  const [isMemberPreviewOpen, setIsMemberPreviewOpen] = useState(false);
  const [memberPreviewPages, setMemberPreviewPages] = useState<FormPage[]>([]);
  const [memberPreviewPageIndex, setMemberPreviewPageIndex] = useState(0);
  const [memberPreviewRequiredFieldsMissing, setMemberPreviewRequiredFieldsMissing] =
    useState(false);
  const [paletteSearchTerm, setPaletteSearchTerm] = useState("");
  const [showBuilderInstructions, setShowBuilderInstructions] = useState(true);
  const [openPaletteGroups, setOpenPaletteGroups] = useState<
    Record<PaletteFieldGroup["id"], boolean>
  >({
    display: true,
    standard: false,
    billing: false,
  });

  const [editingField, setEditingField] =
    useState<InputFormRegistration | null>(null);
  const [editingPageIndex, setEditingPageIndex] = useState<number | null>(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [previewInsertIndex, setPreviewInsertIndex] = useState<number | null>(
    null,
  );
  const [recentlyAddedFieldId, setRecentlyAddedFieldId] = useState<
    string | null
  >(null);
  const recentlyAddedTimeoutRef = useRef<number | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const [pages, setPages] = useState<PageFormRegistration[]>([DEFAULT_PAGE]);
  const [originalPages, setOriginalPages] = useState<PageFormRegistration[]>([
    DEFAULT_PAGE,
  ]);
  const [originalFormName, setOriginalFormName] = useState("Join Club");

  const hasUnsavedChanges = useMemo(() => {
    if (deletedFields.length > 0) {
      return true;
    }

    if ((formName.trim() || "Join Club") !== originalFormName) {
      return true;
    }

    return (
      JSON.stringify(createPagesRequest(pages, formName.trim() || "Join Club")) !==
      JSON.stringify(
        createPagesRequest(originalPages, originalFormName),
      )
    );
  }, [deletedFields, formName, originalFormName, pages, originalPages]);

  const isFormEmpty = useMemo(
    () => pages.every((page) => (page.fields?.length ?? 0) === 0),
    [pages],
  );

  const displayToast = () =>
    toast.success("Successfully saved registration form");
  const displayErrorToast = (e: Error) => {
    if (e instanceof AxiosError) {
      toast.error(
        ((e.response?.data as Record<string, unknown>)?.message as string) ||
          "An error occurred",
      );
    } else {
      toast.error(e.message || "An error occurred");
    }
  };

  useEffect(() => {
    if (data) {
      const incomingFormName = data.form_name?.trim() || "Join Club";
      const sortedPages = [...(data.pages ?? [])]
        .sort(
          (a: PageFormRegistration, b: PageFormRegistration) =>
            a.page_index - b.page_index,
        )
        .map((page: PageFormRegistration) => ({
          ...page,
          fields: [...(page.fields ?? [])].sort(
            (a, b) => Number(a.field_order_id) - Number(b.field_order_id),
          ),
        }));

      const nextPages = sortedPages.length > 0 ? sortedPages : [DEFAULT_PAGE];

      setOriginalPages(nextPages);
      setPages(nextPages);
      setDeletedFields([]);
      setFormName(incomingFormName);
      setOriginalFormName(incomingFormName);
      // initialize prevFieldCounts map
      const counts: Record<number, number> = {};
      nextPages.forEach(
        (p: PageFormRegistration) =>
          (counts[p.page_index] = p.fields?.length ?? 0),
      );
      prevFieldCountsRef.current = counts;
    }
  }, [data]);

  // Transform pages for AdminRegistrationForm preview
  useEffect(() => {
    const sorted = [...pages]
      .sort((a, b) => a.page_index - b.page_index)
      .map((p, index) => ({
        page_index: index,
        page_header: p.page_header,
        fields: [...p.fields]
          .sort((a, b) => Number(a.field_order_id) - Number(b.field_order_id))
          .map((f) => ({
            ...f,
            field_order_id: String(f.field_order_id),
          })) as PageFieldBase[],
      }));

    setPreviewPages(sorted);
  }, [pages]);

  useEffect(() => {
    setMemberPreviewPages(
      previewPages.map((page) => ({
        ...page,
        fields: page.fields.map((field) => ({ ...field })),
      })),
    );
  }, [previewPages]);

  useEffect(() => {
    if (!recentlyAddedFieldId) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      const selector = `[data-preview-field-id="${CSS.escape(recentlyAddedFieldId)}"]`;
      const addedFieldElement = document.querySelector(selector);

      if (addedFieldElement instanceof HTMLElement) {
        addedFieldElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        });
      }
    });

    if (recentlyAddedTimeoutRef.current) {
      window.clearTimeout(recentlyAddedTimeoutRef.current);
    }

    recentlyAddedTimeoutRef.current = window.setTimeout(() => {
      setRecentlyAddedFieldId((current) =>
        current === recentlyAddedFieldId ? null : current,
      );
      recentlyAddedTimeoutRef.current = null;
    }, 2500);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [previewPages, recentlyAddedFieldId]);

  useEffect(() => {
    return () => {
      if (recentlyAddedTimeoutRef.current) {
        window.clearTimeout(recentlyAddedTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
          .custom-thin-scrollbar::-webkit-scrollbar {
            height: 2px;
            width: 2px;
          }
          .custom-thin-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-thin-scrollbar::-webkit-scrollbar-thumb {
            background-color: rgba(100, 100, 100, 0.3);
            border-radius: 2px;
          }
          .custom-thin-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: rgba(100, 100, 100, 0.3) transparent;
          }
        `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const saveRegistrationForm = () => {
    setSaving(true);
    mutate(
      {
        pages: createPagesRequest(pages, formName.trim() || "Join Club"),
        deleteFields: createDeleteFieldsRequest(deletedFields, originalPages),
        club_account_id: club?.club_account_id as string,
        form_name: formName.trim() || "Join Club",
      },
      {
        onSuccess: () => {
          const hasAtLeastOneField = pages.some(
            (page) => (page.fields?.length ?? 0) > 0,
          );
          if (club && hasAtLeastOneField) {
            setClub({
              ...club,
              registration_form_exists: true,
            });
          }
          displayToast();
          setSaving(false);
          // Update originalPages with current pages so new fields are now locked
          setOriginalPages(pages);
          setOriginalFormName(formName.trim() || "Join Club");
          setDeletedFields([]);
        },
        onError: (e) => {
          displayErrorToast(e);
          setSaving(false);
        },
      },
    );
  };

  const addPage = (target: "edit" | "preview" = "edit") => {
    setPages((v: PageFormRegistration[]) => {
      const next =
        v.length > 0
          ? [
              ...v,
              {
                page_header: `Page ${v.length + 1}`,
                page_index: v.length,
                fields: [],
              },
            ]
          : [DEFAULT_PAGE];
      // Jump to the new page in the section that initiated the add.
      setTimeout(() => {
        if (target === "preview") {
          setCurrentPreviewPageIndex(next.length - 1);
        } else {
          setActiveTabIndex(next.length - 1);
        }
      }, 0);
      return next;
    });
  };

  useEffect(() => {
    if (pages.length === 0) {
      setActiveTabIndex(0);
      setCurrentPreviewPageIndex(0);
      setMemberPreviewPageIndex(0);
      return;
    }

    setActiveTabIndex((prev) => Math.min(prev, pages.length - 1));
    setCurrentPreviewPageIndex((prev) => Math.min(prev, pages.length - 1));
    setMemberPreviewPageIndex((prev) => Math.min(prev, pages.length - 1));
  }, [pages.length]);

  // detect when fields are added to the current page and scroll to bottom
  useEffect(() => {
    if (!contentRef.current) return;
    const counts: Record<number, number> = {};
    pages.forEach((p) => (counts[p.page_index] = p.fields?.length ?? 0));

    const prev = prevFieldCountsRef.current[activeTabIndex] ?? 0;
    const current = counts[activeTabIndex] ?? 0;
    if (current > prev) {
      // scroll to bottom of content area so the newly added field is visible
      contentRef.current.scrollTo({
        top: contentRef.current.scrollHeight,
        behavior: "smooth",
      });
    }

    // update ref in-place (no state) to avoid triggering re-renders
    prevFieldCountsRef.current = counts;
  }, [pages, activeTabIndex]);

  const changePageHeader = (pageIndex: number, value: string) => {
    setPages(
      pages?.map((f) =>
        f.page_index === pageIndex ? { ...f, page_header: value } : f,
      ),
    );
  };

  const handlePreviewPageHeaderChange = (
    pageIndex: number,
    newHeader: string,
  ) => {
    // Update the pages state to reflect header changes from preview
    changePageHeader(pageIndex, newHeader);
  };

  const handlePreviewFieldEdit = (pageIndex: number, field: PageFieldBase) => {
    // Find the corresponding InputFormRegistration field from original pages
    const originalPages = pages;
    const originalField = originalPages[pageIndex]?.fields?.find(
      (f) => f.field_id === field.field_id,
    );

    if (originalField) {
      setEditingField(originalField as InputFormRegistration);
      setEditingPageIndex(pageIndex);
      setOpenEditDialog(true);
    }
  };

  const handleFieldEditComplete = (updatedField: InputFormRegistration) => {
    if (editingPageIndex !== null) {
      // Update the field in the pages state
      setPages((prevPages) =>
        prevPages.map((page, index) =>
          index === editingPageIndex
            ? {
                ...page,
                fields: page.fields.map((f) =>
                  f.field_id === updatedField.field_id ? updatedField : f,
                ),
              }
            : page,
        ),
      );
    }
    setOpenEditDialog(false);
    setEditingField(null);
    setEditingPageIndex(null);
  };

  const handlePreviewFieldDelete = (pageIndex: number, fieldId: string) => {
    setPages((prevPages) =>
      prevPages.map((page, index) => {
        if (index === pageIndex) {
          const field_to_delete = page.fields?.find(
            (f) => f.field_id === fieldId,
          );
          if (field_to_delete && field_to_delete.field_id) {
            const updatedFields = page.fields
              ?.filter((f) => f.field_id !== fieldId)
              .map((f, fieldIndex) => ({
                ...f,
                field_order_id: fieldIndex + 1,
              }));

            // Add to deletedFields for backend deletion on save
            setDeletedFields((prev) => [
              ...prev,
              field_to_delete.field_id as string,
            ]);

            return {
              ...page,
              fields: updatedFields,
            };
          }
        }
        return page;
      }),
    );
  };

  const handlePreviewFieldsReorder = (
    pageIndex: number,
    reorderedFields: PageFieldBase[],
  ) => {
    setPages((prevPages) =>
      prevPages.map((page, index) =>
        index === pageIndex
          ? {
              ...page,
              fields: reorderedFields.map(
                (f) =>
                  ({
                    ...f,
                    field_order_id: Number(f.field_order_id),
                  }) as unknown as InputFormRegistration,
              ),
            }
          : page,
      ),
    );
  };

  const handleAddFieldFromPalette = (
    pageIndex: number,
    inputType: string,
    insertIndex?: number,
  ) => {
    // Determine field_type and input_type based on the selected input type
    let fieldType: "TEXT" | "STANDARD" | "BILLING";
    let finalInputType: string;
    let fieldText = "New Field";
    const isDisplayTextType = inputType === "TEXT" || inputType === "DISPLAY_TEXT";

    // Parse prefixed input types for palette fields.
    const isBillingType = inputType.startsWith("BILLING_");
    const isStandardType = inputType.startsWith("STANDARD_");
    const actualInputType = isBillingType
      ? inputType.replace("BILLING_", "")
      : isStandardType
        ? inputType.replace("STANDARD_", "")
        : inputType;

    if (isDisplayTextType) {
      fieldType = "TEXT";
      finalInputType = "";
      fieldText = "Display Text";
    } else if (
      ["TEXT", "DROPDOWN", "CHECKBOX", "NUMBER", "SIGNATURE"].includes(
        actualInputType,
      ) &&
      !isBillingType
    ) {
      fieldType = "STANDARD";
      finalInputType = actualInputType;
    } else if (
      isBillingType &&
      ["TEXT", "NUMBER", "DROPDOWN"].includes(actualInputType)
    ) {
      fieldType = "BILLING";
      finalInputType = actualInputType;
    } else {
      // Default to STANDARD TEXT
      fieldType = "STANDARD";
      finalInputType = "TEXT";
    }

    // Find next available field number
    const allFieldNames = pages.flatMap((p) =>
      p.fields.map((f) => f.field_name),
    );
    const existingNumbers = allFieldNames
      .map((name) => {
        const match = name?.match(/^Field\s+(\d+)$/i);
        return match ? parseInt(match[1], 10) : NaN;
      })
      .filter((num) => !isNaN(num));

    const nextNumber = Math.max(0, ...existingNumbers) + 1;

    const newFieldId = Math.random().toString(36).substring(2, 9);

    const newField: InputFormRegistration = {
      field_id: newFieldId,
      field_name: `Field ${nextNumber}`,
      field_text: fieldText,
      field_type: fieldType,
      field_order_id: 0,
      required: fieldType === "BILLING" && finalInputType === "TEXT",
      input_type: finalInputType,
      placeholder: "",
      editable_by_member: false,
      phone_number_input: false,
      sensitive_information: false,
      ...(fieldType === "BILLING" && {
        currency: "ZAR",
      }),
    };

    setRecentlyAddedFieldId(newFieldId);

    setPages((prevPages) =>
      prevPages.map((page, index) => {
        if (index === pageIndex) {
          const nextFields = [...page.fields].sort(
            (a, b) => Number(a.field_order_id) - Number(b.field_order_id),
          );
          const boundedInsertIndex = Math.max(
            0,
            Math.min(insertIndex ?? nextFields.length, nextFields.length),
          );

          nextFields.splice(boundedInsertIndex, 0, newField);

          return {
            ...page,
            fields: nextFields.map(
              (f, i) =>
                ({
                  ...f,
                  field_order_id: i + 1,
                }) as unknown as InputFormRegistration,
            ),
          };
        }
        return page;
      }),
    );
  };

  const getFieldTypeLabel = (
    inputType: string,
  ): { label: string; description: string } => {
    const fieldMap: Record<string, { label: string; description: string }> = {
      TEXT: { label: "Text Display", description: "Static text for display" },
      STANDARD_TEXT: {
        label: "Text Input",
        description: "Single-line text input",
      },
      DROPDOWN: {
        label: "Dropdown",
        description: "Select from predefined options",
      },
      CHECKBOX: { label: "Checkbox", description: "Boolean toggle field" },
      NUMBER: { label: "Number", description: "Numeric input field" },
      SIGNATURE: { label: "Signature", description: "Signature capture field" },
      BILLING_TEXT: {
        label: "Billing Text",
        description: "Text amount for billing",
      },
      BILLING_NUMBER: {
        label: "Billing Number",
        description: "Numeric amount for billing",
      },
      BILLING_DROPDOWN: {
        label: "Billing Dropdown",
        description: "Select from billing options",
      },
    };
    return fieldMap[inputType] || { label: inputType, description: "" };
  };

  const paletteGroups: PaletteFieldGroup[] = [
    {
      id: "display",
      title: "Display Fields",
      fields: [
        {
          id: "palette-TEXT",
          label: "Text Display",
          description: "Static text for display",
        },
      ],
    },
    {
      id: "standard",
      title: "Standard Input Fields",
      fields: [
        {
          id: "palette-STANDARD_TEXT",
          label: "Text Input",
          description: "Single-line text input",
        },
        {
          id: "palette-DROPDOWN",
          label: "Dropdown",
          description: "Select from options",
        },
        {
          id: "palette-CHECKBOX",
          label: "Checkbox",
          description: "Boolean toggle",
        },
        {
          id: "palette-NUMBER",
          label: "Number",
          description: "Numeric input",
        },
        {
          id: "palette-SIGNATURE",
          label: "Signature",
          description: "Signature capture",
        },
      ],
    },
    {
      id: "billing",
      title: "Billing Fields",
      fields: [
        {
          id: "palette-BILLING_TEXT",
          label: "Billing Text",
          description: "Text amount",
        },
        {
          id: "palette-BILLING_NUMBER",
          label: "Billing Number",
          description: "Numeric amount",
        },
        {
          id: "palette-BILLING_DROPDOWN",
          label: "Billing Dropdown",
          description: "Select billing option",
        },
      ],
    },
  ];

  const normalizedPaletteSearchTerm = paletteSearchTerm.trim().toLowerCase();
  const filteredPaletteGroups = paletteGroups
    .map((group) => ({
      ...group,
      fields: group.fields.filter((field) => {
        if (!normalizedPaletteSearchTerm) {
          return true;
        }

        return [field.label, field.description]
          .join(" ")
          .toLowerCase()
          .includes(normalizedPaletteSearchTerm);
      }),
    }))
    .filter((group) => group.fields.length > 0);

  const togglePaletteGroup = (groupId: PaletteFieldGroup["id"]) => {
    setOpenPaletteGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const handleMemberPreviewFieldValue = (
    pageIndex: number,
    fieldId: string,
    updater: (f: PageFieldBase) => PageFieldBase,
  ) => {
    if (memberPreviewRequiredFieldsMissing) {
      setMemberPreviewRequiredFieldsMissing(false);
    }

    setMemberPreviewPages((prevPages) =>
      prevPages.map((page, index) =>
        index === pageIndex
          ? {
              ...page,
              fields: page.fields.map((field) =>
                field.field_id === fieldId ? updater(field) : field,
              ),
            }
          : page,
      ),
    );
  };

  const getSortedPreviewFields = () =>
    [...(previewPages[currentPreviewPageIndex]?.fields ?? [])].sort(
      (a, b) => Number(a.field_order_id) - Number(b.field_order_id),
    );

  const activePreviewField = activeDragId
    ? getSortedPreviewFields().find((field) => field.field_id === activeDragId)
    : undefined;

  const previewCollisionDetection: CollisionDetection = (args) => {
    const pointerCollisions = pointerWithin(args);

    if (String(args.active.id).startsWith("palette-")) {
      return pointerCollisions;
    }

    if (pointerCollisions.length > 0) {
      return pointerCollisions;
    }

    return closestCenter(args);
  };

  const getDragOverlayLabel = (field: PageFieldBase) => {
    if (field.field_type === "TEXT") {
      return {
        title: field.field_text || "Text Display",
        description: "Static text block",
      };
    }

    return {
      title: field.field_name || "Untitled field",
      description: `${field.field_type} ${field.input_type.toLowerCase()} field`,
    };
  };

  const handlePreviewDragOver = (event: DragOverEvent) => {
    if (!String(event.active.id).startsWith("palette-")) {
      return;
    }

    const sortedFields = getSortedPreviewFields();

    if (!event.over) {
      setPreviewInsertIndex(null);
      return;
    }

    const overId = String(event.over.id);

    if (overId === `preview-page-${currentPreviewPageIndex}`) {
      setPreviewInsertIndex(sortedFields.length);
      return;
    }

    const overIndex = sortedFields.findIndex(
      (field) => field.field_id === overId,
    );

    if (overIndex >= 0) {
      setPreviewInsertIndex(overIndex);
      return;
    }

    setPreviewInsertIndex(null);
  };

  const handlePreviewDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const activeId = String(active.id);
    const overId = over ? String(over.id) : null;

    if (activeId.startsWith("palette-")) {
      const fieldType = activeId.replace("palette-", "");
      const sortedFields = getSortedPreviewFields();
      const canDropOnPreview =
        overId &&
        (overId === `preview-page-${currentPreviewPageIndex}` ||
          sortedFields.some((field) => field.field_id === overId));

      if (canDropOnPreview) {
        handleAddFieldFromPalette(
          currentPreviewPageIndex,
          fieldType,
          previewInsertIndex ?? sortedFields.length,
        );
      }

      setActiveDragId(null);
      setPreviewInsertIndex(null);
      return;
    }

    if (!overId || activeId === overId) {
      setActiveDragId(null);
      setPreviewInsertIndex(null);
      return;
    }

    const sortedFields = getSortedPreviewFields();
    const oldIndex = sortedFields.findIndex(
      (field) => field.field_id === activeId,
    );

    if (oldIndex === -1) {
      setActiveDragId(null);
      setPreviewInsertIndex(null);
      return;
    }

    let newIndex = sortedFields.findIndex((field) => field.field_id === overId);

    if (
      overId === `preview-page-${currentPreviewPageIndex}` ||
      newIndex === -1
    ) {
      newIndex = sortedFields.length - 1;
    }

    if (newIndex !== oldIndex && newIndex >= 0) {
      const reorderedFields = arrayMove(sortedFields, oldIndex, newIndex).map(
        (field, index) => ({
          ...field,
          field_order_id: String(index + 1),
        }),
      );

      handlePreviewFieldsReorder(currentPreviewPageIndex, reorderedFields);
    }

    setActiveDragId(null);
    setPreviewInsertIndex(null);
  };

  if (isLoading) {
    return (
      <div className="p-5 min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-5 pt-5 w-[90%] min-h-screen flex flex-col">
      <div className="flex justify-between items-center mb-4 sticky top-0 bg-white z-20 py-4">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Registration Form
            </h1>
            <p className="text-muted-foreground">
              Here you can build your dynamic member registration form for
              members to use and register to the club.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <label htmlFor="form-name-input" className="text-sm font-medium text-slate-700 whitespace-nowrap">Form name</label>
              <Input
                id="form-name-input"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Join Club"
                className="h-8 w-56 text-sm"
              />
            </div>
          </div>
        </div>
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setMemberPreviewPages(
                previewPages.map((page) => ({
                  ...page,
                  fields: page.fields.map((field) => ({ ...field })),
                })),
              );
              setMemberPreviewPageIndex(currentPreviewPageIndex);
              setMemberPreviewRequiredFieldsMissing(false);
              setIsMemberPreviewOpen(true);
            }}
          >
            <EyeIcon className="mr-2 h-4 w-4" />
            Preview Form
          </Button>
          <Button onClick={saveRegistrationForm} disabled={saving || !hasUnsavedChanges}>
            {"Save Form"}
          </Button>
        </div>
      </div>
      <div ref={contentRef} className="flex-1 overflow-hidden space-y-8">
        <Sheet open={isMemberPreviewOpen} onOpenChange={setIsMemberPreviewOpen}>
          <SheetContent side="right" className="w-full max-w-none overflow-y-auto sm:max-w-4xl">
            <SheetHeader className="border-b border-gray-200">
              <SheetTitle>Registration Form Preview</SheetTitle>
              <SheetDescription>
                This uses the reusable member-facing registration form component.
              </SheetDescription>
            </SheetHeader>

            <div className="p-6">
              <ReusableRegistrationForm
                clubName={club?.club_name ?? ""}
                clubCurrency={club?.currency ?? "ZAR"}
                textFieldClassName="!bg-transparent !rounded-none !border-0 !p-0 text-slate-900 shadow-none prose-base leading-7 [&_p]:text-slate-900 [&_p]:leading-7 [&_strong]:text-slate-950 [&_strong]:font-semibold [&_em]:text-slate-800 [&_li]:text-slate-900 [&_li]:leading-7"
                clubProfileUrl={
                  club
                    ? ((club as unknown as Record<string, unknown>)
                        ?.club_profile_url as string)
                    : undefined
                }
                pages={memberPreviewPages}
                currentPageIndex={memberPreviewPageIndex}
                setCurrentPageIndex={setMemberPreviewPageIndex}
                setFieldValue={handleMemberPreviewFieldValue}
                requiredFieldsMissing={memberPreviewRequiredFieldsMissing}
                headerTitle={formName || "Join Club"}
                headerDescription="This is the member-facing preview of your registration form."
                showHeader={true}
                showNavigation={true}
                onContinue={() => setMemberPreviewRequiredFieldsMissing(false)}
              />
            </div>
          </SheetContent>
        </Sheet>

        {(saving || isLoading) && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )}

        {!isLoading && !saving && (
          <div className="flex h-full min-h-0 flex-col border-t pt-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-bold"></h2>
            </div>
            {isFormEmpty && showBuilderInstructions && (
              <div className="relative mb-4 rounded-xl border border-orange-200 bg-orange-50 px-5 py-4 pr-12 text-sm text-orange-900 shadow-sm">
                <button
                  type="button"
                  onClick={() => setShowBuilderInstructions(false)}
                  className="absolute right-3 top-3 rounded-sm p-1 text-orange-500 transition-colors hover:bg-orange-100 hover:text-orange-700"
                  aria-label="Dismiss form builder instructions"
                  title="Dismiss"
                >
                  <XIcon className="h-4 w-4" />
                </button>
                <p className="font-semibold">How to build your form</p>
                <p className="text-orange-800">
                  Drag fields from the Available Fields panel into the form preview
                  to build your registration form. Drop between existing fields to
                  control the order, then click a field to edit it.
                </p>
              </div>
            )}
            <div className="mb-6 shrink-0">
              <Tabs
                value={currentPreviewPageIndex.toString()}
                onValueChange={(v) => setCurrentPreviewPageIndex(Number(v))}
              >
                <TabsList className="flex items-center max-w-full">
                  <div className="flex-1 flex overflow-x-auto flex-nowrap custom-thin-scrollbar space-x-2 py-1">
                    {previewPages.map((p) => (
                      <TabsTrigger
                        key={`preview-${p.page_index}`}
                        value={p.page_index.toString()}
                        className="w-[200px] flex-shrink-0 px-3 truncate !flex-none"
                      >
                        {p.page_header.length > 20
                          ? `${p.page_header.slice(0, 20)}...`
                          : p.page_header}
                      </TabsTrigger>
                    ))}
                  </div>

                  <div className="ml-2 flex-shrink-0">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          onClick={() => addPage("preview")}
                          variant="outline"
                          className="border-gray-300 shadow mr-1 h-[30px] w-[35px]"
                        >
                          <PlusIcon />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Add new preview page</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </TabsList>
              </Tabs>
            </div>
            <DndContext
              sensors={sensors}
              collisionDetection={previewCollisionDetection}
              onDragStart={(event) => {
                setActiveDragId(String(event.active.id));
                if (String(event.active.id).startsWith("palette-")) {
                  setPreviewInsertIndex(null);
                }
              }}
              onDragOver={handlePreviewDragOver}
              onDragCancel={() => {
                setActiveDragId(null);
                setPreviewInsertIndex(null);
              }}
              onDragEnd={handlePreviewDragEnd}
            >
              <div className="flex h-[calc(100vh-19rem)] min-h-[40rem] gap-6 overflow-hidden">
                {/* Field Palette Sidebar */}
                <div className="w-56 flex-shrink-0 self-start">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">
                      Available Fields
                    </h3>
                    <p className="mb-4 text-xs leading-5 text-gray-600">
                      Drag any field into the form preview to add it. Drop it
                      between fields to place it exactly where you want.
                    </p>
                    <div className="mb-4 relative">
                      <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        value={paletteSearchTerm}
                        onChange={(event) => setPaletteSearchTerm(event.target.value)}
                        placeholder="Search fields"
                        className="pl-9 bg-white"
                      />
                    </div>
                    <div className="space-y-3">
                      {filteredPaletteGroups.length > 0 ? (
                        filteredPaletteGroups.map((group) => {
                          const isOpen = normalizedPaletteSearchTerm
                            ? true
                            : openPaletteGroups[group.id];

                          return (
                            <Collapsible key={group.id} open={isOpen}>
                              <div className="rounded-md border border-gray-200 bg-white">
                                <CollapsibleTrigger
                                  type="button"
                                  onClick={() => togglePaletteGroup(group.id)}
                                  className="flex w-full items-center justify-between px-3 py-2 text-left"
                                >
                                  <span className="text-xs font-semibold uppercase text-gray-600">
                                    {group.title}
                                  </span>
                                  {isOpen ? (
                                    <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                                  ) : (
                                    <ChevronRightIcon className="h-4 w-4 text-gray-500" />
                                  )}
                                </CollapsibleTrigger>
                                <CollapsibleContent className="px-2 pb-2">
                                  {group.fields.map((field) => (
                                    <FieldPaletteItem
                                      key={field.id}
                                      id={field.id}
                                      label={field.label}
                                      description={field.description}
                                    />
                                  ))}
                                </CollapsibleContent>
                              </div>
                            </Collapsible>
                          );
                        })
                      ) : (
                        <div className="rounded-md border border-dashed border-gray-300 bg-white px-3 py-6 text-center text-sm text-gray-500">
                          No fields match your search.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto pr-2">
                  <AdminRegistrationForm
                    clubName={club?.club_name ?? ""}
                    clubCurrency={club?.currency ?? "ZAR"}
                    clubProfileUrl={
                      club
                        ? ((club as unknown as Record<string, unknown>)
                            ?.club_profile_url as string)
                        : undefined
                    }
                    pages={previewPages}
                    currentPageIndex={currentPreviewPageIndex}
                    setCurrentPageIndex={setCurrentPreviewPageIndex}
                    setFieldValue={() => {}}
                    headerDescription="This is a preview of your registration form."
                    showHeader={true}
                    showNavigation={false}
                    customActions={null}
                    isEditing={true}
                    onPageHeaderChange={handlePreviewPageHeaderChange}
                    onFieldEdit={handlePreviewFieldEdit}
                    onFieldDelete={handlePreviewFieldDelete}
                    onFieldsReorder={handlePreviewFieldsReorder}
                    onAddFieldFromPalette={handleAddFieldFromPalette}
                    pageDropZoneId={`preview-page-${currentPreviewPageIndex}`}
                    paletteInsertIndex={
                      activeDragId?.startsWith("palette-")
                        ? previewInsertIndex
                        : null
                    }
                    recentlyAddedFieldId={recentlyAddedFieldId}
                  />

                  {editingField && (
                    <FieldInputEditorDialog
                      currency={club?.currency ?? "ZAR"}
                      field={editingField}
                      allPages={originalPages}
                      update={handleFieldEditComplete}
                      openDialog={openEditDialog}
                      setOpenDialog={setOpenEditDialog}
                    />
                  )}
                </div>
              </div>
              <DragOverlay dropAnimation={null}>
                {activeDragId && activeDragId.startsWith("palette-") ? (
                  <div className="bg-blue-500 text-white p-4 rounded-lg shadow-xl border-2 border-blue-600 pointer-events-none">
                    <p className="font-semibold">
                      {
                        getFieldTypeLabel(activeDragId.replace("palette-", ""))
                          .label
                      }
                    </p>
                    <p className="text-sm opacity-90">
                      {
                        getFieldTypeLabel(activeDragId.replace("palette-", ""))
                          .description
                      }
                    </p>
                  </div>
                ) : activePreviewField ? (
                  <div className="w-[min(42rem,calc(100vw-3rem))] rounded-lg border border-blue-200 bg-white/95 p-4 shadow-2xl pointer-events-none">
                    <p className="text-sm font-semibold text-gray-900">
                      {getDragOverlayLabel(activePreviewField).title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {getDragOverlayLabel(activePreviewField).description}
                    </p>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        )}
      </div>
    </div>
  );
}
