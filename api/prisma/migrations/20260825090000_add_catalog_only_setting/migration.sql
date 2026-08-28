-- Allows the public catalog to remain visible while purchases are disabled.
INSERT INTO "SystemConfig" (
  "key",
  "value",
  "type",
  "category",
  "label",
  "description",
  "isPublic",
  "isReadOnly",
  "sortOrder",
  "updatedAt",
  "createdAt"
)
VALUES (
  'orders.catalog_only',
  'false'::jsonb,
  'boolean',
  'OPERATIONS',
  'Catálogo solo informativo',
  'Muestra productos y precios públicamente, pero deshabilita la compra y las nuevas reservas.',
  true,
  false,
  10,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("key") DO NOTHING;
