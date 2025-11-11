import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardTitle,
} from "@/components/ui/card";
import { useEffect, useState } from "react";
import { 
  StandardCheckbox,
  BillingDropdown,
  StandardText,
  StandardSignature,
  BillingText,
  StandardDropdown
} from "../../../shared/registration/registration_form_fields";
import { PageFormRegistration } from "@/interfaces/formRegistration";

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
  options?: string[];
  billingOptions?: BillingOption[];
  currency?: string;
  amount?: number;
  value?: string | number;
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

interface PreviewFormProps extends React.ComponentProps<"div"> {
  currency: string;
  clubName: string;
  formPages: PageFormRegistration[];
}

export function PreviewForm({
  className,
  currency,
  formPages,
  clubName,
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
                  <CardTitle className="text-xl text-center underline">
                    {clubName}
                  </CardTitle>
                  <h3 className="text-lg font-semibold text-center">{pages[currentPageIndex].page_header}</h3>
                  <div key={pages[currentPageIndex].page_index} className="space-y-5">
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
                              field={field as any}
                              currentPageIndex={currentPageIndex}
                              setFieldValue={setFieldValue as any}
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

                        if (field.field_type === "STANDARD" && field.input_type === "DROPDOWN") {
                          return (
                            <StandardDropdown
                              key={field.field_id}
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
                              key={field.field_id}
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
                            <BillingText
                              field={field as any}
                              clubCurrency={currency}
                              currentPageIndex={currentPageIndex}
                              pages={pages}
                              setFieldValue={setFieldValue}
                            />
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
                          onClick={() => {
                            setCurrentPageIndex((i) => i - 1);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                        >
                          Previous
                        </Button>
                      ) : (
                        <div />
                      )}

                      {currentPageIndex < pages.length - 1 ? (
                        <Button
                          type="button"
                          className="px-6 py-2 rounded-lg shadow-sm"
                          onClick={() => {
                            setCurrentPageIndex((i) => i + 1);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
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
