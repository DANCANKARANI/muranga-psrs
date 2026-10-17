import { getSession } from "@/lib/auth";
import { downloadFile } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";

const allowedContentTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
]);

function jsonError(message: string, status: number) {
  return Response.json({ success: false, message }, { status });
}

function legacyStoragePath(urlValue: string): string | null {
  try {
    const url = new URL(urlValue);
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl || url.origin !== new URL(supabaseUrl).origin) return null;

    const prefix = "/storage/v1/object/public/request-attachments/";
    if (!url.pathname.startsWith(prefix)) return null;
    const path = decodeURIComponent(url.pathname.slice(prefix.length));
    if (!path || path.startsWith("/") || path.split("/").includes("..")) return null;
    return path;
  } catch {
    return null;
  }
}

function contentDisposition(fileName: string): string {
  const fallback = fileName
    .replace(/[^\x20-\x7E]|["\\;]/g, "_")
    .slice(0, 150) || "attachment";
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; attachmentId: string }> },
) {
  const session = await getSession();
  if (!session) return jsonError("Authentication required.", 401);

  const { id, attachmentId } = await params;
  const request = await prisma.request.findUnique({
    where: { id },
    select: {
      citizenId: true,
      attachment: true,
      attachments: {
        where: { id: attachmentId },
        select: { storagePath: true, fileName: true, contentType: true },
      },
    },
  });

  if (!request) return jsonError("Request not found.", 404);
  if (session.role !== "ADMIN" && request.citizenId !== session.id) {
    return jsonError("You are not authorized to access this attachment.", 403);
  }

  let storagePath: string | null = null;
  let fileName = "supporting-document";
  let contentType = "application/octet-stream";

  if (attachmentId === "legacy" && request.attachment) {
    storagePath = legacyStoragePath(request.attachment);
    const pathname = request.attachment.split("?")[0] ?? "";
    fileName = decodeURIComponent(pathname.split("/").at(-1) ?? fileName);
    contentType = fileName.toLowerCase().endsWith(".pdf")
      ? "application/pdf"
      : fileName.toLowerCase().endsWith(".png")
        ? "image/png"
        : "image/jpeg";
  } else {
    const attachment = request.attachments[0];
    if (attachment) {
      storagePath = attachment.storagePath;
      fileName = attachment.fileName;
      contentType = attachment.contentType;
    }
  }

  if (!storagePath || !allowedContentTypes.has(contentType)) {
    return jsonError("Attachment not found.", 404);
  }

  try {
    const file = await downloadFile(storagePath);
    return new Response(file.stream(), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": contentDisposition(fileName),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return jsonError("The attachment could not be retrieved.", 502);
  }
}
