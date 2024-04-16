import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db";

class User extends Model {
  public id!: number;
  public username!: string;
  public hobby!: string;
  public email!: string;
  public password!: string;
  public timeZone!: string;
  public isBlocked!: boolean;
  public isAdmin!: boolean;

  // timestamps!
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

User.init(
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
    hobby:{
      type: DataTypes.STRING(128),
    },
    email: {
      type: DataTypes.STRING(128),
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING(128),
      allowNull: false,
    },
    timeZone: {
      type: DataTypes.STRING(128),
      defaultValue: "Asia/Kolkata"
    },
    isBlocked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isAdmin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    }
  },
  {
    tableName: "users",
    sequelize,
  }
);

User.beforeCreate((user, options)=>{
  user.hobby="Football"
})

export default User;
