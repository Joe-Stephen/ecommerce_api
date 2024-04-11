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
exports.syncAndConnectDB = void 0;
const db_1 = __importDefault(require("../config/db"));
//importing models
const userModel_1 = __importDefault(require("../user/userModel"));
const imageModel_1 = __importDefault(require("../product/imageModel"));
const productModel_1 = __importDefault(require("../product/productModel"));
const cartModel_1 = __importDefault(require("../cart/cartModel"));
const cartProductsModel_1 = __importDefault(require("../cart/cartProductsModel"));
const orderModel_1 = __importDefault(require("../order/orderModel"));
const orderProductsModel_1 = __importDefault(require("../order/orderProductsModel"));
const cancelOrderModel_1 = __importDefault(require("../order/cancelOrderModel"));
const notificationModel_1 = __importDefault(require("../notifications/notificationModel"));
const orderHistoryModel_1 = __importDefault(require("../order/orderHistoryModel"));
const syncAndConnectDB = () => __awaiter(void 0, void 0, void 0, function* () {
    // associations
    //image associations
    imageModel_1.default.belongsTo(productModel_1.default, { foreignKey: "productId" });
    productModel_1.default.hasMany(imageModel_1.default, { foreignKey: "productId" });
    //cart associations
    cartModel_1.default.belongsTo(userModel_1.default, { foreignKey: "userId" });
    cartModel_1.default.belongsToMany(productModel_1.default, { through: cartProductsModel_1.default });
    productModel_1.default.belongsToMany(cartModel_1.default, { through: cartProductsModel_1.default });
    userModel_1.default.hasOne(cartModel_1.default, { foreignKey: "userId" });
    //order associations
    orderModel_1.default.belongsTo(userModel_1.default, { foreignKey: "userId" });
    orderModel_1.default.belongsToMany(productModel_1.default, { through: orderProductsModel_1.default });
    productModel_1.default.belongsToMany(orderModel_1.default, { through: orderProductsModel_1.default });
    userModel_1.default.hasMany(orderModel_1.default, { foreignKey: "userId" });
    orderModel_1.default.hasMany(orderProductsModel_1.default, { foreignKey: "orderId", as: "orderProducts" });
    //product with orderProducts
    productModel_1.default.hasMany(orderProductsModel_1.default, { foreignKey: "productId" });
    orderProductsModel_1.default.belongsTo(productModel_1.default, { foreignKey: "productId" });
    //cancel order associations
    cancelOrderModel_1.default.belongsTo(orderModel_1.default, { foreignKey: "orderId" });
    orderModel_1.default.hasOne(cancelOrderModel_1.default, { foreignKey: "orderId" });
    //notifications associations
    notificationModel_1.default.belongsTo(userModel_1.default, { foreignKey: "userId" });
    userModel_1.default.hasMany(notificationModel_1.default, { foreignKey: "userId" });
    //orderHistory associations
    orderModel_1.default.hasMany(orderHistoryModel_1.default, { foreignKey: "orderId" });
    orderHistoryModel_1.default.belongsTo(orderModel_1.default, { foreignKey: "orderId" });
    // syncing models and starting server
    db_1.default
        .sync({ force: false })
        // .sync({ force: false, alter:true })
        .then(() => {
        console.log("Models synchronized successfully.");
    })
        .catch((error) => {
        console.error("Error synchronizing models:", error);
    });
});
exports.syncAndConnectDB = syncAndConnectDB;
