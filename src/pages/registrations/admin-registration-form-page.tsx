import { Button } from "@/components/ui/button";
import DynamicFormBuilder from "@/components/dynamic-page-form-builder";
import { useContext, useEffect, useRef, useState } from "react";
import { ClubContext, ClubContextType } from "@/context/ClubContext";
import { useCreateClubMutation } from "@/mutations/admin/useRegistrationMutation";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  InputFormRegistration,
  PageFormRegistration,
} from "@/interfaces/formRegistration";
import { Loader2, PlusIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import ConfirmDeleteDialog from "@/components/dialog-confirm-delete";
import { useFetchRegistrationForm } from "@/queries/admin/registration-form";
import { createDeleteFieldsRequest } from "@/helpers/admin/registration/verify-delete-fields-structure";
import { createPagesRequest } from "@/helpers/admin/registration/verify-create-pages-structure";
import { PreviewForm } from "@/components/admin/registration-form/preview-form/preview-form";
import "../../index.css";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function AdminRegistrationFormPage() {
  const { club } = useContext(ClubContext) as ClubContextType;
  const [deletedFields, setDeletedFields] = useState<string[]>([]);

  const { mutate } = useCreateClubMutation();
  const { data, isLoading } = useFetchRegistrationForm(
    club?.club_account_id as string,
  );

  const [saving, setSaving] = useState(false);

  const [previewRegForm, setPreviewRegForm] = useState(false);
  // controlled active tab so we can detect changes and scroll
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  // ref to the scrollable content area below the header
  const contentRef = useRef<HTMLDivElement | null>(null);
  // track previous field counts per page to detect when a field is added (use ref to avoid re-renders)
  const prevFieldCountsRef = useRef<Record<number, number>>({});

  const defaultPage = { page_index: 0, page_header: "Page 1", fields: [] };

  const [pages, setPages] = useState<PageFormRegistration[]>([defaultPage]);
  const [originalPages, setOriginalPages] = useState<PageFormRegistration[]>([
    defaultPage,
  ]);

  const displayToast = () =>
    toast.success("Successfully saved registration form");
  const displayErrorToast = (e: any) =>
    toast.error(((e as AxiosError).response?.data as any)?.message);

  useEffect(() => {
    if (data?.pages?.length) {
      const sortedPages = data.pages.sort(
        (a: any, b: any) => a.page_index - b.page_index,
      );
      setOriginalPages(sortedPages);
      setPages(sortedPages);
      // initialize prevFieldCounts map
      const counts: Record<number, number> = {};
      sortedPages.forEach(
        (p: any) => (counts[p.page_index] = p.fields?.length ?? 0),
      );
      prevFieldCountsRef.current = counts;
    }
  }, [data]);

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
        pages: createPagesRequest(pages),
        deleteFields: createDeleteFieldsRequest(deletedFields, originalPages),
        club_account_id: club?.club_account_id as string,
      },
      {
        onSuccess: () => {
          displayToast();
          setSaving(false);
          // Update originalPages with current pages so new fields are now locked
          setOriginalPages(pages);
        },
        onError: (e) => {
          displayErrorToast(e);
          setSaving(false);
        },
      },
    );
  };

  const addPage = () => {
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
          : [defaultPage];
      // jump to the new page after it's added
      setTimeout(() => setActiveTabIndex(next.length - 1), 0);
      return next;
    });
  };

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

  const removePage = (pageIndex: number) => {
    setPages((v: PageFormRegistration[]) =>
      v
        .filter((v) => v.page_index !== pageIndex)
        .map((p, i) => ({ ...p, page_index: i })),
    );

    pages[pageIndex].fields.forEach((field) => {
      setDeletedFields((prev) => [...prev, field.field_id] as any);
    });
  };

  const changePageHeader = (pageIndex: number, value: string) => {
    setPages(
      pages?.map((f) =>
        f.page_index === pageIndex ? { ...f, page_header: value } : f,
      ),
    );
  };

  const setFields = (pageIndex: number, fields: InputFormRegistration[]) => {
    setPages((p) =>
      p.map((i) =>
        i.page_index === pageIndex
          ? {
              ...i,
              fields: fields,
            }
          : i,
      ),
    );
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
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Registration Form
            </h1>
            <p className="text-muted-foreground">
              Here you can build your dynamic member registration form for
              members to use and register to the club.
            </p>
          </div>
        </div>
        <div className="flex gap-4">
          <Button onClick={() => setPreviewRegForm((prev) => !prev)}>
            {previewRegForm ? "Edit Form" : "Preview form"}
          </Button>
          <Button onClick={saveRegistrationForm}>{"Save Form"}</Button>
        </div>
      </div>
      <div ref={contentRef} className="flex-1 overflow-auto">
        {(saving || isLoading) && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )}

        {!isLoading && !saving && previewRegForm && (
          <PreviewForm
            clubName={club?.club_name ?? ""}
            currency={club?.currency ?? "ZAR"}
            formPages={pages}
          />
        )}

        {!isLoading && !saving && !previewRegForm && (
          <Tabs
            value={activeTabIndex.toString()}
            onValueChange={(v) => setActiveTabIndex(Number(v))}
          >
            <TabsList className="flex items-center max-w-full">
              <div className="flex-1 flex overflow-x-auto flex-nowrap custom-thin-scrollbar space-x-2 py-1">
                {pages.map((p) => (
                  <TabsTrigger
                    key={p.page_index}
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
                      onClick={addPage}
                      variant="outline"
                      className="border-gray-300 shadow mr-1 h-[30px] w-[35px]"
                    >
                      <PlusIcon />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Add new page</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </TabsList>
            {pages.map((p) => (
              <TabsContent value={p.page_index.toString()} key={p.page_index}>
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <p className="font-bold">
                      {p.page_header} (Page {p.page_index + 1})
                    </p>
                    <ConfirmDeleteDialog
                      tooltipDescription="Remove page"
                      id={p.page_index}
                      removeFunc={removePage}
                    />
                  </div>
                  <Input
                    value={p.page_header}
                    onChange={(v) =>
                      changePageHeader(p.page_index, v.target.value)
                    }
                    placeholder="change page header"
                  />
                  <DynamicFormBuilder
                    currency={club?.currency ?? "ZAR"}
                    clubAccountId={club?.club_account_id as string}
                    page={p}
                    allPages={originalPages}
                    setFields={setFields}
                    deletedFields={deletedFields}
                    setDeletedFields={setDeletedFields}
                  />
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </div>
  );
}
