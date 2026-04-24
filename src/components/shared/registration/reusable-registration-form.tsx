import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { ReactNode } from "react";
import {
  StandardCheckbox,
  BillingDropdown,
  BillingDiscountDropdown,
  StandardDropdown,
  StandardText,
  StandardSignature,
  BillingText,
  BillingNumber,
} from "./registration_form_fields";

export type InputType =
  | "TEXT"
  | "DROPDOWN"
  | "CHECKBOX"
  | "NUMBER"
  | "SIGNATURE"
  | "DISCOUNT";
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

interface ReusableRegistrationFormProps {
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
  requiredFieldsMissing: boolean;
  missingFieldNames?: string[];
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
  textFieldClassName?: string;
}

export function ReusableRegistrationForm({
  clubName,
  clubCurrency,
  clubProfileUrl,
  pages,
  currentPageIndex,
  setCurrentPageIndex,
  setFieldValue,
  requiredFieldsMissing,
  missingFieldNames,
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
  textFieldClassName,
}: ReusableRegistrationFormProps) {
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

  return (
    <div
      className={`flex flex-col gap-10 justify-center items-center px-3 lg:px-4 w-full overflow-x-hidden  bg-gradient-to-b from-gray-50 to-white ${className ?? "py-6 lg:py-12"}`}
    >
      <div
        className={`w-full max-w-2xl bg-white rounded-lg shadow-md overflow-hidden ${className}`}
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
        className={`w-full max-w-2xl mb-5 bg-white rounded-lg shadow-md overflow-hidden ${className}`}
      >
        <div className="px-6 lg:px-10 py-6 lg:py-8 overflow-x-hidden">
          {pages.length > 0 && (
            <form>
              <div className="space-y-0 min-w-0">
                <div className="min-w-0">
                  {topContent}

                  {pages[currentPageIndex] && (
                    <h2 className="text-2xl lg:text-2xl font-bold text-gray-900 pb-6 mb-8 border-b border-gray-300">
                      {pages[currentPageIndex].page_header}
                    </h2>
                  )}

                  {pages[currentPageIndex] && (
                    <div
                      key={pages[currentPageIndex].page_index}
                      className="space-y-6 lg:space-y-8"
                    >
                      {pages[currentPageIndex].fields
                        .sort(
                          (a, b) =>
                            Number(a.field_order_id) - Number(b.field_order_id),
                        )
                        .map((field) => {
                          if (field.field_type === "TEXT" && field.field_text) {
                            const cleaned = field.field_text
                              .replace(
                                /<ol>(\s*<li[^>]*data-list="bullet"[^>]*>[\s\S]*?)<\/ol>/g,
                                "<ul>$1</ul>",
                              )
                              .replace(
                                /<span class="ql-ui"[^>]*><\/span>/g,
                                "",
                              );

                            return (
                              <div
                                key={field.field_order_id}
                                className={`px-0 prose prose-sm max-w-none bg-blue-50 rounded-md p-4 break-words overflow-hidden w-full text-gray-700 [&_*]:break-words [&_*]:max-w-full [&_ul]:list-disc [&_ul]:list-inside [&_ul]:ml-5 [&_ol]:list-decimal [&_ol]:list-inside [&_ol]:ml-5 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-bold [&_h3]:text-lg [&_h3]:font-semibold [&_h4]:text-base [&_h4]:font-semibold [&_h5]:text-sm [&_h5]:font-semibold [&_h6]:text-xs [&_h6]:font-semibold ${textFieldClassName ?? ""}`}
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
                                pages={pages}
                                setFieldValue={setFieldValue}
                              />
                            );
                          }

                          if (
                            field.field_type === "STANDARD" &&
                            field.input_type === "DROPDOWN"
                          ) {
                            return (
                              <StandardDropdown
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
                            return (
                              <StandardSignature
                                key={field.field_id}
                                field={field as SignatureField}
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

                          if (
                            field.field_type === "BILLING" &&
                            field.input_type === "DISCOUNT"
                          ) {
                            return (
                              <BillingDiscountDropdown
                                key={field.field_id}
                                field={field}
                                currentPageIndex={currentPageIndex}
                                pages={pages}
                                setFieldValue={setFieldValue}
                              />
                            );
                          }

                          if (
                            field.field_type === "BILLING" &&
                            field.input_type === "NUMBER"
                          ) {
                            return (
                              <BillingNumber
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

                  {requiredFieldsMissing && (
                    <Alert className="border border-red-400 bg-red-50 text-red-800 mt-6 rounded-md">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      <AlertDescription className="text-sm text-red-800 ml-2">
                        Please fill all required fields.
                        {missingFieldNames && missingFieldNames.length > 0 && (
                          <div className="mt-2">
                            Missing:{" "}
                            <strong>{missingFieldNames.join(", ")}</strong>
                          </div>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}

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
