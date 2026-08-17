import { DataTypes } from "sequelize";
import db from "../../config/db.js";

const GovernmentImportRow = db.define(
  "GovernmentImportRow",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    import_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "government_imports",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    row_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    application_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    imported_status: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    imported_status_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    dealer_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    action: {
      type: DataTypes.STRING(50),
      allowNull: false, // NEW_PROJECT, UPDATE_PROJECT, STATUS_CHANGE, UNCHANGED, DUPLICATE_SOURCE_ROW, ERROR, DEALER_RESOLUTION_REQUIRED
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    matched_project_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "government_projects",
        key: "id",
      },
    },
    matched_dealer_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "dealers",
        key: "id",
      },
    },
    resolution_status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "PENDING", // PENDING, RESOLVED, REJECTED
    },
    raw_data: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    tableName: "government_import_rows",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      {
        fields: ["import_id"],
      },
      {
        fields: ["application_id"],
      },
      {
        fields: ["action"],
      },
      {
        fields: ["resolution_status"],
      },
    ],
  }
);

export default GovernmentImportRow;
