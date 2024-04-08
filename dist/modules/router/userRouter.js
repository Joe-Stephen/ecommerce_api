"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userRouter = (0, express_1.Router)();
//user functions
const userController_1 = require("../user/userController");
//cart functions
const cartController_1 = require("../cart/cartController");
//order functions
const orderController_1 = require("../order/orderController");
//middlewares
const userAuthentication_1 = __importDefault(require("../user/userAuthentication"));
const notificationController_1 = require("../notifications/notificationController");
//user functionalities
userRouter.post("/login", /* #swagger.tags = ['User'] */ userController_1.loginUser);
userRouter.post("/sendOtp", /* #swagger.tags = ['User'] */ userController_1.sendVerifyMail);
userRouter.post("/verifyEmail", /* #swagger.tags = ['User'] */ userController_1.verifyOtp);
userRouter.post("/", /* #swagger.tags = ['User'] */ userController_1.createUser);
userRouter.patch("/resetPassword", 
/* #swagger.tags = ['User'] */ userAuthentication_1.default, userController_1.resetPassword);
userRouter.get("/products", /* #swagger.tags = ['User'] */ userController_1.getAllProducts);
userRouter.get("/notifications", 
/* #swagger.tags = ['User - Notifications'] */ userAuthentication_1.default, notificationController_1.getAllNotifications);
userRouter.put("/:id", /* #swagger.tags = ['User'] */ userAuthentication_1.default, userController_1.updateUser);
//cart functionalities
userRouter.get("/cart", 
/* #swagger.tags = ['User - Cart'] */ userAuthentication_1.default, cartController_1.getUserCart);
userRouter.post("/cart", 
/* #swagger.tags = ['User - Cart'] */ userAuthentication_1.default, cartController_1.addToCart);
userRouter.patch("/decreaseCartQuantity", 
/* #swagger.tags = ['User - Cart'] */ userAuthentication_1.default, cartController_1.decreaseCartQuantity);
userRouter.patch("/increaseCartQuantity", 
/* #swagger.tags = ['User - Cart'] */ userAuthentication_1.default, cartController_1.increaseCartQuantity);
userRouter.delete("/removeCartItem", 
/* #swagger.tags = ['User - Cart'] */ cartController_1.removeCartItem);
//order functionalities
userRouter.post("/checkOut", 
/* #swagger.tags = ['User - Order'] */ userAuthentication_1.default, orderController_1.checkOut);
userRouter.post("/cancelOrder", 
/* #swagger.tags = ['User - Order'] */ orderController_1.cancelOrder);
userRouter.patch("/editOrder", 
/* #swagger.tags = ['User - Order'] */ orderController_1.editOrder);
userRouter.get("/order", 
/* #swagger.tags = ['User - Order'] */ userAuthentication_1.default, orderController_1.orderStatus);
//test routes
userRouter.get("/moment", 
/* #swagger.tags = ['User - Test Routes'] */ userAuthentication_1.default, userController_1.getMyMoment);
exports.default = userRouter;
