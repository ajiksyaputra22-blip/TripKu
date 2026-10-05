import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Service-role client — server-side only, never expose to browser
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

export type UploadResult = { url: string } | { error: string };

/**
 * Upload a file buffer to Supabase Storage.
 * Returns a public URL on success or an error string on failure.
 */
export async function uploadToStorage(
  buffer: Buffer,
  bucket: string,
  filePath: string,
  contentType: string
): Promise<UploadResult> {
  const { error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(filePath, buffer, {
      contentType,
      upsert: true,
    });

  if (error) {
    console.error("Supabase Storage upload error:", error.message);
    return { error: error.message };
  }

  const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(filePath);
  return { url: data.publicUrl };
}
