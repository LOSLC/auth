"use client";
import { usePageData } from "@/lib/states/page-data";

export default function PageTitle({ title }: { title?: string }) {
  const { title: pageTitle } = usePageData();
  return (
    <h1 className="text-2xl font-semibold p-4">
      {title ?? pageTitle ?? "Page"}
    </h1>
  );
}
