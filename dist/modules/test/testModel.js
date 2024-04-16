"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const db_1 = __importDefault(require("../config/db"));
const bcrypt_1 = __importDefault(require("bcrypt"));
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
    password: {
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
Test.afterCreate((test, options) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const password = test.password;
        //hashing password
        yield bcrypt_1.default
            .genSalt(10)
            .then((salt) => __awaiter(void 0, void 0, void 0, function* () {
            return bcrypt_1.default.hash(password, salt);
        }))
            .then((hash) => __awaiter(void 0, void 0, void 0, function* () {
            const hashedPassword = hash;
            test.password = hashedPassword;
        }))
            .catch((error) => {
            console.log("Error in test model (bcrypt) : ", error);
        });
    }
    catch (error) {
        console.log("Error in test model : ", error);
    }
}));
exports.default = Test;
