import { DataTypes, Model } from "sequelize";
import db from "../../config/db.js";

class User extends Model {}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    username: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: "Administrator",
    },
    role: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "ADMIN",
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize: db,
    modelName: "User",
    tableName: "users",
    timestamps: true,
    underscored: true,
  }
);

export default User;
