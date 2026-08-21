import { DataTypes } from "sequelize";
import db from "../../config/db.js";

const LoadOrderBatch = db.define(
  "LoadOrderBatch",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    batch_number: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    dispatch_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    total_projects_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    total_govt_quantity: {
      type: DataTypes.DECIMAL(15, 3),
      allowNull: false,
      defaultValue: 0,
    },
    total_actual_quantity: {
      type: DataTypes.DECIMAL(15, 3),
      allowNull: false,
      defaultValue: 0,
    },
    projects_snapshot: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },
    govt_items_snapshot: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },
    actual_items_snapshot: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    is_cancelled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    cancelled_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    cancellation_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "load_order_batches",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      {
        unique: true,
        fields: ["batch_number"],
      },
      {
        fields: ["dispatch_date"],
      },
    ],
  }
);

export default LoadOrderBatch;
