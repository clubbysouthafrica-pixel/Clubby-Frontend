import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Plus,
  Trash2,
  XCircle,
} from "lucide-react";
import { ClubContext, ClubContextType } from "@/context/ClubContext";
import { useFetchRegistrationForm } from "@/queries/admin/registration-form";
import { useFetchClub } from "@/queries/admin/clubs";
import {
  createValidRegistrationRequest,
} from "@/helpers/admin/registration/create-registration-request";
import {
  FormPage,
  PagedFormPayload,
  PageFieldBase,
} from "@/components/shared/registration/reusable-registration-form";
import { createMemberRegistrationForm } from "@/services/admin/registration-form";
import { formatAmount } from "@/data/currencies";
import { toast } from "sonner";
import { getProratedAmount } from "@/lib/billing-prorata";

type MemberRow = {
  id: string;
  email: string;
  firstName: string;
  surname: string;
  pages: FormPage[];
};

type FieldError = { memberId: string; message: string };
type SubmitResult = { memberId: string; success: boolean; error?: string };

let _counter = 0;
function genId() {
  return `m-${++_counter}`;
}

function buildBasePages(
  data: unknown,
  meta: Record<string, { option_order_id?: string; value?: string }> | undefined,
): FormPage[] {
  const payload = data as PagedFormPayload | undefined;
  if (!payload?.pages) return [];

  const sorted = payload.pages
    .sort((a, b) => a.page_index - b.page_index)
    .map((p, idx) => ({
      ...p,
      page_index: idx,
      fields: p.fields
        .sort((a, b) => Number(a.field_order_id) - Number(b.field_order_id))
        .map((f) => ({ ...f })),
    }));

  if (!meta) return sorted;

  return sorted.map((page) => ({
    ...page,
    fields: page.fields.map((field) => {
      const metaField = meta[field.field_id];
      if (!metaField) return field;
      if (field.billingOptions) {
        const matched = field.billingOptions.find(
          (opt) => opt.option_order_id === metaField.option_order_id,
        );
        if (matched) {
          return {
            ...field,
            value: matched.label,
            label: matched.label,
            selectedAmountCents: matched.amount,
            option_order_id: matched.option_order_id,
          };
        }
      } else {
        return { ...field, value: metaField.value };
      }
      return field;
    }),
  }));
}

function clonePages(pages: FormPage[]): FormPage[] {
  return pages.map((p) => ({ ...p, fields: p.fields.map((f) => ({ ...f })) }));
}

function isTableField(f: PageFieldBase) {
  if (f.field_type === "TEXT") return false;
  if (f.input_type === "SIGNATURE") return false;
  return true;
}

