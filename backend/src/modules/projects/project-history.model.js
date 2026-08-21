import { DataTypes } from "sequelize";
import db from "../../config/db.js";

const GovernmentProjectStatusHistory = db.define(
  "GovernmentProjectStatusHistory",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    project_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "government_projects",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    status: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    status_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    source_import_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "government_imports",
        key: "id",
      },
      onDelete: "SET NULL",
    },
    observed_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "government_project_status_history",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false, // History rows are immutable
    indexes: [
      {
        fields: ["project_id"],
      },
      {
        fields: ["project_id", "status_date"],
        name: "idx_gov_proj_status_history_project_date",
      },
      {
        unique: true,
        fields: ["project_id", "status", "status_date", "source_import_id"],
        name: "idx_unique_project_status_history",
      },
    ],
  }
);

export default GovernmentProjectStatusHistory;
