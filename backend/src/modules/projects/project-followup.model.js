import { DataTypes } from "sequelize";
import db from "../../config/db.js";

const GovernmentProjectFollowup = db.define(
  "GovernmentProjectFollowup",
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
    followup_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    next_action_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: "OPEN",
    },
    created_by: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
  },
  {
    tableName: "government_project_followups",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      { fields: ["project_id"] },
      { fields: ["followup_date"] },
    ],
  }
);

export default GovernmentProjectFollowup;
