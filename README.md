# Gideon

Sistema de gestion empresarial + IA + automatizacion, dockerizado.

Cubre CRM, inventario/compras, ventas y facturacion, con un asistente de IA
(Claude) que responde preguntas sobre los datos reales del negocio, analitica
predictiva, extraccion de documentos, y automatizaciones programadas
(alertas de stock bajo, facturas vencidas, reporte diario).

## Stack

| Capa | Tecnologia |
|---|---|
| Backend | NestJS + TypeScript + PostgreSQL (Prisma) |
| IA | Claude (Anthropic SDK) - chat con tool-use, forecast, extraccion de documentos |
| Automatizacion | BullMQ + Redis, programada con cron |
| Frontend | React + Vite + TypeScript + Tailwind + React Query + Recharts |
| Infraestructura | Docker Compose (postgres, redis, backend, frontend/nginx) |

## Requisitos

- Docker y Docker Compose

No hace falta Node.js instalado en el host: todo se construye dentro de los
contenedores.

## Puesta en marcha

```bash
cp .env.example .env
# edita .env y define tu ANTHROPIC_API_KEY si quieres usar las funciones de IA

docker compose up -d --build
```

Servicios expuestos:

- Frontend: http://localhost:8080
- API: http://localhost:3000/api
- Postgres: localhost:5432
- Redis: localhost:6379

### Datos de ejemplo (seed)

Con los contenedores arriba, carga datos de demo (usuario admin, productos,
cliente, proveedor, oportunidad):

```bash
docker compose exec backend npx prisma db seed
```

Usuario admin creado por el seed: `admin@gideon.local` / `Admin123!`

### Variables de entorno relevantes (`.env`)

| Variable | Descripcion |
|---|---|
| `DATABASE_URL` | Cadena de conexion a Postgres (ya configurada para docker-compose) |
| `JWT_SECRET` / `JWT_EXPIRES_IN` | Firma y expiracion de los tokens de sesion |
| `ANTHROPIC_API_KEY` | Clave de la API de Anthropic. Sin ella, los endpoints de IA responden 503 pero el resto del sistema funciona normal |
| `ANTHROPIC_MODEL` | Modelo de Claude a usar (por defecto `claude-sonnet-5`) |
| `CORS_ORIGIN` | Origen permitido para CORS del backend |
| `VITE_API_URL` | URL de la API que usa el frontend (en Docker se sirve via proxy de nginx en `/api`) |

## Estructura del repositorio

```
gideon/
├── docker-compose.yml
├── backend/                  # API NestJS
│   ├── prisma/
│   │   ├── schema.prisma     # Modelo de datos completo
│   │   ├── migrations/
│   │   └── seed.ts
│   └── src/
│       ├── auth/             # JWT, guards, roles
│       ├── users/
│       ├── crm/              # Clientes y oportunidades (pipeline)
│       ├── inventory/        # Productos, proveedores, ordenes de compra
│       ├── sales/            # Ordenes de venta
│       ├── billing/          # Facturas y pagos
│       ├── dashboard/        # KPIs agregados
│       ├── ai/               # Chat, analitica predictiva, documentos
│       └── automation/       # Colas BullMQ + cron + historial
└── frontend/                 # SPA React + Vite
    └── src/
        ├── pages/            # Una carpeta por modulo (crm, inventory, sales, billing, ai, automation)
        ├── components/       # UI reutilizable (Button, Card, Table, Modal...) y layout
        ├── context/          # Auth (JWT en localStorage)
        └── lib/              # Cliente API (axios) y tipos compartidos
```

## Modulos funcionales

- **CRM**: clientes y pipeline de oportunidades (nuevo → calificado → propuesta → negociacion → ganado/perdido).
- **Inventario**: productos con umbral de reorden, proveedores, ordenes de compra con recepcion parcial/total que actualiza stock automaticamente.
- **Ventas**: ordenes con flujo borrador → confirmada (descuenta stock) → entregada → factura.
- **Facturacion**: facturas ligadas o no a una orden de venta, pagos parciales/totales, deteccion de vencidas.
- **IA**:
  - Chat conversacional con acceso (tool-use) a clientes, productos, stock bajo, facturas vencidas y pipeline.
  - Forecast de ventas por regresion lineal + insight narrativo generado por Claude.
  - Extraccion y resumen de documentos (facturas, recibos) a JSON estructurado.
- **Automatizacion**: revision de stock bajo (cada hora), facturas vencidas (diario) y reporte diario con IA, con historial de ejecuciones y disparo manual desde la UI (roles ADMIN/MANAGER).

## Desarrollo local (sin Docker para el codigo, con Docker solo para DB/Redis)

Si prefieres correr el backend o frontend fuera de Docker durante desarrollo:

```bash
docker compose up -d postgres redis

cd backend
npm install
npx prisma migrate deploy
npm run start:dev   # http://localhost:3000/api

cd ../frontend
npm install
npm run dev          # http://localhost:5173
```

Ajusta `VITE_API_URL=http://localhost:3000/api` en `frontend/.env.local` para
este modo (el proxy de `/api` solo existe en el nginx del contenedor).

## Comandos utiles

```bash
docker compose logs -f backend        # logs de la API y del worker de automatizacion
docker compose exec backend npx prisma studio   # explorador visual de la base de datos
docker compose down                   # detener
docker compose down -v                # detener y borrar datos (postgres/redis)
```
