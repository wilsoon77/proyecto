# Proyecto Panadería (Monorepo)

Este repositorio contiene el frontend y backend del proyecto en una sola raíz (monorepo).

## Estructura
- `api/`: API (NestJS + Prisma + Swagger)
- `web/`: Frontend (React/Next.js)
- `documentation/`: Documentación funcional y técnica

## Requisitos
- Node.js 18+ (recomendado 20+)
- NPM (incluido con Node)

## Desarrollo local
- Backend (API):
  ```powershell
  cd api
  npm install
  # Copia .env.example a .env y completa variables
  npm run dev
  ```
  Endpoints útiles:
  - Swagger UI: `http://localhost:4000/docs`
  - Health: `http://localhost:4000/health`
  - Métricas Prometheus: `http://localhost:4000/metrics`

- Frontend (Web):
  ```powershell
  cd web
  npm install
  npm run dev
  ```
  Por defecto: `http://localhost:3000`

## Variables de entorno (API)
Crea un archivo `api/.env` con al menos:
```
DATABASE_URL=postgres://<usuario>:<password>@<host>:<port>/<db>
DIRECT_URL=postgres://<usuario>:<password>@<host>:<port>/<db>  # opcional para prisma migrate
JWT_SECRET=super-secreto
PORT=4000
```

## Scripts útiles (API)
```powershell
# Compilar y ejecutar
npm run build
npm start

# Pruebas e2e
npm test

# Generar OpenAPI (openapi.json) sin conectar a DB
npm run openapi:gen:dist
```

## Paginación y cabeceras
Las rutas de listado devuelven `{ data, meta }` y además cabeceras:
- `X-Total-Count`: total de elementos
- `Link`: enlaces `first`, `last`, `prev`, `next`

## Despliegue (por definir)
Aún por decidir proveedor. Opciones típicas:
- API: Render, Railway, Fly.io (build: `npm run build`, start: `npm start`, health `/health`)
- Web: Vercel o Netlify (raíz de proyecto `web/`)

Cuando se defina el proveedor, este README se actualizará con pasos concretos.

## Notas
- Este monorepo permite trabajar de forma independiente en `api/` y `web` sin interferencias.
- El archivo `.gitignore` en la raíz excluye artefactos de build y dependencias de ambos proyectos.
- Para cualquier cambio, crear rama, commit y PR según convenga.