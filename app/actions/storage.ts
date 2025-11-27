"use server";

import { uploadFile, uploadFiles } from "@/core/pocketbase/storage";
import type { ServerResponse } from "@/lib/types/request-response";
import { getCurrentUser as requireAuth } from "./authtentication";

export async function uploadFileAction(
  file: File,
): Promise<ServerResponse<string>> {
  const currentUser = await requireAuth();
  try {
    const f = await uploadFile({
      file,
      currentUser,
    });
    if (!f.url) {
      return { success: false, message: "File upload failed" };
    }
    return { success: true, data: f.url };
  } catch (error) {
    return { success: false, message: (error as Error).message };
  }
}

export async function uploadFilesAction(
  files: File[],
): Promise<ServerResponse<string[]>> {
  const currentUser = await requireAuth();
  try {
    const fs = await uploadFiles({
      files,
      currentUser,
    });
    const fileUrls = fs.map((f) => f.url).filter((url): url is string => !!url);
    if (fileUrls.length === 0) {
      return { success: false, message: "File uploads failed" };
    }
    return { success: true, data: fileUrls };
  } catch (error) {
    return { success: false, message: (error as Error).message };
  }
}
