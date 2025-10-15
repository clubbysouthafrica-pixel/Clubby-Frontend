import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { FormEvent, useContext, useEffect, useMemo, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { useFetchRegisterationForm } from "@/queries/admin/registration-form";
import { useFetchClub } from "@/queries/admin/clubs";
import { AdminRegistrationRequest } from "@/requests/registration-request";
import { useMemberRegistrationMutation } from "@/mutations/admin/useMemberRegistrationMutation";
import { CheckCircle2Icon } from "lucide-react"
import { formatAmount } from "@/data/currencies";
import StandardCheckbox from "../../../member/registration-form/standard-checkbox";
import BillingDropdown from "../../../member/registration-form/billing-dropdown";
import StandardDopdown from "../../../member/registration-form/standard-dropdown";
import StandardText from "../../../member/registration-form/standard-text";
import { createValidRegistrationRequest } from "../../../../helpers/admin/registration/create-registration-request";
import { getFieldName } from "../../../../helpers/members/registration/get-field-name";
import { ClubContext, ClubContextType } from "@/context/ClubContext";

export type InputType = "TEXT" | "DROPDOWN" | "CHECKBOX" | "NUMBER";
export type FieldType = "TEXT" | "STANDARD" | "BILLING";

export interface BillingOption {
  option_order_id: string;
  amount: number; // in cents
  label: string;
}

export interface FieldRequest {
  field_id: string
  value: string | number
  option_order_id?: string
  label?: string
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
  options?: string[];
  billingOptions?: BillingOption[];
  currency?: string;
  amount?: number;
  value?: string;
  selectedAmountCents?: number;
  option_order_id?: string;
  label?: string;
}

export interface FormPage {
  page_index: number;
  page_header: string;
  fields: PageFieldBase[];
}

export interface PagedFormPayload {
  pages: FormPage[];
}

export function ClubRegisterForm({
  className,
  setShowRegistrationForm,
  memberEmail,
  memberFirstName,
  memberSurname,
  ...props
}: React.ComponentProps<"div"> & {
  memberEmail: string;
  memberFirstName: string;
  memberSurname: string;
  setShowRegistrationForm: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const { club } = useContext(ClubContext) as ClubContextType;
  const { mutate, isPending, isSuccess } =
    useMemberRegistrationMutation();
  const { data, isLoading } = useFetchRegisterationForm(club?.club_account_id as string);
  const { data: clubDetails, isLoading: clubLoading } = useFetchClub(club?.club_account_id as string);

  const [submitRegistrationError, setSubmitRegistrationError] = useState<string | undefined>(undefined);

  const [pages, setPages] = useState<FormPage[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [requiredFieldsMissing, setRequiredFieldsMissing] = useState(false);
  const [registrationRequest, setRegistrationRequest] = useState<AdminRegistrationRequest | undefined>(undefined)
  const [totalRegistrationFee, setTotalRegistrationFee] = useState(0);
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    if ((data as PagedFormPayload)?.pages) {
      const sorted = (data as PagedFormPayload).pages
        .sort((a, b) => a.page_index - b.page_index)
        .map((p, index) => ({
          ...p,
          page_index: index,
          fields: p.fields
            .sort((a, b) => Number(a.field_order_id) - Number(b.field_order_id))
            .map((f) => ({ ...f })),
        }));
      setPages(sorted);

      if (clubDetails?.meta) {
        const updatedPages = sorted.map((page) => ({
          ...page,
          fields: page.fields.map((field) => {
            const metaField = clubDetails.meta[field.field_id];
            if (!metaField) return field;

            if (field.billingOptions) {
              const matchedOption = field.billingOptions.find(
                (opt) => opt.option_order_id === metaField.option_order_id
              );

              if (matchedOption) {
                return {
                  ...field,
                  value: matchedOption.label,
                  label: matchedOption.label,
                  selectedAmountCents: matchedOption.amount,
                  option_order_id: matchedOption.option_order_id,
                };
              }
            } else {
              return {
                ...field,
                value: metaField.value,
              };
            }

            return field;
          }),
        }));
        setPages(updatedPages);
      }
    }
  }, [data, club]);

  const setFieldValue = (
    pageIndex: number,
    fieldId: string,
    updater: (f: PageFieldBase) => PageFieldBase
  ) => {
    if (requiredFieldsMissing) setRequiredFieldsMissing(false);
    setPages((prev) =>
      prev.map((p) =>
        p.page_index === pageIndex
          ? { ...p, fields: p.fields.map((f) => (f.field_id === fieldId ? updater(f) : f)) }
          : p
      )
    );
  };

  const missingRequired = useMemo(() => {
    const missing: { page: number; field: PageFieldBase }[] = [];
    for (const p of pages) {
      for (const f of p.fields) {
        if (f.field_type === "STANDARD" && f.required) {
          if (f.input_type === "CHECKBOX") {
            if (!f.value || f.value !== "true") missing.push({ page: p.page_index, field: f });
          } else {
            if (!f.value || f.value.trim() === "") missing.push({ page: p.page_index, field: f });
          }
        }
        if (f.field_type === "BILLING" && f.required) {
          if (f.input_type === "DROPDOWN") {
            if (!f.value || !f.selectedAmountCents) missing.push({ page: p.page_index, field: f });
          }
        }
      }
    }
    return missing;
  }, [pages]);

  const handleNextPage = () => {
    const currentPage = pages[currentPageIndex];
    const missingOnCurrent = currentPage.fields.filter((f) => {
      if (f.required) {
        if (f.field_type === "STANDARD") return !f.value?.trim();
        if (f.field_type === "BILLING" && f.input_type === "DROPDOWN") return !f.value || !f.selectedAmountCents;
      }
      return false;
    });

    if (missingOnCurrent.length > 0) {
      setRequiredFieldsMissing(true);
      return;
    }

    setRequiredFieldsMissing(false);
    setCurrentPageIndex((i) => i + 1);
  };

  const registerUser = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (missingRequired.length > 0) {
      setRequiredFieldsMissing(true);
      return;
    }

    const allFields = pages.flatMap((p) => p.fields);

    const request: AdminRegistrationRequest = createValidRegistrationRequest(
      allFields,
      club?.club_account_id as string,
      memberEmail,
      memberSurname,
      memberFirstName
    )

    setRegistrationRequest(request)

    let total = 0
    request.billing_fields.forEach(field => {
      total += field.value
    })
    setTotalRegistrationFee(total)
  };

  const submitRegistration = () => {
    setIsRegistering(true)
    setSubmitRegistrationError(undefined)
    if (registrationRequest) {
      mutate(registrationRequest, {
        onSuccess: () => {
          setIsRegistering(false)
        },
        onError: (error: any) => {
          setSubmitRegistrationError(error.response.data.message ?? "Registration failed")
          setIsRegistering(false)
        }
      });
    }
  }

  const returnBackToRegistrationForm = () => {
    setRegistrationRequest(undefined)
    setTotalRegistrationFee(0)
  }

  const isLastPage = currentPageIndex === pages.length - 1;

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <h1 className="mt-0">Name: <strong>{memberFirstName} {memberSurname}</strong></h1>
          <h1 className="mt-0">Email: <strong>{memberEmail}</strong></h1>
          <CardDescription>
            {!isSuccess
              ? "Finish the registration form to register this member."
              :
              <Alert className="flex items-center justify-center gap-2 text-center">
                <CheckCircle2Icon color="green" className="w-6 h-6" />
                <AlertTitle className="text-green-800 mt-2">Registration successful!</AlertTitle>
              </Alert>
            }
          </CardDescription>
          {clubLoading && isLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}
        </CardHeader>
        <CardContent>
          {!isSuccess && pages.length > 0 && (
            <form>
              <div className="grid-2 gap-6">
                <div className="grid gap-6">

                  {registrationRequest && (
                    <div>
                      <Label className="mb-1 block">Total registration fee: {formatAmount(totalRegistrationFee, club?.currency)}</Label>
                      <ul className="ml-6 list-disc space-y-1">
                        {registrationRequest.billing_fields.map((f: FieldRequest) => (
                          <li key={f.field_id} className="font-small">
                            <Label className="font-normal">{getFieldName(pages, f.field_id)}: {formatAmount(f?.value as number, club?.currency)} {f.label ? `(${f.label})` : ""}</Label>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {pages[currentPageIndex] && !registrationRequest && (
                    <div key={pages[currentPageIndex].page_index} className="space-y-5">
                      <h3 className="text-lg font-semibold">{pages[currentPageIndex].page_header}</h3>
                      {pages[currentPageIndex].fields
                        .sort((a: any, b: any) => a.field_order_id - b.field_order_id)
                        .map((field) => {

                          if (field.field_type === "TEXT") {
                            return (
                              <p key={field.field_order_id} className="text-sm text-muted-foreground">
                                {field.field_text}
                              </p>
                            );
                          }

                          if (field.field_type === "STANDARD" && field.input_type === "CHECKBOX") {
                            return (
                              <StandardCheckbox
                                key={field.field_id}
                                field={field}
                                currentPageIndex={currentPageIndex}
                                setFieldValue={setFieldValue}
                              />
                            )
                          }

                          if (field.field_type === "STANDARD" && field.input_type === "DROPDOWN") {
                            return (
                              <StandardDopdown
                                field={field}
                                currentPageIndex={currentPageIndex}
                                pages={pages}
                                setFieldValue={setFieldValue}
                              />
                            )
                          }

                          if (field.field_type === "STANDARD" && (field.input_type === "TEXT" || field.input_type === "NUMBER")) {
                            return (
                              <StandardText
                                field={field}
                                currentPageIndex={currentPageIndex}
                                pages={pages}
                                setFieldValue={setFieldValue}
                              />
                            )
                          }

                          if (field.field_type === "BILLING" && field.input_type === "DROPDOWN") {
                            return (
                              <BillingDropdown
                                field={field}
                                clubCurrency={club?.currency}
                                currentPageIndex={currentPageIndex}
                                pages={pages}
                                setFieldValue={setFieldValue}
                              />
                            );
                          }

                          if (field.field_type === "BILLING" && field.input_type === "TEXT") {
                            return (
                              <p key={field.field_id}>
                                {field.field_name}:{" "}
                                <span className="font-semibold">
                                  {formatAmount(field.amount ?? 0, club?.currency)}
                                </span>
                              </p>
                            );
                          }
                          return null;
                        })}
                    </div>
                  )}

                  {pages.length === 1 && !registrationRequest ? (
                    <Button type="button" onClick={(e) => registerUser(e as any)} disabled={isPending}>
                      {isPending ? "Registering..." : "Continue"}
                    </Button>
                  ) : !registrationRequest ? (
                    <div className="flex justify-between">
                      {currentPageIndex > 0 && (
                        <Button variant={"outline"} type="button" onClick={() => { setCurrentPageIndex((i) => i - 1), setSubmitRegistrationError(undefined) }}>
                          Previous
                        </Button>
                      )}
                      {isLastPage ? (
                        <Button type="button" onClick={(e) => registerUser(e as any)} disabled={isPending}>
                          {isPending ? "Registering..." : "Continue"}
                        </Button>
                      ) : (
                        <Button type="button" onClick={handleNextPage}>
                          Next
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="flex justify-between">
                      <Button variant={"outline"} type="button" onClick={returnBackToRegistrationForm}>
                        Back to form
                      </Button>
                      <Button type="button" onClick={submitRegistration}>
                        {isRegistering ? "Registering..." : "Register member"}
                      </Button>
                    </div>
                  )}
                </div>

                <div className="text-center text-sm mt-4">
                  {requiredFieldsMissing && (
                    <Alert className="border border-red-600 text-red-600">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-xs text-red-600">
                        Please fill all required fields. These fields are marked with (*).
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {submitRegistrationError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      {submitRegistrationError}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="text-center text-sm mt-4">
                  <Link to="/manage/members/add" onClick={() => setShowRegistrationForm(false)} className="underline underline-offset-4">
                    Cancel
                  </Link>
                </div>
              </div>
            </form>
          )}

          {isSuccess && (
            <div>
              <div className="grid-2 gap-6">
                <div className="grid gap-6">
                  <Link to="/manage/members/add" onClick={() => setShowRegistrationForm(false)}>
                    <Button className="w-full">Add another member</Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
