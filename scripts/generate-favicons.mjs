import fs from "fs";
import path from "path";
import sharp from "sharp";

async function main() {
  const sourceImage = path.resolve("public/logo/janaseva-logo.png");
  if (!fs.existsSync(sourceImage)) {
    throw new Error("Source logo not found at " + sourceImage);
  }

  console.log("Generating favicons from:", sourceImage);

  // Sizes for web, PWA, Apple and Google Search
  const png16 = await sharp(sourceImage).resize(16, 16).png().toBuffer();
  const png32 = await sharp(sourceImage).resize(32, 32).png().toBuffer();
  const png48 = await sharp(sourceImage).resize(48, 48).png().toBuffer();
  const png96 = await sharp(sourceImage).resize(96, 96).png().toBuffer();
  const png180 = await sharp(sourceImage).resize(180, 180).png().toBuffer();
  const png192 = await sharp(sourceImage).resize(192, 192).png().toBuffer();
  const png512 = await sharp(sourceImage).resize(512, 512).png().toBuffer();

  // Save standalone PNGs to public/
  fs.writeFileSync("public/favicon-16x16.png", png16);
  fs.writeFileSync("public/favicon-32x32.png", png32);
  fs.writeFileSync("public/favicon-48x48.png", png48);
  fs.writeFileSync("public/favicon-96x96.png", png96);
  fs.writeFileSync("public/apple-touch-icon.png", png180);
  fs.writeFileSync("public/icon.png", png192);
  fs.writeFileSync("public/icon-512x512.png", png512);

  // Also save to src/app/
  fs.writeFileSync("src/app/icon.png", png192);
  fs.writeFileSync("src/app/apple-icon.png", png180);

  // Build standard multi-resolution ICO file (16, 32, 48)
  // An ICO consists of an ICONDIR header (6 bytes),
  // followed by 3 ICONDIRENTRY structures (16 bytes each = 48 bytes),
  // followed by the image data for each image.
  const images = [
    { width: 16, height: 16, buffer: png16 },
    { width: 32, height: 32, buffer: png32 },
    { width: 48, height: 48, buffer: png48 },
  ];

  const headerSize = 6;
  const entrySize = 16;
  const totalEntries = images.length;
  let offset = headerSize + totalEntries * entrySize;

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // 1 = ICO
  header.writeUInt16LE(totalEntries, 4); // Number of images

  const entries = [];
  for (const img of images) {
    const entry = Buffer.alloc(entrySize);
    entry.writeUInt8(img.width === 256 ? 0 : img.width, 0);
    entry.writeUInt8(img.height === 256 ? 0 : img.height, 1);
    entry.writeUInt8(0, 2); // Palette
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(img.buffer.length, 8); // Image byte size
    entry.writeUInt32LE(offset, 12); // Image data offset
    entries.push(entry);
    offset += img.buffer.length;
  }

  const icoBuffer = Buffer.concat([
    header,
    ...entries,
    ...images.map((img) => img.buffer),
  ]);

  fs.writeFileSync("public/favicon.ico", icoBuffer);
  fs.writeFileSync("src/app/favicon.ico", icoBuffer);

  console.log("Successfully generated all favicons and favicon.ico! ICO size:", icoBuffer.length);
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
