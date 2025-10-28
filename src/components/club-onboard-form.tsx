import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FormEvent, useContext, useEffect, useMemo, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { useFetchRegisterationForm } from "@/queries/registration-form";
import { useFetchClub } from "@/queries/clubs";
import { RegistrationRequest } from "@/requests/registration-request";
import { useMemberRegistrationMutation } from "@/mutations/useMemberRegistrationMutation";
import { toast } from "sonner";
import { formatAmount } from "@/data/currencies";
import { AuthContext, AuthContextType } from "@/context/AuthContext";
import StandardCheckbox from "./member/registration-form/standard-checkbox";
import BillingDropdown from "./member/registration-form/billing-dropdown";
import StandardDopdown from "./member/registration-form/standard-dropdown";
import StandardText from "./member/registration-form/standard-text";
import StandardSignature from "./member/registration-form/standard-signature";
import BillingText from "./member/registration-form/billing-text";
import { createValidRegistrationRequest } from "../helpers/members/registration/create-registration-request";
import { getFieldName } from "../helpers/members/registration/get-field-name";

export type InputType = "TEXT" | "DROPDOWN" | "CHECKBOX" | "NUMBER" | "SIGNATURE";
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
  multiplier?: boolean
  multiplier_value?: number
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

async function presignedUrlToDataUrl(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function ClubRegisterForm() {
  const { user } = useContext(AuthContext) as AuthContextType;
  const { clubId } = useParams();
  const navigate = useNavigate();

  const { mutate, isPending, isError, error: registerError, isSuccess } =
    useMemberRegistrationMutation();
  const { data, isLoading } = useFetchRegisterationForm(clubId as string);
  const { data: club, isLoading: clubLoading } = useFetchClub(
    clubId as string
  );

  const [email, setEmail] = useState("");
  const [pages, setPages] = useState<FormPage[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [requiredFieldsMissing, setRequiredFieldsMissing] = useState(false);
  const [registrationRequest, setRegistrationRequest] = useState<RegistrationRequest | undefined>(undefined)
  const [totalRegistrationFee, setTotalRegistrationFee] = useState(0);
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    const processPages = async () => {
      if (!(data as PagedFormPayload)?.pages) return;

      // Sort pages and fields
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

      if (!club?.meta) return;

      const updatedPages = await Promise.all(
        sorted.map(async (page) => ({
          ...page,
          fields: await Promise.all(
            page.fields.map(async (field) => {
              const metaField = club.meta[field.field_id];
              if (!metaField) return field;

              if (metaField?.signature_type === "signature") {
                const dataUrl = await presignedUrlToDataUrl(metaField.value);
                return {
                  ...field,
                  value: dataUrl,
                  signature_type: "signature"
                };
              } else if (field.billingOptions) {
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
            })
          ),
        }))
      );

      setPages(updatedPages);
    };

    processPages();
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
            if (f.value == null || f.selectedAmountCents == null) missing.push({ page: p.page_index, field: f });
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
        if (f.field_type === "BILLING" && f.input_type === "DROPDOWN") return f.value == null || f.selectedAmountCents == null;
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

    const request: RegistrationRequest = createValidRegistrationRequest(allFields, clubId as string)

    if (!user) (request as any).email = email;
    setRegistrationRequest(request)

    let total = 0
    request.billing_fields.forEach(field => {
      total += field.value
    })
    setTotalRegistrationFee(total)
  };

  const submitRegistration = () => {
    setIsRegistering(true)
    if (registrationRequest) {
      mutate(registrationRequest, {
        onSuccess: () => {
          navigate(`/clubs/${clubId}`)
          setIsRegistering(false)
        },
        onError: () => toast(registerError?.message ?? "Registration failed"),
      });
    }
  }

  const returnBackToRegistrationForm = () => {
    setRegistrationRequest(undefined)
    setTotalRegistrationFee(0)
  }

  const isLastPage = currentPageIndex === pages.length - 1;

  return (
    <div className="flex justify-center items-center">
      <Card className="w-[800px] overflow-y-auto gap-2">
        <CardHeader className="text-center">
          {clubLoading && isLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}
          {!clubLoading && (
            <CardTitle className="text-xl text-center">
              {!isSuccess ? "Register to" : "Successfully Registered to"} {club?.club_name}
            </CardTitle>
          )}
          <CardDescription>
            {!isSuccess
              ? "Finish the registration form below"
              : "Club will stay in contact with you once registration is completed."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isSuccess && pages.length > 0 && (
            <form>
              <div className="gap-6">
                <div className="grid gap-6">
                  {!user && (
                    <div className="grid gap-3">
                      <Label htmlFor="user_email">Email Address</Label>
                      <Input
                        id="user_email"
                        type="email"
                        placeholder="Enter your email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  )}

                  {registrationRequest && (
                    <div className="h-[350px] p-2 overflow-y-auto p-4 border border-gray-200 rounded space-y-4 bg-white shadow-sm">
                      {/* Total Registration Fee */}
                      <div>
                        <h2 className="text-lg font-semibold mb-2">
                          Total Registration Fee: <strong>{formatAmount(totalRegistrationFee, club.currency)}</strong>
                        </h2>
                        <ul className="ml-6 list-disc space-y-1">
                          {registrationRequest.billing_fields.map((f: FieldRequest) => (
                            <li key={f.field_id} className="text-sm">
                              {getFieldName(pages, f.field_id)}: {formatAmount(f?.value as number, club.currency)}
                              {f.label ? ` (${f.label})` : ""}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-gray-50 p-3 rounded border border-gray-200 space-y-2">
                        <p className="font-medium text-yellow-700">⚠️ Please review your membership information carefully before submitting.</p>
                        <p>
                          Once your registration is submitted, you must visit the <strong>Payments & Billing</strong> tab in your associated club profile to view available payment methods and instructions for paying any outstanding amounts.
                        </p>
                        <p className="text-sm text-gray-500">
                          Clubby is <strong>not responsible</strong> for any incorrect payments, misdirected payments, or payment errors. Please follow the instructions on the Payments tab carefully.
                        </p>
                        <p className="text-sm text-gray-500">
                          Ensure all billing information is correct to avoid delays in processing your membership.
                        </p>
                      </div>
                    </div>
                  )}

                  <h3 className="text-[20px] font-semibold text-center">{pages[currentPageIndex].page_header}</h3>
                  {pages[currentPageIndex] && !registrationRequest && (
                    <div key={pages[currentPageIndex].page_index} className="space-y-6 overflow-y-auto h-[350px] p-2">
                      {pages[currentPageIndex].fields
                        .sort((a: any, b: any) => a.field_order_id - b.field_order_id)
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
                                className="prose text-gray-700 [&_ul]:list-disc [&_ul]:list-inside [&_ul]:ml-5 [&_ol]:list-decimal [&_ol]:list-inside [&_ol]:ml-5"
                                dangerouslySetInnerHTML={{ __html: cleaned }}
                              />
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

                          if (field.field_type === "STANDARD" && field.input_type === "SIGNATURE") {
                            return (
                              <StandardSignature
                                key={field.field_id}
                                field={field as any}
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
                                clubCurrency={club.currency}
                                currentPageIndex={currentPageIndex}
                                pages={pages}
                                setFieldValue={setFieldValue}
                              />
                            );
                          }

                          if (field.field_type === "BILLING" && field.input_type === "TEXT") {
                            return (
                              <BillingText
                                field={field}
                                clubCurrency={club.currency}
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

                  {isError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        {registerError?.message}
                      </AlertDescription>
                    </Alert>
                  )}

                  {pages.length === 1 && !registrationRequest ? (
                    <Button type="button" onClick={(e) => registerUser(e as any)} disabled={isPending}>
                      {isPending ? "Registering..." : "Continue"}
                    </Button>
                  ) : !registrationRequest ? (
                    <div className="flex justify-between">
                      {currentPageIndex > 0 && (
                        <Button variant={"outline"} type="button" onClick={() => setCurrentPageIndex((i) => i - 1)} disabled={isPending}>
                          Previous
                        </Button>
                      )}
                      {isLastPage ? (
                        <Button type="button" onClick={(e) => registerUser(e as any)} disabled={isPending}>
                          {isPending ? "Registering..." : "Continue"}
                        </Button>
                      ) : (
                        <Button type="button" onClick={handleNextPage} disabled={isPending}>
                          Next
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="flex justify-between">
                      <Button variant={"outline"} type="button" onClick={returnBackToRegistrationForm} disabled={isPending}>
                        Back to form
                      </Button>
                      <Button type="button" onClick={submitRegistration} disabled={isPending}>
                        {isRegistering ? "Registering..." : "Submit registration"}
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

                <div className="text-center text-sm mt-4">
                  Go back to club?{" "}
                  <Link to={`/clubs/${clubId}`} className="underline underline-offset-4">
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
                  <Link to={`/clubs/${clubId}`}>
                    <Button className="w-full">Back to club</Button>
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
