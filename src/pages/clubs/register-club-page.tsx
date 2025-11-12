import { ClubRegisterForm } from "@/components/member/register/registration_form"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Link, useParams } from "react-router-dom"

export default function RegisterClubPage() {
    const { clubId } = useParams()

    return (
        <div className="flex flex-col items-center justify-center gap-6 p-6 md:p-10">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/">Home</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <Link to={`/myclubs/${clubId}`}>Club</Link>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>Onboard</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            <div className="flex justify-center pt-2">
                <div className="flex flex-col gap-6 w-full">
                    <ClubRegisterForm />
                </div>
            </div>
        </div>
    )
}
