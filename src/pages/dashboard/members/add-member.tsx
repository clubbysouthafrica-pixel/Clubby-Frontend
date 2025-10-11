import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { ClubRegisterForm } from "@/components/admin/members/add-member/club-registration-form";


export default function AddMemberPage() {
    const [showRegistrationForm, setShowRegistrationForm] = useState(false);
    const [memberEmail, setMemberEmail] = useState("");
    const [isError, setIsError] = useState<undefined | string>(undefined)

    const handleEmailSubmission = () => {
        if (memberEmail === "" || !memberEmail.includes('@') || !memberEmail.includes('.')) setIsError("Invalid email provided.")
        setShowRegistrationForm(true)
    };

    return (
        <div className="p-5 min-h-screen">
            <h1 className="text-base font-bold">Add Member</h1>
            <CardDescription>
                <>
                    <p>
                        This page allows you to manually create a member profile and initiate the registration process.
                        Once the registration form has been completed and submitted by the member, their application will be recorded as pending.
                        You will then need to formally approve and register the member via the Members page.
                    </p>
                    <p className="mt-2">
                        An email containing a temporary password will be sent to the member, granting them access to the Member Portal, where they can manage their membership details. <br />
                        <span className="underline"> ⚠️ Please ensure that a valid email address is provided to ensure successful communication and account registration.</span>
                    </p>
                </>
            </CardDescription>
            {
                !showRegistrationForm &&
                <div className="flex flex-col gap-2">
                    <Input
                        id="email"
                        type="text"
                        placeholder="Enter member email address"
                        className="mt-4 w-[350px]"
                        onChange={(e) => {
                            setMemberEmail(e.target.value);
                            setIsError(false);
                        }}
                        required={true}
                    />
                    {isError && (
                        <Alert variant="destructive" className="w-[350px] flex flex-row">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="text-xs">
                                {isError}
                            </AlertDescription>
                        </Alert>
                    )}
                    <Button className="w-[350px]" onClick={handleEmailSubmission}>Continue</Button>
                </div>
            }
            {
                showRegistrationForm &&
                <div className="mt-4 w-[700px]">
                    <ClubRegisterForm memberEmail={memberEmail} />
                </div>
            }
        </div>
    );
}