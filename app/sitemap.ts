import type { MetadataRoute } from "next";
import { prisma } from "@/app/lib/db";
import { publishedProductWhere } from "@/app/lib/products";
import { absoluteUrl } from "@/app/lib/site-url";

export const dynamic = "force-dynamic";

const staticRoutes = [
  { path: "/", priority: 1 },
  { path: "/products", priority: 0.9 },
  { path: "/about", priority: 0.5 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const routes: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified: now,
    changeFrequency: "daily",
    priority: route.priority,
  }));

  try {
    const products = await prisma.product.findMany({
      where: publishedProductWhere,
      select: {
        slug: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    return [
      ...routes,
      ...products.map((product) => ({
        url: absoluteUrl(`/products/${product.slug}`),
        lastModified: product.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
    ];
  } catch (error) {
    console.error("[sitemap]", error);
    return routes;
  }
}
