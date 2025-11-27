import { requireAuth } from "./actions/authtentication";
import { redirect } from "next/navigation";

export default async function Home() {
  await requireAuth()
  redirect("/dashboard")
}
