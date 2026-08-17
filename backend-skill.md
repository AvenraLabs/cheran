---
name: backend-architecture-and-database-skill
description: Universal production-grade backend architecture, PostgreSQL + Sequelize database design, Express API patterns, migrations, WebSockets, and enterprise best practices.
---

# Universal Backend Architecture, Database & API Development Skill

This skill documents a battle-tested, production-grade backend architecture using **Node.js, Express, PostgreSQL, and Sequelize ORM**. It serves as a generic blueprint for bootstrapping scalable, secure, and maintainable enterprise APIs and multi-tenant SaaS backends.

---

## 1. Core Tech Stack & Dependencies

### 1.1 Core Runtime & Framework
- **Runtime**: Node.js (v20+ LTS / v22+ LTS) with native ESModules (`"type": "module"`)
- **API Framework**: Express (`express@^5.1.0` or `^4.21.0`)
- **Database & ORM**: PostgreSQL (`pg`) + Sequelize v6 (`sequelize@^6.37.7`)
- **Real-Time Engine**: Socket.io (`socket.io@^4.8.3`)
- **Schema Validation**: Zod (`zod@^4.3.4` or `^3.23.8`)
- **Authentication & Security**: JSON Web Token (`jsonwebtoken`), Helmet (`helmet`), CORS (`cors`), Rate Limiting (`express-rate-limit`)
- **Logging & Utilities**: Morgan (`morgan`), Axios (`axios`), Multer (`multer`), Dotenv (`dotenv`)

### 1.2 Generic Backend `package.json`

```json
{
  "name": "enterprise-backend",
  "version": "1.0.0",
  "main": "server.js",
  "type": "module",
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js",
    "migrate": "sequelize-cli --config config/config.cjs db:migrate",
    "migrate:undo": "sequelize-cli --config config/config.cjs db:migrate:undo"
  },
  "dependencies": {
    "axios": "^1.18.1",
    "cors": "^2.8.5",
    "dotenv": "^17.2.3",
    "express": "^5.1.0",
    "express-rate-limit": "^8.2.1",
    "helmet": "^8.1.0",
    "jsonwebtoken": "^9.0.2",
    "multer": "^2.2.0",
    "pg": "^8.16.3",
    "pg-hstore": "^2.3.4",
    "sequelize": "^6.37.7",
    "sequelize-cli": "^6.6.3",
    "socket.io": "^4.8.3",
    "zod": "^4.3.4"
  },
  "devDependencies": {
    "morgan": "^1.10.1",
    "nodemon": "^3.1.10"
  }
}
```

---

## 2. Directory Architecture & Modular Structure

We follow a **Feature-Based Modular Architecture** where each domain module encapsulates its own model, validation schema, business logic service, HTTP controller, and route definitions.

```
backend/
├── migrations/                     # Timestamped .cjs migration files
├── config/
│   └── config.cjs                  # Sequelize CLI config for migrations
├── src/
│   ├── config/
│   │   ├── db.js                   # Sequelize connection pool & statement timeouts
│   │   └── runMigrations.js        # Automated boot migration runner
│   ├── models/
│   │   └── initModels.js           # Centralized Sequelize model associations registry
│   ├── shared/
│   │   ├── appError.js             # Custom operational AppError class
│   │   ├── asyncHandler.js         # Async controller wrapper
│   │   ├── errorHandler.js         # Global Express error handler middleware
│   │   ├── logger.js               # Structured logger
│   │   └── middlewares/
│   │       ├── auth.js             # JWT identity resolver & authentication
│   │       ├── role.js             # Role-Based Access Control (RBAC)
│   │       ├── validate.js         # Zod request validation middleware
│   │       └── rateLimit.js        # Endpoint rate limiter
│   ├── modules/
│   │   ├── auth/                   # Authentication, login, token rotation
│   │   ├── users/                  # User accounts & credentials
│   │   ├── tenants/                # Tenant / Organization management
│   │   ├── records/                # Example core business entity module
│   │   └── audit/                  # Activity & security audit logs
│   └── socket/
│       ├── socketManager.js        # Socket.io gateway initialization
│       └── events/                 # Real-time event handlers & room listeners
└── server.js                       # HTTP server entry point & middleware pipeline
```

