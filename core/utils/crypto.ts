import type { OAuthJWT } from "@/app/actions/types.oauth";
import * as bcrypt from "bcrypt";
import { SignJWT, importPKCS8, jwtVerify } from "jose";
import { getEnv } from "./env";

export async function hashString(str: string, l = 10): Promise<string> {
  return await bcrypt.hash(str, l);
}

export async function compareHash(str: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(str, hash);
}

const JWT_ALGORITHM = "RS256";
const JWT_PRIVATE_KEY = getEnv("JWT_PRIVATE_KEY");
const JWT_PUBLIC_KEY = getEnv("JWT_PUBLIC_KEY");

export async function generateJWT(jwt: OAuthJWT) {
  const pvKey = Buffer.from(JWT_PRIVATE_KEY, "base64").toString("utf-8");
  const token = await new SignJWT({ ...jwt })
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .sign(await importPKCS8(pvKey, JWT_ALGORITHM));
  return token;
}

export async function verifyJWT(token: string): Promise<OAuthJWT> {
  const pubKey = Buffer.from(JWT_PUBLIC_KEY, "base64").toString("utf-8");
  const { payload } = await jwtVerify<OAuthJWT>(
    token,
    await importPKCS8(pubKey, JWT_ALGORITHM),
  );
  return payload;
}
