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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClubContext, ClubContextType } from "@/context/ClubContext";
import { countries } from "@/data/countries";
import { currencies } from "@/data/currencies";
import { useUpdateClubDetailsMutation } from "@/mutations/admin/club";
import { useFetchClubDetails } from "@/queries/admin/clubs";
import {
  Loader2,
} from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  REGISTRATION_SUBMISSION_EMAIL_TEMPLATE,
  REGISTRATION_SUCCESS_EMAIL_TEMPLATE,
} from "@/helpers/admin/constants/registration_submission_email_template";
import EditableEmailTemplate from "../../../components/admin/manage/emailing/editable_email_template";
import { BankingDetailsForm } from "@/components/admin/club/banking-details-form";
import ClubGalleryEdit from "./gallery";
import { Textarea } from "@/components/ui/textarea";

export default function EditClubDetails() {
  const { club } = useContext(ClubContext) as ClubContextType;
  const { data, isLoading } = useFetchClubDetails(
    club?.club_account_id as string,
  );
  const { mutate, isPending } = useUpdateClubDetailsMutation();

  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const defaultOpeningTimes = daysOfWeek.map((day) => ({
    day,
    open: "",
    close: "",
    closed: false,
  }));

  const [openingTimes, setOpeningTimes] = useState(defaultOpeningTimes);

  const [activeTab, setActiveTab] = useState("club-view");
  const [country, setCountry] = useState("");
  const [currency, setCurrency] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [clubUrl, setClubUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [clubDetails, setClubDetails] = useState("");
  const [hideFromPublic, setHideFromPublic] = useState<boolean>(false);

  const [
    registrationSubmissionEmailTemplate,
    setRegistrationSubmissionEmailTemplate,
  ] = useState<string>(REGISTRATION_SUBMISSION_EMAIL_TEMPLATE);
  const [
    registrationSubmissionEmailSubject,
    setRegistrationSubmissionEmailSubject,
  ] = useState<string>("Registration Submission");
  const [
    registrationSuccessEmailTemplate,
    setRegistrationSuccessEmailTemplate,
  ] = useState<string>(REGISTRATION_SUCCESS_EMAIL_TEMPLATE);
  const [registrationSuccessEmailSubject, setRegistrationSuccessEmailSubject] =
    useState<string>("Registration Confirmed");
  const [useSuccessEmailTemplate, setUseSuccessEmailTemplate] =
    useState<boolean>(false);
  const [useSubmissionEmailTemplate, setUseSubmissionEmailTemplate] =
    useState<boolean>(false);
  const [notifyOnMemberRegistration, setNotifyOnMemberRegistration] =
    useState<boolean>(false);

  useEffect(() => {
    if (data) {
      setCurrency(data?.currency);
      setCountry(data?.country_of_operation);
      setSupportEmail(data.support_email);
      setClubUrl(data?.club_url || "");
      setInstagramUrl(data?.instagram_url || "");
      setFacebookUrl(data?.facebook_url || "");
      setClubDetails(data?.about_club || "");
      setHideFromPublic(data?.hide_from_public ?? false);
      setInstagramUrl(data?.instagram_url || "");
      setFacebookUrl(data?.facebook_url || "");
      setClubDetails(data?.about_club || "");
      setOpeningTimes(data?.opening_times || defaultOpeningTimes);

      if (data?.opening_times && Array.isArray(data.opening_times)) {
        setOpeningTimes(data.opening_times);
      }

      setRegistrationSubmissionEmailTemplate(
        data?.registration_submission_email_template_body ??
          REGISTRATION_SUBMISSION_EMAIL_TEMPLATE,
      );
      setRegistrationSubmissionEmailSubject(
        data?.registration_submission_email_subject ??
          "Registration Submission",
      );
      setRegistrationSuccessEmailTemplate(
        data?.registration_success_email_template_body ??
          REGISTRATION_SUCCESS_EMAIL_TEMPLATE,
      );
      setRegistrationSuccessEmailSubject(
        data?.registration_success_email_subject ?? "Registration Confirmed",
      );
      setUseSubmissionEmailTemplate(
        data?.use_submission_email_template ?? false,
      );
      setUseSuccessEmailTemplate(data?.use_success_email_template ?? false);
      setNotifyOnMemberRegistration(
        data?.notify_on_member_registration ?? true,
      );
    }
  }, [data]);

  const handleBankingDetailsSave = (bankingData: {
    bank_details: {
      bank: string;
      account_number: string;
      branch_code: string;
      account_type: string;
    };
  }) => {
    mutate(
      {
        opening_times: openingTimes,
        club_account_id: club?.club_account_id as string,
        bank_details: bankingData.bank_details,
        country_of_operation: country,
        currency,
        support_email: supportEmail,
        club_url: clubUrl,
        about_club: clubDetails,
        instagram_url: instagramUrl,
        facebook_url: facebookUrl,
        hide_from_public: hideFromPublic,
        registration_submission_email_template_body:
          registrationSubmissionEmailTemplate,
        registration_submission_email_subject:
          registrationSubmissionEmailSubject,
        registration_success_email_template_body:
          registrationSuccessEmailTemplate,
        registration_success_email_subject: registrationSuccessEmailSubject,
        use_success_email_template: useSuccessEmailTemplate,
        use_submission_email_template: useSubmissionEmailTemplate,
        notify_on_member_registration: notifyOnMemberRegistration,
      },
      {
        onSuccess: () => toast.success("Successfully updated club details"),
        onError: (error: unknown) => {
          const errorMessage =
            (
              error as {
                response?: { data?: { message?: string } };
                message?: string;
              }
            )?.response?.data?.message ||
            (error as { message?: string })?.message ||
            "Something went wrong";
          toast.error(errorMessage);
        },
      },
    );
  };
  const update = () =>
    mutate(
      {
        club_account_id: club?.club_account_id as string,
        bank_details: data?.bank_details || {
          bank: "",
          account_number: "",
          branch_code: "",
          account_type: "",
        },
        payfast_details: data?.payfast_details || {
          merchant_id: "",
          merchant_key: "",
          passphrase: "",
        },
        opening_times: openingTimes,
        instagram_url: instagramUrl,
        facebook_url: facebookUrl,
        country_of_operation: country,
        currency,
        support_email: supportEmail,
        club_url: clubUrl,
        about_club: clubDetails,
        hide_from_public: hideFromPublic,
        registration_submission_email_template_body:
          registrationSubmissionEmailTemplate,
        registration_submission_email_subject:
          registrationSubmissionEmailSubject,
        registration_success_email_template_body:
          registrationSuccessEmailTemplate,
        registration_success_email_subject: registrationSuccessEmailSubject,
        use_success_email_template: useSuccessEmailTemplate,
        use_submission_email_template: useSubmissionEmailTemplate,
        notify_on_member_registration: notifyOnMemberRegistration,
      },
      {
        onSuccess: () => toast.success("Successfully updated club details"),
        onError: (error: unknown) => {
          const errorMessage =
            (
              error as {
                response?: { data?: { message?: string } };
                message?: string;
              }
            )?.response?.data?.message ||
            (error as { message?: string })?.message ||
            "Something went wrong";
          toast.error(errorMessage);
        },
      },
    );
  if (isLoading) {
    return (
      <div className="p-5 min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  function handleTimeChange(
    idx: number,
    field: "open" | "close",
    value: string,
  ) {
    setOpeningTimes((times) =>
      times.map((t, i) =>
        i === idx ? { ...t, [field]: value, closed: false } : t,
      ),
    );
  }

  function handleClosedChange(idx: number, checked: boolean) {
    setOpeningTimes((times) =>
      times.map((t, i) =>
        i === idx ? { ...t, closed: checked, open: "", close: "" } : t,
      ),
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex w-[80%] flex-col">
        {!isLoading && (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full h-12">
              <TabsTrigger value="club-view">Club View</TabsTrigger>
              <TabsTrigger value="account">Banking & Payments</TabsTrigger>
              <TabsTrigger value="location">Location</TabsTrigger>
              <TabsTrigger value="emailing">Emailing</TabsTrigger>
            </TabsList>

            {/* Club View Tab */}
            <TabsContent value="club-view">
              <Card className="border-0 shadow-none">
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <div className="space-y-1.5">
                    <CardTitle>Club View</CardTitle>
                    <CardDescription>
                      Control details shown on the public club page. Optionally
                      set a Club URL to embed external content.
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    disabled={isPending}
                    onClick={update}
                  >
                    {isPending ? (
                      <p className="flex space-x-2 items-center">
                        <Loader2 className="animate-spin" />
                        <span>Saving...</span>
                      </p>
                    ) : (
                      "Save changes"
                    )}
                  </Button>
                </CardHeader>
                <CardContent className="space-y-12">
                  {/* Public Listing Section - Full Width Row */}
                  <section>
                    <h3 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Public Listing
                    </h3>
                    <Card className="rounded-2xl">
                      <CardContent className="p-5 space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Control whether this club appears in the public Browse
                          Clubs list.
                        </p>
                        <div className="flex items-center gap-6">
                          <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                              type="radio"
                              name="publicVisibility"
                              value="public"
                              checked={!hideFromPublic}
                              onChange={() => setHideFromPublic(false)}
                              className="accent-primary"
                            />
                            <span>Public (listed)</span>
                          </label>
                          <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                              type="radio"
                              name="publicVisibility"
                              value="hidden"
                              checked={hideFromPublic}
                              onChange={() => setHideFromPublic(true)}
                              className="accent-primary"
                            />
                            <span>Hidden (unlisted)</span>
                          </label>
                        </div>
                      </CardContent>
                    </Card>
                  </section>

                  {/* Social Links Section - Full Width Row */}
                  <section>
                    <h3 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Social Links (optional)
                    </h3>
                    <Card className="rounded-2xl">
                      <CardContent className="space-y-4 p-5">
                        <div>
                          <Label
                            htmlFor="club_url"
                            className="text-sm mb-2 block"
                          >
                            Website Link
                          </Label>
                          <Input
                            id="club_url"
                            type="url"
                            placeholder="https://yourwebsite.com"
                            value={clubUrl}
                            onChange={(e) => setClubUrl(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label
                            htmlFor="instagram_url"
                            className="text-sm mb-2 block"
                          >
                            Instagram Link
                          </Label>
                          <Input
                            id="instagram_url"
                            type="url"
                            placeholder="https://instagram.com/yourclub"
                            value={instagramUrl}
                            onChange={(e) => setInstagramUrl(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label
                            htmlFor="facebook_url"
                            className="text-sm mb-2 block"
                          >
                            Facebook Link
                          </Label>
                          <Input
                            id="facebook_url"
                            type="url"
                            placeholder="https://facebook.com/yourclub"
                            value={facebookUrl}
                            onChange={(e) => setFacebookUrl(e.target.value)}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          If provided, these URLs may be used on the public club
                          page for linking to your social media profiles.
                        </p>
                      </CardContent>
                    </Card>
                  </section>

                  {/* Other Configurations Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 auto-rows-max">
                    {/* Opening Times Section */}
                    <section className="h-full flex flex-col">
                      <h3 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Opening Times
                      </h3>
                      <Card className="rounded-2xl flex-1 flex flex-col">
                        <CardContent className="px-5 flex-1 flex flex-col">
                          <p className="text-xs mb-10 text-muted-foreground mt-4">
                            Set your club's opening and closing times for each
                            day. Mark as closed if not open that day.
                          </p>
                          <div className="grid gap-3 flex-1">
                            {openingTimes.map((t, idx) => (
                              <div
                                key={t.day}
                                className="flex items-center gap-3"
                              >
                                <span className="w-24 text-sm font-medium">
                                  {t.day}
                                </span>
                                <Input
                                  type="time"
                                  value={t.open}
                                  disabled={t.closed}
                                  onChange={(e) =>
                                    handleTimeChange(
                                      idx,
                                      "open",
                                      e.target.value,
                                    )
                                  }
                                  className="w-28"
                                  aria-label={`${t.day} opening time`}
                                />
                                <span className="text-muted-foreground">–</span>
                                <Input
                                  type="time"
                                  value={t.close}
                                  disabled={t.closed}
                                  onChange={(e) =>
                                    handleTimeChange(
                                      idx,
                                      "close",
                                      e.target.value,
                                    )
                                  }
                                  className="w-28"
                                  aria-label={`${t.day} closing time`}
                                />
                                <label className="flex items-center gap-2 ml-2 text-xs cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={t.closed}
                                    onChange={(e) =>
                                      handleClosedChange(idx, e.target.checked)
                                    }
                                    className="accent-primary"
                                  />
                                  <span>Closed</span>
                                </label>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </section>

                    {/* Club Description Section */}
                    <section className="h-full flex flex-col">
                      <h3 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Club Description
                      </h3>
                      <Card className="rounded-2xl flex-1 flex flex-col">
                        <CardContent className="px-5 flex-1 flex flex-col">
                          <p className="text-xs mb-5 mt-4 text-muted-foreground">
                            Provide a detailed description about your club to help members and visitors understand what your club is about.
                          </p>
                          <div className="flex-1 flex flex-col">
                            <Textarea
                              id="about_club"
                              placeholder="Information about the club"
                              value={clubDetails}
                              onChange={(e) => setClubDetails(e.target.value)}
                              className="min-h-32 flex-1"
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </section>
                  </div>

                  {/* Gallery Section - Full Width */}
                  <section>
                    <h3 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Gallery
                    </h3>
                    <ClubGalleryEdit />
                  </section>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="account">
              <BankingDetailsForm
                club_account_id={club?.club_account_id as string}
                bankDetails={data?.bank_details}
                payfastEnabled={data?.payfast_enabled}
                customPaymentMethods={data?.custom_payment_methods}
                onSave={handleBankingDetailsSave}
                isPending={isPending}
              />
            </TabsContent>

            {/* Location Tab */}
            <TabsContent value="location">
              <Card className="h-[630px] border-0 shadow-none">
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <div className="space-y-1.5">
                    <CardTitle>Location</CardTitle>
                    <CardDescription>
                      Set the country the club is operating out of and preferred
                      currency. Save after updating.
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    disabled={isPending}
                    onClick={update}
                  >
                    {isPending ? (
                      <p className="flex space-x-2 items-center">
                        <Loader2 className="animate-spin" />
                        <span>Saving...</span>
                      </p>
                    ) : (
                      "Save changes"
                    )}
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6">
                    <div className="grid gap-2">
                      <Label>Country of Operation</Label>
                      <Select value={country} onValueChange={setCountry}>
                        <SelectTrigger className="w-[280px]">
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {countries.map((c) => (
                              <SelectItem key={c.code} value={c.code}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Currency</Label>
                      <Select value={currency} onValueChange={setCurrency}>
                        <SelectTrigger className="w-[280px]">
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {currencies.map((curr) => (
                              <SelectItem key={curr.code} value={curr.code}>
                                {curr.name} ({curr.code})
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Emailing Tab */}
            <TabsContent value="emailing">
              <Card className="flex flex-col border-0 shadow-none">
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <div className="space-y-1.5">
                    <CardTitle>Emailing</CardTitle>
                    <CardDescription>
                      Draft custom automated emails and handle member
                      communications.
                    </CardDescription>
                  </div>
                  <Button
                    onClick={update}
                    disabled={isPending}
                    variant="outline"
                  >
                    {isPending ? (
                      <p className="flex space-x-2 items-center">
                        <Loader2 className="animate-spin" />
                        <span>Saving...</span>
                      </p>
                    ) : (
                      "Save email settings"
                    )}
                  </Button>
                </CardHeader>
                <Tabs defaultValue="support-email" className="px-5">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="support-email">
                      Support Email
                    </TabsTrigger>
                    <TabsTrigger value="registration-submission">
                      Registration Submission
                    </TabsTrigger>
                    <TabsTrigger value="registration-success">
                      Registration Success
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent
                    value="support-email"
                    className="flex flex-col py-2 gap-2"
                  >
                    <CardTitle>Support Email</CardTitle>
                    <CardDescription>
                      Set the support email members can contact. This mailbox
                      will also receive a notification each time a member
                      submits a registration form.
                    </CardDescription>
                    <Input
                      id="tabs-demo-name"
                      type="text"
                      value={supportEmail}
                      onChange={(e) => setSupportEmail(e.target.value)}
                      placeholder="Set support email"
                    />
                    <div className="flex items-center gap-3 mt-4 p-4 bg-gray-50 rounded-lg dark:bg-gray-900">
                      <input
                        type="checkbox"
                        id="notify-registration"
                        checked={notifyOnMemberRegistration !== false}
                        onChange={(e) =>
                          setNotifyOnMemberRegistration(e.target.checked)
                        }
                        className="h-4 w-4 accent-primary rounded"
                      />
                      <Label
                        htmlFor="notify-registration"
                        className="cursor-pointer text-sm"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">
                            Send email notification on new member registration
                          </span>
                          <p className="text-xs text-muted-foreground mt-1">
                            The support email will receive a notification
                            whenever a member successfully registers for a club
                            activity.
                          </p>
                        </div>
                      </Label>
                    </div>
                  </TabsContent>

                  <TabsContent
                    value="registration-submission"
                    className="flex flex-col py-2 gap-2"
                  >
                    <CardTitle>Registration Submission Email</CardTitle>
                    <CardDescription>
                      This is an editable draft of the email sent to a member
                      when they submit their registration. To insert the
                      member’s name, use <strong>{"{{member_name}}"}</strong>.
                    </CardDescription>
                    <EditableEmailTemplate
                      template={registrationSubmissionEmailTemplate}
                      subject={registrationSubmissionEmailSubject}
                      clubName={club?.club_name ?? ""}
                      supportEmail={supportEmail}
                      setTemplate={setRegistrationSubmissionEmailTemplate}
                      setSubject={setRegistrationSubmissionEmailSubject}
                      useTemplate={useSubmissionEmailTemplate}
                      setUseTemplate={setUseSubmissionEmailTemplate}
                    />
                  </TabsContent>

                  <TabsContent
                    value="registration-success"
                    className="flex flex-col py-2 gap-2"
                  >
                    <CardTitle>Registration Success Email</CardTitle>
                    <CardDescription>
                      Customize the email template sent to members upon
                      successful registration. Use{" "}
                      <strong>{"{{member_name}}"}</strong> to include the
                      member's name and <strong>{"{{custom_field}}"}</strong> to
                      reference custom registration fields (use lowercase with
                      underscores between words). Custom field values will be
                      requested for the admin to enter when registering the
                      member.
                    </CardDescription>
                    <EditableEmailTemplate
                      template={registrationSuccessEmailTemplate}
                      subject={registrationSuccessEmailSubject}
                      clubName={club?.club_name ?? ""}
                      supportEmail={supportEmail}
                      setTemplate={setRegistrationSuccessEmailTemplate}
                      setSubject={setRegistrationSuccessEmailSubject}
                      useTemplate={useSuccessEmailTemplate}
                      setUseTemplate={setUseSuccessEmailTemplate}
                    />
                  </TabsContent>
                </Tabs>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
