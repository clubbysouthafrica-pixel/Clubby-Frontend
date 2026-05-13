import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "react-router-dom";
import React, { useContext, useState } from "react";
import ClubProvider, {
  ClubContext,
  ClubContextType,
} from "@/context/ClubContext";
import { AlertTriangle, AlertCircle, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { club } = useContext(ClubContext) as ClubContextType;
  const [isBannerClosed, setIsBannerClosed] = useState(false);

  // Split the path into parts and filter out empty segments
  const pathSegments = location.pathname.split("/").filter(Boolean);

  // Check if club setup is incomplete
  const isClubIncomplete =
    club &&
    (club.registration_form_exists === false ||
      club.currency_exists === false ||
      club.country_exists === false ||
      club.bank_details_exists === false);

  return (
    <>
      {isClubIncomplete && !isBannerClosed && (
        <div className="fixed top-0 left-0 right-0 z-50 w-full bg-orange-50 border-b-4 border-orange-400 p-4">
          <div className="flex w-full gap-3 items-start pr-12">
            <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="text-orange-800 flex-1 whitespace-normal">
              Your club setup is incomplete. Please complete the following to
              make your club visible to members:{" "}
              {!club.registration_form_exists && (
                <>
                  <Link
                    to="/manage/registrations/forms?missing=registration_form"
                    className="underline font-semibold hover:text-orange-900"
                  >
                    Registration Form
                  </Link>
                  ,{" "}
                </>
              )}
              {!club.country_exists && (
                <>
                  <Link
                    to="/manage/club?missing=country"
                    className="underline font-semibold hover:text-orange-900"
                  >
                    Country
                  </Link>
                  ,{" "}
                </>
              )}
              {!club.currency_exists && (
                <>
                  <Link
                    to="/manage/club?missing=currency"
                    className="underline font-semibold hover:text-orange-900"
                  >
                    Currency
                  </Link>
                  ,{" "}
                </>
              )}
              {!club.bank_details_exists && (
                <Link
                  to="/manage/club?missing=bank_details"
                  className="underline font-semibold hover:text-orange-900"
                >
                  Bank Details
                </Link>
              )}
            </div>
          </div>
          <button
            onClick={() => setIsBannerClosed(true)}
            className="absolute top-4 right-4 text-orange-600 hover:text-orange-800 transition-colors"
            aria-label="Close banner"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
      <div className={`flex flex-col min-h-screen`}>
        <div className={`flex-1 ${isClubIncomplete && !isBannerClosed ? "" : ""}`}>
        <SidebarProvider className={`${isClubIncomplete && !isBannerClosed ? "" : ""}`}>
          <AppSidebar />
          <SidebarInset
            className={[
              "flex h-screen flex-col overflow-hidden",
              club?.deregistration_in_progress
                ? "pointer-events-none opacity-50"
                : "",
            ].join(" ")}
          >
            {club?.deregistration_in_progress && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 pointer-events-auto">
                <Alert
                  variant="destructive"
                  className="w-full max-w-2xl mx-4 border-2 border-red-600 shadow-2xl"
                >
                  <AlertTriangle className="h-6 w-6" />
                  <AlertDescription className="ml-2 text-lg">
                    This club is currently undergoing deregistration and cannot
                    be interacted with. Please contact support for assistance if
                    this message persists longer than 10 minutes.
                  </AlertDescription>
                </Alert>
              </div>
            )}
            <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-2 border-b border-slate-200 bg-white/95 backdrop-blur transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
              <div className="flex items-center gap-2 px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />

                <Breadcrumb>
                  <BreadcrumbList>
                    {/* Home Link */}
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink asChild>
                        <Link to="/">Home</Link>
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:block" />

                    {/* Generate Breadcrumbs */}
                    {pathSegments.map((segment, index) => {
                      // Build the cumulative path for each segment
                      const path = `/${pathSegments.slice(0, index + 1).join("/")}`;

                      return (
                        <React.Fragment key={`${segment}-${index}`}>
                          <BreadcrumbItem>
                            {index === pathSegments.length - 1 ? (
                              <BreadcrumbPage>
                                {segment.replace(/-/g, " ")}
                              </BreadcrumbPage>
                            ) : (
                              <BreadcrumbLink asChild>
                                <Link to={path}>
                                  {segment.replace(/-/g, " ")}
                                </Link>
                              </BreadcrumbLink>
                            )}
                          </BreadcrumbItem>
                          {index < pathSegments.length - 1 && (
                            <BreadcrumbSeparator />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </header>
            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pt-0">{children}</div>
          </SidebarInset>
        </SidebarProvider>
        </div>
      </div>
    </>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClubProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </ClubProvider>
  );
}