export default function AddMembersBulkPage() {
  const { club } = useContext(ClubContext) as ClubContextType;
  const { data, isLoading } = useFetchRegistrationForm(
    club?.club_account_id as string,
  );
  const { data: clubDetails, isLoading: clubLoading } = useFetchClub(
    club?.club_account_id as string,
  );

  const [basePages, setBasePages] = useState<FormPage[]>([]);
  const [members, setMembers] = useState<MemberRow[]>([
    { id: genId(), email: "", firstName: "", surname: "", pages: [] },
  ]);
  const [fieldErrors, setFieldErrors] = useState<FieldError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResults, setSubmitResults] = useState<SubmitResult[]>([]);
  const [done, setDone] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [sendAccountEmail, setSendAccountEmail] = useState(true);
  const [sendConfirmationEmail, setSendConfirmationEmail] = useState(true);
  const [sendClubEmail, setSendClubEmail] = useState(true);

  const buildPages = useCallback(
    () => buildBasePages(data, clubDetails?.meta),
    [data, clubDetails?.meta],
  );

  useEffect(() => {
    const pages = buildPages();
    setBasePages(pages);
    setMembers((prev) =>
      prev.map((m) => ({ ...m, pages: clonePages(pages) })),
    );
  }, [buildPages]);

  // Flat list of table columns (one per relevant form field)
  const formColumns = useMemo(
    () => basePages.flatMap((p) => p.fields.filter(isTableField)),
    [basePages],
  );

  const updateIdentity = (
    id: string,
    field: "email" | "firstName" | "surname",
    value: string,
  ) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m)),
    );
    setFieldErrors((prev) => prev.filter((e) => e.memberId !== id));
  };

  const updateField = (
    memberId: string,
    pageIndex: number,
    fieldId: string,
    patch: Partial<PageFieldBase>,
  ) => {
    setMembers((prev) =>
      prev.map((m) =>
        m.id !== memberId
          ? m
          : {
              ...m,
              pages: m.pages.map((p) =>
                p.page_index !== pageIndex
                  ? p
                  : {
                      ...p,
                      fields: p.fields.map((f) =>
                        f.field_id !== fieldId ? f : { ...f, ...patch },
                      ),
                    },
              ),
            },
      ),
    );
  };

  const addRow = () => {
    setMembers((prev) => [
      ...prev,
      { id: genId(), email: "", firstName: "", surname: "", pages: clonePages(basePages) },
    ]);
  };

  const removeRow = (id: string) => {
    if (members.length === 1) return;
    setMembers((prev) => prev.filter((m) => m.id !== id));
    setFieldErrors((prev) => prev.filter((e) => e.memberId !== id));
  };

  const validate = (): FieldError[] => {
    const errors: FieldError[] = [];
    const seen = new Set<string>();

    for (const m of members) {
      let rowError = "";
      if (!m.email || !m.email.includes("@") || !m.email.includes(".")) {
        rowError = "Invalid email address.";
      } else if (seen.has(m.email.toLowerCase())) {
        rowError = "Duplicate email address.";
      } else {
        seen.add(m.email.toLowerCase());
        if (!m.firstName.trim()) rowError = "First name is required.";
        else if (!m.surname.trim()) rowError = "Surname is required.";
      }

      if (!rowError) {
        for (const page of m.pages) {
          for (const f of page.fields) {
            if (!f.required || rowError) continue;
            if (f.field_type === "STANDARD") {
              const empty =
                f.input_type === "CHECKBOX"
                  ? !f.value || f.value !== "true"
                  : typeof f.value !== "string" || f.value.trim() === "";
              if (empty) rowError = "Please fill all required fields.";
            }
            if (
              f.field_type === "BILLING" &&
              f.input_type === "DROPDOWN" &&
              (f.value == null || f.selectedAmountCents == null)
            ) {
              rowError = "Please fill all required fields.";
            }
          }
        }
      }

      if (rowError) errors.push({ memberId: m.id, message: rowError });
    }

    return errors;
  };

  const handleSubmit = () => {
    const errors = validate();
    if (errors.length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors([]);
    setShowConfirmDialog(true);
  };

  const confirmAndSubmit = async () => {
    setShowConfirmDialog(false);
    setIsSubmitting(true);

    const results: SubmitResult[] = [];
    for (const member of members) {
      try {
        const allFields = member.pages.flatMap((p) => p.fields);
        const req = createValidRegistrationRequest(
          allFields,
          club?.club_account_id as string,
          member.email,
          member.surname,
          member.firstName,
        );
        await createMemberRegistrationForm({
          ...req,
          email_opt_in: sendConfirmationEmail,
          send_account_email: sendAccountEmail,
          send_club_email: sendClubEmail,
        });
        results.push({ memberId: member.id, success: true });
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message ?? "Registration failed";
        results.push({ memberId: member.id, success: false, error: msg });
      }
      setSubmitResults([...results]);
    }

    setIsSubmitting(false);
    setDone(true);
    const failCount = results.filter((r) => !r.success).length;
    if (failCount === 0) {
      toast.success(`All ${results.length} members registered successfully.`);
    } else {
      toast.error(`${failCount} of ${results.length} registrations failed.`);
    }
  };

  const handleReset = () => {
    const pages = buildPages();
    setBasePages(pages);
    setMembers([
      {
        id: genId(),
        email: "",
        firstName: "",
        surname: "",
        pages: clonePages(pages),
      },
    ]);
    setFieldErrors([]);
    setSubmitResults([]);
    setDone(false);
  };

  if (isLoading || clubLoading) {
    return (
      <div className="p-5 flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (done) {
    return (
      <div className="p-5">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">
            Bulk Register Members
          </h1>
          <p className="text-muted-foreground">Registration results</p>
        </div>
        <div className="space-y-2 max-w-2xl">
          {members.map((m) => {
            const r = submitResults.find((x) => x.memberId === m.id);
            return (
              <div key={m.id} className="flex items-center gap-2 text-sm">
                {!r ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
                ) : r.success ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600 shrink-0" />
                )}
                <span className="font-medium">
                  {m.firstName} {m.surname}
                </span>
                <span className="text-muted-foreground text-xs">— {m.email}</span>
                {r && !r.success && (
                  <span className="text-xs text-red-600 ml-1">{r.error}</span>
                )}
              </div>
            );
          })}
          <div className="pt-4">
            <Button size="sm" variant="outline" onClick={handleReset}>
              Register more members
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Bulk Register Members
          </h1>
          <p className="text-muted-foreground">
            Fill in each member's details and registration answers, then submit.
          </p>
        </div>
      </div>

      <div className="w-full overflow-x-auto rounded-lg border shadow-sm">
        <table className="table-fixed w-full text-sm border-collapse">
          <colgroup>
            <col style={{ width: 160 }} />
            <col style={{ width: 160 }} />
            <col style={{ width: 160 }} />
            {formColumns.map((col) => (
              <col key={col.field_id} style={{ width: 160 }} />
            ))}
            <col style={{ width: 44 }} />
          </colgroup>
          <thead>
            <tr className="bg-muted/40 border-b">
              <th className="text-center text-xs font-semibold text-muted-foreground px-3 py-2.5 whitespace-nowrap">
                Email
              </th>
              <th className="text-center text-xs font-semibold text-muted-foreground px-3 py-2.5 whitespace-nowrap">
                First Name
              </th>
              <th className="text-center text-xs font-semibold text-muted-foreground px-3 py-2.5 whitespace-nowrap">
                Surname
              </th>
              {formColumns.map((col) => (
                <th
                  key={col.field_id}
                  className="text-center text-xs font-semibold text-muted-foreground px-3 py-2.5 whitespace-nowrap"
                >
                  {col.field_name}
                  {col.required && (
                    <span className="text-red-500 ml-0.5">*</span>
                  )}
                  {col.field_type === "BILLING" &&
                    col.input_type === "TEXT" && (
                      <span className="ml-1 font-normal text-muted-foreground">
                        (
                        {formatAmount(
                          getProratedAmount(col.amount ?? 0, col),
                          club?.currency,
                        )}
                        )
                      </span>
                    )}
                </th>
              ))}
              <th className="px-3 py-2.5 w-10" />
            </tr>
          </thead>
          <tbody>
            {members.map((member, rowIdx) => {
              const error = fieldErrors.find((e) => e.memberId === member.id);
              const result = submitResults.find(
                (r) => r.memberId === member.id,
              );

              return (
                <>
                  <tr
                    key={member.id}
                    className={`border-b last:border-b-0 ${rowIdx % 2 === 1 ? "bg-muted/10" : ""} ${error ? "bg-red-50/50" : ""}`}
                  >
                    {/* Email */}
                    <td className="px-3 py-1.5 overflow-hidden">
                      <Input
                        type="text"
                        placeholder="email@example.com"
                        className="h-8 text-xs text-center"
                        value={member.email}
                        disabled={isSubmitting}
                        onChange={(e) =>
                          updateIdentity(member.id, "email", e.target.value)
                        }
                      />
                    </td>
                    {/* First Name */}
                    <td className="px-3 py-1.5 overflow-hidden">
                      <Input
                        type="text"
                        placeholder="First name"
                        className="h-8 text-xs text-center"
                        value={member.firstName}
                        disabled={isSubmitting}
                        onChange={(e) =>
                          updateIdentity(
                            member.id,
                            "firstName",
                            e.target.value,
                          )
                        }
                      />
                    </td>
                    {/* Surname */}
                    <td className="px-3 py-1.5 overflow-hidden">
                      <Input
                        type="text"
                        placeholder="Surname"
                        className="h-8 text-xs text-center"
                        value={member.surname}
                        disabled={isSubmitting}
                        onChange={(e) =>
                          updateIdentity(member.id, "surname", e.target.value)
                        }
                      />
                    </td>

                    {/* Form field columns */}
                    {formColumns.map((col) => {
                      // Find this field in member's pages
                      let memberField: PageFieldBase | undefined;
                      let pageIndex = 0;
                      for (const page of member.pages) {
                        const found = page.fields.find(
                          (f) => f.field_id === col.field_id,
                        );
                        if (found) {
                          memberField = found;
                          pageIndex = page.page_index;
                          break;
                        }
                      }
                      if (!memberField) return <td key={col.field_id} />;

                      const f = memberField;
                      const pi = pageIndex;

                      // STANDARD CHECKBOX
                      if (
                        f.field_type === "STANDARD" &&
                        f.input_type === "CHECKBOX"
                      ) {
                        return (
                          <td
                            key={f.field_id}
                            className="px-3 py-1.5 overflow-hidden"
                          >
                            <div className="flex justify-center items-center h-8">
                              <Checkbox
                                checked={f.value === "true"}
                                disabled={isSubmitting}
                                onCheckedChange={(checked) =>
                                  updateField(member.id, pi, f.field_id, {
                                    value: checked ? "true" : "false",
                                  })
                                }
                              />
                            </div>
                          </td>
                        );
                      }

                      // STANDARD DROPDOWN
                      if (
                        f.field_type === "STANDARD" &&
                        f.input_type === "DROPDOWN"
                      ) {
                        return (
                          <td key={f.field_id} className="px-3 py-1.5 overflow-hidden">
                            <Select
                              value={
                                typeof f.value === "string" ? f.value : ""
                              }
                              disabled={isSubmitting}
                              onValueChange={(val) =>
                                updateField(member.id, pi, f.field_id, {
                                  value: val,
                                })
                              }
                            >
                              <SelectTrigger className="h-8 text-xs w-full overflow-hidden *:data-[slot=select-value]:flex-1 *:data-[slot=select-value]:justify-center *:data-[slot=select-value]:truncate">
                                <SelectValue placeholder="Select…" />
                              </SelectTrigger>
                              <SelectContent>
                                {(f.options ?? []).map((opt) => (
                                  <SelectItem key={opt} value={opt}>
                                    {opt}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                        );
                      }

                      // STANDARD TEXT / NUMBER
                      if (
                        f.field_type === "STANDARD" &&
                        (f.input_type === "TEXT" || f.input_type === "NUMBER")
                      ) {
                        return (
                          <td key={f.field_id} className="px-3 py-1.5 overflow-hidden">
                            <Input
                              type={
                                f.input_type === "NUMBER" ? "number" : "text"
                              }
                              placeholder={f.placeholder ?? f.field_name}
                              className="h-8 text-xs text-center"
                              value={
                                f.value !== undefined ? String(f.value) : ""
                              }
                              disabled={isSubmitting}
                              onChange={(e) =>
                                updateField(member.id, pi, f.field_id, {
                                  value: e.target.value,
                                })
                              }
                            />
                          </td>
                        );
                      }

                      // BILLING DROPDOWN
                      if (
                        f.field_type === "BILLING" &&
                        f.input_type === "DROPDOWN"
                      ) {
                        return (
                          <td key={f.field_id} className="px-3 py-1.5 overflow-hidden">
                            <Select
                              value={f.option_order_id ?? ""}
                              disabled={isSubmitting}
                              onValueChange={(optId) => {
                                const opt = (f.billingOptions ?? []).find(
                                  (o) => o.option_order_id === optId,
                                );
                                if (!opt) return;
                                updateField(member.id, pi, f.field_id, {
                                  value: opt.label,
                                  label: opt.label,
                                  selectedAmountCents: opt.amount,
                                  option_order_id: opt.option_order_id,
                                });
                              }}
                            >
                              <SelectTrigger className="h-8 text-xs w-full overflow-hidden *:data-[slot=select-value]:flex-1 *:data-[slot=select-value]:justify-center *:data-[slot=select-value]:truncate">
                                <SelectValue placeholder="Select…" />
                              </SelectTrigger>
                              <SelectContent>
                                {(f.billingOptions ?? []).map((opt) => (
                                  <SelectItem
                                    key={opt.option_order_id}
                                    value={opt.option_order_id}
                                  >
                                    {opt.label} (
                                    {formatAmount(opt.amount, club?.currency)})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                        );
                      }

                      // BILLING NUMBER (multiplier quantity)
                      if (
                        f.field_type === "BILLING" &&
                        f.input_type === "NUMBER"
                      ) {
                        return (
                          <td key={f.field_id} className="px-3 py-1.5 overflow-hidden">
                            <Input
                              type="number"
                              min={1}
                              placeholder="Qty"
                              className="h-8 text-xs w-full text-center"
                              value={f.multiplier_value ?? ""}
                              disabled={isSubmitting}
                              onChange={(e) =>
                                updateField(member.id, pi, f.field_id, {
                                  multiplier_value: Number(e.target.value),
                                  value: getProratedAmount(f.amount ?? 0, f),
                                })
                              }
                            />
                          </td>
                        );
                      }

                      // BILLING TEXT (fixed amount — auto-resolved, show label only)
                      if (
                        f.field_type === "BILLING" &&
                        f.input_type === "TEXT"
                      ) {
                        return (
                          <td
                            key={f.field_id}
                            className="px-3 py-1.5 text-xs text-muted-foreground text-center"
                          >
                            {formatAmount(
                              getProratedAmount(f.amount ?? 0, f),
                              club?.currency,
                            )}
                          </td>
                        );
                      }

                      return <td key={f.field_id} />;
                    })}

                    {/* Remove button */}
                    <td className="px-3 py-1.5 overflow-hidden">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-red-600"
                        onClick={() => removeRow(member.id)}
                        disabled={members.length === 1 || isSubmitting}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>

                  {/* Per-row error or result */}
                  {(error || result) && (
                    <tr
                      key={`${member.id}-status`}
                      className="border-b last:border-b-0"
                    >
                      <td
                        colSpan={3 + formColumns.length + 1}
                        className="px-3 pb-2"
                      >
                        {error && (
                          <Alert
                            variant="destructive"
                            className="flex flex-row py-1.5"
                          >
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                            <AlertDescription className="text-xs ml-1">
                              {error.message}
                            </AlertDescription>
                          </Alert>
                        )}
                        {result && (
                          <div className="flex items-center gap-1.5 text-xs">
                            {result.success ? (
                              <>
                                <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
                                <span className="text-green-700">
                                  Registered successfully
                                </span>
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3.5 w-3.5 text-red-600 shrink-0" />
                                <span className="text-red-600">
                                  {result.error}
                                </span>
                              </>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex gap-3">
        <Button
          size="sm"
          variant="outline"
          onClick={addRow}
          disabled={isSubmitting}
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add Row
        </Button>
        <Button size="sm" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              Registering…
            </>
          ) : (
            `Register ${members.length} Member${members.length !== 1 ? "s" : ""}`
          )}
        </Button>
      </div>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Registration</DialogTitle>
            <DialogDescription>
              You are about to register{" "}
              <strong>
                {members.length} member{members.length !== 1 ? "s" : ""}
              </strong>
              . Please confirm the email options below.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={sendAccountEmail}
                onCheckedChange={(v) => setSendAccountEmail(!!v)}
                className="mt-0.5"
              />
              <div>
                <p className="text-sm font-medium">Send account creation email</p>
                <p className="text-xs text-muted-foreground">
                  Each member will receive an email with a temporary password to
                  access the Member Portal.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={sendConfirmationEmail}
                onCheckedChange={(v) => setSendConfirmationEmail(!!v)}
                className="mt-0.5"
              />
              <div>
                <p className="text-sm font-medium">Opt members in for receiving emails</p>
                <p className="text-xs text-muted-foreground">
                  Each member will be opted in to receive emails from the club, including registration confirmation and future communications.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={sendClubEmail}
                onCheckedChange={(v) => setSendClubEmail(!!v)}
                className="mt-0.5"
              />
              <div>
                <p className="text-sm font-medium">Send registration submission to club</p>
                <p className="text-xs text-muted-foreground">
                  The club will receive a notification for each registration
                  submission.
                </p>
              </div>
            </label>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConfirmDialog(false)}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={confirmAndSubmit}>
              Register {members.length} Member{members.length !== 1 ? "s" : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
