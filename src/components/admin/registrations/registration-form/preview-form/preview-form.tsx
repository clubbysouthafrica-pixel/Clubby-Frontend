import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { PageFormRegistration } from "@/interfaces/formRegistration";
import { ReusableRegistrationForm, FormPage } from "@/components/shared/registration/reusable-registration-form";
import type { PageFieldBase } from "@/components/shared/registration/reusable-registration-form";

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
          .map((f) => ({ ...f, field_order_id: String(f.field_order_id) })),
      }));

    setPages(sorted as unknown as FormPage[]);
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
    <div className={cn("", className)} {...props}>
      <ReusableRegistrationForm
        clubName={clubName}
        clubCurrency={currency}
        textFieldClassName="!bg-transparent !rounded-none !border-0 !p-0 text-slate-900 shadow-none prose-base leading-7 [&_p]:text-slate-900 [&_p]:leading-7 [&_strong]:text-slate-950 [&_strong]:font-semibold [&_em]:text-slate-800 [&_li]:text-slate-900 [&_li]:leading-7"
        pages={pages}
        currentPageIndex={currentPageIndex}
        setCurrentPageIndex={setCurrentPageIndex}
        setFieldValue={setFieldValue}
        requiredFieldsMissing={requiredFieldsMissing}
        headerDescription="This is a preview of your registration form. Fill in the fields to see how it looks!"
        showHeader={true}
        showNavigation={true}
      />
    </div>
  );
}
