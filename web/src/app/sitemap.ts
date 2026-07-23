import type { MetadataRoute } from "next";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/productos`, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/promociones`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/sucursales`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteUrl}/sobre-nosotros`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${siteUrl}/contacto`, changeFrequency: "monthly", priority: 0.6 },
  ];
}
