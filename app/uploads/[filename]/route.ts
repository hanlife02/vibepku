import { readLocalUploadedImage } from "@/app/lib/upload-storage";

export const runtime = "nodejs";

type UploadRouteContext = {
  params: Promise<{ filename: string }>;
};

export async function GET(_request: Request, context: UploadRouteContext) {
  const { filename } = await context.params;
  const image = await readLocalUploadedImage(filename);

  if (!image) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(image.data, {
    headers: {
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Type": image.contentType,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
