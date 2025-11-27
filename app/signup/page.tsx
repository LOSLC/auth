import SignupCard from "@/components/sections/auth/signup/signup-card";
import { AuthPageParams } from "@/lib/types/auth-pages";
import { requireAuth } from "../actions/authtentication";
import { redirect } from "next/navigation";

export default async function SignupPage({
  searchParams,
}: { searchParams: Record<string, string | string[]> | undefined }) {
  const sp = await searchParams;

  const params: AuthPageParams = {
    successRedirect: (sp?.successRedirect as string) || undefined,
    errorRedirect: (sp?.errorRedirect as string) || undefined,
  };
  let authenticated = false;
  try {
    await requireAuth();
    authenticated = true;
  } catch (error) {
    console.log("Catch");
  }
  if (authenticated) {
    redirect("/dashboard");
  }

  return (
    <div className="flex w-screen h-screen items-center justify-center">
      <div className="h-[400px] flex items-center justify-center">
        <SignupCard params={params} />
      </div>
    </div>
  );
}
