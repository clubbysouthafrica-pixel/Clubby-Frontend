import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  value?: string;
  signature_type?: string;
  selectedAmountCents?: number;
  selectedDiscountPercentage?: number;
  applicable_billing_fields?: string[];
  option_order_id?: string;
  percentage?: number;
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
    updater: (f: PageFieldBase) => PageFieldBase
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
    <div className={`flex justify-center items-center px-0 lg:px-0 ${className ?? "py-4 lg:py-8"}`}>
      <Card className={`w-full lg:w-[800px] gap-2 border shadow-sm pt-0 ${className}`}>
        {showHeader && (
          <CardHeader className="border-b bg-muted/30 py-4 lg:py-6 pb-4 lg:pb-6 flex flex-col items-center gap-3">
            {clubProfileUrl && (
              <img
                src={clubProfileUrl}
                alt="Club Profile"
                className="w-24 h-24 rounded-full object-cover border-3 border-white shadow-md"
              />
            )}
            <div className="flex flex-col items-center gap-2">
              <CardTitle className="text-base lg:text-3xl text-center">
                {headerTitle || clubName}
              </CardTitle>
              {headerDescription && (
                <CardDescription className="text-center text-xs lg:text-xs">
                  {headerDescription}
                </CardDescription>
              )}
            </div>
          </CardHeader>
        )}
        <CardContent className="py-3 lg:py-2 px-2 lg:px-4 overflow-x-hidden">
          {pages.length > 0 && (
            <form>
              <div className="space-y-2 lg:space-y-2 min-w-0">
                <div className="grid gap-2 lg:gap-2 min-w-0">
                  {topContent}

                  {pages[currentPageIndex] && (
                    <h3 className="text-2xl lg:text-2xl font-semibold text-center border-b pb-4">
                      {pages[currentPageIndex].page_header}
                    </h3>
                  )}

                  {pages[currentPageIndex] && (
                    <div
                      key={pages[currentPageIndex].page_index}
                      className="space-y-4 lg:space-y-6 px-1 lg:px-2 py-2 lg:py-2"
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
                              .replace(
                                /<span class="ql-ui"[^>]*><\/span>/g,
                                ""
                              );

                            return (
                              <div
                                key={field.field_order_id}
                                className="prose prose-sm max-w-none bg-muted/10 rounded-lg break-words overflow-hidden w-full [&_*]:break-words [&_*]:max-w-full [&_ul]:list-disc [&_ul]:list-inside [&_ul]:ml-5 [&_ol]:list-decimal [&_ol]:list-inside [&_ol]:ml-5 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-bold [&_h3]:text-lg [&_h3]:font-semibold [&_h4]:text-base [&_h4]:font-semibold [&_h5]:text-sm [&_h5]:font-semibold [&_h6]:text-xs [&_h6]:font-semibold"
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
                      <Button
                        type="button"
                        onClick={onContinue}
                        disabled={isPending}
                        className="w-full mt-2"
                        size="sm"
                      >
                        {isPending ? "Processing..." : "Continue"}
                      </Button>
                    ) : (
                      <div className="flex flex-col lg:flex-row justify-between items-center gap-2 lg:gap-0 pt-3 border-t mt-2">
                        {currentPageIndex > 0 ? (
                          <Button
                            variant="outline"
                            type="button"
                            size="sm"
                            className="w-full lg:w-[90px]"
                            onClick={handlePrevious}
                            disabled={isPending}
                          >
                            Previous
                          </Button>
                        ) : (
                          <div className="w-full lg:w-[90px]" />
                        )}
                        <div className="text-xs lg:text-xs text-muted-foreground flex-1 text-center order-first lg:order-none">
                          Page {currentPageIndex + 1} of {pages.length}
                        </div>
                        {isLastPage ? (
                          <Button
                            type="button"
                            size="sm"
                            className="w-full lg:w-[90px]"
                            onClick={onContinue}
                            disabled={isPending}
                          >
                            {isPending ? "..." : "Continue"}
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            className="w-full lg:w-[90px]"
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
                    <Alert className="border border-red-600 text-red-600 mt-2">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-xs lg:text-xs text-red-600">
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
        </CardContent>
      </Card>
    </div>
  );
}
