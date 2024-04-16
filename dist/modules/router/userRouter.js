"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const passport_1 = __importDefault(require("passport"));
require("../services/passport");
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
//googel authentication routes
userRouter.get("/auth/googleLoign", 
/* #swagger.tags = ['User - Google Sign-in page'] */ userController_1.serveGoogleSignPage);
userRouter.get("/auth/google", 
/* #swagger.tags = ['User - Google Sign-in page'] */ passport_1.default.authenticate("google", { scope: ["email", "profile"] }));
userRouter.get("/auth/google/callback", 
/* #swagger.tags = ['User - Google Sign-in page'] */ passport_1.default.authenticate("google", {
    session: false,
    successRedirect: "/auth/google/success",
    failureRedirect: "/auth/google/failure",
}));
userRouter.get("/auth/google/success", (req, res) => {
    res.status(200).json({ message: "Auth is success!" });
});
userRouter.get("/auth/google/failure", (req, res) => {
    console.log("Auth is failure!");
    res.status(400).json({ message: "Auth is failure!" });
});
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
userRouter.post("/test", 
/* #swagger.tags = ['User - Test Routes'] */
userController_1.getMyMoment);
exports.default = userRouter;
