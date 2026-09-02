import type { MetadataRoute } from "next";
import { getPublicCatalog } from "@/lib/catalog/public-api";

import { SITE_URL } from "@/lib/constants";

const siteUrl = SITE_URL;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/productos`, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/sucursales`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteUrl}/sobre-nosotros`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${siteUrl}/contacto`, changeFrequency: "monthly", priority: 0.6 },
  ];

  // Include every public product, not just the first static route set.
  try {
    const firstPage = await getPublicCatalog({ page: 1, pageSize: 100 });
    const pages = [firstPage, ...await Promise.all(
      Array.from({ length: Math.max(0, firstPage.meta.pageCount - 1) }, (_, index) =>
        getPublicCatalog({ page: index + 2, pageSize: 100 }),
      ),
    )];

    for (const page of pages) {
      for (const product of page.data) {
        const lastModified = product.updatedAt ? new Date(product.updatedAt) : undefined;
        routes.push({
          url: `${siteUrl}/productos/${product.slug}`,
          lastModified: lastModified && !Number.isNaN(lastModified.getTime()) ? lastModified : undefined,
          changeFrequency: "daily",
          priority: 0.8,
        });
      }
    }
  } catch {
    // The fixed public routes remain available if the catalog API is offline.
  }

  return routes;
}
