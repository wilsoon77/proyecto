import { DocumentBuilder } from '@nestjs/swagger';

export const SWAGGER_TAGS = [
  { name: 'auth', description: 'Autenticación y sesiones' },
  { name: 'products', description: 'Catálogo, inventario y visibilidad en e-commerce' },
  { name: 'categories', description: 'Categorías del catálogo' },
  { name: 'branches', description: 'Sucursales' },
  { name: 'users', description: 'Usuarios y roles' },
  { name: 'inventory', description: 'Existencias, lotes y caducidades' },
  { name: 'stock-movements', description: 'Movimientos y ajustes de inventario' },
  { name: 'orders', description: 'Pedidos para retiro en sucursal' },
  { name: 'daily-close', description: 'Cierres diarios y conciliación de producto terminado' },
  { name: 'notifications', description: 'Alertas de materia prima baja y caducidad próxima' },
  { name: 'system-config', description: 'Configuración operativa' },
  { name: 'telegram', description: 'Asistente de consulta por Telegram' },
  { name: 'recipes', description: 'Recetas e ingredientes de producción' },
  { name: 'production', description: 'Registro de producción y consumo de recetas' },
  { name: 'raw-materials', description: 'Materias primas y compras' },
  { name: 'storage', description: 'Imágenes de productos' },
  { name: 'health', description: 'Estado de la API' },
  { name: 'Audit', description: 'Auditoría de acciones administrativas' },
] as const;

export function createSwaggerConfig(
  servers: readonly { url: string; description?: string }[] = [],
) {
  const builder = new DocumentBuilder()
    .setTitle('Panaderia Svetlana API')
    .setDescription(
      'API operativa para catálogo, pedidos de retiro, inventario, recetas, producción y alertas de materia prima baja o caducidad próxima en dos sucursales.',
    )
    .setVersion('0.1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' });

  for (const tag of SWAGGER_TAGS) {
    builder.addTag(tag.name, tag.description);
  }

  for (const server of servers) {
    builder.addServer(server.url, server.description);
  }

  return builder.build();
}
