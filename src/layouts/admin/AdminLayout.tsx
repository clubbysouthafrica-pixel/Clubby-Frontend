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
import React, { useContext } from "react";
import ClubProvider, {
  ClubContext,
  ClubContextType,
} from "@/context/ClubContext";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { club } = useContext(ClubContext) as ClubContextType;

  // Split the path into parts and filter out empty segments
  const pathSegments = location.pathname.split("/").filter(Boolean);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset
        className={
          club?.deregistration_in_progress
            ? "pointer-events-none opacity-50"
            : ""
        }
      >
        {club?.deregistration_in_progress && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 pointer-events-auto">
            <Alert variant="destructive" className="w-full max-w-2xl mx-4 border-2 border-red-600 shadow-2xl">
              <AlertTriangle className="h-6 w-6" />
              <AlertDescription className="ml-2 text-lg">
                This club is currently undergoing deregistration and cannot be
                interacted with. Please contact support for assistance if this
                message persists longer than 10 minutes.
              </AlertDescription>
            </Alert>
          </div>
        )}
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
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
                            <Link to={path}>{segment.replace(/-/g, " ")}</Link>
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
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
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
