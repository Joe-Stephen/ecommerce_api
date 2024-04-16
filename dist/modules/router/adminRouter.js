"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminRouter = (0, express_1.Router)();
//admin functions
const adminController_1 = require("../admin/adminController");
const userController_1 = require("../user/userController");
//middlewares
const multerMiddleware_1 = __importDefault(require("../admin/multerMiddleware"));
const adminAuthentication_1 = __importDefault(require("../admin/adminAuthentication"));
const notificationController_1 = require("../notifications/notificationController");
//admin functionalities
adminRouter.post("/notify", adminAuthentication_1.default, 
/* #swagger.tags = ['Admin - Notification Service'] */ adminController_1.notifyUser);
adminRouter.post("/admin-login", /* #swagger.tags = ['Admin */ adminController_1.loginAdmin);
adminRouter.patch("/resetPassword", adminAuthentication_1.default, 
/* #swagger.tags = ['Admin */ userController_1.resetPassword);
adminRouter.post("/product", adminAuthentication_1.default, 
/* #swagger.tags = ['Admin - Product Management */ multerMiddleware_1.default.array("images"), adminController_1.addProduct);
adminRouter.post("/updateProduct", adminAuthentication_1.default /* #swagger.tags = ['Admin - Product Management */, multerMiddleware_1.default.array("images"), adminController_1.updateProduct);
adminRouter.get("/", adminAuthentication_1.default, 
/* #swagger.tags = ['Admin - User Management'] */ adminController_1.getAllUsers);
adminRouter.get("/orders", adminAuthentication_1.default, 
/* #swagger.tags = ['Admin - Order Management'] */ adminController_1.getAllOrders);
adminRouter.get("/salesReport", adminAuthentication_1.default, 
/* #swagger.tags = ['Admin - Report'] */ adminController_1.salesReport);
adminRouter.post("/orderStatus", adminAuthentication_1.default, 
/* #swagger.tags = ['Admin - Order Management'] */ adminController_1.updateOrderStatus);
adminRouter.patch("/approveOrder", 
/* #swagger.tags = ['Admin - Order Management'] */ adminController_1.approveOrder);
adminRouter.get("/getUser/:id", adminAuthentication_1.default, 
/* #swagger.tags = ['Admin - User Management'] */ adminController_1.getUserById);
adminRouter.patch("/toggleStatus", adminAuthentication_1.default, 
/* #swagger.tags = ['Admin - User Management'] */ adminController_1.toggleUserAccess);
adminRouter.patch("/notification", 
/* #swagger.tags = ['Admin - User Management'] */ notificationController_1.toggleStatus);
adminRouter.post("/notifyAll", 
/* #swagger.tags = ['Admin - Notification Service'] */ adminController_1.notifyAllUsers);
adminRouter.post("/notifySelected", 
/* #swagger.tags = ['Admin - Notification Service'] */ adminController_1.notifySelectedUsers);
adminRouter.delete("/:id", adminAuthentication_1.default, 
/* #swagger.tags = ['Admin - User Management'] */ adminController_1.deleteUser);
adminRouter.get("/repeatTask", adminAuthentication_1.default, 
/* #swagger.tags = ['Admin'] */ adminController_1.assignCronJob);
adminRouter.get("/testMailAutomation", adminAuthentication_1.default, 
/* #swagger.tags = ['Admin'] */ adminController_1.mailAutomation);
exports.default = adminRouter;
