import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClubContext, ClubContextType } from "@/context/ClubContext";
import { countries } from "@/data/countries";
import { currencies } from "@/data/currencies";
import { useUpdateClubDetailsMutation } from "@/mutations/admin/club";
import { useFetchClubDetails } from "@/queries/admin/clubs";
import { Loader2 } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import { REGISTRATION_SUBMISSION_EMAIL_TEMPLATE, REGISTRATION_SUCCESS_EMAIL_TEMPLATE } from "@/helpers/admin/constants/registration_submission_email_template";
import EditableEmailTemplate from "../../../components/admin/manage/emailing/editable_email_template"
import { BankingDetailsForm } from "@/components/admin/club/banking-details-form"


export default function EditClubDetails() {
    const { club } = useContext(ClubContext) as ClubContextType
    const { data, isLoading } = useFetchClubDetails(club?.club_account_id as string)
    const { mutate, isPending } = useUpdateClubDetailsMutation()

    const [country, setCountry] = useState('')
    const [currency, setCurrency] = useState('')
    const [supportEmail, setSupportEmail] = useState('')
    const [clubUrl, setClubUrl] = useState('')
    const [hideFromPublic, setHideFromPublic] = useState<boolean>(false)

    const [registrationSubmissionEmailTemplate, setRegistrationSubmissionEmailTemplate] = useState<string>(REGISTRATION_SUBMISSION_EMAIL_TEMPLATE)
    const [registrationSuccessEmailTemplate, setRegistrationSuccessEmailTemplate] = useState<string>(REGISTRATION_SUCCESS_EMAIL_TEMPLATE)
    const [useSuccessEmailTemplate, setUseSuccessEmailTemplate] = useState<boolean>(false)
    const [useSubmissionEmailTemplate, setUseSubmissionEmailTemplate] = useState<boolean>(false)

    useEffect(() => {
        if (data) {
            setCurrency(data?.currency)
            setCountry(data?.country_of_operation)
            setSupportEmail(data.support_email)
            setClubUrl(data?.club_url || '')
            setHideFromPublic(data?.hide_from_public ?? false)

            setRegistrationSubmissionEmailTemplate(data?.registration_submission_email_template_body ?? REGISTRATION_SUBMISSION_EMAIL_TEMPLATE)
            setRegistrationSuccessEmailTemplate(data?.registration_success_email_template_body ?? REGISTRATION_SUCCESS_EMAIL_TEMPLATE)
            setUseSubmissionEmailTemplate(data?.use_submission_email_template ?? false)
            setUseSuccessEmailTemplate(data?.use_success_email_template ?? false)
        }
    }, [data])

    const handleBankingDetailsSave = (bankingData: {
        bank_details: {
            bank: string
            account_number: string
            branch_code: string
            account_type: string
        }
    }) => {
        mutate({
            club_account_id: club?.club_account_id as string,
            bank_details: bankingData.bank_details,
            country_of_operation: country,
            currency,
            support_email: supportEmail,
        club_url: clubUrl,
        hide_from_public: hideFromPublic,
            registration_submission_email_template_body: registrationSubmissionEmailTemplate,
            registration_success_email_template_body: registrationSuccessEmailTemplate,
            use_success_email_template: useSuccessEmailTemplate,
            use_submission_email_template: useSubmissionEmailTemplate
        }, {
            onSuccess: () => toast.success("Successfully updated club details"),
            onError: () => toast.error("Something went wrong")
        })
    }

    const update = () => mutate({
        club_account_id: club?.club_account_id as string,
        bank_details: data?.bank_details || { bank: '', account_number: '', branch_code: '', account_type: '' },
        payfast_details: data?.payfast_details || { merchant_id: '', merchant_key: '', passphrase: '' },
        country_of_operation: country,
        currency,
        support_email: supportEmail,
        club_url: clubUrl,
        hide_from_public: hideFromPublic,
        registration_submission_email_template_body: registrationSubmissionEmailTemplate,
        registration_success_email_template_body: registrationSuccessEmailTemplate,
        use_success_email_template: useSuccessEmailTemplate,
        use_submission_email_template: useSubmissionEmailTemplate
    }, {
        onSuccess: () => toast.success("Successfully updated club details"),
        onError: () => toast.error("Something went wrong")
    })

    if (isLoading) {
        return (
            <div className="p-5 min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex w-[80%] flex-col">
                {!isLoading && (
                    <Tabs defaultValue="club-view">
                        <TabsList className="grid w-full grid-cols-4">
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
                                            Control details shown on the public club page. Optionally set a Club URL to embed external content.
                                        </CardDescription>
                                    </div>
                                    <Button variant="outline" disabled={isPending} onClick={update}>
                                        {isPending ? (
                                            <p className="flex space-x-2 items-center">
                                                <Loader2 className="animate-spin" />
                                                <span>Saving...</span>
                                            </p>
                                        ) : "Save changes"}
                                    </Button>
                                </CardHeader>
                                <CardContent className="grid gap-6">
                                    <div className="grid gap-2">
                                        <Label htmlFor="club_url">Club URL (optional)</Label>
                                        <Input
                                            id="club_url"
                                            type="url"
                                            placeholder="https://example.com/club"
                                            value={clubUrl}
                                            onChange={(e) => setClubUrl(e.target.value)}
                                        />
                                        <p className="text-xs text-muted-foreground">If provided, this URL may be used on the public club page for embedding or linking.</p>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="text-sm">Public Listing</Label>
                                        <p className="text-xs text-muted-foreground">Control whether this club appears in the public Browse Clubs list.</p>
                                        <div className="flex items-center gap-6 mt-1">
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
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border rounded-lg p-6 shadow-sm">
                                        <div className="space-y-1">
                                            <Label className="text-xs text-muted-foreground">Support Email</Label>
                                            <p className="text-sm font-medium break-all">{supportEmail || "Not set"}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs text-muted-foreground">Country of Operation</Label>
                                            <p className="text-sm font-medium">{country || "Not set"}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs text-muted-foreground">Currency</Label>
                                            <p className="text-sm font-medium">{currency || "Not set"}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs text-muted-foreground">PayFast Enabled</Label>
                                            <p className="text-sm font-medium">{data?.payfast_enabled ? "Yes" : "No"}</p>
                                        </div>
                                        <div className="space-y-1 md:col-span-2">
                                            <Label className="text-xs text-muted-foreground">Bank Details Set</Label>
                                            <p className="text-sm font-medium">{data?.bank_details ? "Configured" : "Missing"}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Banking & Payments Tab */}
                        <TabsContent value="account">
                            <BankingDetailsForm
                                club_account_id={club?.club_account_id as string}
                                bankDetails={data?.bank_details}
                                payfastEnabled={data?.payfast_enabled}
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
                                            Set the country the club is operating out of and preferred currency. Save after updating.
                                        </CardDescription>
                                    </div>
                                    <Button variant="outline" disabled={isPending} onClick={update}>
                                        {isPending ? (
                                            <p className="flex space-x-2 items-center">
                                                <Loader2 className="animate-spin" />
                                                <span>Saving...</span>
                                            </p>
                                        ) : "Save changes"}
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
                                            Draft custom automated emails and handle member communications.
                                        </CardDescription>
                                    </div>
                                    <Button onClick={update} disabled={isPending} variant="outline">
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
                                        <TabsTrigger value="support-email">Support Email</TabsTrigger>
                                        <TabsTrigger value="registration-submission">Registration Submission</TabsTrigger>
                                        <TabsTrigger value="registration-success">Registration Success</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="support-email" className="flex flex-col py-2 gap-2">
                                        <CardTitle>Support Email</CardTitle>
                                        <CardDescription>
                                            Set the support email members can contact. This mailbox will also receive a notification each time a member submits a registration form.
                                        </CardDescription>
                                        <Input
                                            id="tabs-demo-name"
                                            type="text"
                                            value={supportEmail}
                                            onChange={(e) => setSupportEmail(e.target.value)}
                                            placeholder="Set support email"
                                        />
                                    </TabsContent>

                                    <TabsContent value="registration-submission" className="flex flex-col py-2 gap-2">
                                        <CardTitle>Registration Submission Email</CardTitle>
                                        <CardDescription>
                                            This is an editable draft of the email sent to a member when they submit their registration. To insert the member’s name, use <strong>{"{{member_name}}"}</strong>.
                                        </CardDescription>
                                        <EditableEmailTemplate
                                            template={registrationSubmissionEmailTemplate}
                                            clubName={club?.club_name ?? ""}
                                            supportEmail={supportEmail}
                                            setTemplate={setRegistrationSubmissionEmailTemplate}
                                            useTemplate={useSubmissionEmailTemplate}
                                            setUseTemplate={setUseSubmissionEmailTemplate}
                                        />
                                    </TabsContent>

                                    <TabsContent value="registration-success" className="flex flex-col py-2 gap-2">
                                        <CardTitle>Registration Success Email</CardTitle>
                                        <CardDescription>
                                            This is an editable draft of the email sent to a member upon successful registration by the admin. To insert the member’s name, use <strong>{"{{member_name}}"}</strong>.
                                        </CardDescription>
                                        <EditableEmailTemplate
                                            template={registrationSuccessEmailTemplate}
                                            clubName={club?.club_name ?? ""}
                                            supportEmail={supportEmail}
                                            setTemplate={setRegistrationSuccessEmailTemplate}
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
    )
}