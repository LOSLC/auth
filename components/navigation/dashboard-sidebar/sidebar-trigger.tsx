"use client";

import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { Menu } from "lucide-react";

export default function SidebarTrigger() {
  const { toggleSidebar, open } = useSidebar();
  return (
    <Button
      onClick={toggleSidebar}
      variant={"ghost"}
      className="rounded-full m-2"
    >
      <Menu
        className={`transition-transform ${open ? "rotate-0" : "rotate-180"}`}
      />
    </Button>
  );
}
