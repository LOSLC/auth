import { verifyJWT } from "@/core/utils/crypto";

export async function authenticateRequest(r: Request) {
  const headers = r.headers;
  const authHeader = headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Unauthorized");
  }
  const token = authHeader.replace("Bearer", "").trim();
  return await verifyJWT(token);
}