### Module File Structure
For any module `<feature>`:
1. `<feature>.model.js` — Sequelize Model definition with explicit types, constraints, and indexes.
2. `<feature>.schema.js` — Zod request validation schemas (`body`, `query`, `params`).
3. `<feature>.service.js` — Pure business logic, database queries, and transactions.
4. `<feature>.controller.js` — HTTP controllers wrapping service calls with standard responses.
5. `<feature>.routes.js` — Express router mounting middlewares & controller handlers.
6. `<feature>.cron.js` *(optional)* — Scheduled background cron jobs for the feature.

---

## 3. Database Architecture & Sequelize Best Practices

### 3.1 Database Connection & Pool Tuning (`src/config/db.js`)

```javascript
import { config } from "dotenv";
import { Sequelize } from "sequelize";
config();

const dialectOptions = {
  // Prevent runaway queries from holding connection locks indefinitely (15s)
  statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT || "15000", 10),
  // Auto-kill idle transactions held open longer than 10 seconds
  idle_in_transaction_session_timeout: parseInt(process.env.DB_IDLE_TX_TIMEOUT || "10000", 10),
  keepAlive: true,
};

if (process.env.DB_SSL === "true" || process.env.NODE_ENV === "production") {
  dialectOptions.ssl = {
    require: true,
    rejectUnauthorized: false,
  };
}

const db = new Sequelize(process.env.DB_URI, {
  dialect: "postgres",
  logging: process.env.NODE_ENV === "development" ? console.log : false,
  pool: {
    max: parseInt(process.env.DB_POOL_MAX) || 30,
    min: parseInt(process.env.DB_POOL_MIN) || 2,
    acquire: parseInt(process.env.DB_POOL_ACQUIRE) || 30000,
    idle: parseInt(process.env.DB_POOL_IDLE) || 10000,
    evict: 1000, // Evict stale connections every second
  },
  timezone: "+00:00",
  dialectOptions,
});

export default db;
```

---

### 3.2 Standard Model Definition Pattern

Always define models with explicit field types, constraints, table names, and timestamps:

```javascript
// src/modules/records/record.model.js
import { DataTypes } from "sequelize";
import db from "../../config/db.js";

const Record = db.define(
  "Record",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    tenant_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "tenants", key: "id" },
      onDelete: "CASCADE",
    },
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: { model: "users", key: "id" },
      onDelete: "SET NULL",
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("ACTIVE", "INACTIVE", "ARCHIVED"),
      defaultValue: "ACTIVE",
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
  },
  {
    tableName: "records",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      { fields: ["tenant_id"] },
      { unique: true, fields: ["tenant_id", "code"] },
      { fields: ["tenant_id", "status"] },
    ],
  }
);

export default Record;
```

---

### 3.3 Centralized Model Associations Registry (`src/models/initModels.js`)

All model associations MUST be registered in a single central file to avoid circular dependency bugs:

```javascript
// src/models/initModels.js
import Tenant from "../modules/tenants/tenant.model.js";
import User from "../modules/users/user.model.js";
import Record from "../modules/records/record.model.js";

// Tenant Relationships
Tenant.hasMany(User, { foreignKey: "tenant_id", onDelete: "CASCADE" });
User.belongsTo(Tenant, { foreignKey: "tenant_id" });

Tenant.hasMany(Record, { foreignKey: "tenant_id", onDelete: "CASCADE" });
Record.belongsTo(Tenant, { foreignKey: "tenant_id" });

// User Relationships
User.hasMany(Record, { foreignKey: "user_id", onDelete: "SET NULL" });
Record.belongsTo(User, { foreignKey: "user_id" });

export { Tenant, User, Record };
```

---

## 4. Multi-Tenancy & Query Scoping Architecture

### 🚨 Strict Multi-Tenant Enforcement Rules:
1. **Scope Every Query**: In a multi-tenant system, every query on tenant-owned tables MUST explicitly filter by `tenant_id: req.user.tenant_id`.
2. **Never Trust Client Tenant Input**: Always extract `tenant_id` from the verified JWT / session identity (`req.user.tenant_id`), never from raw request body or query params.
3. **Compound Unique Indexes**: Unique constraints must always include `tenant_id` (e.g. `[tenant_id, code]` or `[tenant_id, email]`).

### 4.1 Safe Multi-Tenant Service Query Example

