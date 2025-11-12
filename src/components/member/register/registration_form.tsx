import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FormEvent, useContext, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useFetchRegistrationForm } from "@/queries/registration-form";
import { useFetchClub } from "@/queries/clubs";
import { RegistrationRequest } from "@/requests/registration-request";
import { useMemberRegistrationMutation } from "@/mutations/useMemberRegistrationMutation";
import { toast } from "sonner";
import { formatAmount } from "@/data/currencies";
import { AuthContext, AuthContextType } from "@/context/AuthContext";
import { createValidRegistrationRequest } from "../../../helpers/members/registration/create-registration-request";
import { getFieldName } from "../../../helpers/members/registration/get-field-name";
import { 
  ReusableRegistrationForm,
  FormPage,
  PagedFormPayload,
  FieldRequest,
  PageFieldBase
} from "../../shared/registration/reusable-registration-form";

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

  const {
    mutate,
    isPending,
    isError,
    error: registerError,
    isSuccess,
  } = useMemberRegistrationMutation();
  const { data, isLoading } = useFetchRegistrationForm(clubId as string);
  const { data: club, isLoading: clubLoading } = useFetchClub(clubId as string);

  const [email, setEmail] = useState("");
  const [pages, setPages] = useState<FormPage[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [requiredFieldsMissing, setRequiredFieldsMissing] = useState(false);
  const [registrationRequest, setRegistrationRequest] = useState<
    RegistrationRequest | undefined
  >(undefined);
  const [totalRegistrationFee, setTotalRegistrationFee] = useState(0);
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    const processPages = async () => {
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

      if (!club?.meta) return;

      const updatedPages = await Promise.all(
        sorted.map(async (page) => ({
          ...page,
          fields: await Promise.all(
            page.fields.map(async (field) => {
              const metaField = club.meta[field.field_id];
              if (!metaField) return field;

              if (metaField?.signature_type) {
                const data =
                  metaField.signature_type === "name"
                    ? metaField.value
                    : await presignedUrlToDataUrl(metaField.value);
                return {
                  ...field,
                  value: data,
                  signature_type: metaField.signature_type,
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
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const registerUser = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (missingRequired.length > 0) {
      setRequiredFieldsMissing(true);
      // Navigate to the first page that contains a missing required field
      try {
        const firstMissingPage = missingRequired[0]?.page;
        if (typeof firstMissingPage === "number") {
          setCurrentPageIndex(firstMissingPage);
        }
      } catch {
        // noop - stay on current page and show alert
      }
      return;
    }

    const allFields = pages.flatMap((p) => p.fields);

    const request: RegistrationRequest = createValidRegistrationRequest(
      allFields,
      clubId as string
    );

    if (!user) (request as any).email = email;
    setRegistrationRequest(request);

    let total = 0;
    request.billing_fields.forEach((field) => {
      total += field.value;
    });
    setTotalRegistrationFee(total);
  };

  const submitRegistration = () => {
    setIsRegistering(true);
    if (registrationRequest) {
      mutate(registrationRequest, {
        onSuccess: () => {
          navigate(`/clubs/${clubId}`);
          setIsRegistering(false);
          window.location.reload();
        },
        onError: () => toast(registerError?.message ?? "Registration failed"),
      });
    }
  };

  const handleContinue = () => {
    // Create a synthetic form event
    const syntheticEvent = {
      preventDefault: () => {},
    } as FormEvent<HTMLFormElement>;
    registerUser(syntheticEvent);
  };

  const returnBackToRegistrationForm = () => {
    setRegistrationRequest(undefined);
    setTotalRegistrationFee(0);
  };

  if (clubLoading && isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="flex justify-center items-center py-8">
        <Card className="w-[800px] border shadow-sm pt-0">
          <CardContent className="py-6 px-4">
            <div className="space-y-4">
              <h2 className="text-l text-center font-semibold">
                Successfully Registered to {club?.club_name}
              </h2>
              <p className="text-center text-xs text-muted-foreground">
                Club will stay in contact with you once registration is completed.
              </p>
              <Link to={`/clubs/${clubId}`}>
                <Button className="w-full">Back to club</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!registrationRequest) {
    return (
      <ReusableRegistrationForm
        clubName={club?.club_name || ""}
        clubCurrency={club?.currency || ""}
        pages={pages}
        currentPageIndex={currentPageIndex}
        setCurrentPageIndex={setCurrentPageIndex}
        setFieldValue={setFieldValue}
        requiredFieldsMissing={requiredFieldsMissing}
        headerTitle={`Register to ${club?.club_name}`}
        headerDescription="Finish the registration form below"
        showHeader={true}
        topContent={
          !user ? (
            <div className="flex flex-col gap-1.5 p-3 bg-muted/20 rounded-lg">
              <Label
                htmlFor="user_email"
                className="text-xs font-semibold text-muted-foreground"
              >
                Email Address
              </Label>
              <Input
                id="user_email"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="text-xs"
              />
            </div>
          ) : null
        }
        bottomContent={
          <div className="text-center text-xs mt-2 pt-2 border-t">
            Go back to club?{" "}
            <Link
              to={`/clubs/${clubId}`}
              className="underline underline-offset-4"
            >
              Cancel
            </Link>
          </div>
        }
        onNext={handleNextPage}
        onContinue={handleContinue}
        isPending={isPending}
        isError={isError}
        errorMessage={registerError?.message}
        showNavigation={true}
      />
    );
  }

  return (
    <div className="flex justify-center items-center py-8">
      <Card className="w-[800px] border shadow-sm pt-0">
        <CardContent className="py-2 px-4">
          <form>
            <div className="space-y-2">
              <div className="grid gap-2">
                <div className="px-2 py-2 border rounded-lg space-y-2 bg-muted/10">
                  {/* Total Registration Fee */}
                  <div className="p-3 bg-muted/20 rounded-lg">
                    <h2 className="text-base font-semibold mb-2">
                      Total Registration Fee:{" "}
                      <strong>
                        {totalRegistrationFee === 0
                          ? "FREE"
                          : formatAmount(
                              totalRegistrationFee,
                              club?.currency || ""
                            )}
                      </strong>
                    </h2>
                    <ul className="ml-6 list-disc space-y-1">
                      {registrationRequest.billing_fields.map(
                        (f: FieldRequest) => (
                          <li key={f.field_id} className="text-xs">
                            {getFieldName(pages, f.field_id)}:{" "}
                            {f.value === 0
                              ? "FREE"
                              : formatAmount(
                                  f?.value as number,
                                  club?.currency || ""
                                )}
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
                      Once your registration is submitted, you must visit
                      the <strong>Payments & Billing</strong> tab in your
                      associated club profile to view available payment
                      methods and instructions for paying any outstanding
                      amounts.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Clubby is <strong>not responsible</strong> for any
                      incorrect payments, misdirected payments, or payment
                      errors. Please follow the instructions on the Payments
                      tab carefully.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Ensure all billing information is correct to avoid
                      delays in processing your membership.
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-3 border-t mt-2">
                  <Button
                    variant="outline"
                    type="button"
                    size="sm"
                    className="w-[110px]"
                    onClick={returnBackToRegistrationForm}
                    disabled={isPending}
                  >
                    Back to form
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={submitRegistration}
                    disabled={isPending}
                  >
                    {isRegistering
                      ? "Registering..."
                      : "Submit registration"}
                  </Button>
                </div>

                <div className="text-center text-xs mt-2 pt-2 border-t">
                  Go back to club?{" "}
                  <Link
                    to={`/clubs/${clubId}`}
                    className="underline underline-offset-4"
                  >
                    Cancel
                  </Link>
                </div>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
