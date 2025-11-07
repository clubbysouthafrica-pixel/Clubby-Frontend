import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Link } from "react-router-dom";
import { FormEvent, useContext, useEffect, useMemo, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { useFetchRegistrationForm } from "@/queries/admin/registration-form";
import { useFetchClub } from "@/queries/admin/clubs";
import { AdminRegistrationRequest } from "@/requests/registration-request";
import { useMemberRegistrationMutation } from "@/mutations/admin/useMemberRegistrationMutation";
import { CheckCircle2Icon } from "lucide-react";
import { formatAmount } from "@/data/currencies";
import StandardCheckbox from "../../../member/registration-form/standard-checkbox";
import BillingDropdown from "../../../member/registration-form/billing-dropdown";
import StandardDopdown from "../../../member/registration-form/standard-dropdown";
import StandardText from "../../../member/registration-form/standard-text";
import BillingText from "../../../member/registration-form/billing-text";
import { createValidRegistrationRequest } from "../../../../helpers/admin/registration/create-registration-request";
import { getFieldName } from "../../../../helpers/members/registration/get-field-name";
import { ClubContext, ClubContextType } from "@/context/ClubContext";
import StandardSignature from "../../../member/registration-form/standard-signature";

export type InputType =
  | "TEXT"
  | "DROPDOWN"
  | "CHECKBOX"
  | "NUMBER"
  | "SIGNATURE";
export type FieldType = "TEXT" | "STANDARD" | "BILLING";

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
  const { mutate, isPending, isSuccess } = useMemberRegistrationMutation();
  const { data, isLoading } = useFetchRegistrationForm(
    club?.club_account_id as string
  );
  const { data: clubDetails, isLoading: clubLoading } = useFetchClub(
    club?.club_account_id as string
  );

  const [submitRegistrationError, setSubmitRegistrationError] = useState<
    string | undefined
  >(undefined);

  const [pages, setPages] = useState<FormPage[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [requiredFieldsMissing, setRequiredFieldsMissing] = useState(false);
  const [registrationRequest, setRegistrationRequest] = useState<
    AdminRegistrationRequest | undefined
  >(undefined);
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
          ? {
              ...p,
              fields: p.fields.map((f) =>
                f.field_id === fieldId ? updater(f) : f
              ),
            }
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
            if (!f.value || f.value !== "true")
              missing.push({ page: p.page_index, field: f });
          } else {
            if (!f.value || f.value.trim() === "")
              missing.push({ page: p.page_index, field: f });
          }
        }
        if (f.field_type === "BILLING" && f.required) {
          if (f.input_type === "DROPDOWN") {
            if (f.value == null || f.selectedAmountCents == null)
              missing.push({ page: p.page_index, field: f });
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
        if (f.field_type === "BILLING" && f.input_type === "DROPDOWN")
          return f.value == null || f.selectedAmountCents == null;
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
      // If there are missing required fields on other pages,
      // navigate to the first page that contains a missing required field
      // so the user can fill it in.
      try {
        const firstMissingPage = missingRequired[0]?.page;
        if (typeof firstMissingPage === "number") {
          setCurrentPageIndex(firstMissingPage);
        }
      } catch {
        // noop - fall back to staying on current page and showing the alert
      }
      return;
    }

    const allFields = pages.flatMap((p) => p.fields);

    const request: AdminRegistrationRequest = createValidRegistrationRequest(
      allFields,
      club?.club_account_id as string,
      memberEmail,
      memberSurname,
      memberFirstName
    );

    setRegistrationRequest(request);

    let total = 0;
    request.billing_fields.forEach((field) => {
      total += field.value;
    });
    setTotalRegistrationFee(total);
  };

  const submitRegistration = () => {
    setIsRegistering(true);
    setSubmitRegistrationError(undefined);
    if (registrationRequest) {
      mutate(registrationRequest, {
        onSuccess: () => {
          setIsRegistering(false);
        },
        onError: (error: any) => {
          setSubmitRegistrationError(
            error.response.data.message ?? "Registration failed"
          );
          setIsRegistering(false);
        },
      });
    }
  };

  const returnBackToRegistrationForm = () => {
    setRegistrationRequest(undefined);
    setTotalRegistrationFee(0);
  };

  const isLastPage = currentPageIndex === pages.length - 1;
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="w-[800px] overflow-y-auto border shadow-sm pt-0">
        <CardHeader className="border-b bg-muted/30 py-1 pb-1">
          <h1 className="text-l text-center pt-2">
            Name:{" "}
            <strong>
              {memberFirstName} {memberSurname}
            </strong>
          </h1>
          <h1 className="text-l text-center">
            Email: <strong>{memberEmail}</strong>
          </h1>
          <CardDescription className="text-center text-xs">
            {!isSuccess ? (
              "Finish the registration form to register this member."
            ) : (
              <Alert className="flex items-center justify-center gap-2 text-center">
                <CheckCircle2Icon color="green" className="w-6 h-6" />
                <AlertTitle className="text-green-800 mt-2">
                  Registration successful!
                </AlertTitle>
              </Alert>
            )}
          </CardDescription>
          {clubLoading && isLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}
        </CardHeader>
        <CardContent className="py-2 px-4">
          {!isSuccess && pages.length > 0 && (
            <form>
              <div className="space-y-2">
                <div className="grid gap-2">
                  {registrationRequest && (
                    <div className="h-[350px] overflow-y-auto px-2 py-2 border rounded-lg space-y-2 bg-muted/10">
                      {/* Total Registration Fee */}
                      <div className="p-3 bg-muted/20 rounded-lg">
                        <h2 className="text-base font-semibold mb-2">
                          Total Registration Fee:{" "}
                          <strong>
                            {formatAmount(totalRegistrationFee, club?.currency as string)}
                          </strong>
                        </h2>
                        <ul className="ml-6 list-disc space-y-1">
                          {registrationRequest.billing_fields.map(
                            (f: FieldRequest) => (
                              <li key={f.field_id} className="text-xs">
                                {getFieldName(pages, f.field_id)}:{" "}
                                {formatAmount(
                                  f?.value as number,
                                  club?.currency as string
                                )}
                                {f.label ? ` (${f.label})` : ""}
                              </li>
                            )
                          )}
                        </ul>
                      </div>

                      <div className="bg-muted/20 p-3 rounded-lg border space-y-2">
                        <p className="text-xs font-semibold text-yellow-700">
                          ⚠️ Please review your membership information carefully
                          before submitting.
                        </p>
                        <p className="text-xs">
                          Once your registration is submitted, you must visit
                          the <strong>Payments & Billing</strong> tab in your
                          associated club profile to view available payment
                          methods and instructions for paying any outstanding
                          amounts.
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Clubby is <strong>not responsible</strong> for any
                          incorrect payments, misdirected payments, or payment
                          errors. Please follow the instructions on the Payments
                          tab carefully.
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Ensure all billing information is correct to avoid
                          delays in processing your membership.
                        </p>
                      </div>
                    </div>
                  )}
                  {!registrationRequest && (
                    <h3 className="text-base font-semibold text-center border-b pb-2">
                      {pages[currentPageIndex].page_header}
                    </h3>
                  )}
                  {pages[currentPageIndex] && !registrationRequest && (
                    <div
                      key={pages[currentPageIndex].page_index}
                      className="space-y-1 overflow-y-auto h-[350px] px-2 py-2"
                    >
                      {pages[currentPageIndex].fields
                        .sort(
                          (a: any, b: any) =>
                            a.field_order_id - b.field_order_id
                        )
                        .map((field) => {
                          if (field.field_type === "TEXT" && field.field_text) {
                            const cleaned = field.field_text
                              .replace(
                                /<ol>(\s*<li[^>]*data-list="bullet"[^>]*>[\s\S]*?)<\/ol>/g,
                                "<ul>$1</ul>"
                              )
                              .replace(
                                /<span class="ql-ui"[^>]*><\/span>/g,
                                ""
                              );

                            return (
                              <div
                                key={field.field_order_id}
                                className="prose prose-sm max-w-none text-gray-700 p-3 bg-muted/10 rounded-lg text-xs [&_ul]:list-disc [&_ul]:list-inside [&_ul]:ml-5 [&_ol]:list-decimal [&_ol]:list-inside [&_ol]:ml-5"
                                dangerouslySetInnerHTML={{ __html: cleaned }}
                              />
                            );
                          }

                          if (
                            field.field_type === "STANDARD" &&
                            field.input_type === "CHECKBOX"
                          ) {
                            return (
                              <StandardCheckbox
                                key={field.field_id}
                                field={field}
                                currentPageIndex={currentPageIndex}
                                setFieldValue={setFieldValue}
                              />
                            );
                          }

                          if (
                            field.field_type === "STANDARD" &&
                            field.input_type === "DROPDOWN"
                          ) {
                            return (
                              <StandardDopdown
                                field={field}
                                currentPageIndex={currentPageIndex}
                                pages={pages}
                                setFieldValue={setFieldValue}
                              />
                            );
                          }

                          if (
                            field.field_type === "STANDARD" &&
                            (field.input_type === "TEXT" ||
                              field.input_type === "NUMBER")
                          ) {
                            return (
                              <StandardText
                                field={field}
                                currentPageIndex={currentPageIndex}
                                pages={pages}
                                setFieldValue={setFieldValue}
                              />
                            );
                          }

                          if (
                            field.field_type === "STANDARD" &&
                            field.input_type === "SIGNATURE"
                          ) {
                            return (
                              <StandardSignature
                                key={field.field_id}
                                field={field as any}
                                currentPageIndex={currentPageIndex}
                                pages={pages}
                                setFieldValue={setFieldValue}
                              />
                            );
                          }

                          if (
                            field.field_type === "BILLING" &&
                            field.input_type === "DROPDOWN"
                          ) {
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

                          if (
                            field.field_type === "BILLING" &&
                            field.input_type === "TEXT"
                          ) {
                            return (
                              <BillingText
                                field={field}
                                clubCurrency={club?.currency}
                                currentPageIndex={currentPageIndex}
                                pages={pages}
                                setFieldValue={setFieldValue}
                              />
                            );
                          }
                          return null;
                        })}
                    </div>
                  )}

                  {pages.length === 1 && !registrationRequest ? (
                    <Button
                      type="button"
                      onClick={(e) => registerUser(e as any)}
                      disabled={isPending}
                      className="w-full mt-2"
                      size="sm"
                    >
                      {isPending ? "Registering..." : "Continue"}
                    </Button>
                  ) : !registrationRequest ? (
                    <div className="flex justify-between items-center pt-3 border-t mt-2">
                      {currentPageIndex > 0 ? (
                        <Button
                          variant={"outline"}
                          type="button"
                          size="sm"
                          className="w-[90px]"
                          disabled={isPending}
                          onClick={() => {
                            setCurrentPageIndex((i) => i - 1),
                              setSubmitRegistrationError(undefined);
                          }}
                        >
                          Previous
                        </Button>
                      ) : (
                        <div className="w-[90px]" />
                      )}
                      <div className="text-xs text-muted-foreground flex-1 text-center">
                        Page {currentPageIndex + 1} of {pages.length}
                      </div>
                      {isLastPage ? (
                        <Button
                          type="button"
                          size="sm"
                          className="w-[90px]"
                          onClick={(e) => registerUser(e as any)}
                          disabled={isPending}
                        >
                          {isPending ? "..." : "Continue"}
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          className="w-[90px]"
                          disabled={isPending}
                          onClick={handleNextPage}
                        >
                          Next
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="flex justify-between items-center pt-3 border-t mt-2">
                      <Button
                        variant={"outline"}
                        type="button"
                        size="sm"
                        className="w-[110px]"
                        disabled={isPending}
                        onClick={returnBackToRegistrationForm}
                      >
                        Back to form
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={submitRegistration}
                      >
                        {isRegistering ? "Registering..." : "Register member"}
                      </Button>
                    </div>
                  )}
                </div>

                {submitRegistrationError && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      {submitRegistrationError}
                    </AlertDescription>
                  </Alert>
                )}

                {requiredFieldsMissing && (
                  <Alert className="border border-red-600 text-red-600 mt-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-xs text-red-600">
                      Please fill all required fields. These fields are marked
                      with (*).
                    </AlertDescription>
                  </Alert>
                )}

                <div className="text-center text-xs mt-2 pt-2 border-t">
                  <Link
                    to="/manage/members/add"
                    onClick={() => setShowRegistrationForm(false)}
                    className="underline underline-offset-4"
                  >
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
                  <Link
                    to="/manage/members/add"
                    onClick={() => setShowRegistrationForm(false)}
                  >
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
