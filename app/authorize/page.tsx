"use client"

import { useSearchParams } from "next/navigation"


export default function AuthorizationPage() {
  const params = useSearchParams()
  const clientId = params.get("client_id")
  return <div></div>
}
