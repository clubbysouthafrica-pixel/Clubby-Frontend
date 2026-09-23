import { ArrowLeft, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useFetchMemberRegisteration } from "@/queries/admin/registration-form";
import { RegistrationFieldImages } from "@/components/shared/registration/registration-field-images";
import { isImageFieldValue } from "@/helpers/registration/parse-uploaded-images";
import { cn } from "@/lib/utils";

interface PublicMemberRegistrationViewProps {
  clubAccountId: string;
  userId: string;
  currency: string;
  registrationId?: string;
  onBack: () => void;
}

type RegistrationPageField = {
  type?: string;
  label: string;
  value?: string | null;
  input_type?: string;
  signature_type?: string;
  visible?: boolean;
};

type RegistrationPage = {
  fields: RegistrationPageField[];
  page_header?: string;
};

function formatEpoch(epoch: number) {
  return new Intl.DateTimeFormat("en-ZA", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(epoch));
}

function parseBooleanLikeValue(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return null;

  const normalized = value.trim().toLowerCase();
  if (normalized === "true" || normalized === "yes") return true;
  if (normalized === "false" || normalized === "no") return false;
  return null;
}

function RegistrationFieldValue({ field }: { field: RegistrationPageField }) {
  if (field.type === "STANDARD_SIGNATURE") {
    if (field.signature_type === "signature") {
      return (
        <img
          src={field.value ?? ""}
          alt="Signature"
          className="max-w-xs border-b-2 border-slate-400 pb-2"
        />
      );
    }

    return (
      <p className="border-b-2 border-slate-400 pb-2 text-lg font-[cursive] text-slate-700">
        {field.value}
      </p>
    );
  }

  if (
    field.type === "STANDARD_IMAGE" ||
    (field.type === "STANDARD_OTHER" && isImageFieldValue(field.value))
  ) {
    return <RegistrationFieldImages value={field.value} />;
  }

  if (field.type === "TEXT") {
    const cleaned = field.label
      .replace(/<ol>(\s*<li[^>]*data-list="bullet"[^>]*>[\s\S]*?)<\/ol>/g, "<ul>$1</ul>")
      .replace(/<span class="ql-ui"[^>]*><\/span>/g, "");

    return (
      <div
        className="prose prose-sm max-w-none text-slate-700 [&_ol]:ml-5 [&_ol]:list-inside [&_ol]:list-decimal [&_ul]:ml-5 [&_ul]:list-inside [&_ul]:list-disc"
        dangerouslySetInnerHTML={{ __html: cleaned }}
      />
    );
  }

  if (
    field.input_type === "CHECKBOX" ||
    parseBooleanLikeValue(field.value) !== null
  ) {
    const checked = parseBooleanLikeValue(field.value) === true;

    return (
      <div
        className={cn(
          "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium",
          checked
            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
            : "border-rose-200 bg-rose-50 text-rose-700",
        )}
      >
        <span
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded-full border text-xs",
            checked
              ? "border-emerald-500 bg-emerald-100 text-emerald-700"
              : "border-rose-500 bg-rose-100 text-rose-700",
          )}
        >
          {checked ? "✓" : "✗"}
        </span>
        {checked ? "Yes" : "No"}
      </div>
    );
  }

  return <p className="text-sm leading-6 text-slate-700">{field.value || "-"}</p>;
}

export function PublicMemberRegistrationView({
  clubAccountId,
  userId,
  currency,
  registrationId,
  onBack,
}: PublicMemberRegistrationViewProps) {
  const { data, isLoading, isError } = useFetchMemberRegisteration(
    clubAccountId,
    userId,
    currency,
    registrationId,
  );

  const visiblePages: RegistrationPage[] =
    data?.pages?.filter((page: RegistrationPage) =>
      page.fields.some(
        (field: RegistrationPageField) => !(field.visible === false && !field.value),
      ),
    ) ?? [];

  const registrationStatus = data?.deregistered_on
    ? { label: "De-registered", className: "border-rose-200 bg-rose-50 text-rose-700" }
    : data?.registered_on
      ? { label: "Registered", className: "border-emerald-200 bg-emerald-50 text-emerald-700" }
      : { label: "Pending review", className: "border-amber-200 bg-amber-50 text-amber-700" };

  return (
    <Card className="overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-[0_28px_90px_-54px_rgba(15,23,42,0.45)] sm:rounded-[2rem]">
      <CardHeader className="space-y-3 border-b border-slate-200 bg-[linear-gradient(180deg,_rgba(248,250,252,0.95)_0%,_rgba(241,245,249,0.9)_100%)] px-4 pb-4 pt-5 sm:px-7 sm:pb-6 sm:pt-8">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="-ml-2 h-8 w-fit gap-1.5 rounded-full px-2.5 text-xs text-slate-600 hover:bg-slate-100"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </Button>
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-slate-500" />
          <CardTitle className="text-lg sm:text-xl">Registration details</CardTitle>
        </div>
        <CardDescription>
          The submitted registration form responses for this member.
        </CardDescription>
      </CardHeader>

      <CardContent className="max-h-[65vh] overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : isError || !data ? (
          <p className="py-6 text-center text-sm text-slate-500">
            We couldn&apos;t load this member&apos;s registration details.
          </p>
        ) : (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={cn("border px-2.5 py-1 text-xs font-medium", registrationStatus.className)}>
                {registrationStatus.label}
              </Badge>
              {data.registration_submitted_on && (
                <span className="text-xs text-slate-500">
                  Submitted {formatEpoch(data.registration_submitted_on)}
                </span>
              )}
            </div>

            {visiblePages.length === 0 ? (
              <p className="text-sm text-slate-500">No registration fields to display.</p>
            ) : (
              visiblePages.map((page, pageIndex) => (
                <div
                  key={page.page_header || pageIndex}
                  className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4"
                >
                  {page.page_header && (
                    <h3 className="text-sm font-semibold text-slate-900">{page.page_header}</h3>
                  )}
                  <div className="space-y-4">
                    {page.fields.map((field) => {
                      if (field.visible === false && !field.value) return null;

                      return (
                        <div key={field.label} className="space-y-1.5">
                          {field.type !== "TEXT" && (
                            <Label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                              {field.label}
                            </Label>
                          )}
                          <RegistrationFieldValue field={field} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
