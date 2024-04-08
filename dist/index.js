"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const express_1 = __importDefault(require("express"));
const userRouter_1 = __importDefault(require("./modules/router/userRouter"));
const db_1 = __importDefault(require("./modules/config/db"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const morgan_body_1 = __importDefault(require("morgan-body"));
const passport_1 = __importDefault(require("passport"));
const express_session_1 = __importDefault(require("express-session"));
require("./modules/services/passport");
//swagger imports
const swaggerUi = require("swagger-ui-express");
const swagger_output_json_1 = __importDefault(require("./swagger-output.json"));
//importing websocket modules
const socket_io_1 = require("socket.io");
//importing models
const userModel_1 = __importDefault(require("./modules/user/userModel"));
const imageModel_1 = __importDefault(require("./modules/product/imageModel"));
const productModel_1 = __importDefault(require("./modules/product/productModel"));
const cartModel_1 = __importDefault(require("./modules/cart/cartModel"));
const cartProductsModel_1 = __importDefault(require("./modules/cart/cartProductsModel"));
const orderModel_1 = __importDefault(require("./modules/order/orderModel"));
const orderProductsModel_1 = __importDefault(require("./modules/order/orderProductsModel"));
const adminRouter_1 = __importDefault(require("./modules/router/adminRouter"));
const cancelOrderModel_1 = __importDefault(require("./modules/order/cancelOrderModel"));
const notificationModel_1 = __importDefault(require("./modules/notifications/notificationModel"));
const orderHistoryModel_1 = __importDefault(require("./modules/order/orderHistoryModel"));
dotenv_1.default.config();
const PORT = 3000 || process.env.PORT;
const app = (0, express_1.default)();
//using middlewares
app.use((0, express_session_1.default)({ secret: process.env.JWT_SECRET, resave: false, saveUninitialized: true, cookie: { secure: false } }));
app.use(express_1.default.json());
app.use((0, cors_1.default)());
app.use(express_1.default.urlencoded({ extended: true }));
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
//hooking morganBody with express app
(0, morgan_body_1.default)(app);
// setting routers
app.use("/", userRouter_1.default);
app.use("/admin", adminRouter_1.default);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swagger_output_json_1.default));
//setting up server connection
const server = app.listen(PORT, () => {
    console.log(`Ecommerce Server is running on http://localhost:${PORT}`);
});
exports.io = new socket_io_1.Server(server);
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
// setting up web socket connection
// Handle incoming connections
exports.io.on("connection", (socket) => {
    console.log("Server 1: new web socket connection");
    console.log("Connection id :", socket.id);
    socket.emit("message", "Welcome to Server 1.");
    socket.emit("message", "Your web socket connection with Server 1 is now active.");
    socket.on("message", (message) => {
        console.log("Server 1 received message:", message);
    });
    socket.on("disconnect", () => {
        console.log("Server 1: web socket connection closed");
    });
    socket.on("close", () => {
        console.log("Server 1 is closing the web socket connection");
        socket.emit("message", "Your web socket connection with Server 1 is closing.");
        socket.disconnect(true);
    });
});
