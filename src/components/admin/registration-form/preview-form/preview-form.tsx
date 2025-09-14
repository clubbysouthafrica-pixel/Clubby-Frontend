import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { useEffect, useState } from "react";
import { formatAmount } from "@/data/currencies";
import StandardCheckbox from "../../../member/registration-form/standard-checkbox";
import BillingDropdown from "../../../member/registration-form/billing-dropdown";
import StandardDopdown from "../../../member/registration-form/standard-dropdown";
import StandardText from "../../../member/registration-form/standard-text";
import { PageFormRegistration } from "@/interfaces/formRegistration";

// --- Types that match the new payload ---
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
  field_text?: string; // helper/label text
  field_name: string; // title when STANDARD/BILLING
  required?: boolean;
  input_type: InputType; // when STANDARD/BILLING
  placeholder?: string;
  options?: string[]; // for STANDARD DROPDOWN
  billingOptions?: BillingOption[]; // for BILLING DROPDOWN
  currency?: string; // for BILLING
  amount?: number; // for BILLING fixed price (cents)
  value?: string | number; // typed text or selected label
  selectedAmountCents?: number; // derived for BILLING when dropdown
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

interface PreviewFormProps extends React.ComponentProps<"div"> {
  currency: string;
  formPages: PageFormRegistration[];
}

export function PreviewForm({
  className,
  currency,
  formPages,
  ...props
}: PreviewFormProps) {
  const [pages, setPages] = useState<FormPage[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [requiredFieldsMissing, setRequiredFieldsMissing] = useState(false);

  useEffect(() => {
    const sorted = [...formPages]
      .sort((a, b) => a.page_index - b.page_index)
      .map((p, index) => ({
        ...p,
        page_index: index,
        fields: [...p.fields]
          .sort((a, b) => Number(a.field_order_id) - Number(b.field_order_id))
          .map((f) => ({ ...f })),
      }));

    setPages(sorted as any);
  }, [formPages]);

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

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardContent>
          {pages.length > 0 && (
            <form>
              <div className="grid-2 gap-6">
                <div className="grid gap-6">

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
                              field={field as any}
                              currentPageIndex={currentPageIndex}
                              setFieldValue={setFieldValue as any}
                            />
                          )
                        }

                        if (field.field_type === "STANDARD" && field.input_type === "DROPDOWN") {
                          return (
                            <StandardDopdown
                              field={field as any}
                              currentPageIndex={currentPageIndex}
                              pages={pages}
                              setFieldValue={setFieldValue}
                            />
                          )
                        }

                        if (field.field_type === "STANDARD" && (field.input_type === "TEXT" || field.input_type === "NUMBER")) {
                          return (
                            <StandardText
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
                              field={field as any}
                              clubCurrency={currency}
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
                                {formatAmount(field.amount ?? 0, currency)}
                              </span>
                            </p>
                          );
                        }
                        return null;
                      })}
                  </div>

                  {pages.length > 1 && (
                    <div className="flex justify-between items-center mt-6 w-full">
                      {currentPageIndex > 0 ? (
                        <Button
                          type="button"
                          className="px-6 py-2 rounded-lg shadow-sm"
                          onClick={() => setCurrentPageIndex((i) => i - 1)}
                        >
                          Previous
                        </Button>
                      ) : (
                        <div />  // Empty spacer to keep layout
                      )}

                      {currentPageIndex < pages.length - 1 ? (
                        <Button
                          type="button"
                          className="px-6 py-2 rounded-lg shadow-sm"
                          onClick={() => setCurrentPageIndex((i) => i + 1)}
                        >
                          Next
                        </Button>
                      ) : (
                        <div />  // Empty spacer to keep layout
                      )}
                    </div>
                  )}
                </div>

                <div className="text-center text-sm mt-4">
                </div>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
