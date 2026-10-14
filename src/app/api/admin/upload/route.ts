import { NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import { join, resolve, sep } from "node:path";
import { requireAdminApi } from "@/lib/admin-auth";
import { clean, clientIp } from "@/lib/server-utils";
import { writeAudit } from "@/lib/audit";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB max file size

/**
 * Validates magic numbers (file signatures) to prevent disguised executable or script uploads.
 */
function validateMagicBytes(buffer: Buffer, ext: string): boolean {
  if (buffer.length < 4) return false;

  // JPEG: FF D8 FF
  if (ext === "jpg" || ext === "jpeg") {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (ext === "png") {
    return (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    );
  }
  // GIF: 47 49 46 38
  if (ext === "gif") {
    return (
      buffer[0] === 0x47 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x38
    );
  }
  // WEBP: RIFF....WEBP
  if (ext === "webp") {
    return (
      buffer.toString("ascii", 0, 4) === "RIFF" &&
      buffer.toString("ascii", 8, 12) === "WEBP"
    );
  }
  // PDF: %PDF
  if (ext === "pdf") {
    return buffer.toString("ascii", 0, 4) === "%PDF";
  }

  // Documents/Text formats (TXT, CSV, DOCX, XLSX, MP4, WEBM)
  return true;
}

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

    // Magic byte signature verification
    if (!validateMagicBytes(buffer, extension)) {
      return NextResponse.json(
        { error: "File content does not match the declared file extension. Upload rejected for security reasons." },
        { status: 400 }
      );
    }

    // Destination directory: public/uploads/{category}
    const safeCategory = ["images", "videos", "documents", "celebrations", "proofs"].includes(category)
      ? category
      : "general";

    const baseUploadDir = join(process.cwd(), "public", "uploads");
    const uploadDir = join(baseUploadDir, safeCategory);

    // Sanitize filename against path traversal
    const cleanBaseName = originalName
      .replace(/\.[^/.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "_")
      .slice(0, 40);

    const uniqueTag = `${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const finalFilename = `${cleanBaseName}_${uniqueTag}.${extension}`;
    const filePath = join(uploadDir, finalFilename);

    // Prevent Path Traversal with strict directory boundary
    const resolvedBase = resolve(baseUploadDir);
    const safeResolvedBase = resolvedBase.endsWith(sep) ? resolvedBase : resolvedBase + sep;
    const resolvedTarget = resolve(filePath);
    if (!resolvedTarget.startsWith(safeResolvedBase)) {
      return NextResponse.json({ error: "Invalid file path traversal detected." }, { status: 400 });
    }

    let publicUrl = `/uploads/${safeCategory}/${finalFilename}`;
    try {
      await mkdir(uploadDir, { recursive: true });
      await writeFile(filePath, buffer);
    } catch {
      // In serverless environments like Vercel (read-only filesystem), encode image directly as base64 Data URI
      if (isImage || file.size < 10 * 1024 * 1024) {
        publicUrl = `data:${mimeType};base64,${buffer.toString("base64")}`;
      } else {
        throw new Error("File could not be saved to disk on serverless platform.");
      }
    }

    await writeAudit({
      actorAdminUserId: session.user.id ?? null,
      action: "upload.file",
      entity: "media",
      entityId: finalFilename,
      afterState: { filename: finalFilename, size: file.size, mimeType, category: safeCategory },
      ipAddress: clientIp(req),
    });

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
