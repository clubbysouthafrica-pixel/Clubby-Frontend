import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import EditableEmailTemplate from "@/components/admin/manage/emailing/editable_email_template";
import { type ClubVariable } from "@/components/admin/club/manage-club/club-variables-form";

interface EmailSettingsFormProps {
  supportEmail: string;
  setSupportEmail: (email: string) => void;
  notifyOnMemberRegistration: boolean;
  setNotifyOnMemberRegistration: (notify: boolean) => void;
  registrationSubmissionEmailTemplate: string;
  setRegistrationSubmissionEmailTemplate: (template: string) => void;
  registrationSubmissionEmailSubject: string;
  setRegistrationSubmissionEmailSubject: (subject: string) => void;
  useSubmissionEmailTemplate: boolean;
  setUseSubmissionEmailTemplate: (use: boolean) => void;
  registrationSuccessEmailTemplate: string;
  setRegistrationSuccessEmailTemplate: (template: string) => void;
  registrationSuccessEmailSubject: string;
  setRegistrationSuccessEmailSubject: (subject: string) => void;
  useSuccessEmailTemplate: boolean;
  setUseSuccessEmailTemplate: (use: boolean) => void;
  clubName: string;
  clubVariables?: ClubVariable[];
  onSave: (emailData: {
    club_account_id: string;
    registration_submission_email_subject: string;
    registration_submission_email_template_body: string;
    registration_success_email_subject: string;
    registration_success_email_template_body: string;
    support_email: string;
    use_submission_email_template: boolean;
    use_success_email_template: boolean;
  }) => void;
  isPending: boolean;
  clubAccountId: string;
}

export function EmailSettingsForm({
  supportEmail,
  setSupportEmail,
  notifyOnMemberRegistration,
  setNotifyOnMemberRegistration,
  registrationSubmissionEmailTemplate,
  setRegistrationSubmissionEmailTemplate,
  registrationSubmissionEmailSubject,
  setRegistrationSubmissionEmailSubject,
  useSubmissionEmailTemplate,
  setUseSubmissionEmailTemplate,
  registrationSuccessEmailTemplate,
  setRegistrationSuccessEmailTemplate,
  registrationSuccessEmailSubject,
  setRegistrationSuccessEmailSubject,
  useSuccessEmailTemplate,
  setUseSuccessEmailTemplate,
  clubName,
  clubVariables,
  onSave,
  isPending,
  clubAccountId,
}: EmailSettingsFormProps) {
  const validateTemplateVariables = (): boolean => {
    // Extract all {{variable}} patterns from the registration success email template
    const variablePattern = /\{\{(\w+)\}\}/g
    const matches = registrationSuccessEmailTemplate.matchAll(variablePattern)
    const templateVariables = Array.from(matches, (m) => m[1])

    if (templateVariables.length === 0) {
      return true // No variables, validation passes
    }

    // Get valid variable keys (built-in + club variables)
    const validKeys = new Set<string>([
      "member_name",
      ...(clubVariables?.map((v) => v.key) || []),
    ])

    // Check for invalid variables
    const invalidVariables = templateVariables.filter((v) => !validKeys.has(v))

    if (invalidVariables.length > 0) {
      const uniqueInvalid = [...new Set(invalidVariables)].join(", ")
      toast.error(
        `Invalid variable(s) in Registration Success Email: {{${uniqueInvalid}}}. Please remove these or add matching club variables.`
      )
      return false
    }

    return true
  }

  const handleSave = () => {
    if (validateTemplateVariables()) {
      onSave({
        club_account_id: clubAccountId,
        registration_submission_email_subject: registrationSubmissionEmailSubject,
        registration_submission_email_template_body: registrationSubmissionEmailTemplate,
        registration_success_email_subject: registrationSuccessEmailSubject,
        registration_success_email_template_body: registrationSuccessEmailTemplate,
        support_email: supportEmail,
        use_submission_email_template: useSubmissionEmailTemplate,
        use_success_email_template: useSuccessEmailTemplate,
      })
    }
  }

  return (
    <Card className="flex flex-col border-0 shadow-none">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="space-y-1.5">
          <CardTitle>Emailing</CardTitle>
          <CardDescription>
            Draft custom automated emails and handle member communications.
          </CardDescription>
        </div>
        <Button onClick={handleSave} disabled={isPending} variant="outline">
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
          <TabsTrigger value="registration-submission">
            Registration Submission
          </TabsTrigger>
          <TabsTrigger value="registration-success">
            Registration Success
          </TabsTrigger>
        </TabsList>

        <TabsContent value="support-email" className="flex flex-col py-2 gap-2">
          <CardTitle>Support Email</CardTitle>
          <CardDescription>
            Set the support email members can contact. This mailbox will also
            receive a notification each time a member submits a registration
            form.
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
                  The support email will receive a notification whenever a
                  member successfully registers for a club activity.
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
            This is an editable draft of the email sent to a member when they
            submit their registration. To insert the member's name, use{" "}
            <strong>{"{{member_name}}"}</strong>.
          </CardDescription>
          <EditableEmailTemplate
            template={registrationSubmissionEmailTemplate}
            subject={registrationSubmissionEmailSubject}
            clubName={clubName}
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
            Customize the email template sent to members upon successful
            registration. Use <strong>{"{{member_name}}"}</strong> to include
            the member's name and <strong>{"{{custom_field}}"}</strong> to
            reference custom registration fields (use lowercase with underscores
            between words). Custom field values will be requested for the admin
            to enter when registering the member.
          </CardDescription>
          <EditableEmailTemplate
            template={registrationSuccessEmailTemplate}
            subject={registrationSuccessEmailSubject}
            clubName={clubName}
            supportEmail={supportEmail}
            setTemplate={setRegistrationSuccessEmailTemplate}
            setSubject={setRegistrationSuccessEmailSubject}
            useTemplate={useSuccessEmailTemplate}
            setUseTemplate={setUseSuccessEmailTemplate}
            clubVariables={clubVariables}
          />
        </TabsContent>
      </Tabs>
    </Card>
  );
}
