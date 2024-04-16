import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db";
import bcrypt from "bcrypt";

class Test extends Model {
  public id!: number;
  public username!: string;
  public password!: string;
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
    password: {
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

Test.afterCreate(async (test, options) => {
  try {
    const password=test.password;
    //hashing password
    await bcrypt
      .genSalt(10)
      .then(async (salt) => {
        return bcrypt.hash(password, salt);
      })
      .then(async (hash: string) => {
        const hashedPassword = hash;
        test.password = hashedPassword;
      })
      .catch((error) => {
        console.log("Error in test model (bcrypt) : ", error);
      });
  } catch (error) {
    console.log("Error in test model : ", error);
  }
});

export default Test;
