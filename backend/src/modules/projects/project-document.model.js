import { DataTypes } from "sequelize";
import db from "../../config/db.js";

const GovernmentProjectDocument = db.define(
  "GovernmentProjectDocument",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    project_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    document_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    document_type: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    file_path: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    file_size: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    mime_type: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "government_project_documents",
    timestamps: true,
    createdAt: "uploaded_at",
    updatedAt: false,
    indexes: [{ fields: ["project_id"] }],
  }
);

export default GovernmentProjectDocument;
