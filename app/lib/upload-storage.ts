import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import { join, resolve } from "path";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_MULTIPART_OVERHEAD = 1024 * 1024;
const DEFAULT_LOCAL_UPLOAD_DIR = join(process.cwd(), "public", "uploads");
const DEFAULT_LOCAL_PUBLIC_BASE_URL = "/uploads";
const LOCAL_UPLOAD_FILENAME = /^[a-f0-9-]+\.(png|jpg|gif|webp)$/i;

export type SupportedImage = {
  extension: "png" | "jpg" | "gif" | "webp";
  contentType: "image/png" | "image/jpeg" | "image/gif" | "image/webp";
};

export function maxUploadSize() {
  return MAX_SIZE;
}

export function isUploadContentLengthTooLarge(contentLength: string | null) {
  if (!contentLength) return false;

  const parsed = Number(contentLength);
  return Number.isFinite(parsed) && parsed > MAX_SIZE + MAX_MULTIPART_OVERHEAD;
}

export function detectImageType(buffer: Buffer): SupportedImage | null {
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { extension: "png", contentType: "image/png" };
  }

  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return { extension: "jpg", contentType: "image/jpeg" };
  }

  const signature = buffer.subarray(0, 6).toString("ascii");
  if (signature === "GIF87a" || signature === "GIF89a") {
    return { extension: "gif", contentType: "image/gif" };
  }

  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return { extension: "webp", contentType: "image/webp" };
  }

  return null;
}

function trimSlashes(value: string) {
  return value.replace(/^\/+|\/+$/g, "");
}

export function buildPublicUrl(baseUrl: string, filename: string) {
  const cleanBase = baseUrl.replace(/\/+$/g, "");
  const cleanFilename = trimSlashes(filename);
  return cleanBase ? `${cleanBase}/${cleanFilename}` : `/${cleanFilename}`;
}

function uploadDriver() {
  const driver = (process.env.UPLOAD_STORAGE_DRIVER ?? "local").toLowerCase();
  if (driver !== "local" && driver !== "s3") {
    throw new Error(`Unsupported upload storage driver: ${driver}`);
  }
  return driver;
}

function localUploadDir() {
  return process.env.UPLOAD_DIR
    ? resolve(/* turbopackIgnore: true */ process.cwd(), process.env.UPLOAD_DIR)
    : DEFAULT_LOCAL_UPLOAD_DIR;
}

function s3Client(
  region: string,
  accessKeyId: string,
  secretAccessKey: string,
) {
  return new S3Client({
    region,
    endpoint: process.env.S3_ENDPOINT || undefined,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

async function saveToLocal(buffer: Buffer, filename: string) {
  const uploadDir = localUploadDir();
  const publicBaseUrl =
    process.env.UPLOAD_PUBLIC_BASE_URL ?? DEFAULT_LOCAL_PUBLIC_BASE_URL;

  await mkdir(uploadDir, { recursive: true });
  await writeFile(join(uploadDir, filename), buffer);

  return buildPublicUrl(publicBaseUrl, filename);
}

async function saveToS3(
  buffer: Buffer,
  filename: string,
  imageType: SupportedImage,
) {
  const bucket = requireEnv("S3_BUCKET");
  const region = requireEnv("S3_REGION");
  const accessKeyId = requireEnv("S3_ACCESS_KEY_ID");
  const secretAccessKey = requireEnv("S3_SECRET_ACCESS_KEY");
  const publicBaseUrl = requireEnv("S3_PUBLIC_BASE_URL");
  const prefix = trimSlashes(process.env.S3_UPLOAD_PREFIX ?? "uploads");
  const key = prefix ? `${prefix}/${filename}` : filename;

  await s3Client(region, accessKeyId, secretAccessKey).send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: imageType.contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );

  return buildPublicUrl(publicBaseUrl, key);
}

export async function saveUploadedImage(buffer: Buffer, imageType: SupportedImage) {
  const filename = `${randomUUID()}.${imageType.extension}`;

  if (uploadDriver() === "s3") {
    return saveToS3(buffer, filename, imageType);
  }

  return saveToLocal(buffer, filename);
}

export async function readLocalUploadedImage(filename: string) {
  if (uploadDriver() !== "local" || !LOCAL_UPLOAD_FILENAME.test(filename)) {
    return null;
  }

  try {
    const data = await readFile(join(localUploadDir(), filename));
    const imageType = detectImageType(data);
    if (!imageType) return null;

    return {
      contentType: imageType.contentType,
      data,
    };
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}
