import { getEnv } from "../utils/env";
import PocketBase from "pocketbase";

const pocketbaseUrl = getEnv("POCKETBASE_URL");
const pocketbaseAdminEmail = getEnv("POCKETBASE_ADMIN_EMAIL");
const pocketbaseAdminPassword = getEnv("POCKETBASE_ADMIN_PASSWORD");

export const pocketbaseInstance = new PocketBase(pocketbaseUrl);

// Authentication

export const pocketbaseAuthData = await pocketbaseInstance
  .collection("_superusers")
  .authWithPassword(pocketbaseAdminEmail, pocketbaseAdminPassword);
