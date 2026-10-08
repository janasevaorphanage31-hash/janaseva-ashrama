import { NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { requireAdminApi } from "@/lib/admin-auth";
import { clean } from "@/lib/server-utils";

const ALLOWED_MIME_TYPES = new Set([
  // Images
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
  "image/gif",
  // Videos
  "video/mp4",
  "video/webm",
  "video/quicktime",
  // Documents
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/csv",
]);

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB max file size

export async function POST(req: Request) {
  const session = await requireAdminApi();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized. Admin login required." }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const category = clean((formData.get("category") as string) || "general", 30).toLowerCase();

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file provided for upload." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds the 50MB upload limit." },
        { status: 400 }
      );
    }

    const mimeType = (file.type || "").toLowerCase();
    const originalName = file.name || "upload";
    const extMatch = originalName.match(/\.([a-zA-Z0-9]+)$/);
    const extension = extMatch ? extMatch[1].toLowerCase() : "";

    const SAFE_IMAGE_EXTS = new Set(["jpg", "jpeg", "png", "webp", "gif"]);
    const SAFE_VIDEO_EXTS = new Set(["mp4", "webm", "mov"]);
    const SAFE_DOC_EXTS = new Set(["pdf", "doc", "docx", "xls", "xlsx", "csv", "txt"]);

    // Strict extension verification: prevent executable/script uploads (.php, .exe, .html, .svg, .js, .sh)
    const isImage = SAFE_IMAGE_EXTS.has(extension) && (mimeType.startsWith("image/") || mimeType === "application/octet-stream");
    const isVideo = SAFE_VIDEO_EXTS.has(extension) && (mimeType.startsWith("video/") || mimeType === "application/octet-stream");
    const isDoc = SAFE_DOC_EXTS.has(extension);

    if (!isImage && !isVideo && !isDoc) {
      return NextResponse.json(
        { error: "File format not supported. Only verified JPG, PNG, WEBP, GIF, MP4, WEBM, PDF, Word, Excel, CSV, or TXT files are allowed." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Destination directory: public/uploads/{category}
    const safeCategory = ["images", "videos", "documents", "celebrations", "proofs"].includes(category)
      ? category
      : "general";

    const uploadDir = join(process.cwd(), "public", "uploads", safeCategory);
    await mkdir(uploadDir, { recursive: true });

    // Sanitize filename
    const cleanBaseName = originalName
      .replace(/\.[^/.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "_")
      .slice(0, 40);

    const uniqueTag = `${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const finalFilename = `${cleanBaseName}_${uniqueTag}.${extension}`;
    const filePath = join(uploadDir, finalFilename);

    let publicUrl = `/uploads/${safeCategory}/${finalFilename}`;
    try {
      await mkdir(uploadDir, { recursive: true });
      await writeFile(filePath, buffer);
    } catch (fsErr) {
      // In serverless environments like Vercel (read-only filesystem), encode image directly as base64 Data URI
      if (isImage || file.size < 6 * 1024 * 1024) {
        publicUrl = `data:${mimeType};base64,${buffer.toString("base64")}`;
      } else {
        throw fsErr;
      }
    }

    return NextResponse.json({
      ok: true,
      url: publicUrl,
      filename: finalFilename,
      originalName,
      size: file.size,
      mimeType,
      category: safeCategory,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to process and save uploaded file." },
      { status: 500 }
    );
  }
}
