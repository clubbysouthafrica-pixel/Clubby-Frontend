import { UserOnboardForm } from "@/components/user-onboard-form"

export default function OnboardUser() {
    return (
        <div className="flex flex-col items-center justify-center gap-6 p-6 md:p-10">
            <div className="flex w-full max-w-lg flex-col gap-6">
                <UserOnboardForm />
            </div>
        </div>
    )
}
