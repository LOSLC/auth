"use client";
import {
  LineChart,
  MessageCircleMore,
  Share2,
  User,
} from "lucide-react";
import AppSidebar from "./dashboard-sidebar";

export default function AppSidebarWrapper() {
  return (
    <AppSidebar
      items={[
        {
          label: "Profile",
          href: "/dashboard",
          icon: <User />,
        },
        {
          label: "Developers",
          group: true,
          items: [
            {
              label: "OAuth Apps",
              href: "/dashboard/developers/oauth-apps",
              icon: <User />,
            },
          ],
        },
      ]}
    />
  );
}
