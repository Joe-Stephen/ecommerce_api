import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db";

class Test extends Model {
  public id!: number;
  public username!: string;
  public hobby!: string;

  // timestamps!
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Test.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING(128),
      allowNull: false,
    },
    hobby: {
      type: DataTypes.STRING(128),
    },
  },
  {
    tableName: "tests",
    sequelize,
  }
);

Test.beforeCreate((test, options) => {
  test.hobby = "Football";
});

export default Test;
