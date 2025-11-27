"use client";

import { useSidebar } from "@/components/ui/sidebar";
import SidebarTrigger from "./sidebar-trigger";

export default function SidebarTriggerWrapper() {
  const { isMobile } = useSidebar();
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <div className={isMobile ? "hidden" : "block"}>
          <SidebarTrigger />
        </div>
        {isMobile ? <SidebarTrigger /> : null}
      </div>
    </div>
  );
}
