import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";

const siteUrl = SITE_URL;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api", "/auth", "/carrito", "/checkout", "/login", "/pedidos", "/perfil", "/registro"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
