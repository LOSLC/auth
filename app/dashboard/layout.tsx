import SidebarTriggerWrapper from "@/components/navigation/dashboard-sidebar/dashboard-trigger-wrapper";
import AppSidebarWrapper from "@/components/navigation/dashboard-sidebar/sidebar-wrapper";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <AppSidebarWrapper />
        <SidebarInset className="w-full">
          <div className="h-full w-full overflow-y-scroll">
            {" "}
            <div className="flex flex-col pb-2">
              <div className="flex justify-start items-center">
                <SidebarTriggerWrapper />
              </div>
            </div>
            <div className="pb-6">
              <Separator />
            </div>
            <div className="w-full px-5 pb-5">{children}</div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
