import { cn } from "@/lib/utils";
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import StandardCheckbox from "./member/registration-form/standard-checkbox";
import BillingDropdown from "./member/registration-form/billing-dropdown";
import StandardDopdown from "./member/registration-form/standard-dropdown";
import StandardText from "./member/registration-form/standard-text";

// --- Types that match the new payload ---
export type InputType = "TEXT" | "DROPDOWN" | "CHECKBOX" | "NUMBER";
export type FieldType = "TEXT" | "STANDARD" | "BILLING";

export interface BillingOption {
  option_order_id: string;
  amount: number; // in cents
  label: string;
}

export interface PageFieldBase {
  field_order_id: string;
  field_id: string;
  field_type: FieldType;
  field_text?: string; // helper/label text
  field_name?: string; // title when STANDARD/BILLING
  required?: boolean;
  input_type?: InputType; // when STANDARD/BILLING
  placeholder?: string;
  options?: string[]; // for STANDARD DROPDOWN
  billingOptions?: BillingOption[]; // for BILLING DROPDOWN
  currency?: string; // for BILLING
  amount?: number; // for BILLING fixed price (cents)

  // --- UI state ---
  value?: string; // typed text or selected label
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

export function ClubRegisterForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
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

  // Load payload -> component state
  useEffect(() => {
    if ((data as PagedFormPayload)?.pages) {
      const cloned = (data as PagedFormPayload).pages.map((p) => ({
        ...p,
        fields: p.fields.map((f) => ({ ...f })),
      }));
      setPages(cloned);
    }
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
            if (!f.value || !f.selectedAmountCents) missing.push({ page: p.page_index, field: f });
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
        if (f.field_type === "BILLING" && f.input_type === "DROPDOWN") return !f.value || !f.selectedAmountCents;
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

    const registrationRequest: RegistrationRequest = {
      club_account_id: clubId as string,
      billing_type: "",
      billing_fields: allFields
        .filter((f) => f.field_type === "BILLING")
        .map((f) => ({
          field_id: f.field_id!,
          value: (f.selectedAmountCents ?? f.amount ?? (f.value ? Number(f.value) : undefined)) as any,
          option_order_id: f.input_type === "DROPDOWN" ? f.option_order_id : undefined,
          label: f.input_type === "DROPDOWN" ? f.label : undefined,
        })),
      standard_fields: allFields
        .filter((f) => f.field_type === "STANDARD")
        .map((f) => ({ field_id: f.field_id!, value: f.value ?? "" })),
    };

    if (!user) (registrationRequest as any).email = email;

    mutate(registrationRequest, {
      onSuccess: () => navigate(`/clubs/${clubId}`),
      onError: () => toast(registerError?.message ?? "Registration failed"),
    });
  };

  const isLastPage = currentPageIndex === pages.length - 1;

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          {clubLoading && isLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}
          {!clubLoading && (
            <CardTitle className="text-xl">
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
              <div className="grid-2 gap-6">
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

                  {/* Current Page */}
                  {pages[currentPageIndex] && (
                    <div key={pages[currentPageIndex].page_index} className="space-y-4">
                      <h3 className="text-lg font-semibold">{pages[currentPageIndex].page_header}</h3>
                      {pages[currentPageIndex].fields.map((field) => {
                        
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
                            <p key={field.field_id}>
                              {field.field_name}:{" "}
                              <span className="font-semibold">
                                {formatAmount(field.amount ?? 0, club.currency)}
                              </span>
                            </p>
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

                  {/* Navigation buttons */}
                  {pages.length === 1 ? (
                    <Button type="submit" className="w-full" disabled={isPending}>
                      {isPending ? "Registering..." : "Register"}
                    </Button>
                  ) : (
                    <div className="flex justify-between">
                      {currentPageIndex > 0 && (
                        <Button variant={"outline"} type="button" onClick={() => setCurrentPageIndex((i) => i - 1)}>
                          Previous
                        </Button>
                      )}
                      {isLastPage ? (
                        <Button type="button" onClick={(e) => registerUser(e as any)} disabled={isPending}>
                          {isPending ? "Registering..." : "Register"}
                        </Button>
                      ) : (
                        <Button type="button" onClick={handleNextPage}>
                          Next
                        </Button>
                      )}
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
