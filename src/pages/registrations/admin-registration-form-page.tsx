import { Button } from "@/components/ui/button";
import Pager from "@/components/pager";
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
import { useFetchRegisterationForm } from "@/queries/registration-form";

export default function AdminRegistrationFormPage() {
    const { club } = useContext(ClubContext) as ClubContextType
    const [deletedFields, setDeletedFields] = useState<string[]>([]);

    const { mutate, isPending } = useCreateClubMutation()
    const {data, isLoading } = useFetchRegisterationForm(club?.club_account_id as string)

    const defaultPage = { page_index: 0, page_header: "Page 1", fields: []}

    const [pages, setPages] = useState<PageFormRegistration[]>([defaultPage])

    const displayToast = () => toast.success("Successfully saved registration form")
    const displayErrorToast = (e: any) => toast.error(((e as AxiosError).response?.data as any)?.message)


    useEffect(()=> {
        if (data?.pages?.length) {
            setPages(data.pages)
        }
    }, [data])

    const saveRegistrationForm = () => {
        const cleanedDeletedFields = deletedFields.filter(
            (field): field is string => typeof field === "string" && field.trim() !== ""
        );
        mutate({
            pages: pages,
            deleteFields: cleanedDeletedFields,
            club_account_id: club?.club_account_id as string,
        }, {
            onSuccess: displayToast,
            onError: displayErrorToast,
        })
    }

    const addPage = () => {
        setPages((v: PageFormRegistration[]) => v.length > 0 ? [...v, {page_header: `Page ${v.length+1}`, page_index: v.length, fields: []}] : [defaultPage])
    }

    const removePage = (pageIndex: number) => {
        setPages(
            (v: PageFormRegistration[]) =>
                v.filter(v => v.page_index !== pageIndex)
                .map((p, i) => ({ ...p, page_index: i }))
        )
    }

    const changePageHeader = (pageIndex: number, value: string) => {
        setPages(pages?.map((f) => (f.page_index === pageIndex ? { ...f, page_header: value } : f)));
    };

    const setFields = (pageIndex: number, fields: InputFormRegistration[]) => {
        setPages(p => p
            .map(i => i.page_index === pageIndex ? ({
                ...i,
                fields: fields
            }): i ))
    }

    return (
        <Pager>
            <div className="container max-w-4xl mx-auto px-4 py-16">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-base font-bold">Registration Form</h1>
                        <p className="text-muted-foreground">
                            Build your member registration form
                        </p>
                    </div>
                    <Button onClick={saveRegistrationForm} disabled={isPending}>{ isPending ? "Loading..." : "Save Form"}</Button>
                </div>

                {!isLoading &&
                    <Tabs defaultValue='0'>
                        <TabsList>
                            {pages.map(p => (
                                <TabsTrigger value={p.page_index.toString()} key={p.page_index}>{p.page_header}</TabsTrigger>
                            ))}

                            <Button onClick={addPage} className="ml-2 h-full" variant={'outline'}><PlusIcon/></Button>
                        </TabsList>
                            {isLoading && (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="h-8 w-8 animate-spin" />
                                </div>
                            )}
                            {
                                pages.map(p => (
                                    <TabsContent value={p.page_index.toString()} key={p.page_index}>
                                        <div>
                                            <div className="flex justify-between items-center mb-4">
                                                <p className="font-bold">{p.page_header} (Page {p.page_index + 1})</p>
                                                <ConfirmDeleteDialog tooltipDescription="Remove page" id={p.page_index} removeFunc={removePage} />
                                            </div>
                                            <Input value={p.page_header} onChange={v => changePageHeader(p.page_index, v.target.value)} placeholder="change page header"/>
                                            <DynamicFormBuilder currency={club?.currency ?? "ZAR"} clubAccountId={club?.club_account_id as string} page={p} setFields={setFields} deletedFields={deletedFields} setDeletedFields={setDeletedFields}/>
                                        </div>
                                    </TabsContent>
                                ))
                            }
                    </Tabs>
                }
            </div>
        </Pager>
    );
}