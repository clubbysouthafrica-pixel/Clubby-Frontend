import { Button } from "@/components/ui/button";
import DynamicFormBuilder from "@/components/dynamic-page-form-builder";
import { useContext, useEffect, useState } from "react";
import { ClubContext, ClubContextType } from "@/context/ClubContext";
import { useCreateClubMutation } from "@/mutations/admin/useRegistrationMutation";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InputFormRegistration, PageFormRegistration } from "@/interfaces/formRegistration";
import { Loader2, PlusIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import ConfirmDeleteDialog from "@/components/dialog-confirm-delete";
import { useFetchRegisterationForm } from "@/queries/admin/registration-form";
import { createDeleteFieldsRequest } from "@/helpers/admin/registration/verify-delete-fields-structure";
import { createPagesRequest } from "@/helpers/admin/registration/verify-create-pages-structure";
import { PreviewForm } from "@/components/admin/registration-form/preview-form/preview-form";
import "../../index.css";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DialogTrigger } from "@/components/ui/dialog";

export default function AdminRegistrationFormPage() {
    const { club } = useContext(ClubContext) as ClubContextType
    const [deletedFields, setDeletedFields] = useState<string[]>([]);

    const { mutate } = useCreateClubMutation()
    const { data, isLoading } = useFetchRegisterationForm(club?.club_account_id as string)

    const [saving, setSaving] = useState(false);

    const [previewRegForm, setPreviewRegForm] = useState(false);

    const defaultPage = { page_index: 0, page_header: "Page 1", fields: [] }

    const [pages, setPages] = useState<PageFormRegistration[]>([defaultPage])
    const [originalPages, setOriginalPages] = useState<PageFormRegistration[]>([defaultPage])

    const displayToast = () => toast.success("Successfully saved registration form")
    const displayErrorToast = (e: any) => toast.error(((e as AxiosError).response?.data as any)?.message)


    useEffect(() => {
        if (data?.pages?.length) {
            const sortedPages = data.pages.sort((a: any, b: any) => a.page_index - b.page_index)
            setOriginalPages(sortedPages)
            setPages(sortedPages)
        }
    }, [data])

    useEffect(() => {
        const style = document.createElement('style');
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
                },
                onError: (e) => {
                    displayErrorToast(e);
                    setSaving(false);
                },
            }
        );
    };

    const addPage = () => {
        setPages((v: PageFormRegistration[]) => v.length > 0 ? [...v, { page_header: `Page ${v.length + 1}`, page_index: v.length, fields: [] }] : [defaultPage])
    }

    const removePage = (pageIndex: number) => {
        setPages(
            (v: PageFormRegistration[]) =>
                v.filter(v => v.page_index !== pageIndex)
                    .map((p, i) => ({ ...p, page_index: i }))
        )

        pages[pageIndex].fields.forEach(field => {
            setDeletedFields(prev => [...prev, field.field_id] as any);
        })
    }

    const changePageHeader = (pageIndex: number, value: string) => {
        setPages(pages?.map((f) => (f.page_index === pageIndex ? { ...f, page_header: value } : f)));
    };

    const setFields = (pageIndex: number, fields: InputFormRegistration[]) => {
        setPages(p => p
            .map(i => i.page_index === pageIndex ? ({
                ...i,
                fields: fields
            }) : i))
    }

    if (isLoading) {
        return (
            <div className="p-5 min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    return (
        <div className="p-5 w-[90%]">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-base font-bold">Create the member registration form</h1>
                    <p className="text-muted-foreground">
                        Here you can build your dynamic member registration form for members to use and register to the club.
                    </p>
                </div>
                <div className="flex gap-4">
                    <Button
                        onClick={() => setPreviewRegForm((prev) => !prev)}
                    >
                        {previewRegForm ? "Edit Form" : "Preview form"}
                    </Button>
                    <Button onClick={saveRegistrationForm}>{"Save Form"}</Button>
                </div>
            </div>

            {(saving || isLoading) && (
                <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            )}

            {
                !isLoading && !saving && previewRegForm && <PreviewForm clubName={club?.club_name ?? ""} currency={club?.currency ?? "ZAR"} formPages={pages} />
            }

            {!isLoading && !saving && !previewRegForm &&
                <Tabs defaultValue='0'>
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
                                    <Button onClick={addPage} variant="outline" className="border-gray-300 shadow mr-1 h-[30px] w-[35px]">
                                        <PlusIcon />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Add new page</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    </TabsList>
                    {
                        pages.map(p => (
                            <TabsContent value={p.page_index.toString()} key={p.page_index}>
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <p className="font-bold">{p.page_header} (Page {p.page_index + 1})</p>
                                        <ConfirmDeleteDialog tooltipDescription="Remove page" id={p.page_index} removeFunc={removePage} />
                                    </div>
                                    <Input value={p.page_header} onChange={v => changePageHeader(p.page_index, v.target.value)} placeholder="change page header" />
                                    <DynamicFormBuilder currency={club?.currency ?? "ZAR"} clubAccountId={club?.club_account_id as string} page={p} setFields={setFields} deletedFields={deletedFields} setDeletedFields={setDeletedFields} />
                                </div>
                            </TabsContent>
                        ))
                    }
                </Tabs>
            }
        </div>
    );
}