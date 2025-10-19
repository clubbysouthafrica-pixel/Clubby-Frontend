import { ClubRegisterForm } from "@/components/club-onboard-form"
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
            <div className="flex justify-center pt-10">
                <div className="w-[900px] flex flex-col gap-6">
                    <ClubRegisterForm />
                </div>
            </div>
        </div>
    )
}
