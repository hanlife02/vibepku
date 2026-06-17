import type { MetadataRoute } from "next";
import { absoluteUrl, siteOrigin } from "@/app/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/about", "/products", "/products/"],
        disallow: [
          "/admin",
          "/api",
          "/auth",
          "/dashboard",
          "/login",
          "/submit",
        ],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: siteOrigin(),
  };
}
