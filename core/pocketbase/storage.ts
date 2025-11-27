import type { User } from "better-auth";
import { files, type FileInfo } from "../db/schemas";
import { db } from "../db/setup";
import { pocketbaseInstance as pb } from "./pb";
import type { RecordModel } from "pocketbase";
import { eq } from "drizzle-orm";
import { AccessDeniedError } from "@/lib/errors/access-errors";

export async function getFileUrl({
  fileId,
  record,
}: { fileId: string; record: RecordModel; single?: boolean }): Promise<string> {
  const url = pb.files.getURL(record, fileId);
  return url;
}

export async function uploadFile({
  file,
  currentUser,
}: { file: File; currentUser: User }): Promise<FileInfo> {
  const [dbFileRecord] = await db
    .insert(files)
    .values({
      userId: currentUser.id,
      name: file.name,
    })
    .returning();
  const record = await pb.collection("sfile").create({
    fdata: new File([file], dbFileRecord.id, {}),
  });
  console.log(record)
  const fileUrl = await getFileUrl({ fileId: record.fdata, record });
  const [updatedDbFileRecord] = await db
    .update(files)
    .set({
      url: fileUrl,
      pbRecordId: record.id,
    })
    .where(eq(files.id, dbFileRecord.id))
    .returning();
  return updatedDbFileRecord;
}

export async function uploadFiles({
  files: uFiles,
  currentUser,
}: { files: File[]; currentUser: User }): Promise<FileInfo[]> {
  const uploadedFiles: FileInfo[] = [];
  for (const file of uFiles) {
    const dbFileRecord = await uploadFile({ file, currentUser });
    uploadedFiles.push(dbFileRecord);
  }
  return uploadedFiles;
}

export async function deleteFile({
  fileId,
  currentUser,
}: { fileId: string; currentUser: User }): Promise<boolean> {
  const [dbFileRecordl] = await db
    .select()
    .from(files)
    .where(eq(files.id, fileId))
    .limit(1);
  if (!dbFileRecordl || dbFileRecordl.pbRecordId === null) {
    return false;
  }
  if (dbFileRecordl.userId !== currentUser.id) {
    throw new AccessDeniedError(
      "You don't have permission to delete this file",
    );
  }
  await pb.collection("sfile").update(dbFileRecordl.pbRecordId, {
    "fdata-": [dbFileRecordl.id],
  });
  return true;
}
