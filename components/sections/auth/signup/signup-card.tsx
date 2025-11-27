import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { appConfig } from "@/core/config";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import ProviderButton from "./provider-button";
import { ChevronDown } from "lucide-react";
import { AuthPageParams } from "@/lib/types/auth-pages";

export default function SignupCard({
  params,
}: {
  params?: AuthPageParams;
}) {
  const providers = [];
  for (const pKey in appConfig.authProviders) {
    const provider =
      appConfig.authProviders[pKey as keyof typeof appConfig.authProviders];
    provider && providers.push(pKey);
  }
  return (
    <div className="flex border border-border rounded-2xl bg-zinc-50 px-4 dark:bg-transparent overflow-scroll hide-scrollbar">
      <form action="" className="max-w-72 md:max-w-92 m-auto w-full">
        <div className="p-6">
          <div>
            <Link href="/" aria-label="go home"></Link>
            <h1 className="mb-1 mt-4 text-xl font-semibold">
              Create a {appConfig.APP_NAME} Account
            </h1>
            <p>Welcome! Create an account to get started</p>
          </div>

          <Collapsible className="mt-4">
            <CollapsibleTrigger asChild className="w-full">
              <Button variant={"outline"}>
                Sign options
                <ChevronDown />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="">
              <div className="mt-2 flex flex-col gap-2 opacity-0 translate-y-3 animate-[fadeInUp_0.4s_ease-in-out_forwards]">
                {providers.map((provider) => (
                  <ProviderButton
                    key={`provider-${provider}`}
                    provider={provider as keyof typeof appConfig.authProviders}
                    callbackURL={params?.successRedirect}
                    errorCallbackURL={params?.errorRedirect}
                  />
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>

          <div className="my-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <hr className="border-dashed" />
            <span className="text-muted-foreground text-xs">
              Or continue With
            </span>
            <hr className="border-dashed" />
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="block text-sm">
                First Name
              </Label>
              <Input
                type="text"
                required
                name="name"
                id="name"
                placeholder="Bill"
                className="placeholder:text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="block text-sm">
                Email
              </Label>
              <Input
                type="email"
                required
                name="email"
                id="email"
                placeholder="email@example.com"
                className="placeholder:text-sm"
              />
            </div>

            <Button className="w-full">Continue</Button>
          </div>
        </div>

        <p className="text-accent-foreground text-center text-sm">
          Have an account ?
          <Button asChild variant="link" className="px-2">
            <Link href="#">Sign In</Link>
          </Button>
        </p>
      </form>
    </div>
  );
}
