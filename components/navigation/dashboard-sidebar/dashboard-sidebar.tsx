"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import ThemeSwitch from "@/components/ui/theme-switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChevronDown } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface SidebarItemI {
  group?: boolean;
  groupAction?: {
    actionIcon: React.ReactNode;
    actionLabel: string;
    actionItems?: {
      label: string;
      icon?: React.ReactNode;
      href?: string;
      actionOnClick?: () => void;
    }[];
  };
  label: string;
  icon?: React.ReactNode;
  href?: string;
  items?: SidebarItemI[];
}

export interface AppSidebarProps {
  items?: SidebarItemI[];
}

const renderSidebarItem = (item: SidebarItemI, index: number) => {
  if (item.group) {
    return (
      <SidebarGroup key={`${item.label}-group-${index}`}>
        <SidebarGroupLabel className="select-none">
          {item.label}
        </SidebarGroupLabel>
        {item.groupAction !== undefined ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarGroupAction>
                {item.groupAction.actionIcon}
              </SidebarGroupAction>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start">
              {item.groupAction.actionItems !== undefined
                ? item.groupAction.actionItems.map(
                    (actionItem, actionIndex) => (
                      <DropdownMenuItem>
                        {actionItem.href ? (
                          <Link
                            href={actionItem.href || "#"}
                            key={`${actionItem.label}-action-${actionIndex}`}
                            className="flex items-center gap-2 w-full h-full"
                          >
                            {actionItem.icon}
                            {actionItem.label}
                          </Link>
                        ) : (
                          <>
                            {actionItem.icon}
                            <span
                              key={`${actionItem.label}-action-${actionIndex}`}
                            >
                              {actionItem.label}
                            </span>
                          </>
                        )}
                      </DropdownMenuItem>
                    ),
                  )
                : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
        <SidebarGroupContent className="flex flex-col gap-2">
          {item.items !== undefined
            ? item.items.map((subItem, subIndex) => {
                const { open } = useSidebar();
                if (!open) {
                  return (
                    <Tooltip key={`${subItem.label}-tooltip-${subIndex}`}>
                      <TooltipTrigger asChild>
                        <SidebarMenu key={`${subItem.label}-item-${subIndex}`}>
                          <SidebarMenuItem>
                            <Link href={subItem.href || "#"}>
                              <SidebarMenuButton className="cursor-pointer h-20 w-20">
                                {subItem.icon}
                                <span>{subItem.label}</span>
                              </SidebarMenuButton>
                            </Link>
                          </SidebarMenuItem>
                        </SidebarMenu>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <span>{subItem.label}</span>
                      </TooltipContent>
                    </Tooltip>
                  );
                }
                return (
                  <SidebarMenu key={`${subItem.label}-item-${subIndex}`}>
                    <SidebarMenuItem>
                      <Link href={subItem.href || "#"}>
                        <SidebarMenuButton className="cursor-pointer h-10">
                          {subItem.icon}
                          <span>{subItem.label}</span>
                        </SidebarMenuButton>
                      </Link>
                    </SidebarMenuItem>
                  </SidebarMenu>
                );
              })
            : null}
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }
  return (
    <SidebarMenu key={`${item.label}-item-${index}`}>
      <SidebarMenuItem>
        <Link href={item.href || "#"}>
          <SidebarMenuButton className="cursor-pointer">
            {item.icon}
            <span>{item.label}</span>
          </SidebarMenuButton>
        </Link>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};

export default function AppSidebar({ items }: AppSidebarProps) {
  const { isMobile } = useSidebar();
  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton size={"lg"}>
                <div className="flex items-center gap-2">
                  <span className="font-bold">
                    {!isMobile ? `${process.env.NEXT_PUBLIC_APP_NAME}` : null}
                  </span>
                </div>
                <ChevronDown className="ml-auto" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[--radix-popper-anchor-width]">
              <DropdownMenuItem>
                <Link href={"/"}>Home</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="flex">
        {items !== undefined
          ? items.map((i, x) => {
              return renderSidebarItem(i, x);
            })
          : null}
      </SidebarContent>
      <SidebarFooter>
        <div>
          <ThemeSwitch />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