```javascript
// src/modules/records/record.service.js
import { Op } from "sequelize";
import Record from "./record.model.js";
import User from "../users/user.model.js";

export async function listRecords({ tenant_id, search, status, limit = 20, offset = 0 }) {
  const where = { tenant_id };

  if (status) where.status = status;
  if (search) {
    where[Op.or] = [
      { title: { [Op.iLike]: `%${search}%` } },
      { code: { [Op.iLike]: `%${search}%` } },
    ];
  }

  const { rows, count } = await Record.findAndCountAll({
    where,
    include: [
      { model: User, attributes: ["id", "name", "email"] },
    ],
    attributes: ["id", "title", "code", "status", "created_at"],
    order: [["id", "DESC"]],
    limit,
    offset,
  });

  return { records: rows, total: count };
}
```

---

## 5. Database Transactions & Performance Rules

### 5.1 Multi-Write Transactions
Always use database transactions whenever performing multiple insertions, updates, or deletes across related tables:

```javascript
import db from "../../config/db.js";

export async function createRecordWithAudit({ tenant_id, user_id, recordData }) {
  const transaction = await db.transaction();
  try {
    // 1. Create main record
    const record = await Record.create(
      { ...recordData, tenant_id, user_id },
      { transaction }
    );

    // 2. Create audit log entry
    await AuditLog.create(
      {
        tenant_id,
        user_id,
        action: "RECORD_CREATED",
        entity_id: record.id,
      },
      { transaction }
    );

    await transaction.commit();
    return record;
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}
```

### 5.2 N+1 Query Prevention
- **Always Use Eager Loading**: Use `include: [...]` instead of running separate queries inside loops or `map()` calls.
- **Select Explicit Attributes**: Always use `attributes: ["id", "title", ...]` to avoid fetching large unused JSON or text columns.
- **Paginate Datasets**: Enforce `limit` and `offset` on all listing endpoints.

---

## 6. Database Migrations Strategy

### 🚨 Strict Migration Guidelines:
1. **NO Raw DDL in Server Boot**: NEVER write inline `ALTER TABLE` or `CREATE TABLE` queries inside `server.js` or controllers.
2. **Timestamped Migration Files**: All schema mutations, table creations, alterations, or indexes MUST be placed in `backend/migrations/YYYYMMDDHHMMSS-<description>.cjs`.
3. **Automated Boot Execution**: Check and run pending migrations automatically on server boot via a migration runner.

### 6.1 Generic Migration Template (`backend/migrations/20260101000000-create-records-table.cjs`)

```javascript
"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("records", {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      tenant_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "tenants", key: "id" },
        onDelete: "CASCADE",
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      code: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      status: {
        type: Sequelize.STRING(20),
        defaultValue: "ACTIVE",
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
    });

    await queryInterface.addIndex("records", ["tenant_id", "code"], {
      unique: true,
      name: "idx_records_tenant_code",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("records");
  },
};
```

---

## 7. Authentication & Token Lifecycle

### 7.1 Dual-Token Architecture
1. **Access Token (`JWT_EXPIRES_IN=15m`)**:
   - Short-lived stateless token containing minimal claims: `{ id, role, tenant_id }`.
2. **Refresh Token (`REFRESH_TOKEN_EXPIRES_IN=30d`)**:
   - Long-lived token stored in the database (`refresh_tokens` table) with device information (`user_agent`, `ip`).
   - Rotated on every refresh call and revoked immediately upon logout or password changes.

### 7.2 Authentication Middleware (`src/shared/middlewares/auth.js`)

```javascript
import jwt from "jsonwebtoken";
import User from "../../modules/users/user.model.js";
import AppError from "../appError.js";

export async function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("Unauthorized: Missing or invalid token", 401);
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findByPk(decoded.id);
    if (!user || !user.is_active) {
      throw new AppError("Unauthorized: User not found or inactive", 401);
    }

    req.user = {
      id: user.id,
      role: user.role,
      tenant_id: user.tenant_id,
    };

    next();
  } catch (err) {
    next(err);
  }
}
```

---

## 8. Request Validation & Unified Error Handling

### 8.1 Zod Request Validation Middleware (`src/shared/middlewares/validate.js`)

```javascript
import AppError from "../appError.js";

export const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    if (parsed.body) req.body = parsed.body;
    if (parsed.query) req.query = parsed.query;
    if (parsed.params) req.params = parsed.params;
    next();
  } catch (err) {
    const errorDetails = err.errors?.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
    next(new AppError(`Validation failed: ${errorDetails}`, 400));
  }
};
```

### 8.2 Operational Error Class (`src/shared/appError.js`)

```javascript
export default class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
```

