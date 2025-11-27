"use server";

import { db } from "@/core/db/setup";
import { user as userSchema } from "@/core/db/schemas";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import type { ServerResponse } from "@/lib/types/request-response";
import { revalidatePath } from "next/cache";

export interface UpdateUserProfilePayload {
  name?: string;
  lastName?: string;
  handle?: string;
  gender?: string;
  birthdate?: Date;
  image?: string;
}

export async function updateUserProfile(
  payload: UpdateUserProfilePayload
): Promise<ServerResponse<typeof userSchema.$inferSelect>> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user) {
      return {
        success: false,
        message: "Unauthorized",
      };
    }

    const [updatedUser] = await db
      .update(userSchema)
      .set({
        ...payload,
        updatedAt: new Date(),
      })
      .where(eq(userSchema.id, session.user.id))
      .returning();

    revalidatePath("/dashboard");
    
    return {
      success: true,
      data: updatedUser,
      message: "Profile updated successfully",
    };
  } catch (error) {
    console.error("Error updating profile:", error);
    return {
      success: false,
      message: "Failed to update profile",
    };
  }
}
