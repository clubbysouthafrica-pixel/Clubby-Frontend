import { Button } from "@/components/ui/button";
import { useFetchRegistrationForm } from "@/queries/registration-form";
import { AlertCircle, Loader2, CheckCircle2Icon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import StandardCheckbox from "@/components/member/registration-form/standard-checkbox";
import BillingDropdown from "@/components/member/registration-form/billing-dropdown";
import StandardDopdown from "@/components/member/registration-form/standard-dropdown";
import StandardText from "@/components/member/registration-form/standard-text";
import StandardSignature from "@/components/member/registration-form/standard-signature";
import BillingText from "@/components/member/registration-form/billing-text";
import {
  createValidRegistrationRequest,
  type SubmitRegistrationRequest,
  type FieldRequest as SubmitFieldRequest,
} from "../../../helpers/admin/registration/create-registration-request";
import { getFieldName } from "@/helpers/members/registration/get-field-name";
import { formatAmount } from "@/data/currencies";
import { useMemberRegistrationMutation } from "@/mutations/admin/useMemberRegistrationMutation";

export type InputType =
  | "TEXT"
  | "DROPDOWN"
  | "CHECKBOX"
  | "NUMBER"
  | "SIGNATURE";
export type FieldType = "TEXT" | "STANDARD" | "BILLING";

export interface BillingOption {
  option_order_id: string;
  amount: number;
  label: string;
}

// Local view model for displaying field breakdowns is inferred from
// SubmitRegistrationRequest's FieldRequest. No separate interface needed.

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
  currency?: string;
  amount?: number;
  value?: string;
  signature_type?: string;
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

interface RegistrationFormProps {
  email: string;
  firstName: string;
  surname: string;
  clubAccountId: string;
  clubCurrency?: string;
  onEditDetails: () => void;
  onSuccess?: () => void;
}

export function RegistrationForm({
  email,
  firstName: _firstName,
  surname: _surname,
  clubAccountId,
  clubCurrency = "ZAR",
  onEditDetails
}: RegistrationFormProps) {
  const { data, isLoading } = useFetchRegistrationForm(clubAccountId);
  const { mutate, isPending, isSuccess } = useMemberRegistrationMutation();

  // Use actual names for display
  const firstName = _firstName;
  const surname = _surname;

  // TODO: firstName and surname captured for backend submission

  const [submitRegistrationError, setSubmitRegistrationError] = useState<
    string | undefined
  >(undefined);
  const [pages, setPages] = useState<FormPage[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [requiredFieldsMissing, setRequiredFieldsMissing] = useState(false);
  const [registrationRequest, setRegistrationRequest] = useState<
    SubmitRegistrationRequest | undefined
  >(undefined);
  const [totalRegistrationFee, setTotalRegistrationFee] = useState(0);
  const [isRegistering, setIsRegistering] = useState(false);
  // const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!(data as PagedFormPayload)?.pages) return;

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
  }, [data]);

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
    // Smoothly scroll to top when navigating to the next page
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const registerUser = async () => {
    if (missingRequired.length > 0) {
      setRequiredFieldsMissing(true);
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
    const request: SubmitRegistrationRequest = createValidRegistrationRequest(
      allFields,
      clubAccountId,
      email,
      surname,
      firstName
    );
    setRegistrationRequest(request);

    let total = 0;
    request.billing_fields.forEach((field) => {
      total += Number(field.value ?? 0);
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
        onError: (error) => {
          let message = "Registration failed";
          if (error && typeof error === "object") {
            const err = error as { response?: { data?: { message?: string } }; message?: string };
            message = err.response?.data?.message ?? err.message ?? message;
          }
          setSubmitRegistrationError(message);
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-5 min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header strip aligned with page content */}
      <div className="border-b py-1 mb-3">
        <div className="flex justify-center items-center gap-4 text-sm text-center">
          <span>
            Name:{" "}
            <strong>
              {firstName} {surname}
            </strong>
          </span>
          <span className="text-muted-foreground">|</span>
          <span>
            Email: <strong>{email}</strong>
          </span>
        </div>
        {isSuccess && (
          <div className="mt-2">
            <Alert className="flex items-center justify-center gap-2 text-center">
              <CheckCircle2Icon color="green" className="w-6 h-6" />
              <AlertTitle className="text-green-800 mt-2">
                Registration successful!
              </AlertTitle>
            </Alert>
          </div>
        )}
        {(isLoading || isPending) && (
          <div className="flex justify-center py-4">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )}
      </div>

      {!isSuccess && pages.length > 0 && (
        <form>
          <div className="space-y-2">
            <div className="grid gap-2">
              {registrationRequest && (
                <div className="h-[300px] overflow-y-auto px-2 py-2 border rounded-lg space-y-2 bg-muted/10">
                  {/* Total Registration Fee */}
                  <div className="p-3 bg-muted/20 rounded-lg">
                    <h2 className="text-base font-semibold mb-2">
                      Total Registration Fee:{" "}
                      <strong>
                        {formatAmount(totalRegistrationFee, clubCurrency)}
                      </strong>
                    </h2>
                    <ul className="ml-6 list-disc space-y-1">
                      {registrationRequest.billing_fields.map(
                        (f: SubmitFieldRequest) => (
                          <li key={f.field_id} className="text-xs">
                            {getFieldName(pages, f.field_id)}:{" "}
                            {formatAmount(f?.value as number, clubCurrency)}
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
                      Once your registration is submitted, you must visit the{" "}
                      <strong>Payments & Billing</strong> tab in your associated
                      club profile to view available payment methods and
                      instructions for paying any outstanding amounts.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Clubby is <strong>not responsible</strong> for any
                      incorrect payments, misdirected payments, or payment
                      errors. Please follow the instructions on the Payments tab
                      carefully.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Ensure all billing information is correct to avoid delays
                      in processing your membership.
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
                  className="space-y-6 px-2 py-2"
                >
                  {pages[currentPageIndex].fields
                    .sort(
                      (a, b) =>
                        Number(a.field_order_id) - Number(b.field_order_id)
                    )
                    .map((field) => {
                      if (field.field_type === "TEXT" && field.field_text) {
                        const cleaned = field.field_text
                          .replace(
                            /<ol>(\s*<li[^>]*data-list="bullet"[^>]*>[\s\S]*?)<\/ol>/g,
                            "<ul>$1</ul>"
                          )
                          .replace(/<span class="ql-ui"[^>]*><\/span>/g, "");

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
                            key={field.field_id}
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
                            key={field.field_id}
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
                        const signatureField = {
                          field_id: field.field_id,
                          field_name: field.field_name,
                          field_type: field.field_type,
                          input_type: field.input_type,
                          signature_type: field.signature_type ?? "signature",
                          placeholder: field.placeholder,
                          required: field.required,
                          value: field.value as string | undefined,
                        };
                        return (
                          <StandardSignature
                            key={field.field_id}
                            field={signatureField}
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
                            key={field.field_id}
                            field={field}
                            clubCurrency={clubCurrency}
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
                            key={field.field_id}
                            field={field}
                            clubCurrency={clubCurrency}
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
                  onClick={registerUser}
                  disabled={isRegistering}
                  className="w-full mt-2"
                  size="sm"
                >
                  {isRegistering ? "Processing..." : "Continue"}
                </Button>
              ) : !registrationRequest ? (
                <div className="flex justify-between items-center pt-3 border-t mt-2">
                  {currentPageIndex > 0 ? (
                    <Button
                      variant={"outline"}
                      type="button"
                      size="sm"
                      className="w-[90px]"
                      disabled={isRegistering}
                      onClick={() => {
                        setCurrentPageIndex((i) => i - 1);
                        setSubmitRegistrationError(undefined);
                        // Smoothly scroll to top when navigating to the previous page
                        window.scrollTo({ top: 0, behavior: "smooth" });
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
                      onClick={registerUser}
                      disabled={isRegistering}
                    >
                      {isRegistering ? "..." : "Continue"}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      className="w-[90px]"
                      disabled={isRegistering}
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
                    disabled={isRegistering}
                    onClick={returnBackToRegistrationForm}
                  >
                    Back to form
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={submitRegistration}
                    disabled={isRegistering}
                  >
                    {isRegistering ? "Submitting..." : "Submit registration"}
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
                  Please fill all required fields. These fields are marked with
                  (*).
                </AlertDescription>
              </Alert>
            )}

            <div className="text-center text-xs mt-2 pt-2 border-t">
              <button
                type="button"
                onClick={onEditDetails}
                className="underline underline-offset-4"
              >
                Edit your details
              </button>
            </div>
          </div>
        </form>
      )}

      {isSuccess && (
        <div className="text-center space-y-4 py-8">
          <p className="text-sm text-muted-foreground">
            Your registration has been submitted. Please check your email for
            further instructions.
          </p>
          <Button onClick={onEditDetails} variant="outline">
            Back to club
          </Button>
        </div>
      )}
    </div>
  );
}
