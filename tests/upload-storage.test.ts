import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  buildPublicUrl,
  detectImageType,
  isUploadContentLengthTooLarge,
  maxUploadSize,
  readLocalUploadedImage,
  saveUploadedImage,
} from "../app/lib/upload-storage";

const pngBuffer = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00,
]);

test("detectImageType identifies supported image signatures", () => {
  assert.deepEqual(detectImageType(pngBuffer), {
    extension: "png",
    contentType: "image/png",
  });
  assert.deepEqual(detectImageType(Buffer.from([0xff, 0xd8, 0xff])), {
    extension: "jpg",
    contentType: "image/jpeg",
  });
  assert.deepEqual(detectImageType(Buffer.from("GIF89a")), {
    extension: "gif",
    contentType: "image/gif",
  });
  assert.deepEqual(detectImageType(Buffer.from("RIFFxxxxWEBP")), {
    extension: "webp",
    contentType: "image/webp",
  });
  assert.equal(detectImageType(Buffer.from("not an image")), null);
});

test("buildPublicUrl joins relative and absolute public bases", () => {
  assert.equal(buildPublicUrl("/uploads/", "image.png"), "/uploads/image.png");
  assert.equal(
    buildPublicUrl("https://cdn.example.com/assets/", "/uploads/image.png"),
    "https://cdn.example.com/assets/uploads/image.png",
  );
});

test("isUploadContentLengthTooLarge rejects obviously oversized requests", () => {
  assert.equal(isUploadContentLengthTooLarge(null), false);
  assert.equal(isUploadContentLengthTooLarge(String(maxUploadSize())), false);
  assert.equal(isUploadContentLengthTooLarge(String(maxUploadSize() + 1024 * 1024)), false);
  assert.equal(isUploadContentLengthTooLarge(String(maxUploadSize() + 1024 * 1024 + 1)), true);
  assert.equal(isUploadContentLengthTooLarge("not-a-number"), false);
});

test("saveUploadedImage writes to configured local storage", async () => {
  const uploadDir = await mkdtemp(join(tmpdir(), "vibepku-upload-"));
  const previousDriver = process.env.UPLOAD_STORAGE_DRIVER;
  const previousDir = process.env.UPLOAD_DIR;
  const previousBaseUrl = process.env.UPLOAD_PUBLIC_BASE_URL;

  process.env.UPLOAD_STORAGE_DRIVER = "local";
  process.env.UPLOAD_DIR = uploadDir;
  process.env.UPLOAD_PUBLIC_BASE_URL = "/assets";

  try {
    const imageType = detectImageType(pngBuffer);
    assert.ok(imageType);

    const url = await saveUploadedImage(pngBuffer, imageType);
    assert.match(url, /^\/assets\/[a-f0-9-]+\.png$/);

    const filename = url.split("/").at(-1);
    assert.ok(filename);
    assert.deepEqual(await readFile(join(uploadDir, filename)), pngBuffer);

    const servedImage = await readLocalUploadedImage(filename);
    assert.ok(servedImage);
    assert.equal(servedImage.contentType, "image/png");
    assert.deepEqual(servedImage.data, pngBuffer);
    assert.equal(await readLocalUploadedImage("../secret.png"), null);
  } finally {
    if (previousDriver === undefined) {
      delete process.env.UPLOAD_STORAGE_DRIVER;
    } else {
      process.env.UPLOAD_STORAGE_DRIVER = previousDriver;
    }
    if (previousDir === undefined) {
      delete process.env.UPLOAD_DIR;
    } else {
      process.env.UPLOAD_DIR = previousDir;
    }
    if (previousBaseUrl === undefined) {
      delete process.env.UPLOAD_PUBLIC_BASE_URL;
    } else {
      process.env.UPLOAD_PUBLIC_BASE_URL = previousBaseUrl;
    }
    await rm(uploadDir, { force: true, recursive: true });
  }
});
