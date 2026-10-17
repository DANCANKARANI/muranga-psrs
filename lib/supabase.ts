import "server-only";

import { createClient } from "@supabase/supabase-js";

const BUCKET_NAME = "request-attachments";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase server credentials are not configured.");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

function validateStoragePath(path: string): void {
  if (!path.trim() || path.startsWith("/") || path.split("/").includes("..")) {
    throw new Error("A valid storage path is required.");
  }
}

export async function uploadFile(file: File, path: string): Promise<string> {
  validateStoragePath(path);

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .storage.from(BUCKET_NAME)
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    throw new Error(`Attachment upload failed: ${error.message}`);
  }

  return data.path;
}

export async function downloadFile(path: string): Promise<Blob> {
  validateStoragePath(path);
  const { data, error } = await getSupabaseAdmin()
    .storage.from(BUCKET_NAME)
    .download(path);

  if (error) {
    throw new Error(`Attachment download failed: ${error.message}`);
  }

  return data;
}