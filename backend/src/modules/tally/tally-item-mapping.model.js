import { DataTypes } from "sequelize";
import db from "../../config/db.js";

const TallyItemMapping = db.define(
  "TallyItemMapping",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    tally_item_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    item_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "items",
        key: "id",
      },
    },
  },
  {
    tableName: "tally_item_mappings",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      {
        unique: true,
        fields: ["tally_item_name"],
      },
      {
        fields: ["item_id"],
      },
    ],
  }
);

export default TallyItemMapping;
