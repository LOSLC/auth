import { requireAuth } from "@/app/actions/authtentication";

export default async function AuthWrapper({
  children,
}: { children: React.ReactNode }) {
  await requireAuth();
  return <>{children}</>;
}
