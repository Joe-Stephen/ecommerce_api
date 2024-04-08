import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db";

class OrderHistory extends Model {
  public id!: number;
  public orderId!: number;
  public status!: string;
  // timestamps!
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

OrderHistory.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    orderId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM,
      values: ["pending", "approved", "shipped", "out for delivery", "delivered", "cancelled"],
      defaultValue:"pending"
    },
  },
  {
    tableName: "orderHistory",
    sequelize,
  }
);

export default OrderHistory;