### 8.3 Centralized Error Handler Middleware (`src/shared/errorHandler.js`)

```javascript
export default function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // JWT Errors -> 401
  if (err?.name === "TokenExpiredError" || err?.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Session expired. Please log in again.";
  } 
  // Unique Constraint Errors -> 400
  else if (err?.name === "SequelizeUniqueConstraintError") {
    statusCode = 400;
    const field = err?.errors?.[0]?.path;
    message = field ? `${field} already in use` : "Duplicate record error";
  } 
  // Database Timeout Errors -> 503
  else if (err?.name === "TimeoutError" || err?.name === "SequelizeConnectionAcquireTimeoutError") {
    statusCode = 503;
    message = "Database is currently busy. Please retry shortly.";
  }

  if (!err.isOperational && statusCode >= 500) {
    console.error("[CRITICAL UNHANDLED ERROR]", err);
  }

  res.status(statusCode).json({
    status: err.status || "error",
    message,
  });
}
```

---

## 9. Standard Routes, Controller & Service Pattern

### 9.1 Routes (`record.routes.js`)

```javascript
import { Router } from "express";
import { protect } from "../../shared/middlewares/auth.js";
import { allowRoles } from "../../shared/middlewares/role.js";
import { validate } from "../../shared/middlewares/validate.js";
import { createRecordSchema, listRecordSchema } from "./record.schema.js";
import * as recordController from "./record.controller.js";

const router = Router();

router.use(protect);

router
  .route("/")
  .get(allowRoles("admin", "manager"), validate(listRecordSchema), recordController.listRecords)
  .post(allowRoles("admin"), validate(createRecordSchema), recordController.createRecord);

export default router;
```

### 9.2 Controller (`record.controller.js`)

```javascript
import { asyncHandler } from "../../shared/asyncHandler.js";
import * as recordService from "./record.service.js";

export const listRecords = asyncHandler(async (req, res) => {
  const result = await recordService.listRecords({
    tenant_id: req.user.tenant_id,
    ...req.query,
  });

  res.status(200).json({
    status: "success",
    data: result,
  });
});

export const createRecord = asyncHandler(async (req, res) => {
  const record = await recordService.createRecord({
    tenant_id: req.user.tenant_id,
    user_id: req.user.id,
    ...req.body,
  });

  res.status(201).json({
    status: "success",
    message: "Record created successfully",
    data: record,
  });
});
```

---

## 10. Real-Time WebSockets (Socket.io) Architecture

### 10.1 Tenant-Scoped Room Isolation
Always isolate Socket.io broadcasts by tenant and entity rooms to prevent data leakage:
- Tenant broadcast room: `tenant_${tenant_id}`
- User notification room: `user_${user_id}`
- Entity channel room: `entity_${entity_id}`

### 10.2 Socket Initialization Pattern

```javascript
// src/socket/socketManager.js
import { Server } from "socket.io";
import jwt from "jsonwebtoken";

export function initSocketGateway(httpServer, allowedOrigins) {
  const io = new Server(httpServer, {
    path: "/api/socket.io",
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
  });

  // Socket Auth Middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Authentication token required"));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error("Invalid authentication token"));
    }
  });

  io.on("connection", (socket) => {
    // Automatically join tenant room
    socket.join(`tenant_${socket.user.tenant_id}`);
    socket.join(`user_${socket.user.id}`);

    socket.on("disconnect", () => {
      // Cleanup
    });
  });

  return io;
}
```

---

## 11. Security & Production Quality Checklist

Before finalizing any backend implementation, verify:
- [ ] **Multi-Tenancy**: Every query on tenant-scoped tables includes `where: { tenant_id: req.user.tenant_id }`.
- [ ] **RBAC Protection**: Endpoints are guarded by `protect` and `allowRoles(...)`.
- [ ] **Data Integrity**: Multi-write database operations are wrapped inside transactions (`await db.transaction()`).
- [ ] **Validation**: All incoming request bodies, queries, and params are validated using Zod.
- [ ] **Foreign Keys & Cascades**: Foreign keys have explicit `onDelete` rules (`CASCADE` / `SET NULL`).
- [ ] **Sensitive Data**: Passwords, secrets, and sensitive tokens are omitted from query attributes and responses.
- [ ] **Migrations**: All schema changes are tracked in timestamped files in `backend/migrations/`.
- [ ] **N+1 Prevention**: Association queries use eager loading (`include`) with explicit `attributes`.
