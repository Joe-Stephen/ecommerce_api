"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const db_1 = __importDefault(require("../config/db"));
class Test extends sequelize_1.Model {
}
Test.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
    },
    username: {
        type: sequelize_1.DataTypes.STRING(128),
        allowNull: false,
    },
    hobby: {
        type: sequelize_1.DataTypes.STRING(128),
    },
}, {
    tableName: "tests",
    sequelize: db_1.default,
});
Test.beforeCreate((test, options) => {
    test.hobby = "Football";
});
exports.default = Test;
